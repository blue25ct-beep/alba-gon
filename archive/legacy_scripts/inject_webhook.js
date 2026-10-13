const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const target = 'autoOrderEnabled: true,';
const replacement = `autoOrderEnabled: true,\n  discordWebhookUrl: 'https://discord.com/api/webhooks/1553037652343783444/te4HYGxp_kSj_NIKKX7yqCHdgidUzLs_wqoqTKyKHQe40x8kN6DBg0z-sKVM33s91_TW',`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Injected Discord URL into DEFAULT_SETTINGS');
