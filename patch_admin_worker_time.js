const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add mapping
const oldMapping = `      price: product ? product.price : 0,
      status: 'PENDING',
    };
  });`;

const newMapping = `      price: product ? product.price : 0,
      status: 'PENDING',
      workerName: audit.workerName,
      updatedAt: audit.updatedAt,
    };
  });`;

content = content.replace(oldMapping, newMapping);

// 2. Add UI
const oldUI = `                                >
                                  {item.productName}
                                </span>
                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">`;

const newUI = `                                >
                                  {item.productName}
                                  {item.workerName && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 align-middle whitespace-nowrap">
                                      👤 {item.workerName} {item.updatedAt ? \`(\${item.updatedAt.replace(/:\d{2}$/, '')})\` : ''}
                                    </span>
                                  )}
                                </span>
                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">`;

content = content.replace(oldUI, newUI);

fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully patched AdminDashboard.tsx to show worker name and time');
