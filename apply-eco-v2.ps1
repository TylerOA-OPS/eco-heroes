# apply-eco-v2.ps1
# Run from: C:\Users\TylerDren\eco-heroes
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-patch-v2.cjs"

Write-Host ""
Write-Host "=== ECO SYSTEMS V2 ===" -ForegroundColor Cyan
Write-Host "Target: $file"
Write-Host ""

if(-not(Test-Path $file)){
  Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red
  exit 1
}
if(-not(Test-Path $patch)){
  Write-Host "ERROR: eco-patch-v2.cjs not found" -ForegroundColor Red
  exit 1
}

$bak = $file + ".bak"
Copy-Item $file $bak -Force
Write-Host "Backup saved." -ForegroundColor Gray

Write-Host "Patching..." -ForegroundColor Cyan
$result = node $patch $file 2>&1
$result | ForEach-Object { Write-Host $_ }

if($LASTEXITCODE -ne 0){
  Write-Host ""
  Write-Host "PATCH FAILED - restoring backup" -ForegroundColor Red
  Copy-Item $bak $file -Force
  exit 1
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""
Write-Host "New screens added:" -ForegroundColor Cyan
Write-Host "  FOOD       - feed animals, use vet packs"
Write-Host "  TRAVEL     - expeditions, earn materials"
Write-Host "  GREENHOUSE - build with materials"
Write-Host ""
Write-Host "Refresh your browser now." -ForegroundColor Yellow
