b1 = """@echo off
chcp 65001 > nul
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

b2 = """@echo off
chcp 65001 > nul
title [?몄쓽???뚮컮怨? ?좎븻誘?4 ?뱀빋 ?곕룞 諛쒖＜ ?湲?遊?

echo ========================================================
echo   [?몄쓽???뚮컮怨? ?????곕룞 ?좎븻誘??먮룞 諛쒖＜ 遊??ㅽ뻾
echo ========================================================
echo.
echo   [?덈궡] 遊??쒕쾭媛 耳쒖죱?듬땲??(?湲?以?..)
echo   ?댁젣 ?ъ옣???곗씠????釉뚮씪?곗?(https://blue25ct-beep.github.io/alba-gon/)?먯꽌
echo   [?좎븻誘?4 ?먮룞 諛쒖＜ ?쒖옉] 踰꾪듉???꾨Ⅴ?쒕㈃,
echo   ??PC?먯꽌 ?щ＼ 李쎌씠 ?먮룞?쇰줈 ?대━硫??좎븻誘?4???ㅼ젣 諛쒖＜媛 ?ㅼ뼱媛묐땲??
echo.
echo   ????寃? 李쎌쓣 ?レ? 留덉떆怨?理쒖냼?뷀빐?먯꽭??
echo.

cd /d "%~dp0bot"
node src\\botServer.js

pause
"""

with open(r"C:\Users\teelu\orca\projects\alba-gon\1_?좎븻誘??ㅼ젣?λ컮援щ땲_?뺤씤.bat", "w", encoding="utf-8") as f:
    f.write(b1)

with open(r"C:\Users\teelu\orca\projects\alba-gon\2_?뱀빋?곕룞_?먮룞諛쒖＜遊??ㅽ뻾.bat", "w", encoding="utf-8") as f:
    f.write(b2)

with open(r"C:\Users\teelu\orca\projects\alba-gon\?좎븻誘??먮룞諛쒖＜_?쒖옉.bat", "w", encoding="utf-8") as f:
    f.write(b1)

print("Batch files generated successfully!")

