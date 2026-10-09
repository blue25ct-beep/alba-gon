const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        </div>
        </div>
        <div className="flex items-baseline justify-between">`;
        
const replacement = `        </div>
        <div className="flex items-baseline justify-between">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed extra </div>');
} else {
  console.log('Could not find target');
}
