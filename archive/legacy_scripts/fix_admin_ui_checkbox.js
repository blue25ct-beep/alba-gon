const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const searchBarIndex = lines.findIndex(l => l.includes('className="relative w-full md:w-72"'));

if (searchBarIndex !== -1 && !content.includes('💡 수정 기록 없는 상품만 모아보기')) {
  lines[searchBarIndex] = '          <div className="flex flex-col gap-2 w-full md:w-72">\n            <div className="relative w-full">';
  
  const closingDivIndex = lines.findIndex((l, i) => i > searchBarIndex && l.trim() === '</div>');
  const labelHTML = `            <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer md:self-end mt-1">
              <input
                type="checkbox"
                checked={showUnmodifiedOnly}
                onChange={(e) => setShowUnmodifiedOnly(e.target.checked)}
                className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
              />
              💡 수정 기록 없는 상품만 모아보기
            </label>`;
  lines.splice(closingDivIndex, 0, labelHTML);
  lines.splice(closingDivIndex + 2, 0, '          </div>'); // close the flex flex-col container
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Fixed UI insertion!');
}
