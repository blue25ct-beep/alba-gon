const fs = require('fs');

let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');

const badText = '근무자 본인의 <span className="font-bold text-sage">전화번호 뒷자리 4자리</span>를 입력해주세요.<br/><span className="text-blue-500 font-medium text-xs mt-2 inline-block">💡 점장님은 점장 PIN(1234)으로 바로 접속 가능합니다.</span>';
const goodText = '근무자 본인의 <span className="font-bold text-sage">전화번호 뒷자리 4자리</span>를 입력해주세요.<br/><span className="text-blue-500 font-medium text-xs mt-2 inline-block">💡 번호를 모르신다면 점장님께 문의해 주세요.</span>';

workerContent = workerContent.replace(badText, goodText);

fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('WorkerApp.tsx bad text removed');
