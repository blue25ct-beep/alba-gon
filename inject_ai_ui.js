const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
if (!content.includes('import { analyzeAndRecommend }')) {
  content = content.replace("import { OrderFailure, OrderItem, OrderProgressEvent, Product, WorkerAuth, SyncStatus, AuditItem } from '../types';", "import { OrderFailure, OrderItem, OrderProgressEvent, Product, WorkerAuth, SyncStatus, AuditItem } from '../types';\nimport { analyzeAndRecommend } from '../services/smartRecommendation';");
}

// 2. Add Tab State
if (!content.includes("const [activeTab, setActiveTab]")) {
  content = content.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n  const [activeTab, setActiveTab] = useState<'ORDER' | 'HISTORY'>('ORDER');");
}

// 3. Add Recommendations Memo
if (!content.includes("const recommendations = React.useMemo")) {
  content = content.replace("const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');", "const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');\n  const recommendations = React.useMemo(() => analyzeAndRecommend(storageService.getOrderHistory(), products), [products]);");
}

// 4. Render AI Recommendation Badge
const targetTargetStockRender = `<td className="px-3 py-4 text-center">
                                    <div className="inline-flex w-14 h-10 items-center justify-center rounded-xl bg-canvas border border-line text-[15px] font-semibold text-ink shadow-sm">
                                      {masterProduct?.targetStock ?? 1}
                                    </div>
                                  </td>`;
const newTargetStockRender = `<td className="px-3 py-4 text-center">
                                    <div className="inline-flex w-14 h-10 items-center justify-center rounded-xl bg-canvas border border-line text-[15px] font-semibold text-ink shadow-sm">
                                      {masterProduct?.targetStock ?? 1}
                                    </div>
                                    {recommendations.has(item.barcode) && (
                                      <div className="mt-1 flex flex-col items-center">
                                        <button onClick={() => handleTargetStockChange(item.barcode, recommendations.get(item.barcode)!.recommendedStock)} className="text-[11px] text-white bg-blue-500 hover:bg-blue-600 px-1.5 py-0.5 rounded font-medium shadow-sm transition-colors cursor-pointer">
                                          💡 추천: {recommendations.get(item.barcode)!.recommendedStock}
                                        </button>
                                        <span className="text-[10px] text-ink-faint mt-0.5 max-w-[80px] break-keep leading-tight text-center">{recommendations.get(item.barcode)!.reason}</span>
                                      </div>
                                    )}
                                  </td>`;
if (content.includes(targetTargetStockRender) && !content.includes('💡 추천:')) {
  content = content.replace(targetTargetStockRender, newTargetStockRender);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Injected Recommendation UI into AdminDashboard');
