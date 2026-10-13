const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const oldTime = `updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),`;
const newTime = `updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),`;

content = content.replace(oldTime, newTime);
fs.writeFileSync(file, content, 'utf8');
console.log('Updated updatedAt format to include date');
