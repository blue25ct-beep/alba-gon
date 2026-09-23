const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const mapOld = `      cost: product ? product.cost : 0,
      price: product ? product.price : 0,
      status: 'PENDING',
    };
  });`;

const mapNew = `      cost: product ? product.cost : 0,
      price: product ? product.price : 0,
      status: 'PENDING',
      workerName: audit.workerName,
    };
  });`;

content = content.replace(mapOld, mapNew);

const renderOld = `                                  {item.productName}
                                </span>
                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                                  {item.barcode}`;

const renderNew = `                                  {item.productName}
                                  {item.workerName && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 align-middle">
                                      {item.workerName}
                                    </span>
                                  )}
                                </span>
                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                                  {item.barcode}`;

content = content.replace(renderOld, renderNew);

fs.writeFileSync(file, content, 'utf8');
console.log('Added workerName tag back to AdminDashboard');
