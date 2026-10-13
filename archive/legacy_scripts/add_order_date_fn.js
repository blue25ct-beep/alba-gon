const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  updateProductLastOrderDate(barcodes: string[]): void {
    const list = this.getProducts();
    let updated = false;
    const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    for (let i = 0; i < list.length; i++) {
      if (barcodes.includes(list[i].barcode)) {
        list[i] = { ...list[i], lastOrderDate: nowStr };
        updated = true;
      }
    }
    
    if (updated) {
      this.saveProducts(list);
    }
  },
`;

if (!content.includes('updateProductLastOrderDate')) {
  content = content.replace('updateProductTargetStock(barcode: string, targetStock: number): void {', newMethod + '\n  updateProductTargetStock(barcode: string, targetStock: number): void {');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added updateProductLastOrderDate to storage.ts');
}
