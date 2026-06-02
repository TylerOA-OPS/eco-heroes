Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-carter-patch.cjs"
Write-Host "=== CARTER DESIGN PASS ===" -ForegroundColor Green
if(-not(Test-Path $file)){Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red;exit 1}
if(-not(Test-Path $patch)){Write-Host "ERROR: eco-carter-patch.cjs not found" -ForegroundColor Red;exit 1}
$bak = $file + ".carter-bak"
Copy-Item $file $bak -Force
Write-Host "Backup saved." -ForegroundColor Gray
$result = node $patch $file 2>&1
$result | ForEach-Object { Write-Host $_ }
if($LASTEXITCODE -ne 0){
  Write-Host "FAILED - restoring backup" -ForegroundColor Red
  Copy-Item $bak $file -Force
  exit 1
}
Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Changes applied:"
Write-Host "  - Injury labels: HEALTHY / SLIGHTLY INJURED / INJURED / MAJOR INJURY"
Write-Host "  - Music: FOREST BREEZE / RIVER FLOW / JUNGLE BEATS"
Write-Host "  - Music icon and title: green"
Write-Host "  - Waterfall: thicker + pushed to right edge"
Write-Host "  - Vines: thicker double corners"
Write-Host "  - Feed animation: NOM! floats toward animal"
Write-Host "  - Expedition bubbles: live item counter while away"
Write-Host "  - Free pack: auto-restored on login"
Write-Host ""
Write-Host "Refresh browser!" -ForegroundColor Green
