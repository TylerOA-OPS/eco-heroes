# apply-eco-logo.ps1
# Run from: C:\Users\TylerDren\eco-heroes
# Usage:    .\apply-eco-logo.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Fix: use $PSScriptRoot so [System.IO.File] gets the absolute path
# regardless of .NET working directory
$projectRoot = $PSScriptRoot
$file = Join-Path $projectRoot "src\EcoHeroes.jsx"

Write-Host ""
Write-Host "=== APPLY ECO LOGO ===" -ForegroundColor Cyan
Write-Host "Project root: $projectRoot"
Write-Host "Target:       $file"
Write-Host ""

if (-not (Test-Path $file)) {
    Write-Host "ERROR: Cannot find $file" -ForegroundColor Red
    exit 1
}

$content = [System.IO.File]::ReadAllText($file) -replace "`r`n", "`n"

Write-Host "File loaded: $([Math]::Round($content.Length/1024))KB" -ForegroundColor Gray

# -------------------------------------------------------
# PRE-FLIGHT
# -------------------------------------------------------
$anchorStart = 'function LogoBadge('
$anchorEnd   = "`n`n/* HELPERS */"

Write-Host ""
Write-Host "--- PRE-FLIGHT CHECKS ---" -ForegroundColor Cyan

$checkStart = $content.Contains($anchorStart)
$checkEnd   = $content.Contains($anchorEnd)

Write-Host "  [$(if($checkStart){'TRUE '}else{'FALSE'})] Anchor start: 'function LogoBadge('"
Write-Host "  [$(if($checkEnd)  {'TRUE '}else{'FALSE'})] Anchor end:   double-newline + '/* HELPERS */'"

if (-not $checkStart -or -not $checkEnd) {
    Write-Host ""
    Write-Host "PRE-FLIGHT FAILED - no changes made." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pre-flight PASSED." -ForegroundColor Green

# -------------------------------------------------------
# NEW LogoBadge COMPONENT
# -------------------------------------------------------
$newComponent = @'
function LogoBadge({size=180, accent='#1D9E75', primary='#fff7ed', dark='#085041'}){
  return (
    <svg viewBox="0 0 200 220" style={{width:size, height:Math.round(size*1.1), display:'block', flexShrink:0}}>
      <circle cx="100" cy="95" r="54" fill="#5DCAA5"/>
      <clipPath id="gcl"><circle cx="100" cy="95" r="54"/></clipPath>
      <g clipPath="url(#gcl)">
        <ellipse cx="83" cy="88" rx="36" ry="44" fill="#3B6D11"/>
        <ellipse cx="123" cy="63" rx="23" ry="19" fill="#4a8a18"/>
        <ellipse cx="96" cy="134" rx="29" ry="16" fill="#3B6D11"/>
        <ellipse cx="70" cy="75" rx="12" ry="15" fill="#27500A"/>
        <ellipse cx="90" cy="96" rx="10" ry="12" fill="#27500A"/>
        <ellipse cx="119" cy="72" rx="9" ry="11" fill="#27500A"/>
        <line x1="118" y1="90" x2="150" y2="90" stroke="#1D9E75" strokeWidth="2" opacity="0.5"/>
        <line x1="116" y1="99" x2="151" y2="99" stroke="#1D9E75" strokeWidth="2" opacity="0.4"/>
        <line x1="119" y1="108" x2="150" y2="108" stroke="#1D9E75" strokeWidth="2" opacity="0.3"/>
      </g>
      <circle cx="100" cy="95" r="54" fill="none" stroke="#085041" strokeWidth="1.8"/>
      <g transform="translate(148,53)">
        <ellipse cx="0" cy="3" rx="6" ry="4" fill="#D85A30" transform="rotate(-40,0,3)"/>
        <circle cx="4" cy="-4" r="4" fill="#D85A30"/>
        <polygon points="1,-8 -1,-13 5,-9" fill="#D85A30"/>
        <polygon points="6,-7 5,-13 10,-9" fill="#D85A30"/>
        <ellipse cx="7" cy="-2" rx="2.5" ry="2" fill="#F5C4B3"/>
        <path d="M-6,6 Q-10,12 -7,16 Q-3,10 -2,7" fill="#D85A30"/>
        <ellipse cx="-7" cy="16" rx="3" ry="2.5" fill="#faeeda"/>
      </g>
      <g transform="translate(162,94)">
        <ellipse cx="0" cy="4" rx="6" ry="5" fill="#B4B2A9"/>
        <circle cx="0" cy="-4" r="5" fill="#B4B2A9"/>
        <polygon points="-4,-8 -6,-14 -1,-9" fill="#888780"/>
        <polygon points="4,-8 6,-14 1,-9" fill="#888780"/>
        <ellipse cx="0" cy="-2" rx="2.5" ry="2" fill="#D3D1C7"/>
        <circle cx="-2" cy="-6" r="1.2" fill="#444441"/>
        <circle cx="2" cy="-6" r="1.2" fill="#444441"/>
        <line x1="-3" y1="9" x2="-4" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="0" y1="9" x2="0" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3" y1="9" x2="4" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(147,143)">
        <ellipse cx="-6" cy="-2" rx="7" ry="5" fill="#F4C0D1" opacity="0.9" transform="rotate(30,-6,-2)"/>
        <ellipse cx="6" cy="-2" rx="7" ry="5" fill="#F4C0D1" opacity="0.9" transform="rotate(-30,6,-2)"/>
        <ellipse cx="-5" cy="4" rx="5" ry="3" fill="#ED93B1" opacity="0.9"/>
        <ellipse cx="5" cy="4" rx="5" ry="3" fill="#ED93B1" opacity="0.9"/>
        <ellipse cx="0" cy="0" rx="1.5" ry="5" fill="#4B1528"/>
        <line x1="-1" y1="-5" x2="-5" y2="-10" stroke="#4B1528" strokeWidth="0.8"/>
        <circle cx="-5" cy="-11" r="1.2" fill="#4B1528"/>
        <line x1="1" y1="-5" x2="5" y2="-10" stroke="#4B1528" strokeWidth="0.8"/>
        <circle cx="5" cy="-11" r="1.2" fill="#4B1528"/>
      </g>
      <g transform="translate(100,156)">
        <ellipse cx="0" cy="4" rx="6" ry="7" fill="#AFA9EC"/>
        <circle cx="0" cy="-5" r="5.5" fill="#AFA9EC"/>
        <polygon points="-4,-9 -6,-15 -1,-10" fill="#7F77DD"/>
        <polygon points="4,-9 6,-15 1,-10" fill="#7F77DD"/>
        <circle cx="-2.5" cy="-6" r="2.5" fill="#faeeda"/>
        <circle cx="2.5" cy="-6" r="2.5" fill="#faeeda"/>
        <circle cx="-2.5" cy="-6" r="1.2" fill="#26215C"/>
        <circle cx="2.5" cy="-6" r="1.2" fill="#26215C"/>
        <polygon points="0,-4 -1,-2 1,-2" fill="#EF9F27"/>
      </g>
      <g transform="translate(53,143)">
        <ellipse cx="0" cy="0" rx="5" ry="3" fill="#2C2C2A"/>
        <path d="M-5,0 Q-13,-6 -15,-3" stroke="#2C2C2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M5,0 Q13,-6 15,-3" stroke="#2C2C2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="0" cy="-3" r="3" fill="#faeeda"/>
        <path d="M2.5,-3 L6,-2" stroke="#EF9F27" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M-2.5,3 Q0,7 2.5,3" fill="#2C2C2A"/>
      </g>
      <g transform="translate(37,94)">
        <ellipse cx="0" cy="4" rx="7" ry="6" fill="#633806"/>
        <circle cx="0" cy="-5" r="5.5" fill="#633806"/>
        <circle cx="-5" cy="-10" r="3" fill="#633806"/>
        <circle cx="5" cy="-10" r="3" fill="#633806"/>
        <circle cx="-5" cy="-10" r="1.8" fill="#FAC775"/>
        <circle cx="5" cy="-10" r="1.8" fill="#FAC775"/>
        <ellipse cx="0" cy="-2" rx="3" ry="2.5" fill="#FAC775"/>
        <circle cx="0" cy="-3" r="1" fill="#412402"/>
        <circle cx="-2.5" cy="-6" r="1.2" fill="#412402"/>
        <circle cx="2.5" cy="-6" r="1.2" fill="#412402"/>
      </g>
      <g transform="translate(53,50)">
        <ellipse cx="0" cy="3" rx="5.5" ry="4.5" fill="#888780"/>
        <circle cx="0" cy="-3" r="5" fill="#888780"/>
        <ellipse cx="-2" cy="-4" rx="2" ry="1.6" fill="#2C2C2A"/>
        <ellipse cx="2" cy="-4" rx="2" ry="1.6" fill="#2C2C2A"/>
        <circle cx="-4" cy="-8" r="2.5" fill="#888780"/>
        <circle cx="4" cy="-8" r="2.5" fill="#888780"/>
        <ellipse cx="0" cy="-1" rx="2" ry="1.8" fill="#D3D1C7"/>
        <circle cx="0" cy="-2" r="1" fill="#2C2C2A"/>
        <path d="M5,5 Q10,9 9,14 Q6,9 5,13 Q3,9 2,6" fill="#888780"/>
      </g>
      <text x="100" y="177" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" fill="#085041" letterSpacing="2.5">DESIGN · COLLECT · TRADE</text>
      <text x="100" y="196" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#085041" letterSpacing="2.5">ECO</text>
      <text x="100" y="214" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="#1D9E75" letterSpacing="5">HEROES</text>
    </svg>
  );
}
'@

# -------------------------------------------------------
# FIND AND REPLACE
# -------------------------------------------------------
$startIdx = $content.IndexOf($anchorStart)
$endIdx   = $content.IndexOf($anchorEnd)

$before = $content.Substring(0, $startIdx)
$after  = $content.Substring($endIdx)
$newContent = $before + $newComponent + $after

# -------------------------------------------------------
# SANITY CHECKS
# -------------------------------------------------------
Write-Host ""
Write-Host "--- SANITY CHECKS ---" -ForegroundColor Cyan

$s1 = $newContent.Contains('function LogoBadge(')
$s2 = $newContent.Contains('ECO')
$s3 = $newContent.Contains('HEROES')
$s4 = $newContent.Contains('DESIGN')
$s5 = $newContent.Contains('5DCAA5')

Write-Host "  [$(if($s1){'TRUE '}else{'FALSE'})] LogoBadge function present"
Write-Host "  [$(if($s2){'TRUE '}else{'FALSE'})] ECO text present"
Write-Host "  [$(if($s3){'TRUE '}else{'FALSE'})] HEROES text present"
Write-Host "  [$(if($s4){'TRUE '}else{'FALSE'})] Tagline DESIGN present"
Write-Host "  [$(if($s5){'TRUE '}else{'FALSE'})] Globe teal color present"

if (-not ($s1 -and $s2 -and $s3 -and $s4 -and $s5)) {
    Write-Host ""
    Write-Host "SANITY CHECK FAILED - writing aborted, no changes made." -ForegroundColor Red
    exit 1
}

# -------------------------------------------------------
# WRITE — use absolute path so .NET finds the file
# -------------------------------------------------------
$final = $newContent -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($file, $final, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS - LogoBadge replaced!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vite will hot-reload. Refresh your browser." -ForegroundColor Cyan
if ($newContent.Contains('HARDWOOD')) {
    Write-Host ""
    Write-Host "NOTE: 'HARDWOOD' still appears in the pack art text." -ForegroundColor Yellow
    Write-Host "      We will fix that in the next script." -ForegroundColor Yellow
}
Write-Host ""
