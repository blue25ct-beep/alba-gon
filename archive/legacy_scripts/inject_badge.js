const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{masterProduct?.updatedAt && (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      )}`;

const newStr = `{masterProduct?.updatedAt && (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      )}
                                      {masterProduct?.lastOrderDate && (
                                        <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                          📦 마지막 발주: {masterProduct.lastOrderDate}
                                        </span>
                                      )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added order date badge');
}
