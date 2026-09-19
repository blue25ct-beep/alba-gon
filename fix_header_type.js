const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /title\?\:\s*string;[\r\n\s]*\}/,
    "title?: string;\n  theme?: 'sage' | 'blue';\n}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HeaderProps!');
