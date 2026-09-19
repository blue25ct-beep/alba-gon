const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/spchain-test/spchainBot.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/item\.name/g, 'item.productName');
content = content.replace(/item\.qty/g, 'item.finalOrderQty');

content = content.replace(
  /type: 'ORDER_RESULT',/g, 
  "type: 'ORDER_RESULT',\n                orderId: payload.orderId,\n                status: result.success ? 'SUCCESS' : 'ERROR',"
);

fs.writeFileSync(file, content, 'utf8');
