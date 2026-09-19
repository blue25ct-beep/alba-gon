const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    console.log('주류 사이트 접속 중...');
    await page.goto('https://etop.spchain.co.kr:446/order/login.do', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
        const textInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
        const pwInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'password');
        if(textInputs.length > 0) textInputs[0].value = '047458';
        if(pwInputs.length > 0) pwInputs[0].value = '0474581227';
        
        const loginBtn = document.querySelector('button, input[type="submit"], input[type="button"], a[class*="login"], a[id*="login"]');
        if(loginBtn) loginBtn.click();
        else {
            const form = document.querySelector('form');
            if(form) form.submit();
        }
    });

    console.log('로그인 제출 완료. 대기 중...');
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e) {}
    
    console.log('참이슬 검색 중...');
    await page.evaluate(() => {
        const radios = document.querySelectorAll('input[name="termField"]');
        for (const r of radios) {
            if (r.value === '1') r.checked = true; // 상품명
        }
        document.querySelector('input[name="termWord"]').value = '참이슬';
        // searchOk('', 'N') 호출
        searchOk('', 'N');
    });

    try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e) {}

    const html = await page.content();
    fs.writeFileSync('search_results.html', html, 'utf8');
    console.log('검색 결과 저장 완료 (search_results.html)');
    
    await browser.close();
})();
