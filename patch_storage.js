const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('export interface WorkerAuth')) {
  content = content.replace('export interface Settings {', 'export interface WorkerAuth {\n  id: string;\n  name: string;\n}\n\nexport interface Settings {');
  content = content.replace('workerName: string;', 'workerName: string;\n  workers: WorkerAuth[];');
  
  content = content.replace("workerName: '주간알바',", "workerName: '주간알바',\n      workers: [],");
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated storage.ts');
}
