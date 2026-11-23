/**
 * 발주 완료 직후 자동발주 요청 리스트 vs 실제 도매 사이트(유앤미 상온·저온 / 생필체인 주류)
 * 장바구니·발주 내역을 교차 비교하여 누락 및 수량 불일치를 감지하고 디스코드 리포트를 생성합니다.
 */

function normalizeBarcode(bc) {
  return String(bc || '').replace(/[^0-9A-Za-z_]/g, '').trim();
}

/**
 * @param {Array<{barcode: string, productName?: string, expectedQty: number, unitLabel?: string, subDetail?: string}>} requestedItems
 * @param {Array<{barcode: string, name?: string, qty: number}>} actualSiteItems
 * @param {{ unitLabel?: string }} options
 */
function reconcileOrders(requestedItems = [], actualSiteItems = [], options = {}) {
  const defaultUnit = options.unitLabel || '개';

  // 실제 사이트 목록을 바코드별 수량 합산 맵으로 구성
  const actualMap = new Map();
  for (const act of actualSiteItems) {
    const bc = normalizeBarcode(act.barcode);
    if (!bc) continue;
    const prev = actualMap.get(bc);
    const qty = Number(act.qty) || 0;
    if (prev) {
      prev.qty += qty;
      if (!prev.name && act.name) prev.name = act.name;
    } else {
      actualMap.set(bc, {
        barcode: bc,
        name: act.name || '',
        qty,
      });
    }
  }

  // 요청 목록도 동일 바코드 중복 시 합산
  const reqMap = new Map();
  for (const req of requestedItems) {
    const bc = normalizeBarcode(req.barcode);
    if (!bc) continue;
    const expectedQty = Number(req.expectedQty) || 0;
    if (expectedQty <= 0) continue;
    const prev = reqMap.get(bc);
    if (prev) {
      prev.expectedQty += expectedQty;
    } else {
      reqMap.set(bc, {
        barcode: bc,
        productName: req.productName || bc,
        expectedQty,
        unitLabel: req.unitLabel || defaultUnit,
        subDetail: req.subDetail || '',
      });
    }
  }

  const matched = [];
  const missing = [];
  const qtyMismatch = [];

  for (const req of reqMap.values()) {
    const act = actualMap.get(req.barcode);
    if (!act || act.qty <= 0) {
      missing.push({
        barcode: req.barcode,
        productName: req.productName,
        expectedQty: req.expectedQty,
        actualQty: 0,
        unitLabel: req.unitLabel,
        subDetail: req.subDetail,
      });
    } else if (act.qty < req.expectedQty) {
      // 실제 사이트에 요청 수량보다 적게 들어간 경우 (부분 누락)
      qtyMismatch.push({
        barcode: req.barcode,
        productName: req.productName,
        expectedQty: req.expectedQty,
        actualQty: act.qty,
        unitLabel: req.unitLabel,
        subDetail: req.subDetail,
      });
    } else if (act.qty > req.expectedQty) {
      // 기존에 장바구니에 담겨 있던 수량과 합산되었거나 더 많이 담긴 경우 -> 참고용 불일치(과다)로 분류
      qtyMismatch.push({
        barcode: req.barcode,
        productName: req.productName,
        expectedQty: req.expectedQty,
        actualQty: act.qty,
        unitLabel: req.unitLabel,
        subDetail: req.subDetail,
        isExcess: true,
      });
    } else {
      matched.push({
        barcode: req.barcode,
        productName: req.productName,
        expectedQty: req.expectedQty,
        actualQty: act.qty,
        unitLabel: req.unitLabel,
      });
    }
  }

  return {
    requestedCount: reqMap.size,
    actualTotalOnSite: actualMap.size,
    matchedCount: matched.length,
    missingCount: missing.length,
    qtyMismatchCount: qtyMismatch.length,
    matched,
    missing,
    qtyMismatch,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * 디스코드 알바곤 봇 전송용 교차검증 리포트 포매팅 (2000자 제한 안전 처리)
 */
function formatReconcileDiscordReport(vendorLabel, result) {
  if (!result || result.requestedCount === 0) return '';

  const hasIssues = result.missingCount > 0 || result.qtyMismatchCount > 0;
  if (!hasIssues) {
    return (
      `✅ **[발주 교차검증 100% 일치]** ${vendorLabel}\n` +
      `• 요청 **${result.requestedCount}건** ➔ 실제 사이트 반영 **${result.matchedCount}건** 확인 완료 (누락 0건)`
    );
  }

  const lines = [
    `🚨 **[발주 교차검증 누락/불일치 감지]** ${vendorLabel}`,
    `• 요청 **${result.requestedCount}건** 중 일치 **${result.matchedCount}건** / ❌ 누락 **${result.missingCount}건** / ⚠️ 수량불일치 **${result.qtyMismatchCount}건**`,
  ];

  if (result.missing.length > 0) {
    lines.push(`\n❌ **누락 품목 (${result.missing.length}건)** — 실제 사이트에서 확인되지 않음:`);
    result.missing.slice(0, 15).forEach((it, idx) => {
      const sub = it.subDetail ? ` (${it.subDetail})` : '';
      lines.push(`${idx + 1}. ${it.productName} (\`${it.barcode}\`) — 요청 **${it.expectedQty}${it.unitLabel}**${sub}`);
    });
    if (result.missing.length > 15) {
      lines.push(`... 외 ${result.missing.length - 15}건`);
    }
  }

  if (result.qtyMismatch.length > 0) {
    lines.push(`\n⚠️ **수량 불일치 (${result.qtyMismatch.length}건)**:`);
    result.qtyMismatch.slice(0, 15).forEach((it, idx) => {
      const sub = it.subDetail ? ` (${it.subDetail})` : '';
      const note = it.isExcess ? ' *(기존 장바구니 합산 가능)*' : '';
      lines.push(
        `${idx + 1}. ${it.productName} (\`${it.barcode}\`) — 요청 **${it.expectedQty}${it.unitLabel}**${sub} ➔ 실제 **${it.actualQty}${it.unitLabel}**${note}`
      );
    });
    if (result.qtyMismatch.length > 15) {
      lines.push(`... 외 ${result.qtyMismatch.length - 15}건`);
    }
  }

  const full = lines.join('\n');
  return full.length > 1950 ? full.slice(0, 1940) + '\n...(생략)' : full;
}

module.exports = {
  reconcileOrders,
  formatReconcileDiscordReport,
};
