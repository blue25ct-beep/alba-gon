const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'audits_backup.json');
const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'products_backup.json');
const SEED_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'seedProducts.json');

// 1. 마스터 상품 데이터 로드
let masterList = [];
if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
  try {
    masterList = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
  } catch(e) {}
}
if (!masterList || masterList.length === 0) {
  masterList = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
}

const prodMap = new Map();
masterList.forEach(p => prodMap.set(p.barcode, p));
console.log(`마스터 상품 데이터 ${masterList.length}건 대조 준비 완료`);

// 2. 현재 실사 목록 로드
const raw = JSON.parse(fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'));
const audits = raw.audits || (Array.isArray(raw) ? raw : []);

let updatedCount = 0;
const enrichedAudits = audits.map(audit => {
  const master = prodMap.get(audit.barcode);
  if (master) {
    updatedCount++;
    return {
      ...audit,
      productName: master.name || audit.productName,
      // 기존 마스터의 공식 발주 단위(minOrderQty)와 목표재고 완벽 적용
      minOrderQty: Math.max(1, master.minOrderQty || 1),
      targetStock: (audit.targetStock !== undefined && audit.targetStock !== 1) ? audit.targetStock : (master.targetStock || 1),
      cost: master.cost || 0,
      price: master.price || 0,
      category: master.category || '상온',
      vendor: (master.category === '주류' || master.category === '냉동/아이스') ? 'spchain' : 'younme'
    };
  }
  return audit;
});

const payload = {
  type: 'AUDITS_UPDATE',
  senderId: 'dev_enrich_script',
  senderRole: 'ADMIN',
  storeId: '1060',
  timestamp: Date.now(),
  audits: enrichedAudits
};

// 3. 파일 저장
fs.writeFileSync(AUDITS_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf8');
console.log(`[완료] 총 ${enrichedAudits.length}건 중 ${updatedCount}건에 기존 마스터 공식 발주 단위 및 목표재고를 완벽 적용했습니다.`);

// 샘플 출력
console.log('\n[샘플 대조 결과]');
const samples = ['8801043015714', '8801047284642', '8806002005805', '8801056048129'];
enrichedAudits.filter(a => samples.includes(a.barcode)).forEach(a => {
  console.log(`- ${a.productName} (바코드: ${a.barcode}) => 재고: ${a.stockCount}개, 목표: ${a.targetStock}개, 발주단위: ${a.minOrderQty}개`);
});

// 4. MQTT 발행 (retain)
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: `enricher_${Date.now()}` });
client.on('connect', () => {
  client.publish('albagom-v2/stores/store_1060/audits_sync', JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
    if (err) console.error('MQTT publish error:', err);
    else console.log('\n🎉 [클라우드 동기화 완료] 마스터 발주 단위가 적용된 실사 목록이 retain 되었습니다.');
    client.end();
    process.exit(0);
  });
});

setTimeout(() => process.exit(0), 5000);
