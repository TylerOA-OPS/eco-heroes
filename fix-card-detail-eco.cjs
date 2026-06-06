const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Add shelters + vet inventory to CardDetailModal props ──
P('Add shelters and vet props to CardDetailModal signature',
"function CardDetailModal({card,onClose,onSell,isMine=true,onEdit,binders,onAddToBinder,inBinder,onRemoveFromBinder,damage=0,caseType=null,onRepair,onEncase}){",
"function CardDetailModal({card,onClose,onSell,isMine=true,onEdit,binders,onAddToBinder,inBinder,onRemoveFromBinder,damage=0,caseType=null,onRepair,onEncase,shelters,onAddToShelter,vetInventory,cardInjury,onHealCard}){"
);

// ── P2: Remove REPAIR TO MINT button, replace with VET PACK heal button ──
P('Replace repair button with vet pack button',
"        {isMine && damage>0 && onRepair && <button onClick={()=>onRepair(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.35)',color:'#86efac',cursor:'pointer',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><RefreshCcw size={13}/>REPAIR TO MINT - {Math.floor(getCardValue(card)*0.20*damage).toLocaleString()} PTS</button>}",
`        {isMine && cardInjury && cardInjury[card.id] && (
          <div style={{width:'100%',display:'flex',flexDirection:'column',gap:6,padding:'10px 12px',borderRadius:10,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.3)'}}>
            <div style={{fontSize:9,color:'#fca5a5',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',textAlign:'center'}}>⚠ {INJURY_STATES[cardInjury[card.id]]} — USE A VET PACK TO HEAL</div>
            {vetInventory && VET_PACK_ITEMS.filter(v=>(vetInventory[v.id]||0)>0).length>0
              ? VET_PACK_ITEMS.filter(v=>(vetInventory[v.id]||0)>0).map(v=>(
                <button key={v.id} onClick={()=>onHealCard&&onHealCard(card.id,v.id)}
                  style={{width:'100%',padding:'8px 10px',borderRadius:8,background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.35)',color:'#34d399',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <span style={{fontSize:18}}>{v.emoji}</span> USE {v.label} <span style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>×{vetInventory[v.id]}</span>
                </button>
              ))
              : <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',textAlign:'center'}}>No vet packs in inventory — buy from SHOP</div>
            }
          </div>
        )}`
);

// ── P3: Add to shelter button (after the edit button) ──
P('Add shelter assignment button to card detail',
"        {isMine && onEdit && <button onClick={()=>onEdit(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Palette size={13}/>EDIT THIS CARD</button>}",
`        {isMine && shelters && shelters.length>0 && onAddToShelter && (
          <div style={{width:'100%',display:'flex',flexDirection:'column',gap:4,padding:'8px 10px',borderRadius:10,background:'rgba(134,239,172,0.06)',border:'1px solid rgba(134,239,172,0.2)'}}>
            <div style={{fontSize:9,color:'#86efac',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',textAlign:'center',marginBottom:2}}>🌿 ADD TO SHELTER</div>
            {shelters.map((sh,i)=>{
              const sz=GREENHOUSE_SIZES[sh.size];
              const already=(sh.animals||[]).includes(card.id);
              const full=(sh.animals||[]).length>=(sz?sz.slots:4);
              return(
                <button key={i} onClick={()=>!already&&!full&&onAddToShelter(i,card.id,!already)}
                  disabled={already||full}
                  style={{width:'100%',padding:'7px 10px',borderRadius:8,background:already?'rgba(134,239,172,0.15)':'rgba(255,255,255,0.04)',border:'1px solid '+(already?'rgba(134,239,172,0.4)':'rgba(255,255,255,0.1)'),color:already?'#86efac':full?'#52525b':'#a8a29e',cursor:already||full?'default':'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{sz?sz.label:sh.size} SHELTER</span>
                  <span style={{fontSize:9,fontFamily:'"JetBrains Mono",monospace'}}>{already?'✓ ASSIGNED':full?'FULL':'+ ADD'}</span>
                </button>
              );
            })}
          </div>
        )}
        {isMine && onEdit && <button onClick={()=>onEdit(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Palette size={13}/>EDIT THIS CARD</button>}`
);

// ── P4: Pass new props to CardDetailModal in main render ──
P('Pass shelters and vet props to CardDetailModal',
"      {cardDetail && <CardDetailModal card={cardDetail.card} isMine={cardDetail.isMine} onClose={()=>setCardDetail(null)} onSell={cardDetail.isMine?handleSellCard:null} onEdit={cardDetail.isMine?handleEditCardFromModal:null} binders={me?((me.binderData&&me.binderData.binders)||[]):[]} inBinder={me?findCardSlot(me.binderData, cardDetail.card.id):null} onAddToBinder={(bid)=>handleAddCardToBinderFirstSlot(bid, cardDetail.card.id)} onRemoveFromBinder={()=>{ const loc=findCardSlot(me.binderData, cardDetail.card.id); if(loc){ handleRemoveCardFromBinder(loc.binderId, loc.slot); setCardDetail(null); } }} damage={me?getCardState(me, cardDetail.card.id).damage:0} caseType={me?getCardState(me, cardDetail.card.id).caseType:null} onRepair={handleRepairCard} onEncase={handleEncaseCard}/>}",
"      {cardDetail && <CardDetailModal card={cardDetail.card} isMine={cardDetail.isMine} onClose={()=>setCardDetail(null)} onSell={cardDetail.isMine?handleSellCard:null} onEdit={cardDetail.isMine?handleEditCardFromModal:null} binders={me?((me.binderData&&me.binderData.binders)||[]):[]} inBinder={me?findCardSlot(me.binderData, cardDetail.card.id):null} onAddToBinder={(bid)=>handleAddCardToBinderFirstSlot(bid, cardDetail.card.id)} onRemoveFromBinder={()=>{ const loc=findCardSlot(me.binderData, cardDetail.card.id); if(loc){ handleRemoveCardFromBinder(loc.binderId, loc.slot); setCardDetail(null); } }} damage={me?getCardState(me, cardDetail.card.id).damage:0} caseType={me?getCardState(me, cardDetail.card.id).caseType:null} onRepair={handleRepairCard} onEncase={handleEncaseCard} shelters={me?me.shelters:null} onAddToShelter={handleAssignAnimal} vetInventory={me?me.vetInventory:null} cardInjury={me?me.cardInjury:null} onHealCard={handleHealAnimal}/>}"
);

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
