const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('onClick={() => onCategoryChange?.(null)}'));

if (start !== -1) {
  const replacement = `        <div className="mb-4 flex items-center gap-2">
          <button type="button" onClick={() => onCategoryChange?.(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1 bg-surface py-2 px-4 rounded-full border border-line shrink-0"
          >
            ← 뒤로가기
          </button>

          {audits.length > 0 && !isCheckFinished && (
            <button
              onClick={() => {
                const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
                sendDiscordNotification(\`🏁 **[발주 완료]** 근무자(\` + workerName + \`)가 발주 체크를 모두 마쳤습니다!\\n- 분류: \` + vendorLabel + \`\\n- 총 스캔 수량: \` + audits.length + \`건\\n최종 발주를 진행해 주세요.\`);
                setIsCheckFinished(true);
                alert('점장님께 완료 알림이 전송되었습니다.');
              }}
              className="text-sm font-semibold text-white bg-sage-600 hover:bg-sage-700 flex items-center justify-center gap-1 py-2 px-3 rounded-full shadow-sm transition-colors ml-auto truncate"
            >
              ✅ 완료 알림 보내기
            </button>
          )}
        </div>`.split('\n');

  lines.splice(start - 1, 6, ...replacement);
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Successfully injected complete button via lines replace!');
} else {
  console.log('Could not find target');
}
