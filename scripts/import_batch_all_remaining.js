const importBatch = require('./import_audits_batch');

const remainingItems = [
  // Image 16 (media_1792671298764_2f0950d0.jpg)
  { barcode: '8806011616184', productName: '동아제약]가그린제로마일드380ml', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:08:13' },
  { barcode: '8809520468534', productName: '미등록 상품', stockCount: 2, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:08:00' },
  { barcode: '8802599000544', productName: '잡화]이태리장갑타올1입', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:07:42' },
  { barcode: '8801154575350', productName: '미등록 상품', stockCount: 0, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:07:35' },
  { barcode: '8801046900918', productName: '애경]케라시스샴푸린스미니세트', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:06:58' },
  { barcode: '8801051292909', productName: '(1***1)LG]엘라스틴프로틴손상린스480ml-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:06:50' },
  { barcode: '8801051107289', productName: '(1***1)LG]오가니스트바디워시500g(크랜베리)-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:06:44' },
  { barcode: '8809437830592', productName: '잡화]종이컵10입', stockCount: 3, targetStock: 1, updatedAt: '10. 22. 오후 07:06:38' },

  // Image 17 (media_1792671298765_181fd57e.jpg)
  { barcode: '8809175304058', productName: '(행사)에너자이저]리튬코인2032(4P)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:11:16' },
  { barcode: '8809086621206', productName: '미등록 상품', stockCount: 2, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:11:11' },
  { barcode: '8809086622203', productName: '벡셀]AAA-2입', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:10:48' },
  { barcode: '8809456370598', productName: '(행사)선린]CtoC초고속100W케이블(1.5M)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:10:43' },
  { barcode: '8809693974177', productName: '*뉴클]PD Cto8핀케이블(1.5M)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:10:37' },
  { barcode: '8809111780298', productName: '(행사)선린]2in1도킹보조배터리5000mh', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:10:32' },
  { barcode: '8809703879225', productName: '이룸]스피디가정용8핀일체형충전기', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:10:27' },
  { barcode: '8809622691441', productName: '미등록 상품', stockCount: 1, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:10:22' },

  // Image 18 (media_1792671298765_9d8aed64.jpg)
  { barcode: '8809061377746', productName: '문구]컴퓨터싸인펜', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:12:59' },
  { barcode: '8801006813203', productName: '문구]모나미네임펜(흑)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:12:46' },
  { barcode: '8801006273854', productName: '문구]초저점도3색볼펜에스', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:12:38' },
  { barcode: '8801230166014', productName: '미등록 상품', stockCount: 1, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:12:30' },
  { barcode: '8809683300030', productName: '(행사)문구]문구가위', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:11:59' },
  { barcode: '8809261902618', productName: '(1***1)*아이원]터닝메카드R면마스크(소형)-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:11:54' },
  { barcode: '8809703879645', productName: '미등록 상품', stockCount: 0, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:11:48' },
  { barcode: '8809175192747', productName: '*로제트]C타입커널형이어폰(KD-2)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:11:23' },

  // Image 19 (media_1792671298767_d57cbb9d.jpg)
  { barcode: '8801489804187', productName: '쉬즈]옷핀세트', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:20' },
  { barcode: '8801489804118', productName: '쉬즈]미용가위', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:09:11' },
  { barcode: '8801489845548', productName: '쉬즈]버블톡족집게', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:06' },
  { barcode: '8801489804088', productName: '쉬즈]스토퍼깍기', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:02' },
  { barcode: '8801489831374', productName: '쉬즈]스프링밴드머리끈(중)2P', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:08:57' },
  { barcode: '8801051012255', productName: 'LG]카카오여행용치솔세트(무지)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:08:50' },
  { barcode: '8801038116228', productName: '도루코]PACE4면도기1P', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:08:45' },
  { barcode: '047400241442', productName: '미등록 상품', stockCount: 1, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:08:34' },

  // Image 20 (media_1792671298787_886c8157.jpg)
  { barcode: '8801230600020', productName: '3M]이어플러그(귀마개)(78786)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:10:08' },
  { barcode: '8801046433119', productName: '(행사)애경]립바이브슈가밤로지레드4.8g(립케어)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:10:04' },
  { barcode: '8801051000603', productName: 'LG]페리오치간칫솔L자형(치솔)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:50' },
  { barcode: '8801489834917', productName: '쉬즈]미니쿠션브러쉬', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:42' },
  { barcode: '8801489845388', productName: '쉬즈]미니헤어롤브러쉬빗', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:09:39' },
  { barcode: '8801489833705', productName: '쉬즈]앞머리헤어롤', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:32' },
  { barcode: '8801489843919', productName: '쉬즈]미니사각손거울', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:09:28' },
  { barcode: '8801489821948', productName: '쉬즈]아크릴바느질세트', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:09:24' },

  // Image 21 (media_1792671302272_add38fd7.jpg)
  { barcode: '8801149402388', productName: '썬푸드]올리브유쥐포구이70g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:46' },
  { barcode: '8801045880112', productName: '오뚜기]황도캔400g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:33' },
  { barcode: '8801045880211', productName: '오뚜기]백도캔400g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:27' },
  { barcode: '8801047828396', productName: '동원]참치튜나페고소마요129g(참치크래커)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:22' },
  { barcode: '8801005013116', productName: '샘표]질러부드러운육포30g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:16' },
  { barcode: '8801005013307', productName: '샘표]질러직화육포45g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:12' },
  { barcode: '8801005013215', productName: '샘표]질러크레이지핫육포30g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:00:02' },
  { barcode: '8801149403743', productName: '썬푸드]한마리전기구이오징어33g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:59:49' },

  // Image 22 (media_1792671302273_981f6d06.jpg)
  { barcode: '8809437830615', productName: '잡화]소주컵10입', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:06:29' },
  { barcode: '8807949110270', productName: '미등록 상품', stockCount: 0, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:06:20' },
  { barcode: '8809458931452', productName: '잡화]일회용치실50입', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:05:09' },
  { barcode: '8809103875209', productName: '(행사)케이앤]드림아이80ml(렌즈케이스포함)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:04:59' },
  { barcode: '4550516621238', productName: '미등록 상품', stockCount: 1, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:04:46' },
  { barcode: '8801046290163', productName: '(1***1)애경]포인트딥클린폼100g-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:04:32' },
  { barcode: '8801051121599', productName: '(1***1)LG]온더바디레몬클렌징폼120g-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:04:25' },
  { barcode: '8809319430544', productName: '*중부]튼튼나무면봉(원통)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:04:04' },

  // Image 23 (media_1792671302274_7b1d2eeb.jpg)
  { barcode: '8801051304459', productName: 'LG]여행용세트미니스(공용)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:03:56' },
  { barcode: '8801051262681', productName: '(1***1)LG]샤프란케어스타일러(피톤치드)100ml-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:03:47' },
  { barcode: '4902430741873', productName: '피앤지]페브리즈New은은370ml', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:03:42' },
  { barcode: '8801260209316', productName: '(행사)깨나라]여행용티슈50매', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:03:36' },
  { barcode: '8801260611324', productName: '깨나라]보솜이베이비물티슈10매(리뉴얼)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:03:28' },
  { barcode: '8801166234412', productName: '(1***1)유한]좋은느낌오리지널수퍼롱4P-50%할인', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:03:21' },
  { barcode: '8801166238786', productName: '(1***1)유한]화이트수퍼흡수대형16P-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:03:13' },
  { barcode: '8801166238762', productName: '(1***1)유한]화이트수퍼흡수중형18P-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:03:01' },

  // Image 24 (media_1792671302275_0cb61ba9.jpg)
  { barcode: '8801166234023', productName: '(행사)유한]좋은느낌울트라날개중18P', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:02:56' },
  { barcode: '8801166234214', productName: '(행사)유한]좋은느낌울트라날개대16p', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:02:52' },
  { barcode: '8801162334383', productName: '미등록 상품', stockCount: 2, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:02:47' },
  { barcode: '8801166234399', productName: '(1***1)유한]좋은느낌울트라날개중4P-50%할인', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:02:33' },
  { barcode: '8809016360083', productName: '(1***1)LG]쏘피BF귀애랑울중4P생리대-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:02:22' },
  { barcode: '8809299236839', productName: 'LG]쏘피내몸에순한면팬티라이너28P', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:02:17' },
  { barcode: '8801166230438', productName: '미등록 상품', stockCount: 2, targetStock: 1, isUnmapped: true, updatedAt: '10. 22. 오후 07:02:11' },
  { barcode: '8801166230469', productName: '(1***1)유한]좋은느낌입는오버나이트중형4P-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:01:47' },

  // Image 25 (media_1792671302276_7d95265a.jpg)
  { barcode: '8809299234842', productName: '(1***1)LG]쏘피BF내몸에순한면대16P-50%할인', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:01:41' },
  { barcode: '8806011632771', productName: '동아제약]템포슈퍼10P', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:01:35' },
  { barcode: '8806011632856', productName: '동아제약]템포레귤러10P', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:01:31' },
  { barcode: '8801260420728', productName: '(1***1)깨나라]순수한면제로영대형14P-50%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:01:23' },
  { barcode: '8809359461072', productName: '보민]맥주랑3단안주70g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:01:14' },
  { barcode: '8801308426668', productName: '정화]맥반석통오징어50g(전기구이)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:01:07' },
  { barcode: '8801149405822', productName: '썬푸드]손질먹태50g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:00:58' },
  { barcode: '8801308438074', productName: '정화]오징어는땅콩을좋아해40g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:00:52' },

  // Image 26 (media_1792671305619_1ef88bfc.jpg)
  { barcode: '8801019309946', productName: '해태]포키극세44g(1900)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:30' },
  { barcode: '8801062862658', productName: '롯데]몽쉘생크림카카오204g(소)(3500)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:22' },
  { barcode: '8801062893546', productName: '롯데]ABC초코쿠키50g(1500)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:12' },
  { barcode: '8801019316715', productName: '해태]버터링딥초코155g(4800)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:06' },
  { barcode: '8801019308130', productName: '해태]초코홈런볼컵51g(2200)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:55:59' },
  { barcode: '8801117277406', productName: '(행사)오리온]다이제초코원형225g(2800)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:55:53' },
  { barcode: '8801062871124', productName: '롯데]씨리얼초코컵89g(2800)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 06:55:47' },
  { barcode: '8801062640782', productName: '롯데]크런키더블크런치36g(1300)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 06:55:34' },

  // Image 27 (media_1792671305619_34461d8a.jpg)
  { barcode: '8801149405471', productName: '썬푸드]쫄랑이오징어다리40g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:59:31' },
  { barcode: '8801149405501', productName: '썬푸드]구운한치16g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:59:26' },
  { barcode: '8801007022635', productName: '(행사)CJ]맛밤80g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:59:18' },
  { barcode: '8801133000583', productName: '머거본]솔티드아몬드(봉지)40g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:59:11' },
  { barcode: '8801133010582', productName: '머거본]커피땅콩(봉지)40g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:59:03' },
  { barcode: '8801133000743', productName: '머거본]칼몬드(봉지)35g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:58:56' },
  { barcode: '8801133001108', productName: '머거본]믹스너트(봉지)40g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:58:51' },
  { barcode: '8809407991650', productName: '오주]구운캐슈넛35g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:58:47' },

  // Image 28 (media_1792671305621_1fc00920.jpg)
  { barcode: '8801019315435', productName: '해태]에이스218g(3000)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:35' },
  { barcode: '8801062870462', productName: '롯데]빠다코코넛100g(1700)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:24' },
  { barcode: '8801117555818', productName: '오리온]마켓오리얼브라우니6입120g(3300)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 06:57:17' },
  { barcode: '8801117446901', productName: '오리온]초코송이50g(1200)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:08' },
  { barcode: '8801117139001', productName: '오리온]예감볶은양파맛64g(1500)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:59' },
  { barcode: '8801117282301', productName: '오리온]예감치즈그라탕64g(1500)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:52' },
  { barcode: '8801117540210', productName: '오리온]후레쉬베리6입168g(3600)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:44' },
  { barcode: '8801117120306', productName: '오리온]통크초코45g(1200)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:56:36' },

  // Image 29 (media_1792671305636_9a39602d.jpg)
  { barcode: '8809407992404', productName: '오주]구운아몬드35g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:58:40' },
  { barcode: '8809407991643', productName: '오주]믹스너트40g', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 06:58:37' },
  { barcode: '8801111954808', productName: '크라운]국희애플샌드91g(1600)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:58:21' },
  { barcode: '8801019317132', productName: '해태]구운감자슬림240g(4800)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:58:13' },
  { barcode: '8801062869688', productName: '롯데]마가렛트구운모카176g(3400)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:58:03' },
  { barcode: '8801104770415', productName: '빙그레]뽀로로와친구들플레인맛65g(1700)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:54' },
  { barcode: '8801019309168', productName: '해태]계란과자핑크퐁70g(1900)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:48' },
  { barcode: '8801019318146', productName: '해태]에이스씬에스프레소291g(4400)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 06:57:40' }
];

console.log(`남은 이미지 14장(총 112개 품목) 처리 시작...`);
importBatch(remainingItems);
