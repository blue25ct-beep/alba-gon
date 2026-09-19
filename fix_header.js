const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add theme to props
content = content.replace(
    "  title?: string;\n}",
    "  title?: string;\n  theme?: 'sage' | 'blue';\n}"
);

// 2. Destructure theme
content = content.replace(
    "export const Header: React.FC<HeaderProps> = ({ currentMode, onSwitchMode, title }) => {",
    "export const Header: React.FC<HeaderProps> = ({ currentMode, onSwitchMode, title, theme = 'sage' }) => {"
);

// 3. Replace hardcoded blue colors with theme classes
const oldHeaderClass = 'className="bg-blue-600 text-white sticky top-0 z-30 shadow-md"';
const newHeaderClass = 'className={`text-white sticky top-0 z-30 shadow-md ${theme === "blue" ? "bg-blue-600" : "bg-sage-600"}`}';
content = content.replace(oldHeaderClass, newHeaderClass);

const oldIconClass = 'className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0"';
const newIconClass = 'className={`w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 ${theme === "blue" ? "text-blue-600" : "text-sage-600"}`}';
content = content.replace(oldIconClass, newIconClass);

content = content.replace(
    '<h1 className="font-bold text-[16px] text-white truncate">🍺 [주류 전용] 알바곤</h1>',
    '<h1 className="font-bold text-[16px] text-white truncate">{title || "편의점 알바곤"}</h1>'
);

content = content.replace(
    '<p className="text-[13px] text-blue-100 truncate">',
    '<p className={`text-[13px] truncate ${theme === "blue" ? "text-blue-100" : "text-sage-100"}`}>'
);

// Settings button
const oldSettingsBtn = 'className="w-9 h-9 rounded-full text-blue-100 hover:text-white hover:bg-blue-500 flex items-center justify-center transition-colors"';
const newSettingsBtn = 'className={`w-9 h-9 rounded-full hover:text-white flex items-center justify-center transition-colors ${theme === "blue" ? "text-blue-100 hover:bg-blue-500" : "text-sage-100 hover:bg-sage-500"}`}';
content = content.replace(oldSettingsBtn, newSettingsBtn);

// Admin button
const oldAdminBtn = 'className={`flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium transition-colors ${\n                currentMode === \'ADMIN\'\n                  ? \'text-blue-100 hover:text-white hover:bg-blue-500\'\n                  : \'bg-white text-blue-600 hover:bg-blue-50\'\n              }`}';
const newAdminBtn = 'className={`flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium transition-colors ${currentMode === "ADMIN" ? (theme === "blue" ? "text-blue-100 hover:text-white hover:bg-blue-500" : "text-sage-100 hover:text-white hover:bg-sage-500") : (theme === "blue" ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-white text-sage-600 hover:bg-sage-50")}`}';
content = content.replace(oldAdminBtn, newAdminBtn);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Header.tsx');
