import { Product, AuditItem, BarcodeAlias, OrderFailure, AppSettings } from '../types';
import seedProducts from '../data/seedProducts.json';
import seedAudits from '../data/seedAudits.json';
import * as XLSX from 'xlsx';

const KEYS = {
  PRODUCTS: 'albagom_products_v3',
  AUDITS: 'albagom_audits_v1',
  ALIASES: 'albagom_aliases_v1',
  FAILURES: 'albagom_failures_v1',
  SETTINGS: 'albagom_settings_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  managerPin: '1234',
  younmeId: '',
  younmePw: '',
  workerName: '?쇨컙?뚮컮',
  autoOrderEnabled: true,
};

export const storageService = {
  // --- ?곹뭹 留덉뒪??(Products) ---
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(KEYS.PRODUCTS);
      if (!data) {
        // 理쒖큹 ?ㅽ뻾 ??459媛??묒? 湲곕낯 ?곹뭹 ?깅줉
        const initial = seedProducts as Product[];
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return seedProducts as Product[];
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct(product: Product): void {
    const list = this.getProducts();
    const index = list.findIndex(p => p.barcode === product.barcode);
    if (index >= 0) {
      list[index] = { ...list[index], ...product };
    } else {
      list.unshift(product);
    }
    this.saveProducts(list);
  },

  updateProductMinOrderQty(barcode: string, minOrderQty: number): void {
    const safeVal = Math.max(1, minOrderQty);
    const list = this.getProducts();
    const idx = list.findIndex(p => p.barcode === barcode);
    if (idx >= 0) {
      list[idx].minOrderQty = safeVal;
      this.saveProducts(list);
    }
    const audits = this.getAudits();
    const aIdx = audits.findIndex(a => a.barcode === barcode);
    if (aIdx >= 0) {
      audits[aIdx].minOrderQty = safeVal;
      this.saveAudits(audits);
    }
  },

  updateProductTargetStock(barcode: string, targetStock: number): void {
    const safeVal = Math.max(0, targetStock);
    const list = this.getProducts();
    const idx = list.findIndex(p => p.barcode === barcode);
    if (idx >= 0) {
      list[idx].targetStock = safeVal;
      this.saveProducts(list);
    }
    const audits = this.getAudits();
    const aIdx = audits.findIndex(a => a.barcode === barcode);
    if (aIdx >= 0) {
      audits[aIdx].targetStock = safeVal;
      this.saveAudits(audits);
    }
  },

  findProduct(barcode: string): { product?: Product; alias?: BarcodeAlias } {
    const aliases = this.getAliases();
    const alias = aliases.find(a => a.oldBarcode === barcode);
    const targetBarcode = alias ? alias.newBarcode : barcode;

    const products = this.getProducts();
    const product = products.find(p => p.barcode === targetBarcode || p.barcode === barcode);

    return { product, alias };
  },

  // ?ъ옣???붿껌: 諛붿퐫??留덉?留?4~5?먮━ 鍮좊Ⅸ ?⑦꽩 留ㅼ묶 諛??곹뭹紐?寃??
  searchProductsByPattern(query: string, maxResults = 10): Product[] {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const products = this.getProducts();

    // 1. 諛붿퐫???앹옄由?Tail) ?뺥솗???쇱튂?섎뒗 ?곹뭹 (媛???믪? ?곗꽑?쒖쐞: ?? 60205 濡??앸굹???ъ뭅移?
    const tailMatches = products.filter(p => p.barcode.endsWith(q));

    // 2. 諛붿퐫??以묎컙???ы븿?섎뒗 ?곹뭹
    const barcodeMatches = products.filter(p => !p.barcode.endsWith(q) && p.barcode.includes(q));

    // 3. ?곹뭹紐낆뿉 寃?됱뼱媛 ?ы븿?섎뒗 ?곹뭹 (?쒓?/?곷Ц)
    const nameMatches = products.filter(p => 
      !p.barcode.includes(q) && p.name.toLowerCase().includes(q)
    );

    // ?곗꽑?쒖쐞 ?쒖꽌?濡??⑹튂怨?理쒕? 寃곌낵 媛쒖닔 諛섑솚
    return [...tailMatches, ...barcodeMatches, ...nameMatches].slice(0, maxResults);
  },

  // --- ?ш퀬 ?ㅼ궗 (Audits) ---
  getAudits(): AuditItem[] {
    try {
      const data = localStorage.getItem(KEYS.AUDITS);
      if (!data) {
        // 理쒖큹 ?묒냽 ???ъ옣?섏씠 ?묒뾽?섏떊 65嫄??ㅼ궗 ?덈ぉ 湲곕낯 ?묒옱!
        const initial = (seedAudits as unknown as AuditItem[]) || [];
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return (seedAudits as unknown as AuditItem[]) || [];
    }
  },

  saveAudits(audits: AuditItem[]): void {
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));
  },

  saveAudit(item: Omit<AuditItem, 'id' | 'updatedAt'>): AuditItem {
    const audits = this.getAudits();
    // 媛숈? 諛붿퐫?쒖쓽 ?ㅼ궗媛 ?대? ?덉쑝硫?理쒖떊 ?섎웾?쇰줈 ?낅뜲?댄듃
    const existingIndex = audits.findIndex(a => a.barcode === item.barcode);
    const updatedItem: AuditItem = {
      ...item,
      id: existingIndex >= 0 ? audits[existingIndex].id : Date.now().toString(),
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    if (existingIndex >= 0) {
      audits[existingIndex] = updatedItem;
    } else {
      audits.unshift(updatedItem);
    }
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));
    return updatedItem;
  },

  // ?ъ옣???붿껌: 諛붿퐫??踰덊샇???곹뭹紐낆쓣 ?ъ옣?섏씠 吏곸젒 ?낅젰/?깅줉?섏뿬 留덉뒪??諛?諛쒖＜?湲곗뿉 ?곴뎄 諛섏쁺
  registerProductName(barcode: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // 1. ?ㅼ궗 紐⑸줉(Audits)???곹뭹紐?媛깆떊 諛?isUnmapped ?댁젣
    const audits = this.getAudits().map(a => {
      if (a.barcode === barcode) {
        return {
          ...a,
          productName: trimmed,
          isUnmapped: false,
        };
      }
      return a;
    });
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));

    // 2. 留덉뒪???곹뭹(Products) 紐⑸줉??異붽? ?먮뒗 ?대쫫 ?섏젙 (?곴뎄 蹂닿?)
    const products = this.getProducts();
    const existingIdx = products.findIndex(p => p.barcode === barcode);
    if (existingIdx >= 0) {
      products[existingIdx].name = trimmed;
    } else {
      products.unshift({
        barcode,
        name: trimmed,
        category: '誘몃벑濡앹떊?곹뭹',
        price: 0,
        cost: 0,
        targetStock: 10,
        minOrderQty: 1,
      });
    }
    this.saveProducts(products);
  },

  deleteAudit(identifier: string): void {
    const audits = this.getAudits().filter(a => a.id !== identifier && a.barcode !== identifier);
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));
  },

  clearAudits(): void {
    localStorage.setItem(KEYS.AUDITS, JSON.stringify([]));
  },

  // --- ?泥?諛붿퐫??留ㅽ븨 (Aliases: 援ы삎 諛붿퐫???∽툘 ?좉퇋 諛쒖＜??諛붿퐫?? ---
  getAliases(): BarcodeAlias[] {
    try {
      const data = localStorage.getItem(KEYS.ALIASES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAliases(aliases: any): void { localStorage.setItem(KEYS.ALIASES, JSON.stringify(aliases)); }, saveAlias(alias: Omit<BarcodeAlias, 'id' | 'updatedAt'>): BarcodeAlias {
    const list = this.getAliases();
    const existingIndex = list.findIndex(a => a.oldBarcode === alias.oldBarcode);
    const item: BarcodeAlias = {
      ...alias,
      id: existingIndex >= 0 ? list[existingIndex].id : Date.now().toString(),
      updatedAt: new Date().toLocaleDateString('ko-KR'),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(KEYS.ALIASES, JSON.stringify(list));
    return item;
  },

  deleteAlias(id: string): void {
    const list = this.getAliases().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ALIASES, JSON.stringify(list));
  },

  // --- 諛쒖＜ ?ㅽ뙣 愿由ы븿 (Failures: ????젣 諛??ъ떆??吏?? ---
  getOrderFailures(): OrderFailure[] {
    try {
      const data = localStorage.getItem(KEYS.FAILURES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addOrderFailures(failures: OrderFailure[]): void {
    const current = this.getOrderFailures();
    const merged = [...failures, ...current];
    localStorage.setItem(KEYS.FAILURES, JSON.stringify(merged));
  },

  deleteOrderFailure(id: string): void {
    const list = this.getOrderFailures().filter(f => f.id !== id);
    localStorage.setItem(KEYS.FAILURES, JSON.stringify(list));
  },

  clearOrderFailures(): void {
    localStorage.removeItem(KEYS.FAILURES);
  },

  // --- ?쒖뒪???ㅼ젙 (Settings: ?좎븻誘??꾩씠??鍮꾨쾲, 4?먮━ PIN - ?덉쟾???뷀샇????? ---
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const raw = JSON.parse(data);
      // 鍮꾨?踰덊샇 蹂듯샇??(?뷀샇臾?prefix 'enc:' ?뺤씤)
        if (raw.younmePw && raw.younmePw.startsWith('enc:')) {
          try {
            const decoded = atob(raw.younmePw.replace('enc:', ''));
            raw.younmePw = decodeURIComponent(escape(decoded));
          } catch {}
        }

        if (raw.workerName && (raw.workerName.includes('?') || raw.workerName.includes('켑') || raw.workerName.includes('뚮'))) {
          raw.workerName = '주간알바';
          localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...raw }));
        }

        return { ...DEFAULT_SETTINGS, ...raw };
      } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    
    // 濡쒖뺄?ㅽ넗由ъ??먮뒗 ?뷀샇?붾맂 ?뺥깭濡쒕쭔 蹂닿? (?뚮컮??F12 媛쒕컻?먮룄援щ줈 ?됰Ц ?몄텧 諛⑹?)
    const toStore = { ...updated };
    if (toStore.younmePw) {
      try {
        const encoded = btoa(unescape(encodeURIComponent(toStore.younmePw)));
        toStore.younmePw = `enc:${encoded}`;
      } catch {}
    }

    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(toStore));
    return updated;
  },

  // --- 怨쇨굅 諛쒖＜ ?묒? ?뚯떛 諛?留덉뒪??DB ?낅뜲?댄듃 ---
  async importExcelFile(file: File): Promise<{ count: number; duplicates: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let parsedProducts: Product[] = [];

          // ?좎븻誘?4 HTML ?뺤떇 ?묒? ?뚯떛 (HTML Table)
          if (text.includes('<table') || text.includes('<TABLE')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const rows = doc.querySelectorAll('tr');
            
            rows.forEach((row, idx) => {
              if (idx < 2) return; // ?쒕ぉ 諛??ㅻ뜑 ???ㅽ궢
              const cells = row.querySelectorAll('td');
              if (cells.length >= 6) {
                const barcode = cells[2]?.textContent?.trim() || '';
                const name = cells[3]?.textContent?.trim() || '';
                const price = parseInt(cells[4]?.textContent?.replace(/[^0-9]/g, '') || '0', 10);
                const cost = parseInt(cells[5]?.textContent?.replace(/[^0-9]/g, '') || '0', 10);
                
                if (barcode && barcode.length >= 7 && name) {
                  parsedProducts.push({
                    barcode,
                    name,
                    price,
                    cost,
                    category: '湲고?',
                    targetStock: 10,
                    minOrderQty: 10,
                  });
                }
              }
            });
          } else {
            // ?쇰컲 諛붿씠?덈━ XLSX / XLS ?뚯떛
            const workbook = XLSX.read(text, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row.length >= 2) {
                const barcode = String(row[0] || '').trim();
                const name = String(row[1] || '').trim();
                if (barcode.length >= 7) {
                  parsedProducts.push({
                    barcode,
                    name,
                    price: Number(row[2]) || 0,
                    cost: Number(row[3]) || 0,
                    category: '湲고?',
                    targetStock: 10,
                    minOrderQty: 10,
                  });
                }
              }
            }
          }

          // 湲곗〈 留덉뒪??DB? 蹂묓빀
          const current = this.getProducts();
          const map = new Map<string, Product>();
          current.forEach(p => map.set(p.barcode, p));
          
          let addedCount = 0;
          parsedProducts.forEach(p => {
            if (!map.has(p.barcode)) {
              addedCount++;
            }
            map.set(p.barcode, { ...map.get(p.barcode), ...p });
          });

          const merged = Array.from(map.values());
          this.saveProducts(merged);
          resolve({ count: parsedProducts.length, duplicates: parsedProducts.length - addedCount });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      // HTML ?묒???寃쎌슦 ?띿뒪?몃줈, ?꾨땶 寃쎌슦 諛붿씠?덈━濡??쎄린
      reader.readAsText(file, 'euc-kr');
    });
  },
};



