const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('public disconnect() {'));

const newMethods = `
  public publishSettings(settings: any) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/settings\`;
    this.client.publish(topic, JSON.stringify(settings), { retain: true });
  }

  public requestAutoOrderEvaluation(audits: any[], workerName: string, category: string) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/auto_order_eval\`;
    this.client.publish(topic, JSON.stringify({ audits, workerName, category }), { qos: 1 });
  }
`;

lines.splice(idx, 0, newMethods);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Injected new methods successfully');
