const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "vendor: a.vendor,",
    "vendor: audit.vendor,"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed audit.vendor');
