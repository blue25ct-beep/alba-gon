const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "export const AdminDashboard: React.FC = () => {",
    "export const AdminDashboard: React.FC<{ onThemeChange?: (theme: 'sage' | 'blue') => void; onTitleChange?: (title: string) => void }> = ({ onThemeChange, onTitleChange }) => {"
);

const useEffectBlock = `  useEffect(() => {
    if (tempFilter === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 알바곤 관리');
    } else if (tempFilter === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 알바곤 관리');
    } else {
      onThemeChange?.('sage');
      onTitleChange?.('🏢 편의점 알바곤 통합 관리');
    }
  }, [tempFilter, onThemeChange, onTitleChange]);`;

content = content.replace(
    "useEffect(() => {",
    `${useEffectBlock}\n\n  useEffect(() => {`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed AdminDashboard.tsx props');
