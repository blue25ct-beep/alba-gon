const fs = require('fs');
let fileWorker = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let contentWorker = fs.readFileSync(fileWorker, 'utf8');

contentWorker = contentWorker.replace(
    /const \[selectedCategory, onCategoryChange\] = useState<'YOUNME' \| 'SPCHAIN' \| null>\(null\);[\r\n\s]*/,
    ""
);
// Make sure onCategoryChange is called properly
contentWorker = contentWorker.replace(/onCategoryChange\(/g, "onCategoryChange?.(");
// Fix double optional chaining if any
contentWorker = contentWorker.replace(/onCategoryChange\?\.\(\?\.\(/g, "onCategoryChange?.(");

fs.writeFileSync(fileWorker, contentWorker, 'utf8');
console.log('Fixed WorkerApp.tsx state duplicate');
