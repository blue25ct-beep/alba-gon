const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetUI = `<input
                type="text"
                placeholder="상품명 또는 바코드"`;
const newUI = `<label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showUnmodifiedOnly}
                  onChange={(e) => setShowUnmodifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
                />
                💡 수정 기록 없는 상품만 모아보기
              </label>
              <input
                type="text"
                placeholder="상품명 또는 바코드"`;

if (content.includes(targetUI) && !content.includes('💡 수정 기록 없는 상품만 모아보기')) {
  content = content.replace(targetUI, newUI);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added to setup modal properly');
} else {
  console.log('Failed to add');
}
