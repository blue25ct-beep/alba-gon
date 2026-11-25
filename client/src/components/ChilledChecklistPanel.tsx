import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, AuditItem } from '../types';
import { Check, Plus, Minus, Send, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { soundManager } from '../services/sound';

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

export interface ChilledChecklistEntry {
  targetStock: number;
  targetStockByDay?: Record<number, number>; // 요일별 목표재고 오버라이드 (예: { 3: 5 } = 수요일만 5개)
  zone: string;
  subLabel?: string;
  vendor?: 'chilled' | 'younme';
  buttons?: { label: string; value: number }[];
  activeDays?: number[]; // 특정 요일만 노출 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
  workerNote?: string; // 발주 필요 시 근무자에게 표시할 안내 문구 (예: '창고 재고 확인')
  displayName?: string; // 근무자 체크리스트 화면 전용 표시명 (마스터 상품명은 유지)
}

export const CHILLED_ZONES = [
  { id: 'ICE', label: '🧊 얼음컵 냉장고' },
  { id: 'BREAD', label: '🍞 빵 진열대' },
  { id: 'FREEZER_A', label: '🥶 수직 냉동고 A' },
  { id: 'FREEZER_B', label: '🥶 수직 냉동고 B' },
  { id: 'SHOWCASE_A', label: '🥗 쇼케이스 A' },
  { id: 'SHOWCASE_B', label: '🥛 쇼케이스 B' },
  { id: 'BASKET', label: '🧺 하단 바구니' },
] as const;

// 우선 테스트 기간 동안 노출할 구역 (나머지 구역은 데이터 보존 상태로 임시 숨김 — 여기에 구역명만 추가하면 즉시 복원)
const ACTIVE_CHILLED_ZONES = new Set<string>([
  '🥗 쇼케이스 A',
  '🥛 쇼케이스 B',
]);

// 매장 실사진 6구역 배치도 기준 저온 + 합동진열 상온 통합 체크리스트
export const DEFAULT_CHILLED_CHECKLIST_ENTRIES: [string, ChilledChecklistEntry][] = [
  // === 1. 얼음컵 냉장고 ===
  ['8801308449940', { targetStock: 12, zone: '🧊 얼음컵 냉장고', subLabel: '왼쪽 칸', vendor: 'chilled' }], // $우신]큰얼음컵230g(냉동)
  ['8801308442026', { targetStock: 15, zone: '🧊 얼음컵 냉장고', subLabel: '오른쪽 칸', vendor: 'chilled' }], // $우신]작은얼음컵185g(냉동)
  ['8801308470319', { targetStock: 15, zone: '🧊 얼음컵 냉장고', subLabel: '오른쪽 칸', vendor: 'chilled' }], // $우신]빅볼 얼음컵160g(냉동)

  // === 2. 빵 진열대 ===
  ['8809531970033', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '상단', vendor: 'chilled', buttons: [{ label: '0개(품절)', value: 0 }] }], // 대심]신바나나향케익130g
  ['4903099201005', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '상단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // (행사)수입]야마우치밀크롤케이크140g
  ['4933121401097', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '상단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // (행사)수입]시아와세도밀크케익180g
  ['8809256674643', { targetStock: 5, zone: '🍞 빵 진열대', subLabel: '상단', vendor: 'younme', buttons: [{ label: '2개 이하', value: 2 }] }], // 미성]허쉬초코칩싱글쿠키50g
  ['8801068929003', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'chilled', buttons: [{ label: '0개(품절)', value: 0 }] }], // 삼립]시그니처카스테라125g(D+1)
  ['8801068938173', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'chilled', buttons: [{ label: '0개(품절)', value: 0 }] }], // 삼립]시그니처흑당카스테라125g(D+1)
  ['4973484034617', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // 수입]바나나밀크카스테라90g
  ['4973484034600', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // 수입]소프트카스테라90g
  ['8934760210053', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // 수입]티포롤케이크80g
  ['8934760210060', { targetStock: 1, zone: '🍞 빵 진열대', subLabel: '하단', vendor: 'younme', buttons: [{ label: '0개(품절)', value: 0 }] }], // 수입]티포롤케이크딸기맛80g

  // === 3. 수직 냉동고 A (왼쪽) ===
  ['8809015225246', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '3단', vendor: 'chilled' }], // $한맥]마시따데리맛닭가슴살큐브130g
  ['8801074606059', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '3단', vendor: 'chilled' }], // $한성)롤피자스틱치즈90g
  ['8801074606028', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '3단', vendor: 'chilled' }], // $한성)롤피자스틱불고기80g
  ['8801074606035', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '3단', vendor: 'chilled' }], // $한성)롤피자스틱콤비네이션80g
  ['8801045931036', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '4단', vendor: 'chilled' }], // $오뚜기]오감포차직화닭발150g
  ['8801045931043', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '4단', vendor: 'chilled' }], // $오뚜기]오감포차직화오돌뼈150g
  ['8809674770309', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '5단', vendor: 'chilled' }], // $한맥]클래식토마토피자미니75g
  ['8809674770149', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '5단', vendor: 'chilled' }], // $한맥]리얼토핑트러플불고기피자138g
  ['8801123724680', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '6단', vendor: 'chilled' }], // $롯데햄)마늘퐁닭매콤마늘치킨200g
  ['8801392112485', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '6단', vendor: 'chilled' }], // (1+1)$CJ)고메소바바치킨양념순살240g
  ['8801392087073', { targetStock: 2, zone: '🥶 수직 냉동고 A', subLabel: '6단', vendor: 'chilled' }], // (1+1)$CJ)고메소바바치킨허니순살240g

  // === 4. 수직 냉동고 B (오른쪽) ===
  ['8809015225055', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '1단', vendor: 'chilled' }], // $한맥]포켓치킨양념치킨맛180g
  ['8809015225048', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '1단', vendor: 'chilled' }], // $한맥]포켓치킨데리야끼맛180g
  ['8809015225031', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '1단', vendor: 'chilled' }], // $한맥]포켓치킨핫후라이드180g
  ['8801045941103', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '2단', vendor: 'chilled' }], // $오뚜기]맛있는새우볶음밥230g
  ['8801007353395', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '2단', vendor: 'chilled' }], // (2+1)$CJ)스팸김치볶음밥220g
  ['8801045750217', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '2단', vendor: 'chilled' }], // $오뚜기)콤비네이션컵피자150g
  ['8801392186967', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '3단', vendor: 'chilled' }], // (행사)$CJ)비비고찐만두168g
  ['8801392187070', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '3단', vendor: 'chilled' }], // (행사)$CJ)비비고청양고추찐만두168g
  ['8801123701445', { targetStock: 3, zone: '🥶 수직 냉동고 B', subLabel: '4단', vendor: 'chilled' }], // $롯데햄)켄터키핫도그75g
  ['8801227180030', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '4단', vendor: 'chilled' }], // $사조)고기포자만두180g
  ['8801227180047', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '4단', vendor: 'chilled' }], // $사조)김치포자만두180g
  ['8809015220159', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '5단', vendor: 'chilled' }], // $한맥]불벅145g(냉동햄버거)
  ['8801392011887', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '6단', vendor: 'chilled' }], // (행사)$CJ]비비고왕교자315g
  ['8801007429052', { targetStock: 2, zone: '🥶 수직 냉동고 B', subLabel: '6단', vendor: 'chilled' }], // (행사)$CJ)비비고김치왕교자385g
  ['8801308447847', { targetStock: 4, zone: '🥶 수직 냉동고 B', subLabel: '7단(바닥)', vendor: 'chilled' }], // $우신]각얼음1KG(냉동)

  // === 5. 쇼케이스 A (왼쪽 냉장) ===
  // 걸이대
  ['8801066060036', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // 대림]비엔나꼬치다90g(D+1)
  ['8801123304219', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // 롯데햄)미니비엔나140g(D+1)
  ['8801123000586', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (1+1)롯데햄]켄터키직화핟빠65g(D+1)
  ['8801123410347', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (행사)롯데햄]직꾸닭리얼간장100g(D+1)
  ['8801123308910', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // 롯데햄)의성마늘프랑크140g(D+1)
  ['8801123309498', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (행사)롯데햄]의성마늘프랑크빅90g(D+1)
  ['8801066065451', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (1+1)대림]구운마늘맛후랑크65g(D+1)
  ['8801007618807', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (2+1)CJ]구운풍미마늘후랑크80g(D+1)
  ['8801066062405', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (2+1)대림]크라비아스틱60g(D+1)
  ['8801066062528', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (2+1)대림]크라비아스틱버터갈릭60g(D+1)
  ['8801066060258', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (2+1)대림]닭가슴살네모나블랙페퍼80g(D+1)
  ['8801066056435', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '걸이대', vendor: 'chilled' }], // (2+1)대림]닭가슴살블랙페퍼100g(D+1)
  ['8801121020388', {
    targetStock: 2,
    zone: '🥗 쇼케이스 A',
    subLabel: '걸이대(치즈존)',
    vendor: 'younme',
    buttons: [
      { label: '0개(품절)', value: 0 },
      { label: '1개', value: 1 },
      { label: '2개+(충분)', value: 2 },
    ],
  }], // CP] 매일]상하치즈크림치즈48g
  ['8801121027431', {
    targetStock: 1,
    zone: '🥗 쇼케이스 A',
    subLabel: '걸이대(치즈존)',
    vendor: 'younme',
    buttons: [
      { label: '0개(품절)', value: 0 },
      { label: '1개+(충분)', value: 1 },
    ],
  }], // CP] 매일]상하치즈아몬드고다48g
  ['8801155834616', { targetStock: 5, zone: '🥗 쇼케이스 A', subLabel: '걸이대(치즈존)', vendor: 'chilled' }], // (2+1)DM]인포켓치즈오리지널20g
  // 1단
  ['8801104951302', {
    targetStock: 1,
    zone: '🥗 쇼케이스 A',
    subLabel: '1단',
    vendor: 'chilled',
    activeDays: [4], // 목요일만 노출
    buttons: [
      { label: '0개(품절)', value: 0 },
      { label: '1개+(충분)', value: 1 },
    ],
  }], // (2+1)빙그레]닥터캡슐복숭아130ml
  ['8801104665421', {
    targetStock: 1,
    zone: '🥗 쇼케이스 A',
    subLabel: '1단',
    vendor: 'chilled',
    buttons: [
      { label: '0개(품절)', value: 0 },
      { label: '1개+(충분)', value: 1 },
    ],
  }], // (2+1)빙그레]닥터캡슐사과130ml
  ['8801104302739', {
    targetStock: 1,
    zone: '🥗 쇼케이스 A',
    subLabel: '1단',
    vendor: 'chilled',
    buttons: [
      { label: '0개(품절)', value: 0 },
      { label: '1개+(충분)', value: 1 },
    ],
  }], // (2+1)빙그레]닥터캡슐플레인130ml
  ['8801121767122', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // 매일)바이오드링킹플레인250ml
  ['8801121767139', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // 매일)바이오드링킹딸기250ml
  ['8801121764176', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // 매일)BIO플레인요거트150g
  ['8801121768105', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // 매일)요구르트로어슈거280ml
  ['8801155744502', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // (2+1)DM]하이요구르트280ml
  ['8801007841113', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // (행사)CJ]미정당어묵떡볶이346g(D+1)
  ['8801007009377', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '1단', vendor: 'chilled' }], // (행사)CJ)가쓰오우동한그릇222.5g(D+1)
  // 2단
  ['8801066066069', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // (1+1)대림]크라비아데일리80g(D+1)
  ['8801066062986', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // (2+1)대림]로얄크랩100g(D+1)
  ['8809136850815', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // 제니코)라면쏙치즈 30g
  ['8801155737580', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // DM]슈레드피자치즈(눈꽃)25g
  ['8801069176710', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // 남양]드빈치체다슬라이스치즈85g
  ['8801118400926', { targetStock: 1, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled' }], // 롯데)햄치즈게맛살샌드위치173g
  ['8801118400957', { targetStock: 1, zone: '🥗 쇼케이스 A', subLabel: '2단', vendor: 'chilled', activeDays: [4] }], // 롯데)NEW듬뿍햄샌드위치155g (목요일만 노출)
  // 3단
  ['8801007635989', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '3단', vendor: 'chilled' }], // CJ]비비고김치볶음80g(D+1)
  ['8801024190201', { targetStock: 3, zone: '🥗 쇼케이스 A', subLabel: '3단', vendor: 'chilled' }], // 종가집]종가집맛김치컵130g(D+1)
  ['8801316124259', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '3단', vendor: 'chilled' }], // 한울]매운실비김치(컵)80g(D+1)
  ['CP_SALAMI_4500', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '3단', vendor: 'younme' }], // CP] 이탈리안 살라미 (쿠팡 수동발주)
  ['8801118034909', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '3단', vendor: 'chilled', activeDays: [4] }], // 롯데]쩝쩝박사6찬전통비빔밥385g (목요일만 노출)
  // 4단
  ['8801316100031', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'chilled' }], // 한울]꼬마단무지120g(D+1)
  ['8801005482820', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'younme' }], // 샘표]우리엄마돼지고기장조림110g
  ['8801005484824', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'younme' }], // 샘표]메추리알장조림130g
  ['8801005483827', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'younme' }], // 샘표]우리엄마쇠고기장조림110g
  ['8801005302838', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'younme' }], // 샘표]깨끗한깻잎70g
  ['8809396600014', {
    targetStock: 3,
    targetStockByDay: { 3: 5 }, // 평소 3개, 수요일(주말 대비) 5개
    zone: '🥗 쇼케이스 A',
    subLabel: '4단',
    vendor: 'chilled',
    buttons: [
      { label: '0개', value: 0 },
      { label: '1개', value: 1 },
      { label: '2개', value: 2 },
      { label: '3개', value: 3 },
      { label: '4개', value: 4 },
      { label: '5개+', value: 5 },
    ],
  }], // 진주)마루카네감동란(삶은계란)2구(D+1)
  ['8801392194078', {
    targetStock: 3,
    targetStockByDay: { 3: 5 }, // 평소 3개, 수요일(주말 대비) 5개
    zone: '🥗 쇼케이스 A',
    subLabel: '4단',
    vendor: 'chilled',
    buttons: [
      { label: '0개', value: 0 },
      { label: '1개', value: 1 },
      { label: '2개', value: 2 },
      { label: '3개', value: 3 },
      { label: '4개', value: 4 },
      { label: '5개+', value: 5 },
    ],
  }], // CJ]훈제대란100g(2입)(D+1)
  ['8801242001716', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'chilled' }], // (행사)CJ)프레쉬안오뎅한그릇360g(D+1)
  ['8801242039085', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '4단', vendor: 'chilled' }], // (행사)CJ)얼큰오뎅한그릇360g(D+1)
  // 5단
  ['8801910684005', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 풍림)왕족발400g
  ['8809106840044', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 풍림)고향편육250g
  ['8809106840037', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 풍림)왕방산족발슬라이스400g
  ['8801068939866', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 삼립]로스트치킨소금구이210g(D+1)
  ['8801118879425', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 롯데햄)까르보나라스파게티220g(D+1)
  ['8801118879418', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 롯데햄)볼로네이즈스파게티220g(D+1)
  ['8801118005824', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '5단', vendor: 'chilled' }], // 롯데햄]생크림로제스파게티220g(D+1)
  // 6단 (상온 합동진열 음료)
  ['8801382124528', { targetStock: 3, zone: '🥗 쇼케이스 A', subLabel: '6단', vendor: 'younme' }], // 웅진]아침햇살펫500ml
  ['8801105941227', { targetStock: 2, zone: '🥗 쇼케이스 A', subLabel: '6단', vendor: 'younme', displayName: '해태음료]과일촌음료수병(한병)' }], // 상온 마스터(해태음료]과일촌오포사선물세트(병)) 유지, 저온 체크표는 단품 1종 표기

  // === 6. 쇼케이스 B (오른쪽 냉장) ===
  // 1단
  ['8806011416142', { targetStock: 5, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'younme', buttons: [{ label: '2개 이하', value: 2 }] }], // CP] 동아제약 얼박 음료
  ['8801056623012', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // 칠성]델몬트콜드오렌지250ml
  ['8801056624019', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // 칠성]델몬트콜드포도250ml
  ['8809422046045', { targetStock: 3, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'younme' }], // *이노엔]컨디션스파클링제로자몽병100ml
  ['8809422042986', { targetStock: 3, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'younme' }], // 이노엔]확깬다헛개컨디션병120ml
  ['8801013777468', { targetStock: 3, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'younme' }], // (1+1)삼양사]큐원상쾌환부스터제로100ml
  ['8801056104641', { targetStock: 3, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'younme' }], // 칠성]깨수깡캔160ml
  ['8801155744472', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // (1+1)DM]테이크얼라이브블렌드레몬300ml
  ['8801155744489', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // (1+1)DM]테이크얼라이브블렌드자몽300ml
  ['8809848280436', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // (1+1)DM]얼라이브아사이베리200ml
  ['8801155735647', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // (1+1)DM]얼라이브망고200ml
  ['8801155744762', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '1단', vendor: 'chilled' }], // (1+1)DM]얼라이브스위티자몽200ml
  // 2단 (우유/단지우유)
  ['8801115114031', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // 서울)서울우유200ml
  ['8801121101582', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // 매일)ESL우유200ml
  ['8801121101568', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // 매일)ESL우유500ml
  ['8801121772874', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // 매일)엣지후레쉬팩우유900ml
  ['8801115114154', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // 서울)서울우유1000ml
  ['8801155742393', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(우유)', vendor: 'chilled' }], // (행사)DM]소화가잘되는우유190ml
  ['8801121768440', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(두유)', vendor: 'chilled' }], // 매일]매일두유(99.9) 190ml
  ['8801121768464', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(두유)', vendor: 'chilled' }], // 매일]매일두유식이섬유190ml
  ['8801121025710', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(두유)', vendor: 'younme', workerNote: '창고 재고 확인' }], // CP] 매일]매일두유검은콩190ml
  ['88002798', {
    targetStock: 5,
    zone: '🥛 쇼케이스 B',
    subLabel: '2단(단지우유)',
    vendor: 'chilled',
    buttons: [
      { label: '0개', value: 0 },
      { label: '1개', value: 1 },
      { label: '2개', value: 2 },
      { label: '3개', value: 3 },
      { label: '4개', value: 4 },
      { label: '5개+', value: 5 },
    ],
  }], // 빙그레)바나나맛우유240ml
  ['8801104212205', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(단지우유)', vendor: 'chilled' }], // 빙그레)바나나라이트우유240ml
  ['8801104221467', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(단지우유)', vendor: 'chilled' }], // 빙그레)딸기맛우유240ml
  ['8801104940870', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(단지우유)', vendor: 'chilled' }], // 빙그레]메로나맛우유240ml
  ['8801104948272', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '2단(단지우유)', vendor: 'chilled' }], // 빙그레)바나나맛우유무가당240ml
  // 3단 (허쉬/에몽/말차/비요뜨/쿨피스)
  ['8801121759943', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 매일]허쉬드링크쿠앤크235ml
  ['8801121032435', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 매일]허쉬드링크프로틴235ml
  ['8801121190197', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 매일]허쉬드링크(팩]235ml
  ['8801069180977', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 남양]딸기에몽190ml
  ['8801069171067', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 남양)초코에몽190ml
  ['8801104952910', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // 빙그레]왕실말차드링크190ml
  ['8801115212713', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // (2+1)서울]비요뜨초코링138g
  ['8801115213604', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // (2+1)서울]비요뜨쿠키앤크림131g
  ['8801155745073', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // (1+1)DM]쿨피스복숭아190ml
  ['8801155745080', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // (1+1)DM]쿨피스파인애플190ml
  ['8801155743758', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '3단', vendor: 'chilled' }], // (1+1)DM]쿨피스에이드복숭아300ml
  // 4단 (아몬드브리즈/프로틴)
  ['8801121763933', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // 매일)아몬드브리즈오리지널190ml
  ['8801121025666', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // 매일]아몬드브리즈프로틴190ml
  ['8801121763940', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // 매일)아몬드브리즈언스위트190ml
  ['8801121768068', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // 매일)아몬드브리즈초콜릿190ml
  ['8801121046142', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // 매일]아몬드브리즈커피190ml
  ['8801392081484', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (1+1)CJ]얼티브프로틴밤250ml(D+1)
  ['8801392081507', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (행사)CJ]얼티브프로틴고소한맛250ml(D+1)
  ['8801392039225', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (행사)CJ]얼티브비건프로틴초코250ml(D+1)
  ['8801115118886', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)서울]내안의진짜초코280ml
  ['8801115118893', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)서울]내안의진짜딸기280ml
  ['8801104670876', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)빙그레]더단백초코250ml
  ['8801104942935', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)빙그레]더단백딸기250ml
  ['8801104673211', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)빙그레]더단백커피250ml
  ['8801069415833', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)남양]테이크핏고소한맛200ml
  ['8801069419619', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)남양]테이크핏호박고구마맛200ml
  ['8801069416007', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '4단', vendor: 'chilled' }], // (2+1)남양]테이크핏초코맛200ml
  // 5단 (컵커피/병커피)
  ['8801115382102', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // 동서]스타벅스컵바닐라라떼320ml
  ['8801115382003', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // 동서]스타벅스컵카페라떼320ml
  ['8801115224303', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // 동서]스타벅스컵카페모카320ml
  ['8801115382157', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // 동서]스타벅스카페라떼설탕무첨가320ml
  ['8801037086188', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단', vendor: 'younme' }], // 동서]스타벅스프라푸치노커피병281ml
  ['8801037086195', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단', vendor: 'younme' }], // 동서]스타벅스프라푸치노모카병281ml
  ['8801037077698', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단', vendor: 'younme' }], // 동서]스타벅스프라푸치노돌체병281ml
  ['8801121768174', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // (행사)매일]바리스타룰스블랙325ml
  ['8801121027523', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // (행사)매일]바리스타룰스디카페인라떼325ml
  ['8801121768167', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // (행사)매일]바리스타룰스라떼325ml
  ['8801121761823', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '5단(커피)', vendor: 'chilled' }], // 매일)바리스타컵로슈거에스프레소라떼250ml
  // 6단 (푸딩/대용량커피)
  ['8809447501659', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'younme' }], // CP]바로먹는 발효곤약 냉모밀, 350g
  ['8805684011715', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // 쉐프엠]젤리블리제로애플망고60g
  ['8809064498431', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // 뚜또)코코딸기푸딩230g
  ['8809064498646', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // 뚜또)후르츠믹스푸딩230g
  ['8809064498639', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // 뚜또)포도푸딩230g
  ['8809064498370', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // 뚜또)밀감푸딩230g
  ['8801121031834', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (행사)매일]바리스타그란데아메리카노475ml
  ['8801121031858', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (행사)매일]바리스타그란데라떼475ml
  ['8801104304047', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (2+1)빙그레)사이즈업카페라떼350ml
  ['8801104940931', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (2+1)빙그레]사이즈업연유라떼350ml
  ['8801104306591', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (2+1)빙그레)사이즈업바닐라라떼350ml
  ['8801104304023', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (2+1)빙그레)사이즈업아메리카노350ml
  ['8801104948005', { targetStock: 2, zone: '🥛 쇼케이스 B', subLabel: '6단', vendor: 'chilled' }], // (2+1)빙그레]사이즈업디카페인350ml
  // === 7. 하단 바구니 (상온 합동진열: 컵시리얼 3종 / 통조림 / 케찹) ===
  ['8801083333304', { targetStock: 3, zone: '🧺 하단 바구니', subLabel: '컵시리얼', vendor: 'younme' }], // 켈로그]콘푸로스트 컵시리얼40g
  ['8801083323305', { targetStock: 3, zone: '🧺 하단 바구니', subLabel: '컵시리얼', vendor: 'younme' }], // 켈로그]첵스 컵시리얼40g
  ['8801083330303', { targetStock: 3, zone: '🧺 하단 바구니', subLabel: '컵시리얼', vendor: 'younme' }], // 켈로그]아몬드후레이크컵시리얼40g
  ['8801007314891', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // CJ]스팸120g (작은거)
  ['8801047111849', { targetStock: 3, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 동원]라이트스탠다드참치150g
  ['8801047121350', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 동원]야채참치150g
  ['8801047123750', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 동원]고추참치150g
  ['8801045360034', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 오뚜기]초당옥수수스위트콘340g
  ['8801047141099', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 동원]자연산꽁치캔400g
  ['8801123600519', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 롯데햄]장조림80g
  ['8801045100111', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '소스', vendor: 'younme' }], // 오뚜기]토마토케찹300g
  ['8801045880112', { targetStock: 2, zone: '🧺 하단 바구니', subLabel: '통조림', vendor: 'younme' }], // 오뚜기]황도캔400g
];

export const DEFAULT_CHILLED_CHECKLIST_BARCODES: Record<string, ChilledChecklistEntry> = Object.fromEntries(
  DEFAULT_CHILLED_CHECKLIST_ENTRIES
);

const cleanWorkerDisplayName = (rawName: string) =>
  rawName
    .replace(/^CP\]\s*/i, '')
    .replace(/쿠팡\]\s*/g, '')
    .replace(/\(D\+1\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const CHILLED_DRAFT_STORAGE_KEY = 'albagom_chilled_draft_v1';

const getTodayKstDateKey = () =>
  new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export const clearChilledDraftStorage = () => {
  try {
    localStorage.removeItem(CHILLED_DRAFT_STORAGE_KEY);
  } catch {}
};

const readChilledDraft = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(CHILLED_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.date !== getTodayKstDateKey() || typeof parsed.stocks !== 'object') {
      localStorage.removeItem(CHILLED_DRAFT_STORAGE_KEY);
      return {};
    }
    return parsed.stocks || {};
  } catch {
    return {};
  }
};

const writeChilledDraft = (stocks: Record<string, number | null>) => {
  try {
    const clean: Record<string, number> = {};
    Object.entries(stocks).forEach(([bc, val]) => {
      if (val !== undefined && val !== null) clean[bc] = val;
    });
    if (Object.keys(clean).length === 0) {
      localStorage.removeItem(CHILLED_DRAFT_STORAGE_KEY);
    } else {
      localStorage.setItem(
        CHILLED_DRAFT_STORAGE_KEY,
        JSON.stringify({ date: getTodayKstDateKey(), stocks: clean })
      );
    }
  } catch {}
};

export interface SubmittedChecklistItem {
  barcode: string;
  productName: string;
  stockCount: number;
  targetStock: number;
  minOrderQty: number;
  vendor: 'chilled' | 'younme';
  category: string;
}

interface ChilledChecklistPanelProps {
  products: Product[];
  existingAudits: AuditItem[];
  onSubmitChecklist: (items: SubmittedChecklistItem[]) => void;
  onAutoSaveChecklist?: (items: SubmittedChecklistItem[]) => void;
  onRemoveAuditBarcodes?: (barcodes: string[]) => void;
}

export const ChilledChecklistPanel: React.FC<ChilledChecklistPanelProps> = ({
  products,
  existingAudits,
  onSubmitChecklist,
  onAutoSaveChecklist,
  onRemoveAuditBarcodes,
}) => {
  // 구역별 아코디언 열림 상태 (기본: 쇼케이스 A 열림)
  const [openZones, setOpenZones] = useState<Record<string, boolean>>({
    '🧊 얼음컵 냉장고': false,
    '🍞 빵 진열대': false,
    '🥶 수직 냉동고 A': false,
    '🥶 수직 냉동고 B': false,
    '🥗 쇼케이스 A': true,
    '🥛 쇼케이스 B': false,
    '🧺 하단 바구니': false,
  });

  // 체크리스트 상품별 근무자 선택 재고 상태 (existingAudits + 오늘 날짜 임시저장 자동 복원)
  const [selectedStocks, setSelectedStocks] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    existingAudits.forEach((a) => {
      init[a.barcode] = a.stockCount;
    });
    const draft = readChilledDraft();
    Object.entries(draft).forEach(([bc, val]) => {
      init[bc] = val;
    });
    return init;
  });

  // 최종 확인 팝업 표시 여부
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 초저리소스 저장용 ref (디바운스 & 10건마다 / 구역·카테고리 이탈 시 변경분만 1회 전송)
  const isDirtyRef = useRef(false);
  const dirtyCountRef = useRef(0);
  const latestStocksRef = useRef(selectedStocks);
  latestStocksRef.current = selectedStocks;
  const onAutoSaveRef = useRef(onAutoSaveChecklist);
  onAutoSaveRef.current = onAutoSaveChecklist;
  const prevExistingCountRef = useRef(existingAudits.length);

  const checklistItems = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.barcode, p]));
    const list: {
      barcode: string;
      name: string;
      targetStock: number;
      minOrderQty: number;
      zone: string;
      subLabel?: string;
      vendor: 'chilled' | 'younme';
      category: string;
      buttons: { label: string; value: number }[];
      workerNote?: string;
    }[] = [];

    const todayDay = new Date().getDay();
    DEFAULT_CHILLED_CHECKLIST_ENTRIES.forEach(([barcode, cfg]) => {
      if (!ACTIVE_CHILLED_ZONES.has(cfg.zone)) return;
      if (cfg.activeDays && !cfg.activeDays.includes(todayDay)) return;
      const p = prodMap.get(barcode);
      const dayOverride = cfg.targetStockByDay?.[todayDay];
      const isReviewed = Boolean(p && (p.reviewStatus || p.updatedAt));
      const target =
        dayOverride !== undefined
          ? dayOverride
          : (isReviewed && p ? Math.max(1, p.targetStock) : ((p && p.targetStock > 1) ? p.targetStock : cfg.targetStock));
      const minQty = Math.max(1, p?.minOrderQty || 1);
      const name = cfg.displayName || p?.name || barcode;
      const vendor: 'chilled' | 'younme' = cfg.vendor || (p?.vendor === 'younme' ? 'younme' : 'chilled');
      const category = p?.category || (vendor === 'younme' ? '상온' : '저온냉장');

      let buttons = cfg.buttons;
      if (!buttons) {
        if (target >= 10) {
          buttons = [
            { label: '0개', value: 0 },
            { label: `${Math.round(target * 0.3)}개`, value: Math.round(target * 0.3) },
            { label: `${Math.round(target * 0.6)}개`, value: Math.round(target * 0.6) },
            { label: `${target}개+(충분)`, value: target },
          ];
        } else if (target >= 5) {
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

      list.push({ barcode, name, targetStock: target, minOrderQty: minQty, zone: cfg.zone, subLabel: cfg.subLabel, vendor, category, buttons, workerNote: cfg.workerNote });
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
          zone: '❄️ 추가 지정 저온 상품',
          vendor: p.vendor === 'younme' ? 'younme' : 'chilled',
          category: p.category || '저온냉장',
          buttons,
        });
      }
    });

    return list;
  }, [products]);

  const groupedChecklist = useMemo(() => {
    const groups: Record<string, typeof checklistItems> = {};
    checklistItems.forEach((it) => {
      if (!groups[it.zone]) groups[it.zone] = [];
      groups[it.zone].push(it);
    });
    return groups;
  }, [checklistItems]);

  const latestChecklistItemsRef = useRef(checklistItems);
  latestChecklistItemsRef.current = checklistItems;

  const buildPayloadFromStocks = (stocks: Record<string, number | null>): SubmittedChecklistItem[] => {
    const payload: SubmittedChecklistItem[] = [];
    latestChecklistItemsRef.current.forEach((it) => {
      const stock = stocks[it.barcode];
      if (stock !== undefined && stock !== null) {
        payload.push({
          barcode: it.barcode,
          productName: it.name,
          stockCount: stock,
          targetStock: it.targetStock,
          minOrderQty: it.minOrderQty,
          vendor: it.vendor,
          category: it.category,
        });
      }
    });
    return payload;
  };

  // 변경분이 있을 때만 클라우드(실사 목록)로 1회 일괄 동기화 (리소스 최소화)
  const flushAutoSaveToCloud = (overrideStocks?: Record<string, number | null>) => {
    if (!isDirtyRef.current || !onAutoSaveRef.current) return;
    const payload = buildPayloadFromStocks(overrideStocks || latestStocksRef.current);
    isDirtyRef.current = false;
    dirtyCountRef.current = 0;
    if (payload.length > 0) {
      onAutoSaveRef.current(payload);
    }
  };

  // 1단계: 300ms 디바운스 휴대폰 내부 localStorage 임시저장 (통신 0바이트, ~2KB)
  useEffect(() => {
    const timer = setTimeout(() => {
      writeChilledDraft(selectedStocks);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedStocks]);

  // 앱 백그라운드 전환 / 닫기 / 카테고리 이탈 시 즉시 로컬 flush + 변경분 1회 클라우드 동기화
  useEffect(() => {
    const handleBackgroundFlush = () => {
      writeChilledDraft(latestStocksRef.current);
      if (document.visibilityState === 'hidden') {
        flushAutoSaveToCloud();
      }
    };
    const handlePageHide = () => {
      writeChilledDraft(latestStocksRef.current);
      flushAutoSaveToCloud();
    };
    document.addEventListener('visibilitychange', handleBackgroundFlush);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleBackgroundFlush);
      window.removeEventListener('pagehide', handlePageHide);
      writeChilledDraft(latestStocksRef.current);
      flushAutoSaveToCloud();
    };
  }, []);

  // 앱 재실행 직후 클라우드/로컬 existingAudits가 비동기 도착하거나 원격 초기화될 때 체크표 동기화
  useEffect(() => {
    if (existingAudits.length === 0 && prevExistingCountRef.current > 0) {
      const draft = readChilledDraft();
      if (Object.keys(draft).length === 0) {
        setSelectedStocks({});
      }
    } else if (existingAudits.length > 0) {
      setSelectedStocks((prev) => {
        let changed = false;
        const next = { ...prev };
        existingAudits.forEach((a) => {
          if (next[a.barcode] === undefined) {
            next[a.barcode] = a.stockCount;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
    prevExistingCountRef.current = existingAudits.length;
  }, [existingAudits]);

  const handleSelectStock = (barcode: string, val: number) => {
    soundManager.playScanSuccess();
    isDirtyRef.current = true;
    const safeVal = Math.max(0, val);
    const willClear = selectedStocks[barcode] === safeVal;
    const nextStocks: Record<string, number | null> = {
      ...selectedStocks,
      [barcode]: willClear ? null : safeVal,
    };
    latestStocksRef.current = nextStocks;
    setSelectedStocks(nextStocks);
    if (willClear) {
      if (onRemoveAuditBarcodes && existingAudits.some((a) => a.barcode === barcode)) {
        onRemoveAuditBarcodes([barcode]);
      }
    } else {
      dirtyCountRef.current += 1;
      if (dirtyCountRef.current >= 10) {
        flushAutoSaveToCloud(nextStocks);
      }
    }
  };

  const handleClearItem = (barcode: string) => {
    isDirtyRef.current = true;
    setSelectedStocks((prev) => {
      const next = { ...prev, [barcode]: null };
      writeChilledDraft(next);
      return next;
    });
    if (onRemoveAuditBarcodes && existingAudits.some((a) => a.barcode === barcode)) {
      onRemoveAuditBarcodes([barcode]);
    }
  };

  const handleResetZone = (zoneTitle: string, items: { barcode: string }[]) => {
    const checkedInZone = items.filter(
      (it) => selectedStocks[it.barcode] !== undefined && selectedStocks[it.barcode] !== null
    );
    if (checkedInZone.length === 0) return;
    if (!confirm(`"${zoneTitle}"의 체크된 재고 ${checkedInZone.length}건을 모두 초기화할까요?`)) return;
    isDirtyRef.current = true;
    const clearedBarcodes = checkedInZone.map((it) => it.barcode);
    setSelectedStocks((prev) => {
      const next = { ...prev };
      items.forEach((it) => {
        next[it.barcode] = null;
      });
      writeChilledDraft(next);
      return next;
    });
    if (onRemoveAuditBarcodes) {
      const savedInZone = clearedBarcodes.filter((bc) => existingAudits.some((a) => a.barcode === bc));
      if (savedInZone.length > 0) onRemoveAuditBarcodes(savedInZone);
    }
  };

  const handleAdjustStock = (barcode: string, targetStock: number, delta: number) => {
    isDirtyRef.current = true;
    const current = selectedStocks[barcode] ?? targetStock;
    const nextStocks: Record<string, number | null> = {
      ...selectedStocks,
      [barcode]: Math.max(0, current + delta),
    };
    latestStocksRef.current = nextStocks;
    setSelectedStocks(nextStocks);
    dirtyCountRef.current += 1;
    if (dirtyCountRef.current >= 10) {
      flushAutoSaveToCloud(nextStocks);
    }
  };

  const toggleZone = (zoneTitle: string) => {
    flushAutoSaveToCloud();
    setOpenZones((prev) => ({ ...prev, [zoneTitle]: !prev[zoneTitle] }));
  };

  const focusZone = (zoneTitle: string) => {
    flushAutoSaveToCloud();
    setOpenZones((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        next[k] = k === zoneTitle;
      });
      next[zoneTitle] = true;
      return next;
    });
  };

  const checkedItems = checklistItems.filter((it) => selectedStocks[it.barcode] !== undefined && selectedStocks[it.barcode] !== null);
  const uncheckedItems = checklistItems.filter((it) => selectedStocks[it.barcode] === undefined || selectedStocks[it.barcode] === null);
  const checkedCount = checkedItems.length;

  const handleFinalConfirm = () => {
    const finalPayload = buildPayloadFromStocks(selectedStocks);
    isDirtyRef.current = false;
    dirtyCountRef.current = 0;
    clearChilledDraftStorage();
    setShowConfirmModal(false);
    onSubmitChecklist(finalPayload);
  };

  return (
    <div className="space-y-5">
      {/* 1. 구역 빠른 선택 탭 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="font-bold text-ink text-base">🗺️ 구역별 재고 체크표 ({Object.keys(groupedChecklist).length}구역)</h4>
            <p className="text-xs text-ink-faint mt-0.5">
              서 계신 구역을 눌러 부족한 상품의 현재 재고만 톡톡 눌러주세요.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 tabular shrink-0">
            {checkedCount} / {checklistItems.length} 확인
          </span>
        </div>

        <div className={`grid gap-1.5 ${Object.keys(groupedChecklist).length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {Object.entries(groupedChecklist).map(([zoneTitle, zItems]) => {
            const zChecked = zItems.filter((it) => selectedStocks[it.barcode] !== undefined && selectedStocks[it.barcode] !== null).length;
            const isOpen = !!openZones[zoneTitle];
            return (
              <button
                key={zoneTitle}
                type="button"
                onClick={() => focusZone(zoneTitle)}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-0.5 ${
                  isOpen
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-surface text-ink-soft border-line hover:bg-sunken'
                }`}
              >
                <span className="truncate max-w-full">{zoneTitle}</span>
                <span className={`text-[10px] tabular ${isOpen ? 'text-cyan-100' : 'text-ink-faint'}`}>
                  {zChecked}/{zItems.length}
                </span>
              </button>
            );
          })}
        </div>

        {Object.entries(groupedChecklist).map(([zoneTitle, items]) => {
          const isOpen = !!openZones[zoneTitle];
          const zChecked = items.filter((it) => selectedStocks[it.barcode] !== undefined && selectedStocks[it.barcode] !== null).length;
          return (
            <div key={zoneTitle} className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
              <div className="w-full bg-sunken/70 px-4 py-3 border-b border-line flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleZone(zoneTitle)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                >
                  <span className="font-bold text-sm text-ink truncate">{zoneTitle}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-cyan-800 border border-cyan-200 tabular shrink-0">
                    {zChecked} / {items.length}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {zChecked > 0 && (
                    <button
                      type="button"
                      onClick={() => handleResetZone(zoneTitle, items)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                      title={`${zoneTitle} 체크 내용 초기화`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      초기화
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleZone(zoneTitle)}
                    className="p-1 text-ink-faint hover:text-ink transition-colors"
                    aria-label={`${zoneTitle} 접기/펼치기`}
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="divide-y divide-line">
                  {items.map((it) => {
                    const chosen = selectedStocks[it.barcode];
                    const isChecked = chosen !== undefined && chosen !== null;
                    const displayName = cleanWorkerDisplayName(it.name);

                    return (
                      <div
                        key={it.barcode}
                        className={`p-3.5 space-y-2.5 transition-colors ${
                          isChecked ? 'bg-cyan-50/30' : 'bg-surface'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {it.subLabel && (
                              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-sunken text-ink-soft font-semibold mb-1">
                                {it.subLabel}
                              </span>
                            )}
                            <p className="font-semibold text-sm text-ink leading-snug break-keep">{displayName}</p>
                            {it.workerNote && isChecked && chosen! < it.targetStock && (
                              <p className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                                📦 {it.workerNote}
                              </p>
                            )}
                          </div>

                          {/* 현재 선택된 상태 배지 (누르면 개별 해제) */}
                          {isChecked ? (
                            <button
                              type="button"
                              onClick={() => handleClearItem(it.barcode)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 tabular bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                              title="누르면 선택 해제"
                            >
                              <span>현재 {chosen}개</span>
                              <X className="w-3 h-3" />
                            </button>
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
                                className={`flex-1 min-w-[60px] h-10 px-2 rounded-xl text-xs font-bold border transition-all tabular ${
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
              )}
            </div>
          );
        })}
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

      {/* 5. 최종 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-rise overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink">📋 저온 재고 최종 확인</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  입력한 현재 재고 수량이 맞는지 한 번 더 확인해 주세요.
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
              {uncheckedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900">
                  ℹ️ 미선택 상품 <strong>{uncheckedItems.length}개</strong>는 재고 변동이 없는 것으로 간주하고, 선택하신 <strong>{checkedCount}개</strong>만 목록에 반영됩니다.
                </div>
              )}

              {/* 근무자가 찍은 체크리스트 전체 확인 & 즉시 수정 */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-ink-soft px-1">
                  ✅ 내가 입력한 재고 내역 ({checkedCount}개 확인됨)
                </h4>
                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-canvas">
                  {checkedItems.map((it) => {
                    const stock = selectedStocks[it.barcode]!;
                    return (
                      <div key={it.barcode} className="p-3 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink truncate">{cleanWorkerDisplayName(it.name)}</p>
                          {it.subLabel && (
                            <p className="text-[11px] text-ink-faint mt-0.5">{it.zone} · {it.subLabel}</p>
                          )}
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
