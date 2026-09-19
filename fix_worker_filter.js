const fs = require('fs');

let fileWorker = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let contentWorker = fs.readFileSync(fileWorker, 'utf8');

const oldFilter = `  const filteredAudits = selectedCategory === null ? [] : audits.filter((a: AuditItem) => {
    const cat = getProductCategory(a.barcode);
    if (selectedCategory === 'YOUNME') return cat === '상온' || cat === '냉장' || !cat;
    if (selectedCategory === 'SPCHAIN') return cat === '주류';
    return true;
  });`;

const newFilter = `  const filteredAudits = selectedCategory === null ? [] : audits.filter((a: AuditItem) => {
    const cat = getProductCategory(a.barcode);
    if (selectedCategory === 'YOUNME') return a.vendor === 'younme' || (!a.vendor && (cat === '상온' || cat === '냉장' || !cat));
    if (selectedCategory === 'SPCHAIN') return a.vendor === 'spchain' || (!a.vendor && cat === '주류');
    return true;
  });`;

contentWorker = contentWorker.replace(oldFilter, newFilter);
fs.writeFileSync(fileWorker, contentWorker, 'utf8');

console.log('Fixed WorkerApp filter logic');
