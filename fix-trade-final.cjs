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

P('Rewrite FriendTradeModal',
`function FriendTradeModal({me,friend,onClose,onSend,onToast}){
  const [yourCardIds,setYourCardIds] = useState([]);
  const [theirCardIds,setTheirCardIds] = useState([]);
  const [yourPoints,setYourPoints] = useState(0);
  const [theirPoints,setTheirPoints] = useState(0);
  const [tab,setTab] = useState('yours');
  const [message,setMessage] = useState('');

  const yourSel = me.ownedCards.filter(c=>yourCardIds.includes(c.id));
  const theirSel = friend.ownedCards.filter(c=>theirCardIds.includes(c.id));
  const yourVal = yourSel.reduce((s,c)=>s+getCardValue(c),0) + yourPoints;
  const theirVal = theirSel.reduce((s,c)=>s+getCardValue(c),0) + theirPoints;
  const fairness = yourVal===0 && theirVal===0 ? 0 : (yourVal-theirVal)/Math.max(theirVal,1);

  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const send = () => {
    if((yourSel.length===0 && yourPoints===0) || (theirSel.length===0 && theirPoints===0)){ onToast('BOTH SIDES NEED SOMETHING','err'); return; }
    if(yourPoints>me.points){ onToast('NOT ENOUGH POINTS','err'); return; }
    onSend({from:me.username, to:friend.username, give:yourSel, receive:theirSel, givePoints:yourPoints, receivePoints:theirPoints, message:message.trim()||null});
  };`,
`function FriendTradeModal({me,friend,onClose,onSend,onToast}){
  const [yourCardIds,setYourCardIds] = useState([]);
  const [theirCardIds,setTheirCardIds] = useState([]);
  const [yourPoints,setYourPoints] = useState(0);
  const [theirPoints,setTheirPoints] = useState(0);
  const [message,setMessage] = useState('');

  const yourSel = me.ownedCards.filter(c=>yourCardIds.includes(c.id));
  const theirSel = friend.ownedCards.filter(c=>theirCardIds.includes(c.id));
  const yourVal = yourSel.reduce((s,c)=>s+getCardValue(c),0) + yourPoints;
  const theirVal = theirSel.reduce((s,c)=>s+getCardValue(c),0) + theirPoints;
  const fairness = yourVal===0 && theirVal===0 ? 0 : (yourVal-theirVal)/Math.max(theirVal,1);

  const send = () => {
    if((yourSel.length===0 && yourPoints===0) || (theirSel.length===0 && theirPoints===0)){ onToast('BOTH SIDES NEED SOMETHING','err'); return; }
    if(yourPoints>me.points){ onToast('NOT ENOUGH POINTS','err'); return; }
    onSend({from:me.username, to:friend.username, give:yourSel, receive:theirSel, givePoints:yourPoints, receivePoints:theirPoints, message:message.trim()||null});
  };`
);

// Now replace the picker section (tabs + card list) with two side-by-side lists
P('Replace tab picker with two-column picker',
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          <button onClick={()=>setTab('yours')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='yours'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>YOUR ROSTER ({me.ownedCards.length})</button>
          <button onClick={()=>setTab('theirs')} style={{padding:'5px 11px',borderRadius:6,border:'none',background:tab==='theirs'?\`\${friend.color}33\`:'rgba(255,255,255,0.04)',color:tab==='theirs'?friend.color:'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>{friend.displayName.toUpperCase()}'S ROSTER ({friend.ownedCards.length})</button>
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
          {(tab==='yours'?me.ownedCards:friend.ownedCards).map(c=>{
            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);
            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;
          })}
        </div>
      </div>`,
`      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <div style={{fontSize:10,color:'#fb923c',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',marginBottom:6,padding:'4px 8px',background:'rgba(251,146,60,0.1)',borderRadius:6,textAlign:'center'}}>
              🦊 YOUR ANIMALS — tap to offer
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:280,overflowY:'auto'}}>
              {me.ownedCards.map(c=>{
                const sel=yourCardIds.includes(c.id);
                return(
                  <button key={c.id} onClick={()=>setYourCardIds(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,border:'1px solid '+(sel?'#fb923c':'rgba(255,255,255,0.08)'),background:sel?'rgba(251,146,60,0.15)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:sel?'#fb923c':'#52525b',flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                      <div style={{fontSize:8,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.rarity} · {c.pps}/s</div>
                    </div>
                    {sel&&<span style={{fontSize:12,color:'#fb923c',flexShrink:0}}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:friend.color,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',marginBottom:6,padding:'4px 8px',background:friend.color+'18',borderRadius:6,textAlign:'center'}}>
              {friend.emoji} {friend.displayName.toUpperCase()}'S ANIMALS — tap to request
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:280,overflowY:'auto'}}>
              {friend.ownedCards.map(c=>{
                const sel=theirCardIds.includes(c.id);
                return(
                  <button key={c.id} onClick={()=>setTheirCardIds(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,border:'1px solid '+(sel?friend.color:'rgba(255,255,255,0.08)'),background:sel?friend.color+'22':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:sel?friend.color:'#52525b',flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                      <div style={{fontSize:8,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.rarity} · {c.pps}/s</div>
                    </div>
                    {sel&&<span style={{fontSize:12,color:friend.color,flexShrink:0}}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>`
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
