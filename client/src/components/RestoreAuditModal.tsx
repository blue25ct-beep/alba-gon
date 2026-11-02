import React, { useState, useEffect } from 'react';
import { RotateCcw, Package, Trash2, Clock, AlertTriangle, Check, X, ArrowRight } from 'lucide-react';
import { AuditItem, OrderHistoryEntry, OrderItem } from '../types';
import { storageService } from '../services/storage';

interface RestoreAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: (count: number, sourceName: string) => void;
}

export const RestoreAuditModal: React.FC<RestoreAuditModalProps> = ({
  isOpen,
  onClose,
  onRestored,
}) => {
  const [latestOrder, setLatestOrder] = useState<OrderHistoryEntry | null>(null);
  const [lastCleared, setLastCleared] = useState<{ timestamp: number; dateStr: string; reason: string; audits: AuditItem[] } | null>(null);
  const [serverBackup, setServerBackup] = useState<{ timestamp?: number; reason?: string; audits: AuditItem[] } | null>(null);
  const [recentDeleted, setRecentDeleted] = useState<AuditItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. 직전 발주 내역 로드
    const order = storageService.getLatestOrderForRecovery();
    setLatestOrder(order);

    // 2. 브라우저 최근 비운 실사 목록 로드
    const cleared = storageService.getLastClearedAudits();
    setLastCleared(cleared);

    // 3. 개별 삭제 품목 로드
    const deleted = storageService.getRecentlyDeletedAudits();
    setRecentDeleted(deleted);

    // 4. 로컬 봇 서버(포트 3001)의 디스크 비상 백업도 확인
    fetch('http://localhost:3001/api/restore-backup')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.audits) && data.audits.length > 0) {
          setServerBackup(data);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. 직전 발주 품목 복구 실행
  const handleRestoreFromOrder = () => {
    if (!latestOrder || !latestOrder.items || latestOrder.items.length === 0) return;

    const vendorLabel = latestOrder.vendor === 'SPCHAIN' ? '생필체인' : '유앤미24';
    const auditsToRestore: AuditItem[] = latestOrder.items.map((it: OrderItem, idx: number) => ({
      id: (Date.now() + idx).toString(),
      barcode: it.barcode,
      productName: it.productName,
      vendor: it.vendor || (latestOrder.vendor === 'SPCHAIN' ? 'spchain' : 'younme'),
      stockCount: it.currentStock ?? 0,
      targetStock: it.targetStock ?? (it.minOrderQty || 1),
      minOrderQty: it.minOrderQty ?? 1,
      workerName: (it as any).workerName || '발주복구',
      updatedAt: (it as any).updatedAt || new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isUnmapped: false,
    }));

    const result = storageService.restoreItemsToAudits(auditsToRestore);
    onRestored(result.addedCount, `직전 발주 품목 (${vendorLabel})`);
    onClose();
  };

  // 2. 직전에 비운 실사 목록 복구 실행 (브라우저 또는 봇 서버 백업)
  const handleRestoreFromCleared = (backupAudits: AuditItem[], label: string) => {
    if (!backupAudits || backupAudits.length === 0) return;
    const result = storageService.restoreItemsToAudits(backupAudits);
    onRestored(result.addedCount, label);
    onClose();
  };

  // 3. 개별 삭제된 품목 복구
  const handleRestoreDeletedItem = (item: AuditItem) => {
    const result = storageService.restoreItemsToAudits([item]);
    const remaining = recentDeleted.filter(a => a.barcode !== item.barcode);
    setRecentDeleted(remaining);
    localStorage.setItem('albagom_recent_deleted_audits_v1', JSON.stringify(remaining));
    onRestored(result.addedCount, `${item.productName}`);
  };

  const handleRestoreAllDeleted = () => {
    if (recentDeleted.length === 0) return;
    const result = storageService.restoreItemsToAudits(recentDeleted);
    setRecentDeleted([]);
    storageService.clearRecentlyDeletedAudits();
    onRestored(result.addedCount, '개별 삭제 품목 전체');
    onClose();
  };


  const hasAnyRecentData = Boolean(
    (latestOrder && latestOrder.items?.length > 0) ||
    (lastCleared && lastCleared.audits?.length > 0) ||
    (serverBackup && serverBackup.audits?.length > 0) ||
    recentDeleted.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">실사 / 발주 데이터 복구</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                실수로 지워진 실사 목록이나 직전에 발주 완료된 상품을 실사 목록으로 되살립니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Card 1: 직전 발주 완료 상품 되살리기 */}
          {latestOrder && latestOrder.items && latestOrder.items.length > 0 ? (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
                      <Package className="w-3.5 h-3.5" />
                      직전 발주 품목
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {latestOrder.vendor === 'SPCHAIN' ? '생필체인' : '유앤미24'}
                    </span>
                    <span className="text-xs text-gray-400">• {latestOrder.orderDate}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    총 {latestOrder.items.length}개 품목 발주 내역
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {latestOrder.items.slice(0, 5).map(it => it.productName).join(', ')}
                    {latestOrder.items.length > 5 ? ` 외 ${latestOrder.items.length - 5}건` : ''}
                  </p>
                </div>
                <button
                  onClick={handleRestoreFromOrder}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  발주 품목 복구 ({latestOrder.items.length}건)
                </button>
              </div>
            </div>
          ) : null}

          {/* Card 2: 직전에 비운 실사 목록 복구 (브라우저 또는 봇 백업) */}
          {(() => {
            const clearedList = lastCleared?.audits?.length ? lastCleared.audits : serverBackup?.audits?.length ? serverBackup.audits : [];
            const clearedDate = lastCleared?.dateStr || (serverBackup?.timestamp ? new Date(serverBackup.timestamp).toLocaleString('ko-KR') : '');
            const clearedReason = lastCleared?.reason || serverBackup?.reason || '실사 목록 비우기';

            if (!clearedList || clearedList.length === 0) return null;

            return (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:border-amber-300 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                        직전 비운 목록
                      </span>
                      <span className="text-xs font-semibold text-gray-600">{clearedReason}</span>
                      {clearedDate && <span className="text-xs text-gray-400">• {clearedDate}</span>}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      총 {clearedList.length}개 품목 실사 데이터
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {clearedList.slice(0, 5).map(it => it.productName).join(', ')}
                      {clearedList.length > 5 ? ` 외 ${clearedList.length - 5}건` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreFromCleared(clearedList, '직전에 비운 실사 목록')}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    비운 목록 복구 ({clearedList.length}건)
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Card 3: 최근 개별 삭제한 품목 */}
          {recentDeleted && recentDeleted.length > 0 && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  ✂️ 최근 개별 삭제한 품목 ({recentDeleted.length}건)
                </span>
                <button
                  onClick={handleRestoreAllDeleted}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  모두 복구
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {recentDeleted.map(item => (
                  <div key={item.barcode} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-xs">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-gray-800 truncate">{item.productName}</p>
                      <p className="text-gray-400 text-[11px]">{item.barcode} | 재고: {item.stockCount}개</p>
                    </div>
                    <button
                      onClick={() => handleRestoreDeletedItem(item)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 font-bold rounded text-xs transition-colors"
                    >
                      되살리기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state if nothing recent */}
          {!hasAnyRecentData && (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">최근 삭제되었거나 발주된 기록이 없습니다.</p>
              <p className="text-xs text-gray-400 mt-1">
                발주를 완료하거나 실사 목록을 비운 기록이 생기면 이 화면에서 언제든 되살릴 수 있습니다.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
