// eco-shop-bg-patch.cjs
// 1. Replace basketball traders with eco animal traders
// 2. Remove argyle plaid background
// 3. Add waterfall to FloatingNature
// 4. Reset Tyler's packsAvailable in STARTING_USERS

const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node eco-shop-bg-patch.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// ── P1: Replace basketball traders with eco animal traders ──
P('Replace traders with eco traders',
`const TRADERS = [
  {id:'steve',name:'Sneaky Steve',vibe:'LOWBALLER',color:'#f87171',emoji:'🦊',bio:'Always pricing high, offering low. Watch the fine print.',mood:'Eyeing your roster…',
    inventory:[
      {id:'sv1',first:'ROBERT',last:'HORRY',number:5,pps:38,rarity:'uncommon',material:'silver',team:'LAL',tag:'BIG SHOT BOB',priceMod:1.4},
      {id:'sv2',first:'BRUCE',last:'BOWEN',number:12,pps:32,rarity:'uncommon',material:'silver',team:'SAS',tag:'LOCK DOWN',priceMod:1.3},
      {id:'sv3',first:'BRIAN',last:'SCALABRINE',number:24,pps:5,rarity:'common',material:'bronze',team:'BOS',tag:'WHITE MAMBA',priceMod:1.5},
      {id:'sv4',first:'STEVE',last:'NASH',number:13,pps:78,rarity:'rare',material:'gold',team:'PHX',tag:'TWO-TIME MVP',pose:'fadeaway',priceMod:1.4},
    ]},
  {id:'gina',name:'Generous Gina',vibe:'FAIR TRADER',color:'#4ade80',emoji:'🌻',bio:'Trades fair, sometimes throws in bonus packs. Beloved at the shop.',mood:'Got something nice for ya.',
    inventory:[
      {id:'gn1',first:'DIRK',last:'NOWITZKI',number:41,pps:92,rarity:'legend',material:'gold',team:'DAL',tag:'THE TALL BALL',pose:'fadeaway',priceMod:1.0},
      {id:'gn2',first:'TIM',last:'DUNCAN',number:21,pps:96,rarity:'legend',material:'platinum',team:'SAS',tag:'BIG FUNDAMENTAL',pose:'skyhook',priceMod:1.0},
      {id:'gn3',first:'JASON',last:'KIDD',number:5,pps:72,rarity:'rare',material:'gold',team:'DAL',tag:'TRIPLE-DOUBLE KING',pose:'jumpman',priceMod:1.0},
      {id:'gn4',first:'PAU',last:'GASOL',number:16,pps:70,rarity:'rare',material:'silver',team:'LAL',tag:'EL SPANIARD',pose:'skyhook',priceMod:1.0},
    ]},
  {id:'hank',name:'Hardball Hank',vibe:'TOUGH SELL',color:'#fbbf24',emoji:'🦅',bio:'Wants top dollar for top cards. Tough negotiator, legit deals.',mood:'Bring real value, we talk.',
    inventory:[
      {id:'hk1',first:'HAKEEM',last:'OLAJUWON',number:34,pps:94,rarity:'legend',material:'diamond',team:'HOU',tag:'THE DREAM',pose:'fadeaway',priceMod:1.6},
      {id:'hk2',first:'KARL',last:'MALONE',number:32,pps:91,rarity:'legend',material:'gold',team:'UTA',tag:'THE MAILMAN',pose:'dunk',priceMod:1.55},
      {id:'hk3',first:'JULIUS',last:'ERVING',number:6,pps:115,rarity:'mythic',material:'supernova',team:'PHI',tag:'DR. J · 1-OF-1',pose:'jumpman',priceMod:1.8},
    ]},
];`,
`const TRADERS = [
  {id:'mossy',name:'Mossy Mara',vibe:'LOWBALLER',color:'#f87171',emoji:'🦔',bio:'Always overvalues her cards. Drives a hard bargain, watch the fine print.',mood:'Eyeing your roster…',
    inventory:[
      {id:'sv1',first:'SPIKE',last:'PORCUPINE',number:5,pps:38,rarity:'uncommon',material:'silver',team:'FOREST',tag:'QUILL MASTER',priceMod:1.4},
      {id:'sv2',first:'DART',last:'FROG',number:12,pps:32,rarity:'uncommon',material:'silver',team:'RAINFOREST',tag:'POISON DART',priceMod:1.3},
      {id:'sv3',first:'BLINK',last:'MOLE',number:24,pps:5,rarity:'common',material:'bronze',team:'FOREST',tag:'UNDERGROUND PRO',priceMod:1.5},
      {id:'sv4',first:'SWIFT',last:'MEERKAT',number:13,pps:78,rarity:'rare',material:'gold',team:'DESERT',tag:'SENTINEL SCOUT',pose:'fadeaway',priceMod:1.4},
    ]},
  {id:'gina',name:'Gentle Gaia',vibe:'FAIR TRADER',color:'#4ade80',emoji:'🌻',bio:'Trades fair, sometimes throws in bonus packs. Beloved at the eco shop.',mood:'Got something nice for ya.',
    inventory:[
      {id:'gn1',first:'LUNA',last:'WOLF',number:41,pps:92,rarity:'legend',material:'gold',team:'TUNDRA',tag:'MOONLIGHT HOWLER',pose:'fadeaway',priceMod:1.0},
      {id:'gn2',first:'TITAN',last:'TORTOISE',number:21,pps:96,rarity:'legend',material:'platinum',team:'DESERT',tag:'ANCIENT SHELL',pose:'skyhook',priceMod:1.0},
      {id:'gn3',first:'FLASH',last:'CHEETAH',number:5,pps:72,rarity:'rare',material:'gold',team:'SAVANNA',tag:'SPEED LEGEND',pose:'jumpman',priceMod:1.0},
      {id:'gn4',first:'RIPPLE',last:'DOLPHIN',number:16,pps:70,rarity:'rare',material:'silver',team:'OCEAN',tag:'WAVE RIDER',pose:'skyhook',priceMod:1.0},
    ]},
  {id:'hank',name:'Hawk-Eye Hank',vibe:'TOUGH SELL',color:'#fbbf24',emoji:'🦅',bio:'Wants top eco points for top animals. No lowballs accepted.',mood:'Bring real value, we talk.',
    inventory:[
      {id:'hk1',first:'STORM',last:'ORCA',number:34,pps:94,rarity:'legend',material:'diamond',team:'OCEAN',tag:'OCEAN PREDATOR',pose:'fadeaway',priceMod:1.6},
      {id:'hk2',first:'BLAZE',last:'JAGUAR',number:32,pps:91,rarity:'legend',material:'gold',team:'RAINFOREST',tag:'JUNGLE GHOST',pose:'dunk',priceMod:1.55},
      {id:'hk3',first:'AURORA',last:'SWAN',number:6,pps:115,rarity:'mythic',material:'supernova',team:'WETLAND',tag:'GRACE OF FLIGHT · 1-OF-1',pose:'jumpman',priceMod:1.8},
    ]},
];`
);

// ── P2: Remove argyle/plaid diagonal pattern ──
P('Remove argyle plaid background',
"      {/* Diagonal pattern overlay — themed */}\n      <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`repeating-linear-gradient(45deg, transparent 0 60px, rgba(${themeRgb},${patternAlpha}) 60px 61px),repeating-linear-gradient(-45deg, transparent 0 60px, rgba(${themeRgb},${patternAlpha}) 60px 61px)`,zIndex:0}}/>",
"      {/* Pattern overlay removed — clean eco bg */}"
);

// ── P3: Add waterfall to FloatingNature ──
P('Add waterfall to FloatingNature',
`  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,overflow:'hidden'}}>
      {butterflies.map((b,i)=>(
        <div key={i} style={{position:'absolute',top:b.top,left:0,animation:'butterfly-fly '+b.animationDuration+' linear '+b.animationDelay+' infinite',opacity:b.opacity}}>
          <span style={{display:'inline-block',fontSize:18,animation:'butterfly-wing 0.45s ease-in-out infinite alternate'}}>🦋</span>
        </div>
      ))}
      {leaves.map((l,i)=>(
        <div key={'l'+i} style={{position:'absolute',left:l.left,top:l.top,animation:'leaf-drift '+l.animationDuration+' ease-in-out '+l.animationDelay+' infinite',opacity:0.3,fontSize:14}}>
          {l.emoji}
        </div>
      ))}
    </div>
  );`,
`  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,overflow:'hidden'}}>
      {/* Waterfall — right side */}
      <div style={{position:'absolute',top:0,right:'6%',width:18,height:'100%',opacity:0.13}}>
        {[0,1,2,3,4,5,6,7].map(i=>(
          <div key={i} style={{position:'absolute',left:i*2+'px',top:0,width:2,height:'100%',background:'linear-gradient(180deg,transparent 0%,#67e8f9 20%,#22d3ee 50%,#67e8f9 80%,transparent 100%)',animation:'waterfall-stream 1.8s linear '+(i*0.22)+'s infinite',borderRadius:1}}/>
        ))}
      </div>
      {/* Waterfall splash at bottom */}
      <div style={{position:'absolute',bottom:'0',right:'4%',width:60,height:30,background:'radial-gradient(ellipse at center,rgba(103,232,249,0.25) 0%,transparent 70%)',animation:'splash-pulse 1.8s ease-in-out infinite',borderRadius:'50%'}}/>
      {butterflies.map((b,i)=>(
        <div key={i} style={{position:'absolute',top:b.top,left:0,animation:'butterfly-fly '+b.animationDuration+' linear '+b.animationDelay+' infinite',opacity:b.opacity}}>
          <span style={{display:'inline-block',fontSize:18,animation:'butterfly-wing 0.45s ease-in-out infinite alternate'}}>🦋</span>
        </div>
      ))}
      {leaves.map((l,i)=>(
        <div key={'l'+i} style={{position:'absolute',left:l.left,top:l.top,animation:'leaf-drift '+l.animationDuration+' ease-in-out '+l.animationDelay+' infinite',opacity:0.3,fontSize:14}}>
          {l.emoji}
        </div>
      ))}
    </div>
  );`
);

// ── P4: Add waterfall CSS keyframes ──
P('Add waterfall CSS keyframes',
'@keyframes vine-grow { 0%,100%{opacity:0.6;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.08);} }',
`@keyframes vine-grow { 0%,100%{opacity:0.6;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.08);} }
    @keyframes waterfall-stream { 0%{transform:translateY(-100%);opacity:0;} 10%{opacity:1;} 90%{opacity:0.8;} 100%{transform:translateY(100vh);opacity:0;} }
    @keyframes splash-pulse { 0%,100%{transform:scaleX(1) scaleY(1);opacity:0.3;} 50%{transform:scaleX(1.4) scaleY(0.7);opacity:0.6;} }`
);

// ── P5: Reset Tyler's packsAvailable to 1 in STARTING_USERS ──
P('Reset Tyler pack to 1',
"tyler: { username:'tyler', displayName:'Tyler', color:'#fb923c', emoji:'🦊', points:3000, ownedCards:TYLER_ROSTER, packsAvailable:1, dailyClaimed:false",
"tyler: { username:'tyler', displayName:'Tyler', color:'#fb923c', emoji:'🦊', points:3000, ownedCards:TYLER_ROSTER, packsAvailable:1, dailyClaimed:false"
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
