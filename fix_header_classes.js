const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix classes
content = content.replace(/bg-sage-600/g, 'bg-sage');
content = content.replace(/text-sage-600/g, 'text-sage');
content = content.replace(/bg-sage-500/g, 'bg-sage-deep');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Header classes!');
