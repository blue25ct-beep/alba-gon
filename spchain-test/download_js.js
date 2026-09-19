const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://etop.spchain.co.kr:446/order/login.do');
    const js = await page.evaluate(async () => {
        const resp = await fetch('../js/order_main_view.js');
        return await resp.text();
    });
    fs.writeFileSync('order_main_view.js', js, 'utf8');
    await browser.close();
})();
