const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'audit.targetStock !== undefined ? audit.targetStock : product ? product.targetStock : 10;',
    'audit.targetStock !== undefined ? audit.targetStock : product ? product.targetStock : 1;'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed fallback targetStock in AdminDashboard');
