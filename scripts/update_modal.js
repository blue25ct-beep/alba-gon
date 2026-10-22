const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'components', 'ProductStockSetupModal.tsx');
let code = fs.readFileSync(file, 'utf8');

const target = `{p.updatedAt ? (
                        \` · ✏️ 수정: \${p.updatedAt}\`
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(p.barcode)}
                          className="ml-2 inline-flex text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"
                        >
                          ✅ 적절함
                        </button>
                      )}`;

const replacement = `{p.reviewStatus === 'APPROPRIATE' ? (
                        \` · ✅ 적절함 확인: \${p.reviewedAt || p.updatedAt}\`
                      ) : (p.reviewStatus === 'MODIFIED' || p.updatedAt) ? (
                        \` · ✏️ 수정: \${p.updatedAt}\`
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(p.barcode)}
                          className="ml-2 inline-flex text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"
                        >
                          ✅ 적절함
                        </button>
                      )}`;

const norm = s => s.replace(/\r\n/g, '\n');
let normCode = norm(code);
if (normCode.includes(norm(target))) {
  normCode = normCode.replace(norm(target), norm(replacement));
  fs.writeFileSync(file, normCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ProductStockSetupModal.tsx successfully updated!');
} else {
  console.error('Target not found in ProductStockSetupModal.tsx');
}
