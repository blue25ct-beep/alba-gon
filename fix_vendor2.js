const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('vendor: a.vendor')) {
    content = content.replace(
        "category: product ? product.category : '기타',",
        "category: product ? product.category : '기타',\n          vendor: a.vendor,"
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed vendor assignment in AdminDashboard');
} else {
    console.log('Already fixed');
}
