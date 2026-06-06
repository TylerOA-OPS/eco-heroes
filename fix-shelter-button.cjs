// Uses line-number based insertion instead of string matching
const fs = require('fs');
const file = process.argv[2];
let lines = fs.readFileSync(file,'utf8').split('\n');
const hasCRLF = lines[0] && lines[0].endsWith('\r');
if(hasCRLF) lines = lines.map(l=>l.replace(/\r$/,''));

// Find the EDIT THIS CARD line
let editLine = -1;
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('EDIT THIS CARD') && lines[i].includes('onEdit(card)') && lines[i].includes('Brush')){
    editLine = i;
    break;
  }
}

if(editLine === -1){ console.log('SKIP: Could not find EDIT THIS CARD line'); process.exit(0); }
console.log('Found EDIT THIS CARD at line '+(editLine+1));

// Check if shelter button already exists nearby
const nearbyText = lines.slice(Math.max(0,editLine-15),editLine).join('\n');
if(nearbyText.includes('ADD TO SHELTER')){
  console.log('SKIP: Shelter button already exists');
  process.exit(0);
}

// Insert shelter button block before the EDIT THIS CARD line
const shelterBlock = [
`        {isMine && shelters && shelters.length>0 && (`,
`          <div style={{width:'100%',display:'flex',flexDirection:'column',gap:4,padding:'8px 10px',borderRadius:10,background:'rgba(134,239,172,0.06)',border:'1px solid rgba(134,239,172,0.2)'}}>`,
`            <div style={{fontSize:9,color:'#86efac',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',textAlign:'center',marginBottom:2}}>🌿 ADD TO SHELTER</div>`,
`            {shelters.map((sh,i)=>{`,
`              const sz=GREENHOUSE_SIZES[sh.size];`,
`              const already=(sh.animals||[]).includes(card.id);`,
`              const full=(sh.animals||[]).length>=(sz?sz.slots:4);`,
`              return(`,
`                <button key={i} onClick={()=>!already&&!full&&onAddToShelter&&onAddToShelter(i,card.id,true)}`,
`                  style={{width:'100%',padding:'7px 10px',borderRadius:8,background:already?'rgba(134,239,172,0.15)':'rgba(255,255,255,0.04)',border:'1px solid '+(already?'rgba(134,239,172,0.4)':'rgba(255,255,255,0.1)'),color:already?'#86efac':full?'#52525b':'#a8a29e',cursor:already||full?'default':'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em',display:'flex',justifyContent:'space-between',alignItems:'center'}}>`,
`                  <span>{sz?sz.label:sh.size} SHELTER</span>`,
`                  <span style={{fontSize:9,fontFamily:'"JetBrains Mono",monospace'}}>{already?'✓ ASSIGNED':full?'FULL':'+ ADD'}</span>`,
`                </button>`,
`              );`,
`            })}`,
`          </div>`,
`        )}`,
];

lines.splice(editLine, 0, ...shelterBlock);
console.log('OK: Inserted shelter button at line '+(editLine+1));

// Also fix persistence — find handleAssignAnimal and add persistProfile call
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('updateUser(me.username,function(u){return Object.assign({},u,{shelters:newGhs')){
    if(!lines[i].includes('persistProfile')){
      lines[i] = lines[i].replace(
        'updateUser(me.username,function(u){return Object.assign({},u,{shelters:newGhs});});',
        'updateUser(me.username,function(u){return Object.assign({},u,{shelters:newGhs});});'
      );
      console.log('OK: shelter persistence already correct at line '+(i+1));
    }
    break;
  }
}

const out = hasCRLF ? lines.join('\r\n') : lines.join('\n');
fs.writeFileSync(file, out, 'utf8');
console.log('\nDone!');
process.exit(0);
