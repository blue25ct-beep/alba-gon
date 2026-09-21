const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update state type
content = content.replace(
  "useState<'ALL' | 'YOUNME' | 'SPCHAIN'>",
  "useState<'ALL' | 'YOUNME' | 'SPCHAIN' | 'COUPANG'>"
);

// 2. Update useEffect titles
const titleRegex = /onTitleChange\?\.\('🍺 \[주류 전용\] 자동발주 관리'\);\s*\} else if \(tempFilter === 'YOUNME'\) \{\s*onThemeChange\?\.\('sage'\);\s*onTitleChange\?\.\('🌿 \[상온\/냉장\] 자동발주 관리'\);\s*\}/;
const newTitle = `onTitleChange?.('🍺 [주류 전용] 자동발주 관리');
    } else if (tempFilter === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 자동발주 관리');
    } else if (tempFilter === 'COUPANG') {
      onThemeChange?.('neutral');
      onTitleChange?.('📦 [수동발주] 쿠팡 전용 관리');
    }`;
content = content.replace(titleRegex, newTitle);

// 3. Update tabs array
const tabsRegex = /\['SPCHAIN', '생필체인\(주류\)'\],/g;
const newTabs = `['SPCHAIN', '생필체인(주류)'],\n                ['COUPANG', '쿠팡(수동)'],`;
content = content.replace(tabsRegex, newTabs);

// 4. Update coupangItems filtering
const coupangItemsRegex = /const coupangItems = allItemsToOrder\.filter\(\(item\) => item\.productName\.includes\('쿠팡\]'\)\);/;
const newCoupangItems = `const coupangItems = allItemsToOrder.filter((item) => item.productName.includes('쿠팡]') || item.productName.startsWith('CP]'));`;
content = content.replace(coupangItemsRegex, newCoupangItems);

const itemsToOrderRegex = /const itemsToOrder = allItemsToOrder\.filter\(\(item\) => !item\.productName\.includes\('쿠팡\]'\)\);/;
const newItemsToOrder = `const itemsToOrder = allItemsToOrder.filter((item) => !item.productName.includes('쿠팡]') && !item.productName.startsWith('CP]'));`;
content = content.replace(itemsToOrderRegex, newItemsToOrder);

// 5. Update filteredItems logic
const filteredItemsRegex = /const isYounmeItem = item\.vendor === 'younme' \|\| \(\!item\.vendor && \(item\.category === '상온' \|\| item\.category === '냉장' \|\| \!item\.category\)\);\s*if \(tempFilter === 'YOUNME'\) matchesTemp = isYounmeItem;\s*if \(tempFilter === 'SPCHAIN'\) matchesTemp = \!isYounmeItem;/;
const newFilteredItems = `const isCoupangItem = item.productName.includes('쿠팡]') || item.productName.startsWith('CP]');
    const isYounmeItem = !isCoupangItem && (item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));
    
    if (tempFilter === 'YOUNME') matchesTemp = isYounmeItem;
    if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem && !isCoupangItem;
    if (tempFilter === 'COUPANG') matchesTemp = isCoupangItem;`;
content = content.replace(filteredItemsRegex, newFilteredItems);

// 6. Add Coupang order block
const spchainBlockRegex = /\{\/\* 생필체인 발주 섹션 \*\/\}/;
const newCoupangBlock = `{/* 쿠팡(수동) 섹션 */}
        {(tempFilter === "ALL" || tempFilter === "COUPANG") && coupangItems.length > 0 && (
        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink mb-2">📦 쿠팡 수동 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              자동 발주가 불가능한 쿠팡 전용 상품들입니다. (목록의 구매 링크를 눌러주세요)
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-ink-faint" />
                <span className="text-sm font-medium text-ink">{coupangItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled
              className="h-10 px-6 rounded-full bg-sunken text-ink-faint text-sm font-medium transition-colors"
            >
              수동 발주 전용
            </button>
          </div>
        </section>
        )}
        
        {/* 생필체인 발주 섹션 */}`;
content = content.replace(spchainBlockRegex, newCoupangBlock);

// 7. Add Purchase link button to table row
const itemBarcodeRegex = /\{item\.usingAliasBarcode && ` → \$\{item\.usingAliasBarcode\}`\}\s*<\/span>\s*<\/span>/;
const newItemBarcode = `{item.usingAliasBarcode && \` → \${item.usingAliasBarcode}\`}
                                </span>
                                {(item.productName.includes('쿠팡]') || item.productName.startsWith('CP]')) && (
                                  <a
                                    href={\`https://www.coupang.com/np/search?component=&q=\${encodeURIComponent(item.productName.replace('쿠팡]', '').replace('CP]', '').trim())}\`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  >
                                    쿠팡 구매 링크
                                  </a>
                                )}
                              </span>`;
content = content.replace(itemBarcodeRegex, newItemBarcode);

fs.writeFileSync(file, content, 'utf8');
console.log('Added Coupang tab and logic!');
