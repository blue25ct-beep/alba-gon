const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const modalStr = `
      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                근무자 관리 (PIN 로그인)
              </h3>
              <button onClick={() => setShowWorkerModal(false)} className="p-2 hover:bg-sunken rounded-xl text-ink-faint">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="이름 (예: 김알바)"
                className="flex-1 h-12 px-4 rounded-xl border border-line bg-sunken focus:bg-white transition-colors"
                value={newWorkerName}
                onChange={e => setNewWorkerName(e.target.value)}
              />
              <input
                type="password"
                placeholder="PIN 4자리"
                maxLength={4}
                className="w-28 h-12 px-4 rounded-xl border border-line bg-sunken focus:bg-white transition-colors"
                value={newWorkerId}
                onChange={e => setNewWorkerId(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <button
                onClick={addWorker}
                disabled={!newWorkerName || newWorkerId.length < 4}
                className="px-4 h-12 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50"
              >
                추가
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {workers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ink-faint">
                  등록된 근무자가 없습니다
                </div>
              ) : (
                <ul className="space-y-2">
                  {workers.map(w => (
                    <li key={w.id} className="flex items-center justify-between p-4 bg-sunken rounded-xl">
                      <div>
                        <p className="font-bold">{w.name}</p>
                        <p className="text-sm text-ink-soft mt-1">PIN: {w.id}</p>
                      </div>
                      <button
                        onClick={() => removeWorker(w.id)}
                        className="p-2 text-clay hover:bg-white rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('Worker Modal')) {
  content = content.replace('          </div>\n  );\n};', modalStr + '\n          </div>\n  );\n};');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Modal injected!');
} else {
  console.log('Modal already injected.');
}
