const fs = require('fs');
const path = require('path');

const storageFile = path.join(__dirname, '..', 'client', 'src', 'services', 'storage.ts');
let code = fs.readFileSync(storageFile, 'utf8');

// 1. saveProducts
code = code.replace(
  /saveProducts\(products: Product\[\]\): void \{[\s\S]*?localStorage\.setItem\(KEYS\.PRODUCTS, JSON\.stringify\(products\)\);[\s\S]*?\},/,
  `saveProducts(products: Product[], syncToApi = true): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    if (syncToApi) {
      // PC 봇 로컬 서버(/api/products)에 비동기로 즉시 저장하여 디스크에 영구 보존
      fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      }).catch(() => {});
    }
  },`
);

// 2. updateProductMinOrderQty
code = code.replace(
  /list\[idx\] = \{ \.\.\.list\[idx\], minOrderQty: safeVal, updatedAt: new Date\(\)\.toLocaleString\('ko-KR', \{ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' \}\) \};/,
  `const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      list[idx] = { 
        ...list[idx], 
        minOrderQty: safeVal, 
        reviewStatus: 'MODIFIED', 
        updatedAt: nowStr 
      };`
);

// 3. updateProductTargetStock
code = code.replace(
  /list\[idx\] = \{ \.\.\.list\[idx\], targetStock: safeVal, updatedAt: new Date\(\)\.toLocaleString\('ko-KR', \{ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' \}\) \};/,
  `const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      list[idx] = { 
        ...list[idx], 
        targetStock: safeVal, 
        reviewStatus: 'MODIFIED', 
        updatedAt: nowStr 
      };`
);

// 4. markProductAsReviewed
code = code.replace(
  /markProductAsReviewed\(barcode: string\): void \{[\s\S]*?if \(idx >= 0\) \{[\s\S]*?list\[idx\] = \{ \.\.\.list\[idx\], updatedAt: new Date\(\)\.toLocaleString\('ko-KR', \{ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' \}\) \};[\s\S]*?this\.saveProducts\(list\);[\s\S]*?\}/,
  `markProductAsReviewed(barcode: string): void {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.barcode === barcode);
    const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (idx >= 0) {
      list[idx] = { 
        ...list[idx], 
        reviewStatus: 'APPROPRIATE', 
        reviewedAt: nowStr, 
        updatedAt: list[idx].updatedAt || nowStr 
      };
      this.saveProducts(list);
    }`
);

fs.writeFileSync(storageFile, code, 'utf8');
console.log('storage.ts successfully updated!');
