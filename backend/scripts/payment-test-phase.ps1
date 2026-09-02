# U5 payment-test phase helper — toggles the Paystack key in backend/.env so
# the physical test can do: offline init (Phase 6a) -> armed webhook (6b).
#
# Usage (from backend/):
#   powershell -File scripts/payment-test-phase.ps1 -Phase offline   # init stays offline
#   powershell -File scripts/payment-test-phase.ps1 -Phase armed     # webhook verifies vs itest-secret-key-123
#   powershell -File scripts/payment-test-phase.ps1 -Phase restore   # restore the original key
#
# After each phase, RESTART the backend dev server (the env is read at boot).
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('offline', 'armed', 'restore')]
  [string]$Phase
)

$envPath = Join-Path $PSScriptRoot '..\.env'
$content = Get-Content -LiteralPath $envPath -Raw

$backupPattern = '(?m)^#PAYSTACK_SECRET_KEY_BACKUP=(.*)$'
$activePattern = '(?m)^PAYSTACK_SECRET_KEY=(.*)$'

$backupMatch = [regex]::Match($content, $backupPattern)
$activeMatch = [regex]::Match($content, $activePattern)

if (-not $activeMatch.Success) {
  Write-Error 'PAYSTACK_SECRET_KEY line not found in backend/.env'
  exit 1
}
if ($backupMatch.Success) {
  $originalKey = $backupMatch.Groups[1].Value.Trim()
} else {
  $originalKey = $activeMatch.Groups[1].Value.Trim()
}

switch ($Phase) {
  'offline' {
    # Store the original once (commented), blank the active key.
    if (-not $backupMatch.Success) {
      $content = $content -replace $activePattern, ("#PAYSTACK_SECRET_KEY_BACKUP=`$1" + "`nPAYSTACK_SECRET_KEY=")
    } else {
      $content = $content -replace $activePattern, 'PAYSTACK_SECRET_KEY='
    }
    Write-Host 'Phase OFFLINE: PAYSTACK_SECRET_KEY blanked (original stored in #PAYSTACK_SECRET_KEY_BACKUP).'
    Write-Host 'payments/init for paystack is now unconfigured -> offline payment rows.'
  }
  'armed' {
    $content = $content -replace $activePattern, 'PAYSTACK_SECRET_KEY=itest-secret-key-123'
    Write-Host 'Phase ARMED: webhook HMAC verifies against itest-secret-key-123.'
  }
  'restore' {
    if ($backupMatch.Success) {
      $content = $content -replace $activePattern, ("PAYSTACK_SECRET_KEY=" + $originalKey)
      $content = $content -replace $backupPattern, ''
      $content = $content -replace "(?m)^`r?`n", ''
    } else {
      Write-Host 'No backup line found; active key left unchanged.'
    }
    Write-Host 'Phase RESTORE: original key restored from backup.'
  }
}

Set-Content -LiteralPath $envPath -Value $content -NoNewline
Write-Host 'Now restart the backend dev server to pick up the change.'