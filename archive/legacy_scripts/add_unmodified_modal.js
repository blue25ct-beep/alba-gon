const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert state
if (!content.includes('const [showUnmodifiedOnly')) {
  content = content.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n  const [showUnmodifiedOnly, setShowUnmodifiedOnly] = useState(false);");
}

// 2. Insert filter logic
const targetFilter = 'const matchesCat = selectedCategory === \'ALL\' || p.category === selectedCategory;';
const newFilter = `const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;\n    if (showUnmodifiedOnly && p.updatedAt) return false;`;
if (!content.includes('if (showUnmodifiedOnly && p.updatedAt) return false;')) {
  content = content.replace(targetFilter, newFilter);
}

// 3. Insert UI
const targetUI = `<input
              type="text"
              placeholder="상품명 또는 바코드 검색"`;
const newUI = `<label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={showUnmodifiedOnly}
                onChange={(e) => setShowUnmodifiedOnly(e.target.checked)}
                className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
              />
              💡 수정 기록 없는 상품만 보기
            </label>
            <input
              type="text"
              placeholder="상품명 또는 바코드 검색"`;

if (content.includes(targetUI) && !content.includes('💡 수정 기록 없는 상품만 보기')) {
  content = content.replace(targetUI, newUI);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added showUnmodifiedOnly filter to setup modal.');
