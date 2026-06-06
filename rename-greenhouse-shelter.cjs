const fs = require('fs');
const file = process.argv[2];
if(!file){console.error('Usage: node rename-greenhouse-shelter.cjs <EcoHeroes.jsx>');process.exit(1);}
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');

// Replace all visible text instances
const replacements = [
  ['GREENHOUSE','SHELTER'],
  ['Greenhouse','Shelter'],
  ['greenhouse','shelter'],
];

let total = 0;
for(const [from,to] of replacements){
  const count = src.split(from).length - 1;
  if(count > 0){
    src = src.split(from).join(to);
    console.log('  OK: '+from+' -> '+to+' ('+count+'x)');
    total += count;
  }
}

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nTotal replacements: '+total);
process.exit(0);
