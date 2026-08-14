# Keep-alive health ping script for Render
# Usage: $env:BACKEND_URL="https://your-service.onrender.com"; .\keep-alive.ps1

$url = $env:BACKEND_URL
if ([string]::IsNullOrEmpty($url)) {
    Write-Host "Error: BACKEND_URL environment variable is not set." -ForegroundColor Red
    Write-Host "Usage: `$env:BACKEND_URL='http://localhost:8080'; .\keep-alive.ps1"
    Exit 1
}

$target = "$url/api/health"
Write-Host "Pinging health endpoint: $target" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $target -Method Get -TimeoutSec 10
    Write-Host "Status: Success" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Gray
}
catch {
    Write-Host "Status: Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Exit 1
}
