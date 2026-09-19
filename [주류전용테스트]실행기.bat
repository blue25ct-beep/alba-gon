@echo off
echo ========================================================
echo   [Alba-gon Test] SPChain Auto-Order System
echo ========================================================
echo.
echo Starting the SPChain Bot and Test Website...
echo.

cd spchain-test
start cmd /k "node spchainBot.js"

cd ../client-spchain
start cmd /k "npm run dev"

echo Waiting 3 seconds for the web server to start...
ping 127.0.0.1 -n 4 > nul
start http://localhost:5174
