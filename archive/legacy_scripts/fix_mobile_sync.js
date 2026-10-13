const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldListener = `    const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });`;

const newListener = `    const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      
      const settings = storageService.getSettings();
      storageService.saveSettings({ ...settings, workers });

      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });`;

content = content.replace(oldListener, newListener);
fs.writeFileSync(file, content, 'utf8');
console.log('WorkerApp.tsx sync listener fixed');
