const fs = require('fs');

// Fix types.ts
let typesFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/types.ts';
let typesContent = fs.readFileSync(typesFile, 'utf8');
typesContent = typesContent.replace(/\\n/g, '\n'); // remove literal \n
typesContent = typesContent.replace('workerName: string;\n  workers?: WorkerAuth[];', 'workerName: string;');
typesContent = typesContent.replace('workerName: string;         // 공용폰 알바 기본 이름', 'workerName: string;         // 공용폰 알바 기본 이름\n  workers?: WorkerAuth[];');
fs.writeFileSync(typesFile, typesContent, 'utf8');


// Fix AdminDashboard.tsx
let adminFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');
adminContent = adminContent.replace(/AlertTriangle,\\n  Users,\\n  Key,/, 'AlertTriangle,\n  Users,\n  Key,');
fs.writeFileSync(adminFile, adminContent, 'utf8');

console.log('Fixed types and AdminDashboard');
