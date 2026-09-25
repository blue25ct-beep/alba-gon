const fs = require('fs');
const path = require('path');

const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings for reliable replacement
content = content.replace(/\r\n/g, '\n');

// Ensure TOPIC_SYNC_1060 is defined
if (!content.includes('TOPIC_SYNC_1060')) {
    content = content.replace(
        `const AUTH_BACKUP_FILE = path.join(__dirname, '..', 'auth_backup.json');`,
        `const AUTH_BACKUP_FILE = path.join(__dirname, '..', 'auth_backup.json');\nconst TOPIC_SYNC_1060 = \`albagom-v2/stores/store_1060/audits_sync\`;\nconst AUDITS_BACKUP_FILE = path.join(__dirname, '..', 'audits_backup.json');`
    );
}

// Replace connect block
const oldConnect = `client.on('connect', () => {
  console.log('[2/2] 브로커 연결 성공! 주문 신호 대기 중...\\n');
  client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN]);
});`;

const newConnect = `client.on('connect', () => {
  console.log('[2/2] 브로커 연결 성공! 주문 신호 및 데이터 대기 중...\\n');
  client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN, TOPIC_AUTH_1060, TOPIC_SYNC_1060]);
  
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
      if (restored) console.log('[백업 시스템] 클라우드 데이터 증발 방어 성공! (근무자/실사 내역 유지)');
  } catch(e) {}
});`;

if (content.includes(oldConnect)) {
    content = content.replace(oldConnect, newConnect);
}

// Replace message block
const oldMessage = `client.on('message', async (topic, message) => {
  if (topic !== TOPIC_REQ_YOUNME && topic !== TOPIC_REQ_SPCHAIN) return;`;

const newMessage = `client.on('message', async (topic, message) => {
  if (topic === TOPIC_AUTH_1060) {
      try { fs.writeFileSync(AUTH_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }
  if (topic === TOPIC_SYNC_1060) {
      try { fs.writeFileSync(AUDITS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }

  if (topic !== TOPIC_REQ_YOUNME && topic !== TOPIC_REQ_SPCHAIN) return;`;

if (content.includes(oldMessage)) {
    content = content.replace(oldMessage, newMessage);
}

// Restore line endings and save
fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully patched unifiedBot.js with complete backup system!');
