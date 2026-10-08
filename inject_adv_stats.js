const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Compute stats
const statsMemo = `
  const historyStats = React.useMemo(() => {
    const history = storageService.getOrderHistory();
    const productStats = new Map<string, { name: string; qty: number; cost: number; count: number }>();
    
    let totalCost = 0;
    
    history.forEach(h => {
      totalCost += h.totalAmount || 0;
      h.items.forEach(item => {
        const current = productStats.get(item.barcode) || { name: item.productName, qty: 0, cost: 0, count: 0 };
        current.qty += item.finalOrderQty;
        current.cost += (item.cost || 0) * item.finalOrderQty;
        current.count += 1;
        productStats.set(item.barcode, current);
      });
    });

    const allStats = Array.from(productStats.values());
    const topByQty = [...allStats].sort((a,b) => b.qty - a.qty).slice(0, 5);
    const topByCost = [...allStats].sort((a,b) => b.cost - a.cost).slice(0, 5);
    
    return { history, totalCost, topByQty, topByCost };
  }, [activeTab]);
`;
if (!content.includes('historyStats')) {
  content = content.replace(
    "const recommendations = React.useMemo(() => analyzeAndRecommend(storageService.getOrderHistory(), products), [products]);", 
    "const recommendations = React.useMemo(() => analyzeAndRecommend(storageService.getOrderHistory(), products), [products]);\n" + statsMemo
  );
}

// 2. Replace History Tab UI
const oldHistoryUI = `<section className="space-y-6">
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
                    {history.items.slice(0, 10).map((item: any, idx: number) => (
                      <span key={idx} className="bg-surface px-1.5 py-0.5 rounded border border-line">{item.productName} ({item.finalOrderQty}개)</span>
                    ))}
                    {history.items.length > 10 && <span className="bg-surface px-1.5 py-0.5 rounded border border-line">외 {history.items.length - 10}건...</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>`;

const newHistoryUI = `<section className="space-y-8">
          {historyStats.history.length === 0 ? (
            <p className="text-ink-faint text-center py-10">기록된 발주 내역이 없습니다.</p>
          ) : (
            <>
              {/* 통계 대시보드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                    🏆 발주량 기반 예측 베스트셀러 Top 5
                  </h3>
                  <div className="space-y-3">
                    {historyStats.topByQty.map((stat, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-ink truncate pr-2"><span className="font-bold text-sage-600 mr-2">{i+1}</span>{stat.name}</span>
                        <span className="font-semibold text-ink tabular">{stat.qty}개</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                    💸 매입 금액 랭킹 Top 5
                  </h3>
                  <div className="space-y-3">
                    {historyStats.topByCost.map((stat, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-ink truncate pr-2"><span className="font-bold text-red-500 mr-2">{i+1}</span>{stat.name}</span>
                        <span className="font-semibold text-ink tabular">{stat.cost.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-sage-50 border border-sage-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-sage-800 font-bold mb-1">총 누적 매입액 (기록된 발주 기준)</h3>
                  <p className="text-sm text-sage-600 break-keep">매출 데이터가 없어도 발주 금액과 빈도를 통해 상권의 흐름을 파악할 수 있습니다.</p>
                </div>
                <div className="text-2xl font-black text-sage-700 tabular">
                  {historyStats.totalCost.toLocaleString()}원
                </div>
              </div>

              {/* 과거 내역 리스트 */}
              <div>
                <h2 className="text-xl font-bold text-ink mb-4">과거 발주 상세 내역</h2>
                <div className="space-y-4">
                  {historyStats.history.map((history) => (
                    <div key={history.id} className="bg-canvas border border-line rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-ink">{history.orderDate} - {history.vendor === 'YOUNME' ? '유앤미24' : '생필체인'}</h3>
                        <span className="text-sm text-sage-600 bg-sage-50 px-2 py-1 rounded font-medium">성공: {history.items.length}품목</span>
                      </div>
                      <div className="text-sm text-ink-faint font-medium">
                        발주 금액: {history.totalAmount ? history.totalAmount.toLocaleString() + '원' : '금액 정보 없음'}
                      </div>
                      <div className="mt-3 text-xs text-ink-faint border-t border-line pt-3 flex flex-wrap gap-2">
                        {history.items.slice(0, 10).map((item: any, idx: number) => (
                          <span key={idx} className="bg-surface px-1.5 py-0.5 rounded border border-line">{item.productName} <strong className="text-ink">({item.finalOrderQty}개)</strong></span>
                        ))}
                        {history.items.length > 10 && <span className="bg-surface px-1.5 py-0.5 rounded border border-line text-ink font-semibold">외 {history.items.length - 10}건...</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>`;

if (content.includes('과거 발주 내역')) {
  // Use a string replacement by finding start and end
  const startIdx = content.indexOf('<section className="space-y-6">');
  const endString = '        </section>';
  const endIdx = content.indexOf(endString, startIdx) + endString.length;
  
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  
  fs.writeFileSync(file, before + newHistoryUI + after, 'utf8');
  console.log('Injected advanced history UI');
} else {
  console.log('Could not find old history UI');
}
