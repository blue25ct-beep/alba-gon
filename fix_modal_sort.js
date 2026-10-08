const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename state and add sessionEdited
content = content.replace(
  "const [showUnmodifiedOnly, setShowUnmodifiedOnly] = useState(false);",
  "const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);\n  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());"
);

// 2. Remove the old filtering logic from filtered
const oldFilterCode = `    if (showUnmodifiedOnly && p.updatedAt) return false;`;
content = content.replace(oldFilterCode, ""); // might be multiple? let's be safe and use regex if needed, but it should be once. Wait, I deleted the duplicate earlier.
if (content.includes('if (showUnmodifiedOnly && p.updatedAt) return false;')) {
  content = content.replace('if (showUnmodifiedOnly && p.updatedAt) return false;', "");
}

// 3. Change `const filtered = ...` to `let filtered = ...`
content = content.replace("const filtered = products.filter((p) => {", "let filtered = products.filter((p) => {");

// 4. Add sorting logic
const sortLogic = `
  if (sortUnmodifiedFirst) {
    filtered.sort((a, b) => {
      const isUnmodA = !a.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !b.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }
`;
content = content.replace('const handleItemChange =', sortLogic + '\n  const handleItemChange =');

// 5. Update handlers to set sessionEdited
content = content.replace(/storageService\.markProductAsReviewed\(p\.barcode\);/g, "storageService.markProductAsReviewed(p.barcode);\n    setSessionEdited(prev => new Set(prev).add(p.barcode));");

content = content.replace(
  "setProducts(updated);",
  "setProducts(updated);\n    setSessionEdited(prev => new Set(prev).add(barcode));"
);

// 6. Update UI Label
content = content.replace(
  /checked=\{showUnmodifiedOnly\}/g,
  "checked={sortUnmodifiedFirst}"
);
content = content.replace(
  /onChange=\{\(e\) => setShowUnmodifiedOnly\(e\.target\.checked\)\}/g,
  "onChange={(e) => {\n                  setSortUnmodifiedFirst(e.target.checked);\n                  if (!e.target.checked) setSessionEdited(new Set()); // reset when turned off\n                }}"
);
content = content.replace(
  /💡 수정 기록 없는 상품만 모아보기/g,
  "💡 수정 안 된 상품 위로 올리기"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated SetupModal to use sortUnmodifiedFirst!');
