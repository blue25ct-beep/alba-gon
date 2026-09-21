const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the problematic useEffect
const badUseEffect = `  useEffect(() => {
    if (syncStatus === 'CONNECTED') {
      cloudSyncService.publishAuthList(workers);
    }
  }, [syncStatus, workers]);`;

content = content.replace(badUseEffect, '');

// 2. Add publishAuthList to addWorker
const addWorkerOld = `    const newList = [...workers, { id: newWorkerId, name: newWorkerName }];
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    setNewWorkerName('');
    setNewWorkerId('');`;
const addWorkerNew = `    const newList = [...workers, { id: newWorkerId, name: newWorkerName }];
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    cloudSyncService.publishAuthList(newList);
    setNewWorkerName('');
    setNewWorkerId('');`;
content = content.replace(addWorkerOld, addWorkerNew);

// 3. Add publishAuthList to removeWorker
const removeWorkerOld = `    const newList = workers.filter(w => w.id !== id);
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });`;
const removeWorkerNew = `    const newList = workers.filter(w => w.id !== id);
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    cloudSyncService.publishAuthList(newList);`;
content = content.replace(removeWorkerOld, removeWorkerNew);

// 4. Add onAuthUpdate listener to the main useEffect
const mainUseEffectOld = `    const unsubSync = cloudSyncService.onSync((newAudits) => {
      setAudits(newAudits);
    });`;
const mainUseEffectNew = `    const unsubSync = cloudSyncService.onSync((newAudits) => {
      setAudits(newAudits);
    });
    
    const unsubAuth = cloudSyncService.onAuthUpdate((newWorkers) => {
      setWorkers(newWorkers);
      storageService.saveSettings({ ...storageService.getSettings(), workers: newWorkers });
    });`;
content = content.replace(mainUseEffectOld, mainUseEffectNew);

// 5. Clean up listener
const cleanupOld = `      unsubSync();
      unsubStatus();
      unsubClear();`;
const cleanupNew = `      unsubSync();
      unsubStatus();
      unsubClear();
      unsubAuth();`;
content = content.replace(cleanupOld, cleanupNew);

fs.writeFileSync(file, content, 'utf8');
console.log('AdminDashboard.tsx sync logic fixed!');
