// fix-card-numbers.cjs — remove all number displays from game cards
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-card-numbers.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// Line 503 — faded watermark number on cards WITH pose
P('Remove faded watermark number (pose cards)',
'    {hasPose && <div style={{position:\'absolute\',top:\'8%\',right:\'6%\',fontFamily:\'"Bebas Neue",sans-serif\',fontSize:\'clamp(110px, 18vw, 170px)\',fontWeight:900,lineHeight:1,color:r.color,opacity:0.12,letterSpacing:\'-0.05em\',pointerEvents:\'none\'}}>{card.number}</div>}',
'    {/* number watermark removed */}'
);

// Line 508 — big number on cards WITHOUT pose (no animal silhouette)
P('Replace big number on no-pose cards',
': <div style={{position:\'absolute\',top:\'20%\',left:0,right:0,textAlign:\'center\',fontFamily:\'"Bebas Neue",sans-serif\',fontSize:\'clamp(80px, 14vw, 130px)\',fontWeight:900,lineHeight:1,color:r.color,textShadow:`0 0 30px ${r.glow}, 0 4px 0 rgba(0,0,0,0.5)`,letterSpacing:\'-0.04em\'}}>{card.number}</div>}',
': <div style={{position:\'absolute\',top:\'15%\',left:\'10%\',right:\'10%\',bottom:\'32%\',display:\'flex\',alignItems:\'center\',justifyContent:\'center\',fontSize:70,opacity:0.5,pointerEvents:\'none\'}}>🐾</div>}'
);

// Line 540 — number in small card thumbnail view
P('Remove number from small thumbnail',
'    <div style={{position:\'absolute\',top:\'15%\',left:0,right:0,textAlign:\'center\',fontFamily:\'"Bebas Neue",sans-serif\',fontSize:38,lineHeight:1,color:r.color,textShadow:`0 0 12px ${r.glow}`}}>{card.number}</div>',
''
);

// Line 587 — #number in card detail modal
P('Remove number from card detail modal',
"                <div style={{fontSize:9,color:'#a8a29e',marginTop:3,fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.08em'}}>#{card.number} · {t?.name || card.team}</div>",
"                <div style={{fontSize:9,color:'#a8a29e',marginTop:3,fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.08em'}}>{t?.name || card.team}</div>"
);

// Line 1255 — pack opening reveal number
P('Remove number from pack opening',
"        <div style={{fontFamily:'\"Bebas Neue\",sans-serif',fontSize:64,color:accent,lineHeight:1,textShadow:'0 0 20px ' + accent + '88'}}>{card.number}</div>",
''
);

// Line 2213 — roulette number
P('Remove number from roulette',
"        <div style={{fontSize:'min(56px, 16vw)',fontFamily:'\"Bebas Neue\",sans-serif',color:'#fef08a',lineHeight:1,textShadow:'0 0 20px rgba(254,240,138,0.8)'}}>{card.number}</div>",
''
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
