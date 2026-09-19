import re

with open(r'C:\Users\김진곤\Downloads\alba-gon\client-spchain\src\pages\AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace younmeOrderService import with unifiedOrderService
content = content.replace(
    "import { younmeOrderService, OrderProgressEvent } from '../services/younmeOrderService';",
    "import { unifiedOrderService, OrderProgressEvent } from '../services/unifiedOrderService';"
)

# Replace isOrdering and orderProgress states
content = content.replace(
    "const [isOrdering, setIsOrdering] = useState(false);",
    "const [isYounmeOrdering, setIsYounmeOrdering] = useState(false);\n  const [isSpchainOrdering, setIsSpchainOrdering] = useState(false);"
)
content = content.replace(
    "const [orderProgress, setOrderProgress] = useState<OrderProgressEvent | null>(null);",
    "const [younmeProgress, setYounmeProgress] = useState<OrderProgressEvent | null>(null);\n  const [spchainProgress, setSpchainProgress] = useState<OrderProgressEvent | null>(null);"
)

# Replace itemsToOrder calculation to split into younme and spchain
split_items_code = """
  const allItemsToOrder = orderItems.filter((item) => item.finalOrderQty > 0);
  const coupangItems = allItemsToOrder.filter((item) => item.productName.includes('쿠팡]'));
  const itemsToOrder = allItemsToOrder.filter((item) => !item.productName.includes('쿠팡]'));
  const younmeItems = itemsToOrder.filter(item => item.category === '상온' || item.category === '냉장' || !item.category);
  const spchainItems = itemsToOrder.filter(item => item.category === '주류');
"""
content = re.sub(
    r"const allItemsToOrder.*?const itemsToOrder = .*?;\n",
    split_items_code.strip() + '\n',
    content,
    flags=re.DOTALL
)

# Replace handleStartOrder
new_handleStartOrder = """
  const handleStartOrder = async (vendor: 'YOUNME' | 'SPCHAIN', targetItems: OrderItem[]) => {
    if (targetItems.length === 0) {
      alert('발주할 상품이 없습니다.');
      return;
    }

    const sanitizedItems: OrderItem[] = targetItems.map((item) => {
      const step = Math.max(1, item.minOrderQty);
      return {
        ...item,
        finalOrderQty: item.finalOrderQty > 0 ? Math.ceil(item.finalOrderQty / step) * step : 0,
      };
    });

    const vendorName = vendor === 'YOUNME' ? '유앤미24' : '생필체인';
    if (!confirm(`${sanitizedItems.length}개 품목을 ${vendorName} 시스템으로 발주합니다.`)) return;

    if (vendor === 'YOUNME') {
      setIsYounmeOrdering(true);
      setYounmeProgress(null);
    } else {
      setIsSpchainOrdering(true);
      setSpchainProgress(null);
    }

    try {
      const result = await unifiedOrderService.executeOrder(vendor, sanitizedItems, (evt) => {
        if (vendor === 'YOUNME') setYounmeProgress(evt);
        else setSpchainProgress(evt);
      });

      loadData();
      if (result.failures.length > 0) {
        setShowFailureModal(true);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '발주 중 오류가 발생했습니다.');
    } finally {
      if (vendor === 'YOUNME') setIsYounmeOrdering(false);
      else setIsSpchainOrdering(false);
    }
  };
"""

content = re.sub(
    r"const handleStartOrder = async \(\) => \{.*?(?=\n  const handleUploadClick)/s",
    new_handleStartOrder.strip() + '\n\n',
    content
)

def find_matching_bracket(text, start_idx, open_b='<section', close_b='</section>'):
    nest = 0
    i = start_idx
    while i < len(text):
        if text.startswith(open_b, i):
            nest += 1
        elif text.startswith(close_b, i):
            nest -= 1
            if nest == 0:
                return i + len(close_b)
        i += 1
    return -1

section_start_str = '<section className="bg-surface border border-line rounded-3xl p-6 shadow-sm">'
idx_start = content.find(section_start_str)
if idx_start != -1:
    idx_end = find_matching_bracket(content, idx_start, '<section', '</section>')
    
    prog_str = '{orderProgress && ('
    idx_prog_start = content.find(prog_str, idx_end)
    if idx_prog_start != -1:
        idx_prog_end = content.find(')}', content.find('</section>', idx_prog_start)) + 2
        
        new_sections = """
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 유앤미 발주 섹션 */}
        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-sage-deep mb-2">🌿 유앤미24 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              상온/냉장 카테고리 상품들을 유앤미24 시스템을 통해 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-ink">{younmeItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isYounmeOrdering || younmeItems.length === 0 || isSpchainOrdering}
              onClick={() => handleStartOrder('YOUNME', younmeItems)}
              className="h-10 px-6 rounded-full bg-sage hover:bg-sage-deep disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isYounmeOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {younmeProgress && (
            <div className="mt-4 p-4 bg-sage-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-sage-deep font-medium break-keep">{younmeProgress.message}</span>
                <span className="text-sage font-bold tabular shrink-0">{younmeProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-300 ease-out"
                  style={{ width: `${younmeProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 생필체인 발주 섹션 */}
        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-700 mb-2">🍺 생필체인(주류) 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              주류 카테고리 상품들을 생필체인 시스템을 통해 박스 단위로 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-ink">{spchainItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isSpchainOrdering || spchainItems.length === 0 || isYounmeOrdering}
              onClick={() => handleStartOrder('SPCHAIN', spchainItems)}
              className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isSpchainOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {spchainProgress && (
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-blue-800 font-medium break-keep">{spchainProgress.message}</span>
                <span className="text-blue-600 font-bold tabular shrink-0">{spchainProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${spchainProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => {
            setAliasTargetBarcode('');
            setShowAliasModal(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken transition-colors bg-white border border-line"
        >
          <ArrowRightLeft className="w-4 h-4" />
          대체 바코드
          <span className="text-ink-faint tabular">{aliases.length}</span>
        </button>

        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken cursor-pointer transition-colors bg-white border border-line">
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 불러오기
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>
      </div>
"""
        content = content[:idx_start] + new_sections.strip() + content[idx_prog_end:]

with open(r'C:\Users\김진곤\Downloads\alba-gon\client-spchain\src\pages\AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Python rewrite script finished.")
