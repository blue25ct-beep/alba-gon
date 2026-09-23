const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/.github/workflows/deploy.yml';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('node-version: 20', 'node-version: 24');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed node version in deploy.yml');
