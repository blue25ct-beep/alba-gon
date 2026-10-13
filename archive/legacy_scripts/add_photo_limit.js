const fs = require('fs');

// 1. PhotoCaptureModal.tsx
const pfile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let pcontent = fs.readFileSync(pfile, 'utf8');

const pOldBtn = `<button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    추가 촬영
                  </button>`;

const pNewBtn = `{capturedPhotos.length < 3 && (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    추가 촬영
                  </button>
                )}`;

pcontent = pcontent.replace(pOldBtn, pNewBtn);

const pOldLabel = `<label className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                    추가 촬영
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>`;

const pNewLabel = `{capturedPhotos.length < 3 && (
                  <label className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                    추가 촬영
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}`;

pcontent = pcontent.replace(pOldLabel, pNewLabel);

const pOldNotice = `<p className="mt-2 text-sm text-ink-soft leading-relaxed break-keep">
              상품을 여러 각도에서 찍어두면 관리가 편해집니다.
            </p>`;
const pNewNotice = `<p className="mt-2 text-sm text-ink-soft leading-relaxed break-keep">
              상품을 여러 각도에서 찍어두면 관리가 편해집니다. (최대 3장)
            </p>`;
            
pcontent = pcontent.replace(pOldNotice, pNewNotice);

fs.writeFileSync(pfile, pcontent, 'utf8');


// 2. storage.ts Storage Quota Check
const sfile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let scontent = fs.readFileSync(sfile, 'utf8');

const sOld = `  saveAudit(item: Omit<AuditItem, 'id' | 'updatedAt'>): AuditItem {
    const audits = this.getAudits();`;

const sNew = `  checkStorageQuota() {
    try {
      const usage = JSON.stringify(localStorage).length;
      if (usage > 4000000) {
        alert('경고: 기기 저장 공간이 80% 이상 찼습니다! 과거 실사 내역을 비우거나 사진을 줄여주세요.');
      }
    } catch (e) {}
  },

  saveAudit(item: Omit<AuditItem, 'id' | 'updatedAt'>): AuditItem {
    this.checkStorageQuota();
    const audits = this.getAudits();`;

if (!scontent.includes('checkStorageQuota')) {
    scontent = scontent.replace(sOld, sNew);
    fs.writeFileSync(sfile, scontent, 'utf8');
}

console.log('Added photo limit and storage check');
