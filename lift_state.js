const fs = require('fs');

// 1. App.tsx
let fileApp = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let contentApp = fs.readFileSync(fileApp, 'utf8');

if (!contentApp.includes('const [selectedCategory, setSelectedCategory]')) {
    contentApp = contentApp.replace(
        "const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');",
        "const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');\n  const [selectedCategory, setSelectedCategory] = useState<'YOUNME' | 'SPCHAIN' | null>(null);"
    );
    contentApp = contentApp.replace(
        "<WorkerApp onThemeChange={setTheme} onTitleChange={setTitle} />",
        "<WorkerApp selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} />"
    );
    contentApp = contentApp.replace(
        "<AdminDashboard onThemeChange={setTheme} onTitleChange={setTitle} />",
        "<AdminDashboard initialCategory={selectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} />"
    );
    fs.writeFileSync(fileApp, contentApp, 'utf8');
}

// 2. WorkerApp.tsx
let fileWorker = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let contentWorker = fs.readFileSync(fileWorker, 'utf8');
contentWorker = contentWorker.replace(
    "export const WorkerApp: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {",
    "export const WorkerApp: React.FC<{ selectedCategory?: 'YOUNME' | 'SPCHAIN' | null; onCategoryChange?: (c: 'YOUNME' | 'SPCHAIN' | null) => void; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ selectedCategory, onCategoryChange, onThemeChange, onTitleChange }) => {"
);
contentWorker = contentWorker.replace(
    "  const [selectedCategory, setSelectedCategory] = useState<'YOUNME' | 'SPCHAIN' | null>(null);\n",
    ""
);
// Fix the internal setCategory calls
contentWorker = contentWorker.replace(/setSelectedCategory/g, "onCategoryChange");
fs.writeFileSync(fileWorker, contentWorker, 'utf8');

// 3. AdminDashboard.tsx
let fileAdmin = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let contentAdmin = fs.readFileSync(fileAdmin, 'utf8');
contentAdmin = contentAdmin.replace(
    "export const AdminDashboard: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {",
    "export const AdminDashboard: React.FC<{ initialCategory?: 'YOUNME' | 'SPCHAIN' | null; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ initialCategory, onThemeChange, onTitleChange }) => {"
);
contentAdmin = contentAdmin.replace(
    "const [tempFilter, setTempFilter] = useState<'ALL' | 'YOUNME' | 'SPCHAIN'>('ALL');",
    "const [tempFilter, setTempFilter] = useState<'ALL' | 'YOUNME' | 'SPCHAIN'>(initialCategory || 'ALL');"
);
fs.writeFileSync(fileAdmin, contentAdmin, 'utf8');

console.log('Fixed state lifting!');
