import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { QuantityModal } from '../components/QuantityModal';
import { PhotoCaptureModal } from '../components/PhotoCaptureModal';
import { AuditItem, Product } from '../types';
import { storageService } from '../services/storage';
import { cloudSyncService, SyncStatus } from '../services/cloudSyncService';
import { Trash2, Camera, RefreshCw, Check, Lock } from 'lucide-react';
import { soundManager } from '../services/sound';

export const WorkerApp: React.FC<{ selectedCategory?: 'YOUNME' | 'SPCHAIN' | null; onCategoryChange?: (c: 'YOUNME' | 'SPCHAIN' | null) => void; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void; onSwitchMode?: (mode: 'WORKER' | 'ADMIN') => void }> = ({ selectedCategory, onCategoryChange, onThemeChange, onTitleChange, onSwitchMode }) => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<Product | undefined>(undefined);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<'IDLE' | 'QUANTITY' | 'PHOTO'>('IDLE');
  const [workerName, setWorkerName] = useState('주간알바');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const initialWorkers = storageService.getSettings().workers || [];
  const [authList, setAuthList] = useState<any[]>(initialWorkers);
  const [requireAuth, setRequireAuth] = useState(initialWorkers.length > 0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [isCheckFinished, setIsCheckFinished] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; sub?: string } | null>(null);
  
  const sendDiscordNotification = (message: string) => {
    const webhookUrl = storageService.getSettings().discordWebhookUrl;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      }).catch(err => console.error('Discord webhook error', err));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastScanTime && !isCheckFinished && audits.length > 0) {
        const diff = Date.now() - lastScanTime;
        if (diff >= 30 * 60 * 1000) { // 30 mins
          const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
          sendDiscordNotification(`⏰ **[스캔 일시 중단 안내]** 30분 동안 추가 스캔이 없습니다. (근무자: ${workerName}, 구분: ${vendorLabel})\n관리자 페이지에서 실사 내역을 확인해 주세요.`);
          setIsCheckFinished(true);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastScanTime, isCheckFinished, audits.length, workerName, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 주류 발주');
    } else if (selectedCategory === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 상온 발주');
    } else {
      onThemeChange?.('neutral');
      onTitleChange?.('발주 모드 선택');
    }
  }, [selectedCategory, onThemeChange, onTitleChange]);

  useEffect(() => {
    setWorkerName(storageService.getSettings().workerName);
    let lastClearedAt = 0;
    try { lastClearedAt = parseInt(localStorage.getItem('albagom_last_cleared_at') || '0', 10); } catch(e){}
    const initialAudits = storageService.getAudits().filter((a: any) => {
      const auditTime = parseInt(a.id, 10);
      if (!isNaN(auditTime) && auditTime < lastClearedAt) return false;
      return true;
    });
    if (initialAudits.length !== storageService.getAudits().length) {
      storageService.saveAudits(initialAudits);
    }
    setAudits(initialAudits);

    cloudSyncService.connect(undefined, 'WORKER');
    // 초기 마운트 시 구형 캐시로 클라우드를 덮어쓰지 않고, 연결 후 수신되는 클라우드 데이터와 자동 병합하도록 대기

    const unsubSync = cloudSyncService.onSync((newAudits) => {
      setAudits(newAudits);
    });

    const unsubStatus = cloudSyncService.onStatusChange((st, time) => {
      setSyncStatus(st);
      if (time) setLastSyncTime(time);
    });


    const unsubAuth = cloudSyncService.onAuthUpdate((workers) => {
      setAuthList(workers);
      
      const settings = storageService.getSettings();
      storageService.saveSettings({ ...settings, workers });

      if (workers && workers.length > 0) {
        setRequireAuth(true);
      } else {
        setRequireAuth(false);
        setIsLoggedIn(true);
      }
    });
  
    const unsubClear = cloudSyncService.onClearCommand(() => {
      const current = storageService.getAudits();
      if (current.length === 0) {
        setAudits([]);
        storageService.clearAudits();
      } else {
        console.warn('[WorkerApp] 근무자 실사 보호: 외부 clear 명령 무시');
      }
    });

    const handleWakeup = () => {
      if (document.visibilityState === 'visible') {
        const local = storageService.getAudits();
        if (local.length > 0) {
          setAudits(local);
          cloudSyncService.broadcastAudits(local, 'WORKER');
        }
      }
    };
    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('pageshow', handleWakeup);

    const unsubProducts = cloudSyncService.onProductsUpdate(() => { /* reload prevented */ });

    return () => {
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('pageshow', handleWakeup);
      unsubSync();
      unsubStatus();
      unsubClear();
      if(typeof unsubAuth !== "undefined") unsubAuth();
      unsubProducts();
      cloudSyncService.disconnect();
    };
  }, []);

  const handleBarcodeDetected = (rawBarcode: string) => {
    if (step !== 'IDLE') return;

    let barcode = rawBarcode.trim();
    if (barcode.startsWith('http') || barcode.includes('/01/')) {
      const gs1Match = barcode.match(/\/01\/0?(\d{13})/);
      if (gs1Match) {
        barcode = gs1Match[1];
      } else {
        const fallbackMatch = barcode.match(/0?(\d{13})(?:\?|#|$)/);
        if (fallbackMatch) {
          barcode = fallbackMatch[1];
        }
      }
    }

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

      const isFirstScan = (audits.length === 0 || lastScanTime === null);
      
      const updated = storageService.getAudits();
      setAudits(updated);
      handleCloseModals();

      cloudSyncService.broadcastAudits(updated, 'WORKER');
      
      setLastScanTime(Date.now());
      setIsCheckFinished(false);

      // 성공 사운드 및 즉각적인 토스트 피드백 제공
      soundManager.playSaveSuccess();
      const target = detectedProduct ? detectedProduct.targetStock : 1;
      const minQty = detectedProduct ? Math.max(1, detectedProduct.minOrderQty) : 1;
      const shortage = Math.max(0, target - quantity);
      const orderQty = shortage > 0 ? Math.ceil(shortage / minQty) * minQty : 0;
      setToastMessage({
        text: `✅ ${productName} (재고 ${quantity}개 저장 완료)`,
        sub: orderQty > 0 ? `👉 발주 ${orderQty}개 예정 (목표 ${target}개)` : '👉 재고 충분 (발주 없음)',
      });
      setTimeout(() => setToastMessage(null), 3500);

      // 점장님 실시간 확인 및 데이터 유실 방지를 위한 디스코드 실시간 전송
      if (orderQty > 0) {
        sendDiscordNotification(`📦 ${productName}, ${activeBarcode}, 재고: ${quantity}개`);
      }

      if (isFirstScan) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(`✅ **[발주 시작]** 근무자(` + workerName + `)가 ` + vendorLabel + ` 발주 스캔을 시작했습니다.`);
        
        // 봇 생존 확인
        cloudSyncService.checkBotAlive(4500).then(isAlive => {
          if (!isAlive) {
            sendDiscordNotification(`🚨 **[긴급 알림]** 발주 봇 서버가 닫혀있습니다! 점장님 PC의 봇 서버를 켜주세요!`);
          }
        });
      } else if (isCheckFinished) {
        const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(저온)' : '유앤미24(상온)';
        sendDiscordNotification(`⚠️ **[발주 추가 진행]** 완료 보고가 끝난 후, 근무자(` + workerName + `)가 ` + vendorLabel + ` 상품을 추가로 스캔하기 시작했습니다! 점장님, 발주 넣기 전 추가된 내역을 꼭 확인해 주세요.`);
      }
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
    const now = Date.now();
    const refreshed = audits.map((a, idx) => ({
      ...a,
      id: (now + idx).toString()
    }));
    storageService.saveAudits(refreshed);
    setAudits(refreshed);
    const success = await cloudSyncService.broadcastAudits(refreshed, 'WORKER');
    setIsSending(false);
    if (success) {
      setSendSuccessMsg(true);
      setTimeout(() => setSendSuccessMsg(false), 3000);
    }
  };

  const handleShareListToDiscord = async () => {
    if (audits.length === 0) {
      alert('공유할 실사 내역이 없습니다.');
      return;
    }
    const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(주류/저온)' : '유앤미24(상온/냉장)';
    const orderItems = audits.map(a => {
      const p = storageService.findProduct(a.barcode).product;
      const target = a.targetStock ?? p?.targetStock ?? 1;
      const minQty = a.minOrderQty ?? p?.minOrderQty ?? 1;
      const shortage = Math.max(0, target - a.stockCount);
      const orderQty = shortage > 0 ? Math.ceil(shortage / minQty) * minQty : 0;
      return { ...a, target, minQty, orderQty };
    });

    const itemsToOrder = orderItems.filter(it => it.orderQty > 0);
    const dateStr = new Date().toLocaleString('ko-KR');

    let text = `📢 **[발주 리스트 공유 - ${vendorLabel}]**\n작성자: **${workerName || '근무자'}** | ${dateStr}\n총 ${orderItems.length}개 실사 (발주 대상: ${itemsToOrder.length}건)\n────────────────────────\n`;

    if (itemsToOrder.length === 0) {
      text += `✨ 모든 상품의 재고가 충분합니다. (발주 필요 품목 없음)`;
    } else {
      itemsToOrder.forEach((it, idx) => {
        text += `${idx + 1}. **${it.productName}**\n` +
          `• 바코드: \`${it.barcode}\`\n` +
          `• 수량: 재고 ${it.stockCount}개 / 목표 ${it.target}개 ➔ **발주 ${it.orderQty}개**\n\n`;
      });
    }

    sendDiscordNotification(text);
    try { await navigator.clipboard.writeText(text); } catch(e){}
    alert(`✅ 디스코드로 발주 리스트(${itemsToOrder.length}건)를 공유했습니다!\n(클립보드에도 복사되었습니다)`);
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

  
  if (requireAuth && !isLoggedIn) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const managerPin = storageService.getSettings().managerPin || '1180';
      if (pinInput === managerPin) {
        if (onSwitchMode) {
          onSwitchMode('ADMIN');
          setPinInput('');
          setLoginError('');
          return;
        }
      }
      
      const worker = authList.find(w => w.id === pinInput);
      if (worker) {
        setWorkerName(worker.name);
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('등록되지 않은 번호입니다.');
        setPinInput('');
      }
    };

    return (
      <div className="fixed inset-0 top-16 bg-canvas flex flex-col items-center justify-center p-6 z-40">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-line text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">근무자 로그인</h2>
          <p className="text-ink-soft mb-8 break-keep">
            전화번호 뒷자리 4자리를 입력해주세요.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder=""
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full h-14 bg-sunken rounded-2xl text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sage focus:bg-white transition-all font-mono"
                autoFocus
              />
              {loginError && (
                <p className="text-clay text-sm font-medium mt-2">{loginError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!pinInput}
              className="w-full h-14 bg-sage hover:bg-sage-deep text-white rounded-2xl text-lg font-bold transition-colors disabled:opacity-50"
            >
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

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
    <div className="max-w-md mx-auto px-5 py-6 space-y-6 pb-24 relative">
      {/* 실시간 피드백 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-0.5 border border-white/10 animate-rise pointer-events-none max-w-[90vw] text-center">
          <span className="font-bold text-sm text-emerald-400">{toastMessage.text}</span>
          {toastMessage.sub && <span className="text-xs text-white/90">{toastMessage.sub}</span>}
        </div>
      )}

      <div className="text-center text-ink-faint text-xs py-1">최종 업데이트: {__BUILD_TIME__}</div>
      {/* 오늘 실사 현황 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <button type="button" onClick={() => onCategoryChange?.(null)}
            className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1 bg-surface py-2 px-4 rounded-full border border-line shrink-0"
          >
            ← 뒤로가기
          </button>

          {!isCheckFinished && (
            <button
              onClick={() => {
                const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(주류/저온)' : '유앤미24(상온/냉장)';
                const orderItems = filteredAudits.map(a => {
                  const p = storageService.findProduct(a.barcode).product;
                  const target = a.targetStock ?? p?.targetStock ?? 1;
                  const minQty = a.minOrderQty ?? p?.minOrderQty ?? 1;
                  const shortage = Math.max(0, target - a.stockCount);
                  const orderQty = shortage > 0 ? Math.ceil(shortage / minQty) * minQty : 0;
                  return { ...a, target, minQty, orderQty };
                });

                const itemsToOrder = orderItems.filter(it => it.orderQty > 0);
                const dateStr = new Date().toLocaleString('ko-KR');

                let discordText = `🏁 **[발주 완료 알림 - ${vendorLabel}]**\n` +
                  `• **근무자**: ${workerName || '근무자'} (${dateStr})\n` +
                  `• **실사 현황**: 총 ${filteredAudits.length}개 확인 (발주 대상: **${itemsToOrder.length}건**)\n` +
                  `────────────────────────\n`;

                if (itemsToOrder.length === 0) {
                  discordText += `✨ 모든 품목의 재고가 충분하여 발주 대상 품목이 없습니다.`;
                } else {
                  itemsToOrder.forEach((it, idx) => {
                    discordText += `${idx + 1}. ${it.productName}, ${it.barcode}, 재고: ${it.stockCount}개\n`;
                  });
                }

                sendDiscordNotification(discordText);
                cloudSyncService.broadcastAudits(storageService.getAudits(), 'WORKER');
                cloudSyncService.requestAutoOrderEvaluation(filteredAudits, workerName, selectedCategory || '');
                setIsCheckFinished(true);
                alert(`점장님께 발주 완료 알림과 리스트(${itemsToOrder.length}건)가 디스코드로 전송되었습니다!`);
              }}
              className="text-sm font-bold text-white bg-sage hover:bg-sage-deep flex items-center justify-center gap-1 py-1.5 px-4 rounded-full shadow-sm transition-colors ml-auto truncate"
            >
              ✅ 발주 완료 알림 보내기
            </button>
          )}
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('스캔한 목록을 모두 비우시겠습니까?')) {
                    storageService.clearAudits();
                    cloudSyncService.broadcastClear('WORKER');
                    setAudits([]);
                  }
                }}
                className="text-[12px] font-medium text-brick hover:underline"
              >
                목록 비우기
              </button>
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
            </div>
          )}
        </div>

        {filteredAudits.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-faint leading-relaxed text-balance break-keep">
            상품 바코드를 비추면 자동으로 인식합니다
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {filteredAudits.map((item) => (
              <li
                key={item.id}
                onClick={() => handleBarcodeDetected(item.barcode)}
                className="py-3 flex items-center gap-3 cursor-pointer hover:bg-sunken active:bg-sunken/80 rounded-2xl px-2.5 -mx-2.5 transition-colors group"
                title="터치하여 수량 수정"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink leading-snug break-keep group-hover:text-sage font-medium transition-colors">
                    {item.productName}
                    {item.isUnmapped && (
                      <span className="ml-1.5 align-middle text-[12px] text-clay">사진</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-faint tabular">
                    {item.barcode} · 목표: {item.targetStock ?? 1}개 · {item.updatedAt}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-surface border border-line text-[15px] font-bold text-ink tabular shrink-0 group-hover:border-sage group-hover:text-sage transition-colors">
                  {item.stockCount}개
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAudit(item.id);
                  }}
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

      {step === 'QUANTITY' && activeBarcode && (() => {
          const currentAudit = audits.find(a => a.barcode === activeBarcode);
          return (
            <QuantityModal
              barcode={activeBarcode}
              product={detectedProduct}
              initialQuantity={currentAudit ? currentAudit.stockCount : 1}
              onSave={handleSaveQuantity}
              onClose={handleCloseModals}
            />
          );
        })()}
          </div>
  );
};
