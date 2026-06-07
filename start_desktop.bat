@echo off
setlocal

echo ===================================================
echo     CYBERGUARD PRO - Native Desktop Launcher   
echo ===================================================
echo.
echo Starting Backend Engine...
start "CyberGuard Backend" cmd /c "cd backend && pip install -r requirements.txt && uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo Launching Native Desktop Interface...
start "CyberGuard Desktop" cmd /c "cd frontend && npm install && npm run electron:dev"

echo.
echo The CyberGuard Pro desktop application is starting up!
echo You can safely minimize these terminal windows.
echo.
pause
