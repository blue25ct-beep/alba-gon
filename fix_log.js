const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/spchain-test/spchainBot.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /console\.log\(`\[SPChain\] \$\{item\.productName\} \- \$\{item\.finalOrderQty\}개 저장 완료`\);/g,
  "let box = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))); console.log(`[SPChain] ${item.productName} - ${box}박스 (${item.finalOrderQty}병) 저장 완료`);"
);

fs.writeFileSync(file, content, 'utf8');
