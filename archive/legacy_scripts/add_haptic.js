const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `    setActiveBarcode(barcode);
    const { product } = storageService.findProduct(barcode);
    setDetectedProduct(product);`;

const newCode = `    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    setActiveBarcode(barcode);
    const { product } = storageService.findProduct(barcode);
    setDetectedProduct(product);`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content, 'utf8');
console.log('Added haptic feedback');
