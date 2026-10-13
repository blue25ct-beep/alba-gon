const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<a\s+href=\{`https:\/\/www\.coupang\.com\/np\/search\?component=&q=\$\{encodeURIComponent\(item\.productName\.replace\('쿠팡\]', ''\)\.replace\('CP\]', ''\)\.trim\(\)\)\}`\}\s+target="_blank"\s+rel="noreferrer"/;

const replacement = `<button
                                    onClick={() => {
                                      const url = \`https://www.coupang.com/np/search?q=\${encodeURIComponent(item.productName.replace('쿠팡]', '').replace('CP]', '').trim())}\`;
                                      const w = window.open('', '_blank');
                                      if (w) w.location.href = url;
                                    }}`;

content = content.replace(regex, replacement);
content = content.replace('쿠팡 구매 링크\n                                  </a>', '쿠팡 구매 링크\n                                  </button>');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Coupang link block issue');
