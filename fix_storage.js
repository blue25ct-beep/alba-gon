const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/services/storage.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  getOrderHistory(): OrderHistoryEntry[] {",
  "getOrderHistory(): OrderHistoryEntry[] {"
).replace(
  "  saveOrderHistory(history: OrderHistoryEntry[]): void {",
  "saveOrderHistory(history: OrderHistoryEntry[]): void {"
).replace(
  "  addOrderHistory(entry: OrderHistoryEntry): void {",
  "addOrderHistory(entry: OrderHistoryEntry): void {"
);

// I will just replace the specific ends of the methods to add commas.
content = content.replace("    return [];\n    }\n  }", "    return [];\n    }\n  },");
content = content.replace("      console.error('Failed to save order history', e);\n    }\n  }", "      console.error('Failed to save order history', e);\n    }\n  },");
content = content.replace("    this.saveOrderHistory(history);\n  }", "    this.saveOrderHistory(history);\n  },");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed commas in storage.ts');
