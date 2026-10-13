const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `const data = products.map(p => ({
      '바코드': p.barcode,
      '상품명': p.name,
      '카테고리': p.category,
      '매가': p.price,
      '원가': p.cost,
      '목표재고': p.targetStock,
      '최소발주단위': p.minOrderQty
    }));`;
const newBlock = `const data = products.map(p => ({
      '바코드': p.barcode,
      '상품명': p.name,
      '카테고리': p.category,
      '매가': p.price,
      '원가': p.cost,
      '목표재고': p.targetStock,
      '최소발주단위': p.minOrderQty,
      '마지막수정일': p.updatedAt || '기록없음'
    }));`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated Master DB Excel export');
} else {
    console.log('Could not find block');
}
