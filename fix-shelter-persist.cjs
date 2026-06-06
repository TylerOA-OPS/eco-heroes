const fs = require('fs');
const file = process.argv[2];
let lines = fs.readFileSync(file,'utf8').split('\n');
const hasCRLF = lines[0] && lines[0].endsWith('\r');
if(hasCRLF) lines = lines.map(l=>l.replace(/\r$/,''));

let ok=0;

// Fix line 3537 — add persistProfile after building shelter
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('updateUser(me.username,u=>({...u,materials:nm,shelters:ng}))') && 
     lines[i+1] && lines[i+1].includes('shelter built!')){
    // Replace with version that also calls persistProfile
    lines[i] = "    updateUser(me.username,u=>{const updated={...u,materials:nm,shelters:ng};persistProfile(updated);return updated;});";
    console.log('OK: Added persistProfile to handleBuildShelter at line '+(i+1));
    ok++;
    break;
  }
}

// Fix line 3526 — add persistProfile after assigning animal
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('updateUser(me.username,function(u){return Object.assign({},u,{shelters:newGhs});})')){
    lines[i] = "    updateUser(me.username,function(u){var updated=Object.assign({},u,{shelters:newGhs});persistProfile(updated);return updated;});";
    console.log('OK: Added persistProfile to handleAssignAnimal at line '+(i+1));
    ok++;
    break;
  }
}

const out = hasCRLF ? lines.join('\r\n') : lines.join('\n');
fs.writeFileSync(file,out,'utf8');
console.log('\nAPPLIED:'+ok);
process.exit(0);
