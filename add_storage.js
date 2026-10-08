const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import { Product, AuditItem, AppSettings, BarcodeAlias } from '../types';`;
const newImport = `import { Product, AuditItem, AppSettings, BarcodeAlias, OrderHistoryEntry } from '../types';`;
if (content.includes(importTarget)) {
  content = content.replace(importTarget, newImport);
}

const keysTarget = `  ALIASES: 'albagon_aliases',`;
const newKeys = `  ALIASES: 'albagon_aliases',
  ORDER_HISTORY: 'albagon_order_history',`;
if (!content.includes('ORDER_HISTORY')) {
  content = content.replace(keysTarget, newKeys);
}

const methodsToAdd = `
  getOrderHistory(): OrderHistoryEntry[] {
    try {
      const data = localStorage.getItem(KEYS.ORDER_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveOrderHistory(history: OrderHistoryEntry[]): void {
    try {
      // Limit to 100 entries to prevent local storage bloat
      const trimmed = history.slice(0, 100);
      localStorage.setItem(KEYS.ORDER_HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save order history', e);
    }
  }

  addOrderHistory(entry: OrderHistoryEntry): void {
    const history = this.getOrderHistory();
    history.unshift(entry); // Add to beginning
    this.saveOrderHistory(history);
  }
`;

if (!content.includes('getOrderHistory()')) {
  content = content.replace('  getProducts(): Product[] {', methodsToAdd + '\n  getProducts(): Product[] {');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added order history methods to storage.ts');
}
