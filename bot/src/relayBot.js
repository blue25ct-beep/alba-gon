const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mqtt = require('mqtt');

// 유앤미 주문 처리 엔진 불러오기
const { runDirectOrderAdd } = require('./orderEngine');

const STORE_ID = process.env.YOUNME_USER_ID || '1060';
const BROKER_URL = 'mqtts://broker.hivemq.com:8883'; // 보안 TLS 포트

const TOPIC_REQ = `albagom/orders/store_${STORE_ID}/request`;
const TOPIC_PROGRESS = `albagom/orders/store_${STORE_ID}/progress`;
const TOPIC_RES = `albagom/orders/store_${STORE_ID}/response`;

console.log('========================================================');
console.log('  [편의점 알바곤] 유앤미24 클라우드 실시간 릴레이 봇');
console.log(`  매장 계정: ${STORE_ID}`);
console.log('  연결 브로커: broker.hivemq.com (보안 TLS)');
console.log('========================================================\n');

console.log('[1/2] 클라우드 릴레이 브로커에 연결 중...');
const client = mqtt.connect(BROKER_URL, {
  clientId: `alba_bot_${STORE_ID}_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log('✅ [2/2] 클라우드 릴레이 연결 완료!');
  console.log(`📡 원격 주문 대기 채널 구독 중: ${TOPIC_REQ}`);
  
  client.subscribe(TOPIC_SYNC, {qos: 1});
  client.subscribe(TOPIC_REQ, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ 토픽 구독 실패:', err);
    } else {
      console.log('🚀 [대기 상태] 이제 전 세계 어디서든 스마트폰으로 [발주 시작]을 누르시면');
      console.log('   이 PC가 즉시 신호를 받아 유앤미24에 자동으로 주문을 넣습니다!\n');
    }
  });
});

client.on('message', async (topic, message) => {
  if (topic === TOPIC_SYNC) {\n    try {\n      const payload = JSON.parse(message.toString());\n      if (payload.type === 'BACKUP_DATA' && payload.data) {\n        fs.writeFileSync('alba-gon-backup.json', JSON.stringify(payload.data, null, 2), 'utf8');\n        console.log('\\n[백업] 대시보드 데이터가 alba-gon-backup.json 에 안전하게 저장되었습니다.');\n      }\n      if (payload.type === 'REQUEST_RESTORE') {\n        if (fs.existsSync('alba-gon-backup.json')) {\n          const data = JSON.parse(fs.readFileSync('alba-gon-backup.json', 'utf8'));\n          client.publish(TOPIC_SYNC, JSON.stringify({\n            type: 'RESTORE_DATA',\n            senderId: 'BOT',\n            senderRole: 'WORKER',\n            storeId: STORE_ID,\n            timestamp: Date.now(),\n            audits: [],\n            data: data\n          }), { qos: 1 });\n          console.log('\\n[복구] 백업 데이터를 본사 대시보드로 전송했습니다.');\n        } else {\n          console.log('\\n[복구 실패] 백업 파일이 없습니다.');\n        }\n      }\n    } catch(e) {}\n    return;\n  }

  if (topic !== TOPIC_REQ) return;

  console.log('\n========================================================');
  console.log(`🔔 [원격 주문 신호 수신!] (${new Date().toLocaleTimeString('ko-KR')})`);

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error('❌ 잘못된 주문 데이터 형식:', err.message);
    return;
  }

  const { items, orderId } = data;
  console.log(`   주문 ID: ${orderId || 'N/A'}, 주문 품목 수: ${items?.length || 0}건`);

  // 진행 상황 알림 헬퍼
  const sendProgress = (status, percent, msg) => {
    console.log(`   [진행] ${percent}% - ${msg}`);
    client.publish(TOPIC_PROGRESS, JSON.stringify({
      orderId,
      status,
      percent,
      message: msg,
    }));
  };

  try {
    sendProgress('LOGGING_IN', 15, '매장 PC가 유앤미24 본사에 로그인 중...');
    
    // 실제 주문 실행
    const result = await runDirectOrderAdd(items || [], (progress) => {
      sendProgress(progress.status, progress.percent, progress.message);
    });

    console.log(`\n🎉 [발주 완료!] 성공: ${result.successCount}건, 실패: ${result.failures.length}건`);

    // 클라우드로 결과 회신 (스마트폰에 전달)
    client.publish(TOPIC_RES, JSON.stringify({
      orderId,
      status: 'DONE',
      successCount: result.successCount,
      failures: result.failures,
      message: '유앤미24 장바구니 담기가 성공적으로 완료되었습니다!',
    }));

  } catch (err) {
    console.error('❌ 발주 실행 오류:', err.message);
    client.publish(TOPIC_RES, JSON.stringify({
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
  console.log('릴레이 재연결 시도 중...');
});
