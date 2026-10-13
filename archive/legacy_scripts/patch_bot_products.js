const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add TOPIC_PROD_1060 and PRODUCTS_BACKUP_FILE
if (!content.includes('TOPIC_PROD_1060')) {
    const oldSetup = `const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'audits_backup.json');`;
    const newSetup = `const AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'audits_backup.json');\nconst TOPIC_PROD_1060 = \`albagom-v2/stores/store_1060/products_sync\`;\nconst PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'products_backup.json');`;
    content = content.replace(oldSetup, newSetup);
}

// 2. Add TOPIC_PROD_1060 to subscriptions and restore logic
const oldConnect = `  client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN, TOPIC_AUTH_1060, TOPIC_SYNC_1060]);
  
  // 봇 재시작 시, 혹은 클라우드 리셋 시 백업된 데이터로 강제 복구
  try {
      let restored = false;
      if (fs.existsSync(AUTH_BACKUP_FILE)) {
          client.publish(TOPIC_AUTH_1060, fs.readFileSync(AUTH_BACKUP_FILE, 'utf8'), { retain: true });
          restored = true;
      }
      if (fs.existsSync(AUDITS_BACKUP_FILE)) {
          client.publish(TOPIC_SYNC_1060, fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'), { retain: true });
          restored = true;
      }`;
      
const newConnect = `  client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN, TOPIC_AUTH_1060, TOPIC_SYNC_1060, TOPIC_PROD_1060]);
  
  // 봇 재시작 시, 혹은 클라우드 리셋 시 백업된 데이터로 강제 복구
  try {
      let restored = false;
      if (fs.existsSync(AUTH_BACKUP_FILE)) {
          client.publish(TOPIC_AUTH_1060, fs.readFileSync(AUTH_BACKUP_FILE, 'utf8'), { retain: true });
          restored = true;
      }
      if (fs.existsSync(AUDITS_BACKUP_FILE)) {
          client.publish(TOPIC_SYNC_1060, fs.readFileSync(AUDITS_BACKUP_FILE, 'utf8'), { retain: true });
          restored = true;
      }
      if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
          client.publish(TOPIC_PROD_1060, fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8'), { retain: true });
          restored = true;
      }`;

content = content.replace(oldConnect, newConnect);

// 3. Add message handler for TOPIC_PROD_1060
const oldMsg = `  if (topic === TOPIC_SYNC_1060) {
      try { fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }`;

const newMsg = `  if (topic === TOPIC_SYNC_1060) {
      try { fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }
  if (topic === TOPIC_PROD_1060) {
      try { fs.writeFileSync(PRODUCTS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }`;

content = content.replace(oldMsg, newMsg);

fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Patched unifiedBot.js with products_sync backup logic');
