const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1559680394444673076/xC_ZlBnDBYpOTd2PGDcywLA4LdFEgGzQ3Hothe7wiEsPmNPkb7uoLbSb67f3wv-5PeNL';

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
