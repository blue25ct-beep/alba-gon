const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<button\s+onClick=\{\(\) => setSelectedCategory\(null\)\}/, '<button type="button" onClick={() => setSelectedCategory(null)}');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed back button type');
