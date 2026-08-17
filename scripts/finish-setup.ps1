# Finish Shopify LMS local setup after Atlas credentials are available.
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

Set-Location $ProjectRoot

Write-Step "Running MongoDB Atlas automation"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\setup-atlas.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "Checking required environment variables"
$envContent = Get-Content (Join-Path $ProjectRoot ".env")
$required = @("SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SHOPIFY_APP_URL", "MONGODB_URI")
$missing = @()
foreach ($key in $required) {
  $line = $envContent | Where-Object { $_ -match "^\s*$([regex]::Escape($key))=" } | Select-Object -First 1
  if (-not $line -or ($line -split "=", 2)[1].Trim() -eq "") {
    $missing += $key
  }
}
if ($missing.Count -gt 0) {
  Write-Host "Missing values in .env: $($missing -join ', ')" -ForegroundColor Yellow
  if ($missing -contains "SHOPIFY_API_SECRET") {
    Write-Host "Add your Partner Client Secret to .env locally, then rerun this script." -ForegroundColor Yellow
  }
  exit 1
}

Write-Step "Installing dependencies"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "Running lint, build, and tests"
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "Verifying MongoDB connection"
$job = Start-Job -ScriptBlock {
  Set-Location $using:ProjectRoot
  npm run dev -w server
}
Start-Sleep -Seconds 12
$serverLog = Receive-Job $job
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue

if ($serverLog -match "MongoDB connected successfully") {
  Write-Host "MongoDB connection verified." -ForegroundColor Green
} else {
  Write-Host "MongoDB connection could not be verified from server startup logs." -ForegroundColor Red
  ($serverLog | Select-Object -Last 20) | ForEach-Object { Write-Host $_ }
  exit 1
}

Write-Step "Shopify app status"
shopify app info

Write-Host ""
Write-Host "Local setup complete. Start embedded development with:" -ForegroundColor Green
Write-Host "  shopify app dev --package-manager npm" -ForegroundColor White
