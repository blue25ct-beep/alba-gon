const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

const targetPublish = `      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1 }, (err) => {`;
const newPublish = `      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (!err) {
          const topicProd = \`albagom-v2/stores/store_\${this.currentStoreId}/products_sync\`;
          this.client?.publish(topicProd, JSON.stringify(payload), { qos: 1, retain: true });
        }`;
content = content.replace(targetPublish, newPublish);

fs.writeFileSync(file, content, 'utf8');
console.log('Added publish to TOPIC_PROD_1060');
