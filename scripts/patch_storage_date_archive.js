const fs = require('fs');

let code = fs.readFileSync('client/src/services/storage.ts', 'utf8');

// 1. Add ARCHIVED_AUDITS and isTodayAudit
const targetKeys = "  CUSTOMIZED_PRODUCT_SETTINGS: 'albagom_customized_product_settings_v1',";
const replacementKeys = `  CUSTOMIZED_PRODUCT_SETTINGS: 'albagom_customized_product_settings_v1',
  ARCHIVED_AUDITS: 'albagom_archived_audits_by_date_v1',
};

// 당일(오늘) 실사 여부 판정 헬퍼 (과거 세션 데이터의 현재 화면 혼입 원천 차단)
export function isTodayAudit(item: any): boolean {
  if (!item) return false;
  const now = new Date();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();
  const todayYear = now.getFullYear();

  // 1. id 타임스탬프 (밀리초) 검사
  const t = parseInt(item.id, 10);
  if (!isNaN(t) && t > 1000000000000) {
    const d = new Date(t);
    if (d.getFullYear() === todayYear && (d.getMonth() + 1) === todayM && d.getDate() === todayD) {
      return true;
    }
    return false;
  }

  // 2. updatedAt 날짜 문자열 검사
  if (item.updatedAt && typeof item.updatedAt === 'string') {
    if (
      item.updatedAt.includes(todayM + '. ' + todayD + '.') ||
      item.updatedAt.includes(todayM + '월 ' + todayD + '일') ||
      item.updatedAt.includes(todayYear + '-' + String(todayM).padStart(2, '0') + '-' + String(todayD).padStart(2, '0'))
    ) {
      return true;
    }
    if (/\\d{1,2}\\.\\s*\\d{1,2}\\./.test(item.updatedAt) || /\\d{4}-\\d{2}-\\d{2}/.test(item.updatedAt)) {
      return false;
    }
  }

  return true;
}`;

if (code.includes(targetKeys + "\r\n};")) {
  code = code.replace(targetKeys + "\r\n};", replacementKeys);
} else {
  code = code.replace(targetKeys + "\n};", replacementKeys);
}

// 2. Add archive methods and update getAudits & mergeAudits
const oldGetAuditsRegex = /getAudits\(\): AuditItem\[\] \{[\s\S]*?saveAudits\(audits: AuditItem\[\]\): void \{/;

const newMethodsAndGetAudits = `archivePastAudits(pastItems: AuditItem[]): void {
    if (!pastItems || pastItems.length === 0) return;
    try {
      const raw = localStorage.getItem(KEYS.ARCHIVED_AUDITS);
      const archive: Record<string, AuditItem[]> = raw ? JSON.parse(raw) : {};

      for (const item of pastItems) {
        if (!item || !item.barcode) continue;
        let dateKey = '과거_실사_기록';
        const t = parseInt(item.id, 10);
        if (!isNaN(t) && t > 1000000000000) {
          const d = new Date(t);
          dateKey = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        } else if (item.updatedAt) {
          const match = item.updatedAt.match(/(\\d{1,2})\\.\\s*(\\d{1,2})\\./);
          if (match) {
            dateKey = \`2026-\${match[1].padStart(2, '0')}-\${match[2].padStart(2, '0')}\`;
          } else {
            dateKey = item.updatedAt.split('오')[0].trim();
          }
        }

        if (!archive[dateKey]) {
          archive[dateKey] = [];
        }
        if (!archive[dateKey].some(a => a.barcode === item.barcode)) {
          archive[dateKey].push(item);
        }
      }

      localStorage.setItem(KEYS.ARCHIVED_AUDITS, JSON.stringify(archive));
    } catch (e) {
      console.error('Failed to archive past audits', e);
    }
  },

  getArchivedAuditsByDate(): Record<string, AuditItem[]> {
    try {
      const raw = localStorage.getItem(KEYS.ARCHIVED_AUDITS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  getAudits(): AuditItem[] {
    try {
      const data = localStorage.getItem(KEYS.AUDITS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const todayAudits: AuditItem[] = [];
          const pastAudits: AuditItem[] = [];

          for (const a of parsed) {
            // 과거 근무자(하진현 등)이거나 당일 실사가 아닌 항목 엄격 분리
            if (a.workerName === '하진현' || !isTodayAudit(a)) {
              pastAudits.push(a);
            } else {
              todayAudits.push(a);
            }
          }

          // 과거 실사는 과거 날짜별 아카이브로 안전하게 분리 격리 보관
          if (pastAudits.length > 0) {
            this.archivePastAudits(pastAudits);
            localStorage.setItem(KEYS.AUDITS, JSON.stringify(todayAudits));
          }

          return todayAudits;
        }
      }

      // 로컬 스토리지 키가 비어있는 경우 근무자 세이프티 백업에서 복원
      const backupData = localStorage.getItem(KEYS.WORKER_SAFETY_BACKUP);
      if (backupData) {
        const backupParsed = JSON.parse(backupData);
        if (Array.isArray(backupParsed) && backupParsed.length > 0) {
          const todayValid: AuditItem[] = [];
          const pastBackup: AuditItem[] = [];
          for (const a of backupParsed) {
            if (a.workerName === '하진현' || !isTodayAudit(a)) {
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

  getDeletedTombstones(): Record<string, number> {
    try {
      const data = localStorage.getItem(KEYS.DELETED_TOMBSTONES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  recordDeletedTombstone(barcode: string, timestamp = Date.now()): void {
    try {
      const tombstones = this.getDeletedTombstones();
      tombstones[barcode] = timestamp;
      localStorage.setItem(KEYS.DELETED_TOMBSTONES, JSON.stringify(tombstones));
    } catch (e) {
      console.error('Failed to record deleted tombstone', e);
    }
  },

  removeDeletedTombstone(barcode: string): void {
    try {
      const tombstones = this.getDeletedTombstones();
      if (tombstones[barcode]) {
        delete tombstones[barcode];
        localStorage.setItem(KEYS.DELETED_TOMBSTONES, JSON.stringify(tombstones));
      }
    } catch (e) {}
  },

  clearDeletedTombstones(): void {
    localStorage.removeItem(KEYS.DELETED_TOMBSTONES);
  },

  // 스마트 병합: 근무자 폰 최우선 보존 (isWorkerDevice) 및 원격 근무자 실사 최우선 반영 (isIncomingFromWorker)
  mergeAudits(incoming: AuditItem[], isWorkerDevice = false, isIncomingFromWorker = false): AuditItem[] {
    const local = this.getAudits(); // 이미 오늘 실사만 반환됨
    const tombstones = this.getDeletedTombstones();
    let lastClearedAt = 0;
    try {
      lastClearedAt = parseInt(localStorage.getItem('albagom_last_cleared_at') || '0', 10);
    } catch (e) {}

    const map = new Map<string, AuditItem>();

    // 1. 로컬 실사 보존 (오늘 실사만)
    for (const item of local) {
      if (!item || !item.barcode) continue;
      if (item.workerName === '하진현' || !isTodayAudit(item)) continue;
      const itemTime = parseInt(item.id, 10) || 0;
      if (lastClearedAt > 0 && itemTime > 0 && itemTime < lastClearedAt) continue;
      const deletedAt = tombstones[item.barcode] || 0;
      if (deletedAt > 0 && itemTime <= deletedAt) continue;
      map.set(item.barcode, item);
    }

    // 2. 원격 수신 실사 스마트 병합 (오늘 실사만)
    const pastIncoming: AuditItem[] = [];
    for (const inc of incoming) {
      if (!inc || !inc.barcode) continue;
      if (inc.workerName === '하진현' || !isTodayAudit(inc)) {
        pastIncoming.push(inc);
        continue;
      }
      const incTime = parseInt(inc.id, 10) || 0;
      if (lastClearedAt > 0 && incTime > 0 && incTime < lastClearedAt) continue;
      const deletedAt = tombstones[inc.barcode] || 0;
      if (deletedAt > 0 && incTime <= deletedAt) continue;

      const existing = map.get(inc.barcode);
      if (!existing) {
        map.set(inc.barcode, inc);
      } else {
        if (isWorkerDevice) {
          continue;
        } else if (isIncomingFromWorker) {
          map.set(inc.barcode, { ...existing, ...inc });
        } else {
          const existingTime = parseInt(existing.id, 10) || 0;
          if (incTime >= existingTime) {
            map.set(inc.barcode, { ...existing, ...inc });
          }
        }
      }
    }

    if (pastIncoming.length > 0) {
      this.archivePastAudits(pastIncoming);
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0));
    this.saveAudits(merged);
    return merged;
  },

  saveAudits(audits: AuditItem[]): void {`;

code = code.replace(oldGetAuditsRegex, newMethodsAndGetAudits);
fs.writeFileSync('client/src/services/storage.ts', code, 'utf8');
console.log('Script updated and run');
