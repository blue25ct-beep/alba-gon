const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Product, AuditItem, BarcodeAlias, OrderFailure, AppSettings } from '../types';",
  "import { Product, AuditItem, BarcodeAlias, OrderFailure, AppSettings, OrderHistoryEntry } from '../types';"
);

content = content.replace(
  "FAILURES: 'albagom_failures_v1',",
  "FAILURES: 'albagom_failures_v1',\n  ORDER_HISTORY: 'albagom_order_history_v1',"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed storage.ts imports and keys');
