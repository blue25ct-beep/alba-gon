const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const handlerStr = `
  const handleMarkReviewed = (barcode: string) => {
    storageService.markProductAsReviewed(barcode);
    cloudSyncService.broadcastProductsUpdate('ADMIN');
    loadData();
  };
`;
if (!content.includes('handleMarkReviewed')) {
  content = content.replace('const handleTargetStockChange =', handlerStr + '\n  const handleTargetStockChange =');
}

const uiTarget = `{masterProduct?.updatedAt && (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      )}`;
const newUi = `{masterProduct?.updatedAt ? (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleMarkReviewed(item.barcode)}
                                          className="text-[11px] text-white bg-sage-500 hover:bg-sage-600 px-1.5 py-0.5 rounded font-medium transition-colors shadow-sm"
                                        >
                                          ✅ 현재 값 적절함
                                        </button>
                                      )}`;

if (content.includes(uiTarget) && !content.includes('✅ 현재 값 적절함')) {
  content = content.replace(uiTarget, newUi);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added handleMarkReviewed to AdminDashboard');
}
