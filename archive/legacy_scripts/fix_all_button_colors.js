const fs = require('fs');

function replaceInFile(filePath, target, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  } else {
    console.log('Not found in:', filePath);
  }
}

// 1. WorkerApp.tsx
const workerAppPath = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
replaceInFile(
  workerAppPath,
  'className="text-sm font-bold text-sage-deep bg-sage-50 hover:bg-sage-100 border border-sage-200 flex items-center justify-center gap-1 py-1.5 px-3 rounded-full transition-colors ml-auto truncate"',
  'className="text-sm font-bold text-white bg-sage hover:bg-sage-deep flex items-center justify-center gap-1 py-1.5 px-4 rounded-full shadow-sm transition-colors ml-auto truncate"'
);

// 2. AdminDashboard.tsx
const adminDashboardPath = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
replaceInFile(
  adminDashboardPath,
  'className="text-[11px] text-white bg-sage-500 hover:bg-sage-600 px-1.5 py-0.5 rounded font-medium transition-colors shadow-sm"',
  'className="text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-1 rounded font-medium transition-colors shadow-sm"'
);

// 3. ProductStockSetupModal.tsx
const setupModalPath = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
replaceInFile(
  setupModalPath,
  'className="ml-2 inline-flex text-[11px] text-white bg-sage-500 hover:bg-sage-600 px-1.5 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"',
  'className="ml-2 inline-flex text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"'
);
