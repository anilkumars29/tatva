# start.ps1 — Launches Tatva Backend and Frontend simultaneously
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Tatva Knowledge Studio (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; python -m uvicorn main:app --port 8000 --reload"

Write-Host "[2/2] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

Write-Host "`nBoth services are now running!" -ForegroundColor Green
Write-Host "Opening http://localhost:5173 in default browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
