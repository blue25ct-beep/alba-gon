const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/services/unifiedOrderService.ts';
let content = fs.readFileSync(file, 'utf8');

// The block to replace:
/*
      let isBotServerAvailable = false;
      try {
        const ping = await fetch('http://localhost:3001/api/health', { method: 'GET' });
        if (ping.ok) isBotServerAvailable = true;
      } catch {
        isBotServerAvailable = false;
      }

      if (!isBotServerAvailable && (!settings.younmeId || !settings.younmePw)) {
        throw new Error('유앤미24 계정 설정이 필요합니다. 톱니바퀴에서 계정을 입력해주세요.');
      }
*/

// Let's remove the throw new Error. We can just assume MQTT works because unifiedBot handles it!
content = content.replace(
    "if (!isBotServerAvailable && (!settings.younmeId || !settings.younmePw)) {",
    "if (false) {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Removed account requirement check');
