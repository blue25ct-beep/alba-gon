const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'audits_backup.json');
const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'bot', 'products_backup.json');
const SEED_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'seedProducts.json');

// 마스터 상품 데이터 로드
let masterList = [];
if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
  try { masterList = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8')); } catch(e) {}
}
if (!masterList || masterList.length === 0) {
  masterList = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
}
const prodMap = new Map();
masterList.forEach(p => prodMap.set(p.barcode, p));

module.exports = function importBatch(batchItems) {
  let existingAudits = [];
  try {
    if (fs.existsSync(AUDITS_BACKUP_FILE)) {
      const raw = JSON.parse(fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'));
      existingAudits = raw.audits || (Array.isArray(raw) ? raw : []);
    }
  } catch (e) {}

  const auditMap = new Map();
  for (const item of existingAudits) {
    if (item && item.barcode) auditMap.set(item.barcode, item);
  }

  const now = Date.now();
  batchItems.forEach((item, idx) => {
    const master = prodMap.get(item.barcode);
    const minOrderQty = master ? Math.max(1, master.minOrderQty || 1) : (item.minOrderQty || 1);
    const targetStock = item.targetStock !== undefined && item.targetStock !== 1 
      ? item.targetStock 
      : (master ? master.targetStock : (item.targetStock || 1));

    const fullItem = {
      id: (now + idx).toString(),
      barcode: item.barcode,
      productName: master ? (master.name || item.productName) : item.productName,
      stockCount: item.stockCount,
      targetStock,
      minOrderQty, // 마스터 상품의 공식 발주 단위 자동 적용!
      photoUrls: [],
      isUnmapped: !!item.isUnmapped,
      workerName: '하진현',
      vendor: master && (master.category === '주류' || master.category === '냉동/아이스') ? 'spchain' : 'younme',
      updatedAt: item.updatedAt || new Date().toLocaleString('ko-KR')
    };
    auditMap.set(item.barcode, fullItem);
  });

  const mergedAudits = Array.from(auditMap.values());
  const payload = {
    type: 'AUDITS_UPDATE',
    senderId: 'dev_import_script',
    senderRole: 'ADMIN',
    storeId: '1060',
    timestamp: now,
    audits: mergedAudits
  };

  fs.writeFileSync(AUDITS_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[디스크 저장 완료] 누적 총 ${mergedAudits.length}건 실사 목록 파일에 보관됨: ${AUDITS_BACKUP_FILE}`);

  const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: `importer_${Date.now()}` });
  client.on('connect', () => {
    client.publish('albagom-v2/stores/store_1060/audits_sync', JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
      if (err) console.error('[MQTT 발행 실패]', err);
      else console.log(`🎉 [MQTT 발행 성공!] 누적 총 ${mergedAudits.length}건 (공식 발주단위 포함) 클라우드 retain 완료.`);
      client.end();
    });
  });
};
