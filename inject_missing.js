const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const discordHelper = `
  const sendDiscordNotification = (message: string) => {
    const webhookUrl = storageService.getSettings().discordWebhookUrl;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      }).catch(err => console.error('Discord webhook error', err));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastScanTime && !isCheckFinished && audits.length > 0) {
        const diff = Date.now() - lastScanTime;
        if (diff >= 30 * 60 * 1000) { // 30 mins
          const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
          sendDiscordNotification(\`⏰ **[자동 완료 알림]** 30분 동안 추가 스캔이 없어 발주 체크가 완료된 것으로 보입니다!\\n- 근무자: \` + workerName + \`\\n- 분류: \` + vendorLabel + \`\\n- 스캔 수량: 총 \` + audits.length + \`건\\n점장님, PC에서 내역을 확인해 주세요.\`);
          setIsCheckFinished(true);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastScanTime, isCheckFinished, audits.length, workerName, selectedCategory]);
`;

content = content.replace(/useEffect\(\(\) => \{\s*if \(selectedCategory === 'SPCHAIN'\)/, discordHelper + '\n  useEffect(() => {\n    if (selectedCategory === \'SPCHAIN\')');

const completeButtonUI = `
        {audits.length > 0 && !isCheckFinished && (
          <div className="mt-6 mb-2">
            <button
              onClick={() => {
                const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
                sendDiscordNotification(\`🏁 **[발주 완료]** 근무자(\` + workerName + \`)가 발주 체크를 모두 마쳤습니다!\\n- 분류: \` + vendorLabel + \`\\n- 총 스캔 수량: \` + audits.length + \`건\\n최종 발주를 진행해 주세요.\`);
                setIsCheckFinished(true);
                alert('점장님께 완료 알림이 전송되었습니다.');
              }}
              className="w-full h-12 bg-sage-600 hover:bg-sage-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              ✅ 점장님께 발주 완료 알림 보내기
            </button>
          </div>
        )}
`;

content = content.replace(/\{audits\.length === 0 \? \(/, completeButtonUI + '\n        {audits.length === 0 ? (');

fs.writeFileSync(file, content, 'utf8');
console.log('Injected missing parts!');
