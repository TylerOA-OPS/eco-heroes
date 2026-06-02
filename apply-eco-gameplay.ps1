Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-gameplay-patch.cjs"
Write-Host "=== ECO GAMEPLAY PATCH ===" -ForegroundColor Green
if(-not(Test-Path $file)){Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red;exit 1}
if(-not(Test-Path $patch)){Write-Host "ERROR: eco-gameplay-patch.cjs not found" -ForegroundColor Red;exit 1}
$bak = $file + ".gameplay-bak"
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
Write-Host "  - Tyler gets 10 starter animals (was 5)"
Write-Host "  - Greenhouse costs ~3x harder"
Write-Host "  - BINDERS removed from nav and shop"
Write-Host "  - Card cases/sleeves hidden"
Write-Host "  - Assign animals to greenhouses"
Write-Host ""
Write-Host "IMPORTANT: Sign out and back in as Tyler to get new cards!"
Write-Host "Refresh browser!" -ForegroundColor Green
