const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mqtt = require('mqtt');

// 유앤미 주문 처리 엔진
const { runDirectOrderAdd } = require('./orderEngine');
// 생필체인 주문 처리 엔진
const { runSpchainOrder } = require('./spchainEngine');

const STORE_ID = process.env.YOUNME_USER_ID || '047458';
const SPCHAIN_ID = 'SPCHAIN_047458';

const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';

const TOPIC_REQ_YOUNME = `albagom-v2/orders/store_${STORE_ID}/request`;
const TOPIC_RES_YOUNME = `albagom-v2/orders/store_${STORE_ID}/response`;
const TOPIC_PROGRESS_YOUNME = `albagom-v2/orders/store_${STORE_ID}/progress`;

const TOPIC_REQ_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/request`;
const TOPIC_RES_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/response`;
const TOPIC_PROGRESS_SPCHAIN = `albagom-v2/orders/store_${SPCHAIN_ID}/progress`;

console.log('========================================================');
console.log('  [편의점 알바곤] 통합 클라우드 실시간 자동발주 봇');
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
  console.log('[2/2] 브로커 연결 성공! 주문 신호 대기 중...\n');
  client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN]);
});

client.on('message', async (topic, message) => {
  if (topic !== TOPIC_REQ_YOUNME && topic !== TOPIC_REQ_SPCHAIN) return;

  const isYounme = topic === TOPIC_REQ_YOUNME;
  const vendorName = isYounme ? '유앤미24' : '생필체인';
  const progressTopic = isYounme ? TOPIC_PROGRESS_YOUNME : TOPIC_PROGRESS_SPCHAIN;
  const resTopic = isYounme ? TOPIC_RES_YOUNME : TOPIC_RES_SPCHAIN;

  console.log('\\n========================================================');
  console.log(`🔔 [${vendorName} 원격 주문 신호 수신!] (${new Date().toLocaleTimeString('ko-KR')})`);

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error('❌ 잘못된 주문 데이터 형식:', err.message);
    return;
  }

  const { items, orderId } = data;
  console.log(`   주문 ID: ${orderId || 'N/A'}, 주문 품목 수: ${items?.length || 0}건`);

  const sendProgress = (status, percent, msg) => {
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
      result = await runDirectOrderAdd(items, sendProgress);
    } else {
      result = await runSpchainOrder({ items }, sendProgress);
    }

    console.log(`\n✅ [${vendorName}] 처리 완료! (성공: ${result.successCount}건)`);
    
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
