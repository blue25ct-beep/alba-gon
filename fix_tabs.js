const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change the tempFilter definition
content = content.replace(
    "useState<'ALL' | 'AMBIENT' | 'CHILLED'>('ALL');",
    "useState<'ALL' | 'YOUNME' | 'SPCHAIN'>('ALL');"
);

// 2. Change the filtering logic for the list
const oldFilterLogic = `      let matchesTemp = true;
      if (tempFilter === 'AMBIENT') matchesTemp = !isChilled;
      if (tempFilter === 'CHILLED') matchesTemp = isChilled;`;

const newFilterLogic = `      let matchesTemp = true;
      const isYounmeItem = item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category));
      if (tempFilter === 'YOUNME') matchesTemp = isYounmeItem;
      if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem;`;

content = content.replace(oldFilterLogic, newFilterLogic);

// 3. Change the tabs
const oldTabs = `            {(
              [
                ['ALL', '전체'],
                ['AMBIENT', '상온'],
                ['CHILLED', '냉장'],
              ] as const
            ).map(([key, label]) => (`;

const newTabs = `            {(
              [
                ['ALL', '전체'],
                ['YOUNME', '유앤미24'],
                ['SPCHAIN', '생필체인(주류)'],
              ] as const
            ).map(([key, label]) => (`;

content = content.replace(oldTabs, newTabs);

// 4. Wrap the order blocks with conditional rendering
const oldBlocks = `      {/* 발주 실행 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 유앤미 발주 섹션 */}`;

const newBlocks = `      {/* 발주 실행 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 유앤미 발주 섹션 */}
        {(tempFilter === 'ALL' || tempFilter === 'YOUNME') && (`;

content = content.replace(oldBlocks, newBlocks);

const spchainBlockStart = `{/* 생필체인 발주 섹션 */}`;
content = content.replace(spchainBlockStart, `)}
        {/* 생필체인 발주 섹션 */}
        {(tempFilter === 'ALL' || tempFilter === 'SPCHAIN') && (`);

// And close the SPChain block conditional at the end of the grid
const spchainBlockEnd = `          )}
        </section>
      </div>`;
content = content.replace(spchainBlockEnd, `          )}
        </section>
        )}
      </div>`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed tabs and order button visibility!');
