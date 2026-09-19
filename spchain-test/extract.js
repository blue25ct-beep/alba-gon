const html = require('fs').readFileSync('C:/Users/김진곤/search_results.html', 'utf8');
const match = html.match(/<form[^>]*name=["']form1_[^>]*>[\s\S]*?<\/form>/i);
if(match) console.log(match[0]);
else {
    const list = html.match(/참이슬[\s\S]{0,500}/gi);
    if(list) console.log(list.slice(1,2)[0]);
}
