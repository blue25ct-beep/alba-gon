const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { analyzeAndRecommend }')) {
  content = content.replace("import { storageService } from '../services/storage';", "import { storageService } from '../services/storage';\nimport { analyzeAndRecommend } from '../services/smartRecommendation';");
}

if (!content.includes("const recommendations = React.useMemo")) {
  content = content.replace("const [savedId, setSavedId] = useState<string | null>(null);", "const [savedId, setSavedId] = useState<string | null>(null);\n  const recommendations = React.useMemo(() => analyzeAndRecommend(storageService.getOrderHistory(), products), [products]);");
}

const targetTargetStockRender = `<td className="py-3 px-3 text-center">
                    <input
                      type="number"`;
const newTargetStockRender = `<td className="py-3 px-3 text-center">
                    {recommendations.has(p.barcode) && (
                      <div className="mb-1">
                        <button onClick={() => handleItemChange(p.barcode, 'targetStock', recommendations.get(p.barcode)!.recommendedStock)} className="text-[11px] text-white bg-blue-500 hover:bg-blue-600 px-1.5 py-0.5 rounded font-medium shadow-sm transition-colors cursor-pointer">
                          💡 추천: {recommendations.get(p.barcode)!.recommendedStock}
                        </button>
                      </div>
                    )}
                    <input
                      type="number"`;
if (content.includes(targetTargetStockRender) && !content.includes('💡 추천:')) {
  content = content.replace(targetTargetStockRender, newTargetStockRender);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected Recommendation UI into ProductStockSetupModal');
}
