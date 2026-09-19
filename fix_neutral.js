const fs = require('fs');

// 1. Update Header.tsx
let fileHeader = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/components/Header.tsx';
let contentHeader = fs.readFileSync(fileHeader, 'utf8');

contentHeader = contentHeader.replace(
    "theme?: 'sage' | 'blue';",
    "theme?: 'sage' | 'blue' | 'neutral';"
);
contentHeader = contentHeader.replace(
    "theme = 'sage'",
    "theme = 'neutral'"
);
contentHeader = contentHeader.replace(
    '${theme === "blue" ? "bg-blue-600" : "bg-sage"}',
    '${theme === "blue" ? "bg-blue-600" : theme === "sage" ? "bg-sage" : "bg-ink"}'
);
contentHeader = contentHeader.replace(
    '${theme === "blue" ? "text-blue-600" : "text-sage"}',
    '${theme === "blue" ? "text-blue-600" : theme === "sage" ? "text-sage" : "text-ink"}'
);
contentHeader = contentHeader.replace(
    '${theme === "blue" ? "text-blue-100" : "text-sage-100"}',
    '${theme === "blue" ? "text-blue-100" : theme === "sage" ? "text-sage-100" : "text-line"}'
);
contentHeader = contentHeader.replace(
    '${theme === "blue" ? "text-blue-100 hover:bg-blue-500" : "text-sage-100 hover:bg-sage-deep"}',
    '${theme === "blue" ? "text-blue-100 hover:bg-blue-500" : theme === "sage" ? "text-sage-100 hover:bg-sage-deep" : "text-line hover:bg-ink-soft"}'
);
fs.writeFileSync(fileHeader, contentHeader, 'utf8');

// 2. Update App.tsx
let fileApp = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let contentApp = fs.readFileSync(fileApp, 'utf8');
contentApp = contentApp.replace(
    "const [theme, setTheme] = useState<'sage' | 'blue'>('sage');",
    "const [theme, setTheme] = useState<'sage' | 'blue' | 'neutral'>('neutral');"
);
fs.writeFileSync(fileApp, contentApp, 'utf8');

// 3. Update WorkerApp.tsx
let fileWorker = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let contentWorker = fs.readFileSync(fileWorker, 'utf8');
contentWorker = contentWorker.replace(
    "export const WorkerApp: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {",
    "export const WorkerApp: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {"
);
const oldEffectWorker = `    if (selectedCategory === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤');
    } else {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤');
    }`;
const newEffectWorker = `    if (selectedCategory === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤');
    } else if (selectedCategory === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤');
    } else {
      onThemeChange?.('neutral');
      onTitleChange?.('🏢 편의점 알바곤 통합 발주');
    }`;
contentWorker = contentWorker.replace(oldEffectWorker, newEffectWorker);
fs.writeFileSync(fileWorker, contentWorker, 'utf8');

// 4. Update AdminDashboard.tsx
let fileAdmin = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let contentAdmin = fs.readFileSync(fileAdmin, 'utf8');
contentAdmin = contentAdmin.replace(
    "export const AdminDashboard: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {",
    "export const AdminDashboard: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {"
);
const oldEffectAdmin = `    if (tempFilter === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤 관리');
    } else if (tempFilter === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤 관리');
    } else {
      onThemeChange?.('sage');
      onTitleChange?.('🏢 편의점 알바곤 통합 관리');
    }`;
const newEffectAdmin = `    if (tempFilter === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤 관리');
    } else if (tempFilter === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤 관리');
    } else {
      onThemeChange?.('neutral');
      onTitleChange?.('🏢 편의점 알바곤 통합 관리');
    }`;
contentAdmin = contentAdmin.replace(oldEffectAdmin, newEffectAdmin);
fs.writeFileSync(fileAdmin, contentAdmin, 'utf8');

console.log('Fixed neutral theme!');
