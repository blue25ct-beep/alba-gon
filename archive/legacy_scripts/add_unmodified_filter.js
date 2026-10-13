const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert State
if (!content.includes('const [showUnmodifiedOnly')) {
  content = content.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n  const [showUnmodifiedOnly, setShowUnmodifiedOnly] = useState(false);");
}

// 2. Insert into filteredItems
const targetFilter = 'const matchesSearch =';
const newFilter = `const masterProduct = products.find(p => p.barcode === item.barcode);
    if (showUnmodifiedOnly && masterProduct?.updatedAt) return false;
    const matchesSearch =`;
if (!content.includes('if (showUnmodifiedOnly && masterProduct?.updatedAt) return false;')) {
  content = content.replace(targetFilter, newFilter);
}

// 3. Replace Search Input container
const oldSearchContainer = `<div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="상품명 또는 바코드"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="상품 검색"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface border border-line text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage-300 transition-colors"
            />
          </div>`;

const newSearchContainer = `<div className="flex flex-col gap-2 w-full md:w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="상품명 또는 바코드"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="상품 검색"
                className="w-full h-10 pl-10 pr-4 rounded-full bg-surface border border-line text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage-300 transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer md:self-end mt-1">
              <input
                type="checkbox"
                checked={showUnmodifiedOnly}
                onChange={(e) => setShowUnmodifiedOnly(e.target.checked)}
                className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
              />
              💡 수정 기록 없는 상품만 모아보기
            </label>
          </div>`;

if (content.includes('className="relative w-full md:w-72"') && !content.includes('💡 수정 기록 없는 상품만 모아보기')) {
  content = content.replace(oldSearchContainer, newSearchContainer);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added showUnmodifiedOnly filter logic and UI.');
