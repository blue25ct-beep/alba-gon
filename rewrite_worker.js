const fs = require('fs');

const path = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(path, 'utf8');

// Inject selectedCategory state
content = content.replace(
    "const [sendSuccessMsg, setSendSuccessMsg] = useState(false);",
    "const [sendSuccessMsg, setSendSuccessMsg] = useState(false);\n  const [selectedCategory, setSelectedCategory] = useState<'YOUNME' | 'SPCHAIN' | null>(null);"
);

// Filter audits based on selected category
const filterCode = `
  const isConnected = syncStatus === 'CONNECTED';

  // 필터링: 선택된 카테고리에 맞는 상품만 노출
  const getProductCategory = (barcode: string) => {
    const product = storageService.findProduct(barcode).product;
    return product ? product.category : '상온'; // 기본은 상온
  };

  const filteredAudits = selectedCategory === null ? [] : audits.filter(a => {
    const cat = getProductCategory(a.barcode);
    if (selectedCategory === 'YOUNME') return cat === '상온' || cat === '냉장' || !cat;
    if (selectedCategory === 'SPCHAIN') return cat === '주류';
    return true;
  });

  const unmappedCount = filteredAudits.filter((a) => a.isUnmapped).length;

  if (selectedCategory === null) {
    return (
      <div className="max-w-md mx-auto px-5 py-12 space-y-8 flex flex-col min-h-[80vh] justify-center items-center">
        <h2 className="text-2xl font-bold text-ink mb-4">어떤 작업을 시작할까요?</h2>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => setSelectedCategory('YOUNME')}
            className="w-full h-24 rounded-3xl bg-sage-50 hover:bg-sage-100 border border-sage-200 text-sage-deep font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span>상온 / 냉장</span>
            <span className="text-sm font-medium text-sage opacity-80">(유앤미 발주)</span>
          </button>
          
          <button
            onClick={() => setSelectedCategory('SPCHAIN')}
            className="w-full h-24 rounded-3xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span>주류</span>
            <span className="text-sm font-medium text-blue-600 opacity-80">(생필체인 발주)</span>
          </button>
        </div>
      </div>
    );
  }
`;

content = content.replace(
    "const unmappedCount = audits.filter((a) => a.isUnmapped).length;\n  const isConnected = syncStatus === 'CONNECTED';",
    filterCode.trim()
);

// Add a "back" button to the worker header and replace `audits` with `filteredAudits` for display
// Also replace `audits.length` with `filteredAudits.length`
content = content.replace(/\{audits\.length\}/g, '{filteredAudits.length}');
content = content.replace(/audits\.map\(/g, 'filteredAudits.map(');

// Add the back button next to "오늘 실사 현황"
const backBtnCode = `
      {/* 오늘 실사 현황 */}
      <section>
        <div className="mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1"
          >
            ← 카테고리 선택으로 돌아가기
          </button>
        </div>
        <div className="flex items-baseline justify-between">
`;
content = content.replace(
    "{/* 오늘 실사 현황 */}\n      <section>\n        <div className=\"flex items-baseline justify-between\">",
    backBtnCode.trim()
);

fs.writeFileSync(path, content, 'utf8');
console.log('WorkerApp rewritten');
