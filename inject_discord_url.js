const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/SettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const stateRegex = /const \[workerName, setWorkerName\] = useState[^;]+;/;
if (!content.includes('discordWebhookUrl')) {
  content = content.replace(stateRegex, match => match + '\n  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(settings.discordWebhookUrl || \'\');');
  
  const saveRegex = /workerName: workerName\.trim\(\) \|\| [^,]+,/;
  content = content.replace(saveRegex, match => match + '\n      discordWebhookUrl: discordWebhookUrl.trim(),');
  
  const uiRegex = /<div className="grid grid-cols-2 gap-3">/;
  const discordInput = `
          <div>
            <label className="block text-[13px] font-medium text-ink-soft mb-1.5 pl-1">디스코드 웹훅 URL (알림용)</label>
            <input
              type="url"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>

          <div className="h-px bg-line my-4" />
`;
  content = content.replace(uiRegex, match => discordInput + '\n          ' + match);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully injected discord URL to SettingsModal.tsx!');
} else {
  console.log('Already injected!');
}
