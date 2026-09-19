const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const sectionStartStr = '<section className="bg-surface border border-line rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">';
const idxStart = content.indexOf(sectionStartStr);

if (idxStart !== -1) {
    let nest = 0;
    let idxEnd = -1;
    for (let i = idxStart; i < content.length; i++) {
        if (content.startsWith('<section', i)) nest++;
        else if (content.startsWith('</section>', i)) {
            nest--;
            if (nest === 0) {
                idxEnd = i + 10;
                break;
            }
        }
    }

    const progStr = '{younmeProgress && (';
    const idxProgStart = content.indexOf(progStr, idxEnd);
    let idxProgEnd = -1;
    if (idxProgStart !== -1 && idxProgStart - idxEnd < 100) {
        const tempIdx = content.indexOf('</section>', idxProgStart);
        idxProgEnd = content.indexOf(')}', tempIdx) + 2;
    } else {
        idxProgEnd = idxEnd;
    }

    const newSections = `
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 유앤미 발주 섹션 */}
        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-sage-deep mb-2">🌿 유앤미24 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              상온/냉장 카테고리 상품들을 유앤미24 시스템을 통해 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-ink">{younmeItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isYounmeOrdering || younmeItems.length === 0 || isSpchainOrdering}
              onClick={() => handleStartOrder('YOUNME', younmeItems)}
              className="h-10 px-6 rounded-full bg-sage hover:bg-sage-deep disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isYounmeOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {younmeProgress && (
            <div className="mt-4 p-4 bg-sage-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-sage-deep font-medium break-keep">{younmeProgress.message}</span>
                <span className="text-sage font-bold tabular shrink-0">{younmeProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-300 ease-out"
                  style={{ width: \`\${younmeProgress.percent}%\` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 생필체인 발주 섹션 */}
        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-700 mb-2">🍺 생필체인(주류) 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              주류 카테고리 상품들을 생필체인 시스템을 통해 박스 단위로 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-ink">{spchainItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isSpchainOrdering || spchainItems.length === 0 || isYounmeOrdering}
              onClick={() => handleStartOrder('SPCHAIN', spchainItems)}
              className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isSpchainOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {spchainProgress && (
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-blue-800 font-medium break-keep">{spchainProgress.message}</span>
                <span className="text-blue-600 font-bold tabular shrink-0">{spchainProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: \`\${spchainProgress.percent}%\` }}
                />
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => {
            setAliasTargetBarcode('');
            setShowAliasModal(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken transition-colors bg-white border border-line"
        >
          <ArrowRightLeft className="w-4 h-4" />
          대체 바코드
          <span className="text-ink-faint tabular">{aliases.length}</span>
        </button>

        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken cursor-pointer transition-colors bg-white border border-line">
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 불러오기
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>
      </div>
    `;

    content = content.substring(0, idxStart) + newSections.trim() + content.substring(idxProgEnd);
    fs.writeFileSync(file, content, 'utf8');
    console.log('UI Replaced correctly!');
} else {
    console.log('Could not find start tag');
}
