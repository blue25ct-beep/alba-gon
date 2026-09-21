@echo off
cd /d "%~dp0"
title ALBA-GON BOT (V2)

echo ========================================================
echo   [Convenience Store Auto-Order Bot (V2)]
echo   - Waiting for signals from GitHub Live Site...
echo ========================================================
echo.
echo Please DO NOT close this black window.
echo It needs to be running to receive your smartphone orders!
echo.
echo (Younme / SPChain Unified Version)
echo.

echo Opening Admin Dashboard in your browser...
start https://blue25ct-beep.github.io/alba-gon/

cd bot
node src/unifiedBot.js

pause
