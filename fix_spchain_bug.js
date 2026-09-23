const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/spchainEngine.js';
let content = fs.readFileSync(file, 'utf8');

const oldLoop = `        for (const item of orderPayload.items) {
            console.log(\`[SPChain] 품목 검색 중: \${item.productName} (\${item.barcode})\`);
            
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
                let box = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))); console.log(\`[SPChain] \${item.productName} - \${box}박스 (\${item.finalOrderQty}병) 저장 완료\`);
                
                try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                results.push({ barcode: item.barcode, status: 'success' });
            } else {
                console.log(\`[SPChain] \${item.productName} - 바코드(\${item.barcode}) 검색 실패\`);
                
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
                    console.log(\`[SPChain] \${item.productName} - 상품명 검색으로 저장됨\`);
                    try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                    results.push({ barcode: item.barcode, status: 'success' });
                } else {
                    results.push({ barcode: item.barcode, status: 'fail' });
                }
            }
        }`;

const newLoop = `        for (const item of orderPayload.items) {
            console.log(\`[SPChain] 품목 검색 중: \${item.productName} (\${item.barcode})\`);
            
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
                        const trText = tr.innerText.replace(/\\s+/g, '');
                        // 이름의 3글자 이상 일치하거나 바코드가 일치해야 함
                        const safeName = name.replace(/\\s+/g, '').substring(0, 3);
                        if (!trText.includes(barcode) && !trText.includes(safeName)) {
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
                let box = Math.max(1, Math.round(item.finalOrderQty / (item.minOrderQty || 1))); console.log(\`[SPChain] \${item.productName} - \${box}박스 (\${item.finalOrderQty}병) 저장 완료\`);
                
                try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); } catch (e) {}
                results.push({ barcode: item.barcode, status: 'success' });
            } else {
                console.log(\`[SPChain] \${item.productName} - 바코드(\${item.barcode}) 검색 실패 및 검증 실패 (오주문 방지)\`);
                // 이름 검색(fallback)은 잘못된 상품 주문 위험이 커서 완전히 제거함
                results.push({ barcode: item.barcode, status: 'fail' });
            }
        }`;

content = content.replace(oldLoop, newLoop);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed SPChain order bug');
