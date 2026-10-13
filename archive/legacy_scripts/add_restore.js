const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import recoveryAudits from '../data/recoveryAudits.json';\n`;
if (!content.includes(`import recoveryAudits`)) {
  content = content.replace(`import { ProductStockSetupModal } from '../components/ProductStockSetupModal';`, `import { ProductStockSetupModal } from '../components/ProductStockSetupModal';\n` + importStatement);
}

const restoreFunction = `
  const handleRestoreAudits = () => {
    if (confirm('유실된 182개의 발주 리스트 데이터를 강제로 복구하시겠습니까?')) {
      const merged = [...storageService.getAudits()];
      const existingBarcodes = new Set(merged.map(a => a.barcode));
      (recoveryAudits as any[]).forEach(a => {
        if (!existingBarcodes.has(a.barcode)) {
          merged.push(a);
        }
      });
      storageService.saveAudits(merged);
      cloudSyncService.broadcastAudits(merged, 'ADMIN');
      loadData();
      alert('복구가 완료되었습니다!');
    }
  };
`;

if (!content.includes('handleRestoreAudits')) {
  content = content.replace('const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {', restoreFunction + '\n  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {');
}

const restoreButton = `
          <button
            onClick={handleRestoreAudits}
            className="h-10 px-4 rounded-xl bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors"
          >
            🚨 삭제된 데이터 복구하기
          </button>
`;

if (!content.includes('🚨 삭제된 데이터 복구하기')) {
  content = content.replace('<button\n            onClick={handleClearAllAudits}', restoreButton + '\n          <button\n            onClick={handleClearAllAudits}');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added restore button');
