const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('type AuthListener')) {
  // Add listener type
  content = content.replace('type VoidListener = () => void;', 'type VoidListener = () => void;\ntype AuthListener = (workers: any[]) => void;');
  
  // Add property
  content = content.replace('private syncListeners:', 'private authListeners: Set<AuthListener> = new Set();\n  private syncListeners:');
  
  // Add onAuthUpdate
  content = content.replace('public onSync(', 'public onAuthUpdate(listener: AuthListener) {\n    this.authListeners.add(listener);\n    return () => this.authListeners.delete(listener);\n  }\n\n  public onSync(');

  // Subscribe to auth
  const subscribeRegex = /this\.client\.subscribe\(\[\s*`albagom-v2\/sync\/store_\$\{this\.currentStoreId\}\/audits`,\s*`albagom-v2\/sync\/store_\$\{this\.currentStoreId\}\/status`\s*\],/;
  const newSubscribe = `this.client.subscribe([
        \`albagom-v2/sync/store_\${this.currentStoreId}/audits\`,
        \`albagom-v2/sync/store_\${this.currentStoreId}/status\`,
        \`albagom-v2/sync/store_\${this.currentStoreId}/auth\`
      ],`;
  content = content.replace(subscribeRegex, newSubscribe);
  
  // Handle /auth
  const handleAuth = `if (topic.endsWith('/auth')) {
        try {
          const workers = JSON.parse(message.toString());
          this.authListeners.forEach(listener => listener(workers));
        } catch (e) {
          console.error('[CloudSync] Auth parse error:', e);
        }
        return;
      }
      
      try {`;
  content = content.replace('try {\n        const data = JSON.parse(message.toString());', handleAuth);
  
  // Publish Auth List
  const pubAuth = `public publishAuthList(workers: any[]) {
    if (!this.client || !this.client.connected) return;
    const topic = \`albagom-v2/sync/store_\${this.currentStoreId}/auth\`;
    this.client.publish(topic, JSON.stringify(workers), { retain: true });
  }\n\n  public disconnect`;
  content = content.replace('public disconnect', pubAuth);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('cloudSyncService.ts patched');
} else {
  console.log('cloudSyncService.ts already patched');
}
