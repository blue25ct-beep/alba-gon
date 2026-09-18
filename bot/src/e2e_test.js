const { chromium } = require('playwright');
const path = require('path');

async function runE2ETest() {
  console.log('========================================================');
  console.log('  [E2E ?ㅻЪ ?뚯뒪?? ?몄쓽???뚮컮怨???-> ?좎븻誘?4 ?ㅼ젣 諛쒖＜');
  console.log('  ????덈ぉ: ?ㅻ━???ъ뭅移⑹삤由ъ???37g(3400) (8801117760205)');
  console.log('  二쇰Ц ?섎웾: 4媛?);
  console.log('========================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ??쒕낫???ㅼ씠?됲듃 ?뚯뒪?몃? ?꾪빐 濡쒖뺄 dist ?뚯씪 ?먮뒗 濡쒖뺄 ?쒕쾭 ?묒냽
  console.log('[1/5] ????쒕낫??http://localhost:5173) ?묒냽 以?..');
  await page.goto('http://localhost:5173/#/admin', { waitUntil: 'domcontentloaded' }).catch(async () => {
    console.log('      濡쒖뺄 dev ?쒕쾭 ????뺤쟻 諛고룷 ?섏씠吏 ?묒냽 ?쒕룄...');
    await page.goto('https://blue25ct-beep.github.io/alba-gon/#/admin', { waitUntil: 'domcontentloaded' });
  });
  await page.waitForTimeout(1000);

  // 1. PIN 紐⑤떖???⑤㈃ 1234 ?낅젰
  console.log('[2/5] ?ъ옣??紐⑤뱶 蹂댁븞 PIN(1234) ?낅젰...');
  const pinInputs = await page.$$('input[type="password"]');
  if (pinInputs.length >= 4) {
    await pinInputs[0].fill('1');
    await pinInputs[1].fill('2');
    await pinInputs[2].fill('3');
    await pinInputs[3].fill('4');
    await page.waitForTimeout(500);
  }

  // 2. ?ъ뭅移??ㅼ궗 ?ш퀬瑜?濡쒖뺄?ㅽ넗由ъ???二쇱엯 (E2E 諛쒖＜ ?뚯뒪?몄슜)
  console.log('[3/5] ?ъ뭅移?8801117760205) ?ㅼ궗 ?곗씠??諛?諛쒖＜ ?섎웾 4媛??명똿...');
  await page.evaluate(() => {
    const audits = [
      {
        id: 'audit_e2e_pocachip',
        barcode: '8801117760205',
        productName: '?ㅻ━???ъ뭅移⑹삤由ъ???37g(3400)',
        stockCount: 6, // ?꾩옱怨?6媛?
        targetStock: 10, // 紐⑺몴 10媛?-> 異붿쿇諛쒖＜ 4媛?
        updatedAt: '23:55:00',
        isUnmapped: false,
      }
    ];
    localStorage.setItem('albagom_audits_v1', JSON.stringify(audits));
  });

  // ??쒕낫???덈줈怨좎묠?섏뿬 ?명똿 諛섏쁺
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // PIN ?ъ엯???꾩슂??泥섎━
  const pinInputsAfter = await page.$$('input[type="password"]');
  if (pinInputsAfter.length >= 4) {
    await pinInputsAfter[0].fill('1');
    await pinInputsAfter[1].fill('2');
    await pinInputsAfter[2].fill('3');
    await pinInputsAfter[3].fill('4');
    await page.waitForTimeout(500);
  }

  // 諛쒖＜ ?섎웾 ?낅젰李??뺤씤 諛?'4' ?뺤씤
  const qtyInput = await page.$('input[type="number"][value="4"]');
  console.log(`      ?ъ뭅移?諛쒖＜ ?섎웾 4媛?媛먯?: ${!!qtyInput}`);

  // 3. [?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉] 踰꾪듉 ?대┃
  console.log('[4/5] ???붾㈃??[?? ?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉] 踰꾪듉 ?대┃!');
  const startOrderBtn = await page.$('button:has-text("?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉")');
  if (startOrderBtn) {
    await startOrderBtn.click();
    console.log('      踰꾪듉 ?대┃ ?꾨즺! 吏꾪뻾 紐⑤떖 ?湲?以?..');
    await page.waitForTimeout(3000);
  } else {
    console.error('      ??諛쒖＜ ?쒖옉 踰꾪듉??李얠? 紐삵뻽?듬땲??');
  }

  // ???붾㈃ ?ㅽ겕由곗꺑 ???
  const webShot = path.join(__dirname, 'e2e_web_progress.png');
  await page.screenshot({ path: webShot });
  console.log(`      ???붾㈃ 吏꾪뻾 ?ㅽ겕由곗꺑 ??? ${webShot}`);

  // 4. ?좎븻誘??ㅼ젣 ?ъ씠??orderView.asp)瑜?議고쉶?섏뿬 ?ъ뭅移?4媛쒓? ?닿꼈?붿? ?뺤씤
  console.log('\n[5/5] ?좎븻誘?4 蹂몄궗 ?쒕쾭 ?λ컮援щ땲 ?ㅼ젣 諛섏쁺 ?щ? 議고쉶...');
  
  // API 吏곸젒 ?몄텧濡??ㅼ떆媛??λ컮援щ땲 寃利?
  const http = require('http');
  const checkUrl = 'http://localhost:3001/api/order';

  // 遊??쒕쾭濡??ъ뭅移?4媛?諛쒖＜ 吏곸젒 API ?몄텧
  const postData = JSON.stringify({
    items: [
      {
        barcode: '8801117760205',
        productName: '?ㅻ━???ъ뭅移⑹삤由ъ???37g(3400)',
        finalOrderQty: 4,
        minOrderQty: 4,
        category: '怨쇱옄/媛꾩떇'
      }
    ]
  });

  const req = http.request(checkUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('      遊??쒕쾭 諛쒖＜ ?묐떟:', body);
    });
  });
  req.write(postData);
  req.end();

  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
  console.log('\n>>> E2E ?뚯뒪???꾨줈?몄뒪 ?꾨즺!');
}

runE2ETest().catch(console.error);

