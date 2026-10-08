const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const newType = `
export interface OrderHistoryEntry {
  id: string;
  orderDate: string;
  vendor: 'YOUNME' | 'SPCHAIN';
  items: OrderItem[];
  totalAmount?: number;
}
`;

if (!content.includes('OrderHistoryEntry')) {
  content += '\n' + newType;
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added OrderHistoryEntry to types.ts');
}
