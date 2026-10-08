const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  markProductAsReviewed(barcode: string): void {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.barcode === barcode);
    if (idx >= 0) {
      list[idx] = { ...list[idx], updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) };
      this.saveProducts(list);
    }
    const audits = this.getAudits();
    const aIdx = audits.findIndex(a => a.barcode === barcode);
    if (aIdx >= 0) {
      audits[aIdx].updatedAt = list[idx]?.updatedAt;
      this.saveAudits(audits);
    }
  },
`;

if (!content.includes('markProductAsReviewed')) {
  content = content.replace('updateProductTargetStock(barcode: string, targetStock: number): void {', newMethod + '\n  updateProductTargetStock(barcode: string, targetStock: number): void {');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added markProductAsReviewed');
}
