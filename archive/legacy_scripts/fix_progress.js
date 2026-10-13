const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const sendProgress = \(status, percent, msg\) => \{/;
const replacement = `const sendProgress = (arg1, arg2, arg3) => {
    let status, percent, msg;
    if (typeof arg1 === 'object') {
      status = arg1.status || 'PROCESSING';
      percent = arg1.percent;
      msg = arg1.message;
    } else {
      status = arg1;
      percent = arg2;
      msg = arg3;
    }`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed sendProgress in unifiedBot.js');
