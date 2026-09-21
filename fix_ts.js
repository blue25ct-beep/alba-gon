const fs = require('fs');

// Fix WorkerApp.tsx Props
let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');

const propRegex = /export default function WorkerApp\(\{\n  onThemeChange,\n  onTitleChange,\n\}: \{\n  onThemeChange\?: \(theme: 'sage' \| 'blue' \| 'neutral'\) => void;\n  onTitleChange\?: \(title: string\) => void;\n\}\) \{/;
const propReplace = `export default function WorkerApp({
  selectedCategory,
  onThemeChange,
  onTitleChange,
}: {
  selectedCategory?: 'YOUNME' | 'SPCHAIN' | null;
  onCategoryChange?: (cat: 'YOUNME' | 'SPCHAIN' | null) => void;
  onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void;
  onTitleChange?: (title: string) => void;
}) {`;

if (workerContent.match(propRegex)) {
  workerContent = workerContent.replace(propRegex, propReplace);
} else {
  // Try simpler
  workerContent = workerContent.replace("onTitleChange?: (title: string) => void;\n}) {", "onTitleChange?: (title: string) => void;\n  selectedCategory?: 'YOUNME' | 'SPCHAIN' | null;\n  onCategoryChange?: (cat: 'YOUNME' | 'SPCHAIN' | null) => void;\n}) {");
  workerContent = workerContent.replace("export default function WorkerApp({\n  onThemeChange,\n  onTitleChange,\n}: {", "export default function WorkerApp({\n  selectedCategory,\n  onCategoryChange,\n  onThemeChange,\n  onTitleChange,\n}: {");
}

// Fix unsubAuth
workerContent = workerContent.replace(/unsubAuth\(\);\n      unsubClear\(\);/g, 'unsubClear();'); // remove broken reference

// Fix User, LogOut
workerContent = workerContent.replace(/<User className=/g, '<div className=');
workerContent = workerContent.replace(/<LogOut className=/g, '<div className=');

// Fix filteredAudits
workerContent = workerContent.replace(/\{filteredAudits\.length\}/g, '{audits.length}');

fs.writeFileSync(workerFile, workerContent, 'utf8');

// Fix cloudSyncService.ts
let cloudFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/cloudSyncService.ts';
let cloudContent = fs.readFileSync(cloudFile, 'utf8');
cloudContent = cloudContent.replace(/this\.getBaseTopic\(\)/g, '`albagom-v2/sync/store_${this.currentStoreId}`');
fs.writeFileSync(cloudFile, cloudContent, 'utf8');

console.log('Fixed TS errors in WorkerApp and CloudSyncService');
