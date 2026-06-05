const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-trade-final.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  const count = src.split(find).length-1;
  if(count>0){src=src.split(find).join(replace);console.log('  OK ('+count+'x): '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

// Line 1002 — the exact bug in FriendTradeModal
// Replace the entire map that uses tab===
P('Fix FriendTradeModal card map onClick',
"            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;",
"            if(tab==='yours') return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleYour(c.id)}/>;\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleTheir(c.id)}/>;",
);

// Line 925 — same bug in TradeTable
P('Fix TradeTable card map onClick',
"            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>tab==='yours'?toggleYour(c.id):toggleTheir(c.id)}/>;",
"            if(tab==='yours') return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleYour(c.id)}/>;\n            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleTheir(c.id)}/>;",
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
