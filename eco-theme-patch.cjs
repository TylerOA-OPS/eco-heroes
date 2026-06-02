// eco-theme-patch.cjs — brighter eco theme + animated butterflies
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-theme-patch.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Fix greenhouse nav icon from Flame to Leaf ──
P('Greenhouse nav icon Flame->Leaf',
"<NavButton label=\"GREENHOUSE\" sub=\"BUILD\" Icon={Flame} isActive={screen==='greenhouse'} onClick={()=>setScreen('greenhouse')} color=\"#86efac\"/>",
"<NavButton label=\"GREENHOUSE\" sub=\"BUILD\" Icon={Sparkles} isActive={screen==='greenhouse'} onClick={()=>setScreen('greenhouse')} color=\"#86efac\"/>"
);

// ── P2: Fix mobile nav greenhouse icon too ──
P('Mobile nav greenhouse icon',
"{label:'GREENHOUSE',sub:'BUILD',Icon:Flame,color:'#86efac',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},",
"{label:'GREENHOUSE',sub:'BUILD',Icon:Sparkles,color:'#86efac',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},"
);

// ── P3: Brighter meadow backgrounds (fox=Tyler, wolf=Carter) ──
P('Brighter meadow theme backgrounds',
"  const themeBg = selectedGoat==='fox'\n    ? `radial-gradient(circle at 0% 0%, rgba(10,80,40,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(29,158,117,0.2) 0%, transparent 45%),radial-gradient(ellipse at 50% -10%, #0a2a16 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(10,80,40,0.3) 0%, transparent 50%),linear-gradient(180deg, #0d1f10 0%, #081508 100%)`\n    : selectedGoat==='wolf'\n    ? `radial-gradient(circle at 0% 0%, rgba(15,110,86,0.6) 0%, transparent 45%),radial-gradient(circle at 100% 100%, rgba(34,211,238,0.15) 0%, transparent 40%),radial-gradient(ellipse at 50% -10%, #08241c 0%, transparent 55%),radial-gradient(ellipse at 100% 50%, rgba(15,110,86,0.3) 0%, transparent 50%),linear-gradient(180deg, #0b1e18 0%, #071510 100%)`\n    : `radial-gradient(ellipse at 50% 0%, #0a2a16 0%, transparent 50%),radial-gradient(ellipse at 100% 100%, #081e16 0%, transparent 50%),linear-gradient(180deg, #0d1f10 0%, #081508 100%)`;",
"  const themeBg = selectedGoat==='fox'\n    ? `radial-gradient(ellipse at 60% 0%, rgba(134,239,172,0.25) 0%, transparent 50%),radial-gradient(ellipse at 0% 80%, rgba(74,222,128,0.15) 0%, transparent 45%),linear-gradient(180deg, #0f2d18 0%, #0a1f10 100%)`\n    : selectedGoat==='wolf'\n    ? `radial-gradient(ellipse at 60% 0%, rgba(103,232,249,0.2) 0%, transparent 50%),radial-gradient(ellipse at 0% 80%, rgba(34,211,238,0.12) 0%, transparent 45%),linear-gradient(180deg, #0c2820 0%, #081c16 100%)`\n    : `radial-gradient(ellipse at 50% 0%, rgba(134,239,172,0.2) 0%, transparent 50%),linear-gradient(180deg, #0f2d18 0%, #0a1f10 100%)`;"
);

// ── P4: Nav dock — green vine border instead of orange ──
P('Nav dock eco styling',
'<div data-dock="true" style={{position:\'fixed\',bottom:16,left:\'50%\',transform:\'translateX(-50%)\',display:\'flex\',flexWrap:\'wrap\',justifyContent:\'center\',gap:6,padding:8,background:\'rgba(15,10,8,0.9)\',backdropFilter:\'blur(12px)\',borderRadius:18,border:\'1px solid rgba(255,107,0,0.25)\',boxShadow:\'0 12px 40px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset\',zIndex:50,maxWidth:\'calc(100vw - 32px)\',overflowX:\'auto\'}}>',
'<div data-dock="true" style={{position:\'fixed\',bottom:16,left:\'50%\',transform:\'translateX(-50%)\',display:\'flex\',flexWrap:\'wrap\',justifyContent:\'center\',gap:6,padding:8,background:\'rgba(8,20,12,0.92)\',backdropFilter:\'blur(14px)\',borderRadius:18,border:\'2px solid rgba(74,222,128,0.35)\',boxShadow:\'0 12px 40px -8px rgba(0,0,0,0.7), 0 0 20px rgba(74,222,128,0.08) inset, 0 0 0 1px rgba(134,239,172,0.06) inset\',zIndex:50,maxWidth:\'calc(100vw - 32px)\',overflowX:\'auto\'}}>'
);

// ── P5: NavButton active state — green instead of orange ──
P('NavButton active state green',
"background:isActive?(isHero?'linear-gradient(135deg, #ff6b00, #c2410c)':'rgba(255,107,0,0.18)'):(isHero?'linear-gradient(135deg, rgba(255,107,0,0.3), rgba(194,65,12,0.3))':'transparent'),color:isActive?'#fff7ed':(isHero?'#fb923c':color||'#a8a29e')",
"background:isActive?(isHero?'linear-gradient(135deg, #22c55e, #16a34a)':'rgba(74,222,128,0.18)'):(isHero?'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(34,197,94,0.3))':'transparent'),color:isActive?'#f0fdf4':(isHero?'#4ade80':color||'#a8a29e')"
);

// ── P6: Scrollbar green instead of orange ──
P('Scrollbar green',
'::-webkit-scrollbar-thumb { background:#ff6b0044; border-radius:4px; }',
'::-webkit-scrollbar-thumb { background:#4ade8044; border-radius:4px; }'
);

// ── P7: Add butterfly animation keyframes + butterfly component ──
P('Add butterfly keyframes and component',
'@keyframes twinkle { 0%,100%{opacity:0.3;} 50%{opacity:1;} }',
`@keyframes twinkle { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
    @keyframes butterfly-fly { 0%{transform:translateX(-80px) translateY(0px) scaleX(1);} 25%{transform:translateX(25vw) translateY(-40px) scaleX(-1);} 50%{transform:translateX(50vw) translateY(10px) scaleX(1);} 75%{transform:translateX(75vw) translateY(-30px) scaleX(-1);} 100%{transform:translateX(110vw) translateY(0px) scaleX(1);} }
    @keyframes butterfly-wing { 0%,100%{transform:scaleY(1);} 50%{transform:scaleY(0.3);} }
    @keyframes leaf-drift { 0%{transform:translateX(0) translateY(0) rotate(0deg);opacity:0.7;} 100%{transform:translateX(60px) translateY(120px) rotate(180deg);opacity:0;} }
    @keyframes petal-float { 0%{transform:translateX(0) rotate(0deg);opacity:0.6;} 100%{transform:translateX(40px) translateY(80px) rotate(360deg);opacity:0;} }`
);

// ── P8: Add Butterfly component before NavButton ──
P('Add Butterfly floating component',
'function NavButton({label,sub,Icon,emoji,isHero,isActive,onClick,color}){',
`function Butterfly({style}){
  return(
    <div style={{position:'absolute',pointerEvents:'none',fontSize:16,...style}}>
      <span style={{display:'inline-block',animation:'butterfly-wing 0.4s ease-in-out infinite alternate'}}>🦋</span>
    </div>
  );
}

function FloatingNature(){
  // Subtle background butterflies + drifting leaves
  const butterflies = [
    {top:'15%',animationDelay:'0s',  animationDuration:'18s',opacity:0.35},
    {top:'45%',animationDelay:'7s',  animationDuration:'22s',opacity:0.25},
    {top:'28%',animationDelay:'13s', animationDuration:'20s',opacity:0.30},
    {top:'65%',animationDelay:'4s',  animationDuration:'25s',opacity:0.20},
  ];
  const leaves = [
    {left:'10%',top:'20%',animationDelay:'0s',  animationDuration:'8s',  emoji:'🍃'},
    {left:'30%',top:'10%',animationDelay:'3s',  animationDuration:'10s', emoji:'🌸'},
    {left:'55%',top:'15%',animationDelay:'6s',  animationDuration:'9s',  emoji:'🍃'},
    {left:'75%',top:'8%', animationDelay:'1.5s',animationDuration:'11s', emoji:'🌸'},
    {left:'88%',top:'25%',animationDelay:'5s',  animationDuration:'7s',  emoji:'🌿'},
    {left:'20%',top:'5%', animationDelay:'9s',  animationDuration:'12s', emoji:'🌿'},
  ];
  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,overflow:'hidden'}}>
      {butterflies.map((b,i)=>(
        <div key={i} style={{position:'absolute',top:b.top,left:0,animation:'butterfly-fly '+b.animationDuration+' linear '+b.animationDelay+' infinite',opacity:b.opacity}}>
          <span style={{display:'inline-block',fontSize:18,animation:'butterfly-wing 0.45s ease-in-out infinite alternate'}}>🦋</span>
        </div>
      ))}
      {leaves.map((l,i)=>(
        <div key={'l'+i} style={{position:'absolute',left:l.left,top:l.top,animation:'leaf-drift '+l.animationDuration+' ease-in-out '+l.animationDelay+' infinite',opacity:0.3,fontSize:14}}>
          {l.emoji}
        </div>
      ))}
    </div>
  );
}

function NavButton({label,sub,Icon,emoji,isHero,isActive,onClick,color}){`
);

// ── P9: Inject FloatingNature into the main app render ──
P('Inject FloatingNature into app',
"      {/* Diagonal pattern overlay — themed */}",
"      <FloatingNature/>\n      {/* Diagonal pattern overlay — themed */}"
);

// ── P10: Mobile FAB button green ──
P('Mobile FAB green',
"background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',cursor:'pointer',fontSize:34,fontWeight:200,lineHeight:1,boxShadow:'0 8px 24px rgba(255,107,0,0.55), 0 0 0 4px rgba(15,10,8,0.92)'",
"background:'linear-gradient(135deg, #22c55e, #16a34a)',color:'#f0fdf4',cursor:'pointer',fontSize:34,fontWeight:200,lineHeight:1,boxShadow:'0 8px 24px rgba(74,222,128,0.4), 0 0 0 4px rgba(8,20,12,0.92)'"
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('');
console.log('APPLIED:'+ok+'  SKIPPED:'+skip);
if(skip>3){console.log('Too many skipped');process.exit(1);}
process.exit(0);
