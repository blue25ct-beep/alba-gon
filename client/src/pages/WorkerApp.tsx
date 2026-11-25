import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { QuantityModal } from '../components/QuantityModal';
import { PhotoCaptureModal } from '../components/PhotoCaptureModal';
import { ChilledChecklistPanel, clearChilledDraftStorage } from '../components/ChilledChecklistPanel';
import { AuditItem, Product } from '../types';
import { storageService } from '../services/storage';
import { cloudSyncService, SyncStatus } from '../services/cloudSyncService';
import { Trash2, Camera, RefreshCw, Check, Lock, Send, Clock, X } from 'lucide-react';
import { soundManager } from '../services/sound';

const CHILLED_START_MIN = 22 * 60 + 30; // 오후 10:30 (KST)
const CHILLED_END_MIN = 1 * 60;         // 오전 01:00 (KST)

function isChilledCheckWindowOpen(nowMs: number = Date.now()): boolean {
  const kst = new Date(nowMs + 9 * 60 * 60 * 1000);
  const mins = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  return mins >= CHILLED_START_MIN || mins < CHILLED_END_MIN;
}

function formatKstTime(nowMs: number = Date.now()): string {
  const kst = new Date(nowMs + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const mm = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const WorkerApp: React.FC<{ selectedCategory?: 'YOUNME' | 'CHILLED' | 'SPCHAIN' | null; onCategoryChange?: (c: 'YOUNME' | 'CHILLED' | 'SPCHAIN' | null) => void; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void; onSwitchMode?: (mode: 'WORKER' | 'ADMIN') => void }> = ({ selectedCategory, onCategoryChange, onThemeChange, onTitleChange, onSwitchMode }) => {
  const [audits, setAudits] = useState<AuditItem[]>(() => storageService.getAudits());
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
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [chilledAdminBypass, setChilledAdminBypass] = useState<boolean>(false);
  const [showChilledLockModal, setShowChilledLockModal] = useState<boolean>(false);
  const [chilledUnlockPin, setChilledUnlockPin] = useState<string>('');
  const [chilledUnlockError, setChilledUnlockError] = useState<string>('');

  const isChilledWindowOpen = isChilledCheckWindowOpen(nowMs);
  const isChilledAllowed = isChilledWindowOpen || chilledAdminBypass;

  useEffect(() => {
    const refreshNow = () => setNowMs(Date.now());
    const timer = setInterval(refreshNow, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleChilledAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const managerPin = storageService.getSettings().managerPin || '1180';
    if (chilledUnlockPin === managerPin) {
      setChilledAdminBypass(true);
      setShowChilledLockModal(false);
      setChilledUnlockPin('');
      setChilledUnlockError('');
      onCategoryChange?.('CHILLED');
    } else {
      setChilledUnlockError('관리자 PIN이 일치하지 않습니다.');
      setChilledUnlockPin('');
    }
  };
  
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
    } else if (selectedCategory === 'CHILLED') {
      onThemeChange?.('blue');
      onTitleChange?.('❄️ 저온 발주');
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
      clearChilledDraftStorage();
      const current = storageService.getAudits();
      setAudits(current);
    });

    const handleWakeup = () => {
      if (document.visibilityState === 'visible') {
        setAudits(storageService.getAudits());
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
        vendor: selectedCategory === 'SPCHAIN' ? 'spchain' : selectedCategory === 'CHILLED' ? 'chilled' : 'younme',
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
        // 점장님 PC는 상시 켜져 있지 않고 발주 시에만 가동되므로 클라우드(MQTT Retain)에 안전 보관됨
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

  // ★ 통합 발주 완료 & 관리자/디스코드 전송 핸들러
  // 기존의 '지금 보내기'(웹 동기화만)와 '발주 완료 알림 보내기'(디스코드만)를 하나로 완전 통합!
  const handleCompleteAuditAndSend = async () => {
    if (filteredAudits.length === 0) {
      alert('스캔한 실사 내역이 없습니다.');
      return;
    }

    setIsSending(true);
    const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(주류/저온)' : '유앤미24(상온/냉장)';

    // 1. 발주 필요 품목 계산 (D+1 전날 발주 품목은 오늘 발주에서 자동 제외)
    let extDPlus1: string[] = [];
    try {
      const res = await fetch('http://localhost:3001/api/pending-dplus1');
      const d = await res.json();
      if (d && d.success && Array.isArray(d.barcodes)) extDPlus1 = d.barcodes;
    } catch {}
    const yesterdayOrderedSet = storageService.getYesterdayOrderedBarcodes(extDPlus1);
    const orderItems = filteredAudits.map(a => {
      const p = storageService.findProduct(a.barcode).product;
      const target = a.targetStock ?? p?.targetStock ?? 1;
      const minQty = a.minOrderQty ?? p?.minOrderQty ?? 1;
      const isDPlus1 = storageService.isDPlus1Product(p, a.productName);
      const isOrderedYesterday = isDPlus1 && yesterdayOrderedSet.has(a.barcode);
      const shortage = Math.max(0, target - a.stockCount);
      const orderQty = isOrderedYesterday ? 0 : (shortage > 0 ? Math.ceil(shortage / minQty) * minQty : 0);
      return { ...a, target, minQty, orderQty, isDPlus1, isOrderedYesterday };
    });

    const itemsToOrder = orderItems.filter(it => it.orderQty > 0);
    const dateStr = new Date().toLocaleString('ko-KR');

    // 2. 관리자 화면으로 100% 최신 실사 목록 즉시 동기화 (타임스탬프 갱신)
    const now = Date.now();
    const refreshed = audits.map((a, idx) => ({
      ...a,
      id: (now + idx).toString()
    }));
    storageService.saveAudits(refreshed);
    setAudits(refreshed);
    await cloudSyncService.broadcastAudits(refreshed, 'WORKER');

    // 3. 점장님 디스코드 웹훅으로 최종 보고서 리스트 전송
    let discordText = `🏁 **[실사 완료 및 발주 요청 - ${vendorLabel}]**\n` +
      `• **근무자**: ${workerName || '근무자'} (${dateStr})\n` +
      `• **실사 현황**: 총 ${filteredAudits.length}개 확인 (발주 대상: **${itemsToOrder.length}건**)\n` +
      `────────────────────────\n`;

    if (itemsToOrder.length === 0) {
      discordText += `✨ 모든 품목의 재고가 충분하여 발주 대상 품목이 없습니다.`;
    } else {
      itemsToOrder.forEach((it, idx) => {
        discordText += `${idx + 1}. **${it.productName}**, \`${it.barcode}\`, 재고: ${it.stockCount}개 / 목표: ${it.target}개 ➔ **발주 ${it.orderQty}개**\n`;
      });
    }

    sendDiscordNotification(discordText);

    // 4. 자동발주 봇 실행 신호는 점장님 요청으로 비활성화 (점장님이 관리자 화면에서 직접 확인 후 수동 발주)

    setIsSending(false);
    setIsCheckFinished(true);
    setSendSuccessMsg(true);
    setTimeout(() => setSendSuccessMsg(false), 4000);

    alert(`✅ 점장님(관리자 화면 및 디스코드)께 실사 내역(${filteredAudits.length}건)과 발주 대상(${itemsToOrder.length}건)이 모두 성공적으로 전송되었습니다!`);
  };

  const handleShareListToDiscord = async () => {
    if (audits.length === 0) {
      alert('공유할 실사 내역이 없습니다.');
      return;
    }
    const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(주류/저온)' : '유앤미24(상온/냉장)';
    const yesterdayOrderedSet = storageService.getYesterdayOrderedBarcodes();
    const orderItems = audits.map(a => {
      const p = storageService.findProduct(a.barcode).product;
      const target = a.targetStock ?? p?.targetStock ?? 1;
      const minQty = a.minOrderQty ?? p?.minOrderQty ?? 1;
      const isDPlus1 = storageService.isDPlus1Product(p, a.productName);
      const isOrderedYesterday = isDPlus1 && yesterdayOrderedSet.has(a.barcode);
      const shortage = Math.max(0, target - a.stockCount);
      const orderQty = isOrderedYesterday ? 0 : (shortage > 0 ? Math.ceil(shortage / minQty) * minQty : 0);
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
    const isChilledCat = cat?.includes('저온') || cat?.includes('냉장') || cat?.includes('냉동');
    if (selectedCategory === 'CHILLED') return a.vendor === 'chilled' || (!a.vendor && isChilledCat);
    if (selectedCategory === 'YOUNME') return a.vendor === 'younme' || (!a.vendor && !isChilledCat && cat !== '주류');
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
            <span>🌿 상온</span>
            <span className="text-sm font-medium text-sage opacity-80">(상온 발주)</span>
          </button>

          <button
            onClick={() => {
              if (isChilledAllowed) {
                onCategoryChange?.('CHILLED');
              } else {
                setChilledUnlockPin('');
                setChilledUnlockError('');
                setShowChilledLockModal(true);
              }
            }}
            className={`w-full h-24 rounded-3xl border font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-1.5 ${
              isChilledAllowed
                ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-900'
                : 'bg-sunken/80 hover:bg-sunken border-line text-ink-soft'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {!isChilledAllowed && <Lock className="w-5 h-5 text-ink-faint" />}
              <span>❄️ 저온</span>
            </span>
            {isChilledAllowed ? (
              <span className="text-sm font-medium text-cyan-700 opacity-90">
                {!isChilledWindowOpen && chilledAdminBypass
                  ? '🔓 관리자 임시 해제됨 (냉장 · 냉동 발주)'
                  : '(냉장 · 냉동 발주 · 22:30~01:00)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-faint">
                <Clock className="w-3.5 h-3.5" />
                오후 10:30 ~ 오전 1:00 체크 가능 (현재 {formatKstTime(nowMs)})
              </span>
            )}
          </button>
          
          <button
            onClick={() => onCategoryChange?.('SPCHAIN')}
            className="w-full h-24 rounded-3xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xl transition-colors shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span>🍺 주류</span>
            <span className="text-sm font-medium text-blue-600 opacity-80">(생필체인 발주)</span>
          </button>
        </div>

        {/* 저온 체크 시간 제한 안내 + 점장님 PIN 임시 해제 모달 */}
        {showChilledLockModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-center justify-center p-5">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-line animate-rise">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-700" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowChilledLockModal(false)}
                  className="w-8 h-8 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-extrabold text-ink">저온 체크 시간이 아닙니다</h3>
              <p className="text-sm text-ink-soft mt-1.5 leading-relaxed break-keep">
                저온 체크는 <strong className="text-cyan-800">오후 10시 30분 ~ 오전 1시</strong> 사이에만 진행할 수 있습니다.
              </p>
              <div className="mt-3 px-3.5 py-2 rounded-xl bg-sunken text-xs font-semibold text-ink-soft flex items-center justify-between">
                <span>현재 한국 시각</span>
                <span className="tabular font-bold text-ink">{formatKstTime(nowMs)}</span>
              </div>

              <form onSubmit={handleChilledAdminUnlock} className="mt-5 pt-4 border-t border-line space-y-2.5">
                <label className="block text-[11px] font-bold text-ink-faint">
                  🔑 점장님 PIN으로 임시 해제 (테스트·예외용)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="관리자 PIN"
                    value={chilledUnlockPin}
                    onChange={(e) => {
                      setChilledUnlockPin(e.target.value);
                      setChilledUnlockError('');
                    }}
                    className="flex-1 h-10 px-3 rounded-xl bg-sunken text-center text-sm tracking-[0.25em] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!chilledUnlockPin}
                    className="px-4 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors disabled:opacity-40 shrink-0"
                  >
                    해제
                  </button>
                </div>
                {chilledUnlockError && (
                  <p className="text-xs font-medium text-clay">{chilledUnlockError}</p>
                )}
              </form>

              <button
                type="button"
                onClick={() => setShowChilledLockModal(false)}
                className="mt-4 w-full h-11 rounded-2xl bg-sunken hover:bg-line/60 text-ink font-bold text-sm transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        )}
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

          {!isCheckFinished && !(selectedCategory === 'CHILLED' && !isChilledAllowed) && (
            <button
              type="button"
              onClick={handleCompleteAuditAndSend}
              disabled={isSending || filteredAudits.length === 0}
              className="text-sm font-bold text-white bg-sage hover:bg-sage-deep flex items-center justify-center gap-1.5 py-2 px-4 rounded-full shadow-sm transition-colors ml-auto truncate disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : sendSuccessMsg ? (
                <Check className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{sendSuccessMsg ? '전송 완료됨' : '🏁 실사 완료 및 점장님 전송'}</span>
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

      {/* 저온(CHILLED) 전용 원터치 체크리스트 — 허용 시간(22:30~01:00) 외 2중 잠금 */}
      {selectedCategory === 'CHILLED' && !isChilledAllowed && (
        <div className="bg-surface border border-line rounded-3xl p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sunken flex items-center justify-center">
            <Lock className="w-7 h-7 text-ink-soft" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-ink">저온 체크 가능 시간이 아닙니다</h3>
            <p className="text-sm text-ink-soft mt-1.5 leading-relaxed break-keep">
              저온 체크는 <strong className="text-cyan-800">오후 10:30 ~ 오전 1:00</strong> 사이에만 가능합니다.
              <br />
              <span className="text-xs text-ink-faint">현재 한국 시각: {formatKstTime(nowMs)} · 작성 중이던 임시 내역은 안전하게 보관됩니다.</span>
            </p>
          </div>
          <form onSubmit={handleChilledAdminUnlock} className="pt-3 border-t border-line space-y-2 text-left">
            <label className="block text-[11px] font-bold text-ink-faint">
              🔑 점장님 PIN으로 임시 해제
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="관리자 PIN"
                value={chilledUnlockPin}
                onChange={(e) => {
                  setChilledUnlockPin(e.target.value);
                  setChilledUnlockError('');
                }}
                className="flex-1 h-10 px-3 rounded-xl bg-sunken text-center text-sm tracking-[0.25em] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!chilledUnlockPin}
                className="px-4 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors disabled:opacity-40 shrink-0"
              >
                해제
              </button>
            </div>
            {chilledUnlockError && (
              <p className="text-xs font-medium text-clay">{chilledUnlockError}</p>
            )}
          </form>
        </div>
      )}

      {selectedCategory === 'CHILLED' && isChilledAllowed && (
        <ChilledChecklistPanel
          products={storageService.getProducts()}
          existingAudits={audits}
          onAutoSaveChecklist={(items) => {
            if (items.length === 0) return;
            items.forEach((it) => {
              storageService.saveAudit({
                barcode: it.barcode,
                productName: it.productName,
                stockCount: it.stockCount,
                targetStock: it.targetStock,
                minOrderQty: it.minOrderQty,
                photoUrls: [],
                isUnmapped: false,
                workerName,
                vendor: it.vendor || 'chilled',
                category: it.category || '저온냉장',
              });
            });
            const updated = storageService.getAudits();
            setAudits(updated);
            cloudSyncService.broadcastAudits(updated, 'WORKER');
          }}
          onRemoveAuditBarcodes={(barcodes) => {
            barcodes.forEach((bc) => storageService.deleteAudit(bc));
            const updated = storageService.getAudits();
            setAudits(updated);
            cloudSyncService.broadcastAudits(updated, 'WORKER');
          }}
          onSubmitChecklist={(items) => {
            items.forEach((it) => {
              storageService.saveAudit({
                barcode: it.barcode,
                productName: it.productName,
                stockCount: it.stockCount,
                targetStock: it.targetStock,
                minOrderQty: it.minOrderQty,
                photoUrls: [],
                isUnmapped: false,
                workerName,
                vendor: it.vendor || 'chilled',
                category: it.category || '저온냉장',
              });
            });
            const updated = storageService.getAudits();
            setAudits(updated);
            cloudSyncService.broadcastAudits(updated, 'WORKER');
            soundManager.playSaveSuccess();
            setToastMessage({
              text: `❄️ 저온 재고(${items.length}종) 반영 완료!`,
              sub: '상단 [🏁 실사 완료 및 점장님 전송]을 눌러 전송해 주세요',
            });
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* 스캐너 (저온 모드는 6구역 체크리스트 전용으로 카메라 숨김) */}
      {selectedCategory !== 'CHILLED' && (
        <BarcodeScanner onDetected={handleBarcodeDetected} isPaused={step !== 'IDLE'} />
      )}

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
                onClick={handleCompleteAuditAndSend}
                disabled={isSending || filteredAudits.length === 0}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white bg-sage hover:bg-sage-deep px-3 py-1.5 rounded-full shadow-xs transition-colors disabled:opacity-50"
                title="관리자 화면과 디스코드로 실사 및 발주 리스트를 한번에 전송합니다"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : sendSuccessMsg ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{sendSuccessMsg ? '전송 완료' : '실사 완료 전송'}</span>
              </button>
            </div>
          )}
        </div>

        {filteredAudits.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-faint leading-relaxed text-balance break-keep">
            {selectedCategory === 'CHILLED'
              ? '위 구역별 체크표에서 재고를 선택한 뒤 최종 확인을 눌러주세요'
              : '상품 바코드를 비추면 자동으로 인식합니다'}
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
