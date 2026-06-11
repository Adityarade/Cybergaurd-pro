@echo off
setlocal

echo ===================================================
echo     CYBERGUARD PRO - Native Desktop Launcher   
echo ===================================================
echo.

echo [1/2] Booting Backend Server...
start "CyberGuard Backend" cmd /k "cd backend && python -m venv .venv && call .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/2] Booting Native Desktop Interface...
start "CyberGuard Desktop" cmd /k "cd frontend && if exist package-lock.json del package-lock.json && npm install && npm run electron:dev"

echo.
echo The CyberGuard Pro desktop application is starting up!
echo You can safely minimize the two terminal windows that just opened.
echo.
pause
