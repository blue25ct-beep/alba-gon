const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const backBtnCode = `
      <section>
        <div className="mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1 bg-surface py-2 px-4 rounded-full border border-line"
          >
            ← 카테고리 선택으로 돌아가기
          </button>
        </div>
        <div className="flex items-baseline justify-between">
`;

if (!content.includes('카테고리 선택으로 돌아가기')) {
    content = content.replace(
        /<section>\s*<div className="flex items-baseline justify-between">/,
        backBtnCode.trim()
    );
}

fs.writeFileSync(file, content, 'utf8');
