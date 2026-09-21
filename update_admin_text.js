const fs = require('fs');

let adminFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

adminContent = adminContent.replace('placeholder="PIN 4자리"', 'placeholder="전화번호 뒷자리"');
adminContent = adminContent.replace('근무자 관리 (PIN 로그인)', '근무자 관리 (전화번호 뒷자리)');
adminContent = adminContent.replace('<p className="text-sm text-ink-soft mt-1">PIN: {w.id}</p>', '<p className="text-sm text-ink-soft mt-1">전화번호 뒷자리: {w.id}</p>');

fs.writeFileSync(adminFile, adminContent, 'utf8');
console.log('AdminDashboard.tsx text updated');
