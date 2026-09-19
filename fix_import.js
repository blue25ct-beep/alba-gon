const fs = require('fs');
let fileApp = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/App.tsx';
let contentApp = fs.readFileSync(fileApp, 'utf8');

contentApp = contentApp.replace(
    "import { storageService } from './services/storage';",
    "import { storageService } from './services/storage';\nimport seedProducts from './data/seedProducts.json';"
);

contentApp = contentApp.replace(
    "const seed = require('./data/seedProducts.json');",
    "const seed = seedProducts as any[];"
);

fs.writeFileSync(fileApp, contentApp, 'utf8');
console.log('Fixed require to import');
