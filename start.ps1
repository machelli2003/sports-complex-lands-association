# Start Sports Complex Management System
# This script starts both backend and frontend servers in separate windows

Write-Host "Starting Sports Complex Management System..." -ForegroundColor Green

# --- Start Backend in a new window with auto-restart ---
Write-Host "Starting backend server on port 5001..." -ForegroundColor Yellow

$backendScript = @"
Set-Location 'C:\Users\_MONI_\Desktop\Sports Complex\backend'

# Activate virtual environment
& 'C:\Users\_MONI_\Desktop\Sports Complex\backend\venv\Scripts\Activate.ps1'

Write-Host '[Backend] Virtual environment activated.' -ForegroundColor Cyan

# Auto-restart loop: if backend crashes, restart it automatically
while (`$true) {
    Write-Host '[Backend] Starting Flask server...' -ForegroundColor Green
    python main.py
    Write-Host '[Backend] Server stopped or crashed! Restarting in 5 seconds...' -ForegroundColor Red
    Start-Sleep -Seconds 5
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait for backend to be ready
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# --- Start Frontend in the CURRENT window ---
Write-Host "Starting frontend server on port 3001..." -ForegroundColor Yellow
Set-Location "C:\Users\_MONI_\Desktop\Sports Complex\frontend"
$env:PORT = 3001
npm start