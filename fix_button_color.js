const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `className="text-sm font-semibold text-white bg-sage-600 hover:bg-sage-700 flex items-center justify-center gap-1 py-2 px-3 rounded-full shadow-sm transition-colors ml-auto truncate"`;
const newStr = `className="text-sm font-bold text-sage-deep bg-sage-50 hover:bg-sage-100 border border-sage-200 flex items-center justify-center gap-1 py-1.5 px-3 rounded-full transition-colors ml-auto truncate"`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed button color');
} else {
  console.log('Target string not found');
}
