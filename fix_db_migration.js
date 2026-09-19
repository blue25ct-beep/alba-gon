const fs = require('fs');

let fileApp = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let contentApp = fs.readFileSync(fileApp, 'utf8');

const oldEffect = `  useEffect(() => {
    // 기본 상품 DB 초기화
    storageService.getProducts();
  }, []);`;

const newEffect = `  useEffect(() => {
    // Force update DB with latest seedProducts (migration)
    const current = storageService.getProducts();
    const seed = require('./data/seedProducts.json');
    const merged = [...current];
    let changed = false;
    for (const s of seed) {
      const idx = merged.findIndex(p => p.barcode === s.barcode);
      if (idx === -1) {
        merged.push(s);
        changed = true;
      } else if (merged[idx].category !== s.category && s.category === '주류') {
        merged[idx].category = '주류';
        merged[idx].minOrderQty = s.minOrderQty;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem('albagom_products_v3', JSON.stringify(merged));
    }
  }, []);`;

contentApp = contentApp.replace(oldEffect, newEffect);
fs.writeFileSync(fileApp, contentApp, 'utf8');
console.log('Fixed DB migration in App.tsx');
