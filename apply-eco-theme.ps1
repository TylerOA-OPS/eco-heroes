# apply-eco-theme.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-theme-patch.cjs"

Write-Host ""
Write-Host "=== ECO THEME OVERHAUL ===" -ForegroundColor Green
Write-Host "Target: $file"
Write-Host ""

if(-not(Test-Path $file)){Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red;exit 1}
if(-not(Test-Path $patch)){Write-Host "ERROR: eco-theme-patch.cjs not found" -ForegroundColor Red;exit 1}

$bak = $file + ".theme-bak"
Copy-Item $file $bak -Force
Write-Host "Backup saved." -ForegroundColor Gray

Write-Host "Applying eco theme..." -ForegroundColor Green
$result = node $patch $file 2>&1
$result | ForEach-Object { Write-Host $_ }

if($LASTEXITCODE -ne 0){
  Write-Host ""
  Write-Host "FAILED - restoring backup" -ForegroundColor Red
  Copy-Item $bak $file -Force
  exit 1
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Green
Write-Host "  ECO THEME APPLIED!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:"
Write-Host "  - Brighter meadow background"
Write-Host "  - Green nav dock with vine border"
Write-Host "  - Animated butterflies floating across screen"
Write-Host "  - Drifting leaves and flower petals"
Write-Host "  - Green active states throughout"
Write-Host "  - Green scrollbar"
Write-Host ""
Write-Host "Refresh your browser to see it!" -ForegroundColor Green
