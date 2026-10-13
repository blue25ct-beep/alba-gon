const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  public publishAuthList(workers: any[]) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/auth\`;
    this.client.publish(topic, JSON.stringify(workers), { retain: true });
  }`;

const newStr = `  public publishAuthList(workers: any[]) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/auth\`;
    this.client.publish(topic, JSON.stringify(workers), { retain: true });
  }

  public publishSettings(settings: any) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/settings\`;
    this.client.publish(topic, JSON.stringify(settings), { retain: true });
  }

  public requestAutoOrderEvaluation(audits: any[], workerName: string, category: string) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/auto_order_eval\`;
    this.client.publish(topic, JSON.stringify({ audits, workerName, category }), { qos: 1 });
  }`;

if (content.includes('publishAuthList')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added publishSettings and requestAutoOrderEvaluation');
} else {
  console.log('Target string not found');
}
