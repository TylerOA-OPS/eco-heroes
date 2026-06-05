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

// Fix TradeSide onRemoveCard calls that reference non-existent toggleTheir/toggleYour in FriendTradeModal
P('Fix FriendTradeModal TradeSide remove handlers',
`        <TradeSide label={\`\${friend.displayName.toUpperCase()} GIVES\`} color={friend.color} cards={theirSel} points={theirPoints} value={Math.floor(theirVal)} onRemoveCard={id=>toggleTheir(id)} onPointsChange={setTheirPoints}/>
        <TradeSide label="YOU GIVE" color="#fb923c" cards={yourSel} points={yourPoints} value={Math.floor(yourVal)} onRemoveCard={id=>toggleYour(id)} onPointsChange={setYourPoints} maxPoints={me.points}/>`,
`        <TradeSide label={\`\${friend.displayName.toUpperCase()} GIVES\`} color={friend.color} cards={theirSel} points={theirPoints} value={Math.floor(theirVal)} onRemoveCard={id=>removeTheir(id)} onPointsChange={setTheirPoints}/>
        <TradeSide label="YOU GIVE" color="#fb923c" cards={yourSel} points={yourPoints} value={Math.floor(yourVal)} onRemoveCard={id=>removeYour(id)} onPointsChange={setYourPoints} maxPoints={me.points}/>`
);

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
