const importBatch = require('./import_audits_batch');

const batch3 = [
  // Image 11
  { barcode: '8801043015776', productName: '농심]새우탕소컵67g(1350)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:30:07' },
  { barcode: '8801073210776', productName: '삼양]불닭볶음면소컵70g(1400)', stockCount: 3, targetStock: 1, updatedAt: '10. 22. 오후 07:29:51' },
  { barcode: '8801045572833', productName: '오뚜기]참깨라면소컵65g(1450)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:29:30' },
  { barcode: '8886467100031', productName: '프링글스]치즈맛110g(4000)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:29:11' },
  { barcode: '8886467100024', productName: '프링글스]양파맛110g(4000)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:28:58' },
  { barcode: '8886467100017', productName: '프링글스]오리지날110g(4000)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:28:45' },
  { barcode: '8886467100055', productName: '프링글스]매운맛110g(4000)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:28:30' },
  { barcode: '8886467114618', productName: '프링글스]핫앤스파이시(소)53g(2100)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:28:17' },

  // Image 12
  { barcode: '8809169792427', productName: '잡화]파텍스강력접착제50g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:14:10' },
  { barcode: '8806037006105', productName: '신신]에어파스EX200ml', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:13:59' },
  { barcode: '8802260000439', productName: '대일]밴드혼합형', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:13:50' },
  { barcode: '8806380150340', productName: '인따르]페이크덧신양말(색상랜덤)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:13:38' },
  { barcode: '8806380150364', productName: '인따르]숙녀스니커즈양말(검정)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:13:32' },
  { barcode: '8806380150296', productName: '인따르]신사무지정장양말(검정)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:13:26' },
  { barcode: '8801006813104', productName: '문구]유성매직(흑)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:13:14' },
  { barcode: '8801006813401', productName: '문구]캠퍼스볼펜(흑)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:13:07' },

  // Image 13
  { barcode: '8801007732466', productName: '(행사)CJ]햇반버터장조림비빔밥216g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:25:50' },
  { barcode: '8801007611679', productName: '(행사)CJ]햇반철판제육덮밥250g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:25:25' },
  { barcode: '8801007778280', productName: '(행사)CJ]햇반치킨마요덮밥233g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:25:14' },
  { barcode: '8801007423180', productName: '(행사)CJ]햇반강된장보리비빔밥280g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:25:04' },
  { barcode: '8801007566412', productName: '(행사)CJ]햇반중화마파두부덮밥270g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:24:55' },
  { barcode: '8801007403267', productName: '(행사)CJ]햇반미역국밥167g(컵반)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:24:41' },
  { barcode: '8801047224334', productName: '동원]양반올리브유김', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:24:25' },
  { barcode: '8801128503211', productName: '팔도]왕뚜껑(1500)', stockCount: 3, targetStock: 18, updatedAt: '10. 22. 오후 07:15:53' },

  // Image 14
  { barcode: '8801043015653', productName: '농심]육개장사발면(중)(24입)(1100)', stockCount: 1, targetStock: 24, updatedAt: '10. 22. 오후 07:15:43' },
  { barcode: '8803060018549', productName: '백제]얼큰한쌀국수90g', stockCount: 3, targetStock: 1, updatedAt: '10. 22. 오후 07:15:28' },
  { barcode: '8803060082441', productName: '백제]파곰탕면쌀국수용기93.5g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:15:19' },
  { barcode: '8801045571386', productName: '(행사)오뚜기]라면볶이큰컵120g(1900)', stockCount: 3, targetStock: 12, updatedAt: '10. 22. 오후 07:15:03' },
  { barcode: '8801043016049', productName: '농심]짜파게티큰사발(1600)', stockCount: 2, targetStock: 16, updatedAt: '10. 22. 오후 07:14:53' },
  { barcode: '8801235320022', productName: '이라이프]다회용위생수저10입', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:14:35' },
  { barcode: '8801230160036', productName: '3M]포스트잇1800(653-2)(59350)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:14:27' },
  { barcode: '8809047801111', productName: '문구]스프링합지노트', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:14:19' },

  // Image 15
  { barcode: '8886467105333', productName: '프링글스]오리지날(소)53g(2100)', stockCount: 2, targetStock: 1, updatedAt: '10. 22. 오후 07:28:04' },
  { barcode: '8801392114496', productName: '(행사)CJ]햇반소고기죽268g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:27:43' },
  { barcode: '8801392114458', productName: '(행사)CJ]햇반단호박죽267g', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:27:29' },
  { barcode: '8801007054186', productName: '(2***1)CJ]큰햇반300g(원형)-33%할인', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:27:11' },
  { barcode: '8801007867045', productName: '(행사)CJ]햇반스팸김치덮밥251g(컵반)', stockCount: 1, targetStock: 1, updatedAt: '10. 22. 오후 07:26:56' },
  { barcode: '8801007732442', productName: '(행사)CJ]햇반스팸마요덮밥219g(컵반)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:26:38' },
  { barcode: '8801045875538', productName: '오뚜기]참기름김치볶음밥259g(컵반)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:26:27' },
  { barcode: '8801007446998', productName: '(행사)CJ]햇반직화볶음짜장덮밥280g(컵반)', stockCount: 0, targetStock: 1, updatedAt: '10. 22. 오후 07:26:19' }
];

console.log(`배치 3 처리 시작: 총 ${batch3.length}개 품목`);
importBatch(batch3);
