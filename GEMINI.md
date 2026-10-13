# Antigravity Workspace Guidelines

## 📢 [필수] 작업 완료 시 디스코드 자동 알림 전송 규칙
사용자의 작업 요청을 처리하고 변경 사항을 완료할 때마다, 사용자에게 최종 응답하기 직전에 반드시 아래 디스코드 웹훅으로 작업 완료 보고를 전송한다.

### 전송 방법
터미널에서 아래 스크립트를 실행한다:
```powershell
node scripts/notify_discord.js "작업 요약 내용"
```

### 웹훅 정보
- **URL**: `https://discord.com/api/webhooks/1559680394444673076/xC_ZlBnDBYpOTd2PGDcywLA4LdFEgGzQ3Hothe7wiEsPmNPkb7uoLbSb67f3wv-5PeNL`
- **스크립트 위치**: `scripts/notify_discord.js`
