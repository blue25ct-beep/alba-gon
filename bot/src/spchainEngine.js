require('dotenv').config();
const mqtt = require('mqtt');
const puppeteer = require('puppeteer');

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
        browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
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
            
            const found = await page.evaluate((qty) => {
                const qtyInput = document.querySelector('input[name="rcv_qty_2_1"]');
                if (qtyInput) {
                    qtyInput.value = qty;
                    const saveBtn = document.querySelector('img[onclick*="saveOk"]');
                    if (saveBtn) { saveBtn.click(); return true; }
                }
                return false;
            }, Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))));

            if (found) {
                let box = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))); console.log(`[SPChain] ${item.productName} - ${box}박스 (${item.finalOrderQty}병) 저장 완료`);
                page.on('dialog', async dialog => { await dialog.accept(); });
                try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                results.push({ barcode: item.barcode, status: 'success' });
            } else {
                console.log(`[SPChain] ${item.productName} - 바코드(${item.barcode}) 검색 실패`);
                
                await page.evaluate((name) => {
                    const radios = document.querySelectorAll('input[name="termField"]');
                    for (const r of radios) { if (r.value === '1') r.checked = true; }
                    const wordInput = document.querySelector('input[name="termWord"]');
                    if(wordInput) wordInput.value = name;
                    if (typeof searchOk === 'function') searchOk('', 'N');
                }, item.productName);

                try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                
                const foundAgain = await page.evaluate((qty) => {
                    const qtyInput = document.querySelector('input[name="rcv_qty_2_1"]');
                    if (qtyInput) {
                        qtyInput.value = qty;
                        const saveBtn = document.querySelector('img[onclick*="saveOk"]');
                        if (saveBtn) { saveBtn.click(); return true; }
                    }
                    return false;
                }, Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))));

                if(foundAgain) {
                    console.log(`[SPChain] ${item.productName} - 상품명 검색으로 저장됨`);
                    try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                    results.push({ barcode: item.barcode, status: 'success' });
                } else {
                    results.push({ barcode: item.barcode, status: 'fail' });
                }
            }
        }
    } catch (err) {
        console.error('[SPChain] 주문 에러:', err);
        return { success: false, reason: err.message, results };
    } finally {
        if (browser) { await browser.close(); browser = null; }
        isProcessing = false;
    }
    const failures = results.filter(r => r.status === 'fail').map(r => ({ barcode: r.barcode, reason: 'SPChain 상품 검색 실패' }));
    return { successCount: results.length - failures.length, failures };
}

module.exports = { runSpchainOrder };
