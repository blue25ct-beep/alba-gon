const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBtn = `<button
                onClick={handleClearAllAudits}
                className="h-9 px-4 rounded-full font-medium text-ink-faint hover:text-brick hover:bg-brick-soft transition-colors"
              >
                목록 비우기
              </button>`;
              
const newBtn = `<button
                onClick={() => {
                  if (audits.length === 0) {
                    alert('내보낼 실사 내역이 없습니다.');
                    return;
                  }
                  const data = audits.map(a => ({
                    '바코드': a.barcode,
                    '상품명': a.productName,
                    '분류': a.category || '미분류',
                    '실사수량': a.stockCount,
                    '목표재고': a.targetStock,
                    '최소발주단위': a.minOrderQty,
                    '발주예정수량': a.isUnmapped ? 0 : Math.max(0, a.targetStock - a.stockCount),
                    '근무자': a.workerName || '알 수 없음',
                    '실사시간': a.updatedAt
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, '실사내역');
                  XLSX.writeFile(wb, \`알바곤_실사내역_\${new Date().toISOString().slice(0,10)}.xlsx\`);
                }}
                className="h-9 px-4 rounded-full font-medium text-sage-600 bg-sage-50 hover:bg-sage-100 transition-colors mr-2"
              >
                실사 엑셀 저장
              </button>
              <button
                onClick={handleClearAllAudits}
                className="h-9 px-4 rounded-full font-medium text-ink-faint hover:text-brick hover:bg-brick-soft transition-colors"
              >
                목록 비우기
              </button>`;

content = content.replace(oldBtn, newBtn);
fs.writeFileSync(file, content, 'utf8');
console.log('Added Audit Excel Export');
