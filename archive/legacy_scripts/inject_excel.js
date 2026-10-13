const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `'마지막수정일': p.updatedAt || '기록없음'`;
const newStr = `'마지막수정일': p.updatedAt || '기록없음',
      '마지막발주일': p.lastOrderDate || '기록없음'`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added order date to Excel export');
}
