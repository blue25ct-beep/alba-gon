const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<\/div>[\s\r\n]*<\/div>[\s\r\n]*<div className="flex items-baseline justify-between">/;
const replacement = `</div>\n        <div className="flex items-baseline justify-between">`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed extra div with regex');
} else {
  console.log('Target not found with regex');
}
