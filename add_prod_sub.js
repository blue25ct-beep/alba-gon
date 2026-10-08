const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add subscription
const targetSub = `        this.client?.subscribe(topicSync, { qos: 1 });`;
const newSub = `        this.client?.subscribe(topicSync, { qos: 1 });
        this.client?.subscribe(\`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`, { qos: 1 });`;
if (!content.includes('products_sync`, { qos: 1 }')) {
  content = content.replace(targetSub, newSub);
}

// 2. Add message handler
const targetHandler = `        if (topic === authTopic) {`;
const newHandler = `        const prodTopic = \`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`;
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
        }

        if (topic === authTopic) {`;
if (!content.includes('topic === prodTopic')) {
  content = content.replace(targetHandler, newHandler);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added products_sync subscription and handler!');
