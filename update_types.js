const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/types.ts';
let content = fs.readFileSync(file, 'utf8');

// Update AppSettings
if (!content.includes('discordWebhookUrl?: string;')) {
  content = content.replace(
    'autoOrderEnabled: boolean;',
    'autoOrderEnabled: boolean;\n  discordWebhookUrl?: string;'
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Updated types.ts');
