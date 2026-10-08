const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const renderStart = lines.findIndex(l => l.includes('<div className="text-center text-ink-faint text-xs py-1">최종 업데이트: {__BUILD_TIME__}</div>'));

if (renderStart !== -1 && !content.includes('발주 내역 및 통계')) {
  const tabs = `
      <div className="flex border-b border-line mb-6">
        <button onClick={() => setActiveTab('ORDER')} className={\`px-4 py-2 font-semibold \${activeTab === 'ORDER' ? 'border-b-2 border-sage-600 text-sage-600' : 'text-ink-faint hover:text-ink'}\`}>현재 발주 관리</button>
        <button onClick={() => setActiveTab('HISTORY')} className={\`px-4 py-2 font-semibold \${activeTab === 'HISTORY' ? 'border-b-2 border-sage-600 text-sage-600' : 'text-ink-faint hover:text-ink'}\`}>발주 내역 및 통계</button>
      </div>
      
      {activeTab === 'HISTORY' && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-ink">과거 발주 내역</h2>
          {storageService.getOrderHistory().length === 0 ? (
            <p className="text-ink-faint text-center py-10">기록된 발주 내역이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {storageService.getOrderHistory().map((history) => (
                <div key={history.id} className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-ink">{history.orderDate} - {history.vendor === 'YOUNME' ? '유앤미24' : '생필체인'}</h3>
                    <span className="text-sm text-sage-600 bg-sage-50 px-2 py-1 rounded font-medium">성공: {history.items.length}품목</span>
                  </div>
                  <div className="text-sm text-ink-faint">
                    총 발주 금액: {history.totalAmount ? history.totalAmount.toLocaleString() + '원' : '금액 정보 없음'}
                  </div>
                  <div className="mt-3 text-xs text-ink-faint border-t border-line pt-3 flex flex-wrap gap-2">
                    {history.items.slice(0, 10).map((item, idx) => (
                      <span key={idx} className="bg-surface px-1.5 py-0.5 rounded border border-line">{item.productName} ({item.finalOrderQty}개)</span>
                    ))}
                    {history.items.length > 10 && <span className="bg-surface px-1.5 py-0.5 rounded border border-line">외 {history.items.length - 10}건...</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'ORDER' && (
        <>
  `;

  lines.splice(renderStart + 1, 0, tabs);
  
  // Find the end of the component return to close the fragment
  const endFragment = lines.findIndex(l => l.includes('export default AdminDashboard;')) - 3;
  lines.splice(endFragment, 0, '        </>\n      )}');
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Added Tabs and History view to AdminDashboard');
}
