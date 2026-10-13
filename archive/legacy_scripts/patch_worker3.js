const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Lock to lucide-react
if (!content.includes('Lock,')) {
  content = content.replace('Trash2, Camera, RefreshCw, Check } from \'lucide-react\'', 'Trash2, Camera, RefreshCw, Check, Lock } from \'lucide-react\'');
}

// 2. Add auth states
if (!content.includes('const [isLoggedIn')) {
  const authStates = `  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authList, setAuthList] = useState<any[]>([]);
  const [requireAuth, setRequireAuth] = useState(false);`;
  content = content.replace("const [workerName, setWorkerName] = useState('주간알바');", "const [workerName, setWorkerName] = useState('주간알바');\n" + authStates);
}

// 3. Add auth sync listener
if (!content.includes('cloudSyncService.onAuthUpdate')) {
  const listener = `
    const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });
`;
  // Add in useEffect
  content = content.replace(/const unsubClear = cloudSyncService\.onClear\(\(\) => \{\n\s*setAudits\(\[\]\);\n\s*\}\);/, 'const unsubClear = cloudSyncService.onClear(() => { setAudits([]); });' + listener);
  content = content.replace(/unsubClear\(\);/, 'unsubClear();\n      unsubAuth();');
}

// 4. Update saveAudit
if (!content.includes('workerName: workerName,')) {
  content = content.replace(/workerName,\n\s*stockCount/g, 'workerName: workerName,\n        stockCount');
}

// 5. Add login UI BEFORE category UI
if (!content.includes('근무자 로그인')) {
  const loginUI = `
  if (requireAuth && !isLoggedIn) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const worker = authList.find(w => w.id === pinInput);
      if (worker) {
        setWorkerName(worker.name);
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('등록되지 않은 번호입니다.');
        setPinInput('');
      }
    };

    return (
      <div className="fixed inset-0 bg-canvas flex flex-col items-center justify-center p-6 z-50">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-line text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">근무자 로그인</h2>
          <p className="text-sm text-ink-soft mb-8 break-keep">
            점장님이 발급한 고유번호(PIN)를 입력해주세요.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="PIN 번호 입력"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full h-14 bg-sunken rounded-2xl text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sage focus:bg-white transition-all font-mono"
                autoFocus
              />
              {loginError && (
                <p className="text-clay text-sm font-medium mt-2">{loginError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!pinInput}
              className="w-full h-14 bg-sage hover:bg-sage-deep text-white rounded-2xl text-lg font-bold transition-colors disabled:opacity-50"
            >
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }
`;
  // We need to inject it right before `if (selectedCategory === null`
  // or before `return (\n    <div className="max-w-md mx-auto px-5 py-6 space-y-6 pb-24">`
  
  // Since `selectedCategory === null` is probably already returning, let's put it right at the top of the render block.
  // Wait, if it's before category UI, the user is locked out until they log in. That's what we want.
  content = content.replace(/if\s*\(selectedCategory === null && onCategoryChange\)\s*\{/, loginUI + '\n  if (selectedCategory === null && onCategoryChange) {');
}

fs.writeFileSync(file, content, 'utf8');
console.log('WorkerApp.tsx patched');
