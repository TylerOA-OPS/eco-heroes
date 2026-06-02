# apply-eco-theme3.ps1
# Run from: C:\Users\TylerDren\eco-heroes

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$file = Join-Path $projectRoot "src\EcoHeroes.jsx"
$patchFile = Join-Path $projectRoot "eco-patch.cjs"

Write-Host ""
Write-Host "=== APPLY ECO THEME 3 ===" -ForegroundColor Cyan
Write-Host "Target: $file"
Write-Host ""

if (-not (Test-Path $file)) {
    Write-Host "ERROR: Cannot find $file" -ForegroundColor Red; exit 1
}

# -------------------------------------------------------
# Write a Node.js patch script - avoids ALL PS quoting issues
# -------------------------------------------------------
$nodeScript = @'
const fs = require('fs');
const file = process.argv[2];
let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const results = [];

function SR(old, next, label) {
  if (c.includes(old)) {
    c = c.split(old).join(next);
    results.push('  DONE: ' + label);
  } else {
    results.push('  SKIP: ' + label);
  }
}

// E23: Login screen bg - red -> forest green
SR(
  "radial-gradient(ellipse at 30% 20%, rgba(134,0,56,0.25) 0%, transparent 50%),radial-gradient(ellipse at 70% 20%, rgba(206,17,65,0.25) 0%, transparent 50%),radial-gradient(ellipse at 50% 100%, rgba(255,107,0,0.15) 0%, transparent 60%),linear-gradient(180deg, #0c0907, #0a0605)",
  "radial-gradient(ellipse at 30% 20%, rgba(10,80,40,0.35) 0%, transparent 50%),radial-gradient(ellipse at 70% 20%, rgba(15,110,86,0.25) 0%, transparent 50%),radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.1) 0%, transparent 60%),linear-gradient(180deg, #060f08, #030a05)",
  "E23 Login bg green"
);

// E24a: PortraitDunk -> Fox silhouette
SR(
  `function PortraitDunk({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}>`,
  `function PortraitDunk({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}>{/* FOX */}`,
  "E24a PortraitDunk anchor check"
);

// Replace full PortraitDunk body
const oldDunk = `function PortraitDunk({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}>{/* FOX */}<g transform="translate(155, 32)"><circle r="22" fill={color}/><path d="M-22 0 Q-11 -8 0 -8 Q11 -8 22 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><path d="M-22 0 Q-11 8 0 8 Q11 8 22 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><line x1="0" y1="-22" x2="0" y2="22" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/></g><path d="M95 88 Q112 60 138 40 L156 56 Q132 72 112 96 Z" fill={color}/><path d="M82 64 Q72 64 70 78 Q70 92 86 92 Q98 92 100 80 Q100 64 82 64 Z" fill={color}/><path d="M70 92 L112 96 L118 168 L62 158 Z" fill={color}/><path d="M65 102 Q35 112 28 144 L42 154 Q52 132 78 122 Z" fill={color}/><path d="M82 158 L58 215 L72 226 L100 168 Z" fill={color}/><path d="M110 162 L160 235 L144 244 L100 176 Z" fill={color}/></svg>);}`;
const newDunk = `function PortraitDunk({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="200" rx="55" ry="38" fill={color} opacity="0.9"/><ellipse cx="100" cy="165" rx="35" ry="28" fill={color}/><circle cx="100" cy="120" r="32" fill={color}/><ellipse cx="76" cy="92" rx="10" ry="20" fill={color} transform="rotate(-18,76,92)"/><ellipse cx="124" cy="92" rx="10" ry="20" fill={color} transform="rotate(18,124,92)"/><ellipse cx="88" cy="126" rx="8" ry="6" fill={color} opacity="0.7"/><ellipse cx="112" cy="126" rx="8" ry="6" fill={color} opacity="0.7"/><path d="M60 230 Q50 260 44 270 Q38 260 52 245 Z" fill={color}/><path d="M140 230 Q150 260 156 270 Q162 260 148 245 Z" fill={color}/><ellipse cx="155" cy="268" rx="14" ry="8" fill={color} opacity="0.6"/><ellipse cx="45" cy="268" rx="14" ry="8" fill={color} opacity="0.6"/></svg>);}`;
if (c.includes(oldDunk)) { c = c.split(oldDunk).join(newDunk); results.push('  DONE: E24 Fox body'); }
else { results.push('  SKIP: E24 Fox body'); }

// E24b: PortraitJumpman -> Wolf
const oldJump = `function PortraitJumpman({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><g transform="translate(170, 22)"><circle r="18" fill={color}/><line x1="-18" y1="0" x2="18" y2="0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/><path d="M-18 0 Q-9 -7 0 -7 Q9 -7 18 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/></g><path d="M100 78 L155 28 L168 38 L115 92 Z" fill={color}/><ellipse cx="92" cy="72" rx="11" ry="13" fill={color}/><path d="M78 88 Q70 110 76 145 L120 155 Q130 120 118 92 Z" fill={color}/><path d="M82 98 L40 90 L34 102 L78 118 Z" fill={color}/><path d="M82 142 L40 178 L48 192 L92 158 Z" fill={color}/><path d="M115 150 L160 220 L144 232 L100 168 Z" fill={color}/></svg>);}`;
const newJump = `function PortraitJumpman({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="205" rx="52" ry="35" fill={color} opacity="0.9"/><ellipse cx="100" cy="168" rx="32" ry="26" fill={color}/><circle cx="100" cy="118" r="34" fill={color}/><ellipse cx="78" cy="85" rx="9" ry="24" fill={color} transform="rotate(-10,78,85)"/><ellipse cx="122" cy="85" rx="9" ry="24" fill={color} transform="rotate(10,122,85)"/><ellipse cx="86" cy="124" rx="7" ry="5" fill={color} opacity="0.65"/><ellipse cx="114" cy="124" rx="7" ry="5" fill={color} opacity="0.65"/><ellipse cx="100" cy="133" rx="14" ry="9" fill={color} opacity="0.8"/><path d="M72 235 Q64 255 58 268 Q68 258 76 262 Z" fill={color}/><path d="M128 235 Q136 255 142 268 Q132 258 124 262 Z" fill={color}/><path d="M55 200 Q30 185 22 195 Q18 182 38 178 Q50 175 65 192 Z" fill={color}/><path d="M145 200 Q170 185 178 195 Q182 182 162 178 Q150 175 135 192 Z" fill={color}/></svg>);}`;
if (c.includes(oldJump)) { c = c.split(oldJump).join(newJump); results.push('  DONE: E24 Wolf body'); }
else { results.push('  SKIP: E24 Wolf body'); }

// E24c: PortraitFadeaway -> Owl
const oldFade = `function PortraitFadeaway({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><g transform="translate(105, 20)"><circle r="18" fill={color}/><path d="M-18 0 Q-9 -8 0 -8 Q9 -8 18 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><path d="M-18 0 Q-9 8 0 8 Q9 8 18 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><line x1="0" y1="-18" x2="0" y2="18" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/></g><path d="M88 80 L100 35 L115 38 L105 88 Z" fill={color}/><ellipse cx="78" cy="72" rx="11" ry="13" fill={color}/><path d="M70 88 Q58 115 65 160 L110 165 Q115 125 105 90 Z" fill={color}/><path d="M75 105 L48 130 L55 142 L88 122 Z" fill={color}/><path d="M72 158 L52 220 L66 228 L90 168 Z" fill={color}/><path d="M100 162 L138 215 L124 224 L92 170 Z" fill={color}/></svg>);}`;
const newFade = `function PortraitFadeaway({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="195" rx="44" ry="55" fill={color}/><circle cx="100" cy="115" r="48" fill={color}/><ellipse cx="72" cy="75" rx="14" ry="30" fill={color} transform="rotate(-15,72,75)"/><ellipse cx="128" cy="75" rx="14" ry="30" fill={color} transform="rotate(15,128,75)"/><ellipse cx="80" cy="118" rx="18" ry="20" fill={color} opacity="0.5"/><ellipse cx="120" cy="118" rx="18" ry="20" fill={color} opacity="0.5"/><path d="M55 190 Q30 210 28 235 Q20 215 38 200 Q46 194 58 198 Z" fill={color}/><path d="M145 190 Q170 210 172 235 Q180 215 162 200 Q154 194 142 198 Z" fill={color}/></svg>);}`;
if (c.includes(oldFade)) { c = c.split(oldFade).join(newFade); results.push('  DONE: E24 Owl body'); }
else { results.push('  SKIP: E24 Owl body'); }

// E24d: PortraitSkyhook -> Eagle
const oldSky = `function PortraitSkyhook({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><g transform="translate(155, 18)"><circle r="20" fill={color}/><path d="M-20 0 Q-10 -8 0 -8 Q10 -8 20 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><path d="M-20 0 Q-10 8 0 8 Q10 8 20 0" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none"/><line x1="0" y1="-20" x2="0" y2="20" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/></g><path d="M85 75 Q120 45 152 30 L160 48 Q128 64 100 92 Z" fill={color}/><ellipse cx="78" cy="68" rx="12" ry="14" fill={color}/><path d="M65 88 L108 92 L110 175 L62 170 Z" fill={color}/><path d="M68 110 L40 130 L44 144 L78 128 Z" fill={color}/><path d="M70 168 L60 240 L78 245 L92 175 Z" fill={color}/><path d="M100 172 L130 215 L144 208 L112 168 Z" fill={color}/></svg>);}`;
const newSky = `function PortraitSkyhook({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="155" rx="22" ry="55" fill={color}/><circle cx="100" cy="88" r="26" fill={color}/><path d="M22 140 Q10 120 8 100 Q18 95 30 108 Q50 100 78 138 Z" fill={color}/><path d="M178 140 Q190 120 192 100 Q182 95 170 108 Q150 100 122 138 Z" fill={color}/><path d="M30 108 Q18 130 15 158 Q28 148 42 148 Q60 140 78 138 Z" fill={color} opacity="0.85"/><path d="M170 108 Q182 130 185 158 Q172 148 158 148 Q140 140 122 138 Z" fill={color} opacity="0.85"/><ellipse cx="100" cy="215" rx="12" ry="30" fill={color}/><path d="M88 240 Q78 258 72 268 Q84 260 92 262 Z" fill={color}/><path d="M112 240 Q122 258 128 268 Q116 260 108 262 Z" fill={color}/></svg>);}`;
if (c.includes(oldSky)) { c = c.split(oldSky).join(newSky); results.push('  DONE: E24 Eagle body'); }
else { results.push('  SKIP: E24 Eagle body'); }

// E25: Lighten fox bg
SR(
  "radial-gradient(circle at 0% 0%, rgba(10,80,40,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(29,158,117,0.2) 0%, transparent 45%),radial-gradient(ellipse at 50% -10%, #051a0e 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(10,80,40,0.3) 0%, transparent 50%),linear-gradient(180deg, #060f08 0%, #030a05 100%)",
  "radial-gradient(circle at 0% 0%, rgba(10,80,40,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(29,158,117,0.2) 0%, transparent 45%),radial-gradient(ellipse at 50% -10%, #0a2a16 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(10,80,40,0.3) 0%, transparent 50%),linear-gradient(180deg, #0d1f10 0%, #081508 100%)",
  "E25 Fox bg lighter"
);
// E25: Lighten wolf bg
SR(
  "radial-gradient(circle at 0% 0%, rgba(15,110,86,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(34,211,238,0.15) 0%, transparent 40%),radial-gradient(ellipse at 50% -10%, #041a14 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(15,110,86,0.3) 0%, transparent 50%),linear-gradient(180deg, #030f0b 0%, #020a07 100%)",
  "radial-gradient(circle at 0% 0%, rgba(15,110,86,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(34,211,238,0.15) 0%, transparent 40%),radial-gradient(ellipse at 50% -10%, #08241c 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(15,110,86,0.3) 0%, transparent 50%),linear-gradient(180deg, #0b1e18 0%, #071510 100%)",
  "E25 Wolf bg lighter"
);
// E25: Lighten default bg
SR(
  "radial-gradient(ellipse at 50% 0%, #051a0e 0%, transparent 50%),radial-gradient(ellipse at 100% 100%, #041410 0%, transparent 50%),linear-gradient(180deg, #040d07 0%, #030a05 100%)",
  "radial-gradient(ellipse at 50% 0%, #0a2a16 0%, transparent 50%),radial-gradient(ellipse at 100% 100%, #081e16 0%, transparent 50%),linear-gradient(180deg, #0d1f10 0%, #081508 100%)",
  "E25 Default bg lighter"
);

results.forEach(r => console.log(r));

// Sanity
const ok = c.includes("ellipse cx=\"100\" cy=\"205\"") && c.includes("ellipse cx=\"100\" cy=\"155\"");
if (!ok) { console.log('SANITY FAILED'); process.exit(1); }

fs.writeFileSync(file, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('SUCCESS');
'@

[System.IO.File]::WriteAllText($patchFile, $nodeScript, [System.Text.Encoding]::UTF8)
Write-Host "Patch script written to: $patchFile" -ForegroundColor Gray

# Run it with Node
Write-Host ""
Write-Host "Running patch via Node.js..." -ForegroundColor Cyan
$result = node $patchFile $file 2>&1
$result | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PATCH FAILED" -ForegroundColor Red
    Remove-Item $patchFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $patchFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes applied:" -ForegroundColor Cyan
Write-Host "  - Login screen: green background"
Write-Host "  - Card portraits: fox/wolf/owl/eagle silhouettes"
Write-Host "  - App background: slightly lighter greens"
Write-Host ""
Write-Host "Refresh your browser." -ForegroundColor Cyan
