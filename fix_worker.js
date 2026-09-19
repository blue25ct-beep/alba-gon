const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "isUnmapped,\n        workerName,\n      });";
const replacement = "isUnmapped,\n        workerName,\n        vendor: selectedCategory === 'SPCHAIN' ? 'spchain' : 'younme',\n      });";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed WorkerApp.tsx successfully');
} else {
    console.log('Target string not found in WorkerApp.tsx');
}
