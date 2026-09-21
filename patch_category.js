const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const categoryUI = `if (selectedCategory === null && onCategoryChange) {
    return (
      <div className="max-w-md mx-auto h-screen bg-canvas p-6 flex flex-col justify-center gap-6 pb-20">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-ink mb-2">어떤 발주를 하시나요?</h2>
          <p className="text-sm text-ink-soft">실사를 진행할 항목을 선택해주세요.</p>
        </div>
        
        <button
          onClick={() => onCategoryChange('YOUNME')}
          className="flex flex-col items-center justify-center gap-3 p-8 bg-white rounded-3xl border border-line shadow-sm hover:border-sage hover:shadow-md transition-all group"
        >
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center text-sage group-hover:scale-110 transition-transform">
            <span className="text-3xl">🌿</span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-ink mb-1">상온/냉장 상품</h3>
            <p className="text-sm text-ink-soft">과자, 라면, 음료, 생수 등 (유앤미)</p>
          </div>
        </button>

        <button
          onClick={() => onCategoryChange('SPCHAIN')}
          className="flex flex-col items-center justify-center gap-3 p-8 bg-white rounded-3xl border border-line shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <span className="text-3xl">🍺</span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-ink mb-1">주류 전용</h3>
            <p className="text-sm text-ink-soft">소주, 맥주, 양주 등 (생필체인)</p>
          </div>
        </button>
      </div>
    );
  }

  if (requireAuth && !isLoggedIn) {`;

content = content.replace('if (requireAuth && !isLoggedIn) {', categoryUI);

fs.writeFileSync(file, content, 'utf8');
console.log('Restored category UI');
