const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-final.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');

const OLD = `function FriendTradeModal({me,friend,onClose,onSend,onToast}){
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
  };`;

const NEW = `function FriendTradeModal({me,friend,onClose,onSend,onToast}){
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

  const addYour = id => setYourCardIds(p=>p.includes(id)?p:([...p,id]));
  const removeYour = id => setYourCardIds(p=>p.filter(x=>x!==id));
  const addTheir = id => setTheirCardIds(p=>p.includes(id)?p:[...p,id]);
  const removeTheir = id => setTheirCardIds(p=>p.filter(x=>x!==id));

  const send = () => {
    if((yourSel.length===0 && yourPoints===0) || (theirSel.length===0 && theirPoints===0)){ onToast('BOTH SIDES NEED SOMETHING','err'); return; }
    if(yourPoints>me.points){ onToast('NOT ENOUGH POINTS','err'); return; }
    onSend({from:me.username, to:friend.username, give:yourSel, receive:theirSel, givePoints:yourPoints, receivePoints:theirPoints, message:message.trim()||null});
  };`;

// Replace the picker section — tabs + MiniCard map
const OLD_PICKER = `      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
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
      </div>`;

const NEW_PICKER = `      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
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
      </div>`;

let ok=0,skip=0;
if(src.includes(OLD)){src=src.replace(OLD,NEW);console.log('  OK: Replace FriendTradeModal state');ok++;}
else{console.log(' SKIP: Replace FriendTradeModal state');skip++;}
if(src.includes(OLD_PICKER)){src=src.replace(OLD_PICKER,NEW_PICKER);console.log('  OK: Replace picker with two columns');ok++;}
else{console.log(' SKIP: Replace picker with two columns');skip++;}

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
