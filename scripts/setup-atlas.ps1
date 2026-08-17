# MongoDB Atlas automated setup for Shopify LMS
# Prerequisites: atlas CLI installed and `atlas auth login` completed
# Never commit generated credentials. Output redacts secrets.

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvFile = Join-Path $ProjectRoot ".env"
$ClientEnvFile = Join-Path $ProjectRoot "client\.env"
$ShopifyToml = Join-Path $ProjectRoot "shopify.app.lms.toml"
$AtlasLocalEnv = Join-Path $ProjectRoot ".atlas.local.env"

$AtlasProjectName = "Shopify LMS"
$ClusterName = "shopify-lms"
$DbName = "shopify_lms"
$DbUser = "shopify_lms_user"
$Provider = "AWS"
$Region = "AP_SOUTH_1"
$Tier = "M0"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-Json([scriptblock]$Command) {
  $output = & $Command 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output | Out-String)
  }
  return ($output | Out-String | ConvertFrom-Json)
}

function Encode-MongoPassword([string]$Password) {
  Add-Type -AssemblyName System.Web
  return [System.Web.HttpUtility]::UrlEncode($Password)
}

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  $line = Get-Content $Path | Where-Object { $_ -match "^\s*$([regex]::Escape($Key))=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -split "=", 2)[1]
}

function Set-EnvFile([string]$Path, [hashtable]$Values) {
  $lines = @()
  if (Test-Path $Path) {
    $lines = Get-Content $Path
  }

  foreach ($key in $Values.Keys) {
    $value = $Values[$key]
    $pattern = "^\s*$([regex]::Escape($key))="
    $replacement = "$key=$value"
    $index = 0
    $found = $false
    foreach ($line in $lines) {
      if ($line -match $pattern) {
        $lines[$index] = $replacement
        $found = $true
        break
      }
      $index++
    }
    if (-not $found) {
      if ($lines.Count -gt 0 -and $lines[-1].Trim() -ne "") {
        $lines += ""
      }
      $lines += $replacement
    }
  }

  Set-Content -Path $Path -Value $lines -Encoding UTF8
}

function Import-LocalAtlasEnv {
  if (-not (Test-Path $AtlasLocalEnv)) { return }
  Get-Content $AtlasLocalEnv | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if ($value -ne "") {
        Set-Item -Path "env:$name" -Value $value
      }
    }
  }
}

function Test-AtlasAuthenticated {
  $whoami = atlas auth whoami 2>&1 | Out-String
  return ($LASTEXITCODE -eq 0)
}

Import-LocalAtlasEnv

Write-Step "Checking Atlas CLI authentication"
if (-not (Test-AtlasAuthenticated)) {
  if ($env:MONGODB_ATLAS_PUBLIC_API_KEY -and $env:MONGODB_ATLAS_PRIVATE_API_KEY) {
    Write-Host "Using MongoDB Atlas API keys from local environment." -ForegroundColor Green
  } else {
    Write-Host "Atlas CLI is not authenticated." -ForegroundColor Red
    Write-Host "Complete ONE of these locally, then rerun this script:" -ForegroundColor Yellow
    Write-Host "  1) atlas auth login" -ForegroundColor White
    Write-Host "  2) Copy .atlas.local.env.example to .atlas.local.env and add Atlas API keys" -ForegroundColor White
    exit 1
  }
} else {
  Write-Host "Authenticated Atlas account detected." -ForegroundColor Green
}

Write-Step "Resolving Atlas organization and project"
$orgs = Get-Json { atlas organizations list -o json }
if (-not $orgs.results -or $orgs.results.Count -eq 0) {
  throw "No Atlas organizations found for the authenticated account."
}
$org = $orgs.results[0]
Write-Host "Using organization: $($org.name) ($($org.id))"

$projects = Get-Json { atlas projects list -o json }
$project = $projects.results | Where-Object { $_.name -eq $AtlasProjectName } | Select-Object -First 1
if (-not $project) {
  Write-Host "Creating Atlas project '$AtlasProjectName'..."
  $project = Get-Json { atlas projects create $AtlasProjectName --orgId $org.id -o json }
  Write-Host "Created project: $($project.name) ($($project.id))"
} else {
  Write-Host "Using existing project: $($project.name) ($($project.id))"
}

$projectId = $project.id

Write-Step "Ensuring free M0 cluster '$ClusterName'"
$clusters = Get-Json { atlas clusters list --projectId $projectId -o json }
$cluster = $clusters.results | Where-Object { $_.name -eq $ClusterName } | Select-Object -First 1
if (-not $cluster) {
  Write-Host "Creating M0 cluster in $Provider / $Region (this may take several minutes)..."
  $null = atlas clusters create $ClusterName `
    --projectId $projectId `
    --provider $Provider `
    --region $Region `
    --tier $Tier `
    --watch `
    --watchTimeout 1800 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create Atlas cluster '$ClusterName'."
  }
  Write-Host "Cluster created." -ForegroundColor Green
} else {
  Write-Host "Using existing cluster: $($cluster.name) (state: $($cluster.stateName))"
  if ($cluster.stateName -ne "IDLE") {
    Write-Host "Waiting for cluster to become ready..."
    $null = atlas clusters watch $ClusterName --projectId $projectId --watchTimeout 1800 2>&1
  }
}

Write-Step "Configuring network access for current public IP"
$accessLists = Get-Json { atlas accessLists list --projectId $projectId -o json }
$currentIpEntry = $accessLists.results | Where-Object { $_.comment -eq "Shopify LMS local dev" } | Select-Object -First 1
if (-not $currentIpEntry) {
  $null = atlas accessLists create --currentIp --projectId $projectId --comment "Shopify LMS local dev" 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to add current IP to Atlas access list."
  }
  Write-Host "Added current public IP to Atlas access list." -ForegroundColor Green
} else {
  Write-Host "Access list entry for local development already exists." -ForegroundColor Green
}

Write-Step "Ensuring database user '$DbUser'"
$dbUsers = Get-Json { atlas dbusers list --projectId $projectId -o json }
$existingUser = $dbUsers.results | Where-Object { $_.username -eq $DbUser } | Select-Object -First 1
$generatedPassword = $null

if ($existingUser) {
  Write-Host "Database user already exists. Resetting password..."
  $generatedPassword = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
  $null = atlas dbusers update $DbUser `
    --password $generatedPassword `
    --role "readWrite@${DbName}" `
    --projectId $projectId 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to update existing database user '$DbUser'."
  }
} else {
  Write-Host "Creating database user..."
  $generatedPassword = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
  $null = atlas dbusers create readWrite `
    --username $DbUser `
    --password $generatedPassword `
    --role "readWrite@${DbName}" `
    --projectId $projectId 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create database user '$DbUser'."
  }
}

Write-Host "Database user configured. Password stored locally in .env only." -ForegroundColor Green

Write-Step "Building MongoDB connection string"
$connection = Get-Json { atlas clusters connectionStrings describe $ClusterName --projectId $projectId -o json }
$srvHost = $connection.standardSrv
if (-not $srvHost) {
  throw "Could not retrieve Atlas SRV host for cluster '$ClusterName'."
}
$srvHost = $srvHost -replace "^mongodb\+srv://", ""
$encodedPassword = Encode-MongoPassword $generatedPassword
$mongoUri = "mongodb+srv://${DbUser}:${encodedPassword}@${srvHost}/${DbName}?retryWrites=true&w=majority"

Write-Step "Writing local environment files"
$shopifyApiKey = Read-EnvValue $EnvFile "SHOPIFY_API_KEY"
if (-not $shopifyApiKey -and (Test-Path $ShopifyToml)) {
  $toml = Get-Content $ShopifyToml -Raw
  if ($toml -match 'client_id\s*=\s*"([^"]+)"') {
    $shopifyApiKey = $Matches[1]
  }
}

$shopifyApiSecret = Read-EnvValue $EnvFile "SHOPIFY_API_SECRET"
$shopifyAppUrl = Read-EnvValue $EnvFile "SHOPIFY_APP_URL"
if (-not $shopifyAppUrl) {
  $shopifyAppUrl = "http://localhost:3000"
}

if (-not $shopifyApiKey) {
  throw "SHOPIFY_API_KEY not found. Set it in .env or shopify.app.lms.toml before continuing."
}
if (-not $shopifyApiSecret) {
  Write-Host "SHOPIFY_API_SECRET is not set yet. Add your Partner Client Secret to .env manually." -ForegroundColor Yellow
  $shopifyApiSecret = ""
}

Set-EnvFile $EnvFile @{
  SHOPIFY_API_KEY = $shopifyApiKey
  SHOPIFY_API_SECRET = $shopifyApiSecret
  SHOPIFY_APP_URL = $shopifyAppUrl
  MONGODB_URI = $mongoUri
  SHOPIFY_SCOPES = "read_products"
  NODE_ENV = "development"
  PORT = "3000"
}

Set-EnvFile $ClientEnvFile @{
  VITE_SHOPIFY_API_KEY = $shopifyApiKey
}

Write-Host "Updated $EnvFile" -ForegroundColor Green
Write-Host "Updated $ClientEnvFile" -ForegroundColor Green
Write-Host "MONGODB_URI configured (credentials not displayed)." -ForegroundColor Green

Write-Step "Setup complete"
Write-Host "Cluster: $ClusterName (M0)"
Write-Host "Database: $DbName"
Write-Host "User: $DbUser"
Write-Host ""
Write-Host "Next commands:" -ForegroundColor Yellow
Write-Host "  cd `"$ProjectRoot`""
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host "  shopify app dev --package-manager npm"
