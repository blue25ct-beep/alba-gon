const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `          let addedCount = 0;
          parsedProducts.forEach(p => {
            if (!map.has(p.barcode)) {
              addedCount++;
            }
            map.set(p.barcode, { ...map.get(p.barcode), ...p, updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) });
          });`;

const newStr = `          let addedCount = 0;
          parsedProducts.forEach(p => {
            const existing = map.get(p.barcode);
            if (!existing) {
              addedCount++;
              // 완전 새로운 신상품: updatedAt 기록을 남기지 않아 리스트 최상단에 뜨도록 유도
              map.set(p.barcode, { ...p });
            } else {
              // 기존에 등록된 상품: 점장님이 설정한 목표재고, 발주단위, 체크시간 등은 영구 보존하고 이름과 가격만 최신 엑셀 기준으로 업데이트
              map.set(p.barcode, { 
                ...existing, 
                name: p.name, 
                price: p.price, 
                cost: p.cost 
              });
            }
          });`;

if (content.includes('let addedCount = 0;')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed storage.ts merge logic');
} else {
  console.log('Target string not found');
}
