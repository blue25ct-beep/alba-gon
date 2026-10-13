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
const tabsRegex = /\['SPCHAIN', '생필체인\(주류\)'\],/;
const newTabs = `['SPCHAIN', '생필체인(주류)'],\n                ['COUPANG', '쿠팡(수동)'],`;
content = content.replace(tabsRegex, newTabs);

// 4. Update filteredItems logic
const filteredItemsRegex = /if \(tempFilter === 'SPCHAIN'\) matchesTemp = \!isYounmeItem && \!isCoupangItem;/;
const newFilteredItems = `if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem && !isCoupangItem;
    if (tempFilter === 'COUPANG') matchesTemp = isCoupangItem;`;
content = content.replace(filteredItemsRegex, newFilteredItems);

fs.writeFileSync(file, content, 'utf8');
console.log('Added Coupang tab back');
