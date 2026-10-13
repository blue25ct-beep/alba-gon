const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("products), [products]);\\n  let filtered", "products), [products]);\n  let filtered");

fs.writeFileSync(file, content, 'utf8');
