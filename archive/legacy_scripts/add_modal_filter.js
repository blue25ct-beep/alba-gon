const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const stateStart = lines.findIndex(l => l.includes('const [searchQuery'));
lines.splice(stateStart + 1, 0, '  const [showUnmodifiedOnly, setShowUnmodifiedOnly] = useState(false);');

const filterStart = lines.findIndex(l => l.includes('const matchesSearch ='));
lines.splice(filterStart, 0, '    if (showUnmodifiedOnly && p.updatedAt) return false;');

const uiStart = lines.findIndex(l => l.includes('placeholder="상품명 또는 바코드"'));
const ui = `              <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showUnmodifiedOnly}
                  onChange={(e) => setShowUnmodifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
                />
                💡 수정 기록 없는 상품만 모아보기
              </label>`;
lines.splice(uiStart - 1, 0, ui);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done modal!');
