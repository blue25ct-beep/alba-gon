const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('audits[aIdx].updatedAt = list[idx]?.updatedAt;', "if (list[idx]?.updatedAt) audits[aIdx].updatedAt = list[idx].updatedAt;");
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed type error in storage.ts');
