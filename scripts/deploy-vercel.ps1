# Deploy Shopify LMS to Vercel (run after: npx vercel login)
# Reads local .env without printing secrets.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Get-EnvValue([string]$Name) {
  $line = Get-Content .env | Where-Object { $_ -match "^\s*$Name=" } | Select-Object -First 1
  if (-not $line) { throw "Missing $Name in .env" }
  return ($line -split '=', 2)[1].Trim()
}

function Get-OptionalEnvValue([string]$Name) {
  $line = Get-Content .env | Where-Object { $_ -match "^\s*$Name=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -split '=', 2)[1].Trim()
}

function Write-VercelOutput {
  param([object[]]$Lines)
  foreach ($line in $Lines) {
    if ($line -is [System.Management.Automation.ErrorRecord]) {
      Write-Host $line.ToString()
    } else {
      Write-Host $line
    }
  }
}

function Invoke-VercelCli {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$VercelArgs
  )

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    $lines = & npx vercel @VercelArgs 2>&1
    $exitCode = $LASTEXITCODE
    Write-VercelOutput $lines

    if ($exitCode -ne 0) {
      throw "Vercel command failed (exit $exitCode): vercel $($VercelArgs -join ' ')"
    }

    return ($lines | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { $_ }
    }) -join "`n"
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Add-VercelEnvValue {
  param(
    [string]$Name,
    [string]$Value,
    [string]$Env = 'production'
  )

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    $lines = $Value | & npx vercel env add $Name $Env 2>&1
    $exitCode = $LASTEXITCODE
    Write-VercelOutput $lines

    if ($exitCode -ne 0) {
      throw "Failed to set Vercel env $Name ($Env)"
    }
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Set-VercelEnv([string]$Name, [string]$Value, [string]$Env = 'production') {
  $existing = Invoke-VercelCli env ls $Env
  if ($existing -match "\s$Name\s") {
    Write-Host "Updating Vercel env: $Name ($Env)"
    Invoke-VercelCli env rm $Name $Env --yes | Out-Null
  } else {
    Write-Host "Setting Vercel env: $Name ($Env)"
  }
  Add-VercelEnvValue -Name $Name -Value $Value -Env $Env
}

Write-Host 'Linking Vercel project (if needed)...'
Invoke-VercelCli link --yes --project shopify-lms | Out-Null

$appUrl = Get-OptionalEnvValue 'SHOPIFY_APP_URL'
if (-not $appUrl) {
  Write-Host 'Deploying production build to detect URL...'
  $deployOutput = Invoke-VercelCli --prod --yes
  $appUrl = ([regex]::Match($deployOutput, 'https://[a-z0-9-]+\.vercel\.app')).Value
  if (-not $appUrl) { throw 'Could not detect Vercel deployment URL from CLI output.' }
}

Write-Host "Production URL: $appUrl"

$shopifyKey = Get-EnvValue 'SHOPIFY_API_KEY'
$shopifySecret = Get-EnvValue 'SHOPIFY_API_SECRET'
$mongoUri = Get-EnvValue 'MONGODB_URI'
$scopes = if (Get-OptionalEnvValue 'SHOPIFY_SCOPES') { Get-EnvValue 'SHOPIFY_SCOPES' } else { 'read_products' }

Write-Host 'Syncing Vercel production environment variables...'
Set-VercelEnv 'NODE_ENV' 'production'
Set-VercelEnv 'SHOPIFY_API_KEY' $shopifyKey
Set-VercelEnv 'SHOPIFY_API_SECRET' $shopifySecret
Set-VercelEnv 'MONGODB_URI' $mongoUri
Set-VercelEnv 'SHOPIFY_SCOPES' $scopes
Set-VercelEnv 'VITE_SHOPIFY_API_KEY' $shopifyKey
Set-VercelEnv 'SHOPIFY_APP_URL' $appUrl

Write-Host 'Redeploying production with environment variables...'
Invoke-VercelCli --prod --yes | Out-Null

Write-Host ''
Write-Host 'Deployment complete.'
Write-Host "Production URL: $appUrl"
Write-Host ''
Write-Host 'Next: Update Shopify Partner Dashboard for LMS app:'
Write-Host "  App URL: $appUrl"
Write-Host "  OAuth redirect: $appUrl/api/auth/callback"
Write-Host "  Webhook: $appUrl/api/webhooks"
