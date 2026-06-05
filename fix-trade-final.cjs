const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-final.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  const count = src.split(find).length - 1;
  if(count>0){src=src.split(find).join(replace);console.log('  OK ('+count+'x): '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── Remove auto-switch (added by earlier patch) from FriendTradeModal ──
P('Remove auto-switch from FriendTradeModal toggleYour',
"  const toggleYour = id => { setYourCardIds(p=>{ const next = p.includes(id)?p.filter(x=>x!==id):[...p,id]; if(next.length>0) setTab('theirs'); return next; }); };",
"  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);"
);

// ── Remove auto-switch from TradeTable if present ──
P('Remove auto-switch from TradeTable toggleYour',
"  const toggleYour = id => { setYourCardIds(p=>{ const next = p.includes(id)?p.filter(x=>x!==id):[...p,id]; if(next.length>0) setTab('theirs'); return next; }); };\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);\n\n  const generateAIOffer",
"  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);\n  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);\n\n  const generateAIOffer"
);

// ── Replace FriendTradeModal picker with two always-visible columns ──
P('Replace FriendTradeModal tab picker with two columns',
"      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>\n        <div style={{display:'flex',gap:6,marginBottom:10}}>\n          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({me.ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${friend.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>{friend.displayName.toUpperCase()}'S ROSTER ({friend.ownedCards.length})</button>\n        </div>\n        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{\n            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;\n          })}\n        </div>\n      </div>",
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{fontSize:9,color:'#fb923c',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:'rgba(251,146,60,0.1)',borderRadius:6,textAlign:'center'}}>🦊 YOUR OFFER</div>
          <div style={{fontSize:9,color:friend.color,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:friend.color+'18',borderRadius:6,textAlign:'center'}}>{friend.emoji} WHAT YOU WANT</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {me.ownedCards.map(c=>{
              const sel=yourCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={(e)=>{e.stopPropagation();setYourCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);}}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?'#fb923c':'rgba(255,255,255,0.08)'),background:sel?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?'#fb923c':'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:'#fb923c',flexShrink:0}}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {friend.ownedCards.map(c=>{
              const sel=theirCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={(e)=>{e.stopPropagation();setTheirCardIds(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id]);}}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?friend.color:'rgba(255,255,255,0.08)'),background:sel?friend.color+'22':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?friend.color:'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:friend.color,flexShrink:0}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>`
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
