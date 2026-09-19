const fs = require('fs');

let fileWorker = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let contentWorker = fs.readFileSync(fileWorker, 'utf8');
contentWorker = contentWorker.replace(
    "onTitleChange?.('🏢 편의점 자동발주 통합 발주');",
    "onTitleChange?.('🏢 편의점 통합 자동발주');"
);
fs.writeFileSync(fileWorker, contentWorker, 'utf8');

let fileAdmin = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let contentAdmin = fs.readFileSync(fileAdmin, 'utf8');
contentAdmin = contentAdmin.replace(
    "onTitleChange?.('🏢 편의점 자동발주 통합 관리');",
    "onTitleChange?.('🏢 편의점 통합 자동발주 관리');"
);
fs.writeFileSync(fileAdmin, contentAdmin, 'utf8');

console.log('Fixed double words');
