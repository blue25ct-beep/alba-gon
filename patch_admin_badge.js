const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{item.productName}
                                </span>`;
const replacement = `{item.productName}
                                  {item.workerName && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sunken border border-line text-ink-faint align-middle">
                                      👤 {item.workerName}
                                    </span>
                                  )}
                                </span>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added workerName badge to AdminDashboard');
