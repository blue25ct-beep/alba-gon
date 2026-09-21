const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/BarcodeScanner.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /BarcodeFormat\.CODE_128/;
const replacement = `BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added QR Code support!');
