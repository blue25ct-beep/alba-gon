const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/orderEngine.js';
let content = fs.readFileSync(file, 'utf8');

const oldCheck = `const isChilled = item.category?.includes('냉동') || item.category?.includes('저온');`;
const newCheck = `const isChilled = item.category?.includes('냉동') || item.category?.includes('저온') || item.category?.includes('냉장');`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed category check in orderEngine.js');
