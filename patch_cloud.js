const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let content = fs.readFileSync(file, 'utf8');

// Add auth listener type
if (!content.includes('type AuthListener')) {
  content = content.replace('type VoidListener = () => void;', 'type VoidListener = () => void;\ntype AuthListener = (workers: any[]) => void;');
  
  // Add Set
  content = content.replace('private clearListeners:', 'private authListeners: Set<AuthListener> = new Set();\n  private clearListeners:');
  
  // onAuthUpdate
  content = content.replace('public onClear(', 'public onAuthUpdate(listener: AuthListener) {\n    this.authListeners.add(listener);\n    return () => this.authListeners.delete(listener);\n  }\n\n  public onClear(');

  // Subscribing to auth topic
  const subscribeRegex = /this\.client\.subscribe\(\[\s*`\$\{this\.getBaseTopic\(\)\}\/audits`,\s*`\$\{this\.getBaseTopic\(\)\}\/status`\s*\],/;
  const newSubscribe = `this.client.subscribe([
        \`\${this.getBaseTopic()}/audits\`,
        \`\${this.getBaseTopic()}/status\`,
        \`\${this.getBaseTopic()}/auth\`
      ],`;
  content = content.replace(subscribeRegex, newSubscribe);
  
  // Handling message
  const handleMessage = `if (topic.endsWith('/auth')) {
        try {
          const workers = JSON.parse(message.toString());
          this.authListeners.forEach(listener => listener(workers));
        } catch (e) {
          console.error('Failed to parse auth message', e);
        }
        return;
      }
      
      try {`;
  content = content.replace('try {\n        const data = JSON.parse(message.toString());', handleMessage);
  
  // publishAuthList
  const pubAuth = `public publishAuthList(workers: any[]) {
    if (!this.client || !this.client.connected) return;
    const topic = \`\${this.getBaseTopic()}/auth\`;
    this.client.publish(topic, JSON.stringify(workers), { retain: true });
  }\n\n  public disconnect`;
  content = content.replace('public disconnect', pubAuth);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated cloudSyncService.ts');
}
