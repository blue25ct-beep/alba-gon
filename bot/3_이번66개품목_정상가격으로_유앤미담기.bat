@echo off
@chcp 949 > nul
title [편의점 알바곤] 이번 66개 품목 정상가격으로 유앤미 담기

:: Node.js 기본 설치 경로 자동 감지
if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node" set "PATH=%LocalAppData%\Programs\node;%PATH%"

echo ========================================================
echo   [유앤미24] 66개 품목 정상 공급단가 포함 자동 담기
echo ========================================================
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 goto :NO_NODE

cd /d "%~dp0bot"
node src\order_66_direct.js

echo.
pause
exit /b

:NO_NODE
echo [오류] Node.js 를 찾을 수 없습니다.
pause
exit /b
