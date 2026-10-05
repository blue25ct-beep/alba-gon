const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/OrderFailureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldDetail = `                    {f.failDetail && (
                      <p className="mt-1 text-[13px] text-ink-soft leading-relaxed break-keep">
                        {f.failDetail}
                      </p>
                    )}`;

const newDetail = `                    {f.failDetail && (
                      <p className="mt-1 text-[13px] text-ink-soft leading-relaxed break-keep">
                        {f.failDetail}
                      </p>
                    )}
                    {f.failScreenshot && (
                      <div className="mt-2">
                        <img 
                          src={f.failScreenshot} 
                          alt="에러 스크린샷" 
                          className="w-full max-w-[200px] rounded-lg border border-line cursor-pointer" 
                          onClick={() => window.open(f.failScreenshot, '_blank')}
                        />
                      </div>
                    )}`;

if (!content.includes('failScreenshot')) {
    content = content.replace(oldDetail, newDetail);
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Added failScreenshot to OrderFailureModal');
