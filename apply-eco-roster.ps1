# apply-eco-roster.ps1
# Redesigns the roster/home page to match Carter's sketch:
#   - Profile header (avatar, name, PPS, fav card, invite/edit buttons)
#   - "CARTER'S ANIMALS" heading
#   - Hunger meter on each card
#   - Hunger data model added to user state
#   - Food items data constant
#   - Butterfly decorators on quick action bar
# Run from: C:\Users\TylerDren\eco-heroes

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$file = Join-Path $projectRoot "src\EcoHeroes.jsx"
$patchFile = Join-Path $projectRoot "eco-patch-roster.cjs"

Write-Host ""
Write-Host "=== APPLY ECO ROSTER ===" -ForegroundColor Cyan
Write-Host "Target: $file"
Write-Host ""

if (-not (Test-Path $file)) {
    Write-Host "ERROR: Cannot find $file" -ForegroundColor Red; exit 1
}

$nodeScript = @'
const fs = require('fs');
const file = process.argv[2];
let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const results = [];

function SR(old, next, label) {
  if (c.includes(old)) {
    c = c.split(old).join(next);
    results.push('  DONE: ' + label);
    return true;
  } else {
    results.push('  SKIP: ' + label);
    return false;
  }
}

// ============================================================
// R1: Add FOOD_ITEMS and HUNGER constants after DAILY_REWARD
// ============================================================
SR(
  `const DAILY_REWARD = 5000;`,
  `const DAILY_REWARD = 5000;

// Hunger system — drops 1% every 5 real minutes (300000ms)
const HUNGER_DROP_INTERVAL_MS = 300000;
const HUNGER_DROP_AMOUNT = 1;

// Animal size tiers — determines food effectiveness
const ANIMAL_SIZE = {
  tiny:   ['CHIPMUNK','SQUIRREL','HEDGEHOG','RACCOON','CARDINAL','SKUNK','PORCUPINE'],
  small:  ['OTTER','BEAVER','BADGER','FOX','RABBIT'],
  medium: ['WOLF','PANDA','TIGER','LEOPARD','MOOSE'],
  large:  ['LION','ELEPHANT','BEAR','GORILLA','RHINO'],
  giant:  ['WHALE','ORCA','EAGLE','PENGUIN','CAMEL','OWL'],
};
function getAnimalSize(card) {
  const name = (card.last || '').toUpperCase();
  for (const [tier, animals] of Object.entries(ANIMAL_SIZE)) {
    if (animals.some(a => name.includes(a))) return tier;
  }
  return 'medium';
}

// Food items — fullness% is base for medium animal, scaled by size
const FOOD_ITEMS = [
  { id:'seeds',       label:'SEEDS',        emoji:'🌱', basePct:25,  sizeScale:true,  price:50,   desc:'Plants & seeds — great for small animals' },
  { id:'berries',     label:'BERRIES',      emoji:'🫐', basePct:15,  sizeScale:false, price:80,   desc:'15% fullness for any animal' },
  { id:'white_bread', label:'WHITE BREAD',  emoji:'🍞', basePct:45,  sizeScale:false, price:120,  desc:'45% fullness for any animal' },
  { id:'small_fish',  label:'SMALL FISH',   emoji:'🐟', basePct:30,  sizeScale:false, price:200,  desc:'30% fullness — best for small/medium' },
  { id:'large_fish',  label:'LARGE FISH',   emoji:'🐠', basePct:65,  sizeScale:false, price:400,  desc:'65% fullness — feeds large animals well' },
  { id:'chicken',     label:'CHICKEN',      emoji:'🍗', basePct:60,  sizeScale:false, price:350,  desc:'60% fullness — medium meat' },
  { id:'steak',       label:'STEAK',        emoji:'🥩', basePct:85,  sizeScale:false, price:600,  desc:'85% fullness — premium meat' },
];

// Size multipliers for sizeScale foods (seeds/plants)
const SIZE_FOOD_MULT = { tiny:2.0, small:1.5, medium:1.0, large:0.3, giant:0.1 };

function getFoodPct(foodId, card) {
  const food = FOOD_ITEMS.find(f => f.id === foodId);
  if (!food) return 0;
  if (!food.sizeScale) return food.basePct;
  const mult = SIZE_FOOD_MULT[getAnimalSize(card)] || 1.0;
  return Math.min(100, Math.round(food.basePct * mult));
}`,
  'R1 Hunger + Food constants'
);

// ============================================================
// R2: Add hunger to STARTING_USERS defaults
// ============================================================
SR(
  `tyler: { username:'tyler', displayName:'Tyler', color:'#fb923c', emoji:'🦊', points:3000, ownedCards:TYLER_ROSTER, packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'] },`,
  `tyler: { username:'tyler', displayName:'Tyler', color:'#fb923c', emoji:'🦊', points:3000, ownedCards:TYLER_ROSTER, packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'], favCardId:null, foodInventory:{}, cardHunger:{} },`,
  'R2a Tyler hunger fields'
);
SR(
  `carter:{ username:'carter',displayName:'Carter',color:'#22d3ee', emoji:'🐺', points:3000, ownedCards:CARTER_ROSTER,packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'] },`,
  `carter:{ username:'carter',displayName:'Carter',color:'#22d3ee', emoji:'🐺', points:3000, ownedCards:CARTER_ROSTER,packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'], favCardId:null, foodInventory:{}, cardHunger:{} },`,
  'R2b Carter hunger fields'
);

// ============================================================
// R3: getCardHunger helper — after getCardState helper
// ============================================================
SR(
  `function getCardState(me, cardId){`,
  `function getCardHunger(me, cardId){
  if(!me || !me.cardHunger) return 100;
  return me.cardHunger[cardId] ?? 100;
}
function getCardState(me, cardId){`,
  'R3 getCardHunger helper'
);

// ============================================================
// R4: HungerBar component — add before HomeScreen
// ============================================================
SR(
  `/* HOME SCREEN */`,
  `/* HUNGER BAR */
function HungerBar({pct, small}){
  const color = pct > 60 ? '#4ade80' : pct > 30 ? '#fbbf24' : '#ef4444';
  const label = pct > 60 ? 'FED' : pct > 30 ? 'HUNGRY' : pct > 0 ? 'STARVING' : 'EMPTY';
  if(small) return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <div style={{flex:1,height:4,borderRadius:2,background:'rgba(255,255,255,0.1)',overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',background:color,borderRadius:2,transition:'width 600ms'}}/>
      </div>
      <span style={{fontSize:8,color,fontFamily:'"JetBrains Mono",monospace',fontWeight:700,letterSpacing:'0.05em',minWidth:24}}>{pct}%</span>
    </div>
  );
  return (
    <div style={{padding:'6px 8px',borderRadius:6,background:'rgba(0,0,0,0.3)',border:\`1px solid \${color}44\`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:8,color:'#a8a29e',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>HUNGER</span>
        <span style={{fontSize:9,color,fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>{label} · {pct}%</span>
      </div>
      <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',background:color,borderRadius:3,transition:'width 600ms',boxShadow:\`0 0 6px \${color}88\`}}/>
      </div>
    </div>
  );
}

/* PROFILE HEADER */
function ProfileHeader({me, onEditAvatar, onEditFavCard, onInviteFriend, onOpenCard}){
  const favCard = me.favCardId ? me.ownedCards.find(c=>c.id===me.favCardId) : null;
  const totalPPS = me.ownedCards.reduce((s,c)=>{
    const hunger = (me.cardHunger && me.cardHunger[c.id]) ?? 100;
    return hunger > 0 ? s + (c.pps||0)*(c.qty||1) : s;
  }, 0);
  return (
    <div style={{margin:'16px 28px 0',padding:'16px 18px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:16,alignItems:'stretch',flexWrap:'wrap'}}>
      {/* Avatar + name */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,minWidth:80}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:\`\${me.color}33\`,border:\`2px solid \${me.color}\`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>{me.emoji}</div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1}}>{me.displayName.toUpperCase()}</div>
        <div style={{display:'flex',gap:4}}>
          <button onClick={onEditAvatar} style={{padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>EDIT</button>
          <button onClick={onInviteFriend} style={{padding:'3px 8px',borderRadius:4,background:\`\${me.color}22\`,border:\`1px solid \${me.color}55\`,color:me.color,cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>+ FRIEND</button>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:8,flex:1,minWidth:120}}>
        <div style={{display:'flex',alignItems:'baseline',gap:6}}>
          <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:28,fontWeight:800,color:'#fff7ed',lineHeight:1}}>{Math.floor(me.points).toLocaleString()}</span>
          <span style={{fontSize:10,color:'#fb923c',fontWeight:700,letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>ECO</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 8px',borderRadius:999,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',alignSelf:'flex-start'}}>
          <TrendingUp size={10} style={{color:'#4ade80'}}/>
          <span style={{fontSize:10,fontWeight:700,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace'}}>+{totalPPS}/sec</span>
        </div>
        <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{me.ownedCards.length} ANIMALS</div>
      </div>
      {/* Fav card */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:90}}>
        <div style={{fontSize:9,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace'}}>FAV ANIMAL</div>
        {favCard ? (
          <div style={{width:80,cursor:'pointer'}} onClick={()=>onOpenCard(favCard)}>
            <PlayerCard card={favCard}/>
          </div>
        ) : (
          <button onClick={onEditFavCard} style={{width:80,aspectRatio:'5/7',borderRadius:8,border:'1px dashed rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.02)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,color:'#52525b'}}>
            <Star size={18} style={{color:'#52525b'}}/>
            <span style={{fontSize:8,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>PICK ONE</span>
          </button>
        )}
        {favCard && <button onClick={onEditFavCard} style={{padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>CHANGE</button>}
      </div>
    </div>
  );
}

/* FAV CARD PICKER MODAL */
function FavCardPicker({me, onClose, onPick}){
  return (
    <div style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:600,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(251,191,36,0.3)',padding:22,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}><Star size={20} style={{color:'#fbbf24'}}/>PICK YOUR FAVOURITE ANIMAL</div>
            <div style={{fontSize:11,color:'#a8a29e',marginTop:2}}>This shows on your profile</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
            {me.ownedCards.map(c=>(
              <button key={c.id} onClick={()=>onPick(c.id)} style={{padding:0,border:me.favCardId===c.id?'2px solid #fbbf24':'2px solid transparent',borderRadius:10,background:'transparent',cursor:'pointer'}}>
                <PlayerCard card={c}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* HOME SCREEN */`,
  'R4 HungerBar + ProfileHeader + FavCardPicker components'
);

// ============================================================
// R5: HomeScreen — add profile header, hunger meters, rename heading
// ============================================================
SR(
  `function HomeScreen({me,pendingCount,onClaimDaily,onOpenPack,onOpenInbox,onOpenCard,onShowComingSoon}){
  const [filter,setFilter] = useState('all');
  const [hoveredId,setHoveredId] = useState(null);
  const looseAll = useMemo(()=>getLooseCards(me),[me.ownedCards, me.binderData]);
  const visible = filter==='all' ? me.ownedCards : me.ownedCards.filter(c=>c.rarity===filter);

  return <>
    <div style={{padding:'20px 28px 4px',display:'flex',gap:12,flexWrap:'wrap'}}>
      <QuickAction icon={Gift} label={me.dailyClaimed?'DAILY · CLAIMED':'CLAIM DAILY'} sub={me.dailyClaimed?'come back tomorrow':\`+\${DAILY_REWARD.toLocaleString()} pts free\`} accent={me.dailyClaimed?'#52525b':'#4ade80'} badge={!me.dailyClaimed&&'!'} onClick={onClaimDaily} disabled={me.dailyClaimed}/>
      <QuickAction icon={Package} label="OPEN FREE PACK" sub={me.packsAvailable>0?\`\${me.packsAvailable} pack ready\`:'come back tomorrow'} accent={me.packsAvailable>0?'#fb923c':'#52525b'} badge={me.packsAvailable>0&&me.packsAvailable} onClick={()=>me.packsAvailable>0&&onOpenPack('daily')} disabled={me.packsAvailable<=0}/>
      <QuickAction icon={Mail} label="TRADE OFFERS" sub={pendingCount>0?\`\${pendingCount} waiting for you\`:'all clear'} accent={pendingCount>0?'#a855f7':'#52525b'} badge={pendingCount>0&&pendingCount} onClick={onOpenInbox}/>
      <QuickAction icon={Gamepad2} label="MINI GAMES" sub="coming soon · earn points" accent="#52525b" badge="SOON" onClick={()=>onShowComingSoon&&onShowComingSoon()} disabled={false}/>
    </div>
    <div style={{padding:'24px 28px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
      <div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>{me.displayName.toUpperCase()}'S ROSTER</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:2}}>{visible.length} of {me.ownedCards.length} cards · click any card for highlights</div>
      </div>`,

  `function HomeScreen({me,pendingCount,onClaimDaily,onOpenPack,onOpenInbox,onOpenCard,onShowComingSoon,onEditAvatar,onEditFavCard,onInviteFriend}){
  const [filter,setFilter] = useState('all');
  const [hoveredId,setHoveredId] = useState(null);
  const looseAll = useMemo(()=>getLooseCards(me),[me.ownedCards, me.binderData]);
  const visible = filter==='all' ? me.ownedCards : me.ownedCards.filter(c=>c.rarity===filter);

  return <>
    <ProfileHeader me={me} onEditAvatar={onEditAvatar} onEditFavCard={onEditFavCard} onInviteFriend={onInviteFriend} onOpenCard={onOpenCard}/>
    <div style={{padding:'16px 28px 4px',display:'flex',gap:12,flexWrap:'wrap'}}>
      <QuickAction icon={Gift} label={me.dailyClaimed?'DAILY · CLAIMED':'CLAIM DAILY'} sub={me.dailyClaimed?'come back tomorrow':\`+\${DAILY_REWARD.toLocaleString()} eco free\`} accent={me.dailyClaimed?'#52525b':'#4ade80'} badge={!me.dailyClaimed&&'!'} onClick={onClaimDaily} disabled={me.dailyClaimed}/>
      <QuickAction icon={Package} label="OPEN FREE PACK" sub={me.packsAvailable>0?\`\${me.packsAvailable} pack ready\`:'come back tomorrow'} accent={me.packsAvailable>0?'#fb923c':'#52525b'} badge={me.packsAvailable>0&&me.packsAvailable} onClick={()=>me.packsAvailable>0&&onOpenPack('daily')} disabled={me.packsAvailable<=0}/>
      <QuickAction icon={Mail} label="TRADE OFFERS" sub={pendingCount>0?\`\${pendingCount} waiting for you\`:'all clear'} accent={pendingCount>0?'#a855f7':'#52525b'} badge={pendingCount>0&&pendingCount} onClick={onOpenInbox}/>
      <QuickAction icon={Gamepad2} label="MINI GAMES" sub="earn food + materials" accent="#4ade80" badge="SOON" onClick={()=>onShowComingSoon&&onShowComingSoon()} disabled={false}/>
    </div>
    <div style={{padding:'16px 28px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
      <div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>{me.displayName.toUpperCase()}'S ANIMALS</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:2}}>{visible.length} of {me.ownedCards.length} animals · click any for details</div>
      </div>`,
  'R5 HomeScreen profile header + Animals heading'
);

// ============================================================
// R6: Add hunger bar under each card in home screen grid
// ============================================================
SR(
  `{visible.map((card,idx)=><div key={card.id} className="card-stagger" style={{animationDelay:\`\${idx*70}ms\`}}>
        <PlayerCard card={card} damage={getCardState(me,card.id).damage} hovered={hoveredId===card.id} onHover={()=>setHoveredId(card.id)} onLeave={()=>setHoveredId(null)} onClick={()=>onOpenCard(card)}/>
      </div>)}`,
  `{visible.map((card,idx)=><div key={card.id} className="card-stagger" style={{animationDelay:\`\${idx*70}ms\`,display:'flex',flexDirection:'column',gap:6}}>
        <PlayerCard card={card} damage={getCardState(me,card.id).damage} hovered={hoveredId===card.id} onHover={()=>setHoveredId(card.id)} onLeave={()=>setHoveredId(null)} onClick={()=>onOpenCard(card)}/>
        <HungerBar pct={getCardHunger(me,card.id)} small/>
      </div>)}`,
  'R6 Hunger bar under each card'
);

// ============================================================
// R7: Add hunger ticker to points ticker useEffect
// ============================================================
SR(
  `  // Points ticker — only when logged in
  useEffect(()=>{
    if(!me) return;
    let lastSave = Date.now();
    const id = setInterval(()=>{
      setUsers(prev=>{
        const u = prev[me.username];
        if(!u) return prev;
        const newPoints = u.points + totalPPS/10;
        const updated = {...u, points:newPoints};
        // throttled persist every 5s
        if(Date.now() - lastSave > 5000){
          persistUser(me.username, updated);
          lastSave = Date.now();
        }
        return {...prev, [me.username]:updated};
      });
    },100);
    return ()=>clearInterval(id);
  },[me?.username,totalPPS,persistUser]);`,

  `  // Points ticker — only when logged in
  useEffect(()=>{
    if(!me) return;
    let lastSave = Date.now();
    const id = setInterval(()=>{
      setUsers(prev=>{
        const u = prev[me.username];
        if(!u) return prev;
        // Only count pps from animals that are not starving
        const activePPS = (u.ownedCards||[]).reduce((s,card)=>{
          const hunger = (u.cardHunger && u.cardHunger[card.id]) ?? 100;
          return hunger > 0 ? s + effPps(card.pps, getCardState(u,card.id).damage)*(card.qty||1) : s;
        },0);
        const newPoints = u.points + activePPS/10;
        const updated = {...u, points:newPoints};
        if(Date.now() - lastSave > 5000){
          persistUser(me.username, updated);
          lastSave = Date.now();
        }
        return {...prev, [me.username]:updated};
      });
    },100);
    return ()=>clearInterval(id);
  },[me?.username,persistUser]);

  // Hunger ticker — drops 1% every 5 minutes
  useEffect(()=>{
    if(!me) return;
    const id = setInterval(()=>{
      setUsers(prev=>{
        const u = prev[me.username];
        if(!u) return prev;
        const cardHunger = {...(u.cardHunger||{})};
        let changed = false;
        for(const card of u.ownedCards){
          const cur = cardHunger[card.id] ?? 100;
          if(cur > 0){
            cardHunger[card.id] = Math.max(0, cur - HUNGER_DROP_AMOUNT);
            changed = true;
          }
        }
        if(!changed) return prev;
        return {...prev, [me.username]:{...u, cardHunger}};
      });
    }, HUNGER_DROP_INTERVAL_MS);
    return ()=>clearInterval(id);
  },[me?.username]);`,
  'R7 Hunger ticker useEffect'
);

// ============================================================
// R8: Add favCardId handler + wire HomeScreen props in main app
// ============================================================
SR(
  `{screen==='home' && <HomeScreen me={me} pendingCount={inboxCount} onClaimDaily={handleClaimDaily} onOpenPack={handleOpenPack} onOpenInbox={()=>{ refreshTrades(); setInboxOpen(true); }} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onShowComingSoon={()=>setComingSoonOpen(true)}/>}`,
  `{screen==='home' && <HomeScreen me={me} pendingCount={inboxCount} onClaimDaily={handleClaimDaily} onOpenPack={handleOpenPack} onOpenInbox={()=>{ refreshTrades(); setInboxOpen(true); }} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onShowComingSoon={()=>setComingSoonOpen(true)} onEditAvatar={()=>setComingSoonOpen(true)} onInviteFriend={()=>setComingSoonOpen(true)} onEditFavCard={()=>setFavCardPickerOpen(true)}/>}`,
  'R8 HomeScreen favCard props'
);

// ============================================================
// R9: Add favCardPickerOpen state + handler near other state declarations
// ============================================================
SR(
  `const [editingCardForDesign,setEditingCardForDesign] = useState(null);`,
  `const [editingCardForDesign,setEditingCardForDesign] = useState(null);
  const [favCardPickerOpen,setFavCardPickerOpen] = useState(false);

  const handlePickFavCard = (cardId) => {
    if(!me) return;
    updateUser(me.username, u=>({...u, favCardId:cardId}));
    setFavCardPickerOpen(false);
    showToast('FAVOURITE ANIMAL SET!');
  };`,
  'R9 favCardPickerOpen state'
);

// ============================================================
// R10: Render FavCardPicker modal in main app JSX
// ============================================================
SR(
  `{comingSoonOpen && <ComingSoonModal`,
  `{favCardPickerOpen && me && <FavCardPicker me={me} onClose={()=>setFavCardPickerOpen(false)} onPick={handlePickFavCard}/>}
      {comingSoonOpen && <ComingSoonModal`,
  'R10 FavCardPicker modal render'
);

// ============================================================
// R11: Points display in header — rename PTS -> ECO
// ============================================================
SR(
  `<span style={{fontSize:11,color:'#fb923c',fontWeight:700,letterSpacing:'0.15em'}}>PTS</span>`,
  `<span style={{fontSize:11,color:'#4ade80',fontWeight:700,letterSpacing:'0.15em'}}>ECO</span>`,
  'R11 PTS -> ECO in header'
);

// Print all results
results.forEach(r => console.log(r));

// Sanity checks
const ok1 = c.includes('HUNGER_DROP_INTERVAL_MS');
const ok2 = c.includes('HungerBar');
const ok2b = c.includes('ProfileHeader');
const ok3 = c.includes("ANIMALS");
const ok4 = c.includes('getCardHunger');
const ok5 = c.includes('FOOD_ITEMS');
if (!ok1 || !ok2 || !ok2b || !ok3 || !ok4 || !ok5) {
  console.log('SANITY FAILED - missing: ' +
    (!ok1?'HUNGER_INTERVAL ':'')+(!ok2?'HungerBar ':'')+(!ok2b?'ProfileHeader ':'')+
    (!ok3?'ANIMALS ':'')+(!ok4?'getCardHunger ':'')+(!ok5?'FOOD_ITEMS ':''));
  process.exit(1);
}

fs.writeFileSync(file, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('');
console.log('SUCCESS');
'@

[System.IO.File]::WriteAllText($patchFile, $nodeScript, [System.Text.Encoding]::UTF8)
Write-Host "Node patch written." -ForegroundColor Gray
Write-Host ""
Write-Host "Running..." -ForegroundColor Cyan

$result = node $patchFile $file 2>&1
$result | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -ne 0) {
    Write-Host "PATCH FAILED" -ForegroundColor Red
    Remove-Item $patchFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $patchFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SUCCESS - Roster redesign applied!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "What changed:" -ForegroundColor Cyan
Write-Host "  - Profile header with avatar, ECO balance, PPS, fav animal"
Write-Host "  - 'ROSTER' renamed to 'ANIMALS'"
Write-Host "  - Hunger bar under every animal card"
Write-Host "  - Hunger ticker (drops 1% every 5 mins)"
Write-Host "  - Animals at 0% hunger stop earning ECO"
Write-Host "  - PTS renamed ECO throughout header"
Write-Host "  - Fav animal picker modal"
Write-Host "  - Food items data ready for next script"
Write-Host ""
Write-Host "Refresh your browser." -ForegroundColor Cyan
