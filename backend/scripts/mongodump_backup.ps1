param(
    [string]$Uri = $env:MONGODB_URI,
    [string]$OutDir = "$(Get-Location)\mongodump-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
)

if (-not $Uri) {
    Write-Error "Provide MONGODB_URI environment variable or pass -Uri parameter."
    exit 1
}

Write-Host "Running mongodump against: $Uri"

mongodump --uri="$Uri" --out="$OutDir"

if ($LASTEXITCODE -ne 0) {
    Write-Error "mongodump failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Backup saved to: $OutDir"
