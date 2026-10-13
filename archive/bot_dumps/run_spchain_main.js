const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const iconv = require('iconv-lite');

const postData = querystring.stringify({
  loginFlag: 'Y',
  id: '047458',
  passWord: '0474581227'
});

const options = {
  hostname: 'etop.spchain.co.kr',
  port: 446,
  path: '/order/order_login.do',
  method: 'POST',
  rejectUnauthorized: false,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let cookies = res.headers['set-cookie'] || [];
  let cookieString = cookies.map(c => c.split(';')[0]).join('; ');
  
  res.on('data', chunk => {});
  res.on('end', () => {
    https.get('https://etop.spchain.co.kr:446/order/OrderListAll.do', {
      rejectUnauthorized: false,
      headers: { 'Cookie': cookieString }
    }, (res2) => {
      let chunks = [];
      res2.on('data', chunk => chunks.push(chunk));
      res2.on('end', () => {
        const decoded = iconv.decode(Buffer.concat(chunks), 'EUC-KR');
        fs.writeFileSync('spchain_order_list.html', decoded, 'utf8');
        console.log('Saved spchain_order_list.html');
      });
    });
  });
});

req.write(postData);
req.end();
