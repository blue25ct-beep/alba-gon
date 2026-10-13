const { execSync } = require('child_process');
const fs = require('fs');

function findGit() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;
  const ghDesktopPath = localAppData + '\\\\GitHubDesktop';
  if (!fs.existsSync(ghDesktopPath)) return null;
  
  const apps = fs.readdirSync(ghDesktopPath).filter(d => d.startsWith('app-')).sort().reverse();
  for (const app of apps) {
    const gitPath = ghDesktopPath + '\\\\' + app + '\\\\resources\\\\app\\\\git\\\\cmd\\\\git.exe';
    if (fs.existsSync(gitPath)) {
      return gitPath;
    }
  }
  return null;
}

const gitExe = findGit();
if (gitExe) {
  try {
    execSync('"' + gitExe + '" checkout ce2d493 -- .', { cwd: 'C:/Users/김진곤/Downloads/alba-gon' });
    console.log('Restored files to ce2d493');

    let indexFile = 'C:/Users/김진곤/Downloads/alba-gon/client/index.html';
    let indexContent = fs.readFileSync(indexFile, 'utf8');
    // use string split join
    indexContent = indexContent.split('<title>편의점 통합 자동발주</title>').join('<title>블루24 시타딘호텔점 - 재고관리 & 발주</title>');
    indexContent = indexContent.split('<title>주류발주 전용 자동발주 (테스트)</title>').join('<title>블루24 시타딘호텔점 - 재고관리 & 발주</title>');
    fs.writeFileSync(indexFile, indexContent, 'utf8');
    console.log('Re-applied title change');

    let engineFile = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/orderEngine.js';
    let engineContent = fs.readFileSync(engineFile, 'utf8');
    
    // just string replacement
    const targetStr = "const addPath = `/${folder}/orderAdd.asp?order_dev=j&dev=${determinedCs}&order_type=1&pcode=${targetBarcode}&quantity=${item.finalOrderQty}&unit=${determinedUnit}&price=${determinedPrice}&order_date=${orderDate}&valid=y`;";
    const replaceStr = `// product_name 파라미터 추가 (유앤미 본사 사이트 누락 방지)
      const escapedName = escape(item.productName.replace(/\\+/g, '***'));
      const addPath = \`/\${folder}/orderAdd.asp?order_dev=j&dev=\${determinedCs}&order_type=1&pcode=\${targetBarcode}&quantity=\${item.finalOrderQty}&unit=\${determinedUnit}&price=\${determinedPrice}&order_date=\${orderDate}&product_name=\${escapedName}&valid=y\`;`;
    
    engineContent = engineContent.replace(targetStr, replaceStr);
    fs.writeFileSync(engineFile, engineContent, 'utf8');
    console.log('Re-applied product name fix');

  } catch(e) {
    console.log('Error', e.message);
  }
}
