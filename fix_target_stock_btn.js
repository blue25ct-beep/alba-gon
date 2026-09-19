const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button`;

const replacement = `      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => setShowStockSetupModal(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken transition-colors bg-white border border-line"
        >
          <Package className="w-4 h-4" />
          목표 재고
          <span className="text-ink-faint tabular">{products.length}</span>
        </button>

        <button`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed button!');
