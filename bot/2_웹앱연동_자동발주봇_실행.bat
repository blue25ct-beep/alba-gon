@echo off
chcp 949 > nul
title [편의점 알바곤] 통합 실시간 자동발주 봇

:: Node.js 기본 설치 경로 자동 등록
if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node" set "PATH=%LocalAppData%\Programs\node;%PATH%"

echo ========================================================
echo   [편의점 알바곤] 통합 실시간 자동발주 봇 (V2)
echo ========================================================
echo.
echo   [안내] 스마트폰이나 브라우저에서 발주하기를 누르면
echo   이 PC가 실시간 신호를 받아 자동으로 본사에 주문을 넣습니다!
echo.
echo   ※ 이 창을 닫지 마시고 최소화해 두세요.
echo ========================================================
echo.

where node > nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js를 찾을 수 없습니다!
    echo 최상위 폴더의 '[처음한번만실행]프로그램설치.bat'을 실행해 주세요.
    echo.
    pause
    exit /b
)

cd /d "%~dp0"
node src\unifiedBot.js

echo.
pause
