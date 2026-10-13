const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename state and add sessionEdited
content = content.replace(
  "const [showUnmodifiedOnly, setShowUnmodifiedOnly] = useState(false);",
  "const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);\n  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());"
);

// 2. Remove the old filtering logic from filteredItems
const oldFilterCode = `const masterProduct = products.find(p => p.barcode === item.barcode);
    if (showUnmodifiedOnly && masterProduct?.updatedAt) return false;
    const matchesSearch =`;
const newFilterCode = `const matchesSearch =`;
content = content.replace(oldFilterCode, newFilterCode);

// 3. Add sorting logic to filteredItems mapping or just after filtering
const oldFilteredMap = `  const filteredItems = orderItems.filter((item) => {`;
const newFilteredMap = `  let filteredItems = orderItems.filter((item) => {`;
content = content.replace(oldFilteredMap, newFilteredMap);

const sortLogic = `
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
  }
`;
content = content.replace('const isConnected = syncStatus === \'CONNECTED\';', sortLogic + '\n  const isConnected = syncStatus === \'CONNECTED\';');

// 4. Update handlers to set sessionEdited
content = content.replace(/storageService\.markProductAsReviewed\(barcode\);/g, "storageService.markProductAsReviewed(barcode);\n    setSessionEdited(prev => new Set(prev).add(barcode));");
content = content.replace(/storageService\.updateProductTargetStock\(barcode, Math\.max\(0, val\)\);/g, "storageService.updateProductTargetStock(barcode, Math.max(0, val));\n    setSessionEdited(prev => new Set(prev).add(barcode));");
content = content.replace(/storageService\.updateProductMinOrderQty\(barcode, Math\.max\(1, val\)\);/g, "storageService.updateProductMinOrderQty(barcode, Math.max(1, val));\n    setSessionEdited(prev => new Set(prev).add(barcode));");

// 5. Update UI Label
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
console.log('Updated AdminDashboard to use sortUnmodifiedFirst!');
