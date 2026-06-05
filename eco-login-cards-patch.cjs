// eco-login-cards-patch.cjs
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-login-cards-patch.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Fix Fox stats — replace "45 CALLS" with "45 KM/H" ──
P('Fix fox speed stat',
"rings:null, stats:{ pts:'45 CALLS', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },\n    nickname:'SLY COLLECTOR',",
"rings:null, stats:{ pts:'45 KM/H', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },\n    nickname:'SLY COLLECTOR',"
);
// also in LoginScreen (legacy)
P('Fix fox speed stat legacy',
"rings:null, stats:{ pts:'45 CALLS', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },\n  nickname:'SLY COLLECTOR',",
"rings:null, stats:{ pts:'45 KM/H', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },\n  nickname:'SLY COLLECTOR',"
);

// ── P2: Remove Rings trophy box from GoatPickerScreen ──
P('Remove rings box GoatPickerScreen',
"          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 10px',borderRadius:10,background:'rgba(0,0,0,0.5)',border:`1px solid ${goat.accent}66`}}>\n            <Trophy size={20} style={{color:goat.accent}}/>\n            <div style={{fontFamily:'\"Bebas Neue\",sans-serif',fontSize:18,color:'#fff7ed',lineHeight:1,letterSpacing:'0.04em'}}>×{goat.rings}</div>\n            <div style={{fontSize:7.5,color:'#fff7ed99',fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.12em'}}>RINGS</div>\n          </div>",
''
);

// ── P3: Remove Rings trophy box from legacy LoginScreen ──
P('Remove rings box legacy LoginScreen',
"          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 10px',borderRadius:10,background:'rgba(0,0,0,0.5)',border:`1px solid ${goat.accent}66`}}>\n            <Trophy size={20} style={{color:goat.accent}}/>\n            <div style={{fontFamily:'\"Bebas Neue\",sans-serif',fontSize:18,color:'#fff7ed',lineHeight:1,letterSpacing:'0.04em'}}>×{goat.rings}</div>\n            <div style={{fontSize:7.5,color:'#fff7ed99',fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.12em'}}>RINGS</div>\n          </div>",
''
);

// ── P4: Remove big watermark number from login cards (GoatPickerScreen) ──
P('Remove number watermark GoatPickerScreen',
"        {/* Big jersey number watermark */}\n        <div style={{position:'absolute',top:'18%',right:side==='left'?'-10%':'auto',left:side==='right'?'-10%':'auto',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:280,fontWeight:900,lineHeight:0.85,color:goat.accent,opacity:0.07,letterSpacing:'-0.05em',pointerEvents:'none'}}>{goat.number}</div>",
"        {/* number watermark removed */}"
);

// ── P5: Remove #number from header strip on login cards ──
P('Remove number from login card header',
"            <div style={{fontFamily:'\"JetBrains Mono\",monospace',fontSize:10,color:'#fff7edcc',marginTop:6,letterSpacing:'0.18em'}}>#{goat.number} · {goat.team}</div>",
"            <div style={{fontFamily:'\"JetBrains Mono\",monospace',fontSize:10,color:'#fff7edcc',marginTop:6,letterSpacing:'0.18em'}}>{goat.team}</div>"
);

// ── P6: Eco green PLAY button instead of orange ──
P('Green PLAY button on login',
"background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:32,letterSpacing:'0.12em',boxShadow:'0 8px 28px rgba(255,107,0,0.5), inset 0 -3px 0 rgba(0,0,0,0.3)',marginBottom:10,transform:'rotate(-2deg)'",
"background:'linear-gradient(135deg, #22c55e, #15803d)',color:'#f0fdf4',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:32,letterSpacing:'0.12em',boxShadow:'0 8px 28px rgba(74,222,128,0.4), inset 0 -3px 0 rgba(0,0,0,0.3)',marginBottom:10,transform:'rotate(-2deg)'"
);

// ── P7: Update login subtitle text ──
P('Update login subtitle',
"FOX OR WOLF - WHO ARE YOU?",
"CHOOSE YOUR ECO SPIRIT"
);

// ── P8: Remove big number watermark from game cards (hasPose branch) ──
P('Remove number watermark from game cards with pose',
"    {hasPose && <div style={{position:'absolute',top:'8%',right:'6%',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:'clamp(110px, 18vw, 170px)',fontWeight:900,lineHeight:1,color:r.color,opacity:0.12,letterSpacing:'-0.05em',pointerEvents:'none'}}>{card.number}</div>}",
"    {/* number watermark removed */}"
);

// ── P9: Replace number display on cards without pose ──
P('Remove big number on no-pose cards',
") : <div style={{position:'absolute',top:'20%',left:0,right:0,textAlign:'center',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:'clamp(80px, 14vw, 130px)',fontWeight:900,lineHeight:1,color:r.color,textShadow:`0 0 30px ${r.glow}, 0 4px 0 rgba(0,0,0,0.5)`,letterSpacing:'-0.04em'}}>{card.number}</div>}",
") : <div style={{position:'absolute',top:'12%',left:'10%',right:'10%',bottom:'32%',color:r.color,filter:`drop-shadow(0 4px 10px ${r.glow})`}}><Pose color={r.color}/></div>}"
);

// ── P10: Remove number from small card thumbnail ──
P('Remove number from small card thumbnail',
"    <div style={{position:'absolute',top:'15%',left:0,right:0,textAlign:'center',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:38,lineHeight:1,color:r.color,textShadow:`0 0 12px ${r.glow}`}}>{card.number}</div>",
''
);

// ── P11: Remove #number from card detail modal ──
P('Remove number from card detail',
"                <div style={{fontSize:9,color:'#a8a29e',marginTop:3,fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.08em'}}>#{card.number} · {t?.name || card.team}</div>",
"                <div style={{fontSize:9,color:'#a8a29e',marginTop:3,fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.08em'}}>{t?.name || card.team}</div>"
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
