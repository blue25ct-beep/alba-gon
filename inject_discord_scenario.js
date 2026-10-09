const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add States
if (!content.includes('lastScanTime')) {
  content = content.replace(
    'const [sendSuccessMsg, setSendSuccessMsg] = useState(false);',
    'const [sendSuccessMsg, setSendSuccessMsg] = useState(false);\n  const [lastScanTime, setLastScanTime] = useState<number | null>(null);\n  const [isCheckFinished, setIsCheckFinished] = useState<boolean>(false);'
  );
}

// 2. Add Discord Helper
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
`;
if (!content.includes('sendDiscordNotification')) {
  content = content.replace(
    'useEffect(() => {\n    if (selectedCategory === \'SPCHAIN\')',
    discordHelper + '\n  useEffect(() => {\n    if (selectedCategory === \'SPCHAIN\')'
  );
}

// 3. Add Timeout Effect
const timeoutEffect = `
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
if (!content.includes('30 * 60 * 1000')) {
  content = content.replace(
    'useEffect(() => {\n    if (selectedCategory === \'SPCHAIN\')',
    timeoutEffect + '\n  useEffect(() => {\n    if (selectedCategory === \'SPCHAIN\')'
  );
}

// 4. Update handleSaveQuantity
const regexSave = /const updated = storageService\.getAudits\(\);[\s\S]*?cloudSyncService\.broadcastAudits\(updated, 'WORKER'\);/;
const replacementSave = `const isFirstScan = audits.length === 0;
      
      const updated = storageService.getAudits();
      setAudits(updated);
      handleCloseModals();

      cloudSyncService.broadcastAudits(updated, 'WORKER');
      
      setLastScanTime(Date.now());
      setIsCheckFinished(false);

      if (isFirstScan) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(\`✅ **[발주 시작]** 근무자(\` + workerName + \`)가 \` + vendorLabel + \` 발주 스캔을 시작했습니다.\`);
        
        // 봇 생존 확인
        cloudSyncService.checkBotAlive(2000).then(isAlive => {
          if (!isAlive) {
            sendDiscordNotification(\`🚨 **[긴급 알림]** 발주 봇 서버가 닫혀있습니다! 점장님 PC의 봇 서버를 켜주세요!\`);
          }
        });
      }`;
if (!content.includes('const isFirstScan = audits.length === 0;')) {
  content = content.replace(regexSave, replacementSave);
}

// 5. Inject Complete Button UI
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

const listTarget = `{audits.length === 0 ? (`;
if (!content.includes('✅ 점장님께 발주 완료 알림 보내기')) {
  content = content.replace(listTarget, completeButtonUI + '\n        ' + listTarget);
}

fs.writeFileSync(file, content, 'utf8');
console.log('WorkerApp fully updated with Discord Scenario');
