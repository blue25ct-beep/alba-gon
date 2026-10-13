const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings for replacement
content = content.replace(/\r\n/g, '\n');

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

if (content.includes(subscribeOld)) {
  content = content.replace(subscribeOld, subscribeNew);
  console.log('Subscribe fixed');
} else {
  console.log('Subscribe NOT found');
}

const messageOld = `      this.client.on('message', (topic, payload) => {
        if (topic !== topicSync) return;
        try {
          const msg: AuditsSyncMessage = JSON.parse(payload.toString());`;

const messageNew = `      this.client.on('message', (topic, payload) => {
        const authTopic = ${topicAuth};
        if (topic === authTopic) {
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

if (content.includes(messageOld)) {
  content = content.replace(messageOld, messageNew);
  console.log('Message listener fixed');
} else {
  console.log('Message listener NOT found');
}

fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
