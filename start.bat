@echo off
echo ============================================================
echo   Starting Tatva Knowledge Studio (Backend + Frontend)
echo ============================================================

start "Tatva Backend (FastAPI :8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --port 8000 --reload"
start "Tatva Frontend (Vite :5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers have been launched in separate terminal windows:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8000 (API)
echo.
timeout /t 3 >nul
start http://localhost:5173
