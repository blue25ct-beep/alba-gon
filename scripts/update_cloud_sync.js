const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'services', 'cloudSyncService.ts');
let code = fs.readFileSync(file, 'utf8');

const oldBlock = `        const prodTopic = \`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`;
        if (topic === prodTopic) {
          try {
            const msg = JSON.parse(payload.toString());
            if (msg.data && msg.data.products && msg.senderId !== this.mySenderId) {
              storageService.saveProducts(msg.data.products);
              this.productsUpdateListeners.forEach(l => l());
            }
          } catch (e) {
            console.error('Products sync parse error:', e);
          }
          return;
        }`;

const newBlock = `        const prodTopic = \`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`;
        if (topic === prodTopic) {
          try {
            const msg = JSON.parse(payload.toString());
            const prodList = msg.data?.products || (Array.isArray(msg) ? msg : null);
            if (prodList && Array.isArray(prodList) && msg.senderId !== this.mySenderId) {
              const local = storageService.getProducts();
              const map = new Map();
              local.forEach((p) => map.set(p.barcode, p));
              prodList.forEach((p) => {
                const ex = map.get(p.barcode);
                map.set(p.barcode, { ...ex, ...p });
              });
              const merged = Array.from(map.values());
              storageService.saveProducts(merged, false);
              this.productsUpdateListeners.forEach(l => l());
            }
          } catch (e) {
            console.error('Products sync parse error:', e);
          }
          return;
        }`;

const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
  code = normCode.replace(normOld, normNew).replace(/\n/g, '\r\n');
  fs.writeFileSync(file, code, 'utf8');
  console.log('cloudSyncService.ts successfully updated!');
} else {
  console.error('Target not found in cloudSyncService.ts');
}
