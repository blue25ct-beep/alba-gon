const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      if (isFirstScan) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(\`✅ **[발주 시작]** 근무자(\` + workerName + \`)가 \` + vendorLabel + \` 발주 스캔을 시작했습니다.\`);
        
        // 봇 생존 확인
        cloudSyncService.checkBotAlive(2000).then(isAlive => {
          if (!isAlive) {
            sendDiscordNotification(\`🚨 **[긴급 알림]** 발주 봇 서버가 닫혀있습니다! 점장님 PC의 봇 서버를 켜주세요!\`);
          }
        });
      }`;

const newStr = `      if (isFirstScan) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(\`✅ **[발주 시작]** 근무자(\` + workerName + \`)가 \` + vendorLabel + \` 발주 스캔을 시작했습니다.\`);
        
        // 봇 생존 확인
        cloudSyncService.checkBotAlive(2000).then(isAlive => {
          if (!isAlive) {
            sendDiscordNotification(\`🚨 **[긴급 알림]** 발주 봇 서버가 닫혀있습니다! 점장님 PC의 봇 서버를 켜주세요!\`);
          }
        });
      } else if (isCheckFinished) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(\`⚠️ **[발주 추가 진행]** 완료 보고가 끝난 후, 근무자(\` + workerName + \`)가 \` + vendorLabel + \` 상품을 추가로 스캔하기 시작했습니다! 점장님, 발주 넣기 전 추가된 내역을 꼭 확인해 주세요.\`);
      }`;

if (content.includes('if (isFirstScan) {')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected additional scan notification');
} else {
  console.log('Target string not found');
}
