const fs = require('fs');
const file = process.argv[2];
let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const results = [];

function SR(old, next, label) {
  if (c.includes(old)) {
    c = c.split(old).join(next);
    results.push('  DONE: ' + label);
    return true;
  }
  results.push('  SKIP: ' + label);
  return false;
}

// ============================================================
// S1: Add MATERIALS, GREENHOUSE_SIZES, INJURY constants
//     after FOOD_ITEMS block
// ============================================================
SR(
`// Animal size tiers â€” determines food effectiveness`,
`// Materials for greenhouse building
const MATERIALS_INVENTORY_DEFAULT = { wood:0, stone:0, glass:0, brick:0 };
const GREENHOUSE_SIZES = {
  xs: { label:'EXTRA SMALL', wood:2,  stone:1,  glass:1,  brick:1,  slots:4,   desc:'Fits 4 animals' },
  s:  { label:'SMALL',       wood:4,  stone:2,  glass:2,  brick:2,  slots:9,   desc:'Fits 9 animals' },
  m:  { label:'MEDIUM',      wood:8,  stone:4,  glass:4,  brick:4,  slots:16,  desc:'Fits 16 animals' },
  l:  { label:'LARGE',       wood:16, stone:8,  glass:8,  brick:8,  slots:25,  desc:'Fits 25 animals' },
  xl: { label:'EXTRA LARGE', wood:32, stone:16, glass:16, brick:16, slots:36,  desc:'Fits 36 animals' },
};
const MATERIAL_ICONS = { wood:'ðŸªµ', stone:'ðŸª¨', glass:'ðŸªŸ', brick:'ðŸ§±' };

// Injury system
const INJURY_LEVELS = {
  minor:  { label:'MINOR INJURY',  color:'#fbbf24', vetPackPrice:500,   healLabel:'BASIC VET PACK'   },
  injured:{ label:'INJURED',       color:'#f97316', vetPackPrice:2000,  healLabel:'STANDARD VET PACK' },
  major:  { label:'MAJOR INJURY',  color:'#ef4444', vetPackPrice:8000,  healLabel:'ADVANCED VET PACK' },
};
const EXPEDITION_INJURY_CHANCE = 0.25; // 25% flat chance per expedition
const EXPEDITION_DURATION_MS = 60000; // 1 minute real time

// Animal size tiers â€” determines food effectiveness`,
  'S1 Materials/Greenhouse/Injury constants'
);

// ============================================================
// S2: Add materials + greenhouse + injury to STARTING_USERS
// ============================================================
SR(
  `favCardId:null, foodInventory:{}, cardHunger:{} },`,
  `favCardId:null, foodInventory:{}, cardHunger:{}, cardInjury:{}, materials:{ wood:0, stone:0, glass:0, brick:0 }, greenhouses:[], expeditions:[] },`,
  'S2 New user fields (both users via two passes)'
);

// ============================================================
// S3: Add FoodScreen component before /* HOME SCREEN */
// ============================================================
SR(
  `/* HOME SCREEN */`,
  `/* ============================================================
   FOOD SCREEN â€” feed animals, use vet packs
   ============================================================ */
function FoodScreen({ me, onFeedAnimal, onHealAnimal, onBuyFood, onToast }) {
  const [tab, setTab] = useState('feed');
  const [selCard, setSelCard] = useState(null);
  const [selFood, setSelFood] = useState(null);

  const inv = me.foodInventory || {};
  const injuries = me.cardInjury || {};

  const injuredCards = me.ownedCards.filter(c => injuries[c.id]);

  const handleFeed = () => {
    if (!selCard || !selFood) { onToast('PICK AN ANIMAL AND A FOOD', 'err'); return; }
    if (!inv[selFood] || inv[selFood] < 1) { onToast('YOU DON\'T HAVE THAT FOOD', 'err'); return; }
    onFeedAnimal(selCard.id, selFood);
    setSelFood(null);
  };

  const handleHeal = (cardId, injuryLevel) => {
    const packKey = injuryLevel + '_vet_pack';
    if (!inv[packKey] || inv[packKey] < 1) { onToast('NO VET PACK FOR THIS INJURY', 'err'); return; }
    onHealAnimal(cardId, injuryLevel);
  };

  return (
    <div style={{padding:'24px 28px 40px'}}>
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>FOOD & VET</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>Feed your animals to keep them earning Â· heal injuries with vet packs</div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[['feed','ðŸŽ FEED'],['heal','ðŸ¥ HEAL'],['shop','ðŸ›’ BUY FOOD']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'8px 16px',borderRadius:10,border:tab===id?'1px solid #4ade80':'1px solid rgba(255,255,255,0.1)',background:tab===id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.03)',color:tab===id?'#4ade80':'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>
            {label}{id==='heal'&&injuredCards.length>0?` (${injuredCards.length})`:''}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {tab==='feed' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {/* Pick animal */}
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.1em',marginBottom:10}}>1. PICK ANIMAL</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
              {me.ownedCards.map(card=>{
                const hunger = (me.cardHunger&&me.cardHunger[card.id])??100;
                const isSel = selCard&&selCard.id===card.id;
                return (
                  <button key={card.id} onClick={()=>setSelCard(card)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:isSel?`1px solid ${me.color}`:'1px solid rgba(255,255,255,0.08)',background:isSel?`${me.color}15`:'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{card.first} {card.last}</div>
                      <div style={{marginTop:4}}><HungerBar pct={hunger} small/></div>
                    </div>
                    {hunger===100 && <span style={{fontSize:9,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>FULL</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Pick food */}
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.1em',marginBottom:10}}>2. PICK FOOD</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {FOOD_ITEMS.map(food=>{
                const qty = inv[food.id]||0;
                const pct = selCard ? getFoodPct(food.id, selCard) : food.basePct;
                const isSel = selFood===food.id;
                return (
                  <button key={food.id} onClick={()=>qty>0&&setSelFood(food.id)} disabled={qty===0} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:isSel?'1px solid #4ade80':'1px solid rgba(255,255,255,0.08)',background:isSel?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.03)',cursor:qty>0?'pointer':'not-allowed',opacity:qty===0?0.4:1,textAlign:'left'}}>
                    <span style={{fontSize:22}}>{food.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1}}>{food.label}</div>
                      <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{selCard?`+${pct}% fullness`:food.desc}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:10,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>Ã—{qty}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selCard&&selFood&&(
              <button onClick={handleFeed} style={{width:'100%',marginTop:12,padding:'13px',borderRadius:10,background:'linear-gradient(135deg,#22c55e,#16a34a)',border:'none',color:'#fff7ed',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:15,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                ðŸ½ï¸ FEED {selCard.first} {selCard.last}
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEAL TAB */}
      {tab==='heal' && (
        <div>
          {injuredCards.length===0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#78716c',fontFamily:'"Outfit",sans-serif',fontSize:14}}>No injured animals right now. ðŸŽ‰</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {injuredCards.map(card=>{
                const level = injuries[card.id];
                const info = INJURY_LEVELS[level];
                const packKey = level+'_vet_pack';
                const hasPack = (inv[packKey]||0)>0;
                return (
                  <div key={card.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${info.color}44`}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.04em'}}>{card.first} {card.last}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                        <span style={{fontSize:9,padding:'2px 8px',borderRadius:4,background:`${info.color}22`,color:info.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em',fontWeight:700}}>{info.label}</span>
                        <span style={{fontSize:9,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>needs: {info.healLabel} (Ã—{inv[packKey]||0} in bag)</span>
                      </div>
                    </div>
                    <button onClick={()=>hasPack&&handleHeal(card.id,level)} disabled={!hasPack} style={{padding:'9px 14px',borderRadius:8,background:hasPack?'linear-gradient(135deg,#22c55e,#16a34a)':'#3f3f46',border:'none',color:'#fff7ed',cursor:hasPack?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em'}}>
                      {hasPack?'HEAL':'NO PACK'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{marginTop:20,padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#a8a29e',letterSpacing:'0.1em',marginBottom:10}}>VET PACKS IN YOUR BAG</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {Object.keys(INJURY_LEVELS).map(level=>{
                const packKey=level+'_vet_pack';
                const qty=inv[packKey]||0;
                const info=INJURY_LEVELS[level];
                return <div key={level} style={{padding:'6px 12px',borderRadius:8,background:`${info.color}15`,border:`1px solid ${info.color}44`,fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:info.color}}>
                  {info.healLabel}: Ã—{qty}
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* BUY FOOD TAB */}
      {tab==='shop' && (
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#a8a29e',letterSpacing:'0.1em',marginBottom:12}}>YOUR ECO: {Math.floor(me.points).toLocaleString()}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:20}}>
            {FOOD_ITEMS.map(food=>{
              const canAfford = me.points>=food.price;
              return (
                <button key={food.id} onClick={()=>canAfford&&onBuyFood(food.id,food.price)} disabled={!canAfford} style={{padding:'12px 14px',borderRadius:12,background:canAfford?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.08)',cursor:canAfford?'pointer':'not-allowed',opacity:canAfford?1:0.5,textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:28}}>{food.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1}}>{food.label}</div>
                    <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{food.desc}</div>
                    <div style={{fontSize:10,color:'#fb923c',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginTop:4}}>{food.price.toLocaleString()} ECO Â· Ã—{inv[food.id]||0} owned</div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Vet packs shop */}
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.1em',marginBottom:10}}>ðŸ¥ VET PACKS</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {Object.entries(INJURY_LEVELS).map(([level,info])=>{
              const canAfford=me.points>=info.vetPackPrice;
              const packKey=level+'_vet_pack';
              return (
                <button key={level} onClick={()=>canAfford&&onBuyFood(packKey,info.vetPackPrice)} disabled={!canAfford} style={{padding:'12px 14px',borderRadius:12,background:canAfford?`${info.color}12`:'rgba(255,255,255,0.02)',border:`1px solid ${info.color}${canAfford?'44':'22'}`,cursor:canAfford?'pointer':'not-allowed',opacity:canAfford?1:0.5,textAlign:'left'}}>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:info.color,letterSpacing:'0.06em',lineHeight:1}}>{info.healLabel}</div>
                  <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:4}}>Heals: {info.label}</div>
                  <div style={{fontSize:10,color:'#fb923c',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginTop:4}}>{info.vetPackPrice.toLocaleString()} ECO Â· Ã—{(me.foodInventory||{})[packKey]||0} owned</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TRAVEL SCREEN â€” expeditions replace Space
   ============================================================ */
function TravelScreen({ me, users, onBack, onSendExpedition, onCollectExpedition, onToast }) {
  const [selCard, setSelCard] = useState(null);
  const expeditions = me.expeditions || [];
  const now = Date.now();

  const availableCards = me.ownedCards.filter(card => {
    const onTrip = expeditions.some(e => e.cardId===card.id && e.status==='traveling');
    return !onTrip;
  });

  const handleSend = () => {
    if (!selCard) { onToast('PICK AN ANIMAL TO SEND', 'err'); return; }
    onSendExpedition(selCard.id);
    setSelCard(null);
  };

  const destinations = [
    { id:'forest',     label:'FOREST',      emoji:'ðŸŒ²', duration:EXPEDITION_DURATION_MS, materials:['wood','stone'],        desc:'Gather wood and stone' },
    { id:'quarry',     label:'QUARRY',       emoji:'â›ï¸', duration:EXPEDITION_DURATION_MS, materials:['stone','brick'],       desc:'Gather stone and brick' },
    { id:'desert',     label:'DESERT',       emoji:'ðŸœï¸', duration:EXPEDITION_DURATION_MS, materials:['glass','stone'],       desc:'Gather glass and stone' },
    { id:'jungle',     label:'JUNGLE',       emoji:'ðŸŒ´', duration:EXPEDITION_DURATION_MS, materials:['wood','glass','brick'], desc:'Gather all materials' },
  ];
  const [selDest, setSelDest] = useState('forest');
  const dest = destinations.find(d=>d.id===selDest);

  return (
    <div style={{padding:'24px 28px 40px'}}>
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>TRAVEL</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>Send animals on 1-minute expeditions Â· earn greenhouse materials Â· risk of injury</div>
      </div>

      {/* Materials inventory */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
        {Object.entries(MATERIAL_ICONS).map(([mat,icon])=>(
          <div key={mat} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color:'#fff7ed',letterSpacing:'0.06em'}}>{mat.toUpperCase()}</span>
            <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:'#4ade80'}}>Ã—{(me.materials||{})[mat]||0}</span>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        {/* Pick destination */}
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.1em',marginBottom:10}}>1. PICK DESTINATION</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {destinations.map(d=>(
              <button key={d.id} onClick={()=>setSelDest(d.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:selDest===d.id?'1px solid #4ade80':'1px solid rgba(255,255,255,0.08)',background:selDest===d.id?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
                <span style={{fontSize:22}}>{d.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1}}>{d.label}</div>
                  <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{d.desc} Â· 1 min Â· 25% injury risk</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Pick animal */}
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.1em',marginBottom:10}}>2. PICK ANIMAL</div>
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:260,overflowY:'auto'}}>
            {availableCards.length===0 && <div style={{color:'#78716c',fontFamily:'"Outfit",sans-serif',fontSize:13,padding:'20px 0'}}>All animals are on expeditions!</div>}
            {availableCards.map(card=>{
              const isSel=selCard&&selCard.id===card.id;
              return (
                <button key={card.id} onClick={()=>setSelCard(card)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:isSel?`1px solid ${me.color}`:'1px solid rgba(255,255,255,0.08)',background:isSel?`${me.color}15`:'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{card.first} {card.last}</div>
                    <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{card.pps}/sec Â· {card.team}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={handleSend} disabled={!selCard} style={{width:'100%',marginTop:10,padding:'12px',borderRadius:10,background:selCard?'linear-gradient(135deg,#fb923c,#c2410c)':'#3f3f46',border:'none',color:'#fff7ed',cursor:selCard?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.1em'}}>
            ðŸ—ºï¸ SEND ON EXPEDITION
          </button>
        </div>
      </div>

      {/* Active expeditions */}
      {expeditions.length>0 && (
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#fff7ed',letterSpacing:'0.08em',marginBottom:12}}>ACTIVE EXPEDITIONS</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {expeditions.map(exp=>{
              const card=me.ownedCards.find(c=>c.id===exp.cardId);
              if(!card) return null;
              const elapsed=now-exp.startedAt;
              const remaining=Math.max(0,exp.duration-elapsed);
              const done=remaining===0;
              const pct=Math.min(100,Math.round((elapsed/exp.duration)*100));
              const destInfo=destinations.find(d=>d.id===exp.destination)||destinations[0];
              return (
                <div key={exp.id} style={{padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${done?'#4ade80':'rgba(255,255,255,0.08)'}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                    <span style={{fontSize:20}}>{destInfo.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:15,color:'#fff7ed',letterSpacing:'0.04em'}}>{card.first} {card.last} â†’ {destInfo.label}</div>
                      <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>
                        {done ? 'âœ… READY TO COLLECT' : `${Math.ceil(remaining/1000)}s remaining`}
                      </div>
                    </div>
                    {done && (
                      <button onClick={()=>onCollectExpedition(exp.id)} style={{padding:'8px 14px',borderRadius:8,background:'linear-gradient(135deg,#4ade80,#16a34a)',border:'none',color:'#0a0a0a',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',fontWeight:700}}>
                        COLLECT
                      </button>
                    )}
                  </div>
                  <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
                    <div style={{width:pct+'%',height:'100%',background:done?'#4ade80':'#fb923c',borderRadius:3,transition:'width 1s linear'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GREENHOUSE SCREEN â€” replaces Binders
   ============================================================ */
function GreenhouseScreen({ me, onBuildGreenhouse, onOpenCard, onToast }) {
  const [building, setBuilding] = useState(false);
  const [selSize, setSelSize] = useState('s');
  const greenhouses = me.greenhouses || [];
  const mats = me.materials || {};

  const canAfford = (sizeKey) => {
    const req = GREENHOUSE_SIZES[sizeKey];
    return Object.keys(MATERIAL_ICONS).every(m => (mats[m]||0) >= req[m]);
  };

  const handleBuild = () => {
    if (!canAfford(selSize)) { onToast('NOT ENOUGH MATERIALS', 'err'); return; }
    onBuildGreenhouse(selSize);
    setBuilding(false);
  };

  return (
    <div style={{padding:'24px 28px 40px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>GREENHOUSE</div>
          <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>Build greenhouses with materials from expeditions Â· house your animals inside</div>
        </div>
        <button onClick={()=>setBuilding(b=>!b)} style={{padding:'10px 18px',borderRadius:10,background:'linear-gradient(135deg,#4ade80,#16a34a)',border:'none',color:'#0a0a0a',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.1em',fontWeight:700}}>
          ðŸŒ¿ BUILD NEW
        </button>
      </div>

      {/* Materials display */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
        {Object.entries(MATERIAL_ICONS).map(([mat,icon])=>(
          <div key={mat} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color:'#fff7ed',letterSpacing:'0.06em'}}>{mat.toUpperCase()}</span>
            <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:'#4ade80'}}>Ã—{mats[mat]||0}</span>
          </div>
        ))}
      </div>

      {/* Build panel */}
      {building && (
        <div style={{marginBottom:20,padding:'18px',borderRadius:14,background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.3)'}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#4ade80',letterSpacing:'0.08em',marginBottom:14}}>CHOOSE SIZE</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8,marginBottom:14}}>
            {Object.entries(GREENHOUSE_SIZES).map(([key,size])=>{
              const affordable=canAfford(key);
              const isSel=selSize===key;
              return (
                <button key={key} onClick={()=>setSelSize(key)} style={{padding:'12px',borderRadius:10,border:isSel?'2px solid #4ade80':'1px solid rgba(255,255,255,0.1)',background:isSel?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',opacity:affordable?1:0.6}}>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:isSel?'#4ade80':'#fff7ed',letterSpacing:'0.06em'}}>{size.label}</div>
                  <div style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:4}}>{size.desc}</div>
                  <div style={{marginTop:6,display:'flex',gap:4,flexWrap:'wrap'}}>
                    {Object.keys(MATERIAL_ICONS).map(m=>(
                      <span key={m} style={{fontSize:8,padding:'1px 5px',borderRadius:3,background:(mats[m]||0)>=size[m]?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)',color:(mats[m]||0)>=size[m]?'#4ade80':'#f87171',fontFamily:'"JetBrains Mono",monospace'}}>
                        {MATERIAL_ICONS[m]}{size[m]}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={handleBuild} style={{padding:'12px 24px',borderRadius:10,background:canAfford(selSize)?'linear-gradient(135deg,#4ade80,#16a34a)':'#3f3f46',border:'none',color:canAfford(selSize)?'#0a0a0a':'#fff7ed',cursor:canAfford(selSize)?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.1em'}}>
            BUILD {GREENHOUSE_SIZES[selSize]?.label} GREENHOUSE
          </button>
        </div>
      )}

      {/* Existing greenhouses */}
      {greenhouses.length===0 && !building && (
        <div style={{padding:'40px',textAlign:'center',color:'#78716c',fontFamily:'"Outfit",sans-serif',fontSize:14}}>
          No greenhouses yet. Gather materials from Travel expeditions and build one!
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
        {greenhouses.map(gh=>{
          const size=GREENHOUSE_SIZES[gh.sizeKey];
          const animalCount=Object.keys(gh.slots||{}).length;
          return (
            <div key={gh.id} style={{padding:'16px',borderRadius:14,background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.25)',cursor:'pointer'}}>
              <div style={{fontSize:32,marginBottom:8}}>ðŸŒ¿</div>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#4ade80',letterSpacing:'0.06em'}}>{gh.name||size?.label+' GREENHOUSE'}</div>
              <div style={{fontSize:10,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:4}}>{animalCount}/{size?.slots||9} ANIMALS Â· {size?.label}</div>
              {gh.coverImage && <img src={gh.coverImage} alt="" style={{width:'100%',borderRadius:6,marginTop:8,objectFit:'cover',maxHeight:80}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* HOME SCREEN */`,
  'S3 FoodScreen + TravelScreen + GreenhouseScreen components'
);

// ============================================================
// S4: Add new screens to main routing
// ============================================================
SR(
  `{screen==='binders' && <BindersScreen me={me} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onPlaceCard={handlePlaceCardInBinder} onRemoveCard={handleRemoveCardFromBinder}/>}`,
  `{screen==='binders' && <BindersScreen me={me} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onPlaceCard={handlePlaceCardInBinder} onRemoveCard={handleRemoveCardFromBinder}/>}
      {screen==='food' && <FoodScreen me={me} onFeedAnimal={handleFeedAnimal} onHealAnimal={handleHealAnimal} onBuyFood={handleBuyFood} onToast={showToast}/>}
      {screen==='travel' && <TravelScreen me={me} users={users} onBack={()=>setScreen('home')} onSendExpedition={handleSendExpedition} onCollectExpedition={handleCollectExpedition} onToast={showToast}/>}
      {screen==='greenhouse' && <GreenhouseScreen me={me} onBuildGreenhouse={handleBuildGreenhouse} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onToast={showToast}/>}`,
  'S4 New screen routing'
);

// ============================================================
// S5: Add handlers before handleMintCard
// ============================================================
SR(
  `const handleMintCard = (card,cost) => {`,
  `// ---- FOOD & VET HANDLERS ----
  const handleBuyFood = (itemId, price) => {
    if (!me || me.points < price) { showToast('NOT ENOUGH ECO', 'err'); return; }
    updateUser(me.username, u => ({
      ...u,
      points: u.points - price,
      foodInventory: { ...(u.foodInventory||{}), [itemId]: ((u.foodInventory||{})[itemId]||0) + 1 }
    }));
    showToast('BOUGHT ' + itemId.replace(/_/g,' ').toUpperCase());
  };

  const handleFeedAnimal = (cardId, foodId) => {
    if (!me) return;
    const card = me.ownedCards.find(c => c.id === cardId);
    if (!card) return;
    const inv = me.foodInventory || {};
    if (!inv[foodId] || inv[foodId] < 1) { showToast('NO FOOD LEFT', 'err'); return; }
    const pct = getFoodPct(foodId, card);
    updateUser(me.username, u => {
      const curHunger = (u.cardHunger||{})[cardId] ?? 100;
      const newHunger = Math.min(100, curHunger + pct);
      return {
        ...u,
        foodInventory: { ...(u.foodInventory||{}), [foodId]: (u.foodInventory[foodId]||1) - 1 },
        cardHunger: { ...(u.cardHunger||{}), [cardId]: newHunger }
      };
    });
    showToast('+' + pct + '% HUNGER Â· ' + card.first + ' ' + card.last);
  };

  const handleHealAnimal = (cardId, injuryLevel) => {
    if (!me) return;
    const packKey = injuryLevel + '_vet_pack';
    const inv = me.foodInventory || {};
    if (!inv[packKey] || inv[packKey] < 1) { showToast('NO VET PACK', 'err'); return; }
    updateUser(me.username, u => {
      const inj = { ...(u.cardInjury||{}) };
      delete inj[cardId];
      return {
        ...u,
        foodInventory: { ...(u.foodInventory||{}), [packKey]: (u.foodInventory[packKey]||1) - 1 },
        cardInjury: inj
      };
    });
    showToast('HEALED! ANIMAL IS BACK IN ACTION');
  };

  // ---- EXPEDITION HANDLERS ----
  const handleSendExpedition = (cardId) => {
    if (!me) return;
    const destinations = [
      { id:'forest',  materials:['wood','stone'] },
      { id:'quarry',  materials:['stone','brick'] },
      { id:'desert',  materials:['glass','stone'] },
      { id:'jungle',  materials:['wood','glass','brick'] },
    ];
    const dest = destinations[Math.floor(Math.random()*destinations.length)];
    const exp = {
      id: 'exp_' + Date.now(),
      cardId,
      destination: dest.id,
      materials: dest.materials,
      startedAt: Date.now(),
      duration: EXPEDITION_DURATION_MS,
      status: 'traveling'
    };
    updateUser(me.username, u => ({
      ...u,
      expeditions: [...(u.expeditions||[]), exp]
    }));
    const card = me.ownedCards.find(c=>c.id===cardId);
    showToast((card?.first||'ANIMAL') + ' SENT ON EXPEDITION Â· 1 MIN');
  };

  const handleCollectExpedition = (expId) => {
    if (!me) return;
    const exp = (me.expeditions||[]).find(e=>e.id===expId);
    if (!exp) return;
    const card = me.ownedCards.find(c=>c.id===exp.cardId);
    // Roll for injury
    const injured = Math.random() < EXPEDITION_INJURY_CHANCE;
    const injuryLevels = ['minor','injured','major'];
    const injuryLevel = injured ? injuryLevels[Math.floor(Math.random()*injuryLevels.length)] : null;
    // Roll materials earned (1-3 of each listed material)
    const earned = {};
    (exp.materials||[]).forEach(m => { earned[m] = (earned[m]||0) + 1 + Math.floor(Math.random()*3); });
    updateUser(me.username, u => {
      const newMats = { ...(u.materials||{}) };
      Object.entries(earned).forEach(([m,n])=>{ newMats[m] = (newMats[m]||0) + n; });
      const newInj = { ...(u.cardInjury||{}) };
      if (injuryLevel && card) newInj[card.id] = injuryLevel;
      return {
        ...u,
        materials: newMats,
        cardInjury: newInj,
        expeditions: (u.expeditions||[]).filter(e=>e.id!==expId)
      };
    });
    const matStr = Object.entries(earned).map(([m,n])=>n+'Ã—'+m.toUpperCase()).join(' Â· ');
    if (injured && card) {
      showToast(card.first+' RETURNED INJURED Â· '+matStr, 'err');
    } else {
      showToast('COLLECTED: '+matStr);
    }
  };

  // ---- GREENHOUSE HANDLERS ----
  const handleBuildGreenhouse = (sizeKey) => {
    if (!me) return;
    const req = GREENHOUSE_SIZES[sizeKey];
    const mats = me.materials || {};
    for (const m of Object.keys(MATERIAL_ICONS)) {
      if ((mats[m]||0) < req[m]) { showToast('NOT ENOUGH ' + m.toUpperCase(), 'err'); return; }
    }
    const newMats = { ...mats };
    Object.keys(MATERIAL_ICONS).forEach(m => { newMats[m] = (newMats[m]||0) - req[m]; });
    const gh = {
      id: 'gh_' + Date.now(),
      sizeKey,
      name: GREENHOUSE_SIZES[sizeKey].label + ' GREENHOUSE',
      slots: {},
      coverImage: null,
      createdAt: Date.now()
    };
    updateUser(me.username, u => ({
      ...u,
      materials: newMats,
      greenhouses: [...(u.greenhouses||[]), gh]
    }));
    showToast('ðŸŒ¿ GREENHOUSE BUILT!');
  };

  const handleMintCard = (card,cost) => {`,
  'S5 Food/Vet/Expedition/Greenhouse handlers'
);

// ============================================================
// S6: Expedition auto-complete timer
// ============================================================
SR(
  `  // Damage accrual`,
  `  // Expedition completion check â€” poll every 5s
  useEffect(()=>{
    if(!me) return;
    const id = setInterval(()=>{
      const exps = (users[me.username]?.expeditions)||[];
      const now = Date.now();
      const readyCount = exps.filter(e=>e.status==='traveling'&&(now-e.startedAt)>=e.duration).length;
      if(readyCount>0) showToast(readyCount+' EXPEDITION'+(readyCount>1?'S':'')+' READY TO COLLECT!');
    }, 5000);
    return ()=>clearInterval(id);
  },[me?.username]);

  // Damage accrual`,
  'S6 Expedition ready notification'
);

// ============================================================
// S7: Nav bar â€” replace dock with new eco nav
// ============================================================
SR(
  `<NavButton label="HOME" sub="ROSTER" Icon={Home} isActive={screen==='home'} onClick={()=>setScreen('home')}/>
        <NavButton label="SHOP" sub="TRADE Â· BUY" Icon={Store} isActive={screen==='shop'} onClick={()=>setScreen('shop')}/>
        <NavButton label="COLLECT" sub="DEEP DIVE" Icon={Library} isActive={screen==='collection'} onClick={()=>setScreen('collection')}/>
        <NavButton label="BINDERS" sub="SORT CARDS" Icon={Grid3x3} isActive={screen==='binders'} onClick={()=>setScreen('binders')} color="#60a5fa"/>
        <NavButton label="LEADERS" sub="FAMILY RANKS" Icon={Trophy} isActive={false} onClick={()=>setLeaderboardOpen(true)} color="#fbbf24"/>
        <NavButton label="SPACE" sub="LAUNCH" Icon={Rocket} isActive={screen==='space'} onClick={()=>setScreen('space')} color="#c4b5fd"/>
        <NavButton label="DESIGN" sub="MINT NEW" Icon={Palette} isHero isActive={screen==='design'} onClick={()=>setScreen('design')}/>
        <NavButton label="INBOX" sub={\`\${inboxCount} OFFERS\`} Icon={Inbox} isActive={false} onClick={()=>{ refreshTrades(); setInboxOpen(true); }} color={inboxCount>0?'#a855f7':undefined}/>
        <div className="dock-user-button"><NavButton label={me.displayName.toUpperCase()} sub="SIGN OUT" emoji={me.emoji} isActive={false} onClick={()=>setUserMenuOpen(true)} color={me.color}/></div>`,
  `<NavButton label="HOME" sub="ANIMALS" Icon={Home} isActive={screen==='home'} onClick={()=>setScreen('home')}/>
        <NavButton label="COLLECT" sub="SORT" Icon={Library} isActive={screen==='collection'} onClick={()=>setScreen('collection')}/>
        <NavButton label="VET" sub="HEAL" Icon={Award} isActive={screen==='food'&&false} onClick={()=>{setScreen('food');}} color="#4ade80"/>
        <NavButton label="GREENHOUSE" sub="BUILD" Icon={Sparkles} isActive={screen==='greenhouse'} onClick={()=>setScreen('greenhouse')} color="#4ade80"/>
        <NavButton label="DESIGN" sub="MINT" Icon={Palette} isHero isActive={screen==='design'} onClick={()=>setScreen('design')}/>
        <NavButton label="SHOP" sub="TRADE" Icon={Store} isActive={screen==='shop'} onClick={()=>setScreen('shop')}/>
        <NavButton label="TRAVEL" sub="EXPLORE" Icon={Rocket} isActive={screen==='travel'} onClick={()=>setScreen('travel')} color="#c4b5fd"/>
        <NavButton label="INBOX" sub={\`\${inboxCount}\`} Icon={Inbox} isActive={false} onClick={()=>{ refreshTrades(); setInboxOpen(true); }} color={inboxCount>0?'#a855f7':undefined}/>
        <NavButton label="FOOD" sub="FEED" Icon={Flame} isActive={screen==='food'} onClick={()=>setScreen('food')} color="#fb923c"/>
        <div className="dock-user-button"><NavButton label={me.displayName.toUpperCase()} sub="LOG OUT" emoji={me.emoji} isActive={false} onClick={()=>handleLogout()} color={me.color}/></div>`,
  'S7 Nav bar redesign'
);

// ============================================================
// S8: Mobile nav sheet â€” add new screens
// ============================================================
SR(
  `{label:'SPACE',sub:'LAUNCH',Icon:Rocket,color:'#c4b5fd',onPick:()=>go(()=>setScreen('space')),active:screen==='space'},`,
  `{label:'TRAVEL',sub:'EXPLORE',Icon:Rocket,color:'#c4b5fd',onPick:()=>go(()=>setScreen('travel')),active:screen==='travel'},
    {label:'GREENHOUSE',sub:'BUILD',Icon:Sparkles,color:'#4ade80',onPick:()=>go(()=>setScreen('greenhouse')),active:screen==='greenhouse'},
    {label:'FOOD',sub:'FEED',Icon:Flame,color:'#fb923c',onPick:()=>go(()=>setScreen('food')),active:screen==='food'},`,
  'S8 Mobile nav new screens'
);

// Print results
results.forEach(r => console.log(r));

// Sanity
const checks = [
  ['FoodScreen', c.includes('function FoodScreen(')],
  ['TravelScreen', c.includes('function TravelScreen(')],
  ['GreenhouseScreen', c.includes('function GreenhouseScreen(')],
  ['GREENHOUSE_SIZES', c.includes('GREENHOUSE_SIZES')],
  ['handleFeedAnimal', c.includes('handleFeedAnimal')],
  ['handleSendExpedition', c.includes('handleSendExpedition')],
  ['handleBuildGreenhouse', c.includes('handleBuildGreenhouse')],
  ['TRAVEL nav', c.includes("label:'TRAVEL'")],
  ['FOOD nav', c.includes("label:'FOOD'")],
  ['GREENHOUSE nav', c.includes("label:'GREENHOUSE'")],
];
let failed = false;
checks.forEach(([l,ok])=>{ if(!ok){ console.log('  MISSING: '+l); failed=true; } });
if(failed){ console.log('SANITY FAILED'); process.exit(1); }

fs.writeFileSync(file, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('');
console.log('SUCCESS');