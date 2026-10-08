const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `if (successBarcodes.length > 0) storageService.updateProductLastOrderDate(successBarcodes);`;
const newStr = `if (successBarcodes.length > 0) {
        storageService.updateProductLastOrderDate(successBarcodes);
        
        // Add to history
        const successItems = sanitizedItems.filter(i => successBarcodes.includes(i.barcode));
        const totalAmount = successItems.reduce((sum, item) => sum + ((item.cost || 0) * item.finalOrderQty), 0);
        storageService.addOrderHistory({
          id: Date.now().toString(),
          orderDate: new Date().toLocaleString('ko-KR'),
          vendor,
          items: successItems,
          totalAmount
        });
        cloudSyncService.broadcastBackup(); // Ensure backup is updated
      }`;
if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected addOrderHistory into AdminDashboard');
}
