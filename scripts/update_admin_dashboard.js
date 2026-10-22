const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Fetch products from /api/products in useEffect and subscribe to products update
const oldFetch = `    fetch('http://localhost:3001/api/audits')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.audits) && data.audits.length > 0) {
          storageService.saveAudits(data.audits);
          setAudits(data.audits);
        }
      })
      .catch(() => {});`;

const newFetch = `    fetch('http://localhost:3001/api/audits')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.audits) && data.audits.length > 0) {
          storageService.saveAudits(data.audits);
          setAudits(data.audits);
        }
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
          const local = storageService.getProducts();
          const pMap = new Map();
          local.forEach(p => pMap.set(p.barcode, p));
          data.products.forEach((p: Product) => {
            const ex = pMap.get(p.barcode);
            pMap.set(p.barcode, { ...ex, ...p });
          });
          const merged = Array.from(pMap.values());
          storageService.saveProducts(merged, false);
          setProducts(merged);
        }
      })
      .catch(() => {});

    const unsubProducts = cloudSyncService.onProductsUpdate(() => {
      setProducts(storageService.getProducts());
    });`;

// Replace cleanup return
const oldReturn = `    return () => {
      unsubSync();
      unsubStatus();
      unsubHistory();
    };`;

const newReturn = `    return () => {
      unsubSync();
      unsubStatus();
      unsubHistory();
      unsubProducts();
    };`;

// 2. Calculation of targetStock and minOrderQty (master product priority)
const oldCalc = `    const targetStock =
      audit.targetStock !== undefined ? audit.targetStock : product ? product.targetStock : 1;

    const minOrderQty =
      audit.minOrderQty !== undefined
        ? Math.max(1, audit.minOrderQty)
        : product
          ? Math.max(1, product.minOrderQty)
          : 1;`;

const newCalc = `    const targetStock =
      product && product.targetStock !== undefined
        ? product.targetStock
        : (audit.targetStock !== undefined ? audit.targetStock : 1);

    const minOrderQty =
      product && product.minOrderQty !== undefined
        ? Math.max(1, product.minOrderQty)
        : (audit.minOrderQty !== undefined ? Math.max(1, audit.minOrderQty) : 1);`;

// 3. Status badge rendering
const oldBadge = `                                      {masterProduct?.updatedAt ? (
                                        <span className="text-[11px] text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded font-medium">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleMarkReviewed(item.barcode)}
                                          className="text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors shadow-sm"
                                        >
                                          ✅ 현재 값 적절함
                                        </button>
                                      )}`;

const newBadge = `                                      {masterProduct?.reviewStatus === 'APPROPRIATE' ? (
                                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                          ✅ 적절함 확인: {masterProduct.reviewedAt || masterProduct.updatedAt}
                                        </span>
                                      ) : (masterProduct?.reviewStatus === 'MODIFIED' || masterProduct?.updatedAt) ? (
                                        <span className="text-[11px] text-sage-700 bg-sage-50 border border-sage-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      ) : (
                                        <div className="inline-flex items-center gap-1.5">
                                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                            ⚠️ 미확인
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleMarkReviewed(item.barcode)}
                                            className="text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors shadow-sm"
                                            title="이 상품의 현재 목표재고 및 발주단위를 영구 승인합니다."
                                          >
                                            ✅ 현재 값 적절함
                                          </button>
                                        </div>
                                      )}`;

const norm = s => s.replace(/\r\n/g, '\n');
let normCode = norm(code);

if (normCode.includes(norm(oldFetch))) {
  normCode = normCode.replace(norm(oldFetch), norm(newFetch));
  console.log('1. fetch /api/products added');
} else {
  console.error('Failed 1');
}

if (normCode.includes(norm(oldReturn))) {
  normCode = normCode.replace(norm(oldReturn), norm(newReturn));
  console.log('2. cleanup updated');
} else {
  console.error('Failed 2');
}

if (normCode.includes(norm(oldCalc))) {
  normCode = normCode.replace(norm(oldCalc), norm(newCalc));
  console.log('3. master product priority calculation applied');
} else {
  console.error('Failed 3');
}

if (normCode.includes(norm(oldBadge))) {
  normCode = normCode.replace(norm(oldBadge), norm(newBadge));
  console.log('4. status badges updated');
} else {
  console.error('Failed 4');
}

fs.writeFileSync(file, normCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('AdminDashboard.tsx finished updating!');
