const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/main.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('window.addEventListener("error"')) {
    content = `
window.addEventListener("error", (e) => {
  document.body.innerHTML += '<div style="color:red; background:white; padding: 20px; z-index:9999; position:fixed; top:0; left:0; right:0;">Error: ' + e.message + ' <br> ' + e.error?.stack + '</div>';
});
` + content;
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Error handler injected.');
