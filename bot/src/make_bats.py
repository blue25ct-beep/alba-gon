import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
bot_dir = os.path.join(root, 'bot')

install_bat = '''@echo off
@chcp 949 > nul
title [?몄쓽???뚮컮怨? 1遺??먮룞 ?ㅼ튂 ?꾩슦誘?

:: Node.js 湲곕낯 ?ㅼ튂 寃쎈줈 ?먮룞 媛먯?
if exist "%ProgramFiles%\\nodejs" set "PATH=%ProgramFiles%\\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\\nodejs" set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
if exist "%LocalAppData%\\Programs\\node" set "PATH=%LocalAppData%\\Programs\\node;%PATH%"

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 ?먮룞 諛쒖＜ ?꾨줈洹몃옩 ?ㅼ튂
echo ========================================================
echo.
echo   [1?④퀎] 而댄벂?곗뿉 ?꾩닔 ?꾨줈洹몃옩(Node.js)???덈뒗吏 寃?ы빀?덈떎...
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 goto :NO_NODE

echo [?깃났] Node.js ?뺤긽 ?ㅼ튂 ?뺤씤 ?꾨즺!
goto :STEP2

:NO_NODE
echo [?뚮┝] Node.js 媛 ?꾩쭅 ?ㅼ튂?섏? ?딆븯?듬땲??
echo.
echo ??釉뚮씪?곗?媛 ?대━硫?珥덈줉??[LTS 踰꾩쟾] 踰꾪듉???뚮윭 ?ㅼ슫諛쏆쑝????
echo ?ㅼ튂 李쎌뿉??Next留?怨꾩냽 ?꾨Ⅴ怨??ㅼ튂瑜??꾨즺?댁＜?몄슂.
echo (?ㅼ튂 ??李쎌쓣 ?リ퀬 ???꾨줈洹몃옩???ㅼ떆 ?ㅽ뻾?섏떆硫??⑸땲??
echo.
start https://nodejs.org/ko
pause
exit /b

:STEP2
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
if not exist ".env" goto :MAKE_ENV
echo [?깃났] 怨꾩젙 ?ㅼ젙 ?뚯씪(.env)???대? 議댁옱?⑸땲??
goto :OPEN_NOTEPAD

:MAKE_ENV
if exist ".env.example" (
    copy /y ".env.example" ".env" > nul
) else (
    echo YOUNME_USER_ID=1060 > .env
    echo YOUNME_PASSWORD=?ш린???좎븻誘몃퉬諛踰덊샇_?낅젰 >> .env
    echo BOT_PORT=3001 >> .env
    echo HEADLESS=false >> .env
)

:OPEN_NOTEPAD
echo --------------------------------------------------------
echo [以묒슂] ?붾㈃??硫붾え??李쎌씠 ?대┰?덈떎!
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
echo   1. 而댄벂??耳쒖떎 ??2_?뱀빋?곕룞_?먮룞諛쒖＜遊??ㅽ뻾.bat ???붾툝?대┃?대몢?몄슂.
echo   2. ?ㅻ쭏?명룿?쇰줈 https://blue25ct-beep.github.io/alba-gon/ ???묒냽?댁꽌
echo      [?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉] 踰꾪듉???꾨Ⅴ?쒕㈃ ?⑸땲??
echo.
pause
'''.replace('\n', '\r\n')

bot_bat = '''@echo off
@chcp 949 > nul
title [?몄쓽???뚮컮怨? ?대씪?곕뱶 ?ㅼ떆媛??먮룞 諛쒖＜ 遊?

:: Node.js 湲곕낯 ?ㅼ튂 寃쎈줈 ?먮룞 媛먯?
if exist "%ProgramFiles%\\nodejs" set "PATH=%ProgramFiles%\\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\\nodejs" set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
if exist "%LocalAppData%\\Programs\\node" set "PATH=%LocalAppData%\\Programs\\node;%PATH%"

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 ?대씪?곕뱶 ?ㅼ떆媛?諛쒖＜ 遊?
echo ========================================================
echo.
echo   [?덈궡] ?ㅻ쭏?명룿?먯꽌 [諛쒖＜ ?쒖옉]???꾨Ⅴ硫?
echo   ??PC媛 ?ㅼ떆媛꾩쑝濡??좏샇瑜?諛쏆븘 ?좎븻誘?4???먮룞 諛쒖＜?⑸땲??
echo.
echo   - ?뚮컮 怨듭슜??(LTE / ??댄뙆??臾닿?)
echo   - ?ъ옣????(吏? ?대룞 以??대뵒?쒕뱺)
echo.
echo   ????寃? 李쎌쓣 ?レ? 留덉떆怨?理쒖냼??_)?대몢?몄슂.
echo ========================================================
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 goto :NO_NODE

cd /d "%~dp0bot"
node src\\relayBot.js

echo.
pause
exit /b

:NO_NODE
echo [?ㅻ쪟] Node.js瑜?李얠쓣 ???놁뒿?덈떎!
echo 癒쇱? [泥섏쓬?쒕쾲留뚯떎???꾨줈洹몃옩?ㅼ튂.bat ???ㅽ뻾?댁＜?쒓굅??
echo 而댄벂?곕? ??踰??щ??낇빐二쇱꽭??
echo.
pause
exit /b
'''.replace('\n', '\r\n')

view_cart_bat = '''@echo off
@chcp 949 > nul
title [?몄쓽???뚮컮怨? ?좎븻誘?4 ?ㅼ젣 ?λ컮援щ땲 ?뺤씤

:: Node.js 湲곕낯 ?ㅼ튂 寃쎈줈 ?먮룞 媛먯?
if exist "%ProgramFiles%\\nodejs" set "PATH=%ProgramFiles%\\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\\nodejs" set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
if exist "%LocalAppData%\\Programs\\node" set "PATH=%LocalAppData%\\Programs\\node;%PATH%"

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?좎븻誘?4 濡쒓렇??諛??λ컮援щ땲 ?닿린
echo ========================================================
echo.
echo   ?щ＼ 釉뚮씪?곗?瑜??ㅽ뻾?섏뿬 ?좎븻誘?4??濡쒓렇?명븯怨?
echo   ?꾩옱 ?λ컮援щ땲 ?붾㈃???붾㈃???꾩썎?덈떎...
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 goto :NO_NODE

cd /d "%~dp0bot"
node src\\runOrderDirect.js

echo.
echo ========================================================
echo   ?뺤씤???꾨즺?섏뿀?듬땲?? 李쎌쓣 ?レ쑝?ㅻ㈃ ?꾨Т ?ㅻ굹 ?꾨Ⅴ?몄슂.
echo ========================================================
pause
exit /b

:NO_NODE
echo [?ㅻ쪟] Node.js瑜?李얠쓣 ???놁뒿?덈떎!
echo 癒쇱? [泥섏쓬?쒕쾲留뚯떎???꾨줈洹몃옩?ㅼ튂.bat ???ㅽ뻾?댁＜?몄슂.
echo.
pause
exit /b
'''.replace('\n', '\r\n')

order66_bat = '''@echo off
@chcp 949 > nul
title [?몄쓽???뚮컮怨? ?대쾲 66媛??덈ぉ ?뺤긽媛寃⑹쑝濡??좎븻誘??닿린

:: Node.js 湲곕낯 ?ㅼ튂 寃쎈줈 ?먮룞 媛먯?
if exist "%ProgramFiles%\\nodejs" set "PATH=%ProgramFiles%\\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\\nodejs" set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
if exist "%LocalAppData%\\Programs\\node" set "PATH=%LocalAppData%\\Programs\\node;%PATH%"

echo ========================================================
echo   [?좎븻誘?4] 66媛??덈ぉ ?뺤긽 怨듦툒?④? ?ы븿 ?먮룞 ?닿린
echo ========================================================
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 goto :NO_NODE

cd /d "%~dp0bot"
node src\\order_66_direct.js

echo.
pause
exit /b

:NO_NODE
echo [?ㅻ쪟] Node.js 瑜?李얠쓣 ???놁뒿?덈떎.
pause
exit /b
'''.replace('\n', '\r\n')

def save(p, content):
    with open(p, 'wb') as f:
        f.write(content.encode('cp949', errors='replace'))
    print('Wrote:', p)

for d in [root, bot_dir]:
    save(os.path.join(d, '[泥섏쓬?쒕쾲留뚯떎???꾨줈洹몃옩?ㅼ튂.bat'), install_bat)
    save(os.path.join(d, '?좎븻誘??먮룞諛쒖＜_?쒖옉.bat'), install_bat)
    save(os.path.join(d, '2_?뱀빋?곕룞_?먮룞諛쒖＜遊??ㅽ뻾.bat'), bot_bat)
    save(os.path.join(d, '1_?좎븻誘??ㅼ젣?λ컮援щ땲_?뺤씤.bat'), view_cart_bat)
    save(os.path.join(d, '3_?대쾲66媛쒗뭹紐??뺤긽媛寃⑹쑝濡??좎븻誘몃떞湲?bat'), order66_bat)

print('Done rewriting all bats!')

