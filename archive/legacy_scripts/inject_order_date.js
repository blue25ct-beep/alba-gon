const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `loadData();
      if (result.failures.length > 0) {
        setShowFailureModal(true);
      }`;

const newStr = `const successBarcodes = sanitizedItems
        .map(i => i.barcode)
        .filter(b => !result.failures.some(f => f.barcode === b));
      if (successBarcodes.length > 0) {
        storageService.updateProductLastOrderDate(successBarcodes);
      }
      
      loadData();
      if (result.failures.length > 0) {
        setShowFailureModal(true);
      }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added order success date update');
} else {
  console.log('Target string not found');
}
