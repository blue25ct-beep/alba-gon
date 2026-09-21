const fs = require('fs');

// 1. App.tsx: Pass onSwitchMode
let appFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(
  '<WorkerApp selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} />',
  '<WorkerApp selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} onSwitchMode={setMode} />'
);
fs.writeFileSync(appFile, appContent, 'utf8');
console.log('App.tsx patched');

// 2. Header.tsx: Change z-30 to z-50
let headerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/Header.tsx';
let headerContent = fs.readFileSync(headerFile, 'utf8');
headerContent = headerContent.replace('sticky top-0 z-30', 'sticky top-0 z-[60]'); // Make it higher than z-50 just in case
fs.writeFileSync(headerFile, headerContent, 'utf8');
console.log('Header.tsx patched');

// 3. WorkerApp.tsx: Props and Login logic
let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');

// Update Props
workerContent = workerContent.replace(
  "onTitleChange?: (title: string) => void }> =",
  "onTitleChange?: (title: string) => void; onSwitchMode?: (mode: 'WORKER' | 'ADMIN') => void }> ="
);
workerContent = workerContent.replace(
  "onThemeChange, onTitleChange }) => {",
  "onThemeChange, onTitleChange, onSwitchMode }) => {"
);

// Update handleLogin
const oldHandleLogin = `    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const worker = authList.find(w => w.id === pinInput);`;
const newHandleLogin = `    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const managerPin = storageService.getSettings().managerPin || '1234';
      if (pinInput === managerPin) {
        if (onSwitchMode) {
          onSwitchMode('ADMIN');
          setPinInput('');
          setLoginError('');
          return;
        }
      }
      
      const worker = authList.find(w => w.id === pinInput);`;

workerContent = workerContent.replace(oldHandleLogin, newHandleLogin);

// Update z-index from z-50 to z-40 so header is on top (optional, but good for UX)
workerContent = workerContent.replace('fixed inset-0 bg-canvas flex flex-col items-center justify-center p-6 z-50', 'fixed inset-0 top-16 bg-canvas flex flex-col items-center justify-center p-6 z-40');
// Also modify the instruction text
workerContent = workerContent.replace('점장님이 발급한 고유번호(PIN)를 입력해주세요.', '점장님이 발급한 고유번호(PIN) 또는 점장 PIN을 입력해주세요.');

fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('WorkerApp.tsx patched');
