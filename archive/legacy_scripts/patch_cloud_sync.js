const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix broadcastProductsUpdate
const oldBroadcast = `  public broadcastProductsUpdate(role: 'WORKER' | 'ADMIN' = 'ADMIN'): Promise<boolean> {
    return new Promise((resolve) => {
      const topicSync = \`albagom-v2/stores/store_\${this.currentStoreId}/audits_sync\`;
      const payload: AuditsSyncMessage = {
        type: 'PRODUCTS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
      };

      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }

      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {`;

const newBroadcast = `  public broadcastProductsUpdate(role: 'WORKER' | 'ADMIN' = 'ADMIN'): Promise<boolean> {
    return new Promise((resolve) => {
      const topicProd = \`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`;
      const payload: AuditsSyncMessage = {
        type: 'PRODUCTS_UPDATE',
        senderId: this.mySenderId,
        senderRole: role,
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
        data: { products: storageService.getProducts() }
      };

      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }

      this.client.publish(topicProd, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {`;

content = content.replace(oldBroadcast, newBroadcast);

// 2. Fix subscription logic to include products_sync
const oldSubscribe = `      this.client.on('connect', () => {
        this.notifyStatus('CONNECTED');
        this.client!.subscribe([topicSync, topicAuth], { qos: 1 }, (err) => {`;

const newSubscribe = `      this.client.on('connect', () => {
        this.notifyStatus('CONNECTED');
        const topicProd = \`albagom-v2/stores/store_\${storeId}/products_sync\`;
        this.client!.subscribe([topicSync, topicAuth, topicProd], { qos: 1 }, (err) => {`;

content = content.replace(oldSubscribe, newSubscribe);

// 3. Fix message handler logic for PRODUCTS_UPDATE
const oldHandler = `          } else if (msg.type === 'PRODUCTS_UPDATE') {
            this.productsUpdateListeners.forEach((l) => l());
          } else if (msg.type === 'AUDITS_UPDATE') {`;

const newHandler = `          } else if (msg.type === 'PRODUCTS_UPDATE') {
            if (msg.data && msg.data.products) {
              storageService.saveProducts(msg.data.products);
            }
            this.productsUpdateListeners.forEach((l) => l());
          } else if (msg.type === 'AUDITS_UPDATE') {`;

content = content.replace(oldHandler, newHandler);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched cloudSyncService.ts for products_sync topic separation');
