const fs = require('fs');
const file = process.argv[2];
let lines = fs.readFileSync(file,'utf8').split('\n');
const hasCRLF = lines[0] && lines[0].endsWith('\r');
if(hasCRLF) lines = lines.map(l=>l.replace(/\r$/,''));

let ok=0;
// Find what the constant is actually called now
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('SHELTER_SIZES') || lines[i].includes('GREENHOUSE_SIZES')){
    if(lines[i].includes('const ') && lines[i].includes('={') ){
      console.log('Found sizes constant at line '+(i+1)+': '+lines[i].trim().substring(0,60));
    }
  }
}

// Replace GREENHOUSE_SIZES with SHELTER_SIZES in the shelter button we just added
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('GREENHOUSE_SIZES[sh.size]') && lines[i].includes('sz=')){
    lines[i] = lines[i].replace(/GREENHOUSE_SIZES/g, 'SHELTER_SIZES');
    console.log('OK: Fixed GREENHOUSE_SIZES ref at line '+(i+1));
    ok++;
  }
}

const out = hasCRLF ? lines.join('\r\n') : lines.join('\n');
fs.writeFileSync(file,out,'utf8');
console.log('APPLIED:'+ok);
process.exit(0);
