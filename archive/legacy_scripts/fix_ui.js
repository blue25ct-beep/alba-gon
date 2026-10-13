const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldText = `<p className="text-sm text-ink-soft mb-8 break-keep">
            근무자 본인의 <span className="font-bold text-sage">전화번호 뒷자리 4자리</span>를 입력해주세요.<br/><span className="text-blue-500 font-medium text-xs mt-2 inline-block">💡 번호를 모르신다면 점장님께 문의해 주세요.</span>
          </p>`;
const newText = `<p className="text-ink-soft mb-8 break-keep">
            전화번호 뒷자리 4자리를 입력해주세요.
          </p>`;

const oldInput = `                placeholder="전화번호 뒷자리 4자리"`;
const newInput = `                placeholder=""`;

content = content.replace(oldText, newText);
content = content.replace(oldInput, newInput);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cluttered UI');
