# Deploy Shopify LMS to Vercel (run after: npx vercel login)
# Reads local .env without printing secrets.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Get-EnvValue([string]$Name) {
  $line = Get-Content .env | Where-Object { $_ -match "^\s*$Name=" } | Select-Object -First 1
  if (-not $line) { throw "Missing $Name in .env" }
  return ($line -split '=', 2)[1].Trim()
}

function Set-VercelEnv([string]$Name, [string]$Value, [string]$Env = 'production') {
  $existing = npx vercel env ls $Env 2>&1 | Out-String
  if ($existing -match "\s$Name\s") {
    Write-Host "Updating Vercel env: $Name ($Env)"
    npx vercel env rm $Name $Env --yes 2>&1 | Out-Null
  }
  Write-Host "Setting Vercel env: $Name ($Env)"
  $Value | npx vercel env add $Name $Env 2>&1 | Out-Null
}

Write-Host 'Linking Vercel project (if needed)...'
npx vercel link --yes --project shopify-lms 2>&1 | Out-Host

Write-Host 'Initial production deploy...'
$deployOutput = npx vercel --yes 2>&1 | Out-String
Write-Host $deployOutput
$url = ([regex]::Match($deployOutput, 'https://[a-z0-9-]+\.vercel\.app')).Value
if (-not $url) { throw 'Could not detect Vercel deployment URL from CLI output.' }
Write-Host "Detected URL: $url"

$shopifyKey = Get-EnvValue 'SHOPIFY_API_KEY'
$shopifySecret = Get-EnvValue 'SHOPIFY_API_SECRET'
$mongoUri = Get-EnvValue 'MONGODB_URI'
$scopes = if (Get-Content .env | Where-Object { $_ -match '^\s*SHOPIFY_SCOPES=' }) { Get-EnvValue 'SHOPIFY_SCOPES' } else { 'read_products' }

Set-VercelEnv 'NODE_ENV' 'production'
Set-VercelEnv 'SHOPIFY_API_KEY' $shopifyKey
Set-VercelEnv 'SHOPIFY_API_SECRET' $shopifySecret
Set-VercelEnv 'MONGODB_URI' $mongoUri
Set-VercelEnv 'SHOPIFY_SCOPES' $scopes
Set-VercelEnv 'VITE_SHOPIFY_API_KEY' $shopifyKey
Set-VercelEnv 'SHOPIFY_APP_URL' $url

Write-Host 'Redeploying production with environment variables...'
npx vercel --prod --yes 2>&1 | Out-Host

Write-Host ''
Write-Host 'Deployment complete.'
Write-Host "Production URL: $url"
Write-Host ''
Write-Host 'Next: Update Shopify Partner Dashboard for LMS app:'
Write-Host "  App URL: $url"
Write-Host "  OAuth redirect: $url/api/auth/callback"
Write-Host "  Webhook: $url/api/webhooks"
