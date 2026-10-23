const fs = require('fs');
const path = require('path');

function getWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DISCORD_WEBHOOK_URL=')) {
        return trimmed.replace('DISCORD_WEBHOOK_URL=', '').trim();
      }
    }
  }
  return 'https://discord.com/api/webhooks/1563176287529603145/XnpuqrIQek_oIn750tfeJ7bseLgW_dHvoF7bblGeWIENVLqfL26s7U1ZVBlHCKWoZs4H';
}

const DISCORD_WEBHOOK_URL = getWebhookUrl();

async function sendNotification(summaryText) {
  const content = summaryText || process.argv.slice(2).join(' ') || '작업이 완료되었습니다.';
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const payload = {
    content: `🤖 **[안티그레비티 작업 완료 보고]**\n• **완료 시각**: ${now}\n• **내용**:\n${content}`
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`디스코드 전송 실패: HTTP ${res.status}`);
    } else {
      console.log('✅ 디스코드 작업 완료 알림 전송 성공');
    }
  } catch (err) {
    console.error('디스코드 전송 오류:', err.message);
  }
}

if (require.main === module) {
  const text = process.argv.slice(2).join(' ');
  sendNotification(text);
}

module.exports = { sendNotification };
