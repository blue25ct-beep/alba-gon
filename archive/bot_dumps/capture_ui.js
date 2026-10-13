const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to local site...');
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);

    console.log('Clicking Admin switch button...');
    await page.getByRole('button', { name: /관리/ }).click();
    await page.waitForTimeout(1000);

    console.log('Entering Manager PIN...');
    // PinModal usually has an input with type="password" or placeholder="PIN 번호 입력"
    await page.fill('input[type="password"]', '1234');
    await page.getByRole('button', { name: '확인' }).click();
    await page.waitForTimeout(2000);

    console.log('Taking screenshot of Admin Dashboard...');
    const outDir = 'C:/Users/김진곤/.gemini/antigravity/brain/2b51445d-37e1-40fd-bacd-4387852181f3';
    await page.screenshot({ path: path.join(outDir, 'admin_dashboard.png') });

    console.log('Clicking Worker Management button...');
    await page.getByRole('button', { name: /근무자 관리/ }).click();
    await page.waitForTimeout(1000);

    console.log('Taking screenshot of Worker Modal...');
    await page.screenshot({ path: path.join(outDir, 'worker_modal.png') });

    console.log('Done!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
