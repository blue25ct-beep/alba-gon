const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<td className="py-3 px-3 text-center">\s*<input\s*type="number"/;
const replacement = `<td className="py-3 px-3 text-center">
                    {recommendations.has(p.barcode) && (
                      <div className="mb-1 flex flex-col items-center">
                        <button onClick={() => handleItemChange(p.barcode, 'targetStock', recommendations.get(p.barcode)!.recommendedStock)} className="text-[11px] text-white bg-blue-500 hover:bg-blue-600 px-1.5 py-0.5 rounded font-medium shadow-sm transition-colors cursor-pointer whitespace-nowrap">
                          💡 추천: {recommendations.get(p.barcode)!.recommendedStock}
                        </button>
                      </div>
                    )}
                    <input
                      type="number"`;

if (!content.includes('💡 추천:')) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected using regex!');
}
