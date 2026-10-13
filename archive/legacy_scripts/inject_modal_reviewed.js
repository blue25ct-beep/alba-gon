const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const handlerStr = `
  const handleMarkReviewed = (barcode: string) => {
    storageService.markProductAsReviewed(barcode);
    setProducts(storageService.getProducts());
    onUpdated();
  };
`;
if (!content.includes('handleMarkReviewed')) {
  content = content.replace('const handleItemChange =', handlerStr + '\n  const handleItemChange =');
}

const uiTarget = `{p.barcode} · {p.category}{p.updatedAt ? \` · ✏️ 수정: \${p.updatedAt}\` : ''}{p.lastOrderDate ? \` · 📦 발주: \${p.lastOrderDate}\` : ''}`;
const newUi = `{p.barcode} · {p.category}
                      {p.updatedAt ? (
                        \` · ✏️ 수정: \${p.updatedAt}\`
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(p.barcode)}
                          className="ml-2 inline-flex text-[11px] text-white bg-sage-500 hover:bg-sage-600 px-1.5 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"
                        >
                          ✅ 적절함
                        </button>
                      )}
                      {p.lastOrderDate ? \` · 📦 발주: \${p.lastOrderDate}\` : ''}`;

if (content.includes(uiTarget) && !content.includes('✅ 적절함')) {
  content = content.replace(uiTarget, newUi);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added handleMarkReviewed to modal');
}
