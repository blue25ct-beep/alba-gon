const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{p.barcode} · {p.category}{p.updatedAt ? \` · ✏️ 수정: \${p.updatedAt}\` : ''}`;
const newStr = `{p.barcode} · {p.category}{p.updatedAt ? \` · ✏️ 수정: \${p.updatedAt}\` : ''}{p.lastOrderDate ? \` · 📦 발주: \${p.lastOrderDate}\` : ''}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added order date to setup modal');
}
