const fs = require('fs');

let code = fs.readFileSync('client/src/pages/WorkerApp.tsx', 'utf8');

const targetStr = `    // 4. 자동발주 봇 평가 신호 전송
    cloudSyncService.requestAutoOrderEvaluation(filteredAudits, workerName, selectedCategory || '');`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, `    // 4. 자동발주 봇 실행 신호는 점장님 요청으로 비활성화 (점장님이 관리자 화면에서 직접 확인 후 수동 발주)`);
} else {
  code = code.replace(targetStr.replace(/\n/g, '\r\n'), `    // 4. 자동발주 봇 실행 신호는 점장님 요청으로 비활성화 (점장님이 관리자 화면에서 직접 확인 후 수동 발주)`);
}

fs.writeFileSync('client/src/pages/WorkerApp.tsx', code, 'utf8');
console.log('Removed requestAutoOrderEvaluation from WorkerApp.tsx');
