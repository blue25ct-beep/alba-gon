const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import * as XLSX')) {
    content = content.replace(`import { storageService }`, `import * as XLSX from 'xlsx';\nimport { storageService }`);
}

// Add handleExcelDownload
const newFunc = `  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {`;
const insertFunc = `  const handleExcelDownload = () => {
    const products = storageService.getProducts();
    if (products.length === 0) {
      alert('내보낼 상품 데이터가 없습니다.');
      return;
    }

    const data = products.map(p => ({
      '바코드': p.barcode,
      '상품명': p.name,
      '카테고리': p.category,
      '매가': p.price,
      '원가': p.cost,
      '목표재고': p.targetStock,
      '최소발주단위': p.minOrderQty
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '마스터_상품목록');
    XLSX.writeFile(wb, \`알바곤_상품마스터_\${new Date().toISOString().slice(0,10)}.xlsx\`);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {`;

content = content.replace(newFunc, insertFunc);

// Add Button
const oldButtonRow = `        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken cursor-pointer transition-colors bg-white border border-line">
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 불러오기
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>`;

const newButtonRow = `        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken cursor-pointer transition-colors bg-white border border-line">
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 불러오기
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>
        
        <button
          onClick={handleExcelDownload}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors bg-white border border-blue-200"
        >
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 내보내기
        </button>`;

content = content.replace(oldButtonRow, newButtonRow);

fs.writeFileSync(file, content, 'utf8');
console.log('Added Excel Export feature');
