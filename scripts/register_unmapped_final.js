const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'products_backup.json');
const SEED_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'seedProducts.json');
const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'audits_backup.json');

const finalProducts = [
  { barcode: '8809680472921', name: '클리어페페젤250ml', price: 10000, cost: 7000, category: '잡화', targetStock: 1, minOrderQty: 1 },
  { barcode: '4005292651608', name: '수]카카오프렌즈 딸기캔디', price: 6000, cost: 4200, category: '과자/간식', targetStock: 1, minOrderQty: 1 },
  { barcode: '8801166230438', name: '유한]좋은느낌입는오버나이트대형8P', price: 12000, cost: 8400, category: '잡화', targetStock: 1, minOrderQty: 1 }
];

const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// 1. Update bot/products_backup.json
let prodList = [];
if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'));
    prodList = Array.isArray(raw) ? raw : (raw.products || []);
  } catch(e) {}
}
const prodMap = new Map();
prodList.forEach(p => prodMap.set(p.barcode, p));
finalProducts.forEach(np => {
  const ex = prodMap.get(np.barcode);
  prodMap.set(np.barcode, {
    ...(ex || {}),
    ...np,
    reviewStatus: 'MODIFIED',
    updatedAt: nowStr
  });
});
const mergedProds = Array.from(prodMap.values());
fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(mergedProds, null, 2), 'utf8');
console.log(`[1/3] products_backup.json 업데이트 완료 (총 ${mergedProds.length}개 상품)`);

// 2. Update client/src/data/seedProducts.json
let seedList = [];
if (fs.existsSync(SEED_FILE)) {
  try { seedList = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')); } catch(e){}
}
const seedMap = new Map();
seedList.forEach(p => seedMap.set(p.barcode, p));
finalProducts.forEach(np => {
  const ex = seedMap.get(np.barcode);
  seedMap.set(np.barcode, {
    ...(ex || {}),
    ...np,
    reviewStatus: 'MODIFIED',
    updatedAt: nowStr
  });
});
fs.writeFileSync(SEED_FILE, JSON.stringify(Array.from(seedMap.values()), null, 2), 'utf8');
console.log(`[2/3] seedProducts.json 영구 반영 완료`);

// 3. Update audits_backup.json
let auditsData = { audits: [] };
if (fs.existsSync(AUDITS_BACKUP_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'));
    auditsData = raw.audits ? raw : { audits: raw };
  } catch(e) {}
}

let updatedAuditsCount = 0;
const newProdLookup = new Map();
finalProducts.forEach(np => newProdLookup.set(np.barcode, np));

auditsData.audits = (auditsData.audits || []).map(a => {
  const match = newProdLookup.get(a.barcode);
  if (match) {
    updatedAuditsCount++;
    return {
      ...a,
      productName: match.name,
      isUnmapped: false,
      targetStock: a.targetStock || match.targetStock,
      minOrderQty: a.minOrderQty || match.minOrderQty
    };
  }
  return a;
});

fs.writeFileSync(AUDITS_BACKUP_FILE, JSON.stringify(auditsData, null, 2), 'utf8');
console.log(`[3/3] audits_backup.json 내 ${updatedAuditsCount}건 미등록 상품을 정식 상품명으로 전환 완료`);

// Check unmapped count in audits
const remainingUnmapped = auditsData.audits.filter(a => a.isUnmapped || a.productName === '미등록 상품');
console.log(`🎯 현재 실사 목록 내 남은 미등록 상품 수: ${remainingUnmapped.length}개`);

// 4. Publish MQTT retain
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: `reg_prod_final_${Date.now()}` });
client.on('connect', () => {
  client.publish('albagom-v2/stores/store_1060/products_sync', JSON.stringify({
    senderId: 'BOT_REST_API',
    timestamp: Date.now(),
    data: { products: mergedProds }
  }), { qos: 1, retain: true });

  client.publish('albagom-v2/stores/store_1060/audits_sync', JSON.stringify({
    type: 'AUDITS_UPDATE',
    senderId: 'dev_script',
    senderRole: 'ADMIN',
    storeId: '1060',
    timestamp: Date.now(),
    audits: auditsData.audits
  }), { qos: 1, retain: true }, () => {
    console.log('🎉 클라우드(MQTT retain)에 최종 신규 등록 상품 및 갱신된 실사 목록 동기화 완료!');
    client.end();
  });
});
