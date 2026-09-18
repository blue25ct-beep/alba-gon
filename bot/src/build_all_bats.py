# -*- coding: utf-8 -*-
import os

b_installer = """@echo off
chcp 949 > nul
title [?몄쓽???뚮컮怨? 1遺??먮룞 ?ㅼ튂 ?꾩슦誘?

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 ?먮룞 諛쒖＜ ?꾨줈洹몃옩 ?ㅼ튂
echo ========================================================
echo.
echo   [1?④퀎] 而댄벂?곗뿉 ?꾩닔 ?꾨줈洹몃옩(Node.js)???덈뒗吏 寃?ы빀?덈떎...
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo [?뚮┝] Node.js 媛 ?꾩쭅 ?ㅼ튂?섏? ?딆븯?듬땲??
    echo.
    echo ??釉뚮씪?곗?媛 ?대━硫?珥덈줉??[LTS 踰꾩쟾] 踰꾪듉???뚮윭 ?ㅼ슫諛쏆쑝????
    echo ?ㅼ튂 李쎌뿉??'Next'留?怨꾩냽 ?꾨Ⅴ怨?而댄벂?곕? ??踰?猿먮떎 耳쒖＜?몄슂.
    echo.
    start https://nodejs.org/ko
    pause
    exit /b
)

echo [?깃났] Node.js ?뺤긽 ?ㅼ튂 ?뺤씤 ?꾨즺!
echo.
echo [2?④퀎] 諛쒖＜ ?꾨줈洹몃옩???꾩슂???꾩닔 遺?덈뱾???ㅼ튂?⑸땲??..
echo (?명꽣???띾룄???곕씪 ??10珥?30珥??뚯슂?⑸땲??
echo.

cd /d "%~dp0bot"
call npm install --no-audit --no-fund

echo.
echo [3?④퀎] ?좎븻誘?4 怨꾩젙 ?ㅼ젙 ?뚯씪(.env)???뺤씤?⑸땲??..
echo.

cd /d "%~dp0"
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
    ) else (
        echo YOUNME_USER_ID=1060 > .env
        echo YOUNME_PASSWORD=?ш린???좎븻誘몃퉬諛踰덊샇_?낅젰 >> .env
    )
)

echo --------------------------------------------------------
echo ??以묒슂: ?붾㈃??硫붾え??李쎌씠 ?대졇?듬땲??
echo   1) ?꾩씠??YOUNME_USER_ID) ?뺤씤
echo   2) 鍮꾨?踰덊샇(YOUNME_PASSWORD) ?낅젰
echo   3) ???Ctrl + S) ??硫붾え?μ쓣 ?レ븘二쇱꽭??
echo --------------------------------------------------------
echo.
start notepad "%~dp0.env"

echo ========================================================
echo   紐⑤뱺 ?ㅼ튂? 以鍮꾧? ?꾨즺?섏뿀?듬땲??
echo ========================================================
echo.
echo   [?욎쑝濡??ъ슜 諛⑸쾿]
echo   1. 而댄벂??耳쒖떎 ??'2_?뱀빋?곕룞_?먮룞諛쒖＜遊??ㅽ뻾.bat' ???붾툝?대┃?대몢?몄슂.
echo   2. ?ㅻ쭏?명룿?쇰줈 https://blue25ct-beep.github.io/alba-gon/ ???묒냽?댁꽌
echo      [?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉] 踰꾪듉???꾨Ⅴ?쒕㈃ ?⑸땲??
echo.
pause
"""

b_relay = """@echo off
chcp 949 > nul
title [?몄쓽???뚮컮怨? ?대씪?곕뱶 ?ㅼ떆媛??먮룞 諛쒖＜ 遊?

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 ?대씪?곕뱶 ?ㅼ떆媛?諛쒖＜ 遊?
echo ========================================================
echo.
echo   [?덈궡] ???멸퀎 ?대뵒?쒕뱺 ?ㅻ쭏?명룿?쇰줈 [諛쒖＜ ?쒖옉]???꾨Ⅴ硫?
echo   ??PC媛 ?ㅼ떆媛꾩쑝濡??좏샇瑜?諛쏆븘 ?좎븻誘?4???먮룞 諛쒖＜?⑸땲??
echo.
echo   - ?뚮컮 怨듭슜??(LTE/??댄뙆??臾닿?)
echo   - ?ъ옣????(吏? ?대룞 以??대뵒?쒕뱺)
echo   - ?吏??移쒓뎄 ?곗뿉?쒕룄 利됱떆 二쇰Ц ?곕룞!
echo.
echo   ????寃? 李쎌쓣 ?レ? 留덉떆怨??꾨옒濡??대젮?먯꽭??(理쒖냼??.
echo ========================================================
echo.

cd /d "%~dp0bot"
node src\\relayBot.js

echo.
pause
"""

b_cart = """@echo off
chcp 949 > nul
title [?몄쓽???뚮컮怨? ?좎븻誘?4 ?ㅼ젣 ?λ컮援щ땲 ?뺤씤

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 濡쒓렇??諛??λ컮援щ땲 ?닿린
echo ========================================================
echo.
echo   ?щ＼ 釉뚮씪?곗?瑜??ㅽ뻾?섏뿬 ?좎븻誘?4??濡쒓렇?명븯怨?
echo   ?꾩옱 ?λ컮援щ땲 ?붾㈃???붾㈃???꾩썎?덈떎...
echo.

cd /d "%~dp0bot"
node src\\runOrderDirect.js

echo.
echo ========================================================
echo   ?뺤씤???꾨즺?섏뿀?듬땲?? 李쎌쓣 ?レ쑝?ㅻ㈃ ?꾨Т ?ㅻ굹 ?꾨Ⅴ?몄슂.
echo ========================================================
pause
"""

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

targets = [
    (os.path.join(root, '[泥섏쓬?쒕쾲留뚯떎???꾨줈洹몃옩?ㅼ튂.bat'), b_installer),
    (os.path.join(root, '?좎븻誘??먮룞諛쒖＜_?쒖옉.bat'), b_installer),
    (os.path.join(root, '2_?뱀빋?곕룞_?먮룞諛쒖＜遊??ㅽ뻾.bat'), b_relay),
    (os.path.join(root, '1_?좎븻誘??ㅼ젣?λ컮援щ땲_?뺤씤.bat'), b_cart),
]

for path, content in targets:
    with open(path, 'wb') as f:
        f.write(content.encode('cp949'))
    print(f"CP949 encoded: {os.path.basename(path)}")

print("All batch files rewritten with flawless CP949!")

