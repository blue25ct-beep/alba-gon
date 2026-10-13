const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

const targetBroadcast = `      const payload: AuditsSyncMessage = {
        type: 'PRODUCTS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
      };`;
const newBroadcast = `      const payload: AuditsSyncMessage = {
        type: 'PRODUCTS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
        data: { products: storageService.getProducts() }
      };`;
content = content.replace(targetBroadcast, newBroadcast);

const targetReceive = `          } else if (msg.type === 'PRODUCTS_UPDATE') {
            this.productsUpdateListeners.forEach((l) => l());
          }`;
const newReceive = `          } else if (msg.type === 'PRODUCTS_UPDATE') {
            if (msg.data && msg.data.products) {
              storageService.saveProducts(msg.data.products);
            }
            this.productsUpdateListeners.forEach((l) => l());
          }`;
content = content.replace(targetReceive, newReceive);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed PRODUCTS_UPDATE to actually sync data!');
