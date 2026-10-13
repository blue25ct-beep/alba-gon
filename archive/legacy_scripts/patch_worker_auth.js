const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add lucide imports
content = content.replace("import { Trash2, Edit3, Send, CheckCircle, Wifi, WifiOff } from 'lucide-react';", "import { Trash2, Edit3, Send, CheckCircle, Wifi, WifiOff, Lock, User, LogOut } from 'lucide-react';");

// 2. Add Login States
const stateInsert = `const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authList, setAuthList] = useState<{id: string, name: string}[]>([]);
  const [requireAuth, setRequireAuth] = useState(false);`;

content = content.replace("const [step, setStep] = useState<'IDLE' | 'QUANTITY' | 'PHOTO'>('IDLE');", "const [step, setStep] = useState<'IDLE' | 'QUANTITY' | 'PHOTO'>('IDLE');\n  " + stateInsert);

// 3. Add auth subscription
const authInsert = `const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });`;

content = content.replace('const unsubClear = cloudSyncService.onClear(() => {', authInsert + '\n\n    const unsubClear = cloudSyncService.onClear(() => {');
content = content.replace('unsubClear();', 'unsubAuth();\n      unsubClear();');

// 4. Update handleSaveQuantity to use authName
const quantityInsert = `workerName: isLoggedIn && authList.find(w => w.id === pinInput) ? authList.find(w => w.id === pinInput)?.name || workerName : workerName,`;
content = content.replace('workerName,', quantityInsert);

// 5. Add Login Screen Render
const loginRender = `if (requireAuth && !isLoggedIn) {
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
                <p className="text-clay text-sm font-medium mt-2 animate-shake">{loginError}</p>
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

content = content.replace('return (', loginRender + '\n  return (');

// 6. Update Header in WorkerApp to show worker name & logout
const headerReplace = `<div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-ink-faint font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {workerName}
              </p>
              {requireAuth && (
                <button 
                  onClick={() => {
                    setIsLoggedIn(false);
                    setPinInput('');
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-sunken text-ink-faint hover:bg-line transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  로그아웃
                </button>
              )}
            </div>
            <p className="mt-1 text-[28px] leading-none font-semibold text-ink tabular">
              {filteredAudits.length}
              <span className="ml-1.5 text-base font-normal text-ink-faint">개 확인</span>
            </p>
          </div>`;

content = content.replace(/<div className="flex items-baseline justify-between">[\s\S]*?<p className="mt-1 text-\[28px\] leading-none font-semibold text-ink tabular">[\s\S]*?<\/p>\s*<\/div>/, headerReplace);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated WorkerApp.tsx');
