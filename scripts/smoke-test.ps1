# Stick & Slay smoke test — run with:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\smoke-test.ps1 -BaseUrl http://localhost:3000
# Reads admin credentials from .env.local if not passed. Creates ONE test order
# (marked cancelled+noted) so the full loop is exercised end to end.
param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$AdminEmail = "",
  [string]$AdminPassword = ""
)
$ErrorActionPreference = "Continue"

if (-not $AdminEmail) {
  $envPath = Join-Path $PSScriptRoot "..\.env.local"
  if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
      if ($line -match '^ADMIN_EMAIL=(.*)$')   { $AdminEmail = $Matches[1].Trim() }
      if ($line -match '^ADMIN_PASSWORD=(.*)$') { $AdminPassword = $Matches[1].Trim() }
    }
  }
}

function Set-Defaults($obj) { $obj | ConvertTo-Json -Compress -Depth 5 }
$failures = @()

# --- 1. Pages ---------------------------------------------------------------
foreach ($p in @("/", "/designs", "/how-it-works", "/faq", "/order", "/privacy", "/thank-you?ref=SS-TEST01", "/product/chrome-stud")) {
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl$p" -UseBasicParsing -TimeoutSec 60
    if ($r.StatusCode -eq 200) { Write-Host "page   $p -> 200 OK" } else { Write-Host "page   $p -> $($r.StatusCode)"; $failures += "page $p" }
  } catch {
    Write-Host "page   $p -> FAIL $($_.Exception.Message)"
    $failures += "page $p"
  }
}

# --- 2. Product API ---------------------------------------------------------
$prod = $null
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/api/products" -UseBasicParsing -TimeoutSec 60
  $json = $r.Content | ConvertFrom-Json
  if ($json.products.Count -gt 0) {
    $prod = $json.products[0]
    Write-Host "api    /api/products -> 200 OK ($($json.products.Count) products)"
  } else {
    Write-Host "api    /api/products -> 200 but EMPTY"
    $failures += "products empty"
  }
} catch {
  Write-Host "api    /api/products -> FAIL $($_.Exception.Message)"
  $failures += "products api"
}
if ($prod) {
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/products/$($prod.slug)" -UseBasicParsing -TimeoutSec 60
    Write-Host "api    /api/products/[slug] -> 200 OK"
  } catch {
    Write-Host "api    /api/products/[slug] -> FAIL"
    $failures += "product slug api"
  }
  try {
    Invoke-WebRequest -Uri "$BaseUrl/api/products/not-a-real-slug" -UseBasicParsing -TimeoutSec 60 > $null
    Write-Host "api    404 test -> FAILED (returned 200 for missing product)"
    $failures += "404 missing product"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) { Write-Host "api    404 test -> 404 OK" } else { Write-Host "api    404 test -> unexpected $code"; $failures += "404 code" }
  }
}

# --- 3. Order request (valid) ------------------------------------------------
$ref = $null
if ($prod) {
  $order = @{
    customerName  = "Smoke Test"
    phone         = "9876543210"
    email         = $null
    productId     = $prod.id
    quantity      = 1
    address       = "Smoke street 421, automated test"
    city          = "Mumbai"
    pincode       = "400001"
    customerNote  = "Automated smoke test request"
    consent       = $true
    company_website = ""
  }
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/order-requests" -Method Post -Body (Set-Defaults $order) -ContentType "application/json" -UseBasicParsing -TimeoutSec 60
    $created = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 201 -and $created.success -and $created.reference) {
      $ref = $created.reference
      Write-Host "order  create -> 201 OK ($ref)"
    } else { Write-Host "order  create -> unexpected"; $failures += "order create" }
  } catch {
    Write-Host "order  create -> FAIL $($_.Exception.Message)"
    $failures += "order create"
  }

  # --- invalid order -> 400 --------------------------------------------------
  $bad = @{ customerName = ""; phone = "12"; productId = $prod.id; quantity = 0; address = "x"; city = ""; pincode = "1"; consent = $false }
  try {
    Invoke-WebRequest -Uri "$BaseUrl/api/order-requests" -Method Post -Body (Set-Defaults $bad) -ContentType "application/json" -UseBasicParsing -TimeoutSec 60 > $null
    Write-Host "order  invalid -> FAILED (accepted invalid payload)"
    $failures += "invalid order accepted"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { Write-Host "order  invalid -> 400 OK (rejected)" } else { Write-Host "order  invalid -> unexpected $code"; $failures += "invalid order code" }
  }
}

# --- 4. Admin auth -----------------------------------------------------------
try {
  Invoke-WebRequest -Uri "$BaseUrl/api/admin/orders" -UseBasicParsing -TimeoutSec 60 > $null
  Write-Host "admin  unauth list -> FAILED (no auth required!)"
  $failures += "admin open"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 401) { Write-Host "admin  unauth list -> 401 OK (protected)" } else { Write-Host "admin  unauth list -> unexpected $code"; $failures += "admin unauth code" }
}

if ($AdminEmail -and $AdminPassword) {
  node scripts/admin-smoke.mjs $BaseUrl $AdminEmail $AdminPassword
  if ($LASTEXITCODE -ne 0) { $failures += "admin smoke" }
} else {
  Write-Host "admin  credentials not available - skipping login test"
}

Write-Host ""
if ($failures.Count -gt 0) {
  Write-Host ("SMOKE RESULT: FAIL ({0} problems)" -f $failures.Count)
  $failures | ForEach-Object { Write-Host " - $_" }
  exit 1
} else {
  Write-Host "SMOKE RESULT: ALL OK"
}
