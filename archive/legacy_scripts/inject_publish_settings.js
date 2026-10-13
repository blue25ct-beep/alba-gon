const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/SettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `    storageService.saveSettings({
      younmeId: younmeId.trim(),
      younmePw: younmePw.trim(),
      managerPin: managerPin.trim() || '1234',
      workerName: workerName.trim() || '야간알바',
      discordWebhookUrl: discordWebhookUrl.trim(),
    });`;

const newStr = `    const updatedSettings = {
      younmeId: younmeId.trim(),
      younmePw: younmePw.trim(),
      managerPin: managerPin.trim() || '1234',
      workerName: workerName.trim() || '야간알바',
      discordWebhookUrl: discordWebhookUrl.trim(),
    };
    storageService.saveSettings(updatedSettings);
    // 봇 독립 실행을 위해 설정(계정 정보 포함)을 동기화
    import('../services/cloudSyncService').then(({ cloudSyncService }) => {
      cloudSyncService.publishSettings(updatedSettings);
    });`;

if (content.includes('younmeId: younmeId.trim(),')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected publishSettings to SettingsModal');
} else {
  console.log('Target string not found');
}
