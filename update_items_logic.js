const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `const younmeItems = itemsToOrder.filter(item => item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));
  const spchainItems = itemsToOrder.filter(item => item.vendor === 'spchain' || (!item.vendor && item.category === '주류'));`;

const newStr = `const spchainItems = itemsToOrder.filter(item => item.category?.includes('주류') || item.vendor === 'spchain');
  const younmeItems = itemsToOrder.filter(item => !spchainItems.includes(item));`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed younmeItems logic');
