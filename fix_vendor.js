const fs = require('fs');

// 1. Update types.ts
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/types.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('category?: string;          // 저온/상온 여부', 'category?: string;          // 저온/상온 여부\n  vendor?: "younme" | "spchain";');
fs.writeFileSync(file, content, 'utf8');

// 2. Update WorkerApp.tsx to save vendor
file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
    'isUnmapped,\n        workerName,\n      });',
    'isUnmapped,\n        workerName,\n        vendor: selectedCategory === "SPCHAIN" ? "spchain" : "younme",\n      });'
);
fs.writeFileSync(file, content, 'utf8');

// 3. Update AdminDashboard.tsx to read vendor and filter based on it
file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'category: product?.category || "",',
    'category: product?.category || "",\n          vendor: a.vendor,'
);

const oldSplit = `  const younmeItems = itemsToOrder.filter(item => item.category === '상온' || item.category === '냉장' || !item.category);
  const spchainItems = itemsToOrder.filter(item => item.category === '주류');`;

const newSplit = `  const younmeItems = itemsToOrder.filter(item => item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));
  const spchainItems = itemsToOrder.filter(item => item.vendor === 'spchain' || (!item.vendor && item.category === '주류'));`;

content = content.replace(oldSplit, newSplit);
fs.writeFileSync(file, content, 'utf8');

console.log('Successfully updated vendor categorization logic!');
