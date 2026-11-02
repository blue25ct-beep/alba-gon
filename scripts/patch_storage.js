const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, '..', 'client', 'src', 'services', 'storage.ts');
let c = fs.readFileSync(storagePath, 'utf8');

// 1. Add import
if (!c.includes('hajinhyunAudits')) {
  c = c.replace(
    /import seedProducts from '\.\.\/data\/seedProducts\.json';/,
    "import seedProducts from '../data/seedProducts.json';\nimport hajinhyunAudits from '../data/audits_20261102_hajinhyun.json';"
  );
}

// 2. In getAudits: if empty on Nov 2, auto-populate with hajinhyunAudits
const getAuditsEnd = `      return [];
    } catch {
      return [];
    }
  },`;

const getAuditsWithFallback = `      // 11월 2일 실사 긴급 구출: 로컬 스토리지가 비어있는 경우 11월 2일 하진현 실사 112개 자동 로드
      if (hajinhyunAudits && hajinhyunAudits.length > 0 && isTodayAudit(hajinhyunAudits[0])) {
        const hAudits = hajinhyunAudits as AuditItem[];
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(hAudits));
        return hAudits;
      }
      return [];
    } catch {
      return [];
    }
  },`;

if (!c.includes('11월 2일 하진현 실사 112개 자동 로드')) {
  c = c.replace(getAuditsEnd, getAuditsWithFallback);
}

// 3. In mergeAudits: don't let past lastClearedAt drop worker or hajinhyun audits
c = c.replace(
  'if (lastClearedAt > 0 && incTime > 0 && incTime < lastClearedAt) continue;',
  "if (!isIncomingFromWorker && inc.workerName !== '하진현' && lastClearedAt > 0 && incTime > 0 && incTime < lastClearedAt) continue;"
);
c = c.replace(
  'if (deletedAt > 0 && incTime <= deletedAt) continue;',
  "if (!isIncomingFromWorker && inc.workerName !== '하진현' && deletedAt > 0 && incTime <= deletedAt) continue;"
);

fs.writeFileSync(storagePath, c, 'utf8');
console.log('Successfully patched storage.ts');
