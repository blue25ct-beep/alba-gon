const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the filter logic
content = content.replace(
    /if \(tempFilter === 'AMBIENT'\) matchesTemp = !isChilled;[\r\n\s]+if \(tempFilter === 'CHILLED'\) matchesTemp = isChilled;/,
    "const isYounmeItem = item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category));\n      if (tempFilter === 'YOUNME') matchesTemp = isYounmeItem;\n      if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem;"
);

// Replace the tabs
content = content.replace(
    /\['AMBIENT', '상온'\],[\r\n\s]+\['CHILLED', '냉장'\],/,
    "['YOUNME', '유앤미24'],\n                ['SPCHAIN', '생필체인(주류)'],"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed TypeScript errors');
