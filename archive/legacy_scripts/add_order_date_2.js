const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSpan = `<span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                                  {item.barcode}
                                  {item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}
                                </span>`;

const newSpan = `{(() => {
                                  const masterProduct = products.find(p => p.barcode === item.barcode);
                                  return (
                                    <span className="block mt-0.5 text-[13px] text-ink-faint tabular flex flex-wrap items-center gap-2">
                                      <span>
                                        {item.barcode}
                                        {item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}
                                      </span>
                                      {masterProduct?.updatedAt && (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 설정 변경일: {masterProduct.updatedAt}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })()}`;

content = content.replace(oldSpan, newSpan);
fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing span');
