const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

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

  if (selectedCategory === null) {`;

if (!content.includes('근무자 로그인')) {
  content = content.replace('if (selectedCategory === null) {', loginUI);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected Login UI');
} else {
  console.log('Login UI already present');
}
