const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

// Raw parsed data from Ha Jin-hyun's video recording on 2026-11-02
const rawItems = [
  { barcode: '8806011416142', name: '미등록 상품 (사진)', stock: 3, target: 1, time: '11. 2. 오후 06:44:14', isUnmapped: true },
  { barcode: '8808024033552', name: '미등록 상품 (사진) (까페리얼 수박에이드)', stock: 2, target: 1, time: '11. 2. 오후 06:44:38', isUnmapped: true },
  { barcode: '8801062013388', name: '롯데]폭신폭신말랑카우밀크79g(3000)', stock: 1, target: 1, time: '11. 2. 오후 06:45:17' },
  { barcode: '8801062012824', name: '롯데]목캔디허브봉지217g(5500)', stock: 1, target: 1, time: '11. 2. 오후 06:45:24' },
  { barcode: '5996379377360', name: '삼경]하리보웜즈100g(2700)', stock: 1, target: 1, time: '11. 2. 오후 06:45:30' },
  { barcode: '4001686301265', name: '삼경]하리보골드베렌젤리200g(3800)', stock: 1, target: 1, time: '11. 2. 오후 06:45:39' },
  { barcode: '8801062885404', name: '롯데]핵짱셔요후르츠51g(1200)', stock: 2, target: 12, time: '11. 2. 오후 06:45:51' },
  { barcode: '8801062336579', name: '롯데]수박바젤리56g(1200)', stock: 3, target: 1, time: '11. 2. 오후 06:46:01' },
  { barcode: '8801117586904', name: '오리온]왕꿈틀이미니75g(1500)', stock: 2, target: 1, time: '11. 2. 오후 06:46:09' },
  { barcode: '8802010119008', name: '사조]로하이팝콘버터맛90g', stock: 1, target: 12, time: '11. 2. 오후 06:46:22' },
  { barcode: '096619816927', name: '미등록 상품 (사진) (커클랜드 전자레인지 팝콘)', stock: 2, target: 1, time: '11. 2. 오후 06:46:46', isUnmapped: true },
  { barcode: '8809027550602', name: '커널스]뉴슈퍼믹스컵70g(3000)', stock: 1, target: 1, time: '11. 2. 오후 06:46:55' },
  { barcode: '8801043047609', name: '농심]빵부장말차빵55g(1800)', stock: 2, target: 1, time: '11. 2. 오후 06:47:11' },
  { barcode: '8801117781705', name: '오리온]단백질칩칠리살사60g(1700)', stock: 1, target: 1, time: '11. 2. 오후 06:47:26' },
  { barcode: '8809821802051', name: '(2***1)스낵24]왕새우칩25g-33%할인', stock: 2, target: 1, time: '11. 2. 오후 06:47:35' },
  { barcode: '8801019607912', name: '해태]자가비짭짤한맛45g(2000)', stock: 2, target: 1, time: '11. 2. 오후 06:47:44' },
  { barcode: '8801117392109', name: '오리온]눈을감자치리치즈프라이즈56g(2000)', stock: 2, target: 1, time: '11. 2. 오후 06:48:00' },
  { barcode: '8801117777609', name: '오리온]눈을감자페퍼솔트56g(2000)', stock: 2, target: 3, time: '11. 2. 오후 06:48:04' },
  { barcode: '8801117689704', name: '오리온]치즈뿌린치킨팝65g(1100)', stock: 2, target: 1, time: '11. 2. 오후 06:48:10' },
  { barcode: '8801111610636', name: '크라운]죠리퐁74g(1500)', stock: 0, target: 1, time: '11. 2. 오후 06:48:14' },
  { barcode: '8801019606540', name: '해태]허니버터칩60g(1700)', stock: 0, target: 3, time: '11. 2. 오후 06:48:19' },
  { barcode: '8801043036177', name: '농심]꿀꽈배기90g(1800)', stock: 1, target: 1, time: '11. 2. 오후 06:48:28' },
  { barcode: '8801117775001', name: '오리온]뉴스윙칩핫볶음고추장60g(1700)', stock: 2, target: 1, time: '11. 2. 오후 06:48:39' },
  { barcode: '8801045560052', name: '오뚜기]뿌셔양념치킨90g', stock: 2, target: 1, time: '11. 2. 오후 06:49:10' },
  { barcode: '8801045560090', name: '오뚜기]뿌셔떡볶이맛90g', stock: 2, target: 3, time: '11. 2. 오후 06:49:13' },
  { barcode: '8801117761806', name: '오리온]땅콩강정80g(1600)', stock: 3, target: 1, time: '11. 2. 오후 06:49:25' },
  { barcode: '8801062380114', name: '롯데]꼬깔콘고소한맛67g(1700)', stock: 1, target: 1, time: '11. 2. 오후 06:49:46' },
  { barcode: '8801043036436', name: '농심]포스틱84g(1800)', stock: 2, target: 1, time: '11. 2. 오후 06:50:00' },
  { barcode: '8809304881023', name: '해광]프레첼체다치즈맛85g(1500)', stock: 2, target: 1, time: '11. 2. 오후 06:50:13' },
  { barcode: '8801073310711', name: '삼양]사또밥67g(1700)', stock: 2, target: 1, time: '11. 2. 오후 06:50:19' },
  { barcode: '8801062381814', name: '롯데]도리토스나쵸치즈84g(1700)', stock: 0, target: 3, time: '11. 2. 오후 06:50:24' },
  { barcode: '8801111180986', name: '크라운]카라멜콘과땅콩72g(1500)', stock: 3, target: 1, time: '11. 2. 오후 06:50:39' },
  { barcode: '8801111904292', name: '크라운]카라멜콘메이플74g(1500)', stock: 2, target: 1, time: '11. 2. 오후 06:50:47' },
  { barcode: '8801117760403', name: '오리온]포카칩어니언137g(3400)', stock: 1, target: 1, time: '11. 2. 오후 06:50:57' },
  { barcode: '8801117183509', name: '오리온]포카칩스윗치즈맛60g(1700)', stock: 0, target: 1, time: '11. 2. 오후 06:51:05' },
  { barcode: '8801043036597', name: '농심]양파링84g(1700)', stock: 2, target: 1, time: '11. 2. 오후 06:51:13' },
  { barcode: '8886467105357', name: '프링글스]양파맛(소)53g(2100)', stock: 1, target: 1, time: '11. 2. 오후 06:51:23' },
  { barcode: '8801019602504', name: '해태]구운감자8각108g(4000)', stock: 1, target: 1, time: '11. 2. 오후 06:51:31' },
  { barcode: '8801045688114', name: '오뚜기]컵누들면매콤찜닭소컵45g(1900)', stock: 1, target: 1, time: '11. 2. 오후 06:52:38' },
  { barcode: '8801043015837', name: '농심]너구리소컵(1350)', stock: 2, target: 1, time: '11. 2. 오후 06:52:42' },
  { barcode: '8801045572833', name: '오뚜기]참깨라면소컵65g(1450)', stock: 3, target: 1, time: '11. 2. 오후 06:52:50' },
  { barcode: '8801045520124', name: '오뚜기]진라면매운맛120g(봉지)(1050)', stock: 2, target: 1, time: '11. 2. 오후 06:53:01' },
  { barcode: '8801062012732', name: '롯데]화이트쿠키빼빼로37g(2000)', stock: 2, target: 1, time: '11. 2. 오후 06:53:23' },
  { barcode: '8801062879090', name: '롯데]ABC초코쿠키쿠앤크43g(1500)', stock: 1, target: 1, time: '11. 2. 오후 06:53:28' },
  { barcode: '8801117277406', name: '(행사)오리온]다이제초코원형225g(2800)', stock: 1, target: 1, time: '11. 2. 오후 06:53:34' },
  { barcode: '8801062865680', name: '롯데]제로초콜릿칩쿠키84g(3100)', stock: 1, target: 1, time: '11. 2. 오후 06:53:44' },
  { barcode: '8801037088168', name: '(행사)동서]오레오화이트크림100g(2100)', stock: 1, target: 1, time: '11. 2. 오후 06:53:49' },
  { barcode: '8801062870509', name: '롯데]롯데샌드105g(1700)', stock: 1, target: 1, time: '11. 2. 오후 06:53:57' },
  { barcode: '8801062870462', name: '롯데]빠다코코넛100g(1700)', stock: 1, target: 1, time: '11. 2. 오후 06:54:04' },
  { barcode: '8934760019359', name: '수입]티포녹차쿠키75g(1500)', stock: 1, target: 1, time: '11. 2. 오후 06:54:08' },
  { barcode: '8801019315435', name: '해태]에이스218g(3000)', stock: 1, target: 1, time: '11. 2. 오후 06:54:23' },
  { barcode: '8801062870424', name: '롯데]야채크래커83g(1700)', stock: 1, target: 1, time: '11. 2. 오후 06:54:28' },
  { barcode: '8801062869688', name: '롯데]마가렛트구운모카176g(3400)', stock: 1, target: 1, time: '11. 2. 오후 06:54:45' },
  { barcode: '8801111954808', name: '크라운]국희애플샌드91g(1600)', stock: 1, target: 1, time: '11. 2. 오후 06:54:49' },
  { barcode: '8801062636884', name: '롯데]가나마일드34g(1700)', stock: 1, target: 15, time: '11. 2. 오후 06:55:00' },
  { barcode: '8801062318551', name: '롯데]자일리톨F에프(빅)24g(1200)', stock: 1, target: 15, time: '11. 2. 오후 06:55:34' },
  { barcode: '7622201750770', name: '서영]호올스허니레몬27.9g(1000)', stock: 3, target: 20, time: '11. 2. 오후 06:55:48' },
  { barcode: '8809407991643', name: '오주]믹스너트40g', stock: 1, target: 1, time: '11. 2. 오후 06:56:14' },
  { barcode: '8801149404924', name: '썬푸드]타코야끼맛오징어25g', stock: 1, target: 1, time: '11. 2. 오후 06:56:22' },
  { barcode: '8801005013116', name: '샘표]질러부드러운육포30g', stock: 1, target: 1, time: '11. 2. 오후 06:56:28' },
  { barcode: '8801005013307', name: '샘표]질러직화육포45g', stock: 1, target: 1, time: '11. 2. 오후 06:56:31' },
  { barcode: '8807949110270', name: '아이존]다회용컵 10P', stock: 0, target: 1, time: '11. 2. 오후 06:56:59' },
  { barcode: '8801166022125', name: '유한]크리넥스각티슈3入180매', stock: 0, target: 1, time: '11. 2. 오후 06:57:10' },
  { barcode: '8801008004821', name: '유케이]뉴트로지나핸드크림56g', stock: 2, target: 1, time: '11. 2. 오후 06:57:22' },
  { barcode: '8801108000297', name: '존슨]화이트베이비로션100ml', stock: 2, target: 1, time: '11. 2. 오후 06:57:27' },
  { barcode: '8801008002858', name: '존슨]핑크로션100ml/4.5', stock: 2, target: 1, time: '11. 2. 오후 06:57:30' },
  { barcode: '8809299236839', name: 'LG]쏘피내몸에순한면팬티라이너28P', stock: 1, target: 1, time: '11. 2. 오후 06:58:12' },
  { barcode: '8809016360083', name: '(1***1)LG]쏘피BF귀애랑울중4P생리대-50%할인', stock: 1, target: 1, time: '11. 2. 오후 06:58:17' },
  { barcode: '8801166234214', name: '(행사)유한]좋은느낌울트라날개대16p', stock: 0, target: 1, time: '11. 2. 오후 06:58:26' },
  { barcode: '8801166234023', name: '(행사)유한]좋은느낌울트라날개중18P', stock: 0, target: 1, time: '11. 2. 오후 06:58:42' },
  { barcode: '8801166234412', name: '(1***1)유한]좋은느낌오리지널수퍼롱4P-50%할인', stock: 1, target: 1, time: '11. 2. 오후 06:58:48' },
  { barcode: '8801260605477', name: '*깨나라]보솜이베이비물티슈10매', stock: 0, target: 1, time: '11. 2. 오후 06:58:55' },
  { barcode: '047400241442', name: '질레트]스킨쉐이빙폼', stock: 0, target: 1, time: '11. 2. 오후 06:59:31' },
  { barcode: '8806011616184', name: '동아제약]가그린제로마일드380ml', stock: 0, target: 1, time: '11. 2. 오후 06:59:42' },
  { barcode: '8801441006253', name: '크리오]센스휴대용칫솔세트(치솔)', stock: 1, target: 1, time: '11. 2. 오후 06:59:55' },
  { barcode: '8801051010367', name: '(1***1)LG]페리오이지클리닉칫솔-50%할인', stock: 0, target: 1, time: '11. 2. 오후 07:00:01' },
  { barcode: '8801046886687', name: '(1***1)애경]2080오리지날칫솔미세모(치솔)-50%할인', stock: 3, target: 1, time: '11. 2. 오후 07:00:15' },
  { barcode: '8801038116266', name: '도루코]PACE6휴대용면도기1P', stock: 0, target: 1, time: '11. 2. 오후 07:00:22' },
  { barcode: '8801038560052', name: '도루코]터치3일회용면도기4입', stock: 1, target: 1, time: '11. 2. 오후 07:00:31' },
  { barcode: '8801038116228', name: '도루코]PACE4면도기1P', stock: 1, target: 1, time: '11. 2. 오후 07:00:39' },
  { barcode: '8801489834917', name: '쉬즈]미니쿠션브러쉬', stock: 0, target: 1, time: '11. 2. 오후 07:00:52' },
  { barcode: '8801489821948', name: '쉬즈]아크릴바느질세트', stock: 1, target: 1, time: '11. 2. 오후 07:01:02' },
  { barcode: '8809086622203', name: '벡셀]AAA-2입', stock: 0, target: 1, time: '11. 2. 오후 07:01:18' },
  { barcode: '8801006273854', name: '문구]초저점도3색볼펜에스', stock: 1, target: 1, time: '11. 2. 오후 07:01:37' },
  { barcode: '8801037053401', name: '동서]카누미니다크아메리카노10T', stock: 0, target: 1, time: '11. 2. 오후 07:03:19' },
  { barcode: '8801128503174', name: '팔도]팔도도시락용기(1100)', stock: 0, target: 24, time: '11. 2. 오후 07:04:58' },
  { barcode: '8801045875538', name: '오뚜기]참기름김치볶음밥259g(컵밥)', stock: 0, target: 1, time: '11. 2. 오후 07:05:13' },
  { barcode: '4897036692073', name: '코카]몬스터울트라시트라캔355ml', stock: 1, target: 1, time: '11. 2. 오후 07:12:00' },
  { barcode: '4897036693728', name: '코카]몬스터제로슈거캔355ml', stock: 4, target: 1, time: '11. 2. 오후 07:12:11' },
  { barcode: '4897036695203', name: '코카]몬스터에너지스트로베리캔355ml', stock: 1, target: 1, time: '11. 2. 오후 07:12:19' },
  { barcode: '9002490100070', name: '(2***1)동서]레드불에너지드링크캔250ml-33%할인', stock: 1, target: 1, time: '11. 2. 오후 07:12:25' },
  { barcode: '8801094113001', name: '코카]환타오렌지캔250ml', stock: 4, target: 1, time: '11. 2. 오후 07:12:33' },
  { barcode: '8801094013004', name: '코카]코카콜라캔250ml', stock: 2, target: 30, time: '11. 2. 오후 07:12:37' },
  { barcode: '8801094412371', name: '(1***1)코카]토레타제로펫500ml-50%할인', stock: 1, target: 1, time: '11. 2. 오후 07:12:58' },
  { barcode: '8801097250048', name: '동아]포카리스웨트펫500ml', stock: 0, target: 20, time: '11. 2. 오후 07:13:07' },
  { barcode: '4005906404811', name: '농심]파워오투애플키위펫500ml', stock: 1, target: 1, time: '11. 2. 오후 07:13:14' },
  { barcode: '4005906404835', name: '농심]파워오투오렌지레몬맛펫500ml', stock: 0, target: 1, time: '11. 2. 오후 07:13:22' },
  { barcode: '8801094000394', name: '*코카]환타멜론펫600ml', stock: 4, target: 1, time: '11. 2. 오후 07:13:30' },
  { barcode: '8801094082604', name: '코카]제로콜라펫500ml', stock: 3, target: 1, time: '11. 2. 오후 07:13:42' },
  { barcode: '8801056175955', name: '(행사)칠성]펩시제로라임펫500ml', stock: 4, target: 1, time: '11. 2. 오후 07:13:51' },
  { barcode: '8801056195014', name: '칠성]펩시콜라1.5L', stock: 1, target: 1, time: '11. 2. 오후 07:14:04' },
  { barcode: '8801094082406', name: '코카]제로콜라1.5L', stock: 3, target: 12, time: '11. 2. 오후 07:14:10' },
  { barcode: '8801094362409', name: '코카]파워에이드M/B1.5L', stock: 3, target: 1, time: '11. 2. 오후 07:14:17' },
  { barcode: '8801037087550', name: '(2***1)동서]티오피스윗아메리카노275ml-33%할인', stock: 3, target: 1, time: '11. 2. 오후 07:14:41' },
  { barcode: '8801047284642', name: '(2***1)동원]비타C자몽에이드제로펫500ml-33%할인', stock: 1, target: 24, time: '11. 2. 오후 07:16:02' },
  { barcode: '8801382150992', name: '웅진]초록매실제로펫500ml', stock: 4, target: 1, time: '11. 2. 오후 07:16:13' },
  { barcode: '8801056044534', name: '(2***1)칠성]립톤복숭아펫(제로)500ml-33%할인', stock: 4, target: 1, time: '11. 2. 오후 07:16:20' },
  { barcode: '8801069174020', name: '남양]몸이가벼워지는17차펫500ml', stock: 0, target: 1, time: '11. 2. 오후 07:16:26' },
  { barcode: '8801007171210', name: '(1***1)이노엔]컨디션헛개수펫500ml-50%할인', stock: 3, target: 1, time: '11. 2. 오후 07:16:34' },
  { barcode: '8809821802136', name: '(1***1)스낵24]구수한보리차펫500ml-50%할인', stock: 4, target: 20, time: '11. 2. 오후 07:16:49' },
  { barcode: '8801056055189', name: '(행사)칠성]트레비라임펫500ml', stock: 4, target: 1, time: '11. 2. 오후 07:16:56' },
  { barcode: '8801056069605', name: '(행사)칠성]트레비자몽펫500ml', stock: 4, target: 1, time: '11. 2. 오후 07:17:00' }
];

console.log('Total items in list:', rawItems.length);

// Convert Korean time string to timestamp
function parseTimeString(timeStr) {
  // e.g., '11. 2. 오후 06:44:14'
  const match = timeStr.match(/(\d+)\.\s*(\d+)\.\s*(오전|오후)\s*(\d+):(\d+):(\d+)/);
  if (!match) return Date.now();
  let hour = parseInt(match[4], 10);
  if (match[3] === '오후' && hour < 12) hour += 12;
  if (match[3] === '오전' && hour === 12) hour = 0;
  const d = new Date(2026, 10, 2, hour, parseInt(match[5], 10), parseInt(match[6], 10));
  return d.getTime();
}

const audits = rawItems.map((item, index) => {
  const ts = parseTimeString(item.time);
  return {
    id: ts.toString(),
    barcode: item.barcode,
    productName: item.name,
    vendor: 'younme',
    category: '상온',
    stockCount: item.stock,
    targetStock: item.target,
    minOrderQty: 1,
    workerName: '하진현',
    updatedAt: item.time,
    isUnmapped: !!item.isUnmapped
  };
});

// Sort newest first
audits.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

// Save to bot/audits_backup.json
const botBackupDir = path.join(__dirname, '..', 'bot');
if (!fs.existsSync(botBackupDir)) {
  fs.mkdirSync(botBackupDir, { recursive: true });
}

const payload = {
  type: 'AUDITS_UPDATE',
  senderId: 'RECOVERY_BOT',
  senderRole: 'WORKER',
  storeId: '1060',
  timestamp: Date.now(),
  audits: audits
};

fs.writeFileSync(path.join(botBackupDir, 'audits_backup.json'), JSON.stringify(payload, null, 2), 'utf8');
console.log('Successfully saved to bot/audits_backup.json');

// Also save to data/audits_20261102_hajinhyun.json for safekeeping
const dataDir = path.join(__dirname, '..', 'client', 'src', 'data');
fs.writeFileSync(path.join(dataDir, 'audits_20261102_hajinhyun.json'), JSON.stringify(audits, null, 2), 'utf8');
console.log('Successfully saved to client/src/data/audits_20261102_hajinhyun.json');

// Connect to MQTT and publish with retain: true
console.log('Connecting to MQTT broker to broadcast 112 audits...');
const client = mqtt.connect('mqtt://broker.emqx.io:1883', {
  clientId: 'recovery_bot_' + Math.random().toString(16).substring(2, 8),
  clean: true,
  connectTimeout: 7000
});

client.on('connect', () => {
  console.log('Connected to MQTT broker!');
  const topic = 'albagom-v2/stores/store_1060/audits_sync';
  client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
    if (err) {
      console.error('Failed to publish audits:', err);
    } else {
      console.log('Published 112 audits to ' + topic + ' with retain: true!');
    }
    client.end();
    process.exit(0);
  });
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
  process.exit(1);
});
