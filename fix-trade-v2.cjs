// fix-trade-v2.cjs — complete rewrite of FriendTradeModal card picker section
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-v2.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── Fix FriendTradeModal tab buttons + card click handler ──
P('Fix FriendTradeModal picker section',
"          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({me.ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${friend.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>{friend.displayName.toUpperCase()}'S ROSTER ({friend.ownedCards.length})</button>\n        </div>\n        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{\n            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;\n          })}\n        </div>",
`          <button onClick={()=>setTab('yours')} style={{flex:1,padding:'8px 10px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid rgba(255,255,255,0.08)',background:tab==='yours'?'rgba(251,146,60,0.15)':'rgba(255,255,255,0.03)',color:tab==='yours'?'#fb923c':'#78716c',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',cursor:'pointer'}}>
            🦊 STEP 1 — YOU OFFER ({yourCardIds.length} picked)
          </button>
          <button onClick={()=>setTab('theirs')} style={{flex:1,padding:'8px 10px',borderRadius:8,border:tab==='theirs'?'2px solid '+friend.color:'2px solid rgba(255,255,255,0.08)',background:tab==='theirs'?friend.color+'22':'rgba(255,255,255,0.03)',color:tab==='theirs'?friend.color:'#78716c',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',cursor:'pointer'}}>
            {friend.emoji} STEP 2 — WHAT YOU WANT ({theirCardIds.length} picked)
          </button>
        </div>
        <div style={{fontSize:10,color:tab==='yours'?'#fb923c':friend.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em',marginBottom:6,padding:'4px 8px',borderRadius:6,background:'rgba(255,255,255,0.03)'}}>
          {tab==='yours' ? '👆 Tap YOUR animals to offer — then go to Step 2' : '👆 Tap '+friend.displayName+"'s animals that you want"}
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
          {tab==='yours'
            ? me.ownedCards.map(c=>{
                const sel = yourCardIds.includes(c.id);
                return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>{
                  setYourCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);
                }}/>;
              })
            : friend.ownedCards.map(c=>{
                const sel = theirCardIds.includes(c.id);
                return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>{
                  setTheirCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);
                }}/>;
              })
          }
        </div>`
);

// ── Fix TradeTable tab buttons + card click handler (AI traders) ──
P('Fix TradeTable picker section',
"          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${trader.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?trader.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>THEIR INVENTORY ({trader.inventory.length})</button>\n        </div>\n        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?ownedCards:trader.inventory).map(c=>{\n            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;\n          })}\n        </div>",
`          <button onClick={()=>setTab('yours')} style={{flex:1,padding:'8px 10px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid rgba(255,255,255,0.08)',background:tab==='yours'?'rgba(251,146,60,0.15)':'rgba(255,255,255,0.03)',color:tab==='yours'?'#fb923c':'#78716c',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',cursor:'pointer'}}>
            🦊 STEP 1 — YOU OFFER ({yourCardIds.length} picked)
          </button>
          <button onClick={()=>setTab('theirs')} style={{flex:1,padding:'8px 10px',borderRadius:8,border:tab==='theirs'?'2px solid '+trader.color:'2px solid rgba(255,255,255,0.08)',background:tab==='theirs'?trader.color+'22':'rgba(255,255,255,0.03)',color:tab==='theirs'?trader.color:'#78716c',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',cursor:'pointer'}}>
            {trader.emoji} STEP 2 — WHAT YOU WANT ({theirCardIds.length} picked)
          </button>
        </div>
        <div style={{fontSize:10,color:tab==='yours'?'#fb923c':trader.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em',marginBottom:6,padding:'4px 8px',borderRadius:6,background:'rgba(255,255,255,0.03)'}}>
          {tab==='yours' ? '👆 Tap YOUR animals to offer — then go to Step 2' : '👆 Tap their animals that you want'}
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
          {tab==='yours'
            ? ownedCards.map(c=>{
                const sel = yourCardIds.includes(c.id);
                return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>{
                  setYourCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);
                }}/>;
              })
            : trader.inventory.map(c=>{
                const sel = theirCardIds.includes(c.id);
                return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>{
                  setTheirCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);
                }}/>;
              })
          }
        </div>`
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
