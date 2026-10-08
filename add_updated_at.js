const fs = require('fs');

// 1. types.ts
let typesContent = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/types.ts', 'utf8');
if (!typesContent.includes('updatedAt?: string;') && typesContent.includes('isNewProduct?: boolean;')) {
    typesContent = typesContent.replace('isNewProduct?: boolean;', 'isNewProduct?: boolean;\n  updatedAt?: string;');
    fs.writeFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/types.ts', typesContent, 'utf8');
}

// 2. storage.ts
let storageContent = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts', 'utf8');

// addProduct
storageContent = storageContent.replace(
    'list[index] = { ...list[index], ...product };',
    'list[index] = { ...list[index], ...product, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) };'
);
storageContent = storageContent.replace(
    'list.unshift(product);',
    'list.unshift({ ...product, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) });'
);

// updateProductMinOrderQty
storageContent = storageContent.replace(
    'list[idx] = { ...list[idx], minOrderQty: safeVal };',
    'list[idx] = { ...list[idx], minOrderQty: safeVal, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) };'
);

// importExcelFile
storageContent = storageContent.replace(
    'map.set(p.barcode, { ...map.get(p.barcode), ...p });',
    'map.set(p.barcode, { ...map.get(p.barcode), ...p, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) });'
);

fs.writeFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts', storageContent, 'utf8');

// 3. ProductStockSetupModal.tsx
let modalContent = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx', 'utf8');

modalContent = modalContent.replace(
    'p.barcode === barcode ? { ...p, [field]: Math.max(1, val) } : p',
    'p.barcode === barcode ? { ...p, [field]: Math.max(1, val), updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) } : p'
);

modalContent = modalContent.replace(
    'filteredBarcodes.has(p.barcode) ? { ...p, targetStock: batchTargetStock } : p',
    'filteredBarcodes.has(p.barcode) ? { ...p, targetStock: batchTargetStock, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) } : p'
);

modalContent = modalContent.replace(
    'filteredBarcodes.has(p.barcode) ? { ...p, minOrderQty: batchMinOrderQty } : p',
    'filteredBarcodes.has(p.barcode) ? { ...p, minOrderQty: batchMinOrderQty, updatedAt: new Date().toLocaleString(\'ko-KR\', { month: \'numeric\', day: \'numeric\', hour: \'2-digit\', minute: \'2-digit\' }) } : p'
);

modalContent = modalContent.replace(
    '{p.barcode} · {p.category}',
    '{p.barcode} · {p.category}{p.updatedAt ? ` · ✏️ 수정: ${p.updatedAt}` : \'\'}'
);

fs.writeFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx', modalContent, 'utf8');

console.log('Update complete');
