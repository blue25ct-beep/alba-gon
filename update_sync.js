const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// Update type definition
if (content.includes("'PING' | 'BACKUP_DATA'") && !content.includes("'PONG'")) {
  content = content.replace(
    "| 'PING' | 'BACKUP_DATA'",
    "| 'PING' | 'PONG' | 'BACKUP_DATA'"
  );
}

// Add pingResolvers set
if (!content.includes('private pingResolvers: Set')) {
  content = content.replace(
    'private lastSyncTime: string = \'\';',
    'private lastSyncTime: string = \'\';\n  private pingResolvers: Set<(val: boolean) => void> = new Set();'
  );
}

// Handle PONG in message listener
const pingHandler = `
        if (topic !== topicSync) return;
        try {
          const msg = JSON.parse(payload.toString());
          if (msg.type === 'PONG') {
            this.pingResolvers.forEach(r => r(true));
            this.pingResolvers.clear(); // Clear after resolving
            return;
          }
`;
if (!content.includes("msg.type === 'PONG'")) {
  content = content.replace(
    "if (topic !== topicSync) return;\n        try {\n          const msg: AuditsSyncMessage = JSON.parse(payload.toString());",
    pingHandler + "          // Proceed with other messages\n          if (msg.senderId === this.mySenderId) {\n            return;\n          }"
  );
}

// Add checkBotAlive method
const checkBotAliveMethod = `
  public checkBotAlive(timeoutMs = 3000): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.client || !this.client.connected) {
        resolve(false);
        return;
      }
      
      const timeout = setTimeout(() => {
        this.pingResolvers.delete(resolve);
        resolve(false);
      }, timeoutMs);
      
      this.pingResolvers.add((val) => {
        clearTimeout(timeout);
        this.pingResolvers.delete(resolve);
        resolve(val);
      });
      
      const topicSync = \`albagom-v2/stores/store_\${this.currentStoreId}/audits_sync\`;
      const payload = {
        type: 'PING',
        senderId: this.mySenderId,
        senderRole: 'WORKER',
        storeId: this.currentStoreId,
        timestamp: Date.now(),
        audits: [],
      };
      
      this.client.publish(topicSync, JSON.stringify(payload), { qos: 1 });
    });
  }
`;

if (!content.includes('checkBotAlive(timeoutMs = 3000)')) {
  content = content.replace(
    'public broadcastAudits(',
    checkBotAliveMethod + '\n  public broadcastAudits('
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Updated cloudSyncService.ts for ping/pong');
