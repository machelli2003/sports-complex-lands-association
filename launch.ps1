# ============================================================
#  Nii Boiman Sports Complex - Launcher
# ============================================================

$projectRoot = "C:\Users\_MONI_\Desktop\Sports Complex"
$backendPath = "$projectRoot\backend"
$frontendPath = "$projectRoot\frontend"

# Use DIRECT path to Python inside the venv - no activation needed, never fails
$pythonExe = "$backendPath\venv\Scripts\python.exe"
$mainPy = "$backendPath\main.py"

# --- Check that paths exist ---
if (-not (Test-Path $pythonExe)) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("Python not found in virtual environment.`nExpected: $pythonExe", "Launch Error")
    exit 1
}
if (-not (Test-Path $mainPy)) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("main.py not found at: $mainPy", "Launch Error")
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nii Boiman Sports Complex" -ForegroundColor White
Write-Host "  Starting up, please wait..." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Launch Backend in its own window with auto-restart ---
# KEY FIX: Uses full path to venv python.exe directly — no activation needed
$backendScript = @"
`$host.UI.RawUI.WindowTitle = 'Nii Boiman Sports Complex - Backend'
`$host.UI.RawUI.BackgroundColor = 'DarkBlue'
Clear-Host
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  Nii Boiman Sports Complex - Backend' -ForegroundColor White
Write-Host '  Running on http://localhost:5001' -ForegroundColor Green
Write-Host '  Do NOT close this window.' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
Set-Location '$backendPath'

while (`$true) {
    `$timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[`$timestamp] Starting Flask server..." -ForegroundColor Green
    
    # Using FULL PATH to python.exe inside venv - guaranteed to work every restart
    & '$pythonExe' '$mainPy'
    
    `$timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host ''
    Write-Host "[`$timestamp] Backend stopped. Restarting in 5 seconds..." -ForegroundColor Red
    Write-Host '  (Check above for any error messages)' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host ''
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendScript

Write-Host "[OK] Backend window launched." -ForegroundColor Green
Write-Host "     Waiting 6 seconds for Flask to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 6

# --- Launch Frontend in its own window ---
$frontendScript = @"
`$host.UI.RawUI.WindowTitle = 'Nii Boiman Sports Complex - Frontend'
`$host.UI.RawUI.BackgroundColor = 'DarkGreen'
Clear-Host
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  Nii Boiman Sports Complex - Frontend' -ForegroundColor White
Write-Host '  Opening at http://localhost:3001' -ForegroundColor Green
Write-Host '  Do NOT close this window.' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
Set-Location '$frontendPath'
`$env:PORT = 3001
`$env:BROWSER = 'none'
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendScript

Write-Host "[OK] Frontend window launched." -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for React to compile (about 15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# --- Open the browser ---
Write-Host "[OK] Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  System is running!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can close this window now." -ForegroundColor Gray
Start-Sleep -Seconds 5
