const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "result = await runDirectOrderAdd({ items, credentials: { id: STORE_ID, pw: process.env.YOUNME_PASSWORD } }, sendProgress);",
    "result = await runDirectOrderAdd(items, sendProgress);"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed unifiedBot.js args');
