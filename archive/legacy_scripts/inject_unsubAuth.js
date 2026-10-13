const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const onClearIdx = lines.findIndex(l => l.includes('cloudSyncService.onClear'));
if (onClearIdx !== -1) {
  const listener = `
    const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });
  `;
  lines.splice(onClearIdx, 0, listener);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Injected unsubAuth listener');
} else {
  console.log('cloudSyncService.onClear not found');
}
