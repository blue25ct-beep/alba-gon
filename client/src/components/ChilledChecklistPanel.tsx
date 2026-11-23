import React, { useState, useMemo, useEffect } from 'react';
import { Product, AuditItem } from '../types';
import { Check, AlertTriangle, Plus, Minus, Send, X } from 'lucide-react';
import { soundManager } from '../services/sound';
import { storageService } from '../services/storage';

export const TRIANGLE_KIMBAP_BASIC = [
  { barcode: '8809279269031', name: '롯데)듬뿍참치마요네즈삼각김밥115g', cost: 1125, price: 1500, defaultQty: 1 },
  { barcode: '8809279269048', name: '롯데)듬뿍소고기고추장삼각김밥110g', cost: 1125, price: 1500, defaultQty: 1 },
  { barcode: '8801118424984', name: '롯데]직화돼지갈비삼각김밥110g', cost: 1125, price: 1500, defaultQty: 1 },
];

export const TRIANGLE_KIMBAP_THU_EXTRA = [
  { barcode: '8801118410789', name: '롯데)고추참치삼각김밥110g', cost: 1039, price: 1400, defaultQty: 1 },
  { barcode: '8801118799938', name: '롯데)전주비빔삼각김밥110g', cost: 1125, price: 1500, defaultQty: 1 },
  { barcode: '8801118410765', name: '롯데)크래미날치알삼각110g', cost: 1039, price: 1400, defaultQty: 1 },
];

// 매장 11월 유앤미 저온 실제 다빈도 입고 품목 기반 기본 체크리스트
export const DEFAULT_CHILLED_CHECKLIST_BARCODES: Record<string, { targetStock: number; group: string; buttons?: { label: string; value: number }[] }> = {
  '88002798': {
    targetStock: 5,
    group: '🥛 우유 / 가공유',
    buttons: [
      { label: '0개', value: 0 },
      { label: '1~2개', value: 2 },
      { label: '3개 이하', value: 3 },
      { label: '4개', value: 4 },
      { label: '5개+(충분)', value: 5 },
    ],
  },
  '8801104940870': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 빙그레]메로나맛우유240ml
  '8801104221467': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 빙그레)딸기맛우유240ml
  '8801121101582': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 매일)ESL우유200ml
  '8801115114031': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 서울)서울우유200ml
  '8801121101568': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 매일)ESL우유500ml
  '8801115114154': { targetStock: 2, group: '🥛 우유 / 가공유' }, // 서울)서울우유1000ml
  '8801121767122': { targetStock: 2, group: '🍶 발효유 / 요구르트' }, // 매일)바이오드링킹플레인250ml
  '8801121767139': { targetStock: 2, group: '🍶 발효유 / 요구르트' }, // 매일)바이오드링킹딸기250ml
  '8801121768105': { targetStock: 2, group: '🍶 발효유 / 요구르트' }, // 매일)요구르트로어슈거280ml
  '8801104665421': { targetStock: 2, group: '🍶 발효유 / 요구르트' }, // (2+1)빙그레]닥터캡슐사과130ml
  '8801115213604': { targetStock: 2, group: '🍶 발효유 / 요구르트' }, // (2+1)서울]비요뜨쿠키앤크림131g
  '8801115382003': { targetStock: 2, group: '☕ 컵커피 / 냉장음료' }, // 동서]스타벅스컵카페라떼320ml
  '8801115382102': { targetStock: 2, group: '☕ 컵커피 / 냉장음료' }, // 동서]스타벅스컵바닐라라떼320ml
  '8801118400926': { targetStock: 1, group: '🥪 샌드위치 / 간편식' }, // 롯데)햄치즈게맛살샌드위치173g
  '8809396600014': {
    targetStock: 4,
    group: '🥚 계란 / 반찬 / 맛살 / 만두',
    buttons: [
      { label: '0개', value: 0 },
      { label: '1~2개', value: 2 },
      { label: '3개 이하', value: 3 },
      { label: '4개+(충분)', value: 4 },
    ],
  }, // 진주)마루카네감동란(삶은계란)2구(D+1)
  '8801392194078': { targetStock: 2, group: '🥚 계란 / 반찬 / 맛살 / 만두' }, // CJ]훈제대란100g(2입)(D+1)
  '8801066066069': { targetStock: 2, group: '🥚 계란 / 반찬 / 맛살 / 만두' }, // (1+1)대림]크라비아데일리80g(D+1)
  '8801227180047': { targetStock: 2, group: '🥚 계란 / 반찬 / 맛살 / 만두' }, // $사조)김치포자만두180g(냉동)
  '8801227180030': { targetStock: 2, group: '🥚 계란 / 반찬 / 맛살 / 만두' }, // $사조)고기포자만두180g
};

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const NEXT_DAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

interface ChilledChecklistPanelProps {
  products: Product[];
  existingAudits: AuditItem[];
  onSubmitChecklist: (items: { barcode: string; productName: string; stockCount: number; targetStock: number; minOrderQty: number }[]) => void;
}

export const ChilledChecklistPanel: React.FC<ChilledChecklistPanelProps> = ({
  products,
  existingAudits,
  onSubmitChecklist,
}) => {
  const todayDay = new Date().getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  const [dayMode, setDayMode] = useState<'REGULAR' | 'THURSDAY'>(todayDay === 4 ? 'THURSDAY' : 'REGULAR');

  // 삼각김밥 발주 수량 상태 (자동 기본값 1개씩)
  const [kimbapOrderQtys, setKimbapOrderQtys] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    [...TRIANGLE_KIMBAP_BASIC, ...TRIANGLE_KIMBAP_THU_EXTRA].forEach((k) => {
      init[k.barcode] = k.defaultQty;
    });
    return init;
  });

  // 체크리스트 상품별 근무자 선택 재고 상태 (null = 아직 버튼 안 누름)
  const [selectedStocks, setSelectedStocks] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    existingAudits.forEach((a) => {
      init[a.barcode] = a.stockCount;
    });
    return init;
  });

  // 최종 확인 팝업 표시 여부
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDPlus1Barcodes, setPendingDPlus1Barcodes] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/pending-dplus1')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success && Array.isArray(d.barcodes)) {
          setPendingDPlus1Barcodes(d.barcodes);
        }
      })
      .catch(() => {});
  }, []);

  const yesterdayOrderedSet = useMemo(
    () => storageService.getYesterdayOrderedBarcodes(pendingDPlus1Barcodes),
    [pendingDPlus1Barcodes, products]
  );

  const activeKimbaps = useMemo(() => {
    return dayMode === 'THURSDAY'
      ? [...TRIANGLE_KIMBAP_BASIC, ...TRIANGLE_KIMBAP_THU_EXTRA]
      : TRIANGLE_KIMBAP_BASIC;
  }, [dayMode]);

  const checklistItems = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.barcode, p]));
    const list: {
      barcode: string;
      name: string;
      targetStock: number;
      minOrderQty: number;
      group: string;
      buttons: { label: string; value: number }[];
    }[] = [];

    Object.entries(DEFAULT_CHILLED_CHECKLIST_BARCODES).forEach(([barcode, cfg]) => {
      const p = prodMap.get(barcode);
      const target = (p && p.targetStock > 1) ? p.targetStock : cfg.targetStock;
      const minQty = Math.max(1, p?.minOrderQty || 1);
      const name = p?.name || barcode;

      let buttons = cfg.buttons;
      if (!buttons) {
        if (target >= 5) {
          buttons = [
            { label: '0개', value: 0 },
            { label: '1~2개', value: 2 },
            { label: '3개 이하', value: 3 },
            { label: '4개', value: 4 },
            { label: `${target}개+(충분)`, value: target },
          ];
        } else if (target === 4) {
          buttons = [
            { label: '0개', value: 0 },
            { label: '1개', value: 1 },
            { label: '2개', value: 2 },
            { label: '3개 이하', value: 3 },
            { label: '4개+(충분)', value: 4 },
          ];
        } else if (target === 3) {
          buttons = [
            { label: '0개', value: 0 },
            { label: '1개', value: 1 },
            { label: '2개', value: 2 },
            { label: '3개+(충분)', value: 3 },
          ];
        } else if (target === 2) {
          buttons = [
            { label: '0개(품절)', value: 0 },
            { label: '1개', value: 1 },
            { label: '2개+(충분)', value: 2 },
          ];
        } else {
          buttons = [
            { label: '0개(품절)', value: 0 },
            { label: '1개+(충분)', value: 1 },
          ];
        }
      }

      list.push({ barcode, name, targetStock: target, minOrderQty: minQty, group: cfg.group, buttons });
    });

    // 추가로 점장님이 isChilledChecklist = true로 지정한 기타 저온 상품
    products.forEach((p) => {
      if (p.isChilledChecklist && !DEFAULT_CHILLED_CHECKLIST_BARCODES[p.barcode]) {
        const target = Math.max(1, p.targetStock || 2);
        const buttons =
          target >= 4
            ? [
                { label: '0개', value: 0 },
                { label: '1~2개', value: 2 },
                { label: '3개 이하', value: 3 },
                { label: `${target}개+(충분)`, value: target },
              ]
            : [
                { label: '0개(품절)', value: 0 },
                { label: '1개', value: 1 },
                { label: `${target}개+(충분)`, value: target },
              ];
        list.push({
          barcode: p.barcode,
          name: p.name,
          targetStock: target,
          minOrderQty: Math.max(1, p.minOrderQty || 1),
          group: '❄️ 추가 지정 저온 상품',
          buttons,
        });
      }
    });

    return list;
  }, [products]);

  const groupedChecklist = useMemo(() => {
    const groups: Record<string, typeof checklistItems> = {};
    checklistItems.forEach((it) => {
      if (!groups[it.group]) groups[it.group] = [];
      groups[it.group].push(it);
    });
    return groups;
  }, [checklistItems]);

  const handleSelectStock = (barcode: string, val: number) => {
    soundManager.playScanSuccess();
    setSelectedStocks((prev) => ({
      ...prev,
      [barcode]: Math.max(0, val),
    }));
  };

  const handleAdjustStock = (barcode: string, targetStock: number, delta: number) => {
    setSelectedStocks((prev) => {
      const current = prev[barcode] ?? targetStock;
      return {
        ...prev,
        [barcode]: Math.max(0, current + delta),
      };
    });
  };

  const uncheckedItems = checklistItems.filter((it) => selectedStocks[it.barcode] === undefined || selectedStocks[it.barcode] === null);
  const checkedCount = checklistItems.length - uncheckedItems.length;

  const handleFinalConfirm = () => {
    const finalPayload: { barcode: string; productName: string; stockCount: number; targetStock: number; minOrderQty: number }[] = [];

    // 1. 삼각김밥 자동 발주 항목 (재고 0, 목표 = 발주수량으로 넣어 정확히 지정 수량이 발주되도록 함)
    activeKimbaps.forEach((k) => {
      const orderQty = kimbapOrderQtys[k.barcode] ?? 1;
      if (orderQty > 0) {
        finalPayload.push({
          barcode: k.barcode,
          productName: k.name,
          stockCount: 0,
          targetStock: orderQty,
          minOrderQty: 1,
        });
      }
    });

    // 2. 체크리스트 항목
    checklistItems.forEach((it) => {
      const stock = selectedStocks[it.barcode];
      if (stock !== undefined && stock !== null) {
        finalPayload.push({
          barcode: it.barcode,
          productName: it.name,
          stockCount: stock,
          targetStock: it.targetStock,
          minOrderQty: it.minOrderQty,
        });
      }
    });

    setShowConfirmModal(false);
    onSubmitChecklist(finalPayload);
  };

  return (
    <div className="space-y-5">
      {/* 1. 저온 발주·입고 요일 안내 배너 */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-600 text-white">
              ❄️ 저온 발주 스케줄
            </span>
            <h3 className="mt-1.5 font-bold text-cyan-950 text-base">
              오늘({DAY_NAMES[todayDay]}) 발주 ➔ 내일({NEXT_DAY_NAMES[todayDay]}) 입고
            </h3>
            <p className="text-xs text-cyan-800 mt-0.5 leading-relaxed">
              월·화·수·목·토·일 발주 가능 (각각 화·수·목·금·일·월 입고)
            </p>
          </div>
        </div>

        {todayDay === 5 && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>오늘은 금요일(저온 발주 휴무일)입니다. 토요일 발주(일요일 입고) 준비 시에도 미리 체크할 수 있습니다.</span>
          </div>
        )}

        {/* 요일 모드 전환 (평일 기본 3종 vs 목요일 주말대비 6종) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setDayMode('REGULAR')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
              dayMode === 'REGULAR'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                : 'bg-white text-cyan-800 border-cyan-200 hover:bg-cyan-100/50'
            }`}
          >
            🍙 월·화·수·토·일 (삼각 3종)
          </button>
          <button
            type="button"
            onClick={() => setDayMode('THURSDAY')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
              dayMode === 'THURSDAY'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-indigo-800 border-cyan-200 hover:bg-indigo-50'
            }`}
          >
            🍙 목요일 전용 (삼각 6종)
          </button>
        </div>
      </div>

      {/* 2. 삼각김밥 자동 발주 섹션 (스캔 불필요) */}
      <div className="bg-surface border border-line rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-ink text-sm flex items-center gap-1.5">
              <span>🍙 삼각김밥 자동 발주</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                스캔 불필요 · 자동 포함
              </span>
            </h4>
            <p className="text-xs text-ink-faint mt-0.5">
              {dayMode === 'THURSDAY'
                ? '목요일(금요일 입고): 기본 3종 + 추가 3종 각 1개씩 총 6개 자동 발주'
                : '월·화·수·토·일: 기본 3종 각 1개씩 총 3개 자동 발주'}
            </p>
          </div>
          <span className="text-sm font-extrabold text-cyan-700 tabular">
            총 {activeKimbaps.reduce((s, k) => s + (kimbapOrderQtys[k.barcode] ?? 1), 0)}개
          </span>
        </div>

        <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-canvas/50">
          {activeKimbaps.map((k, idx) => {
            const qty = kimbapOrderQtys[k.barcode] ?? 1;
            const isExtra = idx >= 3;
            return (
              <div key={k.barcode} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isExtra ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-800'}`}>
                      {isExtra ? '목요일추가' : '기본'}
                    </span>
                    <span className="font-medium text-ink truncate">{k.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setKimbapOrderQtys((p) => ({ ...p, [k.barcode]: Math.max(0, (p[k.barcode] ?? 1) - 1) }))}
                    className="w-7 h-7 rounded-full bg-sunken hover:bg-line text-ink flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-ink tabular">{qty}개</span>
                  <button
                    type="button"
                    onClick={() => setKimbapOrderQtys((p) => ({ ...p, [k.barcode]: (p[k.barcode] ?? 1) + 1 }))}
                    className="w-7 h-7 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 저온 고정 체크리스트 (상품별 맞춤 버튼 + 즉시 수정 가능) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="font-bold text-ink text-base">❄️ 저온 필수 재고 체크표</h4>
            <p className="text-xs text-ink-faint mt-0.5">
              현재 남은 재고 버튼을 눌러주세요. 잘못 누르면 다른 버튼을 다시 눌러 바로 수정됩니다.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 tabular shrink-0">
            {checkedCount} / {checklistItems.length} 확인
          </span>
        </div>

        {Object.entries(groupedChecklist).map(([groupTitle, items]) => (
          <div key={groupTitle} className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-sunken/70 px-4 py-2.5 border-b border-line font-bold text-xs text-ink-soft">
              {groupTitle}
            </div>
            <div className="divide-y divide-line">
              {items.map((it) => {
                const chosen = selectedStocks[it.barcode];
                const isChecked = chosen !== undefined && chosen !== null;
                const isDPlus1 = storageService.isDPlus1Product(it.barcode, it.name);
                const isOrderedYesterday = isDPlus1 && yesterdayOrderedSet.has(it.barcode);
                const shortage = isChecked ? Math.max(0, it.targetStock - chosen) : 0;
                const predictedOrder = isOrderedYesterday ? 0 : (shortage > 0 ? Math.ceil(shortage / it.minOrderQty) * it.minOrderQty : 0);

                return (
                  <div
                    key={it.barcode}
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      isChecked ? 'bg-cyan-50/30' : 'bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-sm text-ink leading-snug break-keep">{it.name}</p>
                          {isDPlus1 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                                isOrderedYesterday
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {isOrderedYesterday ? '🚫 D+1 전날발주(오늘제외)' : '⏳ D+1 익일배송'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-faint mt-0.5">
                          목표 재고 {it.targetStock}개 · 최소단위 {it.minOrderQty}개
                          {isOrderedYesterday && ' · 전날 발주분 오늘/내일 입고 예정으로 오늘 발주에서 자동 제외됩니다'}
                        </p>
                      </div>

                      {/* 현재 선택된 상태 배지 */}
                      {isChecked ? (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 tabular ${
                            isOrderedYesterday
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : predictedOrder > 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          현재 {chosen}개 ➔ {isOrderedYesterday ? 'D+1 오늘발주 제외(0개)' : predictedOrder > 0 ? `발주 ${predictedOrder}개` : '충분(0개)'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sunken text-ink-faint shrink-0">
                          미선택
                        </span>
                      )}
                    </div>

                    {/* 맞춤형 원터치 수량 버튼 + [-][+] 미세 조절 */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {it.buttons.map((btn) => {
                        const isSelected = isChecked && chosen === btn.value;
                        return (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => handleSelectStock(it.barcode, btn.value)}
                            className={`flex-1 min-w-[64px] h-10 px-2.5 rounded-xl text-xs font-bold border transition-all tabular ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-300'
                                : 'bg-canvas hover:bg-sunken text-ink border-line'
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}

                      {/* 미세 조정 [-][+] */}
                      <div className="inline-flex items-center border border-line rounded-xl bg-canvas overflow-hidden h-10 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(it.barcode, it.targetStock, -1)}
                          className="w-8 h-full flex items-center justify-center text-ink-soft hover:bg-sunken"
                          aria-label="재고 1 감소"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular text-ink">
                          {isChecked ? chosen : '-'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(it.barcode, it.targetStock, 1)}
                          className="w-8 h-full flex items-center justify-center text-ink-soft hover:bg-sunken"
                          aria-label="재고 1 증가"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. 하단 [최종 확인 창 열기] 버튼 */}
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-base shadow-md flex items-center justify-center gap-2 transition-all"
      >
        <Check className="w-5 h-5" />
        <span>📋 찍은 수량 최종 확인하기 ({checkedCount}/{checklistItems.length})</span>
      </button>

      {/* 5. 2중 안전장치: 최종 몇 개를 찍었는지 한눈에 검수·수정하는 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-rise overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink">📋 저온 재고 최종 확인</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  내가 찍은 현재 재고 수량이 맞는지 한 번 더 확인해 주세요. (여기서도 바로 수정 가능)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-9 h-9 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* 미선택 품목 경고 */}
              {uncheckedItems.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      아직 버튼을 안 누른 상품 ({uncheckedItems.length}개)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...selectedStocks };
                        uncheckedItems.forEach((u) => {
                          next[u.barcode] = u.targetStock;
                        });
                        setSelectedStocks(next);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-rose-700 border border-rose-300 hover:bg-rose-100"
                    >
                      나머지 모두 '재고 충분' 처리
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {uncheckedItems.map((u) => (
                      <div key={u.barcode} className="bg-white rounded-xl p-2.5 border border-rose-200 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink truncate">{u.name}</span>
                        <div className="flex gap-1 shrink-0">
                          {u.buttons.map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              onClick={() => handleSelectStock(u.barcode, b.value)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-cyan-600 hover:text-white text-rose-900 border border-rose-200"
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 삼각김밥 자동 포함 내역 */}
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-900">
                    🍙 자동 포함 삼각김밥 ({activeKimbaps.length}종)
                  </span>
                  <span className="text-xs font-bold text-cyan-700">
                    총 {activeKimbaps.reduce((s, k) => s + (kimbapOrderQtys[k.barcode] ?? 1), 0)}개 발주
                  </span>
                </div>
                <div className="space-y-1 text-xs text-cyan-900">
                  {activeKimbaps.map((k) => (
                    <div key={k.barcode} className="flex justify-between">
                      <span className="truncate">{k.name}</span>
                      <strong className="tabular shrink-0">{kimbapOrderQtys[k.barcode] ?? 1}개</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 근무자가 찍은 체크리스트 전체 확인 & 즉시 수정 */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-ink-soft px-1">
                  ✅ 내가 입력한 저온 재고 내역 ({checkedCount}개 확인됨)
                </h4>
                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-canvas">
                  {checklistItems
                    .filter((it) => selectedStocks[it.barcode] !== undefined && selectedStocks[it.barcode] !== null)
                    .map((it) => {
                      const stock = selectedStocks[it.barcode]!;
                      const isDPlus1 = storageService.isDPlus1Product(it.barcode, it.name);
                      const isOrderedYesterday = isDPlus1 && yesterdayOrderedSet.has(it.barcode);
                      const shortage = Math.max(0, it.targetStock - stock);
                      const orderQty = isOrderedYesterday ? 0 : (shortage > 0 ? Math.ceil(shortage / it.minOrderQty) * it.minOrderQty : 0);
                      return (
                        <div key={it.barcode} className="p-3 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink truncate">{it.name}</p>
                            <p className="text-[11px] text-ink-faint mt-0.5">
                              목표 {it.targetStock}개 ➔{' '}
                              <strong className={isOrderedYesterday ? 'text-rose-700' : orderQty > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                                {isOrderedYesterday ? '🚫 D+1 전날발주 (오늘발주 제외)' : orderQty > 0 ? `${orderQty}개 발주 예정` : '발주 없음 (충분)'}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-ink-faint">현재재고</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(it.barcode, it.targetStock, -1)}
                              className="w-7 h-7 rounded-full bg-sunken hover:bg-line text-ink flex items-center justify-center"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-extrabold text-sm text-cyan-800 tabular">
                              {stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(it.barcode, it.targetStock, 1)}
                              className="w-7 h-7 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-line bg-surface flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-12 px-4 rounded-xl bg-sunken hover:bg-line text-ink-soft font-bold text-sm shrink-0"
              >
                돌아가서 수정
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="flex-1 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>✅ 최종 확인 완료 (목록 반영)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
