
function updateEnvFile(key, value) {
  const envPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env')
  ];
  for (const envPath of envPaths) {
    try {
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content = content ? `${content.trim()}\n${key}=${value}\n` : `${key}=${value}\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    } catch (e) {}
  }
}
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');

// 유앤미 주문 처리 엔진
const { runDirectOrderAdd } = require('./orderEngine');
// 생필체인 주문 처리 엔진
const { runSpchainOrder } = require('./spchainEngine');

const STORE_ID = process.env.YOUNME_USER_ID || '1060';
const SPCHAIN_ID = 'SPCHAIN_047458';

const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';

const TOPIC_REQ_YOUNME = `albagom-v2/orders/store_${STORE_ID}/request`;
const TOPIC_RES_YOUNME = `albagom-v2/orders/store_${STORE_ID}/response`;
const TOPIC_PROGRESS_YOUNME = `albagom-v2/orders/store_${STORE_ID}/progress`;

const TOPIC_REQ_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/request`;
const TOPIC_RES_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/response`;
const TOPIC_PROGRESS_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/progress`;

const TOPIC_AUTH_1060 = `albagom-v2/sync/store_1060/auth`;
const AUTH_BACKUP_FILE = path.join(__dirname, '..', 'auth_backup.json');

const TOPIC_SYNC_1060 = `albagom-v2/stores/store_1060/audits_sync`;
const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'audits_backup.json');

const TOPIC_PROD_1060 = `albagom-v2/stores/store_1060/products_sync`;
const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'products_backup.json');

const TOPIC_SETTINGS_1060 = `albagom-v2/sync/store_1060/settings`;
const SETTINGS_BACKUP_FILE = path.join(__dirname, '..', 'settings_backup.json');

const TOPIC_HISTORY_1060 = `albagom-v2/sync/store_1060/history`;
const HISTORY_BACKUP_FILE = path.join(__dirname, '..', 'order_history_backup.json');

const TOPIC_AUTO_ORDER_1060 = `albagom-v2/sync/store_1060/auto_order_eval`;

const DEFAULT_DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';

function getOrderHistoryFromDisk() {
  try {
    if (fs.existsSync(HISTORY_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_BACKUP_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.history)) return data.history;
    }
  } catch (e) {
    console.error('[PC 저장소] 발주 내역 파일 읽기 오류:', e.message);
  }
  return [];
}

function saveOrderHistoryToDisk(history) {
  try {
    const list = Array.isArray(history) ? history : [];
    if (fs.existsSync(HISTORY_BACKUP_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(HISTORY_BACKUP_FILE, 'utf8'));
        if (JSON.stringify(existing) === JSON.stringify(list)) {
          return true;
        }
      } catch (e) {}
    }
    fs.writeFileSync(HISTORY_BACKUP_FILE, JSON.stringify(list, null, 2), 'utf8');
    console.log(`[PC 저장소] 발주 내역 총 ${list.length}건 PC 하드디스크에 영구 저장 완료!`);
    return true;
  } catch (e) {
    console.error('[PC 저장소] 발주 내역 파일 쓰기 오류:', e.message);
    return false;
  }
}

function removeSuccessfulAuditsFromDiskAndSync(barcodes) {
  try {
    if (!barcodes || barcodes.length === 0) return;
    if (fs.existsSync(AUDITS_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'));
      let audits = data.audits || (Array.isArray(data) ? data : []);
      const barcodeSet = new Set(barcodes);
      const remaining = audits.filter(a => !barcodeSet.has(a.barcode));
      const payload = {
        type: 'AUDITS_UPDATE',
        subType: 'ORDER_COMPLETED',
        orderedBarcodes: barcodes,
        senderId: 'BOT_ORDER_SUCCESS',
        senderRole: 'ADMIN',
        storeId: '1060',
        timestamp: Date.now(),
        audits: remaining
      };
      fs.writeFileSync(AUDITS_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf8');
      if (client && client.connected) {
        client.publish(TOPIC_SYNC_1060, JSON.stringify(payload), { retain: true });
      }
      console.log(`🧹 [실사 목록 정리] 발주 완료 품목 ${barcodes.length}건 제거 완료 (남은 실사: ${remaining.length}건)`);
    }
  } catch (err) {
    console.error('실사 목록 정리 중 오류:', err.message);
  }
}

function addOrderHistoryEntry(entry) {
  const current = getOrderHistoryFromDisk();
  const existingIdx = current.findIndex(h => h.id === entry.id);
  if (existingIdx >= 0) {
    current[existingIdx] = entry;
  } else {
    current.unshift(entry);
  }
  const trimmed = current.slice(0, 500);
  saveOrderHistoryToDisk(trimmed);
  if (client && client.connected) {
    client.publish(TOPIC_HISTORY_1060, JSON.stringify(trimmed), { retain: true });
  }
  return trimmed;
}

function getDiscordWebhookUrl() {
  try {
    if (fs.existsSync(SETTINGS_BACKUP_FILE)) {
      const s = JSON.parse(fs.readFileSync(SETTINGS_BACKUP_FILE, 'utf8'));
      if (s.discordWebhookUrl) return s.discordWebhookUrl;
    }
  } catch (e) {}
  return process.env.DISCORD_WEBHOOK_URL || DEFAULT_DISCORD_WEBHOOK;
}

function sendDiscord(message) {
  const url = getDiscordWebhookUrl();
  if (!url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  }).catch(err => console.error('[디스코드 알림 오류]:', err.message));
}

function getMasterProducts() {
  try {
    if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
      if (data && Array.isArray(data.products) && data.products.length > 0) return data.products;
    }
  } catch (e) {}

  try {
    return require('../../client/src/data/seedProducts.json');
  } catch (e) {
    return [];
  }
}

console.log('========================================================');
console.log('  [편의점 알바곤] 통합 클라우드 실시간 자동발주 봇 (V2)');
console.log(`  유앤미 매장 계정: ${STORE_ID}`);
console.log(`  생필체인 계정: ${SPCHAIN_ID}`);
console.log('  연결 브로커: EMQX (wss://broker.emqx.io:8084/mqtt)');
console.log('========================================================\n');

console.log('[1/2] EMQX 브로커에 연결 중...');
const client = mqtt.connect(BROKER_URL, {
  clientId: `alba_bot_${STORE_ID}_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log('[2/2] 브로커 연결 성공! 주문 신호 및 데이터 대기 중...\n');
  client.subscribe([
    TOPIC_REQ_YOUNME,
    TOPIC_REQ_SPCHAIN,
    TOPIC_AUTH_1060,
    TOPIC_SYNC_1060,
    TOPIC_PROD_1060,
    TOPIC_SETTINGS_1060,
    TOPIC_AUTO_ORDER_1060,
    TOPIC_HISTORY_1060,
  ]);
  
  // 봇 재시작 시, 혹은 클라우드 리셋 시 백업된 데이터로 강제 복구
  try {
    let restored = false;
    if (fs.existsSync(AUTH_BACKUP_FILE)) {
      client.publish(TOPIC_AUTH_1060, fs.readFileSync(AUTH_BACKUP_FILE, 'utf8'), { retain: true });
      restored = true;
    }
    if (fs.existsSync(AUDITS_BACKUP_FILE)) {
      client.publish(TOPIC_SYNC_1060, fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'), { retain: true });
      restored = true;
    }
    if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
      try {
        const pRaw = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
        const pList = Array.isArray(pRaw) ? pRaw : (pRaw.products || []);
        client.publish(TOPIC_PROD_1060, JSON.stringify({
          senderId: 'BOT_INIT',
          timestamp: Date.now(),
          data: { products: pList }
        }), { retain: true });
        restored = true;
      } catch(e) {}
    }
    if (fs.existsSync(HISTORY_BACKUP_FILE)) {
      client.publish(TOPIC_HISTORY_1060, fs.readFileSync(HISTORY_BACKUP_FILE, 'utf8'), { retain: true });
      restored = true;
    }
    if (restored) console.log('[백업 시스템] 클라우드 데이터 복구 완료 (근무자/실사/상품/발주내역 유지)');
  } catch(e) {}
});

client.on('message', async (topic, message) => {
  // 1. PING/PONG 및 백업 동기화
  if (topic === TOPIC_SYNC_1060) {
    try {
      const msg = JSON.parse(message.toString());
      if (msg.type === 'PING') {
        const pongPayload = JSON.stringify({
          type: 'PONG',
          senderId: 'BOT_SERVER',
          senderRole: 'ADMIN',
          storeId: '1060',
          timestamp: Date.now(),
          audits: [],
        });
        client.publish(TOPIC_SYNC_1060, pongPayload, { qos: 1 });
        return;
      }
      if (msg.type === 'AUDITS_UPDATE') {
        fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8');
        try {
          const dateStr = new Date().toISOString().slice(0, 10);
          const archiveFile = path.join(__dirname, '..', `audits_archive_${dateStr}.json`);
          fs.writeFileSync(archiveFile, message.toString(), 'utf8');
        } catch(e) {}
      } else if (msg.type === 'AUDITS_CLEAR') {
        try {
          if (fs.existsSync(AUDITS_BACKUP_FILE)) {
            const emergencyFile = path.join(__dirname, '..', 'audits_last_cleared_backup.json');
            fs.copyFileSync(AUDITS_BACKUP_FILE, emergencyFile);
            fs.unlinkSync(AUDITS_BACKUP_FILE);
          }
          console.log('[실사 초기화] 매장 실사 목록 비우기 신호 수신 -> 봇 백업 삭제 완료 (비상 아카이브 보존)');
        } catch(e) {}
      } else if (msg.type === 'BACKUP_DATA' && msg.data) {
        if (msg.data.products && Array.isArray(msg.data.products) && msg.data.products.length > 0) {
          fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(msg.data.products), 'utf8');
          console.log(`[백업 동기화] 마스터 상품 데이터 ${msg.data.products.length}건 봇 저장 완료`);
        }
        if (msg.data.settings) {
          fs.writeFileSync(SETTINGS_BACKUP_FILE, JSON.stringify(msg.data.settings), 'utf8');
        }
      }
    } catch(e) {}
    return;
  }

  // 2. 근무자 인증 목록
  if (topic === TOPIC_AUTH_1060) {
    try { fs.writeFileSync(AUTH_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
    return;
  }

  // 3. 상품 마스터 동기화
  if (topic === TOPIC_PROD_1060) {
    try {
      const msg = JSON.parse(message.toString());
      const products = msg.data?.products || (Array.isArray(msg) ? msg : []);
      if (products.length > 0) {
        fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(products), 'utf8');
        console.log(`[상품 동기화] 마스터 상품 데이터 ${products.length}건 봇 저장 완료`);
      }
    } catch(e){}
    return;
  }

  // 4. 설정 동기화
  if (topic === TOPIC_SETTINGS_1060) {
    try {
      fs.writeFileSync(SETTINGS_BACKUP_FILE, message.toString(), 'utf8');
      const s = JSON.parse(message.toString());
      if (s.younmePw) {
        process.env.YOUNME_PASSWORD = s.younmePw;
        updateEnvFile('YOUNME_PASSWORD', s.younmePw);
      }
      if (s.younmeId) {
        process.env.YOUNME_USER_ID = s.younmeId;
        updateEnvFile('YOUNME_USER_ID', s.younmeId);
      }
      console.log('[설정 동기화] 점장님 설정(계정/디스코드)이 봇에 저장되었습니다.');
    } catch(e){}
    return;
  }

  // 5. 발주 내역 PC 동기화
  if (topic === TOPIC_HISTORY_1060) {
    try {
      const msg = JSON.parse(message.toString());
      const historyList = Array.isArray(msg) ? msg : (msg.history || []);
      if (Array.isArray(historyList)) {
        saveOrderHistoryToDisk(historyList);
      }
    } catch (e) {}
    return;
  }

  // 5. ★ 자동 발주 검토 및 실행 신호 ★
  if (topic === TOPIC_AUTO_ORDER_1060) {
    try {
      const payload = JSON.parse(message.toString());
      const { audits, workerName, category } = payload;
      
      console.log('\n========================================================');
      console.log(`🤖 [자동 발주 검토 신호 수신!] (${new Date().toLocaleTimeString('ko-KR')})`);
      console.log(`   근무자: ${workerName || '알 수 없음'}, 분류: ${category || 'YOUNME'}, 품목 수: ${audits?.length || 0}건`);

      if (!audits || audits.length === 0) {
        console.log('   [자동발주 스킵] 스캔된 항목이 0건입니다.');
        sendDiscord(`ℹ️ **[자동발주 스킵]** 근무자(${workerName})의 스캔 리스트가 0건이라 발주를 진행하지 않았습니다.`);
        return;
      }

      const masterProducts = getMasterProducts();
      console.log(`   기준 상품 마스터: 총 ${masterProducts.length}개 품목 대조 중...`);
      const productMap = new Map();
      masterProducts.forEach(p => productMap.set(p.barcode, p));

      // 미검수 품목 판별 및 발주 수량 계산
      const unverifiedItems = [];
      const orderItems = [];

      for (const audit of audits) {
        if (audit.isUnmapped) {
          unverifiedItems.push(audit.productName || `미등록 바코드 (${audit.barcode})`);
          continue;
        }

        const product = productMap.get(audit.barcode);
        // 점장님이 한 번이라도 검수(목표/단위 수정 또는 적절함 체크)한 상품인가? (updatedAt 확인)
        if (!product || !product.updatedAt) {
          unverifiedItems.push(audit.productName || product?.name || audit.barcode);
          continue;
        }

        const targetStock = (product && product.targetStock !== undefined) ? product.targetStock : (audit.targetStock !== undefined ? audit.targetStock : 1);
        const minOrderQty = (product && product.minOrderQty !== undefined) ? Math.max(1, product.minOrderQty) : (audit.minOrderQty !== undefined ? Math.max(1, audit.minOrderQty) : 1);
        const currentStock = audit.stockCount || 0;
        const deficit = Math.max(0, targetStock - currentStock);

        const finalOrderQty = deficit === 0
          ? 0
          : deficit <= minOrderQty
          ? minOrderQty
          : Math.ceil(deficit / minOrderQty) * minOrderQty;

        if (finalOrderQty > 0) {
          orderItems.push({
            barcode: audit.barcode,
            productName: product.name || audit.productName,
            finalOrderQty,
            minOrderQty,
            cost: product.cost || 0,
            price: product.price || 0,
          });
        }
      }

      // 미검수 신상품이 섞여 있는 경우 -> 자동 발주 중단 & 수동 발주 유도 알림
      if (unverifiedItems.length > 0) {
        const sampleList = unverifiedItems.slice(0, 3).join(', ');
        const extraCount = unverifiedItems.length > 3 ? ` 외 ${unverifiedItems.length - 3}개` : '';
        console.log(`❌ [자동발주 중단] 미검수 상품 ${unverifiedItems.length}개 발견: ${sampleList}${extraCount}`);
        sendDiscord(`⚠️ **[자동발주 중단]** 점장님이 세팅(검수)하지 않은 신상품/미등록 품목이 총 ${unverifiedItems.length}개 섞여 있어 자동 발주를 멈췄습니다!\n- 미검수 품목: **${sampleList}${extraCount}**\n👉 PC 관리자 화면에서 목표재고/단위를 확인 후 수동으로 발주해 주세요.`);
        return;
      }

      // 모든 상품이 검수되었으나 발주할 수량이 0인 경우
      if (orderItems.length === 0) {
        console.log('✅ [자동발주 스킵] 모든 품목의 재고가 충분하여 발주할 수량이 없습니다.');
        sendDiscord(`✅ **[자동발주 스킵]** 검수 완료된 상품들이나, 매장 재고가 목표수량 이상으로 충분하여 발주할 품목이 없습니다. (근무자: ${workerName})`);
        return;
      }

      const isYounme = category !== 'SPCHAIN';
      const vendorName = isYounme ? '유앤미24' : '생필체인';

      if (!isYounme) {
        console.log('⚠️ [자동발주 중단] 생필체인은 수동 발주만 지원됩니다.');
        sendDiscord(`⚠️ **[수동 발주 필요]** 주류(생필체인)는 점장님 PC에서 최종 확인 후 수동으로 발주해 주세요.`);
        return;
      }

      // 유앤미 자동 발주 실행!
      console.log(`🚀 [자동발주 가동] 모든 상품(${orderItems.length}개) 검수 확인 완료! 유앤미24 발주 엔진 시작...`);
      sendDiscord(`🤖 **[자동발주 시작]** 모든 상품의 점장님 검수가 확인되었습니다! 봇이 유앤미24 발주를 시작합니다.\n- 발주 품목: **총 ${orderItems.length}개**`);

      const sendProgress = (arg1, arg2, arg3) => {
        let percent, msg;
        if (typeof arg1 === 'object') {
          percent = arg1.percent;
          msg = arg1.message;
        } else {
          percent = arg2;
          msg = arg3;
        }
        console.log(`   [자동발주 진행] ${percent}% - ${msg}`);
      };

      try {
        const result = await runDirectOrderAdd(orderItems, sendProgress);
        console.log(`\n🎉 [자동발주 완료] 성공: ${result.successCount}건, 실패: ${result.failures.length}건`);
        
        if (result.successCount > 0) {
          const successItems = orderItems.filter(item => !result.failures.some(f => f.barcode === item.barcode));
          const totalAmount = successItems.reduce((sum, item) => sum + ((item.cost || 0) * (item.finalOrderQty || 1)), 0);
          addOrderHistoryEntry({
            id: Date.now().toString(),
            orderDate: new Date().toLocaleString('ko-KR'),
            vendor: category === 'SPCHAIN' ? 'SPCHAIN' : 'YOUNME',
            items: successItems,
            totalAmount,
          });
        }
        
        let discordMsg = `🎉 **[자동발주 완료]** 유앤미24 장바구니 담기가 성공적으로 완료되었습니다!\n- 성공: **${result.successCount}건**`;
        if (result.failures.length > 0) {
          discordMsg += `\n- 실패/품절: ${result.failures.length}건 (${result.failures.map(f => f.productName).slice(0, 3).join(', ')})`;
        }
        sendDiscord(discordMsg);
      } catch (err) {
        console.error('❌ [자동발주 실패]:', err.message);
        sendDiscord(`🚨 **[자동발주 실패]** 발주 엔진 실행 중 오류가 발생했습니다: ${err.message}`);
      }

    } catch (e) {
      console.error('자동발주 처리 중 예외 발생:', e);
    }
    return;
  }

  // 6. 원격 수동 발주 요청 (AdminDashboard 웹화면에서 [발주하기] 누른 경우)
  if (topic !== TOPIC_REQ_YOUNME && topic !== TOPIC_REQ_SPCHAIN) return;

  const isYounme = topic === TOPIC_REQ_YOUNME;
  const vendorName = isYounme ? '유앤미24' : '생필체인';
  const progressTopic = isYounme ? TOPIC_PROGRESS_YOUNME : TOPIC_PROGRESS_SPCHAIN;
  const resTopic = isYounme ? TOPIC_RES_YOUNME : TOPIC_RES_SPCHAIN;

  console.log('\n========================================================');
  console.log(`🔔 [${vendorName} 원격 주문 신호 수신!] (${new Date().toLocaleTimeString('ko-KR')})`);

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error('❌ 잘못된 주문 데이터 형식:', err.message);
    return;
  }

  const { items, orderId, credentials } = data;
  console.log(`   주문 ID: ${orderId || 'N/A'}, 주문 품목 수: ${items?.length || 0}건`);
  if (credentials && credentials.pw) {
    process.env.YOUNME_PASSWORD = credentials.pw;
    if (credentials.id) process.env.YOUNME_USER_ID = credentials.id;
    updateEnvFile('YOUNME_PASSWORD', credentials.pw);
    if (credentials.id) updateEnvFile('YOUNME_USER_ID', credentials.id);
  }

  const sendProgress = (arg1, arg2, arg3) => {
    let status, percent, msg;
    if (typeof arg1 === 'object') {
      status = arg1.status || 'PROCESSING';
      percent = arg1.percent;
      msg = arg1.message;
    } else {
      status = arg1;
      percent = arg2;
      msg = arg3;
    }
    console.log(`   [진행] ${percent}% - ${msg}`);
    client.publish(progressTopic, JSON.stringify({
      orderId,
      status,
      percent,
      message: msg,
    }));
  };

  try {
    sendProgress('LOGGING_IN', 15, `매장 PC에서 ${vendorName} 발주 엔진을 초기화합니다...`);

    let result;
    if (isYounme) {
      result = await runDirectOrderAdd(items, sendProgress, credentials);
    } else {
      result = await runSpchainOrder({ items }, sendProgress);
    }

    console.log(`\n✅ [${vendorName}] 처리 완료! (성공: ${result.successCount}건)`);
    
    if (result.successCount > 0) {
      const successItems = items.filter(item => !result.failures.some(f => f.barcode === item.barcode));
      const totalAmount = successItems.reduce((sum, item) => sum + ((item.cost || 0) * (item.finalOrderQty || 1)), 0);
      addOrderHistoryEntry({
        id: orderId || Date.now().toString(),
        orderDate: new Date().toLocaleString('ko-KR'),
        vendor: isYounme ? 'YOUNME' : 'SPCHAIN',
        items: successItems,
        totalAmount,
      });
    }

    client.publish(resTopic, JSON.stringify({
      orderId,
      status: 'DONE',
      successCount: result.successCount,
      failures: result.failures,
      message: `${vendorName} 장바구니 담기가 성공적으로 완료되었습니다!`,
    }));

  } catch (err) {
    console.error(`❌ [${vendorName}] 발주 실행 오류:`, err.message);
    client.publish(resTopic, JSON.stringify({
      orderId,
      status: 'ERROR',
      message: `발주 실행 실패: ${err.message}`,
    }));
  }
});

client.on('error', (err) => {
  console.error('MQTT 오류:', err);
});

client.on('reconnect', () => {
  console.log('재연결 시도 중...');
});

// ========================================================
// PC 로컬 REST API 서버 (포트 3001) - 발주 내역 영구 보존 및 실시간 조회용
// ========================================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/history', (req, res) => {
  const history = getOrderHistoryFromDisk();
  res.json({ success: true, count: history.length, history });
});

app.post('/api/history', (req, res) => {
  const { history, entry } = req.body || {};
  if (entry) {
    const updated = addOrderHistoryEntry(entry);
    return res.json({ success: true, count: updated.length, history: updated });
  }
  if (Array.isArray(history)) {
    const current = getOrderHistoryFromDisk();
    if (JSON.stringify(current) !== JSON.stringify(history)) {
      saveOrderHistoryToDisk(history);
      if (client && client.connected) {
        client.publish(TOPIC_HISTORY_1060, JSON.stringify(history), { retain: true });
      }
    }
    return res.json({ success: true, count: history.length, history });
  }
  res.status(400).json({ error: 'Invalid payload' });
});

app.post('/api/order', async (req, res) => {
  try {
    const { items, credentials } = req.body || {};
    console.log(`\n📦 [로컬 REST 발주 요청 수신] 품목 수: ${items?.length || 0}건`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '주문할 품목이 없습니다.', successCount: 0, failures: [] });
    }

    if (credentials && credentials.pw) {
      process.env.YOUNME_PASSWORD = credentials.pw;
      if (credentials.id) process.env.YOUNME_USER_ID = credentials.id;
      updateEnvFile('YOUNME_PASSWORD', credentials.pw);
      if (credentials.id) updateEnvFile('YOUNME_USER_ID', credentials.id);
    }

    const sendProgress = (arg1, arg2, arg3) => {
      let percent, msg;
      if (typeof arg1 === 'object') {
        percent = arg1.percent;
        msg = arg1.message;
      } else {
        percent = arg2;
        msg = arg3;
      }
      console.log(`   [진행] ${percent}% - ${msg}`);
    };

    const result = await runDirectOrderAdd(items, sendProgress, credentials);
    console.log(`\n🎉 [로컬 REST 발주 완료] 성공: ${result.successCount}건, 실패: ${result.failures.length}건`);
    if (result.successCount > 0) {
      const successItems = items.filter(item => !result.failures.some(f => f.barcode === item.barcode));
      removeSuccessfulAuditsFromDiskAndSync(successItems.map(i => i.barcode));
    }

    res.json(result);
  } catch (err) {
    console.error('❌ [로컬 REST 발주 실패]:', err.message);
    res.status(500).json({ error: err.message, successCount: 0, failures: [] });
  }
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const current = getOrderHistoryFromDisk();
  const filtered = current.filter(h => h.id !== id);
  saveOrderHistoryToDisk(filtered);
  if (client && client.connected) {
    client.publish(TOPIC_HISTORY_1060, JSON.stringify(filtered), { retain: true });
  }
  res.json({ success: true, count: filtered.length, history: filtered });
});

// PC 로컬 실사 데이터 조회/저장 API

// PC 로컬 마스터 상품(목표재고/발주단위/설정상태 영구보관) 조회/저장 API
app.get('/api/products', (req, res) => {
  try {
    if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
      const products = Array.isArray(data) ? data : (data.products || []);
      return res.json({ success: true, count: products.length, products });
    }
  } catch (e) {
    console.error('[PC 저장소] products 읽기 오류:', e.message);
  }
  res.json({ success: true, count: 0, products: [] });
});

app.post('/api/products', (req, res) => {
  try {
    const products = req.body.products || (Array.isArray(req.body) ? req.body : []);
    if (Array.isArray(products) && products.length > 0) {
      let currentMap = new Map();
      if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
        try {
          const raw = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
          const currentList = Array.isArray(raw) ? raw : (raw.products || []);
          currentList.forEach(p => currentMap.set(p.barcode, p));
        } catch(e) {}
      }
      
      products.forEach(p => {
        const exist = currentMap.get(p.barcode);
        if (exist) {
          if (p.reviewStatus === 'MODIFIED' || p.targetStock !== undefined || p.minOrderQty !== undefined) {
            currentMap.set(p.barcode, { ...exist, ...p });
          } else if (exist.reviewStatus === 'MODIFIED') {
            currentMap.set(p.barcode, {
              ...p,
              ...exist,
              targetStock: exist.targetStock,
              minOrderQty: exist.minOrderQty,
              reviewStatus: exist.reviewStatus,
              updatedAt: exist.updatedAt,
            });
          } else {
            currentMap.set(p.barcode, { ...exist, ...p });
          }
        } else {
          currentMap.set(p.barcode, p);
        }
      });

      const merged = Array.from(currentMap.values());
      fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(merged, null, 2), 'utf8');
      const seedFile = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'seedProducts.json');
      if (fs.existsSync(seedFile)) {
        try { fs.writeFileSync(seedFile, JSON.stringify(merged, null, 2), 'utf8'); } catch(e){}
      }

      if (client && client.connected) {
        client.publish(TOPIC_PROD_1060, JSON.stringify({
          senderId: 'BOT_REST_API',
          timestamp: Date.now(),
          data: { products: merged }
        }), { qos: 1, retain: true });
      }
      return res.json({ success: true, count: merged.length, products: merged });
    }
  } catch (e) {
    console.error('[PC 저장소] products 저장 오류:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
  res.status(400).json({ success: false, message: '유효한 상품 배열이 제공되지 않았습니다.' });
});

app.get('/api/archived-audits', (req, res) => {
  try {
    const botDir = path.join(__dirname, '..');
    const archives = {};
    fs.readdirSync(botDir).filter(f => f.startsWith('audits_archive_')).forEach(f => {
      const dateStr = f.replace('audits_archive_', '').replace('.json', '');
      try {
        const data = JSON.parse(fs.readFileSync(path.join(botDir, f), 'utf8'));
        const list = Array.isArray(data) ? data : (data.audits || []);
        if (list.length > 0) {
          archives[dateStr] = list;
        }
      } catch(e) {}
    });
    res.json({ success: true, archives });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/audits', (req, res) => {
  try {
    if (fs.existsSync(AUDITS_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'));
      const audits = data.audits || (Array.isArray(data) ? data : []);
      return res.json({
        success: true,
        count: audits.length,
        timestamp: data.timestamp,
        audits
      });
    }
  } catch (e) {
    console.error('[PC 저장소] audits 읽기 오류:', e.message);
  }
  res.json({ success: true, count: 0, audits: [] });
});

app.post('/api/audits', (req, res) => {
  try {
    const { audits, senderId, senderRole } = req.body || {};
    if (Array.isArray(audits)) {
      const payload = {
        type: 'AUDITS_UPDATE',
        senderId: senderId || 'REST_API',
        senderRole: senderRole || 'ADMIN',
        storeId: '1060',
        timestamp: Date.now(),
        audits,
      };
      fs.writeFileSync(AUDITS_BACKUP_FILE, JSON.stringify(payload), 'utf8');
      if (client && client.connected) {
        client.publish(TOPIC_SYNC_1060, JSON.stringify(payload), { qos: 1, retain: true });
      }
      return res.json({ success: true, count: audits.length, audits });
    }
  } catch (e) {
    console.error('[PC 저장소] audits 저장 오류:', e.message);
  }
  res.status(400).json({ success: false, error: 'Invalid payload' });
});

app.get('/api/restore-backup', (req, res) => {
  try {
    const emergencyFile = path.join(__dirname, '..', 'audits_last_cleared_backup.json');
    if (fs.existsSync(emergencyFile)) {
      const data = JSON.parse(fs.readFileSync(emergencyFile, 'utf8'));
      const audits = data.audits || (Array.isArray(data) ? data : []);
      return res.json({
        success: true,
        count: audits.length,
        timestamp: data.timestamp,
        reason: data.reason || '직전 실사/발주 백업',
        audits
      });
    }
  } catch (e) {
    console.error('[PC 저장소] restore-backup 읽기 오류:', e.message);
  }
  res.json({ success: false, count: 0, audits: [] });
});

app.get('/api/latest-order', (req, res) => {
  try {
    const history = getOrderHistoryFromDisk();
    if (history.length > 0) {
      return res.json({ success: true, order: history[0] });
    }
  } catch (e) {}
  res.json({ success: false, order: null });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'unifiedBot', historyCount: getOrderHistoryFromDisk().length });
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const BOT_PORT = process.env.BOT_PORT || 3001;
app.listen(BOT_PORT, () => {
  console.log(`[PC 저장소 서버] http://localhost:${BOT_PORT} 가동 완료 (발주 내역 영구 보존 API)`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[PC 저장소 서버] 포트 ${BOT_PORT}이 이미 활성화되어 있습니다.`);
  } else {
    console.error('[PC 저장소 서버 오류]:', err.message);
  }
});

