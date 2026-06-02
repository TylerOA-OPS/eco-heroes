Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-shop-bg-patch.cjs"
Write-Host "=== ECO SHOP + BACKGROUND PATCH ===" -ForegroundColor Green
if(-not(Test-Path $file)){Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red;exit 1}
if(-not(Test-Path $patch)){Write-Host "ERROR: eco-shop-bg-patch.cjs not found" -ForegroundColor Red;exit 1}
$bak = $file + ".shopbg-bak"
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
Write-Host "Changes:"
Write-Host "  - Shop traders are now eco animals"
Write-Host "  - Argyle plaid background removed"
Write-Host "  - Waterfall added to background"
Write-Host "  - Free pack reset"
Write-Host ""
Write-Host "NOTE: Tyler free pack is reset in code defaults."
Write-Host "To get it in-game, sign out and back in as Tyler."
Write-Host ""
Write-Host "Refresh browser!" -ForegroundColor Green
