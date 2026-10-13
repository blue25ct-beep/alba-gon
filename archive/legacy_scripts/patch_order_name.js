const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/orderEngine.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const addPath = `\/\$\{folder\}\/orderAdd\.asp\?order_dev=j&dev=\$\{determinedCs\}&order_type=1&pcode=\$\{targetBarcode\}&quantity=\$\{item\.finalOrderQty\}&unit=\$\{determinedUnit\}&price=\$\{determinedPrice\}&order_date=\$\{orderDate\}&valid=y`;/;

const replacement = `// product_name 파라미터 추가 (유앤미 본사 사이트 누락 방지)
      const escapedName = escape(item.productName.replace(/\\+/g, '***'));
      const addPath = \`/\${folder}/orderAdd.asp?order_dev=j&dev=\${determinedCs}&order_type=1&pcode=\${targetBarcode}&quantity=\${item.finalOrderQty}&unit=\${determinedUnit}&price=\${determinedPrice}&order_date=\${orderDate}&product_name=\${escapedName}&valid=y\`;`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed missing product_name in orderEngine.js');
