const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

const setupOld = `const TOPIC_RES_SPCHAIN = \`albagom-v2/orders/store_\${SPCHAIN_ID}/response\`;
const TOPIC_PROGRESS_SPCHAIN = \`albagom-v2/orders/store_\${SPCHAIN_ID}/progress\`;`;

const setupNew = `const TOPIC_RES_SPCHAIN = \`albagom-v2/orders/store_\${SPCHAIN_ID}/response\`;
const TOPIC_PROGRESS_SPCHAIN = \`albagom-v2/orders/store_\${SPCHAIN_ID}/progress\`;
const TOPIC_AUTH_1060 = \`albagom-v2/sync/store_1060/auth\`; // 하드코딩된 점포 ID 1060
const AUTH_BACKUP_FILE = path.join(__dirname, '..', 'auth_backup.json');`;

content = content.replace(setupOld, setupNew);

const connectOld = `client.on('connect', () => {
    console.log('[MQTT] 브로커에 연결되었습니다.');
    client.subscribe(TOPIC_REQ_YOUNME, { qos: 1 });
    client.subscribe(TOPIC_REQ_SPCHAIN, { qos: 1 });
    console.log(\`[MQTT] 구독 완료: \${TOPIC_REQ_YOUNME}\`);
    console.log(\`[MQTT] 구독 완료: \${TOPIC_REQ_SPCHAIN}\`);
});`;

const connectNew = `client.on('connect', () => {
    console.log('[MQTT] 브로커에 연결되었습니다.');
    client.subscribe(TOPIC_REQ_YOUNME, { qos: 1 });
    client.subscribe(TOPIC_REQ_SPCHAIN, { qos: 1 });
    client.subscribe(TOPIC_AUTH_1060, { qos: 1 });
    console.log(\`[MQTT] 구독 완료: \${TOPIC_REQ_YOUNME}\`);
    console.log(\`[MQTT] 구독 완료: \${TOPIC_REQ_SPCHAIN}\`);
    console.log(\`[MQTT] 구독 완료: \${TOPIC_AUTH_1060}\`);

    // 봇이 켜질 때 백업된 근무자 리스트가 있으면 클라우드에 강제로 밀어넣어 초기화를 방지함
    try {
        if (fs.existsSync(AUTH_BACKUP_FILE)) {
            const authData = fs.readFileSync(AUTH_BACKUP_FILE, 'utf8');
            client.publish(TOPIC_AUTH_1060, authData, { retain: true });
            console.log('[백업 복원] 저장된 근무자 리스트를 클라우드에 복구했습니다.');
        }
    } catch(e) {
        console.error('[백업 복원 실패]', e);
    }
});`;

content = content.replace(connectOld, connectNew);

const messageOld = `client.on('message', async (topic, message) => {
    try {`;

const messageNew = `client.on('message', async (topic, message) => {
    // Auth 토픽 백업 로직
    if (topic === TOPIC_AUTH_1060) {
        try {
            const workers = JSON.parse(message.toString());
            // 빈 배열이 아니거나, 빈 배열이어도 의도적으로 삭제한 경우 저장
            fs.writeFileSync(AUTH_BACKUP_FILE, message.toString(), 'utf8');
        } catch (e) {}
        return;
    }

    try {`;

content = content.replace(messageOld, messageNew);

fs.writeFileSync(file, content, 'utf8');
console.log('Added auth backup to unifiedBot.js');
