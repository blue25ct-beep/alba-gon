const fs = require('fs');

let adminCode = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `          const merged = Array.from(pMap.values());
          storageService.saveProducts(merged, false);
          setProducts(merged);`;

const replacementStr = `          const merged = Array.from(pMap.values());
          storageService.saveProducts(merged, true);
          setProducts(merged);`;

if (adminCode.includes(targetStr)) {
  adminCode = adminCode.replace(targetStr, replacementStr);
} else {
  adminCode = adminCode.replace(
    /const merged = Array\.from\(pMap\.values\(\)\);\s*storageService\.saveProducts\(merged, false\);\s*setProducts\(merged\);/,
    replacementStr
  );
}

const targetReturn = `    return () => {
      unsubSync();
      unsubStatus();
      unsubHistory();
      unsubProducts();
    };`;

const replacementReturn = `    // 봇 서버 연결 감지 및 브라우저 최신 마스터 상품 자동 동기화 (봇 켜짐 감지 시 영구 저장 보장)
    let botConnected = false;
    const botCheckInterval = setInterval(() => {
      fetch('http://localhost:3001/api/health')
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'ok') {
            if (!botConnected) {
              botConnected = true;
              console.log('[봇 연동 감지] 브라우저에 저장된 목표재고/발주단위 설정을 봇 PC 하드디스크에 영구 저장합니다.');
              const currentProds = storageService.getProducts();
              storageService.saveProducts(currentProds, true);
            }
          }
        })
        .catch(() => {
          botConnected = false;
        });
    }, 4000);

    return () => {
      clearInterval(botCheckInterval);
      unsubSync();
      unsubStatus();
      unsubHistory();
      unsubProducts();
    };`;

if (adminCode.includes(targetReturn)) {
  adminCode = adminCode.replace(targetReturn, replacementReturn);
} else {
  adminCode = adminCode.replace(
    /return \(\) => \{\s*unsubSync\(\);\s*unsubStatus\(\);\s*unsubHistory\(\);\s*unsubProducts\(\);\s*\};/,
    replacementReturn
  );
}

fs.writeFileSync('client/src/pages/AdminDashboard.tsx', adminCode, 'utf8');
console.log('AdminDashboard bot auto-sync patched successfully');
