const fs = require('fs');
const path = require('path');

const modalPath = path.join(__dirname, '..', 'client', 'src', 'components', 'RestoreAuditModal.tsx');
let c = fs.readFileSync(modalPath, 'utf8');

// 1. Add import
if (!c.includes('hajinhyunAudits')) {
  c = c.replace(
    /import { storageService } from '\.\.\/services\/storage';/,
    "import { storageService } from '../services/storage';\nimport hajinhyunAudits from '../data/audits_20261102_hajinhyun.json';"
  );
}

// 2. Add hajinhyun card right before Card 1
const card1Target = '{/* Card 1: 직전 발주 완료 상품 되살리기 */}';
const newCard = `{/* Card 0: 11월 2일 하진현 실사 112개 긴급 복구 */}
          <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/80 hover:border-emerald-500 transition-all shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                    ✨ 영상 전수 복원본
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">11월 2일 하진현 근무자</span>
                  <span className="text-xs text-gray-500">• 18:44 ~ 19:17</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  총 {hajinhyunAudits.length}개 품목 실사 데이터 (상온 발주)
                </h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {hajinhyunAudits.slice(0, 5).map((it: any) => it.productName).join(', ')} 외 {hajinhyunAudits.length - 5}건
                </p>
              </div>
              <button
                onClick={() => {
                  const result = storageService.restoreItemsToAudits(hajinhyunAudits as AuditItem[]);
                  onRestored(result.addedCount, '11월 2일 하진현 실사 112개');
                  onClose();
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                실사 112개 즉시 복구
              </button>
            </div>
          </div>

          {/* Card 1: 직전 발주 완료 상품 되살리기 */}`;

if (!c.includes('Card 0: 11월 2일 하진현 실사 112개 긴급 복구')) {
  c = c.replace(card1Target, newCard);
}

fs.writeFileSync(modalPath, c, 'utf8');
console.log('Successfully updated RestoreAuditModal.tsx');
