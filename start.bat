@echo off
setlocal

echo ===================================================
echo     CYBERGUARD PRO - Auto Launcher   
echo ===================================================
echo.
echo Cleaning cache to prevent JSON errors...
cd frontend
if exist package-lock.json del package-lock.json
cd ..

echo Starting Backend Engine...
start "CyberGuard Backend" cmd /c "cd backend && pip install -r requirements.txt && uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo Launching Interface...
start "CyberGuard Frontend" cmd /c "cd frontend && npm install && npm run dev"

echo.
echo Setup Complete! The application is starting in your browser...
echo You can safely minimize these terminal windows.
echo.
pause
