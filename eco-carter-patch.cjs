// eco-carter-patch.cjs — Carter design pass (backtick-safe version)
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-carter-patch.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Injury labels ──
P('Injury labels',
"const DAMAGE_LABEL = ['MINT','LIGHTLY WORN','DAMAGED','BADLY DAMAGED'];",
"const DAMAGE_LABEL = ['HEALTHY','SLIGHTLY INJURED','INJURED','MAJOR INJURY'];"
);

// ── P2: Music track names ──
P('Music track names',
"{id:'vibes',     name:'COURT VIBES',    subtitle:'chill warm-up',    price:0,      free:true,  tempo:'80 BPM',  vibe:'AMBIENT',  color:'#4ade80'},",
"{id:'vibes',     name:'FOREST BREEZE',  subtitle:'gentle woodland',  price:0,      free:true,  tempo:'80 BPM',  vibe:'NATURE',   color:'#4ade80'},"
);
P('Music track practice',
"{id:'practice',  name:'PRACTICE MODE',  subtitle:'lo-fi focus',      price:0,      free:true,  tempo:'72 BPM',  vibe:'LO-FI',    color:'#60a5fa'},",
"{id:'practice',  name:'RIVER FLOW',     subtitle:'babbling stream',  price:0,      free:true,  tempo:'72 BPM',  vibe:'WATER',    color:'#60a5fa'},"
);
P('Music track gametime',
"{id:'gametime',  name:'GAME TIME',      subtitle:'tip-off energy',   price:15000,              tempo:'104 BPM', vibe:'BEAT',     color:'#fb923c'},",
"{id:'gametime',  name:'JUNGLE BEATS',   subtitle:'wild rhythm',      price:15000,              tempo:'104 BPM', vibe:'WILD',     color:'#22d3ee'},"
);

// ── P3: Music icon green ──
P('Music icon green',
"<Music size={16} style={{color:'#fb923c'}}/>",
"<Music size={16} style={{color:'#4ade80'}}/>"
);
P('Music library title',
"<Music size={26} style={{color:'#fb923c'}}/>MUSIC LIBRARY",
"<Music size={26} style={{color:'#4ade80'}}/>NATURE SOUNDS"
);
P('Music player border',
"border:'1px solid rgba(255,107,0,0.25)',boxShadow:'0 8px 24px -6px rgba(0,0,0,0.7)'}}",
"border:'1px solid rgba(74,222,128,0.25)',boxShadow:'0 8px 24px -6px rgba(0,0,0,0.7)'}}",
);

// ── P4: Waterfall thicker + pushed right ──
P('Waterfall wider',
"<div style={{position:'absolute',top:0,right:'6%',width:18,height:'100%',opacity:0.13}}>",
"<div style={{position:'absolute',top:0,right:'1%',width:40,height:'100%',opacity:0.2}}>"
);
P('Waterfall individual streams wider',
"animation:'waterfall-stream 1.8s linear '+(i*0.22)+'s infinite',borderRadius:1}}/>",
"animation:'waterfall-stream 1.8s linear '+(i*0.22)+'s infinite',borderRadius:2}}/>",
);
P('Waterfall splash wider',
"<div style={{position:'absolute',bottom:'0',right:'4%',width:60,height:30,",
"<div style={{position:'absolute',bottom:'0',right:'0%',width:100,height:45,"
);

// ── P5: Thicker vine corners ──
P('Thicker vine corners',
"content:'🌿'; position:absolute; top:-14px; left:16px; font-size:18px;",
"content:'🌿🌿'; position:absolute; top:-18px; left:8px; font-size:22px; letter-spacing:-6px;"
);
P('Thicker vine corners right',
"content:'🌿'; position:absolute; top:-14px; right:16px; font-size:18px;",
"content:'🌿🌿'; position:absolute; top:-18px; right:8px; font-size:22px; letter-spacing:-6px;"
);

// ── P6: Feed animation keyframes ──
P('Feed animation keyframes',
'@keyframes splash-pulse { 0%,100%{transform:scaleX(1) scaleY(1);opacity:0.3;} 50%{transform:scaleX(1.4) scaleY(0.7);opacity:0.6;} }',
'@keyframes splash-pulse { 0%,100%{transform:scaleX(1) scaleY(1);opacity:0.3;} 50%{transform:scaleX(1.4) scaleY(0.7);opacity:0.6;} }\n    @keyframes food-fly { 0%{transform:translateX(0) translateY(0) scale(1);opacity:1;} 70%{transform:translateX(-70px) translateY(-25px) scale(1.4);opacity:0.9;} 100%{transform:translateX(-90px) translateY(5px) scale(0.2);opacity:0;} }\n    @keyframes feed-bounce { 0%,100%{transform:scale(1);} 30%{transform:scale(1.25);} 60%{transform:scale(0.9);} }\n    @keyframes nom-pop { 0%{transform:translateY(0) scale(0.5);opacity:0;} 30%{transform:translateY(-10px) scale(1.2);opacity:1;} 100%{transform:translateY(-35px) scale(1);opacity:0;} }'
);

// ── P7: FeedAnimation component ──
P('Add FeedAnimation component',
'function FoodScreen({me,onFeed,onHeal,onToast}){',
'function FeedAnimation({food,onDone}){\n  React.useEffect(()=>{const t=setTimeout(onDone,1300);return()=>clearTimeout(t);},[]);\n  return(\n    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>\n      <div style={{position:"relative",width:180,height:120}}>\n        <div style={{position:"absolute",left:70,top:50,fontSize:36,animation:"feed-bounce 0.7s ease-in-out"}}>{"🐾"}</div>\n        <div style={{position:"absolute",left:100,top:35,fontSize:30,animation:"food-fly 1.2s ease-in-out forwards"}}>{food}</div>\n        <div style={{position:"absolute",left:50,top:15,fontSize:16,fontWeight:700,color:"#4ade80",fontFamily:\'\"Bebas Neue\",sans-serif\',letterSpacing:"0.1em",animation:"nom-pop 1.2s ease-out forwards"}}>{"NOM!"}</div>\n      </div>\n    </div>\n  );\n}\n\nfunction FoodScreen({me,onFeed,onHeal,onToast}){'
);

// ── P8: feedAnim state in FoodScreen ──
P('feedAnim state',
'  const [selCard,setSelCard]=useState(null);\n  const [selFood,setSelFood]=useState(null);\n  const [selVet,setSelVet]=useState(null);\n  const [mode,setMode]=useState(\'food\');',
'  const [selCard,setSelCard]=useState(null);\n  const [selFood,setSelFood]=useState(null);\n  const [selVet,setSelVet]=useState(null);\n  const [mode,setMode]=useState(\'food\');\n  const [feedAnim,setFeedAnim]=useState(null);'
);

// ── P9: Trigger animation on feed ──
P('Trigger feed animation',
'    onFeed(selCard.id,selFood);setSelFood(null);setSelCard(null);',
'    const fi=FOOD_ITEMS.find(function(f){return f.id===selFood;});\n    onFeed(selCard.id,selFood);setSelFood(null);setSelCard(null);\n    if(fi){setFeedAnim(fi.emoji);}'
);

// ── P10: Render FeedAnimation + fix return ──
P('Render FeedAnimation',
"  const t={fontFamily:'\"Bebas Neue\",sans-serif'};\n  const mono={fontFamily:'\"JetBrains Mono\",monospace'};\n  return(\n    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>\n      <h2 style={{...t,fontSize:28,color:'#4ade80',letterSpacing:'0.08em',margin:'0 0 4px'}}>FEED & CARE</h2>",
"  const t={fontFamily:'\"Bebas Neue\",sans-serif'};\n  const mono={fontFamily:'\"JetBrains Mono\",monospace'};\n  return(\n    <>\n    {feedAnim&&<FeedAnimation food={feedAnim} onDone={function(){setFeedAnim(null);}}/>}\n    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>\n      <h2 style={{...t,fontSize:28,color:'#4ade80',letterSpacing:'0.08em',margin:'0 0 4px'}}>FEED & CARE</h2>"
);

// close the extra fragment — find the last closing div before TravelScreen
P('Close FoodScreen fragment',
"    </div>\n  );\n}\n\nfunction TravelScreen(",
"    </div>\n    </>\n  );\n}\n\nfunction TravelScreen("
);

// ── P11: Expedition live bubble view ──
P('Expedition live bubbles',
"                  {away&&!ready&&<div style={{textAlign:'center'}}><div style={{fontSize:9,color:'#78716c',...mono}}>RETURNS IN</div><div style={{fontSize:16,color:'#c4b5fd',...mono,fontWeight:700}}>{tl(c)}</div></div>}",
"                  {away&&!ready&&(\n                    <div style={{textAlign:'center'}}>\n                      <div style={{fontSize:9,color:'#78716c',...mono}}>RETURNS IN</div>\n                      <div style={{fontSize:16,color:'#c4b5fd',...mono,fontWeight:700}}>{tl(c)}</div>\n                      {exp&&exp.reward&&(\n                        <div style={{marginTop:5,display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end'}}>\n                          {Object.entries(exp.reward).filter(function(e){return e[1]>0;}).map(function(e){\n                            var m=e[0];var q=e[1];\n                            return(<div key={m} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 6px',borderRadius:99,background:'rgba(196,181,253,0.15)',border:'1px solid rgba(196,181,253,0.25)'}}>\n                              <span style={{fontSize:11}}>{me2[m]}</span>\n                              <span style={{fontSize:9,color:'#c4b5fd',...mono,fontWeight:700}}>{q}</span>\n                              <span style={{fontSize:8,color:'#78716c',...mono}}>{m}</span>\n                            </div>);\n                          })}\n                        </div>\n                      )}\n                    </div>\n                  )}"
);

// ── P12: Free pack auto-restore on load ──
P('Auto-restore free pack',
'        setUsers(nextUsers);\n        setPendingTrades(nextTrades);',
'        var today=new Date().toDateString();\n        var fixedUsers={};\n        Object.keys(nextUsers).forEach(function(k){\n          var u=nextUsers[k];\n          if((u.packsAvailable||0)===0&&u.lastDailyDate!==today){\n            fixedUsers[k]=Object.assign({},u,{packsAvailable:1});\n          } else {\n            fixedUsers[k]=u;\n          }\n        });\n        setUsers(fixedUsers);\n        setPendingTrades(nextTrades);'
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
