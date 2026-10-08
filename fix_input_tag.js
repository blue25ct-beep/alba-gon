const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

for (let i=0; i<lines.length; i++) {
  if (lines[i].trim() === 'type="text"') {
    lines.splice(i, 0, '              <input');
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed search input');
