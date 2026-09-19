const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/spchainEngine.js';
let content = fs.readFileSync(file, 'utf8');

// Replace function signature
content = content.replace(
    'async function runSpchainOrder(orderPayload) {',
    'async function runSpchainOrder(orderPayload, sendProgress) {'
);

// Add progress callbacks
content = content.replace(
    "console.log('[SPChain] 주문 처리 시작:', orderPayload.items.length, '개 품목');",
    "console.log('[SPChain] 주문 처리 시작:', orderPayload.items.length, '개 품목');\n    if (sendProgress) sendProgress('LOGGING_IN', 20, '생필체인 시스템에 로그인하는 중입니다...');"
);

content = content.replace(
    "console.log('[SPChain] 검색 프레임 진입 완료');",
    "console.log('[SPChain] 검색 프레임 진입 완료');\n        if (sendProgress) sendProgress('SEARCHING', 40, '상품을 검색하고 수량을 계산 중입니다...');"
);

// At the end, format the result properly so it matches YOUNME's { successCount, failures }
content = content.replace(
    "return { success: true, results };",
    "const failures = results.filter(r => r.status === 'fail').map(r => ({ barcode: r.barcode, reason: 'SPChain 상품 검색 실패' }));\n    return { successCount: results.length - failures.length, failures };"
);

fs.writeFileSync(file, content, 'utf8');
console.log('spchainEngine updated');
