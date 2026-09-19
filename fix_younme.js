const fs = require('fs');
let content = fs.readFileSync('C:/Users/김진곤/Downloads/alba-gon/client/src/services/younmeOrderService.ts', 'utf8');

// Patch storeId to SPCHAIN_047458
content = content.replace(/const storeId = settings\.younmeId \|\| '1060';/g, "const storeId = 'SPCHAIN_047458';");

fs.writeFileSync('C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/services/younmeOrderService.ts', content, 'utf8');
