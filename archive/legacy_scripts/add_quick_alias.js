const fs = require('fs');

// 1. Update UnmappedGallery.tsx
const gfile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/UnmappedGallery.tsx';
let gcontent = fs.readFileSync(gfile, 'utf8');

const gInterfaceOld = `interface UnmappedGalleryProps {
  unmappedAudits: AuditItem[];
  onProductMapped: () => void;
  onClose: () => void;
}`;
const gInterfaceNew = `interface UnmappedGalleryProps {
  unmappedAudits: AuditItem[];
  onProductMapped: () => void;
  onClose: () => void;
  onOpenAliasModal?: (barcode: string) => void;
}`;
gcontent = gcontent.replace(gInterfaceOld, gInterfaceNew);

const gPropsOld = `export const UnmappedGallery: React.FC<UnmappedGalleryProps> = ({
  unmappedAudits,
  onProductMapped,
  onClose,
}) => {`;
const gPropsNew = `export const UnmappedGallery: React.FC<UnmappedGalleryProps> = ({
  unmappedAudits,
  onProductMapped,
  onClose,
  onOpenAliasModal,
}) => {`;
gcontent = gcontent.replace(gPropsOld, gPropsNew);

const gBarcodeOld = `                    <p className="mt-0.5 text-[15px] text-ink tabular">
                      {selectedAudit.barcode}
                    </p>`;
const gBarcodeNew = `                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="text-[15px] text-ink tabular">
                        {selectedAudit.barcode}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => onOpenAliasModal?.(selectedAudit.barcode)} 
                        className="text-[13px] text-blue-600 px-2.5 py-1.5 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                      >
                        기존 상품과 연결(대체 바코드)
                      </button>
                    </div>`;
gcontent = gcontent.replace(gBarcodeOld, gBarcodeNew);
fs.writeFileSync(gfile, gcontent, 'utf8');

// 2. Update AdminDashboard.tsx
const afile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let acontent = fs.readFileSync(afile, 'utf8');

const aRenderOld = `<UnmappedGallery
          unmappedAudits={unmappedAudits}
          onProductMapped={loadData}
          onClose={() => setShowUnmappedModal(false)}
        />`;
const aRenderNew = `<UnmappedGallery
          unmappedAudits={unmappedAudits}
          onProductMapped={loadData}
          onClose={() => setShowUnmappedModal(false)}
          onOpenAliasModal={(code) => {
            setShowUnmappedModal(false);
            setAliasTargetBarcode(code);
            setShowAliasModal(true);
          }}
        />`;
acontent = acontent.replace(aRenderOld, aRenderNew);
fs.writeFileSync(afile, acontent, 'utf8');

console.log('Added quick Alias link');
