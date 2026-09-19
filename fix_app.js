const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');",
    "const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');\n  const [theme, setTheme] = useState<'sage' | 'blue'>('sage');\n  const [title, setTitle] = useState('편의점 알바곤');"
);

content = content.replace(
    "<Header currentMode={mode} onSwitchMode={setMode} />",
    "<Header currentMode={mode} onSwitchMode={setMode} theme={theme} title={title} />"
);

content = content.replace(
    "<WorkerApp />",
    "<WorkerApp onThemeChange={setTheme} onTitleChange={setTitle} />"
);

content = content.replace(
    "<AdminDashboard />",
    "<AdminDashboard onThemeChange={setTheme} onTitleChange={setTitle} />"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed App.tsx');
