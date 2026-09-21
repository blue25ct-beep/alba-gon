const fs = require('fs');

// Patch storage.ts
let storagePath = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(storagePath, 'utf8');

if (!content.includes('workers: []')) {
  content = content.replace(/workerName:\s*'주간알바',/, "workerName: '주간알바',\n      workers: [],");
  fs.writeFileSync(storagePath, content, 'utf8');
  console.log('storage.ts patched');
} else {
  console.log('storage.ts already patched');
}
