const fs = require('fs');

let fileApp = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let contentApp = fs.readFileSync(fileApp, 'utf8');

const oldEffect = `    if (changed) {
      localStorage.setItem('albagom_products_v3', JSON.stringify(merged));
    }`;

const newEffect = `    if (changed) {
      localStorage.setItem('albagom_products_v3', JSON.stringify(merged));
    }
    
    // Migrate audits targetStock
    const auditsStr = localStorage.getItem('albagom_audits_v1');
    if (auditsStr) {
      try {
        const audits = JSON.parse(auditsStr);
        let auditsChanged = false;
        for (const a of audits) {
          if (a.targetStock === 10) {
            const p = merged.find(x => x.barcode === a.barcode);
            if (p && p.targetStock === 1) {
              a.targetStock = 1;
              auditsChanged = true;
            }
          }
        }
        if (auditsChanged) {
          localStorage.setItem('albagom_audits_v1', JSON.stringify(audits));
        }
      } catch (e) {}
    }`;

contentApp = contentApp.replace(oldEffect, newEffect);
fs.writeFileSync(fileApp, contentApp, 'utf8');
console.log('Fixed audits migration');
