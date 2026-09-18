const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');
const querystring = require('querystring');
const iconv = require('iconv-lite');

const USER_ID = process.env.YOUNME_USER_ID || '047458';
const USER_PW = process.env.YOUNME_PASSWORD;

// 1. 湲곕낯 留덉뒪???곗씠??濡쒕뱶 (460??媛??덈ぉ ?좎븻誘?怨듭떇 怨듦툒?④? 罹먯떆)
let seedMap = {};
try {
  const seedList = require('./seedProducts.json');
  for (const p of seedList) {
    seedMap[p.barcode] = p;
  }
} catch (e) {
  try {
    const fallbackList = require('../../client/src/data/seedProducts.json');
    for (const p of fallbackList) {
      seedMap[p.barcode] = p;
    }
  } catch (err) {}
}

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer,
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * ?좎븻誘?4 ?ъ씠?몄뿉??諛붿퐫?쒕줈 ?ㅼ떆媛?怨듭떇 怨듦툒?④?(price) 諛??⑥쐞(unit) 議고쉶
 */
async function fetchYounmeProductInfo(sessionCookie, folder, barcode, orderDate) {
  try {
    const searchPayload = querystring.stringify({
      order_date: orderDate,
      order_dev: 'j',
      order_type: '1',
      search_dev: 'product_name',
      search_word: '',
      search_word2: barcode,
    });

    const res = await httpRequest({
      hostname: 'www.younme24.com',
      port: 80,
      path: `/${folder}/product_list.asp`,
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(searchPayload),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    }, searchPayload);

    const html = res.body.toString('latin1');
    const regex = new RegExp(`cart_add\\(['"]${barcode}['"],\\s*['"]\\d+['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],.*?['"]([^'"]*)['"],\\s*['"]([^'"]*)['"]`);
    const match = html.match(regex);
    if (match) {
      return {
        unit: match[1] || 'EA',
        price: parseInt(match[2], 10) || 0,
        cs: match[3] || 'j',
        valid: match[4] || 'y',
      };
    }
  } catch (e) {
    console.warn(`[orderEngine] ?④? ?ㅼ떆媛?議고쉶 ?덉쇅 (${barcode}):`, e.message);
  }
  return null;
}

async function runDirectOrderAdd(items, onProgress) {
  if (!USER_PW) {
    throw new Error('.env ?뚯씪??YOUNME_PASSWORD 媛 ?ㅼ젙?섏뼱 ?덉? ?딆뒿?덈떎.');
  }

  // 1. ?좎븻誘?4 濡쒓렇??
  const loginPayload = querystring.stringify({
    home: 'y',
    userid: USER_ID,
    passwd: USER_PW,
  });

  const loginRes = await httpRequest({
    hostname: 'www.younme24.com',
    port: 80,
    path: '/member/login.asp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginPayload),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  }, loginPayload);

  // ?몄뀡 荑좏궎 異붿텧
  const rawCookies = loginRes.headers['set-cookie'] || [];
  const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');
  if (!sessionCookie) {
    throw new Error('?좎븻誘?4 ?몄뀡 荑좏궎 ?띾뱷 ?ㅽ뙣. ?꾩씠?붿? 鍮꾨?踰덊샇瑜??뺤씤?댁＜?몄슂.');
  }

  // 2. ?곸삩 諛쒖＜ ?쇱옄 ?뺤씤
  const appRes = await httpRequest({
    hostname: 'www.younme24.com',
    port: 80,
    path: '/app1/app.asp',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const appHtml = appRes.body.toString('latin1');
  const mDate = appHtml.match(/name=["']order_date["']\s+value=["'](\d+)["']/);
  const orderDate = mDate ? mDate[1] : '20260905';

  let successCount = 0;
  const failures = [];

  // 3. ?덈ぉ ?쒗쉶?섎ŉ ?뺥솗???④?(price)瑜??ы븿?섏뿬 ?λ컮援щ땲 異붽?
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 荑좏뙜 ?꾩슜 ?곹뭹 嫄대꼫?곌린
    if (item.productName && item.productName.includes('荑좏뙜]')) {
      failures.push({
        id: `fail_${Date.now()}_${item.barcode}`,
        barcode: item.barcode,
        productName: item.productName,
        failReason: 'COUPANG_ONLY',
        failDetail: '荑좏뙜 蹂꾨룄 二쇰Ц ?곹뭹?낅땲??',
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
      });
      continue;
    }

    const targetBarcode = item.usingAliasBarcode || item.barcode;
    const isChilled = item.category?.includes('?됰룞') || item.category?.includes('???);
    const folder = isChilled ? 'app3' : 'app1';

    const percent = Math.round(20 + ((i + 1) / items.length) * 75);

    // ???④?(price) 寃곗젙: ?뱀빋 ?꾩넚媛?-> 濡쒖뺄 留덉뒪??罹먯떆 -> ?좎븻誘??ㅼ떆媛?議고쉶 -> ?덉쟾 湲곕낯媛?
    let determinedPrice = Number(item.cost) || Number(item.price) || 0;
    let determinedUnit = 'EA';
    let determinedCs = 'j';

    if (!determinedPrice || determinedPrice <= 0) {
      if (seedMap[targetBarcode] && seedMap[targetBarcode].cost > 0) {
        determinedPrice = seedMap[targetBarcode].cost;
      }
    }

    // ?ъ쟾??媛寃⑹씠 ?놁쑝硫??좎븻誘??ъ씠?몄뿉???ㅼ떆媛??④? 議고쉶
    if (!determinedPrice || determinedPrice <= 0) {
      const liveInfo = await fetchYounmeProductInfo(sessionCookie, folder, targetBarcode, orderDate);
      if (liveInfo && liveInfo.price > 0) {
        determinedPrice = liveInfo.price;
        determinedUnit = liveInfo.unit || 'EA';
        determinedCs = liveInfo.cs || 'j';
      } else {
        // 理쒖쥌 ?덉쟾?④? (?좎븻誘?12留뚯썝 誘몃쭔 ?ㅻ쪟 諛⑹?)
        determinedPrice = 3000;
      }
    }

    if (onProgress) {
      onProgress({
        status: 'ADDING_CART',
        percent,
        message: `[${i + 1}/${items.length}] "${item.productName}" ${item.finalOrderQty}媛?(?④?: ${determinedPrice.toLocaleString()}?? ?대뒗 以?.`,
      });
    }

    try {
      // ??price ?뚮씪誘명꽣???ㅼ젣 怨듦툒?④?瑜??섍꺼 ?좎븻誘??λ컮援щ땲 諛?珥?二쇰Ц湲덉븸???뺤긽 怨꾩궛?섎룄濡???
      const addPath = `/${folder}/orderAdd.asp?order_dev=j&dev=${determinedCs}&order_type=1&pcode=${targetBarcode}&quantity=${item.finalOrderQty}&unit=${determinedUnit}&price=${determinedPrice}&order_date=${orderDate}&valid=y`;

      const addRes = await httpRequest({
        hostname: 'www.younme24.com',
        port: 80,
        path: addPath,
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const location = addRes.headers['location'] || '';
      const bodyStr = iconv.decode(addRes.body, 'EUC-KR');
      const alertMatch = bodyStr.match(/<script>.*?alert\(['"]([^'"]+)['"]\)/i);

      let isSuccess = (addRes.statusCode === 200 || addRes.statusCode === 302) && !location.includes('msg=err');
      let failDetail = `?쒕쾭 ?묐떟: ${addRes.statusCode} (${location || '?ㅻ쪟'})`;
      let failReason = 'HTTP_ERROR';

      if (alertMatch) {
        isSuccess = false;
        failDetail = alertMatch[1];
        failReason = 'OUT_OF_STOCK'; // alert?쇰줈 ?≫엳??嫄?蹂댄넻 ?덉젅/?먮ℓ以묒?/沅뚰븳?ㅻ쪟
      }

      if (isSuccess) {
        successCount++;
      } else {
        failures.push({
          id: `fail_${Date.now()}_${item.barcode}`,
          barcode: item.barcode,
          productName: item.productName,
          failReason: failReason,
          failDetail: failDetail,
          attemptedQty: item.finalOrderQty,
          minOrderQty: item.minOrderQty,
          failedAt: new Date().toLocaleTimeString('ko-KR'),
        });
      }
    } catch (err) {
      failures.push({
        id: `fail_${Date.now()}_${item.barcode}`,
        barcode: item.barcode,
        productName: item.productName,
        failReason: 'SYSTEM_ERROR',
        failDetail: err.message,
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
      });
    }
  }

  return { successCount, failures };
}

module.exports = { runDirectOrderAdd };
