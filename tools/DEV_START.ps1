# ============================================================
# GreyAuction - local dev launcher
# Starts: Postgres container, backend API, frontend dev server
#
# Lives at <repo>/tools/DEV_START.ps1 - run it from anywhere:
#   powershell -ExecutionPolicy Bypass -File tools\DEV_START.ps1
#
# Note: this machine ships Windows PowerShell 5.1 only (no pwsh/PS7),
# so the server windows are launched through cmd.exe rather than a
# nested PowerShell host. Keep the script 5.1-compatible.
# ============================================================
$ErrorActionPreference = 'Stop'

# $PSScriptRoot = <repo>/tools  ->  repo root is its parent
$repo = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repo 'backend'
$frontend = Join-Path $repo 'frontend'

foreach ($p in @($backend, $frontend)) {
  if (-not (Test-Path -LiteralPath $p)) {
    Write-Host "Expected project folder missing: $p" -ForegroundColor Red
    Write-Host 'Run this script from inside the Grey-Auction-master checkout (tools/DEV_START.ps1).' -ForegroundColor Red
    exit 1
  }
}

# --- Docker engine ---------------------------------------------------------
# A backend started before Postgres stays wedged (see docs/HANDOFF.md), so the
# engine is verified/awaited before anything else is launched.
$engine = $null
try { $engine = (docker info --format '{{.ServerVersion}}' 2>$null) } catch { $engine = $null }
if (-not $engine) {
  Write-Host 'Docker engine not responding - looking for Docker Desktop...' -ForegroundColor Yellow
  $candidates = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
  )
  $dd = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if ($dd) {
    Write-Host "Starting Docker Desktop: $dd" -ForegroundColor Yellow
    Start-Process -FilePath $dd | Out-Null
    for ($i = 0; $i -lt 60 -and -not $engine; $i++) {
      Start-Sleep -Seconds 3
      try { $engine = (docker info --format '{{.ServerVersion}}' 2>$null) } catch { $engine = $null }
    }
  } else {
    Write-Host 'Docker Desktop executable not found - start it manually, then re-run this script.' -ForegroundColor Red
  }
}
if ($engine) { Write-Host "Docker engine ready (server $engine)" -ForegroundColor Green }
else { Write-Host 'Docker engine still unavailable - Postgres cannot start.' -ForegroundColor Red }

# --- PostgreSQL ------------------------------------------------------------
Write-Host 'Starting PostgreSQL...' -ForegroundColor Cyan
docker start greyauction-postgres 2>$null | Out-Null
if (-not (docker ps --format '{{.Names}}' | Select-String '^greyauction-postgres$')) {
  Write-Host 'Container not running - creating it...' -ForegroundColor Yellow
  docker run -d --name greyauction-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=greyauction -p 5433:5432 pgvector/pgvector:pg16 | Out-Null
}
$pgUp = docker ps --format '{{.Names}}' | Select-String '^greyauction-postgres$'
if ($pgUp) { Write-Host 'PostgreSQL up on port 5433' -ForegroundColor Green }
else {
  Write-Host 'PostgreSQL container is NOT running.' -ForegroundColor Red
  Write-Host 'Refusing to launch the backend: a backend started before Postgres stays wedged and must be restarted (see docs/HANDOFF.md).' -ForegroundColor Red
  Write-Host 'Fix Docker first, then re-run this script:' -ForegroundColor Yellow
  Write-Host '  - Docker Desktop tray -> Troubleshoot -> Restart' -ForegroundColor Yellow
  Write-Host '  - if the WSL VM is wedged, reboot (an elevated "wsl --shutdown" also clears it)' -ForegroundColor Yellow
  exit 1
}

# --- Backend (before frontend) --------------------------------------------
# cmd.exe /k keeps the window open so logs stay visible; npm.cmd resolves there.
$backendCmd = 'cd /d "' + $backend + '" && npm run start:dev'
$frontendCmd = 'cd /d "' + $frontend + '" && npm run dev'

Write-Host 'Starting backend API (port 3001)...' -ForegroundColor Cyan
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $backendCmd

Write-Host 'Starting frontend (port 3000)...' -ForegroundColor Cyan
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $frontendCmd

# --- Warm-up verification --------------------------------------------------
Write-Host 'Waiting for backend health (up to ~2 min)...' -ForegroundColor Cyan
$healthy = $false
for ($i = 0; $i -lt 40 -and -not $healthy; $i++) {
  Start-Sleep -Seconds 3
  try {
    $h = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 5
    if ($h.status -eq 'ok') { $healthy = $true }
  } catch { }
}
if ($healthy) { Write-Host 'Backend healthy.' -ForegroundColor Green }
else { Write-Host 'Backend not healthy yet - check the backend window (a backend started before Postgres stays wedged; restart it).' -ForegroundColor Yellow }

$frontendUp = $false
for ($i = 0; $i -lt 20 -and -not $frontendUp; $i++) {
  try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/en' -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -eq 200) { $frontendUp = $true }
  } catch { Start-Sleep -Seconds 3 }
}
if ($frontendUp) { Write-Host 'Frontend responding.' -ForegroundColor Green }
else { Write-Host 'Frontend not responding yet - check the frontend window.' -ForegroundColor Yellow }

Write-Host ''
Write-Host 'Frontend: http://localhost:3000/en' -ForegroundColor Green
Write-Host 'API:      http://localhost:3001/api' -ForegroundColor Green
Write-Host 'Swagger:  http://localhost:3001/api/docs' -ForegroundColor Green
Write-Host 'Admin:    admin@greyauction.com / Admin@12345' -ForegroundColor Yellow
Write-Host 'Seller:   demo@seller.com / Seller@12345' -ForegroundColor Yellow
Write-Host 'Buyer:    demo@buyer.com / Buyer@12345' -ForegroundColor Yellow
