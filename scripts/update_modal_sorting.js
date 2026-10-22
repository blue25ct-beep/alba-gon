const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'components', 'ProductStockSetupModal.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add sort states
const oldState = `  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());`;

const newState = `  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());
  type SortColumn = 'none' | 'targetStock' | 'minOrderQty';
  type SortOrder = 'asc' | 'desc';
  const [sortColumn, setSortColumn] = useState<SortColumn>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleToggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else {
        setSortColumn('none');
        setSortOrder('desc');
      }
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };`;

// 2. Sort filtered
const oldSort = `  if (sortUnmodifiedFirst) {
    filtered.sort((a, b) => {
      const isUnmodA = !a.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !b.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }`;

const newSort = `  if (sortColumn !== 'none') {
    filtered.sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0;
      const valB = (b as any)[sortColumn] ?? 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }

  if (sortUnmodifiedFirst) {
    filtered.sort((a, b) => {
      const isUnmodA = !a.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !b.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }`;

// 3. Quick sort buttons
const oldControls = `              <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={sortUnmodifiedFirst}
                  onChange={(e) => {
                  setSortUnmodifiedFirst(e.target.checked);
                  if (!e.target.checked) setSessionEdited(new Set()); // reset when turned off
                }}
                  className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
                />
                💡 수정 안 된 상품 위로 올리기
              </label>`;

const newControls = `              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-faint font-semibold">내림차순:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortColumn === 'targetStock' && sortOrder === 'desc') setSortColumn('none');
                      else { setSortColumn('targetStock'); setSortOrder('desc'); }
                    }}
                    className={\`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border flex items-center gap-1 \${
                      sortColumn === 'targetStock' && sortOrder === 'desc'
                        ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                        : 'bg-surface text-ink hover:bg-canvas border-line'
                    }\`}
                  >
                    <span>🎯 목표 수량 많은순</span>
                    {sortColumn === 'targetStock' && <span>{sortOrder === 'desc' ? '▼' : '▲'}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortColumn === 'minOrderQty' && sortOrder === 'desc') setSortColumn('none');
                      else { setSortColumn('minOrderQty'); setSortOrder('desc'); }
                    }}
                    className={\`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border flex items-center gap-1 \${
                      sortColumn === 'minOrderQty' && sortOrder === 'desc'
                        ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                        : 'bg-surface text-ink hover:bg-canvas border-line'
                    }\`}
                  >
                    <span>📦 발주 단위 큰순</span>
                    {sortColumn === 'minOrderQty' && <span>{sortOrder === 'desc' ? '▼' : '▲'}</span>}
                  </button>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sortUnmodifiedFirst}
                    onChange={(e) => {
                      setSortUnmodifiedFirst(e.target.checked);
                      if (!e.target.checked) setSessionEdited(new Set());
                    }}
                    className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
                  />
                  💡 수정 안 된 상품 위로 올리기
                </label>
              </div>`;

// 4. Modal table headers
const oldTh = `                <th className="font-medium py-3 px-3 text-center whitespace-nowrap">목표</th>
                <th className="font-medium py-3 px-3 text-center whitespace-nowrap">발주단위</th>`;

const newTh = `                <th
                  onClick={() => handleToggleSort('targetStock')}
                  className="font-medium py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
                  title="클릭하여 목표 수량 내림차순/오름차순 정렬"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>목표</span>
                    {sortColumn === 'targetStock' ? (
                      <span className="text-sage-600 font-bold">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    ) : (
                      <span className="text-ink-faint opacity-40 group-hover:opacity-100 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('minOrderQty')}
                  className="font-medium py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
                  title="클릭하여 발주 단위 내림차순/오름차순 정렬"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>발주단위</span>
                    {sortColumn === 'minOrderQty' ? (
                      <span className="text-sage-600 font-bold">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    ) : (
                      <span className="text-ink-faint opacity-40 group-hover:opacity-100 text-xs">↕</span>
                    )}
                  </div>
                </th>`;

const norm = s => s.replace(/\r\n/g, '\n');
let normCode = norm(code);

if (normCode.includes(norm(oldState))) {
  normCode = normCode.replace(norm(oldState), norm(newState));
  console.log('1. modal sort state added');
} else console.error('Modal failed 1');

if (normCode.includes(norm(oldSort))) {
  normCode = normCode.replace(norm(oldSort), norm(newSort));
  console.log('2. modal sort logic added');
} else console.error('Modal failed 2');

if (normCode.includes(norm(oldControls))) {
  normCode = normCode.replace(norm(oldControls), norm(newControls));
  console.log('3. modal quick sort buttons added');
} else console.error('Modal failed 3');

if (normCode.includes(norm(oldTh))) {
  normCode = normCode.replace(norm(oldTh), norm(newTh));
  console.log('4. modal table headers updated');
} else console.error('Modal failed 4');

fs.writeFileSync(file, normCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('ProductStockSetupModal.tsx sorting completed!');
