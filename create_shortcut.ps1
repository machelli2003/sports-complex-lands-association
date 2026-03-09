# ============================================================
#  Creates a Desktop Shortcut for Sports Complex System
#  Run this ONCE to set up the icon on your desktop.
# ============================================================

$launcherPath = "C:\Users\_MONI_\Desktop\Sports Complex\launch.ps1"
$shortcutPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("Desktop"), "Sports Complex.lnk")

# Use the Windows stadium/sports icon (built into shell32.dll)
# Icon 238 in shell32.dll looks like a building/facility
$iconSource = "C:\Windows\System32\shell32.dll"
$iconIndex = 13   # folder/building style icon

Write-Host ""
Write-Host "Creating Desktop Shortcut..." -ForegroundColor Cyan

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)

$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File `"$launcherPath`""
$shortcut.WorkingDirectory = "C:\Users\_MONI_\Desktop\Sports Complex"
$shortcut.Description = "Sports Complex Management System"
$shortcut.IconLocation = "$iconSource,$iconIndex"
$shortcut.WindowStyle = 1   # Normal window

$shortcut.Save()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Shortcut created successfully!" -ForegroundColor White
Write-Host "  Look on your Desktop for:" -ForegroundColor White
Write-Host "  'Sports Complex'" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Double-click the icon to launch your system." -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 3
