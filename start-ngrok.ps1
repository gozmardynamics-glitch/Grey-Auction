# Starts the ngrok tunnel for the Grey Auction backend.
# Public URL: https://untying-heaviness-crestless.ngrok-free.dev -> http://localhost:3001
#
# Usage (PowerShell):
#   .\start-ngrok.ps1
#
# Requires ngrok v3.20+ with your authtoken configured
# (ngrok config add-authtoken <your-token>)

$ngrok = "C:\Users\user\ngrok-bin2\ngrok.exe"

if (-not (Test-Path $ngrok)) {
    Write-Host "ngrok not found at $ngrok" -ForegroundColor Red
    Write-Host "Download from https://ngrok.com/download, extract to C:\Users\user\ngrok-bin2\" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting ngrok tunnel to http://localhost:3001 ..." -ForegroundColor Cyan
Write-Host "Public URL: https://untying-heaviness-crestless.ngrok-free.dev" -ForegroundColor Green
& $ngrok http --domain=untying-heaviness-crestless.ngrok-free.dev 3001
