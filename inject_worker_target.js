const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{item.barcode} · {item.updatedAt}`;
const newStr = `{item.barcode} · 목표 재고: {item.targetStock ?? 1} · {item.updatedAt}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added target stock info to WorkerApp');
} else {
  console.log('Failed to find target string');
}
