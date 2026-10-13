const fs = require('fs');
const content = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes("msg.type === 'REQUEST_RESTORE'"));
console.log(lines.slice(idx - 2, idx + 20).join('\n'));
