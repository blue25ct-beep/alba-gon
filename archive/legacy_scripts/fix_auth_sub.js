const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

const subscribeOld = `        this.client?.subscribe(topicSync, { qos: 1 }, (err) => {
          if (err) {
            console.error('[CloudSync] 토픽 구독 실패:', err);
            this.notifyStatus('ERROR');
          }
        });`;
const topicAuth = '`albagom-v2/sync/store_${this.currentStoreId}/auth`';
const subscribeNew = `        this.client?.subscribe(topicSync, { qos: 1 });
        this.client?.subscribe(${topicAuth}, { qos: 1 }, (err) => {
          if (err) {
            console.error('[CloudSync] 토픽 구독 실패:', err);
            this.notifyStatus('ERROR');
          }
        });`;
content = content.replace(subscribeOld, subscribeNew);

const messageOld = `      this.client.on('message', (topic, payload) => {
        if (topic !== topicSync) return;
        try {
          const msg: AuditsSyncMessage = JSON.parse(payload.toString());`;

const messageNew = `      this.client.on('message', (topic, payload) => {
        if (topic === ${topicAuth}) {
          try {
            const workers = JSON.parse(payload.toString());
            this.authListeners.forEach(l => l(workers));
          } catch (e) {
            console.error('Auth parse error:', e);
          }
          return;
        }
        if (topic !== topicSync) return;
        try {
          const msg: AuditsSyncMessage = JSON.parse(payload.toString());`;
content = content.replace(messageOld, messageNew);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cloudSyncService.ts to listen to /auth');
