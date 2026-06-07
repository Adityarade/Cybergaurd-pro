@echo off
setlocal

echo ===================================================
echo     CYBERGUARD PRO - AI Threat Monitoring System   
echo ===================================================
echo.
echo Starting Backend (FastAPI)...
start "CyberGuard Backend" cmd /c "cd backend && pip install -r requirements.txt && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend (Vite)...
start "CyberGuard Frontend" cmd /c "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting up!
echo Please wait a few seconds, then open http://localhost:5173 in your browser.
echo.
pause
