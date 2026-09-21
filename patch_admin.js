const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import Users
content = content.replace(/AlertTriangle,\n\} from 'lucide-react';/, 'AlertTriangle,\n  Users,\n} from \'lucide-react\';');

// 2. Add State for worker management
const stateInsert = `const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workers, setWorkers] = useState<{id: string, name: string}[]>(storageService.getSettings().workers || []);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerId.trim() || !newWorkerName.trim()) return;
    const newWorkers = [...workers, { id: newWorkerId.trim(), name: newWorkerName.trim() }];
    setWorkers(newWorkers);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newWorkers });
    cloudSyncService.publishAuthList(newWorkers);
    setNewWorkerId('');
    setNewWorkerName('');
  };

  const handleRemoveWorker = (id: string) => {
    const newWorkers = workers.filter(w => w.id !== id);
    setWorkers(newWorkers);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newWorkers });
    cloudSyncService.publishAuthList(newWorkers);
  };
`;

content = content.replace('const [showStockSetupModal, setShowStockSetupModal] = useState(false);', stateInsert + '\n  const [showStockSetupModal, setShowStockSetupModal] = useState(false);');

// 3. Effect to publish auth list on mount
const effectInsert = `useEffect(() => {
    if (syncStatus === 'CONNECTED') {
      cloudSyncService.publishAuthList(workers);
    }
  }, [syncStatus]);`;

content = content.replace('useEffect(() => {', effectInsert + '\n\n  useEffect(() => {');

// 4. Add UI button next to sync status
const btnInsert = `<button
            onClick={() => setShowWorkerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-line rounded-full hover:bg-sunken transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-ink-faint" />
            <span className="text-[13px] font-medium text-ink-soft">근무자 관리</span>
          </button>`;

content = content.replace('<div className="flex items-center gap-2">', '<div className="flex items-center gap-2">\n          ' + btnInsert);

// 5. Add Worker Modal
const modalInsert = `{showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                <Users className="w-5 h-5 text-sage" />
                근무자 접속 권한 관리
              </h3>
              <button
                onClick={() => setShowWorkerModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sunken text-ink-faint"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-ink-soft mb-6 break-keep">
              여기에 등록된 근무자만 알바생 접속용 화면(스마트폰)에 로그인하여 실사 데이터를 보낼 수 있습니다. (전화번호 뒷자리 4자리 권장)
            </p>

            <form onSubmit={handleAddWorker} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="이름 (예: 김알바)"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                className="flex-1 h-10 px-3 bg-sunken rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:bg-white transition-all"
              />
              <input
                type="text"
                placeholder="PIN 4자리"
                value={newWorkerId}
                onChange={(e) => setNewWorkerId(e.target.value)}
                className="w-24 h-10 px-3 bg-sunken rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:bg-white transition-all text-center"
                maxLength={4}
              />
              <button
                type="submit"
                disabled={!newWorkerName.trim() || !newWorkerId.trim()}
                className="h-10 px-4 bg-sage hover:bg-sage-deep text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                등록
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {workers.length === 0 ? (
                <div className="text-center py-6 text-sm text-ink-faint bg-sunken rounded-xl">
                  등록된 근무자가 없습니다.<br/>(등록 전에는 누구나 접속 가능합니다)
                </div>
              ) : (
                workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-sunken/50 rounded-xl border border-line">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sage-50 text-sage-deep flex items-center justify-center font-bold text-xs">
                        {w.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink">{w.name}</div>
                        <div className="text-xs text-ink-faint font-mono">PIN: {w.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWorker(w.id)}
                      className="text-clay hover:bg-clay-50 p-2 rounded-lg transition-colors text-xs font-bold"
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}`;

content = content.replace('{/* 모달 */}', modalInsert + '\n\n      {/* 모달 */}');

fs.writeFileSync(file, content, 'utf8');
console.log('Updated AdminDashboard.tsx');
