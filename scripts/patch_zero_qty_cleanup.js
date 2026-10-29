const fs = require('fs');

let code = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `        // 발주 완료된 품목은 언제든 복구할 수 있도록 직전 백업에 보존
        const orderedAuditsToBackup: AuditItem[] = successItems.map((it, idx) => ({
          id: (Date.now() + idx).toString(),
          barcode: it.barcode,
          productName: it.productName,
          vendor: it.vendor || (vendor === 'SPCHAIN' ? 'spchain' : 'younme'),
          stockCount: it.currentStock ?? 0,
          targetStock: it.targetStock ?? (it.minOrderQty || 1),
          minOrderQty: it.minOrderQty ?? 1,
          workerName: (it as any).workerName || '발주완료',
          updatedAt: (it as any).updatedAt || new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          isUnmapped: false,
        }));
        storageService.saveLastClearedAudits(orderedAuditsToBackup, \`\${vendorName} 발주 완료\`);

        // 발주 완료된 품목은 실사 목록에서 자동 제거하여 중복 발주 방지 (로컬 및 원격 즉시 반영)
        const remainingAudits = storageService.getAudits().filter((a) => !successOriginalBarcodes.has(a.barcode));
        storageService.saveAudits(remainingAudits);
        setAudits(remainingAudits);
        if (remainingAudits.length === 0) {
          cloudSyncService.broadcastClear('ADMIN');
        } else {
          cloudSyncService.broadcastAudits(remainingAudits, 'ADMIN');
        }
        cloudSyncService.broadcastBackup(); // Ensure backup is updated`;

const replacementStr = `        // ★ 점장님 요청: 발주 성공 시 발주 품목뿐만 아니라 발주 수량이 0인 실사 품목(재고 충분 품목)도 함께 자동 정리
        const zeroQtyBarcodes = new Set<string>();
        orderItems.forEach((it) => {
          if (it.finalOrderQty === 0) {
            // 해당 벤더 상품이거나 일반 상온 상품
            if (it.vendor?.toUpperCase() === vendor || (vendor === 'YOUNME' && it.vendor !== 'spchain')) {
              zeroQtyBarcodes.add(it.barcode);
            }
          }
        });

        // 남은 다른 벤더 발주 품목(finalOrderQty > 0)이 전혀 없다면, 전체 0개 실사 품목도 일괄 정리
        const otherPendingOrdersCount = itemsToOrder.filter((it) => !successOriginalBarcodes.has(it.barcode)).length;
        if (otherPendingOrdersCount === 0) {
          orderItems.forEach((it) => {
            if (it.finalOrderQty === 0) {
              zeroQtyBarcodes.add(it.barcode);
            }
          });
        }

        const toRemoveBarcodes = new Set([...successOriginalBarcodes, ...zeroQtyBarcodes]);

        // 발주 완료 품목 및 실사 완료(수량 0) 품목은 언제든 복구할 수 있도록 직전 백업에 안전 보존
        const allAuditsNow = storageService.getAudits();
        const clearedAuditsToBackup: AuditItem[] = allAuditsNow.filter((a) => toRemoveBarcodes.has(a.barcode));
        storageService.saveLastClearedAudits(clearedAuditsToBackup, \`\${vendorName} 발주 성공 (발주 및 수량 0 실사 품목 정리)\`);

        // 발주 완료 품목 및 발주 수량 0인 실사 품목 완전 제거 (로컬 및 원격 즉시 반영)
        const remainingAudits = allAuditsNow.filter((a) => !toRemoveBarcodes.has(a.barcode));
        storageService.saveAudits(remainingAudits);
        setAudits(remainingAudits);
        if (remainingAudits.length === 0) {
          cloudSyncService.broadcastClear('ADMIN');
        } else {
          cloudSyncService.broadcastAudits(remainingAudits, 'ADMIN');
        }
        cloudSyncService.broadcastBackup();`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
} else {
  code = code.replace(targetStr.replace(/\n/g, '\r\n'), replacementStr.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('client/src/pages/AdminDashboard.tsx', code, 'utf8');
console.log('AdminDashboard.tsx patched successfully with 0-qty cleanup');
