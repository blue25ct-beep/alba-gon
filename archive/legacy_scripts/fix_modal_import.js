const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/ProductStockSetupModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('analyzeAndRecommend')) {
  content = content.replace(
    "import { storageService } from '../services/storage';",
    "import { storageService } from '../services/storage';\nimport { analyzeAndRecommend } from '../services/smartRecommendation';"
  );
  fs.writeFileSync(file, content, 'utf8');
}
