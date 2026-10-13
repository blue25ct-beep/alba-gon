const fs = require('fs');

// 1. Fix Header.tsx (remove the <p> tag with the subtitle)
let headerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/Header.tsx';
let headerContent = fs.readFileSync(headerFile, 'utf8');

// Replace the sub-title `<p className="text-[13px] ...">... </p>` with nothing.
const subtitleRegex = /<p className=\{`text-\[13px\] truncate [^>]+>\s*\{title \|\| \(currentMode === 'WORKER' \? '재고 실사' : '재고 · 발주 관리'\)\}\s*<\/p>/;
headerContent = headerContent.replace(subtitleRegex, '');
fs.writeFileSync(headerFile, headerContent, 'utf8');
console.log('Fixed Header.tsx subtitle duplication');

// 2. Simplify main title in App.tsx
let appFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace("const [title, setTitle] = useState('편의점 자동발주');", "const [title, setTitle] = useState('재고 & 발주 관리');");
// Handle the case where it was already '편의점 통합 자동발주'
appContent = appContent.replace("const [title, setTitle] = useState('편의점 통합 자동발주');", "const [title, setTitle] = useState('재고 & 발주 관리');");
fs.writeFileSync(appFile, appContent, 'utf8');
console.log('Simplified title in App.tsx');

// 3. Simplify title in WorkerApp.tsx
let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');
workerContent = workerContent.replace("onTitleChange?.('🍺 [주류 전용] 자동발주');", "onTitleChange?.('🍺 주류 발주');");
workerContent = workerContent.replace("onTitleChange?.('🌿 [상온/냉장] 자동발주');", "onTitleChange?.('🌿 상온 발주');");
workerContent = workerContent.replace("onTitleChange?.('🏢 편의점 통합 자동발주');", "onTitleChange?.('발주 모드 선택');");
fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('Simplified title in WorkerApp.tsx');
