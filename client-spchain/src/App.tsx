import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WorkerApp } from './pages/WorkerApp';
import { AdminDashboard } from './pages/AdminDashboard';
import { storageService } from './services/storage';
import seedProducts from './data/seedProducts.json';

export function App() {
  const [mode, setMode] = useState<'WORKER' | 'ADMIN'>('WORKER');
  const [selectedCategory, setSelectedCategory] = useState<'YOUNME' | 'SPCHAIN' | null>(null);
  const [theme, setTheme] = useState<'sage' | 'blue' | 'neutral'>('neutral');
  const [title, setTitle] = useState('편의점 자동발주');

  useEffect(() => {
    // Force update DB with latest seedProducts (migration)
    const current = storageService.getProducts();
    const seed = seedProducts as any[];
    const merged = [...current];
    let changed = false;
    for (const s of seed) {
      const idx = merged.findIndex(p => p.barcode === s.barcode);
      if (idx === -1) {
        merged.push(s);
        changed = true;
      } else {
        if (merged[idx].category !== s.category && s.category === '주류') {
          merged[idx].category = '주류';
          merged[idx].minOrderQty = s.minOrderQty;
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
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-sage-100">
      <Header currentMode={mode} onSwitchMode={setMode} theme={theme} title={title} />
      <main className="flex-1 w-full">
        {mode === 'WORKER' ? <WorkerApp selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} /> : <AdminDashboard initialCategory={selectedCategory} onThemeChange={setTheme} onTitleChange={setTitle} />}
      </main>
    </div>
  );
}

export default App;
