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

P('Replace FriendTradeModal broken picker',
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          <button onClick={()=>setTab('yours')} style={{padding:'6px 12px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid transparent',background:tab==='yours'?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:14}}>🦊</span> STEP 1: YOUR OFFER ({yourCardIds.length} selected)
          </button>
          <button onClick={()=>setTab('theirs')} style={{padding:'6px 12px',borderRadius:8,border:tab==='theirs'?\`2px solid \${friend.color}\`:'2px solid transparent',background:tab==='theirs'?\`\${friend.color}22\`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:14}}>{friend.emoji}</span> STEP 2: WHAT YOU WANT ({theirCardIds.length} selected)
          </button>
        </div>
        <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em',marginBottom:6,padding:'4px 8px',borderRadius:6,background:'rgba(255,255,255,0.03)'}}>
          {tab==='yours' ? '👆 TAP YOUR ANIMALS TO OFFER THEM — then switch to STEP 2' : '👆 TAP THEIR ANIMALS THAT YOU WANT TO RECEIVE'}
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{
            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);
            if(tab==='yours') return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleYour(c.id)}/>;
            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleTheir(c.id)}/>;
          })}
        </div>
      </div>`,
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{fontSize:9,color:'#fb923c',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:'rgba(251,146,60,0.1)',borderRadius:6,textAlign:'center'}}>🦊 YOUR OFFER ({yourCardIds.length})</div>
          <div style={{fontSize:9,color:friend.color,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:friend.color+'18',borderRadius:6,textAlign:'center'}}>{friend.emoji} WHAT YOU WANT ({theirCardIds.length})</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {me.ownedCards.map(c=>{
              const sel=yourCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>sel?removeYour(c.id):addYour(c.id)}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?'#fb923c':'rgba(255,255,255,0.08)'),background:sel?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?'#fb923c':'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:'#fb923c'}}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {friend.ownedCards.map(c=>{
              const sel=theirCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>sel?removeTheir(c.id):addTheir(c.id)}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?friend.color:'rgba(255,255,255,0.08)'),background:sel?friend.color+'22':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?friend.color:'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:friend.color}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>`
);

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
