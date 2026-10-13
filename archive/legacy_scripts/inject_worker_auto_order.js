const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetAutoStr = 'sendDiscordNotification(`⏰ **[자동 완료 알림]** 30분 동안 추가 스캔이 없어 발주 체크가 완료된 것으로 보입니다!\\n- 근무자: ` + workerName + `\\n- 분류: ` + vendorLabel + `\\n- 스캔 수량: 총 ` + audits.length + `건\\n점장님, PC에서 내역을 확인해 주세요.`);';
const newAutoStr = 'sendDiscordNotification(`⏰ **[스캔 종료]** 30분 무반응으로 스캔이 자동 종료되었습니다. (근무자: ` + workerName + `)\\n봇 서버가 자동 발주 가능 여부를 판별합니다...`);\n          cloudSyncService.requestAutoOrderEvaluation(audits, workerName, selectedCategory || \'\');';

const targetManualStr = 'sendDiscordNotification(`🏁 **[발주 완료]** 근무자(` + workerName + `)가 발주 체크를 모두 마쳤습니다!\\n- 분류: ` + vendorLabel + `\\n- 총 스캔 수량: ` + audits.length + `건\\n최종 발주를 진행해 주세요.`);';
const newManualStr = 'sendDiscordNotification(`🏁 **[스캔 종료]** 근무자(` + workerName + `)가 스캔 완료 버튼을 눌렀습니다.\\n봇 서버가 자동 발주 가능 여부를 판별합니다...`);\n                cloudSyncService.requestAutoOrderEvaluation(audits, workerName, selectedCategory || \'\');';

let replaced = false;
if (content.includes(targetAutoStr)) {
  content = content.replace(targetAutoStr, newAutoStr);
  replaced = true;
} else {
  console.log('Target Auto not found');
}

if (content.includes(targetManualStr)) {
  content = content.replace(targetManualStr, newManualStr);
  replaced = true;
} else {
  console.log('Target Manual not found');
}

if (replaced) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected requestAutoOrderEvaluation to WorkerApp.tsx');
}
