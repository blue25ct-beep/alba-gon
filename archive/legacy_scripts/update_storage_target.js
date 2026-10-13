const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'list[idx].targetStock = safeVal;',
  'list[idx] = { ...list[idx], targetStock: safeVal, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) };'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed storage.ts to include updatedAt in updateProductTargetStock');
