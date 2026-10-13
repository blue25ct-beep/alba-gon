const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('unsubAuth')) {
  // Inject listener
  content = content.replace('const unsubStatus =', 'const unsubAuth = cloudSyncService.onAuthUpdate((newWorkers) => {\n      setWorkers(newWorkers);\n      storageService.saveSettings({ ...storageService.getSettings(), workers: newWorkers });\n    });\n\n    const unsubStatus =');
  // Inject cleanup
  content = content.replace('unsubStatus();\n    };', 'unsubStatus();\n      unsubAuth();\n    };');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed!');
}
