const fs = require('fs');

// Fix AdminDashboard
let adminFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

const hookRegex = /const \[showWorkerModal[\s\S]*?removeWorker\([^\)]+\)[\s\S]*?\};/;
const match = adminContent.match(hookRegex);
if (match) {
  adminContent = adminContent.replace(match[0], ''); // remove from top
  // insert after syncStatus
  adminContent = adminContent.replace('const [syncStatus, setSyncStatus] = useState<SyncStatus>(\'DISCONNECTED\');', 'const [syncStatus, setSyncStatus] = useState<SyncStatus>(\'DISCONNECTED\');\n  ' + match[0]);
  fs.writeFileSync(adminFile, adminContent, 'utf8');
  console.log('Fixed AdminDashboard syncStatus order');
}

// Fix WorkerApp
let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');
workerContent = workerContent.replace('unsubClear();\n      unsubAuth();', 'unsubClear();\n      if(typeof unsubAuth !== "undefined") unsubAuth();');
fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('Fixed WorkerApp unsubAuth');
