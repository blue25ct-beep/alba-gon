const fs = require('fs');
const path = require('path');

const botFile = path.join(__dirname, '..', 'bot', 'src', 'unifiedBot.js');
let code = fs.readFileSync(botFile, 'utf8');

// 1. Startup publish for products
const oldPublish = `    if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
      client.publish(TOPIC_PROD_1060, fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'), { retain: true });
      restored = true;
    }`;

const newPublish = `    if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
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
    }`;

code = code.replace(oldPublish, newPublish);

// 2. Add /api/products GET and POST endpoints
const productEndpoints = `
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
          currentMap.set(p.barcode, { ...exist, ...p });
        } else {
          currentMap.set(p.barcode, p);
        }
      });

      const merged = Array.from(currentMap.values());
      fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(merged, null, 2), 'utf8');

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
`;

code = code.replace("app.get('/api/audits'", productEndpoints + "\napp.get('/api/audits'");

fs.writeFileSync(botFile, code, 'utf8');
console.log('unifiedBot.js successfully updated with /api/products endpoints!');
