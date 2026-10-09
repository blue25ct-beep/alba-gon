const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      const updated = storageService.getAudits();
      setAudits(updated);
      handleCloseModals();

      cloudSyncService.broadcastAudits(updated, 'WORKER');`;

const newStr = `      const isFirstScan = audits.length === 0;
      
      const updated = storageService.getAudits();
      setAudits(updated);
      handleCloseModals();

      cloudSyncService.broadcastAudits(updated, 'WORKER');

      // 첫 스캔일 경우 발주 봇(Admin) 서버가 켜져있는지 생존 확인 (Ping)
      if (isFirstScan) {
        cloudSyncService.checkBotAlive(2000).then(isAlive => {
          if (!isAlive) {
            const webhookUrl = storageService.getSettings().discordWebhookUrl;
            if (webhookUrl) {
              const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
              fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: \`🚨 **[알바곤 긴급 알림]** 발주 봇 서버가 닫혀있습니다!\\n근무자(\\\`\${workerName}\\\`)가 \${vendorLabel} 발주 스캔을 시작했습니다. 스캔 내역이 안전하게 동기화되도록 점장님 PC의 봇 서버를 켜주세요!\`
                })
              }).catch(err => console.error('Discord webhook error', err));
            }
          }
        });
      }`;

if (content.includes('setAudits(updated);')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated WorkerApp.tsx');
}
