Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$file  = Join-Path $PSScriptRoot "src\EcoHeroes.jsx"
$patch = Join-Path $PSScriptRoot "fix-greenhouse-icon.cjs"
Write-Host "=== FIX GREENHOUSE ICON ===" -ForegroundColor Green
$result = node $patch $file 2>&1
$result | ForEach-Object { Write-Host $_ }
if($LASTEXITCODE -ne 0){ Write-Host "FAILED" -ForegroundColor Red; exit 1 }
Write-Host "Done - refresh browser!" -ForegroundColor Green
