const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'products_backup.json');
const SEED_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'seedProducts.json');
const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'audits_backup.json');

const newProducts = [
  { barcode: '4550516621238', name: '센카퍼펙트휩', price: 11000, cost: 7700, category: '잡화', targetStock: 1, minOrderQty: 1 },
  { barcode: '047400241442', name: '질레트]스킨쉐이빙폼', price: 7500, cost: 5250, category: '잡화', targetStock: 1, minOrderQty: 1 },
  { barcode: '8809520468534', name: '닥터지]레드블레미쉬', price: 2500, cost: 1750, category: '잡화', targetStock: 1, minOrderQty: 1 },
  { barcode: '8801154575350', name: '데톨]항균비누스킨케', price: 1800, cost: 1260, category: '잡화', targetStock: 1, minOrderQty: 1 },
  { barcode: '8809086621206', name: '벡셀]AA-2입', price: 2800, cost: 1960, category: '잡화', targetStock: 1, minOrderQty: 1 }
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

newProducts.forEach(np => {
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
newProducts.forEach(np => {
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
newProducts.forEach(np => newProdLookup.set(np.barcode, np));

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

// 4. Publish MQTT retain for products and audits
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: `reg_prod_${Date.now()}` });
client.on('connect', () => {
  // publish products
  client.publish('albagom-v2/stores/store_1060/products_sync', JSON.stringify({
    senderId: 'BOT_REST_API',
    timestamp: Date.now(),
    data: { products: mergedProds }
  }), { qos: 1, retain: true });

  // publish audits
  client.publish('albagom-v2/stores/store_1060/audits_sync', JSON.stringify({
    type: 'AUDITS_UPDATE',
    senderId: 'dev_script',
    senderRole: 'ADMIN',
    storeId: '1060',
    timestamp: Date.now(),
    audits: auditsData.audits
  }), { qos: 1, retain: true }, () => {
    console.log('🎉 클라우드(MQTT retain)에 신규 등록 상품 및 갱신된 실사 목록 동기화 완료!');
    client.end();
  });
});
