const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{audits.length > 0 && (`;
const restoreButton = `
          {audits.length === 0 && (
            <button
              onClick={handleRestoreAudits}
              className="h-9 px-4 rounded-full font-medium text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
            >
              🚨 삭제된 데이터 복구하기
            </button>
          )}
          `;

if (content.includes(targetStr) && !content.includes('🚨 삭제된 데이터 복구하기')) {
  content = content.replace(targetStr, restoreButton + targetStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added restore button correctly');
} else {
  console.log('Could not add restore button');
}
