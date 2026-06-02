// eco-gameplay-patch.cjs — fixed version
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-gameplay-patch.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Tyler starter roster ──
P('Tyler starter roster',
"const TYLER_ROSTER = [\n  {id:'ty_c1',first:'MUFASA',last:'LION',number:24,pps:100,rarity:'legend',material:'gold',team:'SAVANNA',tag:'KING OF PRIDE',pose:'dunk'},\n  {id:'ty_c2',first:'TUSK',last:'ELEPHANT',number:50,pps:108,rarity:'legend',material:'diamond',team:'SAVANNA',tag:'GRAY MOUNTAIN',pose:'skyhook'},\n  {id:'ty_c3',first:'ZEUS',last:'EAGLE',number:1,pps:97,rarity:'legend',material:'gold',team:'FOREST',tag:'SKY MONARCH',pose:'jumpman'},\n  {id:'ty_c4',first:'ECHO',last:'WOLF',number:11,pps:89,rarity:'rare',material:'silver',team:'FOREST',tag:'PACK CALLER',pose:'jumpman'},\n  {id:'ty_c5',first:'PIP',last:'CHIPMUNK',number:1,pps:6,rarity:'common',material:'bronze',team:'FOREST',tag:'CHEEK STUFFER'},\n];",
"const TYLER_ROSTER = [\n  {id:'ty_c1',first:'MUFASA',last:'LION',number:24,pps:100,rarity:'legend',material:'gold',team:'SAVANNA',tag:'KING OF PRIDE',pose:'dunk'},\n  {id:'ty_c2',first:'TUSK',last:'ELEPHANT',number:50,pps:108,rarity:'legend',material:'diamond',team:'SAVANNA',tag:'GRAY MOUNTAIN',pose:'skyhook'},\n  {id:'ty_c3',first:'ZEUS',last:'EAGLE',number:1,pps:97,rarity:'legend',material:'gold',team:'FOREST',tag:'SKY MONARCH',pose:'jumpman'},\n  {id:'ty_c4',first:'ECHO',last:'WOLF',number:11,pps:89,rarity:'rare',material:'silver',team:'FOREST',tag:'PACK CALLER',pose:'jumpman'},\n  {id:'ty_c5',first:'RUSTY',last:'FOX',number:9,pps:72,rarity:'rare',material:'gold',team:'FOREST',tag:'CLEVER TRICKSTER',pose:'fadeaway'},\n  {id:'ty_c6',first:'ATLAS',last:'BEAR',number:33,pps:85,rarity:'legend',material:'silver',team:'FOREST',tag:'FOREST GIANT',pose:'dunk'},\n  {id:'ty_c7',first:'STRIPE',last:'BADGER',number:14,pps:58,rarity:'rare',material:'bronze',team:'FOREST',tag:'FIERCE DIGGER',pose:'fadeaway'},\n  {id:'ty_c8',first:'ROCKY',last:'RACCOON',number:7,pps:18,rarity:'common',material:'silver',team:'FOREST',tag:'NIGHT BANDIT'},\n  {id:'ty_c9',first:'WHISKER',last:'OTTER',number:5,pps:42,rarity:'uncommon',material:'gold',team:'WETLAND',tag:'BELLY SURFER'},\n  {id:'ty_c10',first:'PIP',last:'CHIPMUNK',number:1,pps:6,rarity:'common',material:'bronze',team:'FOREST',tag:'CHEEK STUFFER'},\n];"
);

// ── P2: Harder greenhouse costs ──
P('Harder greenhouse costs',
"const GREENHOUSE_SIZES = {\n  xs:{label:'EXTRA SMALL',wood:2, stone:1,glass:1,brick:1,slots:4, eco:2, desc:'Fits 4 animals'},\n  s: {label:'SMALL',      wood:4, stone:2,glass:2,brick:2,slots:8, eco:5, desc:'Fits 8 animals'},\n  m: {label:'MEDIUM',     wood:8, stone:4,glass:4,brick:4,slots:16,eco:12,desc:'Fits 16 animals'},\n  l: {label:'LARGE',      wood:14,stone:7,glass:7,brick:7,slots:28,eco:22,desc:'Fits 28 animals'},\n  xl:{label:'EXTRA LARGE',wood:22,stone:12,glass:10,brick:10,slots:48,eco:40,desc:'Fits 48 animals'},\n};",
"const GREENHOUSE_SIZES = {\n  xs:{label:'EXTRA SMALL',wood:6,  stone:4, glass:3, brick:3, slots:4, eco:2, desc:'Fits 4 animals'},\n  s: {label:'SMALL',      wood:12, stone:8, glass:6, brick:6, slots:8, eco:5, desc:'Fits 8 animals'},\n  m: {label:'MEDIUM',     wood:22, stone:14,glass:10,brick:10,slots:16,eco:12,desc:'Fits 16 animals'},\n  l: {label:'LARGE',      wood:38, stone:22,glass:18,brick:18,slots:28,eco:22,desc:'Fits 28 animals'},\n  xl:{label:'EXTRA LARGE',wood:60, stone:35,glass:28,brick:28,slots:48,eco:40,desc:'Fits 48 animals'},\n};"
);

// ── P3: Remove BINDERS from dock nav ──
P('Remove binders dock nav',
'        <NavButton label="BINDERS" sub="SORT CARDS" Icon={Grid3x3} isActive={screen===\'binders\'} onClick={()=>setScreen(\'binders\')} color="#60a5fa"/>',
''
);

// ── P4: Remove BINDERS from mobile nav ──
P('Remove binders mobile nav',
"    {label:'BINDERS',sub:'SORT CARDS',Icon:Grid3x3,color:'#60a5fa',onPick:()=>go(()=>setScreen('binders')),active:screen==='binders'},",
''
);

// ── P5: Remove binders screen render ──
P('Remove binders screen render',
"      {screen==='binders' && <BindersScreen me={me} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onPlaceCard={handlePlaceCardInBinder} onRemoveCard={handleRemoveCardFromBinder}/>}",
''
);

// ── P6: Hide binder/case buttons in CardDetailModal ──
P('Hide remove from binder btn',
"        {isMine && inBinder && onRemoveFromBinder && <button onClick={onRemoveFromBinder} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(96,165,250,0.12)',border:'1px solid rgba(96,165,250,0.35)',color:'#93c5fd',cursor:'pointer',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Grid3x3 size={13}/>REMOVE FROM BINDER</button>}",
''
);
P('Hide add to binder btn',
"        {isMine && !inBinder && binders && binders.length>0 && !pickBinder && <button onClick={()=>setPickBinder(true)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(96,165,250,0.12)',border:'1px solid rgba(96,165,250,0.35)',color:'#93c5fd',cursor:'pointer',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Grid3x3 size={13}/>ADD TO BINDER</button>}",
''
);
P('Hide encase btn',
"        {isMine && !inBinder && !caseType && onEncase && !pickCase && <button onClick={()=>setPickCase(true)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.35)',color:'#fde68a',cursor:'pointer',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Gem size={13}/>PROTECT WITH A CASE</button>}",
''
);
P('Hide case picker block',
"        {isMine && !inBinder && !caseType && onEncase && pickCase && <div style={{width:'100%',display:'flex',flexDirection:'column',gap:6,padding:10,borderRadius:8,background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)'}}>",
'        {false && <div>'
);
P('Hide case label',
"        {isMine && caseType && <div style={{padding:'7px 12px',borderRadius:8,background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.3)',textAlign:'center',fontSize:9,color:'#93c5fd',letterSpacing:'0.12em',fontFamily:'\"JetBrains Mono\",monospace'}}>PROTECTED: {CASE_LABEL[caseType]}</div>}",
''
);

// ── P7: Hide binders section in ShopScreen — just hide the heading, safe approach ──
P('Hide binders shop heading',
"      <div style={{display:'flex',alignItems:'center',gap:8,fontFamily:'\"Bebas Neue\",sans-serif',fontSize:20,color:'#fff7ed',letterSpacing:'0.08em',marginBottom:4}}><Grid3x3 size={18} style={{color:'#60a5fa'}}/>STORAGE AND BINDERS</div>\n      <div style={{fontSize:11,color:'#a8a29e',marginBottom:16}}>Buy binders to sort your collection into pages of 9. Add pages when they fill up.</div>",
"      <div style={{display:'none'}}><div>BINDERS HIDDEN</div></div>"
);

// ── P8: Add greenhouse animal assignment ──
P('Add onAssignAnimal prop',
'function GreenhouseScreen({me,onBuildGreenhouse,onToast}){',
'function GreenhouseScreen({me,onBuildGreenhouse,onToast,onAssignAnimal}){'
);

P('Add animal assignment UI',
"      {ghs.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No greenhouses yet. Go on expeditions to gather materials!</div>}",
"      {ghs.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No greenhouses yet. Go on expeditions to gather materials!</div>}\n      {ghs.length>0&&(\n        <div style={{marginTop:16}}>\n          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>ASSIGN ANIMALS TO GREENHOUSES</div>\n          {ghs.map(function(gh,gi){\n            var sz=GREENHOUSE_SIZES[gh.size];\n            var assigned=(gh.animals||[]);\n            var slots=sz?sz.slots:4;\n            var cards=me.ownedCards||[];\n            return(\n              <div key={gi} style={{marginBottom:14,padding:'12px',borderRadius:12,border:'1px solid rgba(134,239,172,0.2)',background:'rgba(134,239,172,0.03)'}}>\n                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>\n                  <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz&&sz.label} GREENHOUSE</div>\n                  <div style={{fontSize:10,color:'#86efac',...mono}}>{assigned.length}/{slots} ANIMALS</div>\n                </div>\n                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>\n                  {assigned.map(function(aid){\n                    var ac=cards.find(function(c){return c.id===aid;});\n                    return ac?(\n                      <div key={aid} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:8,background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.25)'}}>\n                        <span style={{fontSize:11,color:'#86efac',...mono}}>{ac.first} {ac.last}</span>\n                        <button onClick={function(){onAssignAnimal(gi,aid,false);}} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:12,padding:'0 0 0 4px',lineHeight:1}}>x</button>\n                      </div>\n                    ):null;\n                  })}\n                  {assigned.length<slots&&onAssignAnimal&&(\n                    <select onChange={function(e){if(e.target.value){onAssignAnimal(gi,e.target.value,true);e.target.value='';}}} style={{padding:'3px 8px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(134,239,172,0.3)',color:'#86efac',fontSize:11,...mono,cursor:'pointer'}}>\n                      <option value=''>+ Add animal</option>\n                      {cards.filter(function(c){return!ghs.some(function(g){return(g.animals||[]).includes(c.id);});}).map(function(c){\n                        return(<option key={c.id} value={c.id}>{c.first} {c.last} ({c.rarity})</option>);\n                      })}\n                    </select>\n                  )}\n                </div>\n              </div>\n            );\n          })}\n        </div>\n      )}"
);

// ── P9: handleAssignAnimal handler ──
P('Add handleAssignAnimal',
'  const handleBuildGreenhouse=(size)=>{',
'  const handleAssignAnimal=function(ghIndex,cardId,assign){\n    if(!me)return;\n    var newGhs=(me.greenhouses||[]).map(function(gh,i){\n      if(i!==ghIndex)return gh;\n      var animals=gh.animals?gh.animals.slice():[];\n      if(assign){if(!animals.includes(cardId))animals.push(cardId);}\n      else{animals=animals.filter(function(id){return id!==cardId;});}\n      return Object.assign({},gh,{animals:animals});\n    });\n    updateUser(me.username,function(u){return Object.assign({},u,{greenhouses:newGhs});});\n    showToast(assign?\'Animal added to greenhouse!\':\'Animal removed.\',\'ok\');\n  };\n  const handleBuildGreenhouse=(size)=>{'
);

// ── P10: Wire onAssignAnimal ──
P('Wire onAssignAnimal',
"{screen==='greenhouse' && <GreenhouseScreen me={me} onBuildGreenhouse={handleBuildGreenhouse} onToast={showToast}/>}",
"{screen==='greenhouse' && <GreenhouseScreen me={me} onBuildGreenhouse={handleBuildGreenhouse} onToast={showToast} onAssignAnimal={handleAssignAnimal}/>}"
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
