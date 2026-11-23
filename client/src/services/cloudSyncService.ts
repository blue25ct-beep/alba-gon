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
  tombstones?: Record<string, number>;
  clearedAt?: number;
  data?: any;
  subType?: string;
  orderedBarcodes?: string[];
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
  private currentRole: 'WORKER' | 'ADMIN' = 'WORKER';

  constructor() {
    let id = '';
    try {
      id = localStorage.getItem('albagom_device_id') || '';
      if (!id) {
        id = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem('albagom_device_id', id);
      }
    } catch {
      id = `dev_${Math.random().toString(36).substring(2, 9)}`;
    }
    this.mySenderId = id;

    // iOS Safari / 모바일 브라우저 백그라운드 복귀 및 화면 켜짐 시 강제 재연결 및 상태 점검
    if (typeof window !== 'undefined') {
      const handleWakeup = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          console.log('[CloudSync] 화면 활성화/온라인 감지 - 실시간 연결 및 최신 상태 강제 동기화');
          if (!this.client || !this.client.connected) {
            this.reconnect();
          } else {
            // 모바일 백그라운드 중 놓친 retained 메시지 즉시 재수신
            this.resyncRetainedState();
          }
        }
      };
      document.addEventListener('visibilitychange', handleWakeup);
      window.addEventListener('pageshow', handleWakeup);
      window.addEventListener('online', handleWakeup);
    }
  }

  public resyncRetainedState() {
    if (!this.client || !this.client.connected) {
      this.reconnect();
      return;
    }
    const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
    this.client.unsubscribe(topicSync, () => {
      this.client?.subscribe(topicSync, { qos: 1 });
    });
  }

  public reconnect() {
    this.disconnect();
    this.connect(this.currentStoreId, this.currentRole);
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
    this.currentRole = role;
    const targetStoreId = storeId || storageService.getSettings().younmeId || '1060';
    this.currentStoreId = targetStoreId;

    if (this.client && this.client.connected) {
      return;
    }

    if (this.client) {
      try { this.client.end(true); } catch(e) {}
      this.client = null;
    }

    this.notifyStatus('CONNECTING');

    const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    const clientId = `web_${role.toLowerCase()}_${this.mySenderId}_${Math.random().toString(16).substring(2, 6)}`;

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 6000,
        reconnectPeriod: 2000,
        keepalive: 15, // 모바일 망 끊김 감지 및 방지용 15초 keepalive
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
            if (msg.senderId === this.mySenderId) return;
            const prodList = Array.isArray(msg.patch)
              ? msg.patch
              : (msg.data?.products || (Array.isArray(msg) ? msg : null));
            if (prodList && Array.isArray(prodList)) {
              const local = storageService.getProducts();
              const customized = storageService.getCustomizedSettings();
              const map = new Map();
              local.forEach((p) => map.set(p.barcode, p));
              prodList.forEach((p: any) => {
                const ex = map.get(p.barcode);
                const c = customized[p.barcode];
                const exIsCp = ex?.name && (ex.name.startsWith('CP]') || ex.name.includes('쿠팡]'));
                const pIsCp = p.name && (p.name.startsWith('CP]') || p.name.includes('쿠팡]'));
                const baseName = (exIsCp && !pIsCp) ? ex.name : (p.name || ex?.name);
                const base = ex ? { ...p, ...ex, name: baseName } : p;
                if (c) {
                  map.set(p.barcode, {
                    ...base,
                    name: (c.name && c.name.trim()) ? c.name : base.name,
                    targetStock: c.targetStock !== undefined ? c.targetStock : base.targetStock,
                    minOrderQty: c.minOrderQty !== undefined ? c.minOrderQty : base.minOrderQty,
                    reviewStatus: c.reviewStatus || base.reviewStatus,
                    updatedAt: c.updatedAt || base.updatedAt,
                  });
                } else {
                  map.set(p.barcode, base);
                }
              });
              const merged = Array.from(map.values());
              storageService.saveProducts(merged, false);
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
          if (msg.senderId === this.mySenderId || (msg.senderId === 'REST_API' && msg.subType !== 'FORCE_RESTORE')) {
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
            const localClearedBefore = storageService.getLastClearedAt();
            const remoteClearedAt = typeof msg.clearedAt === 'number' ? msg.clearedAt : 0;
            const effectiveClearedAt = storageService.mergeLastClearedAt(remoteClearedAt);
            if (msg.timestamp && localClearedBefore > 0 && msg.timestamp < localClearedBefore - 5000 && remoteClearedAt < localClearedBefore) {
              console.log('[CloudSync] 무시됨: 로컬 목록 비우기 이전 시각의 구형 실사 메시지');
              // 상대 기기가 구형 상태를 들고 있으므로 최신 빈 상태/초기화 상태를 다시 전파
              this.broadcastAudits(storageService.getAudits(), this.currentRole);
              return;
            }
            const validAudits = (msg.audits || []).map((a: any) => {
              let itemObj = { ...a };
              if (itemObj.barcode === '8806016310018' || itemObj.barcode === '8801128503211') {
                itemObj.vendor = 'younme';
                itemObj.category = '상온';
              }
              // 미등록 상품 자동 마스터 복원 및 점장님 설정 목표재고/발주단위 최우선 보존
              const { product } = storageService.findProduct(itemObj.barcode);
              if (product && product.name && product.name !== '미등록 상품') {
                return {
                  ...itemObj,
                  productName: product.name,
                  isUnmapped: false,
                  targetStock: (product.targetStock !== undefined && product.targetStock !== null)
                    ? product.targetStock
                    : (itemObj.targetStock || 1),
                  minOrderQty: (product.minOrderQty !== undefined && product.minOrderQty !== null)
                    ? product.minOrderQty
                    : (itemObj.minOrderQty || 1),
                };
              }
              return itemObj;
            });
            // 발주 완료 정리 메시지인 경우: 발주 성공 품목만 안전하게 제거
            if (msg.subType === 'ORDER_COMPLETED' && Array.isArray(msg.orderedBarcodes)) {
              const orderedSet = new Set(msg.orderedBarcodes);
              const current = storageService.getAudits();
              const remaining = current.filter((a: any) => !orderedSet.has(a.barcode));
              msg.orderedBarcodes.forEach((b: string) => storageService.recordDeletedTombstone(b));
              storageService.saveAudits(remaining);
              this.notifySync(remaining, msg);
              return;
            }

            // 근무자폰 최우선 + 삭제 기록(tombstones) + 전체 비우기 시각(clearedAt) 통합 병합
            const isWorkerDevice = this.currentRole === 'WORKER';
            const isIncomingFromWorker = msg.senderRole === 'WORKER';
            const mergedAudits = storageService.mergeAudits(
              validAudits,
              isWorkerDevice,
              isIncomingFromWorker,
              msg.tombstones,
              remoteClearedAt
            );
            this.notifySync(mergedAudits, msg);

            // 병합 결과가 원격 메시지와 실질적으로 다를 때만(근무자폰 보존 항목이나 더 최신 삭제/초기화가 있을 때) 1회 재전파하여 모든 기기 수렴
            const toSig = (arr: AuditItem[]) =>
              arr
                .map((a) => `${a.barcode}:${a.id}:${a.stockCount}`)
                .sort()
                .join('|');
            const remoteFilteredSig = toSig(validAudits);
            const mergedSig = toSig(mergedAudits);
            const localTombstones = storageService.getDeletedTombstones();
            const remoteTombstones = msg.tombstones || {};
            const hasNewerTombstone = Object.entries(localTombstones).some(
              ([bc, ts]) => ts > (remoteTombstones[bc] || 0)
            );
            const hasNewerClear = effectiveClearedAt > remoteClearedAt;

            if (mergedSig !== remoteFilteredSig || hasNewerTombstone || hasNewerClear) {
              console.log(`[CloudSync] 상태 차이 감지(${this.currentRole}) -> 통합 최신 상태 재동기화 (${validAudits.length}건 -> ${mergedAudits.length}건)`);
              this.broadcastAudits(mergedAudits, this.currentRole);
            }
          } else if (msg.type === 'AUDITS_CLEAR') {
            const clearedAt = storageService.mergeLastClearedAt((msg as any).clearedAt || msg.timestamp || Date.now());
            const local = storageService.getAudits();
            const newerItems = local.filter((a) => (parseInt(a.id, 10) || 0) > clearedAt);
            if (newerItems.length > 0) {
              storageService.saveAudits(newerItems);
              this.notifySync(newerItems, msg);
              this.broadcastAudits(newerItems, this.currentRole);
              return;
            }
            storageService.clearAudits('REMOTE_CLEAR', false);
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

      let safeAudits = audits;
      try {
        if (JSON.stringify(audits).length > 90000) {
          safeAudits = audits.map(a => a.photoUrls && a.photoUrls.length > 1 ? { ...a, photoUrls: [a.photoUrls[0]] } : a);
          if (JSON.stringify(safeAudits).length > 120000) {
            safeAudits = safeAudits.map(a => a.photoUrls && a.photoUrls.length > 0 ? { ...a, photoUrls: [] } : a);
          }
        }
      } catch (e) {}

      const tombstones = storageService.getDeletedTombstones();
      const clearedAt = storageService.getLastClearedAt();
      const payload: AuditsSyncMessage = {
        type: 'AUDITS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: safeAudits,
        tombstones,
        clearedAt,
      };

      this.pendingAuditsPayload = payload;

      // PC 로컬 봇 서버(localhost:3001)에도 직접 보존 (PC 브라우저인 경우)
      try {
        if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
          fetch('http://localhost:3001/api/audits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audits, tombstones, clearedAt, senderId: this.mySenderId, senderRole: role }),
          }).catch(() => {});
        }
      } catch(e) {}

      const doPublish = (c: MqttClient) => {
        let finished = false;
        const publishTimeout = setTimeout(() => {
          if (!finished) {
            finished = true;
            console.warn('[CloudSync] 발행 응답 지연(좀비 소켓 의심) - 소켓 재연결 시도');
            this.reconnect();
            resolve(false);
          }
        }, 6000);

        c.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
          if (!finished) {
            finished = true;
            clearTimeout(publishTimeout);
            if (err) {
              console.error('[CloudSync] 발행 실패:', err);
              resolve(false);
            } else {
              this.pendingAuditsPayload = null;
              this.lastSyncTime = new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              this.notifyStatus('CONNECTED');
              resolve(true);
            }
          }
        });
      };

      if (!this.client || !this.client.connected) {
        this.connect(this.currentStoreId, role);
        let attempts = 0;
        const timer = setInterval(() => {
          attempts++;
          if (this.client && this.client.connected) {
            clearInterval(timer);
            doPublish(this.client);
          } else if (attempts >= 25) { // 5초 대기
            clearInterval(timer);
            console.warn('[CloudSync] 연결 지연 - 연결 완료 시 자동 전송 대기열에 보관됨');
            resolve(false);
          }
        }, 200);
        return;
      }

      doPublish(this.client);
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

  public broadcastProductsUpdate(role: 'WORKER' | 'ADMIN' = 'ADMIN', changedProducts?: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      const topicSync = `albagom-v2/stores/store_${this.currentStoreId}/audits_sync`;
      const prodTopic = `albagom-v2/stores/store_${this.currentStoreId}/products_sync`;

      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }

      // 1. 변경된 상품이 지정된 경우 초경량 패치(~250B)로 즉시 발행 (공용 MQTT 브로커 패킷 크기 제한 우회)
      try {
        if (Array.isArray(changedProducts) && changedProducts.length > 0 && changedProducts.length <= 50) {
          this.client.publish(prodTopic, JSON.stringify({
            senderId: this.mySenderId,
            patch: changedProducts,
            timestamp: Date.now(),
          }), { qos: 1, retain: false });
        } else {
          // 전체 동기화 시에도 400KB 초과 패킷 손실 방지를 위해 최근 수정된(updatedAt/reviewStatus) 상품 위주 패치 전송
          const products = storageService.getProducts();
          const recentlyEdited = products.filter((p) => p.updatedAt || p.reviewStatus);
          if (recentlyEdited.length > 0 && recentlyEdited.length <= 200) {
            this.client.publish(prodTopic, JSON.stringify({
              senderId: this.mySenderId,
              patch: recentlyEdited,
              timestamp: Date.now(),
            }), { qos: 1, retain: false });
          } else {
            this.client.publish(prodTopic, JSON.stringify({
              senderId: this.mySenderId,
              data: { products },
              timestamp: Date.now(),
            }), { qos: 1, retain: true });
          }
        }
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
      const payload: AuditsSyncMessage = {
        type: 'AUDITS_CLEAR',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: clearedAt,
        clearedAt: clearedAt,
        tombstones: storageService.getDeletedTombstones(),
        audits: [],
      };

      this.pendingAuditsPayload = payload;

      if (!this.client || !this.client.connected) {
        this.connect(this.currentStoreId, role);
        resolve(false);
        return;
      }

      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error('[CloudSync] 초기화 발행 실패:', err);
          resolve(false);
        } else {
          this.pendingAuditsPayload = null;
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