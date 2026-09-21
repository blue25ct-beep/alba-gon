const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Users to lucide-react imports
if (!content.includes('Users,')) {
  content = content.replace('AlertTriangle,', 'AlertTriangle,\n  Users,');
}

// 2. Add WorkerAuth to types imports
if (!content.includes('WorkerAuth')) {
  content = content.replace('BarcodeAlias }', 'BarcodeAlias, WorkerAuth }');
}

// 3. Add States and useEffect
if (!content.includes('const [showWorkerModal')) {
  const statesToInject = `const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workers, setWorkers] = useState<WorkerAuth[]>(storageService.getSettings().workers || []);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');

  useEffect(() => {
    if (syncStatus === 'CONNECTED') {
      cloudSyncService.publishAuthList(workers);
    }
  }, [syncStatus, workers]);

  const addWorker = () => {
    if (!newWorkerName || !newWorkerId) return;
    const newList = [...workers, { id: newWorkerId, name: newWorkerName }];
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    setNewWorkerName('');
    setNewWorkerId('');
  };

  const removeWorker = (id: string) => {
    const newList = workers.filter(w => w.id !== id);
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
  };`;

  content = content.replace('const [searchQuery, setSearchQuery] = useState(\'\');', 'const [searchQuery, setSearchQuery] = useState(\'\');\n  ' + statesToInject);
}

// 4. Add Worker Modal and Button
if (!content.includes('👥 근무자 관리')) {
  const buttonAndModal = `
          {/* Worker Management */}
          <button
            onClick={() => setShowWorkerModal(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            👥 근무자 관리
          </button>
        </div>
      </header>

      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" />
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
                type="text"
                placeholder="PIN 4자리"
                maxLength={4}
                className="w-28 h-12 px-4 rounded-xl border border-line bg-sunken focus:bg-white transition-colors"
                value={newWorkerId}
                onChange={e => setNewWorkerId(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <button
                onClick={addWorker}
                disabled={!newWorkerName || newWorkerId.length < 4}
                className="px-4 h-12 bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50"
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
  content = content.replace('</div>\n      </header>', buttonAndModal);
}

// 5. Add Worker Name Badge to order list items
// target: `<span className="font-medium text-ink">{item.productName}</span>`
if (!content.includes('item.workerName}')) {
  const productNameCell = `<span className="font-medium text-ink flex items-center gap-2">
                            {item.productName}
                            {item.workerName && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-600">
                                👤 {item.workerName}
                              </span>
                            )}
                          </span>`;
  // Usually the table has it for order candidates
  content = content.replace(/<span className="font-medium text-ink">\{item\.productName\}<\/span>/g, productNameCell);
}

fs.writeFileSync(file, content, 'utf8');
console.log('AdminDashboard.tsx patched');
