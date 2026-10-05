const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{step === 'QUANTITY' && activeBarcode && \(\s*\{\(\(\) => \{\s*const currentAudit = audits\.find\(a => a\.barcode === activeBarcode\);\s*return \(\s*<QuantityModal[\s\S]*?\/>\s*\);\s*\}\)\(\)\}\s*\)\}/;

const replacement = `{step === 'QUANTITY' && activeBarcode && (() => {
          const currentAudit = audits.find(a => a.barcode === activeBarcode);
          return (
            <QuantityModal
              barcode={activeBarcode}
              product={detectedProduct}
              initialQuantity={currentAudit ? currentAudit.stockCount : 1}
              onSave={handleSaveQuantity}
              onClose={handleCloseModals}
            />
          );
        })()}`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
