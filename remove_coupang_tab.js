const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove COUPANG from state type
content = content.replace(
  "useState<'ALL' | 'YOUNME' | 'SPCHAIN' | 'COUPANG'>",
  "useState<'ALL' | 'YOUNME' | 'SPCHAIN'>"
);

// 2. Remove COUPANG title logic
const titleRegex = /\} else if \(tempFilter === 'COUPANG'\) \{\s*onThemeChange\?\.\('neutral'\);\s*onTitleChange\?\.\('📦 \[수동발주\] 쿠팡 전용 관리'\);\s*\}/;
content = content.replace(titleRegex, '}');

// 3. Remove COUPANG tab button
const tabsRegex = /\['COUPANG', '쿠팡\(수동\)'\],/g;
content = content.replace(tabsRegex, '');

// 4. Remove COUPANG from filteredItems
const filteredRegex = /if \(tempFilter === 'SPCHAIN'\) matchesTemp = \!isYounmeItem && \!isCoupangItem;\s*if \(tempFilter === 'COUPANG'\) matchesTemp = isCoupangItem;/;
content = content.replace(filteredRegex, "if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem && !isCoupangItem;");

// 5. Remove Coupang Order Block
const coupangBlockRegex = /\{\/\* 쿠팡\(수동\) 섹션 \*\/\}\s*\{\(tempFilter === "ALL" \|\| tempFilter === "COUPANG"\) && coupangItems\.length > 0 && \([\s\S]*?\}\s*<\/section>\s*\)\}\s*\{\/\* 생필체인 발주 섹션 \*\/\}/;
content = content.replace(coupangBlockRegex, '{/* 생필체인 발주 섹션 */}');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed Coupang tab and block, kept the link logic.');
