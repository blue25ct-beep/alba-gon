require('dotenv').config();
const mqtt = require('mqtt');
const puppeteer = require('puppeteer');
const { reconcileOrders } = require('./orderReconciler');

// 테스트용 하드코딩
const STORE_ID = 'SPCHAIN_047458'; 
const TOPIC_REQ = `albagom/orders/store_${STORE_ID}/request`;
const TOPIC_RES = `albagom/orders/store_${STORE_ID}/response`;

// SPChain 자격증명
const SP_ID = '047458';
const SP_PW = '0474581227';

let isProcessing = false;
let browser = null;

async function runSpchainOrder(orderPayload, sendProgress) {
    if (isProcessing) return { success: false, reason: 'Already processing an order' };
    isProcessing = true;
    
    console.log('[SPChain] 주문 처리 시작:', orderPayload.items.length, '개 품목');
    if (sendProgress) sendProgress('LOGGING_IN', 20, '생필체인 시스템에 로그인하는 중입니다...');
    const results = [];
    
    try {
        browser = await puppeteer.launch({ headless: false, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ['--no-sandbox'] });
        const page = await browser.newPage();
    page.on('dialog', async dialog => {
        try {
            await dialog.accept();
        } catch (e) {
            // Ignore already handled dialogs
        }
    });
        
        console.log('[SPChain] 로그인 중...');
        await page.goto('https://etop.spchain.co.kr:446/order/login.do', { waitUntil: 'networkidle2' });
        
        await page.evaluate((id, pw) => {
            const textInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
            const pwInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'password');
            if(textInputs.length > 0) textInputs[0].value = id;
            if(pwInputs.length > 0) pwInputs[0].value = pw;
            
            const loginBtn = document.querySelector('button, input[type="submit"], input[type="button"], a[class*="login"], a[id*="login"]');
            if(loginBtn) loginBtn.click();
            else {
                const form = document.querySelector('form');
                if(form) form.submit();
            }
        }, SP_ID, SP_PW);

        try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
        console.log('[SPChain] 메인 화면 진입 성공');

        for (const item of orderPayload.items) {
            console.log(`[SPChain] 품목 검색 중: ${item.productName} (${item.barcode})`);
            
            await page.evaluate((barcode) => {
                const radios = document.querySelectorAll('input[name="termField"]');
                for (const r of radios) { if (r.value === '3') r.checked = true; }
                const wordInput = document.querySelector('input[name="termWord"]');
                if(wordInput) wordInput.value = barcode;
                if (typeof searchOk === 'function') searchOk('', 'N');
            }, item.barcode);

            try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
            
            const found = await page.evaluate(({qty, barcode, name}) => {
                const qtyInput = document.querySelector('input[name="rcv_qty_2_1"]');
                if (qtyInput) {
                    // 검증: 바코드 검색 실패 시 나오는 기본 리스트의 첫 항목을 잘못 주문하는 것을 방지
                    const tr = qtyInput.closest('tr');
                    if (tr) {
                        const trText = tr.innerText.replace(/\s+/g, '');
                        // 이름에서 2글자 이상의 핵심 단어들 추출 (예: '테라', '아사히', '참이슬')
                        const words = name.replace(/[()[\]\-_]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
                        const matchesBarcode = trText.includes(barcode);
                        const matchesName = words.some(w => trText.includes(w));
                        if (!matchesBarcode && !matchesName) {
                            return false; // 불일치 (검색 실패 후 엉뚱한 리스트 노출됨)
                        }
                    }
                    
                    qtyInput.value = qty;
                    const saveBtn = document.querySelector('img[onclick*="saveOk"]');
                    if (saveBtn) { saveBtn.click(); return true; }
                }
                return false;
            }, { qty: Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))), barcode: item.barcode, name: item.productName });

            if (found) {
                let box = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))); console.log(`[SPChain] ${item.productName} - ${box}박스 (${item.finalOrderQty}병) 저장 완료`);
                
                try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                results.push({ barcode: item.barcode, status: 'success' });
            } else {
                console.log(`[SPChain] ${item.productName} - 바코드(${item.barcode}) 검색 실패 및 검증 실패 (오주문 방지)`);
                // 이름 검색(fallback)은 잘못된 상품 주문 위험이 커서 완전히 제거함
                results.push({ barcode: item.barcode, status: 'fail' });
            }
        }
        // 발주 루프 완료 직후 실제 생필체인 주문현황(OrderMainView.do?flag=total) 교차검증
        let verification = null;
        try {
            if (sendProgress) sendProgress('VERIFYING', 95, '생필체인 실제 주문 내역과 교차검증 중...');
            const actualSpItems = await readSpchainOrderItems(page);
            const spRequested = orderPayload.items.map(item => {
                const boxQty = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1)));
                return {
                    barcode: item.barcode,
                    productName: item.productName,
                    expectedQty: boxQty,
                    unitLabel: '박스',
                    subDetail: `${item.finalOrderQty}병`,
                };
            });
            verification = reconcileOrders(spRequested, actualSpItems, { unitLabel: '박스' });
        } catch (verifyErr) {
            console.error('[SPChain 교차검증 오류]:', verifyErr.message);
        }
        const failures = results.filter(r => r.status === 'fail').map(r => ({ barcode: r.barcode, reason: 'SPChain 상품 검색 실패' }));
        return { successCount: results.length - failures.length, failures, verification };
    } catch (err) {
        console.error('[SPChain] 주문 에러:', err);
        return { success: false, reason: err.message, results };
    } finally {
        if (browser) { await browser.close(); browser = null; }
        isProcessing = false;
    }
}

async function readSpchainOrderItems(page) {
    await page.goto('https://etop.spchain.co.kr:446/order/OrderMainView.do?flag=total', { waitUntil: 'networkidle2' });
    return await page.evaluate(() => {
        const out = [];
        for (const tr of document.querySelectorAll('tr')) {
            const codeEl = tr.querySelector('input[name="item_code"]');
            const nameEl = tr.querySelector('input[name="item_name"]');
            const qtyEl = tr.querySelector('input[name="rcv_qty_2_1"]');
            const boxEl = tr.querySelector('input[name="qty_per_box_1"]');
            if (codeEl && qtyEl) {
                const boxQty = parseInt(qtyEl.value, 10) || 0;
                if (boxQty > 0) {
                    out.push({
                        barcode: codeEl.value.trim(),
                        name: (nameEl ? nameEl.value : '').trim(),
                        qty: boxQty,
                        qtyPerBox: parseInt(boxEl ? boxEl.value : '1', 10) || 1,
                    });
                }
            }
        }
        return out;
    });
}

async function fetchSpchainSiteSnapshot() {
    let b = null;
    try {
        b = await puppeteer.launch({
            headless: 'new',
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args: ['--no-sandbox']
        });
        const page = await b.newPage();
        page.on('dialog', async d => { try { await d.accept(); } catch (e) {} });
        await page.goto('https://etop.spchain.co.kr:446/order/login.do', { waitUntil: 'networkidle2' });
        await page.evaluate((id, pw) => {
            const textInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
            const pwInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'password');
            if (textInputs.length > 0) textInputs[0].value = id;
            if (pwInputs.length > 0) pwInputs[0].value = pw;
            const loginBtn = document.querySelector('button, input[type="submit"], input[type="button"], a[class*="login"], a[id*="login"]');
            if (loginBtn) loginBtn.click();
            else {
                const form = document.querySelector('form');
                if (form) form.submit();
            }
        }, SP_ID, SP_PW);
        try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
        return await readSpchainOrderItems(page);
    } finally {
        if (b) await b.close();
    }
}

module.exports = { runSpchainOrder, fetchSpchainSiteSnapshot };
