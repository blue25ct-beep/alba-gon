const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');
const querystring = require('querystring');
const iconv = require('iconv-lite');
const fs = require('fs');
const { reconcileOrders } = require('./orderReconciler');

function getYounmeCredentials(overrideCredentials = null) {
  if (overrideCredentials && overrideCredentials.pw) {
    return {
      userId: overrideCredentials.id || process.env.YOUNME_USER_ID || '1060',
      userPw: overrideCredentials.pw,
    };
  }
  const settingsBackupPath = path.resolve(__dirname, '../settings_backup.json');
  if (fs.existsSync(settingsBackupPath)) {
    try {
      const s = JSON.parse(fs.readFileSync(settingsBackupPath, 'utf8'));
      if (s.younmePw) {
        return {
          userId: s.younmeId || process.env.YOUNME_USER_ID || '1060',
          userPw: s.younmePw,
        };
      }
    } catch (e) {}
  }
  if (process.env.YOUNME_PASSWORD) {
    return {
      userId: process.env.YOUNME_USER_ID || '1060',
      userPw: process.env.YOUNME_PASSWORD,
    };
  }
  // dotenv 로드가 누락된 환경에서도 프로젝트 .env 파일을 직접 읽어 복원
  for (const rel of ['../../.env', '../.env']) {
    try {
      const envPath = path.resolve(__dirname, rel);
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        let id = '1060';
        let pw = '';
        for (const line of lines) {
          const mId = line.match(/^YOUNME_USER_ID=(.+)$/);
          if (mId) id = mId[1].trim();
          const mPw = line.match(/^YOUNME_PASSWORD=(.+)$/);
          if (mPw) pw = mPw[1].trim();
        }
        if (pw) return { userId: id, userPw: pw };
      }
    } catch (e) {}
  }
  return null;
}

let seedMap = {};
try {
  const seedList = require('../../client/src/data/seedProducts.json');
  for (const p of seedList) {
    seedMap[p.barcode] = p;
  }
} catch (e) {}

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
 * 유앤미24 상온(app1) 사이트에서 바코드로 실시간 공식 공급단가(price) 및 단위(unit) 조회
 */
async function fetchYounmeProductInfo(sessionCookie, folder, barcode, orderDate) {
  try {
    const searchPayload = querystring.stringify({
      order_date: orderDate,
      order_dev: folder === 'app3' ? 'h' : 'j',
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

    const html = iconv.decode(res.body, 'EUC-KR');
    const esc = barcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (folder === 'app3') {
      // 저온(app3) check_quantity(product_code,price,count,order_unit,unit,unit_name,cs,order_unit_yn,D_day,valid,product_name)
      const cqRegex = new RegExp(
        `check_quantity\\(['"]${esc}['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"]\\)`
      );
      const m = html.match(cqRegex);
      if (m) {
        return {
          price: parseInt(m[1], 10) || 0,
          orderUnit: m[3] || '1',
          unit: m[4] || 'EA',
          cs: m[6] || 'h',
          orderUnitYn: m[7] || 'y',
          dDay: m[8] || '',
          valid: m[9] || 'y',
          productName: m[10] || '',
        };
      }
    } else {
      const regex = new RegExp(`cart_add\\(['"]${esc}['"],\\s*['"]\\d+['"],\\s*['"]([^'"]*)['"],\\s*['"]([^'"]*)['"],.*?['"]([^'"]*)['"],\\s*['"]([^'"]*)['"]`);
      const match = html.match(regex);
      if (match) {
        return {
          unit: match[1] || 'EA',
          price: parseInt(match[2], 10) || 0,
          cs: match[3] || 'j',
          valid: match[4] || 'y',
        };
      }
    }
  } catch (e) {
    console.warn(`[orderEngine] 단가 실시간 조회 예외 (${barcode}):`, e.message);
  }
  return null;
}

async function runDirectOrderAdd(items, onProgress, overrideCredentials = null) {
  const creds = getYounmeCredentials(overrideCredentials);
  if (!creds || !creds.userPw) {
    throw new Error('유앤미24 비밀번호가 설정되어 있지 않습니다. 사이트 설정(톱니바퀴)에서 유앤미 비밀번호를 입력해주세요.');
  }

  const USER_ID = creds.userId;
  const USER_PW = creds.userPw;

  // 1. 유앤미24 로그인
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

  const rawCookies = loginRes.headers['set-cookie'] || [];
  const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');
  if (!sessionCookie) {
    throw new Error('유앤미24 세션 쿠키 획득 실패. 아이디와 비밀번호를 확인해주세요.');
  }

  // 2. 상온(app1) 발주 일자 확인
  const appRes = await httpRequest({
    hostname: 'www.younme24.com',
    port: 80,
    path: '/app1/app.asp',
    method: 'GET',
    headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' },
  });
  const appHtml = appRes.body.toString('latin1');
  const mDate = appHtml.match(/name=["']order_date["']\s+value=["'](\d+)["']/);
  const orderDate = mDate ? mDate[1] : '20261124';

  // 2-2. 저온(app3) 발주 일자 및 지점코드(branch_code) 확인 + D+1 전날 발주 품목 실시간 조회 (중복 발주 방지)
  let app3OrderDate = orderDate;
  let app3ShipDate1 = orderDate;
  let app3ShipDate2 = orderDate;
  let app3BranchCode = '11524';
  const pendingDPlus1Barcodes = new Set();

  // 로컬 발주이력(order_history_backup.json)에서 전날(어제) 발주된 D+1 품목도 함께 확인
  try {
    const histPath = path.resolve(__dirname, '../order_history_backup.json');
    if (fs.existsSync(histPath)) {
      const histRaw = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      const histList = Array.isArray(histRaw) ? histRaw : (histRaw.history || []);
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yM = yest.getMonth() + 1;
      const yD = yest.getDate();
      const yYear = yest.getFullYear();
      const yIso = `${yYear}-${String(yM).padStart(2, '0')}-${String(yD).padStart(2, '0')}`;

      for (const h of histList) {
        const dStr = String(h.orderDate || '');
        let isYest = dStr.includes(yIso);
        if (!isYest) {
          const m = dStr.match(/(?:(\d{4})\.\s*)?(\d{1,2})\.\s*(\d{1,2})\./);
          if (m) {
            const yr = m[1] ? parseInt(m[1], 10) : yYear;
            if (yr === yYear && parseInt(m[2], 10) === yM && parseInt(m[3], 10) === yD) isYest = true;
          }
        }
        if (isYest && Array.isArray(h.items)) {
          for (const it of h.items) {
            if (it && it.barcode && (it.finalOrderQty === undefined || it.finalOrderQty > 0)) {
              const pName = String(it.productName || (seedMap[it.barcode] && seedMap[it.barcode].name) || '');
              if (pName.toUpperCase().includes('D+1') || (seedMap[it.barcode] && seedMap[it.barcode].isDPlus1)) {
                pendingDPlus1Barcodes.add(it.barcode);
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  try {
    const app3Res = await httpRequest({
      hostname: 'www.younme24.com',
      port: 80,
      path: '/app3/app.asp',
      method: 'GET',
      headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' },
    });
    const app3Html = iconv.decode(app3Res.body, 'EUC-KR');
    const m3Order = app3Html.match(/name=["']order_date["']\s+value=["'](\d{8})["']/);
    const m3Ship1 = app3Html.match(/name=["']ship_date1["']\s+value=["'](\d{8})["']/);
    const m3Ship2 = app3Html.match(/name=["']ship_date2["']\s+value=["'](\d{8})["']/);
    if (m3Order) app3OrderDate = m3Order[1];
    if (m3Ship1) app3ShipDate1 = m3Ship1[1];
    if (m3Ship2) app3ShipDate2 = m3Ship2[1];

    const ov3Res = await httpRequest({
      hostname: 'www.younme24.com',
      port: 80,
      path: `/app3/orderView.asp?order_date=${app3OrderDate}&order_dev=h&order_type=1`,
      method: 'GET',
      headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' },
    });
    const ov3Html = iconv.decode(ov3Res.body, 'EUC-KR');
    const mBranch = ov3Html.match(/["']branch_code["']\s*:\s*["'](\d+)["']/);
    if (mBranch) app3BranchCode = mBranch[1];

    // 유앤미 저온 주문내역(/app3/appList.asp)에서 전날 발주되어 당일/익일 입고 대기 중인 D+1 품목 실시간 조회
    const fmtDate = (d8) => `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
    const addDaysToD8 = (d8, delta) => {
      const dt = new Date(Date.UTC(parseInt(d8.slice(0, 4), 10), parseInt(d8.slice(4, 6), 10) - 1, parseInt(d8.slice(6, 8), 10)));
      dt.setUTCDate(dt.getUTCDate() + delta);
      return dt.toISOString().slice(0, 10);
    };
    const searchStartIso = addDaysToD8(app3OrderDate, -3);
    const targetOrderIso = fmtDate(app3OrderDate);
    const targetShip1Iso = fmtDate(app3ShipDate1);
    const searchEndIso = addDaysToD8(app3ShipDate1, 1);
    const listPayload = querystring.stringify({
      pageno: '1',
      dev: 'b',
      search_date_s: searchStartIso,
      search_date_e: searchEndIso,
      page_line: '300',
    });
    const listRes = await httpRequest({
      hostname: 'www.younme24.com',
      port: 80,
      path: '/app3/appList.asp',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(listPayload),
      },
    }, listPayload);
    const listHtml = iconv.decode(listRes.body, 'EUC-KR');
    const trParts = listHtml.split(/<tr[\s>]/i);
    for (const part of trParts) {
      const trInner = part.split(/<\/tr>/i)[0] || '';
      const cells = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trInner)) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim());
      }
      if (cells.length >= 7 && /^\d+$/.test(cells[0])) {
        const pNameCell = cells[1] || '';
        const bCodeCell = cells[2] || '';
        const shipDateCell = cells[6] || '';
        const statusCell = cells[7] || '';
        if (statusCell.includes('반품') || statusCell.includes('취소')) continue;
        const isD1 = pNameCell.toUpperCase().includes('D+1') || (seedMap[bCodeCell] && seedMap[bCodeCell].isDPlus1);
        if (bCodeCell && isD1 && (shipDateCell === targetOrderIso || shipDateCell === targetShip1Iso)) {
          pendingDPlus1Barcodes.add(bCodeCell);
        }
      }
    }
    if (pendingDPlus1Barcodes.size > 0) {
      console.log(`[orderEngine] ⏳ 전날 발주 완료된 D+1(익일배송) 중복방지 제외 대상:`, Array.from(pendingDPlus1Barcodes));
    }
  } catch (e) {}

  let successCount = 0;
  const failures = [];
  const app1Requested = [];
  const app3Requested = [];

  // 3. 품목 순회하며 상온(app1) 또는 저온(app3) 장바구니 추가
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.productName && (item.productName.includes('쿠팡]') || item.productName.startsWith('CP]'))) {
      failures.push({
        id: `fail_${Date.now()}_${item.barcode}`,
        barcode: item.barcode,
        productName: item.productName,
        failReason: 'COUPANG_ONLY',
        failDetail: '쿠팡 별도 주문 상품입니다.',
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
      });
      continue;
    }

    const targetBarcode = item.usingAliasBarcode || item.barcode;
    const masterCategory = (seedMap[targetBarcode] && seedMap[targetBarcode].category) || item.category || '';
    const isChilled = item.vendor === 'chilled' || masterCategory.includes('냉동') || masterCategory.includes('저온') || masterCategory.includes('냉장');
    let folder = isChilled ? 'app3' : 'app1';

    // 만약 저온(app3)으로 분류되었더라도 실제 유앤미 상온(app1) 상품인지 먼저 확인하여 오분류 누락 차단
    if (folder === 'app3' && item.vendor !== 'chilled') {
      const app1Check = await fetchYounmeProductInfo(sessionCookie, 'app1', targetBarcode, orderDate);
      if (app1Check && app1Check.price > 0) folder = 'app1';
    }

    const percent = Math.round(20 + ((i + 1) / items.length) * 75);

    if (folder === 'app3') {
      app3Requested.push({
        barcode: targetBarcode,
        productName: item.productName || (seedMap[targetBarcode] && seedMap[targetBarcode].name) || targetBarcode,
        expectedQty: item.finalOrderQty,
      });
      // ★ 유앤미 저온(app3) 전용 장바구니 담기 (POST /app3/apiOrder.asp, order_dev=h)
      try {
        const live3 = await fetchYounmeProductInfo(sessionCookie, 'app3', targetBarcode, app3OrderDate);
        if (!live3) {
          failures.push({
            id: `fail_${Date.now()}_${item.barcode}`,
            barcode: item.barcode,
            productName: item.productName,
            failReason: 'NOT_FOUND',
            failDetail: '유앤미24 저온(app3) 상품 목록에서 검색되지 않습니다.',
            attemptedQty: item.finalOrderQty,
            minOrderQty: item.minOrderQty,
            failedAt: new Date().toLocaleTimeString('ko-KR'),
          });
          continue;
        }
        if (live3.valid === '1') {
          failures.push({
            id: `fail_${Date.now()}_${item.barcode}`,
            barcode: item.barcode,
            productName: item.productName,
            failReason: 'OUT_OF_STOCK',
            failDetail: '선택하신 저온 상품은 품절되었습니다.',
            attemptedQty: item.finalOrderQty,
            minOrderQty: item.minOrderQty,
            failedAt: new Date().toLocaleTimeString('ko-KR'),
          });
          continue;
        }
        if (live3.valid === 'd') {
          failures.push({
            id: `fail_${Date.now()}_${item.barcode}`,
            barcode: item.barcode,
            productName: item.productName,
            failReason: 'OTHER',
            failDetail: '해당 요일에 배송이 없는 저온 상품입니다.',
            attemptedQty: item.finalOrderQty,
            minOrderQty: item.minOrderQty,
            failedAt: new Date().toLocaleTimeString('ko-KR'),
          });
          continue;
        }

        const determinedPrice = live3.price || Number(item.cost) || (seedMap[targetBarcode] && seedMap[targetBarcode].cost) || 1500;
        const shipDate = live3.dDay === '1' ? app3ShipDate1 : (live3.dDay === '2' ? app3ShipDate2 : app3OrderDate);
        const pName = live3.productName || item.productName;
        const isDPlus1Item = Boolean(
          live3.dDay === '1' ||
          live3.dDay === '2' ||
          pName.toUpperCase().includes('D+1') ||
          (item.productName && item.productName.toUpperCase().includes('D+1')) ||
          (seedMap[targetBarcode] && seedMap[targetBarcode].isDPlus1)
        );

        // ★ D+1(하루 뒤 배송) 상품이 전날 발주되어 입고 대기 중인 경우 오늘 발주에서 자동 제외
        if (isDPlus1Item && !item.forceOrderDPlus1 && (pendingDPlus1Barcodes.has(targetBarcode) || pendingDPlus1Barcodes.has(item.barcode))) {
          failures.push({
            id: `fail_${Date.now()}_${item.barcode}`,
            barcode: item.barcode,
            productName: pName,
            failReason: 'D_PLUS_1_PENDING',
            failDetail: '⏳ D+1(하루 뒤 배송) 상품으로 전날 발주분이 입고 대기 중이어서 오늘 발주에서 자동 제외되었습니다.',
            attemptedQty: item.finalOrderQty,
            minOrderQty: item.minOrderQty,
            failedAt: new Date().toLocaleTimeString('ko-KR'),
          });
          continue;
        }

        if (onProgress) {
          onProgress({
            status: 'ADDING_CART',
            percent,
            message: `[${i + 1}/${items.length}] ❄️ 저온 "${pName}" ${item.finalOrderQty}개 (단가: ${determinedPrice.toLocaleString()}원) 담는 중..`,
          });
        }

        const apiPayload = querystring.stringify({
          operation: 'cartAdd',
          userid: '',
          branch_code: app3BranchCode,
          order_dev: 'h',
          order_type: '1',
          order_date: app3OrderDate,
          ship_date: shipDate,
          dev: live3.cs || 'h',
          pCode: targetBarcode,
          quantity: String(item.finalOrderQty),
          unit: live3.unit || 'EA',
          order_unit: live3.orderUnit || '1',
          order_unit_yn: live3.orderUnitYn || 'y',
          price: String(determinedPrice),
          pName: escape(pName),
        });

        const add3Res = await httpRequest({
          hostname: 'www.younme24.com',
          port: 80,
          path: '/app3/apiOrder.asp',
          method: 'POST',
          headers: {
            'Cookie': sessionCookie,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': Buffer.byteLength(apiPayload),
            'User-Agent': 'Mozilla/5.0',
          },
        }, apiPayload);

        const resStr = iconv.decode(add3Res.body, 'EUC-KR');
        let isOk = false;
        try {
          const parsed = JSON.parse(resStr);
          if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].result === 'y' || parsed[0].result === 'u')) {
            isOk = true;
          }
        } catch (e) {
          if (resStr.includes('"result":"y"') || resStr.includes('"result":"u"')) isOk = true;
        }

        if (isOk) {
          successCount++;
        } else {
          failures.push({
            id: `fail_${Date.now()}_${item.barcode}`,
            barcode: item.barcode,
            productName: item.productName,
            failReason: 'OTHER',
            failDetail: `저온 장바구니 응답 오류: ${resStr.slice(0, 100)}`,
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
      continue;
    }

    // ★ 상온(app1) 장바구니 추가
    app1Requested.push({
      barcode: targetBarcode,
      productName: item.productName || (seedMap[targetBarcode] && seedMap[targetBarcode].name) || targetBarcode,
      expectedQty: item.finalOrderQty,
    });
    let determinedPrice = Number(item.cost) || Number(item.price) || 0;
    let determinedUnit = 'EA';
    let determinedCs = 'j';

    if (!determinedPrice || determinedPrice <= 0) {
      if (seedMap[targetBarcode] && seedMap[targetBarcode].cost > 0) {
        determinedPrice = seedMap[targetBarcode].cost;
      }
    }

    if (!determinedPrice || determinedPrice <= 0) {
      const liveInfo = await fetchYounmeProductInfo(sessionCookie, 'app1', targetBarcode, orderDate);
      if (liveInfo && liveInfo.price > 0) {
        determinedPrice = liveInfo.price;
        determinedUnit = liveInfo.unit || 'EA';
        determinedCs = liveInfo.cs || 'j';
      } else {
        determinedPrice = 3000;
      }
    }

    if (onProgress) {
      onProgress({
        status: 'ADDING_CART',
        percent,
        message: `[${i + 1}/${items.length}] "${item.productName}" ${item.finalOrderQty}개 (단가: ${determinedPrice.toLocaleString()}원) 담는 중..`,
      });
    }

    try {
      const escapedName = escape(item.productName.replace(/\+/g, '***'));
      const addPath = `/app1/orderAdd.asp?order_dev=j&dev=${determinedCs}&order_type=1&pcode=${targetBarcode}&quantity=${item.finalOrderQty}&unit=${determinedUnit}&price=${determinedPrice}&order_date=${orderDate}&product_name=${escapedName}&valid=y`;

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
      const alertMatch = bodyStr.match(/<script[^>]*>[\s\S]*?alert\(['"]([^'"]+)['"]\)/i);

      let isSuccess = (addRes.statusCode === 200 || addRes.statusCode === 302) && !location.includes('msg=err');
      let failDetail = `서버 응답: ${addRes.statusCode} (${location || '오류'})`;
      let failReason = 'HTTP_ERROR';

      if (alertMatch) {
        isSuccess = false;
        failDetail = alertMatch[1];
        failReason = 'OUT_OF_STOCK';
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

  // 4. 발주 직후 유앤미 실제 장바구니 재조회 및 교차검증
  const verification = {};
  try {
    if (onProgress) {
      onProgress({ step: 'VERIFYING', percent: 97, message: '유앤미24 실제 장바구니와 발주 리스트를 교차검증하는 중...' });
    }
    if (app1Requested.length > 0) {
      const actualApp1 = await fetchYounmeCartItems(sessionCookie, 'app1', orderDate);
      verification.app1 = reconcileOrders(app1Requested, actualApp1, { unitLabel: '개' });
    }
    if (app3Requested.length > 0) {
      const actualApp3 = await fetchYounmeCartItems(sessionCookie, 'app3', app3OrderDate);
      verification.app3 = reconcileOrders(app3Requested, actualApp3, { unitLabel: '개' });
    }
  } catch (verifyErr) {
    console.error('[교차검증 오류 - 유앤미]:', verifyErr.message);
  }

  return { successCount, failures, verification };
}

function parseYounmeCartHtml(html) {
  const items = [];
  const rows = html.split(/<tr[\s>]/i).slice(1).map(p => p.split(/<\/tr>/i)[0]);
  for (const r of rows) {
    const mCode = r.match(/data_view\(['"](\d{8,14})['"]\)/) || r.match(/cart_arrange\(['"](\d{8,14})['"]/);
    if (!mCode) continue;
    const barcode = mCode[1];
    const mName = r.match(/data_view\(['"]\d+['"]\)[^>]*>([\s\S]*?)<\/a>/i);
    let name = mName ? mName[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim() : '';
    if (!name || /^EA$/i.test(name)) {
      name = (seedMap[barcode] && seedMap[barcode].name) || barcode;
    }
    const mQty = r.match(/<option[^>]+value=["']?(\d+)["']?[^>]*selected/i);
    const qty = mQty ? parseInt(mQty[1], 10) : 1;
    items.push({ barcode, name, qty });
  }
  return items;
}

function parseYounmeAppListHtml(html) {
  const items = [];
  const rows = html.split(/<tr[\s>]/i).slice(1).map(p => p.split(/<\/tr>/i)[0]);
  for (const r of rows) {
    const tds = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
      m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
    );
    const bcIdx = tds.findIndex(t => /^\d{8,14}$/.test(t));
    if (bcIdx === -1) continue;
    const rowText = tds.join(' ');
    if (rowText.includes('취소') || rowText.includes('반품') || rowText.includes('마감')) continue;
    if (!rowText.includes('신청')) continue;
    const barcode = tds[bcIdx];
    let name = (tds[bcIdx - 1] || '').replace(/\s+EA$/i, '').trim();
    if (!name || /^EA$/i.test(name)) {
      name = (seedMap[barcode] && seedMap[barcode].name) || barcode;
    }
    const qty = parseInt((tds[bcIdx + 2] || '1').replace(/[^0-9]/g, ''), 10) || 1;
    items.push({ barcode, name, qty });
  }
  return items;
}

async function fetchYounmeCartItems(sessionCookie, folder, orderDate) {
  const dev = folder === 'app3' ? 'h' : 'j';
  const ovRes = await httpRequest({
    hostname: 'www.younme24.com',
    port: 80,
    path: `/${folder}/orderView.asp?order_date=${orderDate}&order_dev=${dev}&order_type=1`,
    method: 'GET',
    headers: { Cookie: sessionCookie, 'User-Agent': 'Mozilla/5.0' },
  });
  const cartItems = parseYounmeCartHtml(iconv.decode(ovRes.body, 'EUC-KR'));
  // 장바구니가 비어 있거나 이미 확정(주문신청)된 경우도 포함해 합산
  const iso = `${orderDate.slice(0, 4)}-${orderDate.slice(4, 6)}-${orderDate.slice(6, 8)}`;
  const lb = querystring.stringify({ search_date1: iso, search_date2: iso, s_type: '1' });
  const lRes = await httpRequest({
    hostname: 'www.younme24.com',
    port: 80,
    path: `/${folder}/appList.asp`,
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(lb),
      'User-Agent': 'Mozilla/5.0',
    },
  }, lb);
  const confirmedItems = parseYounmeAppListHtml(iconv.decode(lRes.body, 'EUC-KR'));
  return [...cartItems, ...confirmedItems];
}

async function fetchYounmeSiteSnapshot(overrideCredentials = null) {
  const creds = getYounmeCredentials(overrideCredentials);
  if (!creds || !creds.userPw) {
    throw new Error('유앤미24 로그인 정보가 없습니다.');
  }
  const loginPayload = querystring.stringify({ home: 'y', userid: creds.userId, passwd: creds.userPw });
  const loginRes = await httpRequest({
    hostname: 'www.younme24.com', port: 80, path: '/member/login.asp', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(loginPayload), 'User-Agent': 'Mozilla/5.0' },
  }, loginPayload);
  const sessionCookie = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  if (!sessionCookie) throw new Error('유앤미24 로그인 실패');

  const out = {};
  for (const folder of ['app1', 'app3']) {
    const appRes = await httpRequest({ hostname: 'www.younme24.com', port: 80, path: `/${folder}/app.asp`, method: 'GET', headers: { Cookie: sessionCookie } });
    const mOrder = iconv.decode(appRes.body, 'EUC-KR').match(/name=["']order_date["']\s+value=["'](\d{8})["']/);
    const orderDate = mOrder ? mOrder[1] : new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    out[folder] = {
      orderDate,
      items: await fetchYounmeCartItems(sessionCookie, folder, orderDate),
    };
  }
  return out;
}

async function fetchPendingDPlus1Barcodes(overrideCredentials = null) {
  const pendingSet = new Set();
  const details = [];
  try {
    const creds = getYounmeCredentials(overrideCredentials);
    if (!creds || !creds.userPw) return { barcodes: [], details: [] };
    const loginPayload = querystring.stringify({ home: 'y', userid: creds.userId, passwd: creds.userPw });
    const loginRes = await httpRequest({
      hostname: 'www.younme24.com', port: 80, path: '/member/login.asp', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(loginPayload) }
    }, loginPayload);
    const rawCookies = loginRes.headers['set-cookie'] || [];
    const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');
    if (!sessionCookie) return { barcodes: [], details: [] };

    const app3Res = await httpRequest({
      hostname: 'www.younme24.com', port: 80, path: '/app3/app.asp', method: 'GET',
      headers: { 'Cookie': sessionCookie },
    });
    const app3Html = iconv.decode(app3Res.body, 'EUC-KR');
    const m3Order = app3Html.match(/name=["']order_date["']\s+value=["'](\d{8})["']/);
    const m3Ship1 = app3Html.match(/name=["']ship_date1["']\s+value=["'](\d{8})["']/);
    const app3OrderDate = m3Order ? m3Order[1] : '20261124';
    const app3ShipDate1 = m3Ship1 ? m3Ship1[1] : app3OrderDate;

    const fmtDate = (d8) => `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
    const addDaysToD8 = (d8, delta) => {
      const dt = new Date(Date.UTC(parseInt(d8.slice(0, 4), 10), parseInt(d8.slice(4, 6), 10) - 1, parseInt(d8.slice(6, 8), 10)));
      dt.setUTCDate(dt.getUTCDate() + delta);
      return dt.toISOString().slice(0, 10);
    };
    const searchStartIso = addDaysToD8(app3OrderDate, -3);
    const targetOrderIso = fmtDate(app3OrderDate);
    const targetShip1Iso = fmtDate(app3ShipDate1);
    const searchEndIso = addDaysToD8(app3ShipDate1, 1);
    const listPayload = querystring.stringify({
      pageno: '1', dev: 'b', search_date_s: searchStartIso, search_date_e: searchEndIso, page_line: '300'
    });
    const listRes = await httpRequest({
      hostname: 'www.younme24.com', port: 80, path: '/app3/appList.asp', method: 'POST',
      headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(listPayload) },
    }, listPayload);
    const listHtml = iconv.decode(listRes.body, 'EUC-KR');
    // 각 행을 <tr 로 분할하여 파싱 (중첩 테이블 영향 차단)
    const trParts = listHtml.split(/<tr[\s>]/i);
    for (const part of trParts) {
      const trInner = part.split(/<\/tr>/i)[0] || '';
      const cells = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trInner)) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim());
      }
      // cells: [순번, 제품명, 바코드, 단가, 수량, 합계, 배송일자, 비고]
      if (cells.length >= 7 && /^\d+$/.test(cells[0])) {
        const pNameCell = cells[1] || '';
        const bCodeCell = cells[2] || '';
        const qtyCell = parseInt((cells[4] || '1').replace(/,/g, ''), 10) || 1;
        const shipDateCell = cells[6] || '';
        const statusCell = cells[7] || '';
        if (statusCell.includes('반품') || statusCell.includes('취소')) continue;
        const isD1 = pNameCell.toUpperCase().includes('D+1') || (seedMap[bCodeCell] && seedMap[bCodeCell].isDPlus1);
        if (bCodeCell && isD1 && (shipDateCell === targetOrderIso || shipDateCell === targetShip1Iso)) {
          pendingSet.add(bCodeCell);
          details.push({ barcode: bCodeCell, productName: pNameCell.replace(/\s+EA$/i, ''), qty: qtyCell, shipDate: shipDateCell });
        }
      }
    }
  } catch (e) {}
  return { barcodes: Array.from(pendingSet), details };
}

module.exports = { runDirectOrderAdd, fetchPendingDPlus1Barcodes, fetchYounmeSiteSnapshot };
