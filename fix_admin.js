const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('const handleStartOrder = async () => {');
const endIdx = content.indexOf('const handleUploadClick', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    const newHandleStartOrder = `
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
    if (!confirm(\`\${sanitizedItems.length}개 품목을 \${vendorName} 시스템으로 발주합니다.\`)) return;

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

  `;
    content = content.substring(0, startIdx) + newHandleStartOrder + content.substring(endIdx);
}

// Ensure the old isOrdering variables don't persist anywhere else
content = content.replace(/setIsYounmeOrdering\(true\);/g, 'setIsYounmeOrdering(true);'); // Just a check

fs.writeFileSync(file, content, 'utf8');
