const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/spchainEngine.js';
let content = fs.readFileSync(file, 'utf8');

const idx = content.indexOf('console.log(\'[SPChain Bot] MQTT 연결 중...\');');
if (idx !== -1) {
    content = content.substring(0, idx) + 'module.exports = { runSpchainOrder };\n';
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed spchainEngine standalone MQTT');
}
