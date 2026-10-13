const fs = require('fs');

let workerFile = 'C:/Users/김진곤/Downloads/alba-gon/client/src/pages/WorkerApp.tsx';
let workerContent = fs.readFileSync(workerFile, 'utf8');

workerContent = workerContent.replace('export const WorkerApp: React.FC = () => {', 
`export const WorkerApp: React.FC<{
  selectedCategory?: 'YOUNME' | 'SPCHAIN' | null;
  onCategoryChange?: (cat: 'YOUNME' | 'SPCHAIN' | null) => void;
  onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void;
  onTitleChange?: (title: string) => void;
}> = ({ selectedCategory, onCategoryChange, onThemeChange, onTitleChange }) => {`);

fs.writeFileSync(workerFile, workerContent, 'utf8');
console.log('Fixed WorkerApp props');
