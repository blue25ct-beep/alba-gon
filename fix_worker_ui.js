const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace remaining audits.length with filteredAudits.length in the render block
content = content.replace(/audits\.length > 0/g, 'filteredAudits.length > 0');
content = content.replace(/audits\.length === 0/g, 'filteredAudits.length === 0');

// Also, the back button is missing! Let's inject it right after the App version.
const backBtnCode = `
      {/* 오늘 실사 현황 */}
      <section>
        <div className="mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1"
          >
            ← 카테고리 선택으로 돌아가기
          </button>
        </div>
        <div className="flex items-baseline justify-between">
`;

// Only replace if not already there
if (!content.includes('카테고리 선택으로 돌아가기')) {
    content = content.replace(
        "{/* 오늘 실사 현황 */}\n      <section>\n        <div className=\"flex items-baseline justify-between\">",
        backBtnCode.trim()
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('WorkerApp fixed.');
