const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

const targetSync = `  if (topic === TOPIC_SYNC_1060) {
      try { fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }`;

const newSync = `  if (topic === TOPIC_SYNC_1060) {
      try { 
        const msg = JSON.parse(message.toString());
        if (msg.type === 'PING') {
          client.publish(TOPIC_SYNC_1060, JSON.stringify({
            type: 'PONG',
            senderId: 'BOT',
            senderRole: 'ADMIN',
            storeId: STORE_ID,
            timestamp: Date.now(),
            audits: []
          }), { qos: 1 });
          return;
        }
        
        // Only backup when actual audit updates happen to avoid overwriting with empty ping/pong/clear arrays
        if (msg.type === 'AUDITS_UPDATE') {
          fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8'); 
        }
      } catch(e){}
      return;
  }`;

if (content.includes('fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), \'utf8\');')) {
  content = content.replace(targetSync, newSync);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated unifiedBot.js');
}
