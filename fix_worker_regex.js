const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace using regex to handle both \n and \r\n
content = content.replace(
    /isUnmapped,[\r\n\s]+workerName,[\r\n\s]+\}\);/,
    "isUnmapped,\n        workerName,\n        vendor: selectedCategory === 'SPCHAIN' ? 'spchain' : 'younme',\n      });"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed WorkerApp.tsx successfully');
