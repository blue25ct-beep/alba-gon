import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Product } from '../types';
import { storageService } from '../services/storage';
import { analyzeAndRecommend } from '../services/smartRecommendation';

interface ProductStockSetupModalProps {
  onClose: () => void;
  onUpdated: () => void;
}

export const ProductStockSetupModal: React.FC<ProductStockSetupModalProps> = ({
  onClose,
  onUpdated,
}) => {
  const [products, setProducts] = useState<Product[]>(storageService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());
  type SortColumn = 'none' | 'targetStock' | 'minOrderQty';
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
  };
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [batchTargetStock, setBatchTargetStock] = useState<number>(10);
  const [batchMinOrderQty, setBatchMinOrderQty] = useState<number>(10);
  const [savedId, setSavedId] = useState<string | null>(null);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const recommendations = React.useMemo(() => analyzeAndRecommend(storageService.getOrderHistory(), products), [products]);
  let filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  
  const handleMarkReviewed = (barcode: string) => {
    storageService.markProductAsReviewed(barcode);
    setProducts(storageService.getProducts());
    onUpdated();
  };

  
  if (sortColumn !== 'none') {
    filtered.sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0;
      const valB = (b as any)[sortColumn] ?? 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }

  if (sortUnmodifiedFirst) {
    filtered.sort((a, b) => {
      const isUnmodA = !a.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !b.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }

  const handleItemChange = (
    barcode: string,
    field: 'targetStock' | 'minOrderQty',
    val: number
  ) => {
    const updated = products.map((p) =>
      p.barcode === barcode ? { ...p, [field]: Math.max(1, val), updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } : p
    );
    setProducts(updated);
    setSessionEdited(prev => new Set(prev).add(barcode));
    storageService.saveProducts(updated);
    setSavedId(barcode);
    setTimeout(() => setSavedId(null), 1000);
    onUpdated();
  };

  const handleBatchUpdateTargetStock = () => {
    if (!confirm(`${filtered.length}개 상품의 목표 재고를 ${batchTargetStock}개로 바꿉니다.`)) return;

    const filteredBarcodes = new Set(filtered.map((f) => f.barcode));
    const updated = products.map((p) =>
      filteredBarcodes.has(p.barcode) ? { ...p, targetStock: batchTargetStock, updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } : p
    );

    setProducts(updated);
    storageService.saveProducts(updated);
    onUpdated();
  };

  const handleBatchUpdateMinOrderQty = () => {
    if (!confirm(`${filtered.length}개 상품의 발주단위를 ${batchMinOrderQty}개로 바꿉니다.`)) return;

    const filteredBarcodes = new Set(filtered.map((f) => f.barcode));
    const updated = products.map((p) =>
      filteredBarcodes.has(p.barcode) ? { ...p, minOrderQty: batchMinOrderQty, updatedAt: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } : p
    );

    setProducts(updated);
    storageService.saveProducts(updated);
    onUpdated();
  };

  const numberFieldClass =
    'w-16 h-9 text-center rounded-lg bg-canvas border border-line text-sm text-ink tabular focus:outline-none focus:border-sage-300 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px] p-5">
      <div className="bg-surface rounded-3xl w-full max-w-4xl shadow-xl animate-settle overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-6 pb-5 flex justify-between items-start gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">목표 재고</h2>
            <p className="mt-1 text-sm text-ink-soft leading-relaxed break-keep">
              여기서 정한 목표 재고를 채우도록 발주 수량이 계산됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 -mr-2 -mt-1 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 · 일괄 변경 */}
        <div className="px-6 pb-5 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-faint font-semibold">내림차순:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortColumn === 'targetStock' && sortOrder === 'desc') setSortColumn('none');
                      else { setSortColumn('targetStock'); setSortOrder('desc'); }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border flex items-center gap-1 ${
                      sortColumn === 'targetStock' && sortOrder === 'desc'
                        ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                        : 'bg-surface text-ink hover:bg-canvas border-line'
                    }`}
                  >
                    <span>🎯 목표 수량 많은순</span>
                    {sortColumn === 'targetStock' && <span>{sortOrder === 'desc' ? '▼' : '▲'}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortColumn === 'minOrderQty' && sortOrder === 'desc') setSortColumn('none');
                      else { setSortColumn('minOrderQty'); setSortOrder('desc'); }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border flex items-center gap-1 ${
                      sortColumn === 'minOrderQty' && sortOrder === 'desc'
                        ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                        : 'bg-surface text-ink hover:bg-canvas border-line'
                    }`}
                  >
                    <span>📦 발주 단위 큰순</span>
                    {sortColumn === 'minOrderQty' && <span>{sortOrder === 'desc' ? '▼' : '▲'}</span>}
                  </button>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sortUnmodifiedFirst}
                    onChange={(e) => {
                      setSortUnmodifiedFirst(e.target.checked);
                      if (!e.target.checked) setSessionEdited(new Set());
                    }}
                    className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
                  />
                  💡 수정 안 된 상품 위로 올리기
                </label>
              </div>
              <input
                type="text"
                placeholder="상품명 또는 바코드"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="상품 검색"
                className="w-full h-10 pl-10 pr-4 rounded-full bg-canvas border border-line text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage-300 transition-colors"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="분류"
              className="h-10 px-4 rounded-full bg-canvas border border-line text-sm text-ink focus:outline-none focus:border-sage-300 transition-colors"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? '전체' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
            <span className="text-[13px] text-ink-faint">
              검색된 {filtered.length}개를 한 번에
            </span>
            <div className="flex items-center gap-2 bg-sunken rounded-full pr-1 pl-3 h-9">
              <span className="text-[13px]">목표</span>
              <input
                type="number"
                min="1"
                value={batchTargetStock}
                onChange={(e) => setBatchTargetStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-7 text-center rounded bg-surface border-none text-sm tabular focus:outline-none"
              />
              <button
                onClick={handleBatchUpdateTargetStock}
                className="h-7 px-3 rounded-full bg-white shadow-sm text-[12px] font-medium text-ink-soft hover:text-ink transition-colors"
              >
                적용
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-sunken rounded-full pr-1 pl-3 h-9">
              <span className="text-[13px]">발주단위</span>
              <input
                type="number"
                min="1"
                value={batchMinOrderQty}
                onChange={(e) => setBatchMinOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-7 text-center rounded bg-surface border-none text-sm tabular focus:outline-none"
              />
              <button
                onClick={handleBatchUpdateMinOrderQty}
                className="h-7 px-3 rounded-full bg-white shadow-sm text-[12px] font-medium text-ink-soft hover:text-ink transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-line shrink-0" />

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="text-[13px] text-ink-faint border-b border-line">
                <th className="font-medium py-3 pr-3">상품</th>
                <th
                  onClick={() => handleToggleSort('targetStock')}
                  className="font-medium py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
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
                  className="font-medium py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
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
                </th>
                <th className="py-3 pl-3 w-16">
                  <span className="sr-only">저장 상태</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.slice(0, 100).map((p) => (
                <tr key={p.barcode}>
                  <td className="py-3 pr-3 max-w-md">
                    <span className="block text-ink leading-snug break-keep">{p.name}</span>
                    <span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                      {p.barcode} · {p.category}
                      {p.reviewStatus === 'APPROPRIATE' ? (
                        ` · ✅ 적절함 확인: ${p.reviewedAt || p.updatedAt}`
                      ) : (p.reviewStatus === 'MODIFIED' || p.updatedAt) ? (
                        ` · ✏️ 수정: ${p.updatedAt}`
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(p.barcode)}
                          className="ml-2 inline-flex text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors align-middle shadow-sm"
                        >
                          ✅ 적절함
                        </button>
                      )}
                      {p.lastOrderDate ? ` · 📦 발주: ${p.lastOrderDate}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {recommendations.has(p.barcode) && (
                      <div className="mb-1 flex flex-col items-center">
                        <button onClick={() => handleItemChange(p.barcode, 'targetStock', recommendations.get(p.barcode)!.recommendedStock)} className="text-[11px] text-white bg-blue-500 hover:bg-blue-600 px-1.5 py-0.5 rounded font-medium shadow-sm transition-colors cursor-pointer whitespace-nowrap">
                          💡 추천: {recommendations.get(p.barcode)!.recommendedStock}
                        </button>
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={p.targetStock}
                      onChange={(e) =>
                        handleItemChange(p.barcode, 'targetStock', parseInt(e.target.value) || 1)
                      }
                      aria-label={`${p.name} 목표 재고`}
                      className={numberFieldClass}
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={p.minOrderQty}
                      onChange={(e) =>
                        handleItemChange(p.barcode, 'minOrderQty', parseInt(e.target.value) || 1)
                      }
                      aria-label={`${p.name} 최소 발주단위`}
                      className={numberFieldClass}
                    />
                  </td>
                  <td className="py-3 pl-3">
                    {savedId === p.barcode && (
                      <span className="inline-flex items-center gap-1 text-[13px] text-sage">
                        <Check className="w-3.5 h-3.5" />
                        저장
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 100 && (
            <p className="py-4 text-center text-[13px] text-ink-faint">
              100개까지 보입니다. 검색으로 좁혀 주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
