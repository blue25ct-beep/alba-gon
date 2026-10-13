const fs = require('fs');

const bfile = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/orderEngine.js';
let bcontent = fs.readFileSync(bfile, 'utf8');

const oldFail = `      failures.push({
        barcode: targetBarcode,
        productName: item.productName,
        failReason: 'OTHER',
        failDetail: e.message,
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
      });`;

const newFail = `      let failScreenshot;
      try {
        if (page) failScreenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
      } catch (err) {}

      failures.push({
        barcode: targetBarcode,
        productName: item.productName,
        failReason: 'OTHER',
        failDetail: e.message,
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
        failScreenshot: failScreenshot ? 'data:image/jpeg;base64,' + failScreenshot : undefined
      });`;

bcontent = bcontent.replace(oldFail, newFail);

// Also handle the empty row case where it returns "상품정보를 찾을 수 없습니다"
const oldNotFound = `      failures.push({
        barcode: targetBarcode,
        productName: item.productName,
        failReason: 'NOT_FOUND',
        failDetail: '유앤미 시스템에서 검색되지 않습니다.',
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
      });`;

const newNotFound = `      let failScreenshot;
      try {
        if (page) failScreenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
      } catch (err) {}
      failures.push({
        barcode: targetBarcode,
        productName: item.productName,
        failReason: 'NOT_FOUND',
        failDetail: '유앤미 시스템에서 검색되지 않습니다.',
        attemptedQty: item.finalOrderQty,
        minOrderQty: item.minOrderQty,
        failedAt: new Date().toLocaleTimeString('ko-KR'),
        failScreenshot: failScreenshot ? 'data:image/jpeg;base64,' + failScreenshot : undefined
      });`;

bcontent = bcontent.replace(oldNotFound, newNotFound);

fs.writeFileSync(bfile, bcontent, 'utf8');

console.log('Added screenshot logic to bot');
