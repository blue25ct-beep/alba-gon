const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/services/unifiedOrderService.ts';
let content = fs.readFileSync(file, 'utf8');

// Change the fallback store ID for Younme back to '1060'
content = content.replace(
    "const storeId = isYounme ? (settings.younmeId || '047458') : 'SPCHAIN_047458';",
    "const storeId = isYounme ? (settings.younmeId || '1060') : 'SPCHAIN_047458';"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed fallback store ID to 1060');
