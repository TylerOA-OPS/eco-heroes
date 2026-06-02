const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-greenhouse-vine.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Add Sprout to imports (safe - won't duplicate if already there) ──
P('Add Sprout to imports',
" Rocket } from 'lucide-react';",
" Rocket, Sprout } from 'lucide-react';"
);

// ── P2: Dock nav greenhouse icon Flame -> Sprout ──
P('Greenhouse dock icon Flame->Sprout',
'<NavButton label="GREENHOUSE" sub="BUILD" Icon={Flame} isActive={screen===\'greenhouse\'} onClick={()=>setScreen(\'greenhouse\')} color="#86efac"/>',
'<NavButton label="GREENHOUSE" sub="BUILD" Icon={Sprout} isActive={screen===\'greenhouse\'} onClick={()=>setScreen(\'greenhouse\')} color="#86efac"/>'
);

// ── P3: Mobile nav greenhouse Flame -> Sprout ──
P('Mobile nav greenhouse Flame->Sprout',
"{label:'GREENHOUSE',sub:'BUILD',Icon:Flame,color:'#86efac',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},",
"{label:'GREENHOUSE',sub:'BUILD',Icon:Sprout,color:'#86efac',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},"
);

// ── P4: Vine-style border + corner leaf decorations on the dock ──
P('Vine-style dock border',
"border:'2px solid rgba(74,222,128,0.35)',boxShadow:'0 12px 40px -8px rgba(0,0,0,0.7), 0 0 20px rgba(74,222,128,0.08) inset, 0 0 0 1px rgba(134,239,172,0.06) inset'",
"border:'none',boxShadow:'0 12px 40px -8px rgba(0,0,0,0.7), 0 0 0 2px #2d5a2e, 0 0 0 4px #1a3d1b, 0 0 0 6px rgba(74,222,128,0.15), 0 0 20px rgba(74,222,128,0.1)'"
);

// ── P5: Add vine animation + corner leaves via CSS ──
P('Add vine CSS animations',
'@keyframes petal-float { 0%{transform:translateX(0) rotate(0deg);opacity:0.6;} 100%{transform:translateX(40px) translateY(80px) rotate(360deg);opacity:0;} }',
`@keyframes petal-float { 0%{transform:translateX(0) rotate(0deg);opacity:0.6;} 100%{transform:translateX(40px) translateY(80px) rotate(360deg);opacity:0;} }
    @keyframes vine-grow { 0%,100%{opacity:0.6;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.08);} }
    [data-dock] { position:relative; }
    [data-dock]::before { content:'🌿'; position:absolute; top:-14px; left:16px; font-size:18px; pointer-events:none; animation:vine-grow 2.5s ease-in-out infinite; z-index:51; }
    [data-dock]::after  { content:'🌿'; position:absolute; top:-14px; right:16px; font-size:18px; pointer-events:none; animation:vine-grow 2.5s ease-in-out 1.2s infinite; transform:scaleX(-1); z-index:51; display:block; }`
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
