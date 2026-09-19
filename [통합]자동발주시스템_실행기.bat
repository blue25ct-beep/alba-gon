@echo off
title ALBA-GON UNIFIED LAUNCHER

echo ========================================================
echo   [Alba-Gon Unified Auto-Order System]
echo   1. Starting Web Server for Smartphone...
echo   2. Starting Unified Order Bot (Younme / SPChain)...
echo ========================================================
echo.
echo [NOTICE] Two command windows will open. DO NOT CLOSE THEM!
echo.

echo [1/2] Starting Web Server...
start "Web_Server" cmd /k "cd /d %~dp0client-spchain && npm run dev -- --host"

echo [2/2] Starting Unified Bot...
start "Unified_Bot" cmd /k "cd /d %~dp0bot && node src/unifiedBot.js"

echo.
echo ========================================================
echo System is fully running!
echo Connect your phone to the same Wi-Fi network,
echo and access the Network URL (e.g., http://192.168.x.x:5174).
echo ========================================================
echo.
echo Opening browser in 3 seconds...
ping 127.0.0.1 -n 4 > nul
start http://localhost:5174
