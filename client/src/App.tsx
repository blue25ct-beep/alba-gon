import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WorkerApp } from './pages/WorkerApp';
import { AdminDashboard } from './pages/AdminDashboard';
import { storageService } from './services/storage';
import seedProducts from './data/seedProducts.json';
import { RefreshCw } from 'lucide-react';

declare const __BUILD_TIME__: string;

export function App() {
  const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');
  const [selectedCategory, setSelectedCategory] = useState<'YOUNME' | 'CHILLED' | 'SPCHAIN' | null>(null);
  const [theme, setTheme] = useState<'sage' | 'blue' | 'neutral'>('neutral');
  const [title, setTitle] = useState('재고 & 발주 관리');
  const [newVersionTime, setNewVersionTime] = useState<string | null>(null);

  // 자동 버전 체크 & 캐시 버스팅 (아이폰/모바일 환경 구버전 고착 방지)
  useEffect(() => {
    const checkVersion = () => {
      fetch(`./version.json?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data && data.buildTime && typeof __BUILD_TIME__ !== 'undefined') {
            if (data.buildTime !== __BUILD_TIME__) {
              setNewVersionTime(data.buildTime);
            }
          }
        })
        .catch(() => {});
    };

    checkVersion();
    const interval = setInterval(checkVersion, 60000); // 1분마다 버전 체크
    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleForceUpdate = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).finally(() => {
        globalThis.location.reload();
      });
    } else {
      globalThis.location.reload();
    }
  };

  useEffect(() => {
    // Force update DB with latest seedProducts (migration + prune removed items)
    const current = storageService.getProducts();
    const customized = storageService.getCustomizedSettings();
    const seed = seedProducts as any[];
    const seedBarcodes = new Set(seed.map((s) => s.barcode));
    let changed = false;

    // 1. 시드에서 삭제된 구형/단종 상품은 로컬 캐시에서도 정리 (사용자가 직접 등록한 신상품/쿠팡 상품은 보존)
    const merged = current.filter((p) => {
      if (seedBarcodes.has(p.barcode)) return true;
      const isUserCreated =
        p.isNewProduct ||
        p.category === '미등록신상품' ||
        Boolean(p.name && (p.name.startsWith('CP]') || p.name.includes('쿠팡]')));
      if (!isUserCreated) {
        changed = true;
        return false;
      }
      return true;
    });

    for (const s of seed) {
      const idx = merged.findIndex(p => p.barcode === s.barcode);
      if (idx === -1) {
        merged.push(s);
        changed = true;
      } else {
        const cust = customized[s.barcode];
        if (merged[idx].category !== s.category && s.category) {
          merged[idx].category = s.category;
          changed = true;
        }
        if (s.vendor && merged[idx].vendor !== s.vendor) {
          merged[idx].vendor = s.vendor;
          changed = true;
        }
        if (s.isDPlus1 && !merged[idx].isDPlus1) {
          merged[idx].isDPlus1 = true;
          changed = true;
        }
        if (s.minOrderQty && merged[idx].minOrderQty !== s.minOrderQty && cust?.minOrderQty === undefined) {
          merged[idx].minOrderQty = s.minOrderQty;
          changed = true;
        }
        if (s.cost && merged[idx].cost !== s.cost) {
          merged[idx].cost = s.cost;
          changed = true;
        }
        if (merged[idx].targetStock === 10 && s.targetStock === 1) {
          merged[idx].targetStock = 1;
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem('albagom_products_v3', JSON.stringify(merged));
    }
    
    // Migrate audits targetStock & minOrderQty
    const auditsStr = localStorage.getItem('albagom_audits_v1');
    if (auditsStr) {
      try {
        const audits = JSON.parse(auditsStr);
        let auditsChanged = false;
        for (const a of audits) {
          const p = merged.find(x => x.barcode === a.barcode);
          if (p) {
            if (a.targetStock === 10 && p.targetStock === 1) {
              a.targetStock = 1;
              auditsChanged = true;
            }
            if (p.minOrderQty && a.minOrderQty !== p.minOrderQty) {
              a.minOrderQty = p.minOrderQty;
              auditsChanged = true;
            }
          }
        }
        if (auditsChanged) {
          localStorage.setItem('albagom_audits_v1', JSON.stringify(audits));
        }
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-sage-100">
      {/* 새 버전 업데이트 알림 배너 (아이폰 홈화면 앱에서도 즉시 갱신 가능) */}
      {newVersionTime && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md z-50 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>새로운 시스템 버전이 업데이트되었습니다!</span>
          </div>
          <button
            onClick={handleForceUpdate}
            className="bg-white text-amber-700 px-3 py-1 rounded-full font-extrabold hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>지금 새로고침</span>
          </button>
        </div>
      )}

      <Header currentMode={mode} onSwitchMode={setMode} theme={theme} title={title} />
      <main className="flex-1 w-full">
        {mode === 'WORKER' ? <WorkerApp selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} onSwitchMode={setMode} /> : <AdminDashboard initialCategory={selectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} />}
      </main>
    </div>
  );
}

export default App;
