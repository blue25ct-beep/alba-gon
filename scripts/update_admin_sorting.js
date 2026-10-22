const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add sort state
const oldState = `  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());`;

const newState = `  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());
  type SortColumn = 'none' | 'targetStock' | 'minOrderQty' | 'finalOrderQty' | 'currentStock';
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

// 2. Sorting application on filteredItems
const oldSort = `  if (sortUnmodifiedFirst) {
    filteredItems.sort((a, b) => {
      const pA = products.find(p => p.barcode === a.barcode);
      const pB = products.find(p => p.barcode === b.barcode);
      const isUnmodA = !pA?.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !pB?.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }`;

const newSort = `  if (sortColumn !== 'none') {
    filteredItems.sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0;
      const valB = (b as any)[sortColumn] ?? 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }

  if (sortUnmodifiedFirst) {
    filteredItems.sort((a, b) => {
      const pA = products.find(p => p.barcode === a.barcode);
      const pB = products.find(p => p.barcode === b.barcode);
      const isUnmodA = !pA?.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !pB?.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }`;

// 3. Quick sort buttons near search bar
const oldSearchBarLabel = `            <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer md:self-end mt-1">
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
            </label>
          </div>
          </div>
        </div>`;

const newSearchBarLabel = `          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-faint font-semibold">정렬:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortColumn === 'targetStock' && sortOrder === 'desc') {
                    setSortColumn('none');
                  } else {
                    setSortColumn('targetStock');
                    setSortOrder('desc');
                  }
                }}
                className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 \${
                  sortColumn === 'targetStock' && sortOrder === 'desc'
                    ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                    : 'bg-surface text-ink hover:bg-canvas border-line'
                }\`}
              >
                <span>🎯 목표 수량 많은순 (내림차순)</span>
                {sortColumn === 'targetStock' && <span className="text-[11px]">{sortOrder === 'desc' ? '▼' : '▲'}</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortColumn === 'minOrderQty' && sortOrder === 'desc') {
                    setSortColumn('none');
                  } else {
                    setSortColumn('minOrderQty');
                    setSortOrder('desc');
                  }
                }}
                className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 \${
                  sortColumn === 'minOrderQty' && sortOrder === 'desc'
                    ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                    : 'bg-surface text-ink hover:bg-canvas border-line'
                }\`}
              >
                <span>📦 발주 단위 큰순 (내림차순)</span>
                {sortColumn === 'minOrderQty' && <span className="text-[11px]">{sortOrder === 'desc' ? '▼' : '▲'}</span>}
              </button>
              {sortColumn !== 'none' && (
                <button
                  type="button"
                  onClick={() => setSortColumn('none')}
                  className="px-2 py-1 text-xs text-ink-faint hover:text-ink underline transition-colors"
                >
                  기본 순서로 복귀
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer">
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
            </label>
          </div>
          </div>
        </div>`;

// 4. Headers for targetStock and minOrderQty
const oldHeaders = `                    <th className="font-medium px-3 py-3 text-center whitespace-nowrap">목표</th>
                    <th className="font-medium px-3 py-3 text-center whitespace-nowrap">
                      발주단위
                    </th>`;

const newHeaders = `                    <th
                      onClick={() => handleToggleSort('targetStock')}
                      className="font-medium px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
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
                      className="font-medium px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
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
  console.log('1. sort state added');
} else {
  console.error('Failed 1');
}

if (normCode.includes(norm(oldSort))) {
  normCode = normCode.replace(norm(oldSort), norm(newSort));
  console.log('2. sort logic added');
} else {
  console.error('Failed 2');
}

if (normCode.includes(norm(oldSearchBarLabel))) {
  normCode = normCode.replace(norm(oldSearchBarLabel), norm(newSearchBarLabel));
  console.log('3. quick sort buttons added');
} else {
  console.error('Failed 3');
}

if (normCode.includes(norm(oldHeaders))) {
  normCode = normCode.replace(norm(oldHeaders), norm(newHeaders));
  console.log('4. table header click sort added');
} else {
  console.error('Failed 4');
}

fs.writeFileSync(file, normCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('AdminDashboard.tsx sorting update completed!');
