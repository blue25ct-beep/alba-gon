const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const oldSaveAudit = `  saveAudit(item: Omit<AuditItem, 'id' | 'updatedAt'>): AuditItem {
    const audits = this.getAudits();
    // 媛숈? 諛붿퐫?쒖쓽 ?ㅼ궗媛€ ?대? ?덉쑝硫?理쒖떊 ?섎웾?쇰줈 ?낅뜲?댄듃
    const existingIndex = audits.findIndex(a => a.barcode === item.barcode);
    const updatedItem: AuditItem = {
      ...item,
      id: existingIndex >= 0 ? audits[existingIndex].id : Date.now().toString(),
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    if (existingIndex >= 0) {
      audits[existingIndex] = updatedItem;
    } else {
      audits.unshift(updatedItem);
    }`;

const newSaveAudit = `  saveAudit(item: Omit<AuditItem, 'id' | 'updatedAt'>): AuditItem {
    const audits = this.getAudits();
    const existingIndex = audits.findIndex(a => a.barcode === item.barcode);
    
    let mergedPhotoUrls = item.photoUrls || [];
    if (existingIndex >= 0 && audits[existingIndex].photoUrls && audits[existingIndex].photoUrls.length > 0) {
      // 기존에 찍어둔 사진이 있다면, 새로 찍은 사진(들)을 뒤에 추가하여 보존합니다.
      const existingPhotos = audits[existingIndex].photoUrls || [];
      const newPhotos = item.photoUrls || [];
      // 중복 방지 로직 (혹시라도 같은 사진이 들어오는 경우 방지)
      mergedPhotoUrls = [...new Set([...existingPhotos, ...newPhotos])];
    }

    const updatedItem: AuditItem = {
      ...item,
      photoUrls: mergedPhotoUrls,
      id: existingIndex >= 0 ? audits[existingIndex].id : Date.now().toString(),
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    if (existingIndex >= 0) {
      audits[existingIndex] = updatedItem;
    } else {
      audits.unshift(updatedItem);
    }`;

content = content.replace(oldSaveAudit, newSaveAudit);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed photo merge bug in storage.ts');
