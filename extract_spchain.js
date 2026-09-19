const fs = require('fs');
const src = 'C:/Users/김진곤/Downloads/alba-gon/spchain-test/spchainBot.js';
const dest = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/spchainEngine.js';
let content = fs.readFileSync(src, 'utf8');

content = content.replace('async function processSpchainOrder', 'async function runSpchainOrder');

const endIdx = content.indexOf('client.on(\'message\'');
if (endIdx !== -1) {
    content = content.substring(0, endIdx);
}

content += '\nmodule.exports = { runSpchainOrder };\n';

fs.writeFileSync(dest, content, 'utf8');
console.log('spchainEngine.js created');
