const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = 'return { ...DEFAULT_SETTINGS, ...raw };';
const replaceStr = `if (!raw.discordWebhookUrl) {
          raw.discordWebhookUrl = DEFAULT_SETTINGS.discordWebhookUrl;
        }
        return { ...DEFAULT_SETTINGS, ...raw };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed storage override for discord URL');
}
