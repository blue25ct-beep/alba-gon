const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `const isCoupangItem = item.productName.includes('쿠팡]') || item.productName.startsWith('CP]');
    const isYounmeItem = !isCoupangItem && (item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));`;

const newStr = `const isCoupangItem = item.productName.includes('쿠팡]') || item.productName.startsWith('CP]');
    const isLiquor = item.category?.includes('주류') || item.vendor === 'spchain';
    const isYounmeItem = !isCoupangItem && !isLiquor;`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed category logic for Younme tab');
