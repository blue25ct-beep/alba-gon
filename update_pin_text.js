const fs = require('fs');

let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');

const oldText = '점장님이 발급한 고유번호(PIN) 또는 점장 PIN을 입력해주세요.<br/><span className="text-blue-500 font-medium">💡 근무자 핀 번호를 모르신다면 점장님께 문의해 주세요.</span>';
const newText = '근무자 본인의 <span className="font-bold text-sage">전화번호 뒷자리 4자리</span>를 입력해주세요.<br/><span className="text-blue-500 font-medium text-xs mt-2 inline-block">💡 점장님은 점장 PIN(1234)으로 바로 접속 가능합니다.</span>';

workerContent = workerContent.replace(oldText, newText);
workerContent = workerContent.replace('placeholder="PIN 번호 입력"', 'placeholder="전화번호 뒷자리 4자리"');

fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('WorkerApp.tsx text updated');
