// fix-trade-ux.cjs — fix trade screen so selecting cards is intuitive
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-ux.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: FriendTradeModal — auto-switch to friend tab after picking your card ──
P('Auto-switch tab in FriendTradeModal',
"  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);",
"  const toggleYour = id => { setYourCardIds(p=>{ const next = p.includes(id)?p.filter(x=>x!==id):[...p,id]; if(next.length>0) setTab('theirs'); return next; }); };\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);"
);

// ── P2: FriendTradeModal — make tab buttons much clearer with step labels ──
P('Clearer tab buttons FriendTradeModal',
"          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({me.ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${friend.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>{friend.displayName.toUpperCase()}'S ROSTER ({friend.ownedCards.length})</button>",
"          <button onClick={()=>setTab('yours')} style={{padding:'6px 12px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid transparent',background:tab==='yours'?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>\n            <span style={{fontSize:14}}>🦊</span> STEP 1: YOUR OFFER ({yourCardIds.length} selected)\n          </button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'6px 12px',borderRadius:8,border:tab==='theirs'?`2px solid ${friend.color}`:'2px solid transparent',background:tab==='theirs'?`${friend.color}22`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>\n            <span style={{fontSize:14}}>{friend.emoji}</span> STEP 2: WHAT YOU WANT ({theirCardIds.length} selected)\n          </button>"
);

// ── P3: TradeTable — make tab buttons clearer too ──
P('Clearer tab buttons TradeTable',
"          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${trader.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?trader.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>THEIR INVENTORY ({trader.inventory.length})</button>",
"          <button onClick={()=>setTab('yours')} style={{padding:'6px 12px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid transparent',background:tab==='yours'?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>\n            🦊 STEP 1: YOUR OFFER ({yourCardIds.length} selected)\n          </button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'6px 12px',borderRadius:8,border:tab==='theirs'?`2px solid ${trader.color}`:'2px solid transparent',background:tab==='theirs'?`${trader.color}22`:'rgba(255,255,255,0.04)',color:tab==='theirs'?trader.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>\n            {trader.emoji} STEP 2: WHAT YOU WANT ({theirCardIds.length} selected)\n          </button>"
);

// ── P4: TradeTable — auto-switch tab after picking your card ──
P('Auto-switch tab in TradeTable',
"  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);",
"  const toggleYour = id => { setYourCardIds(p=>{ const next = p.includes(id)?p.filter(x=>x!==id):[...p,id]; if(next.length>0) setTab('theirs'); return next; }); };\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);"
);

// ── P5: Add a helpful instruction line above the card selector ──
P('Add trade instruction text',
"        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{",
"        <div style={{fontSize:10,color:'#78716c',fontFamily:'\"JetBrains Mono\",monospace',letterSpacing:'0.1em',marginBottom:6,padding:'4px 8px',borderRadius:6,background:'rgba(255,255,255,0.03)'}}>\n          {tab==='yours' ? '👆 TAP YOUR ANIMALS TO OFFER THEM — then switch to STEP 2' : '👆 TAP THEIR ANIMALS THAT YOU WANT TO RECEIVE'}\n        </div>\n        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{"
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
