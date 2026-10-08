import { OrderHistoryEntry, Product } from '../types';

export function analyzeAndRecommend(history: OrderHistoryEntry[], currentProducts: Product[]) {
  const recommendations = new Map<string, { recommendedStock: number; reason: string }>();

  // Filter history to last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  // Count order frequency and quantities per product
  const productStats = new Map<string, { orderCount: number, totalQty: number, avgQtyPerOrder: number }>();

  for (const entry of history) {
    for (const item of entry.items) {
      if (!productStats.has(item.barcode)) {
        productStats.set(item.barcode, { orderCount: 0, totalQty: 0, avgQtyPerOrder: 0 });
      }
      const stat = productStats.get(item.barcode)!;
      stat.orderCount += 1;
      stat.totalQty += item.finalOrderQty;
    }
  }

  const HISTORY_LIMIT = Math.min(30, history.length);

  for (const [barcode, stat] of productStats.entries()) {
    stat.avgQtyPerOrder = stat.totalQty / stat.orderCount;
    
    // Find master product
    const product = currentProducts.find(p => p.barcode === barcode);
    if (!product) continue;

    const currentTarget = product.targetStock || 1;
    
    // Smart Rule 1: If ordered frequently (e.g. > 4 times in recent history), suggest increasing target stock.
    if (stat.orderCount >= 5 && history.length >= 5) {
      const suggested = currentTarget + Math.max(1, Math.round(stat.avgQtyPerOrder / 2));
      recommendations.set(barcode, {
        recommendedStock: suggested,
        reason: `최근 ${stat.orderCount}회 빈번한 발주 발생`
      });
    }
    // Smart Rule 2: If total qty ordered is very high relative to target stock
    else if (stat.totalQty > currentTarget * 5 && history.length >= 3) {
      const suggested = currentTarget + Math.round(stat.avgQtyPerOrder);
      recommendations.set(barcode, {
        recommendedStock: suggested,
        reason: `누적 발주량(${stat.totalQty}개) 과다`
      });
    }
  }

  return recommendations;
}
