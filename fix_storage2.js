const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('OrderHistoryEntry')) {
  content = content.replace(
    "import { Product, AuditItem, AppSettings, BarcodeAlias } from '../types';", 
    "import { Product, AuditItem, AppSettings, BarcodeAlias, OrderHistoryEntry } from '../types';"
  );
}

if (!content.includes('ORDER_HISTORY:')) {
  content = content.replace(
    "ALIASES: 'albagon_aliases',",
    "ALIASES: 'albagon_aliases',\n  ORDER_HISTORY: 'albagon_order_history',"
  );
}

fs.writeFileSync(file, content, 'utf8');
