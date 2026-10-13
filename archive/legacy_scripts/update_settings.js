const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/SettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('discordWebhookUrl')) {
  // State initialization
  content = content.replace(
    "const [workerName, setWorkerName] = useState(settings.workerName || '야간알바');",
    "const [workerName, setWorkerName] = useState(settings.workerName || '야간알바');\n  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(settings.discordWebhookUrl || '');"
  );

  // Save mapping
  content = content.replace(
    "managerPin: managerPin.trim() || '1234',\n      workerName: workerName.trim() || '야간알바',",
    "managerPin: managerPin.trim() || '1234',\n      workerName: workerName.trim() || '야간알바',\n      discordWebhookUrl: discordWebhookUrl.trim(),"
  );

  // Input UI
  const discordInput = `
          <div>
            <label className="block text-[13px] font-medium text-ink-faint mb-1.5 pl-1">디스코드 웹훅 URL (선택)</label>
            <input
              type="url"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
  `;
  content = content.replace(
    '<div>\n            <label className="block text-[13px] font-medium text-ink-faint mb-1.5 pl-1">',
    discordInput + '<div>\n            <label className="block text-[13px] font-medium text-ink-faint mb-1.5 pl-1">'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated SettingsModal.tsx');
}
