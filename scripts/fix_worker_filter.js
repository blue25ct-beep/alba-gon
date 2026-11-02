const fs = require('fs');

let code = fs.readFileSync('client/src/services/storage.ts', 'utf8');

// 1. Update getAudits to automatically restore any today items from archive and remove '하진현' hardcoding
const oldGetAuditsRegex = /getAudits\(\): AuditItem\[\] \{[\s\S]*?getDeletedTombstones\(\): Record<string, number> \{/;

const newGetAudits = `getAudits(): AuditItem[] {
    try {
      // 1. 아카이브에서 당일(오늘) 날짜의 실사가 잘못 격리되어 있다면 자동으로 즉시 복원
      const rawArchive = localStorage.getItem(KEYS.ARCHIVED_AUDITS);
      const archiveRestoredItems: AuditItem[] = [];
      if (rawArchive) {
        try {
          const archive: Record<string, AuditItem[]> = JSON.parse(rawArchive);
          let archiveModified = false;
          for (const [dateKey, items] of Object.entries(archive)) {
            if (Array.isArray(items)) {
              const rescued = items.filter(a => isTodayAudit(a));
              if (rescued.length > 0) {
                archiveRestoredItems.push(...rescued);
                archive[dateKey] = items.filter(a => !isTodayAudit(a));
                if (archive[dateKey].length === 0) {
                  delete archive[dateKey];
                }
                archiveModified = true;
              }
            }
          }
          if (archiveModified) {
            localStorage.setItem(KEYS.ARCHIVED_AUDITS, JSON.stringify(archive));
          }
        } catch (e) {}
      }

      const data = localStorage.getItem(KEYS.AUDITS);
      let parsed: AuditItem[] = [];
      if (data) {
        try {
          const arr = JSON.parse(data);
          if (Array.isArray(arr)) parsed = arr;
        } catch (e) {}
      }

      // 아카이브에서 구출된 오늘자 실사 항목 병합
      if (archiveRestoredItems.length > 0) {
        const pMap = new Map<string, AuditItem>();
        parsed.forEach(a => pMap.set(a.barcode, a));
        archiveRestoredItems.forEach(a => {
          if (!pMap.has(a.barcode)) {
            pMap.set(a.barcode, a);
          }
        });
        parsed = Array.from(pMap.values());
      }

      if (parsed.length > 0) {
        const todayAudits: AuditItem[] = [];
        const pastAudits: AuditItem[] = [];

        for (const a of parsed) {
          // 특정 근무자 하드코딩 배제 없이, 순수하게 '오늘 날짜 실사'인지 여부만 엄격 판정
          if (!isTodayAudit(a)) {
            pastAudits.push(a);
          } else {
            todayAudits.push(a);
          }
        }

        // 과거 실사는 과거 날짜별 아카이브로 안전하게 분리 격리 보관
        if (pastAudits.length > 0) {
          this.archivePastAudits(pastAudits);
        }

        localStorage.setItem(KEYS.AUDITS, JSON.stringify(todayAudits));
        return todayAudits;
      }

      // 로컬 스토리지 키가 비어있는 경우 근무자 세이프티 백업에서 복원
      const backupData = localStorage.getItem(KEYS.WORKER_SAFETY_BACKUP);
      if (backupData) {
        const backupParsed = JSON.parse(backupData);
        if (Array.isArray(backupParsed) && backupParsed.length > 0) {
          const todayValid: AuditItem[] = [];
          const pastBackup: AuditItem[] = [];
          for (const a of backupParsed) {
            if (!isTodayAudit(a)) {
              pastBackup.push(a);
            } else {
              todayValid.push(a);
            }
          }
          if (pastBackup.length > 0) {
            this.archivePastAudits(pastBackup);
          }
          if (todayValid.length > 0) {
            localStorage.setItem(KEYS.AUDITS, JSON.stringify(todayValid));
            return todayValid;
          }
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  getDeletedTombstones(): Record<string, number> {`;

code = code.replace(oldGetAuditsRegex, newGetAudits);

// 2. Remove '하진현' hardcoding in mergeAudits
code = code.replace(
  "if (item.workerName === '하진현' || !isTodayAudit(item)) continue;",
  "if (!isTodayAudit(item)) continue;"
);

code = code.replace(
  "if (inc.workerName === '하진현' || !isTodayAudit(inc)) {",
  "if (!isTodayAudit(inc)) {"
);

fs.writeFileSync('client/src/services/storage.ts', code, 'utf8');
console.log('client/src/services/storage.ts patched successfully');
