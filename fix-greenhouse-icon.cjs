// fix-greenhouse-icon.cjs — swap Flame for Leaf2 on greenhouse nav buttons
const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node fix-greenhouse-icon.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');
let ok=0,skip=0;
function P(label,find,replace){
  if(src.includes(find)){src=src.split(find).join(replace);console.log('  OK: '+label);ok++;}
  else{console.log(' SKIP: '+label);skip++;}
}

P('Greenhouse dock icon Flame->Leaf',
'<NavButton label="GREENHOUSE" sub="BUILD" Icon={Flame} isActive={screen===\'greenhouse\'} onClick={()=>setScreen(\'greenhouse\')} color="#86efac"/>',
'<NavButton label="GREENHOUSE" sub="BUILD" Icon={Leaf2} isActive={screen===\'greenhouse\'} onClick={()=>setScreen(\'greenhouse\')} color="#86efac"/>'
);

P('Mobile nav greenhouse icon',
"{label:'GREENHOUSE',sub:'BUILD',Icon:Flame,color:'#86efac'",
"{label:'GREENHOUSE',sub:'BUILD',Icon:Leaf2,color:'#86efac'"
);

// Make sure Leaf2 is imported
P('Add Leaf2 to imports',
'Rocket } from \'lucide-react\';',
'Rocket, Leaf2 } from \'lucide-react\';'
);

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('APPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
