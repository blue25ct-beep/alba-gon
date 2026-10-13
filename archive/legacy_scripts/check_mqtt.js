const fs = require('fs');
const content = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes("this.client.on('message'"));
console.log(lines.slice(start, start + 30).join('\n'));
