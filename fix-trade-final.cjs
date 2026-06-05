const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-final.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// Replace the entire picker section in FriendTradeModal with two side-by-side lists
P('Replace FriendTradeModal picker with two columns',
"      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>\n        <div style={{display:'flex',gap:6,marginBottom:10}}>\n          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({me.ownedCards.length})</button>\n          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?`${friend.color}33`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'\"Bebas Neue\",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>{friend.displayName.toUpperCase()}'S ROSTER ({friend.ownedCards.length})</button>\n        </div>\n        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>\n          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{\n            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;\n          })}\n        </div>\n      </div>",
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{fontSize:9,color:'#fb923c',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',padding:'4px 8px',background:'rgba(251,146,60,0.1)',borderRadius:6,textAlign:'center'}}>
            🦊 YOUR ANIMALS — tap to offer
          </div>
          <div style={{fontSize:9,color:friend.color,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',padding:'4px 8px',background:friend.color+'18',borderRadius:6,textAlign:'center'}}>
            {friend.emoji} {friend.displayName.toUpperCase()} — tap to request
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:240,overflowY:'auto'}}>
            {me.ownedCards.map(c=>{
              const sel=yourCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>setYourCardIds(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?'#fb923c':'rgba(255,255,255,0.08)'),background:sel?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:sel?'#fb923c':'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s</div>
                  </div>
                  {sel&&<span style={{fontSize:10,color:'#fb923c'}}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:240,overflowY:'auto'}}>
            {friend.ownedCards.map(c=>{
              const sel=theirCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>setTheirCardIds(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?friend.color:'rgba(255,255,255,0.08)'),background:sel?friend.color+'22':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:sel?friend.color:'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s</div>
                  </div>
                  {sel&&<span style={{fontSize:10,color:friend.color}}>✓</span>}
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
