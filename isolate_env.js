const fs = require('fs');

const files = [
    'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/services/cloudSyncService.ts',
    'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/services/unifiedOrderService.ts',
    'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/albagom\//g, 'albagom-v2/');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
});
