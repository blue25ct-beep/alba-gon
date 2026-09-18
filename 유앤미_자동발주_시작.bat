@echo off
chcp 949 > nul
title [������ �˹ٰ�] 1�� �ڵ� ��ġ �����

:: Node.js �⺻ ��ġ ��� �ڵ� ���� (����� ���� �ٷ� ���� ����)
if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node" set "PATH=%LocalAppData%\Programs\node;%PATH%"

echo ========================================================
echo   [������ �˹ٰ�] ���ع�24 �ڵ� ���� ���α׷� ��ġ
echo ========================================================
echo.
echo   [1�ܰ�] ��ǻ�Ϳ� �ʼ� ���α׷�(Node.js)�� �ִ��� �˻��մϴ�...
echo.

node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo [�˸�] Node.js �� ���� ��ġ���� �ʾҽ��ϴ�!
    echo.
    echo �� �������� ������ �ʷϻ� [LTS ����] ��ư�� ���� �ٿ������ ��,
    echo ��ġ â���� 'Next'�� ��� ������ ��ġ�� �Ϸ����ּ���.
    echo (��ġ �� ����� ���� �ٷ� �� â�� �ٽ� �����Ͻø� �˴ϴ�)
    echo.
    start https://nodejs.org/ko
    pause
    exit /b
)

echo [����] Node.js ���� ��ġ Ȯ�� �Ϸ�!
echo.
echo [2�ܰ�] ���� ���α׷��� �ʿ��� �ʼ� ��ǰ���� ��ġ�մϴ�...
echo (���ͳ� �ӵ��� ���� �� 10��~30�� �ҿ�˴ϴ�)
echo.

cd /d "%~dp0bot"
call npm install --no-audit --no-fund

echo.
echo [3�ܰ�] ���ع�24 ���� ���� ����(.env)�� Ȯ���մϴ�...
echo.

cd /d "%~dp0"
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
    ) else (
        echo YOUNME_USER_ID=047458 > .env
        echo YOUNME_PASSWORD=���⿡_���ع̺�й�ȣ_�Է� >> .env
    )
)

echo --------------------------------------------------------
echo �� �߿�: ȭ�鿡 �޸��� â�� ���Ƚ��ϴ�!
echo   1) ���̵�(YOUNME_USER_ID) Ȯ��
echo   2) ��й�ȣ(YOUNME_PASSWORD) �Է�
echo   3) ����(Ctrl + S) �� �޸����� �ݾ��ּ���!
echo --------------------------------------------------------
echo.
start notepad "%~dp0.env"

echo ========================================================
echo   ��� ��ġ�� �غ� �Ϸ�Ǿ����ϴ�!
echo ========================================================
echo.
echo   [������ ��� ���]
echo   1. ��ǻ�� �ѽ� �� '2_���ۿ���_�ڵ����ֺ�_����.bat' �� ����Ŭ���صμ���.
echo   2. ����Ʈ������ https://blue25ct-beep.github.io/alba-gon/ �� �����ؼ�
echo      [���ع�24 �ڵ� ���� ����] ��ư�� �����ø� �˴ϴ�!
echo.
pause