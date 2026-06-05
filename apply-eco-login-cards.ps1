Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "eco-login-cards-patch.cjs"
Write-Host "=== LOGIN + CARDS CLEANUP ===" -ForegroundColor Green
if(-not(Test-Path $file)){Write-Host "ERROR: EcoHeroes.jsx not found" -ForegroundColor Red;exit 1}
if(-not(Test-Path $patch)){Write-Host "ERROR: patch not found" -ForegroundColor Red;exit 1}
$bak = $file + ".logincards-bak"
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
Write-Host "  - Rings trophy removed from login cards"
Write-Host "  - Fox speed: 45 CALLS -> 45 KM/H"
Write-Host "  - Numbers removed from login cards"
Write-Host "  - Numbers removed from game cards"
Write-Host "  - PLAY button is now green"
Write-Host "  - Login subtitle updated to ECO SPIRIT"
Write-Host ""
Write-Host "Refresh browser!" -ForegroundColor Green
