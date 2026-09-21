import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { QuantityModal } from '../components/QuantityModal';
import { PhotoCaptureModal } from '../components/PhotoCaptureModal';
import { AuditItem, Product } from '../types';
import { storageService } from '../services/storage';
import { cloudSyncService, SyncStatus } from '../services/cloudSyncService';
import { Trash2, Camera, RefreshCw, Check } from 'lucide-react';

export const WorkerApp: React.FC<{ selectedCategory?: 'YOUNME' | 'SPCHAIN' | null; onCategoryChange?: (c: 'YOUNME' | 'SPCHAIN' | null) => void; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ selectedCategory, onCategoryChange, onThemeChange, onTitleChange }) => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<Product | undefined>(undefined);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<'IDLE' | 'QUANTITY' | 'PHOTO'>('IDLE');
  const [workerName, setWorkerName] = useState('주간알바');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState(false);
  useEffect(() => {
    if (selectedCategory === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 자동발주');
    } else if (selectedCategory === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 자동발주');
    } else {
      onThemeChange?.('neutral');
      onTitleChange?.('🏢 편의점 통합 자동발주');
    }
  }, [selectedCategory, onThemeChange, onTitleChange]);

  useEffect(() => {
    setWorkerName(storageService.getSettings().workerName);
    setAudits(storageService.getAudits());

    cloudSyncService.connect(undefined, 'WORKER');

    const unsubSync = cloudSyncService.onSync((newAudits) => {
      setAudits(newAudits);
    });

    const unsubStatus = cloudSyncService.onStatusChange((st, time) => {
      setSyncStatus(st);
      if (time) setLastSyncTime(time);
    });

    const unsubClear = cloudSyncService.onClearCommand(() => {
      setAudits([]);
      storageService.clearAudits();
    });

    const unsubProducts = cloudSyncService.onProductsUpdate(() => { /* reload prevented */ });

    return () => {
      unsubSync();
      unsubStatus();
      unsubClear();
      unsubProducts();
      cloudSyncService.disconnect();
    };
  }, []);

  const handleBarcodeDetected = (barcode: string) => {
    if (step !== 'IDLE') return;

    setActiveBarcode(barcode);
    const { product } = storageService.findProduct(barcode);
    setDetectedProduct(product);

    if (product) {
      setPendingPhotos([]);
      setStep('QUANTITY');
    } else {
      setStep('PHOTO');
    }
  };

  const handlePhotoCaptured = (photos: string[]) => {
    setPendingPhotos(photos);
    setStep('QUANTITY');
  };

  const handlePhotoSkipped = () => {
    setPendingPhotos([]);
    setStep('QUANTITY');
  };

  const handleSaveQuantity = (quantity: number) => {
    if (!activeBarcode) return;

    const isUnmapped = !detectedProduct;
    const productName = detectedProduct ? detectedProduct.name : '미등록 상품';

    try {
      storageService.saveAudit({
        barcode: activeBarcode,
        productName,
        stockCount: quantity,
        targetStock: detectedProduct ? detectedProduct.targetStock : 1,
        minOrderQty: detectedProduct ? detectedProduct.minOrderQty : 1,
        photoUrls: pendingPhotos,
        isUnmapped,
        workerName,
        vendor: selectedCategory === 'SPCHAIN' ? 'spchain' : 'younme',
      });

      const updated = storageService.getAudits();
      setAudits(updated);
      handleCloseModals();

      cloudSyncService.broadcastAudits(updated, 'WORKER');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        alert('저장 공간이 꽉 찼습니다! 기존 실사 목록을 먼저 본사로 전송하고 비워주세요.');
      } else {
        alert('저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseModals = () => {
    setStep('IDLE');
    setActiveBarcode(null);
    setDetectedProduct(undefined);
    setPendingPhotos([]);
  };

  const handleDeleteAudit = (id: string) => {
    storageService.deleteAudit(id);
    const updated = storageService.getAudits();
    setAudits(updated);
    cloudSyncService.broadcastAudits(updated, 'WORKER');
  };

  const handleManualSendToAdmin = async () => {
    setIsSending(true);
    const success = await cloudSyncService.broadcastAudits(audits, 'WORKER');
    setIsSending(false);
    if (success) {
      setSendSuccessMsg(true);
      setTimeout(() => setSendSuccessMsg(false), 3000);
    }
  };

  
  const isConnected = syncStatus === 'CONNECTED';

  const getProductCategory = (barcode: string) => {
    const product = storageService.findProduct(barcode).product;
    return product ? product.category : '상온';
  };

  const filteredAudits = selectedCategory === null ? [] : audits.filter((a: AuditItem) => {
    const cat = getProductCategory(a.barcode);
    if (selectedCategory === 'YOUNME') return a.vendor === 'younme' || (!a.vendor && (cat === '상온' || cat === '냉장' || !cat));
    if (selectedCategory === 'SPCHAIN') return a.vendor === 'spchain' || (!a.vendor && cat === '주류');
    return true;
  });

  const unmappedCount = filteredAudits.filter((a: AuditItem) => a.isUnmapped).length;

  if (selectedCategory === null) {
    return (
      <div className="max-w-md mx-auto px-5 py-12 space-y-8 flex flex-col min-h-[80vh] justify-center items-center">
        <h2 className="text-2xl font-bold text-ink mb-4">어떤 작업을 시작할까요?</h2>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => onCategoryChange?.('YOUNME')}
            className="w-full h-24 rounded-3xl bg-sage-50 hover:bg-sage-100 border border-sage-200 text-sage-deep font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span>상온 / 냉장</span>
            <span className="text-sm font-medium text-sage opacity-80">(유앤미 발주)</span>
          </button>
          
          <button
            onClick={() => onCategoryChange?.('SPCHAIN')}
            className="w-full h-24 rounded-3xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span>주류</span>
            <span className="text-sm font-medium text-blue-600 opacity-80">(생필체인 발주)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-6 pb-24">
      <div className="text-center text-ink-faint text-xs py-1">최종 업데이트: {__BUILD_TIME__}</div>
      {/* 오늘 실사 현황 */}
      <section>
        <div className="mb-4">
          <button type="button" onClick={() => onCategoryChange?.(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1 bg-surface py-2 px-4 rounded-full border border-line"
          >
            ← 카테고리 선택으로 돌아가기
          </button>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-ink-faint">{workerName}</p>
            <p className="mt-1 text-[28px] leading-none font-semibold text-ink tabular">
              {filteredAudits.length}
              <span className="ml-1.5 text-base font-normal text-ink-faint">개 확인</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-ink-faint">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-sage' : 'bg-clay'}`}
              aria-hidden
            />
            <span>{isConnected ? '연결됨' : '연결 중'}</span>
          </div>
        </div>

        {unmappedCount > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-clay">
            <Camera className="w-3.5 h-3.5" />
            사진으로 남긴 미등록 {unmappedCount}개
          </p>
        )}
      </section>

      {/* 스캐너 */}
      <BarcodeScanner onDetected={handleBarcodeDetected} isPaused={step !== 'IDLE'} />

      {/* 스캔 목록 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-soft">스캔한 재고</h2>
          {filteredAudits.length > 0 && (
            <button
              type="button"
              onClick={handleManualSendToAdmin}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-sage hover:text-sage-deep disabled:text-ink-faint transition-colors"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : sendSuccessMsg ? (
                <Check className="w-3.5 h-3.5" />
              ) : null}
              <span>{sendSuccessMsg ? '보냈습니다' : '지금 보내기'}</span>
            </button>
          )}
        </div>

        {filteredAudits.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-faint leading-relaxed text-balance break-keep">
            상품 바코드를 비추면 자동으로 인식합니다
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {filteredAudits.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink leading-snug break-keep">
                    {item.productName}
                    {item.isUnmapped && (
                      <span className="ml-1.5 align-middle text-[12px] text-clay">사진</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-faint tabular">
                    {item.barcode} · {item.updatedAt}
                  </p>
                </div>

                <span className="text-[17px] font-semibold text-ink tabular shrink-0">
                  {item.stockCount}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteAudit(item.id)}
                  aria-label={`${item.productName} 삭제`}
                  className="w-9 h-9 rounded-full text-ink-faint hover:text-brick hover:bg-brick-soft flex items-center justify-center shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {lastSyncTime && filteredAudits.length > 0 && (
          <p className="pt-1 text-[13px] text-ink-faint">마지막 전송 {lastSyncTime}</p>
        )}
      </section>

      {step === 'PHOTO' && activeBarcode && (
        <PhotoCaptureModal
          barcode={activeBarcode}
          onCaptured={handlePhotoCaptured}
          onSkip={handlePhotoSkipped}
          onClose={handleCloseModals}
        />
      )}

      {step === 'QUANTITY' && activeBarcode && (
        <QuantityModal
          barcode={activeBarcode}
          product={detectedProduct}
          initialQuantity={1}
          onSave={handleSaveQuantity}
          onClose={handleCloseModals}
        />
      )}
          </div>
  );
};
