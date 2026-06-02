# apply-eco-theme2.ps1
# Run from: C:\Users\TylerDren\eco-heroes

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$file = Join-Path $projectRoot "src\EcoHeroes.jsx"

Write-Host ""
Write-Host "=== APPLY ECO THEME 2 ===" -ForegroundColor Cyan
Write-Host "Target: $file"
Write-Host ""

if (-not (Test-Path $file)) {
    Write-Host "ERROR: Cannot find $file" -ForegroundColor Red; exit 1
}

$content = [System.IO.File]::ReadAllText($file) -replace "`r`n", "`n"
Write-Host "File loaded: $([Math]::Round($content.Length/1024))KB" -ForegroundColor Gray

# -------------------------------------------------------
# PRE-FLIGHT
# -------------------------------------------------------
Write-Host ""
Write-Host "--- PRE-FLIGHT CHECKS ---" -ForegroundColor Cyan

$p1 = $content.Contains("id:'lebron'")
$p2 = $content.Contains("id:'mj'")
$p3 = $content.Contains("selectedGoat==='lebron'")
$p4 = $content.Contains("HARDWOOD<br/>")

Write-Host "  [$(if($p1){'TRUE '}else{'FALSE'})] lebron object present"
Write-Host "  [$(if($p2){'TRUE '}else{'FALSE'})] mj object present"
Write-Host "  [$(if($p3){'TRUE '}else{'FALSE'})] selectedGoat lebron check present"
Write-Host "  [$(if($p4){'TRUE '}else{'FALSE'})] Pack art HARDWOOD present"

if (-not ($p1 -and $p2 -and $p3)) {
    Write-Host "PRE-FLIGHT FAILED - no changes made." -ForegroundColor Red; exit 1
}
Write-Host "Pre-flight PASSED." -ForegroundColor Green

$changes = 0

# -------------------------------------------------------
# Helper: safe replace with count
# -------------------------------------------------------
function SR($c, $old, $new, $label) {
    if ($c.Contains($old)) {
        Write-Host "  DONE: $label" -ForegroundColor Green
        return $c.Replace($old, $new)
    } else {
        Write-Host "  SKIP: $label" -ForegroundColor Yellow
        return $c
    }
}

# -------------------------------------------------------
# E13: Header wordmark gradient orange->green + HARDWOOD->ECO
# -------------------------------------------------------
$content = SR $content `
    "background:'linear-gradient(180deg, #fff7ed, #fb923c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>HARDWOOD</span>" `
    "background:'linear-gradient(180deg, #fff7ed, #4ade80)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>ECO</span>" `
    "E13 Header ECO wordmark"
$changes++

# -------------------------------------------------------
# E14: Header border/bg - orange tint -> green tint
# -------------------------------------------------------
$content = SR $content `
    "borderBottom:`${`"1px solid rgba(`${themeRgb},0.25)`"},background:`${`"linear-gradient(180deg, rgba(`${themePrimaryRgb},0.18) 0%, rgba(12,9,7,0.85) 100%)`"}" `
    "borderBottom:`${`"1px solid rgba(`${themeRgb},0.25)`"},background:`${`"linear-gradient(180deg, rgba(`${themeRgb},0.18) 0%, rgba(4,10,6,0.92) 100%)`"}" `
    "E14 Header bg green"
$changes++

# -------------------------------------------------------
# E16: App background - swap all three bg variants
# -------------------------------------------------------
$content = SR $content `
    "selectedGoat==='lebron'" `
    "selectedGoat==='fox'" `
    "E16 selectedGoat lebron->fox"
$changes++

$content = SR $content `
    "selectedGoat==='mj'" `
    "selectedGoat==='wolf'" `
    "E16 selectedGoat mj->wolf"
$changes++

# Fox bg (was lebron burgundy -> now forest green)
$content = SR $content `
    "radial-gradient(circle at 0% 0%, rgba(134,0,56,0.55) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(253,187,48,0.22) 0%, transparent 45%),radial-gradient(ellipse at 50% -10%, #4a1320 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(134,0,56,0.3) 0%, transparent 50%),linear-gradient(180deg, #1a0808 0%, #0a0303 100%)" `
    "radial-gradient(circle at 0% 0%, rgba(10,80,40,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(29,158,117,0.2) 0%, transparent 45%),radial-gradient(ellipse at 50% -10%, #051a0e 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(10,80,40,0.3) 0%, transparent 50%),linear-gradient(180deg, #060f08 0%, #030a05 100%)" `
    "E16 Fox bg forest green"
$changes++

# Wolf bg (was mj red -> now ocean teal)
$content = SR $content `
    "radial-gradient(circle at 0% 0%, rgba(206,17,65,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(255,247,237,0.10) 0%, transparent 40%),radial-gradient(ellipse at 50% -10%, #4a0e16 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(206,17,65,0.3) 0%, transparent 50%),linear-gradient(180deg, #1a0506 0%, #0a0303 100%)" `
    "radial-gradient(circle at 0% 0%, rgba(15,110,86,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(34,211,238,0.15) 0%, transparent 40%),radial-gradient(ellipse at 50% -10%, #041a14 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(15,110,86,0.3) 0%, transparent 50%),linear-gradient(180deg, #030f0b 0%, #020a07 100%)" `
    "E16 Wolf bg ocean teal"
$changes++

# Default bg (no goat selected)
$content = SR $content `
    "radial-gradient(ellipse at 50% 0%, #2a1810 0%, transparent 50%),radial-gradient(ellipse at 100% 100%, #1a0f0a 0%, transparent 50%),linear-gradient(180deg, #0c0907 0%, #0a0605 100%)" `
    "radial-gradient(ellipse at 50% 0%, #051a0e 0%, transparent 50%),radial-gradient(ellipse at 100% 100%, #041410 0%, transparent 50%),linear-gradient(180deg, #040d07 0%, #030a05 100%)" `
    "E16 Default bg green"
$changes++

# -------------------------------------------------------
# E17: Remove jersey number watermark
# -------------------------------------------------------
$content = SR $content `
    "{selectedGoat && <div style={{position:'fixed',bottom:-80,right:-40,fontFamily:'`"Bebas Neue`",sans-serif',fontSize:'clamp(360px, 50vw, 540px)',lineHeight:0.78,color:themeAccent,opacity:0.07,letterSpacing:'-0.05em',pointerEvents:'none',zIndex:0,userSelect:'none'}}>23</div>}" `
    "{/* eco: jersey watermark removed */}" `
    "E17 Jersey watermark removed"
$changes++

# -------------------------------------------------------
# E18: Fox/Wolf character objects (replace lebron/mj)
# -------------------------------------------------------
$content = SR $content `
    "id:'lebron', name:'LEBRON', last:'JAMES', team:'CAVS-HEAT-CAVS-LAL', number:23, pose:'dunk'," `
    "id:'fox', name:'THE', last:'FOX', team:'FOREST', number:9, pose:'fadeaway'," `
    "E18 Fox id/name"
$changes++

$content = SR $content `
    "primary:'#860038', accent:'#FDBB30'," `
    "primary:'#7c2d12', accent:'#fb923c'," `
    "E18 Fox colors"
$changes++

$content = SR $content `
    "rings:4, stats:{ pts:'42,440', ast:'12,045', reb:'11,885', stl:'2,381' }," `
    "rings:null, stats:{ pts:'45 CALLS', ast:'CUNNING', reb:'CLEVER', stl:'FAST' }," `
    "E18 Fox stats"
$changes++

$content = SR $content `
    "nickname:'THE KING'," `
    "nickname:'SLY COLLECTOR'," `
    "E18 Fox nickname"
$changes++

$content = SR $content `
    "id:'mj', name:'MICHAEL', last:'JORDAN', team:'BULLS', number:23, pose:'jumpman'," `
    "id:'wolf', name:'THE', last:'WOLF', team:'TUNDRA', number:6, pose:'jumpman'," `
    "E18 Wolf id/name"
$changes++

$content = SR $content `
    "primary:'#CE1141', accent:'#fff7ed'," `
    "primary:'#0f4c39', accent:'#22d3ee'," `
    "E18 Wolf colors"
$changes++

$content = SR $content `
    "rings:6, stats:{ pts:'32,292', ast:'5,633', reb:'6,672', stl:'2,514' }," `
    "rings:null, stats:{ pts:'60 KM/H', ast:'LOYAL', reb:'BOLD', stl:'STRONG' }," `
    "E18 Wolf stats"
$changes++

$content = SR $content `
    "nickname:'HIS AIRNESS'," `
    "nickname:'PACK TRADER'," `
    "E18 Wolf nickname"
$changes++

# -------------------------------------------------------
# E19: Login screen text
# -------------------------------------------------------
$content = SR $content `
    "WHO YOU ROLLIN' WITH TODAY?" `
    "FOX OR WOLF - WHO ARE YOU?" `
    "E19 Subtitle text"
$changes++

$content = SR $content `
    "PICK YOUR LEGEND" `
    "PICK YOUR SPIRIT ANIMAL" `
    "E19 Pick legend text"
$changes++

# -------------------------------------------------------
# E20: Theme colour constants
# -------------------------------------------------------
$content = SR $content `
    "const themeAccent = selectedGoat==='fox' ? '#FDBB30' : selectedGoat==='wolf' ? '#fff7ed' : '#fb923c';" `
    "const themeAccent = selectedGoat==='fox' ? '#fb923c' : selectedGoat==='wolf' ? '#22d3ee' : '#4ade80';" `
    "E20 themeAccent (post-E16 names)"
$changes++

# These run after E16 already swapped lebron->fox, mj->wolf
$content = SR $content `
    "const themePrimary = selectedGoat==='fox' ? '#860038' : selectedGoat==='wolf' ? '#CE1141' : '#fb923c';" `
    "const themePrimary = selectedGoat==='fox' ? '#7c2d12' : selectedGoat==='wolf' ? '#0f4c39' : '#14532d';" `
    "E20 themePrimary"
$changes++

$content = SR $content `
    "const themeRgb = selectedGoat==='fox' ? '253,187,48' : selectedGoat==='wolf' ? '206,17,65' : '255,107,0';" `
    "const themeRgb = selectedGoat==='fox' ? '251,146,60' : selectedGoat==='wolf' ? '34,211,238' : '74,222,128';" `
    "E20 themeRgb"
$changes++

$content = SR $content `
    "const themePrimaryRgb = selectedGoat==='fox' ? '134,0,56' : selectedGoat==='wolf' ? '206,17,65' : '255,107,0';" `
    "const themePrimaryRgb = selectedGoat==='fox' ? '124,45,18' : selectedGoat==='wolf' ? '15,76,57' : '20,83,45';" `
    "E20 themePrimaryRgb"
$changes++

$content = SR $content `
    "const themeName = selectedGoat==='fox' ? 'KING JAMES' : selectedGoat==='wolf' ? 'HIS AIRNESS' : null;" `
    "const themeName = selectedGoat==='fox' ? 'CLEVER FOX' : selectedGoat==='wolf' ? 'PACK WOLF' : null;" `
    "E20 themeName"
$changes++

$content = SR $content `
    "const themeTeam = selectedGoat==='fox' ? 'CAVS' : selectedGoat==='wolf' ? 'BULLS' : null;" `
    "const themeTeam = selectedGoat==='fox' ? 'FOREST' : selectedGoat==='wolf' ? 'TUNDRA' : null;" `
    "E20 themeTeam"
$changes++

$content = SR $content `
    "const themeNumber = selectedGoat ? 23 : null;" `
    "const themeNumber = selectedGoat==='fox' ? 9 : selectedGoat==='wolf' ? 6 : null;" `
    "E20 themeNumber"
$changes++

# -------------------------------------------------------
# E21: Pack opener text
# -------------------------------------------------------
$content = SR $content `
    ">HARDWOOD<br/>HEROES</div>" `
    ">ECO<br/>HEROES</div>" `
    "E21 Pack art ECO HEROES"
$changes++

# -------------------------------------------------------
# E22: Stat row labels in GoatPickerScreen
# -------------------------------------------------------
$content = SR $content `
    'label="POINTS" value={goat.stats.pts}' `
    'label="SPEED" value={goat.stats.pts}' `
    "E22 stat label POINTS->SPEED"
$changes++

$content = SR $content `
    'label="ASSISTS" value={goat.stats.ast}' `
    'label="SKILL" value={goat.stats.ast}' `
    "E22 stat label ASSISTS->SKILL"
$changes++

$content = SR $content `
    'label="REBOUNDS" value={goat.stats.reb}' `
    'label="TRAIT" value={goat.stats.reb}' `
    "E22 stat label REBOUNDS->TRAIT"
$changes++

$content = SR $content `
    'label="STEALS" value={goat.stats.stl}' `
    'label="POWER" value={goat.stats.stl}' `
    "E22 stat label STEALS->POWER"
$changes++

# -------------------------------------------------------
# SANITY CHECKS
# -------------------------------------------------------
Write-Host ""
Write-Host "--- SANITY CHECKS ---" -ForegroundColor Cyan

$s1 = $content.Contains("id:'fox'")
$s2 = $content.Contains("id:'wolf'")
$s3 = $content.Contains("ECO<br/>")
$s4 = $content.Contains("selectedGoat==='fox'")
$s5 = -not $content.Contains("id:'lebron'")
$s6 = -not $content.Contains("id:'mj'")
$s7 = $content.Contains("rgba(10,80,40")

Write-Host "  [$(if($s1){'TRUE '}else{'FALSE'})] Fox character present"
Write-Host "  [$(if($s2){'TRUE '}else{'FALSE'})] Wolf character present"
Write-Host "  [$(if($s3){'TRUE '}else{'FALSE'})] Pack art says ECO"
Write-Host "  [$(if($s4){'TRUE '}else{'FALSE'})] selectedGoat fox check present"
Write-Host "  [$(if($s5){'TRUE '}else{'FALSE'})] LeBron id removed"
Write-Host "  [$(if($s6){'TRUE '}else{'FALSE'})] MJ id removed"
Write-Host "  [$(if($s7){'TRUE '}else{'FALSE'})] Green background color present"

if (-not ($s1 -and $s2 -and $s4 -and $s5 -and $s6)) {
    Write-Host ""
    Write-Host "SANITY CHECK FAILED - writing aborted." -ForegroundColor Red; exit 1
}

# -------------------------------------------------------
# WRITE
# -------------------------------------------------------
$final = $content -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($file, $final, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Refresh your browser to see all changes." -ForegroundColor Cyan
Write-Host ""
