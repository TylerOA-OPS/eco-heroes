// eco-patch-v2.cjs
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-patch-v2.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: constants ──
P('Greenhouse/Travel constants',
'// Pack sizes: 3-card is base price',
`// Greenhouse build materials
const GREENHOUSE_SIZES = {
  xs:{label:'EXTRA SMALL',wood:2, stone:1,glass:1,brick:1,slots:4, eco:2, desc:'Fits 4 animals'},
  s: {label:'SMALL',      wood:4, stone:2,glass:2,brick:2,slots:8, eco:5, desc:'Fits 8 animals'},
  m: {label:'MEDIUM',     wood:8, stone:4,glass:4,brick:4,slots:16,eco:12,desc:'Fits 16 animals'},
  l: {label:'LARGE',      wood:14,stone:7,glass:7,brick:7,slots:28,eco:22,desc:'Fits 28 animals'},
  xl:{label:'EXTRA LARGE',wood:22,stone:12,glass:10,brick:10,slots:48,eco:40,desc:'Fits 48 animals'},
};
const TRAVEL_DURATION_MS = 60000;
const TRAVEL_MATERIALS = ['wood','stone','glass','brick'];
const INJURY_STATES = {minor:'MINOR INJURY',injured:'INJURED',major:'MAJOR INJURY'};
const VET_PACK_ITEMS = [
  {id:'vet_minor',label:'MINOR VET PACK',emoji:'🩹',heals:'minor',price:200,desc:'Heals minor injuries'},
  {id:'vet_mid',  label:'VET PACK',       emoji:'💊',heals:'injured',price:500,desc:'Heals injuries'},
  {id:'vet_major',label:'MAJOR VET PACK', emoji:'🏥',heals:'major',price:1200,desc:'Heals major injuries'},
];

// Pack sizes: 3-card is base price`
);

// ── P2: FoodScreen + TravelScreen + GreenhouseScreen ──
P('Add three new screen components',
'function SpaceScreen({me, users, setUsers, currentUsername, onBack, onOpenPack, onSpinRoulette}){',
`function FoodScreen({me,onFeed,onHeal,onToast}){
  const [selCard,setSelCard]=useState(null);
  const [selFood,setSelFood]=useState(null);
  const [selVet,setSelVet]=useState(null);
  const [mode,setMode]=useState('food');
  const cards=me.ownedCards||[];
  const foodInv=me.foodInventory||{};
  const vetInv=me.vetInventory||{};
  const getHunger=c=>(me.cardHunger&&me.cardHunger[c.id])??100;
  const getInjury=c=>me.cardInjury&&me.cardInjury[c.id];
  const hCol=h=>h>60?'#4ade80':h>30?'#fbbf24':'#ef4444';
  const doFeed=()=>{
    if(!selCard||!selFood)return;
    if(!(foodInv[selFood]>0)){onToast('No '+selFood+' left!','err');return;}
    onFeed(selCard.id,selFood);setSelFood(null);setSelCard(null);
  };
  const doHeal=()=>{
    if(!selCard||!selVet)return;
    if(!(vetInv[selVet]>0)){onToast('No vet packs!','err');return;}
    if(!getInjury(selCard)){onToast('Not injured!','err');return;}
    onHeal(selCard.id,selVet);setSelVet(null);setSelCard(null);
  };
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#4ade80',letterSpacing:'0.08em',margin:'0 0 4px'}}>FEED & CARE</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 14px',...mono}}>Select an animal then choose food or vet pack</p>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['food','vet'].map(m=>(
          <button key={m} onClick={()=>{setMode(m);setSelFood(null);setSelVet(null);}}
            style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:mode===m?'rgba(74,222,128,0.2)':'rgba(255,255,255,0.05)',color:mode===m?'#4ade80':'#78716c',...t,fontSize:14,letterSpacing:'0.1em',cursor:'pointer'}}>
            {m==='food'?'FOOD':'VET PACKS'}
          </button>
        ))}
      </div>
      <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>SELECT ANIMAL</div>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
        {cards.map(c=>{
          const h=getHunger(c);const inj=getInjury(c);const sel=selCard&&selCard.id===c.id;
          return(
            <button key={c.id} onClick={()=>setSelCard(sel?null:c)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#4ade80':'rgba(255,255,255,0.08)'),background:sel?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🐾</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.05em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                {inj&&<div style={{fontSize:9,color:'#f87171',...mono}}>⚠ {INJURY_STATES[inj]}</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:9,color:'#78716c',...mono}}>HUNGER</div>
                <div style={{fontSize:13,fontWeight:700,color:hCol(h),...mono}}>{h}%</div>
                <div style={{width:48,height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,marginTop:2}}>
                  <div style={{width:h+'%',height:'100%',background:hCol(h),borderRadius:2}}/>
                </div>
              </div>
            </button>
          );
        })}
        {cards.length===0&&<div style={{padding:'20px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No animals yet.</div>}
      </div>
      {mode==='food'&&(
        <div>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>CHOOSE FOOD (YOUR STOCK)</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {FOOD_ITEMS.map(f=>{
              const qty=foodInv[f.id]||0;const sel=selFood===f.id;
              return(
                <button key={f.id} onClick={()=>qty>0&&setSelFood(sel?null:f.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#4ade80':qty>0?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)'),background:sel?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',cursor:qty>0?'pointer':'default',opacity:qty>0?1:0.4,textAlign:'left'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{f.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{f.label}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>{f.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:qty>0?'#4ade80':'#52525b',...mono,fontWeight:700}}>x{qty}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>+{f.basePct}%</div>
                  </div>
                </button>
              );
            })}
          </div>
          {selCard&&selFood&&(
            <button onClick={doFeed} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#4ade80,#22c55e)',color:'#052e16',...t,fontSize:18,letterSpacing:'0.1em',cursor:'pointer'}}>
              FEED {selCard.first.toUpperCase()} {selCard.last.toUpperCase()}
            </button>
          )}
        </div>
      )}
      {mode==='vet'&&(
        <div>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>CHOOSE VET PACK</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {VET_PACK_ITEMS.map(v=>{
              const qty=vetInv[v.id]||0;const sel=selVet===v.id;
              return(
                <button key={v.id} onClick={()=>qty>0&&setSelVet(sel?null:v.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#34d399':qty>0?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)'),background:sel?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)',cursor:qty>0?'pointer':'default',opacity:qty>0?1:0.4,textAlign:'left'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{v.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{v.label}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>{v.desc}</div>
                  </div>
                  <div style={{fontSize:11,color:qty>0?'#34d399':'#52525b',...mono,fontWeight:700,flexShrink:0}}>x{qty}</div>
                </button>
              );
            })}
          </div>
          {selCard&&selVet&&getInjury(selCard)&&(
            <button onClick={doHeal} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#34d399,#059669)',color:'#052e16',...t,fontSize:18,letterSpacing:'0.1em',cursor:'pointer'}}>
              HEAL {selCard.first.toUpperCase()} {selCard.last.toUpperCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TravelScreen({me,onSendExpedition,onCollectExpedition,onToast}){
  const cards=me.ownedCards||[];
  const expeditions=me.expeditions||{};
  const [,tick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>tick(n=>n+1),1000);return()=>clearInterval(t);},[]);
  const now=Date.now();
  const getInjury=c=>me.cardInjury&&me.cardInjury[c.id];
  const getHunger=c=>(me.cardHunger&&me.cardHunger[c.id])??100;
  const away=c=>{const e=expeditions[c.id];return e&&e.returnAt>now;};
  const ready=c=>{const e=expeditions[c.id];return e&&e.returnAt<=now&&!e.collected;};
  const tl=c=>{const e=expeditions[c.id];if(!e)return null;const ms=e.returnAt-now;if(ms<=0)return'00:00';const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+(s%60).toString().padStart(2,'0');};
  const me2={wood:'🪵',stone:'🪨',glass:'🔷',brick:'🧱'};
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#c4b5fd',letterSpacing:'0.08em',margin:'0 0 4px'}}>EXPEDITIONS</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 8px',...mono}}>Send animals to gather greenhouse materials</p>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TRAVEL_MATERIALS.map(m=>(
          <div key={m} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:99,background:'rgba(255,255,255,0.06)',fontSize:11,color:'#a8a29e',...mono}}>
            <span>{me2[m]}</span>
            <span style={{fontWeight:700,color:'#fff7ed'}}>{(me.materials||{})[m]||0}</span>
            <span style={{fontSize:9,color:'#78716c',textTransform:'uppercase'}}> {m}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {cards.map(c=>{
          const a=away(c);const r=ready(c);const inj=getInjury(c);const h=getHunger(c);const exp=expeditions[c.id];
          return(
            <div key={c.id} style={{padding:'12px',borderRadius:12,border:'1px solid '+(r?'rgba(196,181,253,0.5)':a?'rgba(196,181,253,0.2)':'rgba(255,255,255,0.08)'),background:r?'rgba(196,181,253,0.06)':'rgba(255,255,255,0.02)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🐾</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'#fff7ed',...t,letterSpacing:'0.05em'}}>{c.first} {c.last}</div>
                  {inj&&<div style={{fontSize:9,color:'#f87171',...mono}}>⚠ {INJURY_STATES[inj]}</div>}
                  {!inj&&h<30&&<div style={{fontSize:9,color:'#fbbf24',...mono}}>⚠ Very hungry</div>}
                </div>
                <div style={{flexShrink:0}}>
                  {a&&!r&&<div style={{textAlign:'center'}}><div style={{fontSize:9,color:'#78716c',...mono}}>RETURNS IN</div><div style={{fontSize:16,color:'#c4b5fd',...mono,fontWeight:700}}>{tl(c)}</div></div>}
                  {r&&<button onClick={()=>onCollectExpedition(c.id)} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#c4b5fd,#a78bfa)',color:'#1e1b4b',...t,fontSize:13,letterSpacing:'0.08em',cursor:'pointer'}}>COLLECT</button>}
                  {!a&&!r&&<button onClick={()=>{if(inj){onToast('Heal first!','err');return;}if(h<10){onToast('Feed first!','err');return;}onSendExpedition(c.id);}} style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(196,181,253,0.3)',background:'rgba(196,181,253,0.08)',color:'#c4b5fd',...t,fontSize:13,letterSpacing:'0.08em',cursor:'pointer'}}>SEND</button>}
                </div>
              </div>
              {r&&exp&&exp.reward&&(
                <div style={{marginTop:8,padding:'6px 10px',borderRadius:8,background:'rgba(196,181,253,0.1)',display:'flex',gap:10,flexWrap:'wrap'}}>
                  <div style={{fontSize:9,color:'#c4b5fd',...mono,width:'100%',marginBottom:2}}>REWARD READY:</div>
                  {Object.entries(exp.reward).map(([m,q])=>q>0&&<div key={m} style={{fontSize:12,color:'#fff7ed',...mono}}>{me2[m]} +{q} {m}</div>)}
                  {exp.injured&&<div style={{fontSize:11,color:'#f87171',...mono,width:'100%'}}>Returned injured!</div>}
                </div>
              )}
            </div>
          );
        })}
        {cards.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No animals to send yet.</div>}
      </div>
    </div>
  );
}

function GreenhouseScreen({me,onBuildGreenhouse,onToast}){
  const [selSize,setSelSize]=useState(null);
  const mats=me.materials||{};
  const ghs=me.greenhouses||[];
  const me2={wood:'🪵',stone:'🪨',glass:'🔷',brick:'🧱'};
  const mc={wood:'#fb923c',stone:'#94a3b8',glass:'#67e8f9',brick:'#f87171'};
  const canAfford=sz=>['wood','stone','glass','brick'].every(k=>(mats[k]||0)>=GREENHOUSE_SIZES[sz][k]);
  const doBuild=()=>{if(!selSize)return;if(!canAfford(selSize)){onToast('Not enough materials!','err');return;}onBuildGreenhouse(selSize);setSelSize(null);};
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#86efac',letterSpacing:'0.08em',margin:'0 0 4px'}}>GREENHOUSE</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 12px',...mono}}>Build with expedition materials</p>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {TRAVEL_MATERIALS.map(m=>(
          <div key={m} style={{flex:1,minWidth:60,padding:'8px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',textAlign:'center'}}>
            <div style={{fontSize:20,marginBottom:2}}>{me2[m]}</div>
            <div style={{fontSize:16,fontWeight:700,color:mc[m],...mono}}>{mats[m]||0}</div>
            <div style={{fontSize:8,color:'#78716c',textTransform:'uppercase',letterSpacing:'0.1em'}}>{m}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>BUILD NEW GREENHOUSE</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
        {Object.entries(GREENHOUSE_SIZES).map(([key,sz])=>{
          const can=canAfford(key);const sel=selSize===key;
          return(
            <button key={key} onClick={()=>can&&setSelSize(sel?null:key)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:'1px solid '+(sel?'#86efac':can?'rgba(134,239,172,0.25)':'rgba(255,255,255,0.06)'),background:sel?'rgba(134,239,172,0.1)':'rgba(255,255,255,0.02)',cursor:can?'pointer':'default',opacity:can?1:0.5,textAlign:'left'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(134,239,172,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🌿</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz.label} — {sz.desc}</div>
                <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
                  {['wood','stone','glass','brick'].map(m=><span key={m} style={{fontSize:9,color:(mats[m]||0)>=sz[m]?mc[m]:'#ef4444',...mono}}>{me2[m]}{sz[m]} {m}</span>)}
                </div>
              </div>
              <div style={{fontSize:11,color:'#86efac',...mono,flexShrink:0}}>+{sz.eco}/s</div>
            </button>
          );
        })}
      </div>
      {selSize&&canAfford(selSize)&&(
        <button onClick={doBuild} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#86efac,#22c55e)',color:'#052e16',...t,fontSize:20,letterSpacing:'0.1em',cursor:'pointer',marginBottom:20}}>
          BUILD {GREENHOUSE_SIZES[selSize].label} GREENHOUSE
        </button>
      )}
      {ghs.length>0&&(
        <>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>YOUR GREENHOUSES ({ghs.length})</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {ghs.map((gh,i)=>{const sz=GREENHOUSE_SIZES[gh.size];return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,border:'1px solid rgba(134,239,172,0.2)',background:'rgba(134,239,172,0.04)'}}>
                <span style={{fontSize:24}}>🌿</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz&&sz.label||gh.size} GREENHOUSE</div>
                  <div style={{fontSize:9,color:'#78716c',...mono}}>Built {new Date(gh.builtAt).toLocaleDateString()}</div>
                </div>
                <div style={{fontSize:11,color:'#86efac',...mono}}>+{sz&&sz.eco||0}/s</div>
              </div>
            );})}
          </div>
        </>
      )}
      {ghs.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No greenhouses yet. Go on expeditions to gather materials!</div>}
    </div>
  );
}

function SpaceScreen({me, users, setUsers, currentUsername, onBack, onOpenPack, onSpinRoulette}){`
);

// ── P3: handlers ──
P('Add eco system handlers',
'  const handlePickFavCard = (cardId) => {',
`  const handleFeedAnimal=(cardId,foodId)=>{
    if(!me)return;
    const food=FOOD_ITEMS.find(f=>f.id===foodId);if(!food)return;
    const newInv={...(me.foodInventory||{})};
    if(!newInv[foodId]||newInv[foodId]<1){showToast('No food left!','err');return;}
    newInv[foodId]=(newInv[foodId]||0)-1;
    const card=me.ownedCards.find(c=>c.id===cardId);
    const pct=getFoodPct(foodId,card);
    const cur=(me.cardHunger&&me.cardHunger[cardId])??100;
    const nh=Math.min(100,cur+pct);
    updateUser(me.username,u=>({...u,foodInventory:newInv,cardHunger:{...(u.cardHunger||{}),[cardId]:nh}}));
    showToast('+'+pct+'% hunger restored!','ok');
  };
  const handleHealAnimal=(cardId,vetId)=>{
    if(!me)return;
    const nv={...(me.vetInventory||{})};
    if(!nv[vetId]||nv[vetId]<1){showToast('No vet packs!','err');return;}
    nv[vetId]=(nv[vetId]||0)-1;
    const ni={...(me.cardInjury||{})};delete ni[cardId];
    updateUser(me.username,u=>({...u,vetInventory:nv,cardInjury:ni}));
    showToast('Animal healed!','ok');
  };
  const handleSendExpedition=(cardId)=>{
    if(!me)return;
    const returnAt=Date.now()+TRAVEL_DURATION_MS;
    const reward={};
    TRAVEL_MATERIALS.forEach(m=>{reward[m]=Math.floor(Math.random()*4)+1;});
    const injured=Math.random()<0.25;
    updateUser(me.username,u=>({...u,expeditions:{...(u.expeditions||{}),[cardId]:{returnAt,reward,injured,collected:false}}}));
    showToast('Expedition started! Returns in 1 min','ok');
  };
  const handleCollectExpedition=(cardId)=>{
    if(!me)return;
    const exp=(me.expeditions||{})[cardId];if(!exp||exp.collected)return;
    const nm={...(me.materials||{})};
    Object.entries(exp.reward||{}).forEach(([m,q])=>{nm[m]=(nm[m]||0)+q;});
    const ne={...(me.expeditions||{}),[cardId]:{...exp,collected:true}};
    const ni={...(me.cardInjury||{})};if(exp.injured){ni[cardId]='injured';}
    updateUser(me.username,u=>({...u,materials:nm,expeditions:ne,cardInjury:ni}));
    const ms=Object.entries(exp.reward||{}).filter(([,q])=>q>0).map(([m,q])=>'+'+q+' '+m).join(', ');
    showToast(exp.injured?'Got: '+ms+' — returned injured!':'Collected: '+ms,exp.injured?'err':'ok');
  };
  const handleBuildGreenhouse=(size)=>{
    if(!me)return;
    const sz=GREENHOUSE_SIZES[size];if(!sz)return;
    const nm={...(me.materials||{})};
    let ok=true;['wood','stone','glass','brick'].forEach(m=>{if((nm[m]||0)<sz[m])ok=false;});
    if(!ok){showToast('Not enough materials!','err');return;}
    ['wood','stone','glass','brick'].forEach(m=>{nm[m]=(nm[m]||0)-sz[m];});
    const ng=[...(me.greenhouses||[]),{size,builtAt:Date.now()}];
    updateUser(me.username,u=>({...u,materials:nm,greenhouses:ng}));
    showToast(sz.label+' greenhouse built! +'+sz.eco+' ECO/sec','ok');
  };

  const handlePickFavCard = (cardId) => {`
);

// ── P4: wire screens into render ──
P('Wire screens into render',
"      {screen==='design' && <DesignScreen points={me.points} onMint={handleMintCard} onToast={showToast} editingCard={editingCardForDesign} onCancelEdit={()=>setEditingCardForDesign(null)} onUpdateCard={handleUpdateCard} me={me} onSaveBinderCover={handleSaveBinderCover}/>}",
"      {screen==='design' && <DesignScreen points={me.points} onMint={handleMintCard} onToast={showToast} editingCard={editingCardForDesign} onCancelEdit={()=>setEditingCardForDesign(null)} onUpdateCard={handleUpdateCard} me={me} onSaveBinderCover={handleSaveBinderCover}/>}\n      {screen==='food' && <FoodScreen me={me} onFeed={handleFeedAnimal} onHeal={handleHealAnimal} onToast={showToast}/>}\n      {screen==='travel' && <TravelScreen me={me} onSendExpedition={handleSendExpedition} onCollectExpedition={handleCollectExpedition} onToast={showToast}/>}\n      {screen==='greenhouse' && <GreenhouseScreen me={me} onBuildGreenhouse={handleBuildGreenhouse} onToast={showToast}/>}"
);

// ── P5: nav buttons ──
P('Replace SPACE nav with FOOD/TRAVEL/GREENHOUSE',
'        <NavButton label="BINDERS" sub="SORT CARDS" Icon={Grid3x3} isActive={screen===\'binders\'} onClick={()=>setScreen(\'binders\')} color="#60a5fa"/>\n        <NavButton label="LEADERS" sub="FAMILY RANKS" Icon={Trophy} isActive={false} onClick={()=>setLeaderboardOpen(true)} color="#fbbf24"/>\n        <NavButton label="SPACE" sub="LAUNCH" Icon={Rocket} isActive={screen===\'space\'} onClick={()=>setScreen(\'space\')} color="#c4b5fd"/>',
'        <NavButton label="BINDERS" sub="SORT CARDS" Icon={Grid3x3} isActive={screen===\'binders\'} onClick={()=>setScreen(\'binders\')} color="#60a5fa"/>\n        <NavButton label="FOOD" sub="FEED \xB7 VET" Icon={Sparkles} isActive={screen===\'food\'} onClick={()=>setScreen(\'food\')} color="#4ade80"/>\n        <NavButton label="TRAVEL" sub="EXPEDITIONS" Icon={Rocket} isActive={screen===\'travel\'} onClick={()=>setScreen(\'travel\')} color="#c4b5fd"/>\n        <NavButton label="GREENHOUSE" sub="BUILD" Icon={Flame} isActive={screen===\'greenhouse\'} onClick={()=>setScreen(\'greenhouse\')} color="#86efac"/>\n        <NavButton label="LEADERS" sub="FAMILY RANKS" Icon={Trophy} isActive={false} onClick={()=>setLeaderboardOpen(true)} color="#fbbf24"/>'
);

// ── P6: mobile nav ──
P('Add new screens to MobileNavSheet',
"    {label:'SPACE',sub:'LAUNCH',Icon:Rocket,color:'#c4b5fd',onPick:()=>go(()=>setScreen('space')),active:screen==='space'},",
"    {label:'TRAVEL',sub:'EXPEDITIONS',Icon:Rocket,color:'#c4b5fd',onPick:()=>go(()=>setScreen('travel')),active:screen==='travel'},\n    {label:'FOOD',sub:'FEED \xB7 VET',Icon:Sparkles,color:'#4ade80',onPick:()=>go(()=>setScreen('food')),active:screen==='food'},\n    {label:'GREENHOUSE',sub:'BUILD',Icon:Flame,color:'#86efac',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},"
);

if(hasCRLF)src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('');
console.log('APPLIED:'+ok+'  SKIPPED:'+skip);
if(skip>2){console.log('Too many skipped — check file');process.exit(1);}
process.exit(0);
