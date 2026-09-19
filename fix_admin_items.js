const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "const itemsToOrder = allItemsToOrder.filter((item) => !item.productName.includes('쿠팡]'));";
const injectStr = `
  const younmeItems = itemsToOrder.filter(item => item.category === '상온' || item.category === '냉장' || !item.category);
  const spchainItems = itemsToOrder.filter(item => item.category === '주류');
`;

if (content.includes(targetStr) && !content.includes('const younmeItems')) {
    content = content.replace(targetStr, targetStr + injectStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Injected younmeItems and spchainItems.');
} else {
    console.log('Failed to find target string or already injected.');
}
