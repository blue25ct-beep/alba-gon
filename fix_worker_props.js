const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/WorkerApp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "export const WorkerApp: React.FC = () => {",
    "export const WorkerApp: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {"
);

// Add useEffect for theme change
const useEffectBlock = `  useEffect(() => {
    if (selectedCategory === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤');
    } else {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤');
    }
  }, [selectedCategory, onThemeChange, onTitleChange]);`;

content = content.replace(
    "useEffect(() => {",
    `${useEffectBlock}\n\n  useEffect(() => {`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed WorkerApp.tsx props');
