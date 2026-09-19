const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    console.log('주류 사이트 접속 중...');
    await page.goto('https://etop.spchain.co.kr:446/order/login.do', { waitUntil: 'networkidle2' });
    
    console.log('로그인 입력 중...');
    
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const textInputs = inputs.filter(i => i.type === 'text');
        const pwInputs = inputs.filter(i => i.type === 'password');
        if(textInputs.length > 0) textInputs[0].value = '047458';
        if(pwInputs.length > 0) pwInputs[0].value = '0474581227';
        
        // Find a login button or form submit
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
    } catch (e) {
        console.log('Navigation timeout or already loaded');
    }
    
    const html = await page.content();
    fs.writeFileSync('page_source.html', html, 'utf8');
    console.log('페이지 소스 저장 완료 (page_source.html)');
    
    await browser.close();
})();
