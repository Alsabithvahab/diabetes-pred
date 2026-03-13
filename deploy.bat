@echo off
echo ==========================================
echo   Diabetes AI Health Suite - Deployment
echo ==========================================

echo [1/3] Starting ML Service (Python Flask)...
start /B "ML-Service" cmd /c "cd ml-service && python app.py"

echo [2/3] Starting Backend Server (Node.js)...
start /B "Backend" cmd /c "cd backend && node server.js"

echo [3/3] Starting Frontend Development Server...
cd frontend && npm run dev

echo All services launched!
pause
