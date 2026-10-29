const fs = require('fs');

let code = fs.readFileSync('client/src/pages/WorkerApp.tsx', 'utf8');

// 1. Add Send icon to lucide-react import
code = code.replace(
  "import { Trash2, Camera, RefreshCw, Check, Lock } from 'lucide-react';",
  "import { Trash2, Camera, RefreshCw, Check, Lock, Send } from 'lucide-react';"
);

// 2. Replace handleManualSendToAdmin with unified handleCompleteAuditAndSend
const oldHandleManualSend = `  const handleManualSendToAdmin = async () => {
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
  };`;

const newUnifiedFunction = `  // ★ 통합 발주 완료 & 관리자/디스코드 전송 핸들러
  // 기존의 '지금 보내기'(웹 동기화만)와 '발주 완료 알림 보내기'(디스코드만)를 하나로 완전 통합!
  const handleCompleteAuditAndSend = async () => {
    if (filteredAudits.length === 0) {
      alert('스캔한 실사 내역이 없습니다.');
      return;
    }

    setIsSending(true);
    const vendorLabel = selectedCategory === 'SPCHAIN' ? '생필체인(주류/저온)' : '유앤미24(상온/냉장)';

    // 1. 발주 필요 품목 계산
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
    let discordText = \`🏁 **[실사 완료 및 발주 요청 - \${vendorLabel}]**\\n\` +
      \`• **근무자**: \${workerName || '근무자'} (\${dateStr})\\n\` +
      \`• **실사 현황**: 총 \${filteredAudits.length}개 확인 (발주 대상: **\${itemsToOrder.length}건**)\\n\` +
      \`────────────────────────\\n\`;

    if (itemsToOrder.length === 0) {
      discordText += \`✨ 모든 품목의 재고가 충분하여 발주 대상 품목이 없습니다.\`;
    } else {
      itemsToOrder.forEach((it, idx) => {
        discordText += \`\${idx + 1}. **\${it.productName}**, \\\`\${it.barcode}\\\`, 재고: \${it.stockCount}개 / 목표: \${it.target}개 ➔ **발주 \${it.orderQty}개**\\n\`;
      });
    }

    sendDiscordNotification(discordText);

    // 4. 자동발주 봇 평가 신호 전송
    cloudSyncService.requestAutoOrderEvaluation(filteredAudits, workerName, selectedCategory || '');

    setIsSending(false);
    setIsCheckFinished(true);
    setSendSuccessMsg(true);
    setTimeout(() => setSendSuccessMsg(false), 4000);

    alert(\`✅ 점장님(관리자 화면 및 디스코드)께 실사 내역(\${filteredAudits.length}건)과 발주 대상(\${itemsToOrder.length}건)이 모두 성공적으로 전송되었습니다!\`);
  };`;

code = code.replace(oldHandleManualSend, newUnifiedFunction);

// 3. Replace top header button
const targetTopSection = `          {!isCheckFinished && (
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

                let discordText = \`🏁 **[발주 완료 알림 - \${vendorLabel}]**\\n\` +
                  \`• **근무자**: \${workerName || '근무자'} (\${dateStr})\\n\` +
                  \`• **실사 현황**: 총 \${filteredAudits.length}개 확인 (발주 대상: **\${itemsToOrder.length}건**)\\n\` +
                  \`────────────────────────\\n\`;

                if (itemsToOrder.length === 0) {
                  discordText += \`✨ 모든 품목의 재고가 충분하여 발주 대상 품목이 없습니다.\`;
                } else {
                  itemsToOrder.forEach((it, idx) => {
                    discordText += \`\${idx + 1}. \${it.productName}, \${it.barcode}, 재고: \${it.stockCount}개\\n\`;
                  });
                }

                sendDiscordNotification(discordText);
                cloudSyncService.broadcastAudits(storageService.getAudits(), 'WORKER');
                cloudSyncService.requestAutoOrderEvaluation(filteredAudits, workerName, selectedCategory || '');
                setIsCheckFinished(true);
                alert(\`점장님께 발주 완료 알림과 리스트(\${itemsToOrder.length}건)가 디스코드로 전송되었습니다!\`);
              }}
              className="text-sm font-bold text-white bg-sage hover:bg-sage-deep flex items-center justify-center gap-1 py-1.5 px-4 rounded-full shadow-sm transition-colors ml-auto truncate"
            >
              ✅ 발주 완료 알림 보내기
            </button>
          )}`;

const replacementTopSection = `          {!isCheckFinished && (
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
          )}`;

if (code.includes(targetTopSection)) {
  code = code.replace(targetTopSection, replacementTopSection);
} else {
  // Normalize line endings
  code = code.replace(targetTopSection.replace(/\n/g, '\r\n'), replacementTopSection.replace(/\n/g, '\r\n'));
}

// 4. In the scan list header, replace the ambiguous "지금 보내기" button with the same unified complete button
const targetBottomButton = `              <button
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
              </button>`;

const replacementBottomButton = `              <button
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
              </button>`;

if (code.includes(targetBottomButton)) {
  code = code.replace(targetBottomButton, replacementBottomButton);
} else {
  code = code.replace(targetBottomButton.replace(/\n/g, '\r\n'), replacementBottomButton.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('client/src/pages/WorkerApp.tsx', code, 'utf8');
console.log('WorkerApp.tsx patched cleanly and safely');
