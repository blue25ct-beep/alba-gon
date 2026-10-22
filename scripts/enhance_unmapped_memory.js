const fs = require('fs');
const path = require('path');

// 1. Update client/src/services/storage.ts
const storagePath = path.join(__dirname, '..', 'client', 'src', 'services', 'storage.ts');
let storageCode = fs.readFileSync(storagePath, 'utf8');
const oldRegister = `    // 2. 留덉뒪???곹뭹(Products) 紐⑸줉??異붽? ?먮뒗 ?대쫫 ?섏젙 (?곴뎄 蹂닿?)
    const products = this.getProducts();
    const existingIdx = products.findIndex(p => p.barcode === barcode);
    if (existingIdx >= 0) {
      products[existingIdx].name = trimmed;
    } else {
      products.unshift({
        barcode,
        name: trimmed,
        category: '誘몃벑濡앹떊?곹뭹',
        price: 0,
        cost: 0,
        targetStock: 10,
        minOrderQty: 1,
      });
    }
    this.saveProducts(products);`;

const newRegister = `    // 2. 마스터 상품(Products) 목록에 추가 또는 이름 수정 (영구 보관)
    const products = this.getProducts();
    const existingIdx = products.findIndex(p => p.barcode === barcode);
    const nowStr = new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (existingIdx >= 0) {
      products[existingIdx].name = trimmed;
      products[existingIdx].reviewStatus = 'MODIFIED';
      products[existingIdx].updatedAt = nowStr;
    } else {
      products.unshift({
        barcode,
        name: trimmed,
        category: '미등록신상품',
        price: 0,
        cost: 0,
        targetStock: 1,
        minOrderQty: 1,
        reviewStatus: 'MODIFIED',
        updatedAt: nowStr,
      });
    }
    this.saveProducts(products, true);`;

const norm = s => s.replace(/\r\n/g, '\n');
let normStorage = norm(storageCode);
if (normStorage.includes(norm(oldRegister))) {
  normStorage = normStorage.replace(norm(oldRegister), norm(newRegister));
  fs.writeFileSync(storagePath, normStorage.replace(/\n/g, '\r\n'), 'utf8');
  console.log('1. storage.ts registerProductName updated!');
} else {
  console.error('1. storage.ts registerProductName target not found');
}

// 2. Update client/src/pages/AdminDashboard.tsx
const adminPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'AdminDashboard.tsx');
let adminCode = fs.readFileSync(adminPath, 'utf8');
let normAdmin = norm(adminCode);

// 2.1 orderItems productName
const oldOrderItemsRet = `    return {
      barcode: audit.barcode,
      productName: audit.productName,`;

const newOrderItemsRet = `    const effectiveProductName =
      (product && product.name && product.name !== '미등록 상품')
        ? product.name
        : audit.productName;

    return {
      barcode: audit.barcode,
      productName: effectiveProductName,`;

if (normAdmin.includes(norm(oldOrderItemsRet))) {
  normAdmin = normAdmin.replace(norm(oldOrderItemsRet), norm(newOrderItemsRet));
  console.log('2.1 AdminDashboard orderItems productName resolution updated!');
} else {
  console.error('2.1 AdminDashboard target not found');
}

// 2.2 handleSaveName broadcastAudits
const oldSaveName = `  const handleSaveName = (barcode: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      storageService.registerProductName(barcode, trimmed);
      cloudSyncService.broadcastProductsUpdate('ADMIN');
      loadData();
    }
    setEditingBarcode(null);
    setEditingName('');
  };`;

const newSaveName = `  const handleSaveName = (barcode: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      storageService.registerProductName(barcode, trimmed);
      cloudSyncService.broadcastProductsUpdate('ADMIN');
      cloudSyncService.broadcastAudits(storageService.getAudits(), 'ADMIN');
      loadData();
    }
    setEditingBarcode(null);
    setEditingName('');
  };`;

if (normAdmin.includes(norm(oldSaveName))) {
  normAdmin = normAdmin.replace(norm(oldSaveName), norm(newSaveName));
  console.log('2.2 AdminDashboard handleSaveName broadcastAudits updated!');
} else {
  console.error('2.2 AdminDashboard handleSaveName target not found');
}

// 2.3 isUnregistered check
const oldIsUnreg = `const isUnregistered =
                      item.productName === '미등록 상품' || !item.productName;`;

const newIsUnreg = `const { product: matchedProd } = storageService.findProduct(item.barcode);
                    const isUnregistered =
                      (!matchedProd || !matchedProd.name || matchedProd.name === '미등록 상품') &&
                      (item.productName === '미등록 상품' || !item.productName);`;

if (normAdmin.includes(norm(oldIsUnreg))) {
  normAdmin = normAdmin.replace(norm(oldIsUnreg), norm(newIsUnreg));
  console.log('2.3 AdminDashboard isUnregistered logic updated!');
} else {
  console.error('2.3 AdminDashboard isUnregistered target not found');
}

fs.writeFileSync(adminPath, normAdmin.replace(/\n/g, '\r\n'), 'utf8');

// 3. Update client/src/services/cloudSyncService.ts
const syncPath = path.join(__dirname, '..', 'client', 'src', 'services', 'cloudSyncService.ts');
let syncCode = fs.readFileSync(syncPath, 'utf8');
let normSync = norm(syncCode);

const oldAuditSyncMap = `            const validAudits = (msg.audits || []).map((a: any, idx: number) => {
              const auditTime = parseInt(a.id, 10);
              if (!isNaN(auditTime) && auditTime < lastClearedAt) {
                return { ...a, id: ((msg.timestamp || Date.now()) + idx).toString() };
              }
              return a;
            });`;

const newAuditSyncMap = `            const validAudits = (msg.audits || []).map((a: any, idx: number) => {
              const auditTime = parseInt(a.id, 10);
              let itemObj = a;
              if (!isNaN(auditTime) && auditTime < lastClearedAt) {
                itemObj = { ...a, id: ((msg.timestamp || Date.now()) + idx).toString() };
              }
              // 미등록 상품 자동 마스터 복원
              const { product } = storageService.findProduct(itemObj.barcode);
              if (product && product.name && product.name !== '미등록 상품') {
                return {
                  ...itemObj,
                  productName: product.name,
                  isUnmapped: false,
                  targetStock: itemObj.targetStock || product.targetStock || 1,
                  minOrderQty: itemObj.minOrderQty || product.minOrderQty || 1,
                };
              }
              return itemObj;
            });`;

if (normSync.includes(norm(oldAuditSyncMap))) {
  normSync = normSync.replace(norm(oldAuditSyncMap), norm(newAuditSyncMap));
  fs.writeFileSync(syncPath, normSync.replace(/\n/g, '\r\n'), 'utf8');
  console.log('3. cloudSyncService audit master product auto-resolution added!');
} else {
  console.error('3. cloudSyncService target not found');
}

// 4. Update bot/src/unifiedBot.js to also persist to client/src/data/seedProducts.json
const botPath = path.join(__dirname, '..', 'bot', 'src', 'unifiedBot.js');
let botCode = fs.readFileSync(botPath, 'utf8');
let normBot = norm(botCode);

const oldBotSave = `      const merged = Array.from(currentMap.values());
      fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(merged, null, 2), 'utf8');`;

const newBotSave = `      const merged = Array.from(currentMap.values());
      fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(merged, null, 2), 'utf8');
      const seedFile = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'seedProducts.json');
      if (fs.existsSync(seedFile)) {
        try { fs.writeFileSync(seedFile, JSON.stringify(merged, null, 2), 'utf8'); } catch(e){}
      }`;

if (normBot.includes(norm(oldBotSave))) {
  normBot = normBot.replace(norm(oldBotSave), norm(newBotSave));
  fs.writeFileSync(botPath, normBot.replace(/\n/g, '\r\n'), 'utf8');
  console.log('4. unifiedBot.js dual persist to seedProducts.json added!');
} else {
  console.error('4. unifiedBot.js target not found');
}

console.log('All unmapped auto-memory enhancements complete!');
