const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                                  {item.barcode}
                                  {item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}
                                </span>`;

const newStr = `{(() => {
                                  const masterProduct = products.find(p => p.barcode === item.barcode);
                                  return (
                                    <span className="block mt-0.5 text-[13px] text-ink-faint tabular flex flex-wrap items-center gap-2">
                                      <span>
                                        {item.barcode}
                                        {item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}
                                      </span>
                                      {masterProduct?.updatedAt && (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })()}`;

// We will just find `{item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}`
const indexOfAlias = content.indexOf('{item.usingAliasBarcode && ` → ${item.usingAliasBarcode}`}');

if (indexOfAlias !== -1 && !content.includes('✏️ 수정됨')) {
    // get the start of the span
    const spanStart = content.lastIndexOf('<span className="block mt-0.5 text-[13px] text-ink-faint tabular">', indexOfAlias);
    const spanEnd = content.indexOf('</span>', indexOfAlias) + 7;
    
    const before = content.substring(0, spanStart);
    const after = content.substring(spanEnd);
    
    content = before + newStr + after;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully injected the updated date UI!');
} else {
    console.log('Could not find the target string or already modified.');
}
