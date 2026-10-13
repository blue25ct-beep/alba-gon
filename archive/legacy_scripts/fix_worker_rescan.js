const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<QuantityModal\s+barcode=\{activeBarcode\}\s+product=\{detectedProduct\}\s+initialQuantity=\{1\}\s+onSave=\{handleSaveQuantity\}\s+onClose=\{handleCloseModals\}\s+\/>/;

const replacement = `{(() => {
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
console.log('Fixed QuantityModal initialQuantity');
