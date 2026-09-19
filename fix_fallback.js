const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/spchain-test/spchainBot.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the second occurrence of evaluate fallback
content = content.replace(
  /item\.finalOrderQty\);/g,
  "Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))));"
);

fs.writeFileSync(file, content, 'utf8');
