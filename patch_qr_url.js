const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleBarcodeDetected = \(barcode: string\) => \{\s*if \(step !== 'IDLE'\) return;\s*setActiveBarcode\(barcode\);/;

const replacement = `const handleBarcodeDetected = (rawBarcode: string) => {
    if (step !== 'IDLE') return;

    let barcode = rawBarcode.trim();
    if (barcode.startsWith('http') || barcode.includes('/01/')) {
      const gs1Match = barcode.match(/\\/01\\/0?(\\d{13})/);
      if (gs1Match) {
        barcode = gs1Match[1];
      } else {
        const fallbackMatch = barcode.match(/0?(\\d{13})(?:\\?|#|$)/);
        if (fallbackMatch) {
          barcode = fallbackMatch[1];
        }
      }
    }

    setActiveBarcode(barcode);`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added URL barcode parsing in WorkerApp');
