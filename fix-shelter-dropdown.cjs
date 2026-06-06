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

P('Fix shelter dropdown text color',
"style={{padding:'3px 8px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(134,239,172,0.3)',color:'#86efac',fontSize:11,...mono,cursor:'pointer'}}",
"style={{padding:'3px 8px',borderRadius:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(134,239,172,0.4)',color:'#fff7ed',fontSize:11,...mono,cursor:'pointer'}}"
);

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
