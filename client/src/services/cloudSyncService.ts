import mqtt, { MqttClient } from 'mqtt';
import { AuditItem, OrderHistoryEntry } from '../types';
import { storageService } from './storage';

export interface AuditsSyncMessage {
  type: 'AUDITS_UPDATE' | 'AUDITS_CLEAR' | 'PRODUCTS_UPDATE' | 'PING' | 'PONG' | 'BACKUP_DATA' | 'REQUEST_RESTORE' | 'RESTORE_DATA';
  senderId: string;
  senderRole: 'WORKER' | 'ADMIN';
  storeId: string;
  timestamp: number;
  audits: AuditItem[];
  data?: any;
}

export type SyncStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

type SyncListener = (audits: AuditItem[], message: AuditsSyncMessage) => void;
type StatusListener = (status: SyncStatus, lastSyncTime?: string) => void;
type VoidListener = () => void;
type AuthListener = (workers: any[]) => void;
type HistoryListener = (history: OrderHistoryEntry[]) => void;

class CloudSyncService {
  private client: MqttClient | null = null;
  private currentStoreId: string = '1060';
  private mySenderId: string = '';
  private authListeners: Set<AuthListener> = new Set();
  private syncListeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private clearListeners: Set<VoidListener> = new Set();
  private productsUpdateListeners: Set<VoidListener> = new Set();
  private historyListeners: Set<HistoryListener> = new Set();
  private connectionStatus: SyncStatus = 'DISCONNECTED';
  private lastSyncTime: string = '';
  private pingResolvers: Set<(val: boolean) => void> = new Set();
  private pendingAuditsPayload: AuditsSyncMessage | null = null;

  constructor() {
    let id = '';
    try {
      id = sessionStorage.getItem('albagom_device_id') || '';
      if (!id) {
        id = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        sessionStorage.setItem('albagom_device_id', id);
      }
    } catch {
      id = `dev_${Math.random().toString(36).substring(2, 9)}`;
    }
    this.mySenderId = id;
  }

  public getSenderId(): string {
    return this.mySenderId;
  }

  public getStatus(): SyncStatus {
    return this.connectionStatus;
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  public onAuthUpdate(listener: AuthListener) {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  public onSync(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  public onClearCommand(listener: VoidListener): () => void {
    this.clearListeners.add(listener);
    return () => this.clearListeners.delete(listener);
  }

  public onProductsUpdate(listener: VoidListener): () => void {
    this.productsUpdateListeners.add(listener);
    return () => this.productsUpdateListeners.delete(listener);
  }

  public onHistoryUpdate(listener: HistoryListener): () => void {
    this.historyListeners.add(listener);
    return () => this.historyListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus, this.lastSyncTime);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(status: SyncStatus) {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => listener(status, this.lastSyncTime));
  }

  private notifySync(audits: AuditItem[], message: AuditsSyncMessage) {
    this.lastSyncTime = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.notifyStatus('CONNECTED');
    this.syncListeners.forEach((listener) => listener(audits, message));
  }

  public connect(storeId?: string, role: 'WORKER' | 'ADMIN' = 'WORKER') {
    const targetStoreId = storeId || storageService.getSettings().younmeId || '1060';
    this.currentStoreId = targetStoreId;

    if (this.client && this.client.connected) {
      return;
    }

    this.notifyStatus('CONNECTING');

    const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    const clientId = `web_${role.toLowerCase()}_${this.mySenderId}_${Math.random().toString(16).substring(2, 6)}`;

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 4000,
      });

      this.client.on('connect', () => {
        this.notifyStatus('CONNECTED');
        this.client?.subscribe(topicSync, { qos: 1 });
        this.client?.subscribe(`albagom-v2/stores/store_${this.currentStoreId}/products_sync`, { qos: 1 });
        this.client?.subscribe(`albagom-v2/sync/store_${this.currentStoreId}/history`, { qos: 1 });
        this.client?.subscribe(`albagom-v2/sync/store_${this.currentStoreId}/auth`, { qos: 1 }, (err) => {
          if (err) {
            console.error('[CloudSync] 토픽 구독 실패:', err);
            this.notifyStatus('ERROR');
          }
        });

        if (this.pendingAuditsPayload) {
          const payloadToSend = JSON.stringify(this.pendingAuditsPayload);
          this.client?.publish(topicSync, payloadToSend, { qos: 1, retain: true }, (err) => {
            if (!err) {
              console.log('[CloudSync] 대기 중이던 실사 데이터 자동 전송 완료!');
              this.pendingAuditsPayload = null;
            }
          });
        }
      });

      this.client.on('message', (topic, payload) => {
        const authTopic = `albagom-v2/sync/store_${this.currentStoreId}/auth`;
        const prodTopic = `albagom-v2/stores/store_${this.currentStoreId}/products_sync`;
        if (topic === prodTopic) {
          try {
            const msg = JSON.parse(payload.toString());
            if (msg.data && msg.data.products && msg.senderId !== this.mySenderId) {
              storageService.saveProducts(msg.data.products);
              this.productsUpdateListeners.forEach(l => l());
            }
          } catch (e) {
            console.error('Products sync parse error:', e);
          }
          return;
        }

        if (topic === authTopic) {
          try {
            const workers = JSON.parse(payload.toString());
            this.authListeners.forEach(l => l(workers));
          } catch (e) {
            console.error('Auth parse error:', e);
          }
          return;
        }

        const histTopic = `albagom-v2/sync/store_${this.currentStoreId}/history`;
        if (topic === histTopic) {
          try {
            const histData = JSON.parse(payload.toString());
            const list = Array.isArray(histData) ? histData : (histData.history || []);
            if (Array.isArray(list)) {
              storageService.saveOrderHistory(list, false);
              this.historyListeners.forEach(l => l(list));
            }
          } catch (e) {
            console.error('History parse error:', e);
          }
          return;
        }

        if (topic !== topicSync) return;
        try {
          const msg: AuditsSyncMessage = JSON.parse(payload.toString());
          if (msg.senderId === this.mySenderId) {
            return;
          }

          if (msg.type === 'PONG') {
            this.pingResolvers.forEach((res) => res(true));
            this.pingResolvers.clear();
            return;
          }

          if (msg.type === 'RESTORE_DATA' && msg.data) {
            if (msg.data.products) storageService.saveProducts(msg.data.products);
            if (msg.data.settings) storageService.saveSettings(msg.data.settings);
            if (msg.data.aliases) storageService.saveAliases(msg.data.aliases);
            if (msg.data.orderHistory) storageService.saveOrderHistory(msg.data.orderHistory);
            this.productsUpdateListeners.forEach((l) => l());
            alert('봇으로부터 백업 데이터를 성공적으로 복원했습니다!');
            /* reload prevented */
          } else if (msg.type === 'PRODUCTS_UPDATE') {
            this.productsUpdateListeners.forEach((l) => l());
          } else if (msg.type === 'AUDITS_UPDATE') {
            let lastClearedAt = 0;
            try { lastClearedAt = parseInt(localStorage.getItem('albagom_last_cleared_at') || '0', 10); } catch(e){}
            if (msg.timestamp && lastClearedAt > 0 && (lastClearedAt - msg.timestamp > 60 * 60 * 1000)) {
              console.log('[CloudSync] 무시됨: 1시간 이상 과거의 이전 세션 실사 업데이트');
              return;
            }
            // 최신 전송된 메시지(msg.timestamp >= lastClearedAt)의 실사는 과거 ID를 현재로 갱신하여 안전하게 유지
            const validAudits = (msg.audits || []).map((a: any, idx: number) => {
              const auditTime = parseInt(a.id, 10);
              if (!isNaN(auditTime) && auditTime < lastClearedAt) {
                return { ...a, id: ((msg.timestamp || Date.now()) + idx).toString() };
              }
              return a;
            });
            storageService.saveAudits(validAudits);
            this.notifySync(validAudits, msg);
          } else if (msg.type === 'AUDITS_CLEAR') {
            const clearedAt = (msg as any).clearedAt || msg.timestamp || Date.now();
            try { localStorage.setItem('albagom_last_cleared_at', clearedAt.toString()); } catch(e){}
            storageService.clearAudits();
            this.clearListeners.forEach((l) => l());
            this.notifySync([], msg);
          }
        } catch (e) {
          console.error('[CloudSync] 메시지 수신 파싱 오류:', e);
        }
      });

      this.client.on('error', (err) => {
        console.error('[CloudSync] 클라이언트 오류:', err);
        this.notifyStatus('ERROR');
      });

      this.client.on('offline', () => {
        this.notifyStatus('DISCONNECTED');
      });

      this.client.on('reconnect', () => {
        this.notifyStatus('CONNECTING');
      });
    } catch (err) {
      console.error('[CloudSync] 연결 시도 오류:', err);
      this.notifyStatus('ERROR');
    }
  }

  
  public checkBotAlive(timeoutMs = 3000): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }
      
      const timeout = setTimeout(() => {
        this.pingResolvers.delete(resolve);
        resolve(false);
      }, timeoutMs);
      
      this.pingResolvers.add((val) => {
        clearTimeout(timeout);
        this.pingResolvers.delete(resolve);
        resolve(val);
      });
      
      const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
      const payload = {
        type: 'PING',
        senderId: this.mySenderId,
        senderRole: 'WORKER',
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
      };
      
      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1 });
    });
  }

  public broadcastAudits(audits: AuditItem[], role: 'WORKER' | 'ADMIN' = 'WORKER'): Promise<boolean> {
    return new Promise((resolve) => {
      const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;

      const payload: AuditsSyncMessage = {
        type: 'AUDITS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits,
      };

      this.lastSyncTime = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      this.notifyStatus('CONNECTED');

      this.pendingAuditsPayload = payload;

      // PC 로컬 봇 서버(localhost:3001)에도 직접 보존 (PC 브라우저인 경우)
      try {
        if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
          fetch('http://localhost:3001/api/audits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audits, senderId: this.mySenderId, senderRole: role }),
          }).catch(() => {});
        }
      } catch(e) {}

      if (!this.client || !this.client.connected) {
        this.connect(this.currentStoreId, role);
        let attempts = 0;
        const timer = setInterval(() => {
          attempts++;
          if (this.client && this.client.connected) {
            clearInterval(timer);
            this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
              if (!err) this.pendingAuditsPayload = null;
              resolve(!err);
            });
          } else if (attempts >= 25) { // 5초 대기
            clearInterval(timer);
            console.warn('[CloudSync] 연결 지연 - 연결 완료 시 자동 전송 대기열에 보관됨');
            resolve(false);
          }
        }, 200);
        return;
      }

      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error('[CloudSync] 발행 실패:', err);
          resolve(false);
        } else {
          this.pendingAuditsPayload = null;
          resolve(true);
        }
      });
    });
  }

    public broadcastBackup(): void {
    if (!this.client || !this.client.connected) return;
    const topicSync = 'albagom-v2/stores/store_' + this.currentStoreId + '/audits_sync';
    const payload = {
      type: 'BACKUP_DATA',
      senderId: this.mySenderId,
      senderRole: 'ADMIN',
      storeId: this.currentStoreId,
      timestamp: Date.now(),
      audits: storageService.getAudits(),
      data: {
        products: storageService.getProducts(),
        settings: storageService.getSettings(),
        aliases: storageService.getAliases(),
        orderHistory: storageService.getOrderHistory(),
      }
    };
    this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: false });
  }

  public requestRestore(): void {
    if (!this.client || !this.client.connected) return;
    const topicSync = 'albagom-v2/stores/store_' + this.currentStoreId + '/audits_sync';
    const payload = {
      type: 'REQUEST_RESTORE',
      senderId: this.mySenderId,
      senderRole: 'ADMIN',
      storeId: this.currentStoreId,
      timestamp: Date.now(),
      audits: [],
    };
    this.client.publish(topicSync, JSON.stringify(payload), { qos: 1 });
  }

  public broadcastProductsUpdate(role: 'WORKER' | 'ADMIN' = 'ADMIN'): Promise<boolean> {
    return new Promise((resolve) => {
      const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
      const prodTopic = `albagom-v2/stores/store_${this.currentStoreId}/products_sync`;

      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }

      // 1. Publish actual master products list with retain to products_sync
      try {
        const products = storageService.getProducts();
        this.client.publish(prodTopic, JSON.stringify({
          senderId: this.mySenderId,
          data: { products },
          timestamp: Date.now(),
        }), { qos: 1, retain: true });
      } catch (e) {
        console.error('[CloudSync] products_sync 발행 오류:', e);
      }

      // 2. Also notify via audits_sync without retain so real audits are not wiped
      const payload: AuditsSyncMessage = {
        type: 'PRODUCTS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: storageService.getAudits(),
      };

      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: false }, (err) => {
        if (err) {
          console.error('[CloudSync] 상품 업데이트 발행 실패:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public broadcastClear(role: 'WORKER' | 'ADMIN' = 'ADMIN'): Promise<boolean> {
    return new Promise((resolve) => {
      const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
      const clearedAt = Date.now();
      try { localStorage.setItem('albagom_last_cleared_at', clearedAt.toString()); } catch(e){}
      const payload: any = {
        type: 'AUDITS_CLEAR',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: clearedAt,
        clearedAt: clearedAt,
        audits: [],
      };

      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }

      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error('[CloudSync] 초기화 발행 실패:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public publishAuthList(workers: any[]) {
    if (!this.client || !this.client.connected) return;
    const topic = `albagom-v2/sync/store_${this.currentStoreId}/auth`;
    this.client.publish(topic, JSON.stringify(workers), { retain: true });
  }

  public broadcastOrderHistory(history: OrderHistoryEntry[]) {
    if (!this.client || !this.client.connected) return;
    const topic = `albagom-v2/sync/store_${this.currentStoreId}/history`;
    this.client.publish(topic, JSON.stringify(history), { retain: true });
  }


  public publishSettings(settings: any) {
    if (!this.client || !this.client.connected) return;
    const topic = `albagom-v2/sync/store_${this.currentStoreId}/settings`;
    this.client.publish(topic, JSON.stringify(settings), { retain: true });
  }

  public requestAutoOrderEvaluation(audits: any[], workerName: string, category: string) {
    if (!this.client || !this.client.connected) return;
    const topic = `albagom-v2/sync/store_${this.currentStoreId}/auto_order_eval`;
    this.client.publish(topic, JSON.stringify({ audits, workerName, category }), { qos: 1 });
  }

  public disconnect() {
    if (this.client) {
      try {
        this.client.end();
      } catch {}
      this.client = null;
    }
    this.notifyStatus('DISCONNECTED');
  }
}

export const cloudSyncService = new CloudSyncService();