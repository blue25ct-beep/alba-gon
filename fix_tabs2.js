const fs = require('fs');
let file = 'C:/Users/김진곤/Downloads/alba-gon/client-spchain/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the broken syntax (the floating )} and spchain block start)
content = content.replace(
`        </section>

        )}
        {/* 생필체인 발주 섹션 */}
        {(tempFilter === 'ALL' || tempFilter === 'SPCHAIN') && (
        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">`,
`        </section>
        {/* 생필체인 발주 섹션 */}
        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">`
);

// 2. Remove the broken spchain block end
content = content.replace(
`          )}
        </section>
        )}
      </div>`,
`          )}
        </section>
      </div>`
);

// 3. Now properly wrap them!
content = content.replace(
    '{/* 유앤미 발주 섹션 */}\n        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">',
    '{/* 유앤미 발주 섹션 */}\n        {(tempFilter === "ALL" || tempFilter === "YOUNME") && (\n        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">'
);

content = content.replace(
    '        </section>\n        {/* 생필체인 발주 섹션 */}',
    '        </section>\n        )}\n        {/* 생필체인 발주 섹션 */}'
);

content = content.replace(
    '{/* 생필체인 발주 섹션 */}\n        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">',
    '{/* 생필체인 발주 섹션 */}\n        {(tempFilter === "ALL" || tempFilter === "SPCHAIN") && (\n        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">'
);

content = content.replace(
    '          )}\n        </section>\n      </div>',
    '          )}\n        </section>\n        )}\n      </div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed JSX structure!');
