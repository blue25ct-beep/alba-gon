const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const oldGetAudits = `  getAudits(): AuditItem[] {
    try {
      const data = localStorage.getItem(KEYS.AUDITS);
      if (!data) {
        // 理쒖큹 ?묒냽 ???ъ옣?섏씠 ?묒뾽?섏떊 65嫄??ㅼ궗 ?덈ぉ 湲곕낯 ?묒옱!
        const initial = (seedAudits as unknown as AuditItem[]) || [];
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return (seedAudits as unknown as AuditItem[]) || [];
    }
  },`;

const newGetAudits = `  getAudits(): AuditItem[] {
    try {
      const data = localStorage.getItem(KEYS.AUDITS);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },`;

// Normalize line endings for replace
content = content.replace(/\r\n/g, '\n');
if (content.includes('const initial = (seedAudits')) {
    const regex = /getAudits\(\): AuditItem\[\] \{[\s\S]*?return \(seedAudits as unknown as AuditItem\[\]\) \|\| \[\];\s*\}\s*\},/;
    content = content.replace(regex, newGetAudits);
    fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log('Fixed storage.ts to return empty array instead of seedAudits');
} else {
    console.log('Could not find getAudits in storage.ts');
}
