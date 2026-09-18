@echo off
chcp 949 > nul
title [������ �˹ٰ�] Ŭ���� �ǽð� �ڵ� ���� ��

:: Node.js �⺻ ��ġ ��� �ڵ� ���� (����� ���� �ٷ� ���� ����)
if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node" set "PATH=%LocalAppData%\Programs\node;%PATH%"

echo ========================================================
echo   [������ �˹ٰ�] ���ع�24 Ŭ���� �ǽð� ���� ��
echo ========================================================
echo.
echo   [�ȳ�] �� ���� ��𼭵� ����Ʈ������ [���� ����]�� ������
echo   �� PC�� �ǽð����� ��ȣ�� �޾� ���ع�24�� �ڵ� �����մϴ�!
echo.
echo   - �˹� ������ (LTE/�������� ����)
echo   - ����� �� (��, �̵� �� ��𼭵�)
echo   - Ÿ���� ģ�� �������� ��� �ֹ� ����!
echo.
echo   �� �� ���� â�� ���� ���ð� �Ʒ��� �����μ��� (�ּ�ȭ).
echo ========================================================
echo.

where node > nul 2>&1
if %errorlevel% neq 0 (
    echo [����] Node.js�� ã�� �� �����ϴ�!
    echo ���� '[ó���ѹ�������]���α׷���ġ.bat'�� �������ֽðų�
    echo ��ǻ�͸� �� �� ��������ּ���.
    echo.
    pause
    exit /b
)

cd /d "%~dp0bot"
node src\relayBot.js

echo.
pause
