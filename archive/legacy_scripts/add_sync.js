const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Update broadcastBackup
const backupTarget = `        aliases: storageService.getAliases(),
      }
    };`;
const newBackup = `        aliases: storageService.getAliases(),
        orderHistory: storageService.getOrderHistory(),
      }
    };`;
if (!content.includes('orderHistory: storageService.getOrderHistory()')) {
  content = content.replace(backupTarget, newBackup);
}

// 2. Update RESTORE_DATA handling
const restoreTarget = `if (msg.data.aliases) storageService.saveAliases(msg.data.aliases);`;
const newRestore = `if (msg.data.aliases) storageService.saveAliases(msg.data.aliases);
            if (msg.data.orderHistory) storageService.saveOrderHistory(msg.data.orderHistory);`;
if (!content.includes('if (msg.data.orderHistory)')) {
  content = content.replace(restoreTarget, newRestore);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added orderHistory to cloud sync');
