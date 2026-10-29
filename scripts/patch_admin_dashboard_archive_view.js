const fs = require('fs');

let adminCode = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

// 1. Declare state right after orderHistory
const targetState = "  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => storageService.getOrderHistory());";
const replacementState = `  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => storageService.getOrderHistory());
  const [archivedAudits, setArchivedAudits] = useState<Record<string, AuditItem[]>>({});
  const [expandedArchiveDate, setExpandedArchiveDate] = useState<string | null>(null);`;

if (!adminCode.includes('expandedArchiveDate, setExpandedArchiveDate')) {
  adminCode = adminCode.replace(targetState, replacementState);
}

// 2. Fix type in fetch
adminCode = adminCode.replace(
  "setArchivedAudits(prev => ({ ...d.archives, ...prev }));",
  "setArchivedAudits(prev => ({ ...d.archives, ...prev } as Record<string, AuditItem[]>));"
);

// 3. Fix type annotations in JSX
adminCode = adminCode.replace(
  ".map(([dateKey, items]) => {",
  ".map(([dateKey, rawItems]) => {\n                        const items = rawItems as AuditItem[];"
);

adminCode = adminCode.replace(
  "{items.map((it, idx) => (",
  "{items.map((it: AuditItem, idx: number) => ("
);

fs.writeFileSync('client/src/pages/AdminDashboard.tsx', adminCode, 'utf8');
console.log('AdminDashboard state and types fixed');
