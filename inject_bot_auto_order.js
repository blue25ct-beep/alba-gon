const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/bot/src/unifiedBot.js';
let content = fs.readFileSync(file, 'utf8');

const targetConstStr = 'const PRODUCTS_BACKUP_FILE = path.join(__dirname, \'..\', \'products_backup.json\');';
const newConstStr = `const PRODUCTS_BACKUP_FILE = path.join(__dirname, '..', 'products_backup.json');
const TOPIC_SETTINGS_1060 = \`albagom-v2/sync/store_1060/settings\`;
const SETTINGS_BACKUP_FILE = path.join(__dirname, '..', 'settings_backup.json');
const TOPIC_AUTO_ORDER_1060 = \`albagom-v2/sync/store_1060/auto_order_eval\`;`;

const targetSubStr = 'client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN, TOPIC_AUTH_1060, TOPIC_SYNC_1060, TOPIC_PROD_1060]);';
const newSubStr = 'client.subscribe([TOPIC_REQ_YOUNME, TOPIC_REQ_SPCHAIN, TOPIC_AUTH_1060, TOPIC_SYNC_1060, TOPIC_PROD_1060, TOPIC_SETTINGS_1060, TOPIC_AUTO_ORDER_1060]);';

const targetMsgStr = `  if (topic === TOPIC_PROD_1060) {
      try { fs.writeFileSync(PRODUCTS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }`;

const newMsgStr = `  if (topic === TOPIC_PROD_1060) {
      try { fs.writeFileSync(PRODUCTS_BACKUP_FILE, message.toString(), 'utf8'); } catch(e){}
      return;
  }
  
  if (topic === TOPIC_SETTINGS_1060) {
      try { 
        fs.writeFileSync(SETTINGS_BACKUP_FILE, message.toString(), 'utf8');
        console.log('[자동발주] 점장님 계정 정보(설정)가 봇에 안전하게 동기화되었습니다.');
      } catch(e){}
      return;
  }
  
  if (topic === TOPIC_AUTO_ORDER_1060) {
      try {
        const payload = JSON.parse(message.toString());
        const { audits, workerName, category } = payload;
        
        let settings = {};
        try { settings = JSON.parse(fs.readFileSync(SETTINGS_BACKUP_FILE, 'utf8')); } catch(e) {}
        
        let products = [];
        try { products = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf8')); } catch(e) {}
        
        const discordWebhookUrl = settings.discordWebhookUrl || '';
        
        const sendDiscord = (msg) => {
          if (!discordWebhookUrl) return;
          fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: msg })
          }).catch(()=>{});
        };
        
        // 검증 시작
        let unverifiedItems = [];
        let orderList = [];
        
        for (const audit of audits) {
          if (audit.isUnmapped) {
            unverifiedItems.push(audit.productName || '미등록 상품');
            continue;
          }
          const product = products.find(p => p.barcode === audit.barcode);
          if (!product || !product.updatedAt) {
            unverifiedItems.push(audit.productName || '알 수 없는 상품');
            continue;
          }
          
          const orderQty = Math.max(0, product.targetStock - audit.stockCount);
          if (orderQty > 0) {
            const remainder = orderQty % product.minOrderQty;
            const finalQty = remainder === 0 ? orderQty : orderQty + (product.minOrderQty - remainder);
            orderList.push({
              productName: product.name,
              barcode: product.barcode,
              orderQty: finalQty,
              targetStock: product.targetStock,
              stockCount: audit.stockCount,
              price: product.price,
              cost: product.cost,
              category: product.category,
              vendor: product.vendor,
            });
          }
        }
        
        const vendorLabel = category === 'SPCHAIN' ? '생필체인' : '유앤미24';
        
        if (unverifiedItems.length > 0) {
          sendDiscord(\`⚠️ **[자동발주 실패]** 점장님이 세팅(검수)하지 않은 신상품이 \` + unverifiedItems.length + \`개 섞여있습니다. 수동 발주가 필요합니다! (예: \` + unverifiedItems[0] + \` 등)\`);
          console.log(\`[자동발주 중단] 미검수 상품 발견: \${unverifiedItems.length}개\`);
        } else {
          if (orderList.length === 0) {
            sendDiscord(\`✅ **[자동발주 스킵]** 스캔된 상품 모두 재고가 충분하여 발주할 항목이 없습니다.\`);
            console.log(\`[자동발주 스킵] 발주 필요 수량 0\`);
          } else {
            sendDiscord(\`🤖 **[자동발주 시작]** 모든 상품 검수 확인! 봇이 \` + vendorLabel + \` 발주를 시작합니다. (발주 품목: \` + orderList.length + \`개)\`);
            console.log(\`[자동발주 시작] 안전한 상품들로 구성됨. 스크립트 실행 대기중...\`);
            
            // 유앤미 봇 스크립트 실행 트리거 (기존 로직 재활용)
            // 내부 이벤트로 다시 message emit 처리
            if (category !== 'SPCHAIN' && settings.younmeId && settings.younmePw) {
               const dummyMessage = JSON.stringify({
                 orderList: orderList,
                 younmeId: settings.younmeId,
                 younmePw: settings.younmePw
               });
               // Self-emit to trigger the existing order execution logic!
               client.emit('message', TOPIC_REQ_YOUNME, dummyMessage);
            } else if (category === 'SPCHAIN') {
               // 생필체인은 아직 자동화 미지원
               sendDiscord(\`⚠️ **[자동발주 중단]** 생필체인은 아직 봇 자동 발주가 지원되지 않습니다. 수동으로 진행해주세요.\`);
            } else {
               sendDiscord(\`⚠️ **[자동발주 실패]** 봇에 유앤미 계정 정보(ID/PW)가 저장되어 있지 않습니다. 설정에서 다시 저장해주세요!\`);
            }
          }
        }
      } catch(e) {
        console.error('자동 발주 검토 중 오류:', e);
      }
      return;
  }`;

content = content.replace(targetConstStr, newConstStr);
content = content.replace(targetSubStr, newSubStr);
content = content.replace(targetMsgStr, newMsgStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Injected Auto Order logic to unifiedBot.js');
