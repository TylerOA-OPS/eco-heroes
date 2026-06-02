const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');

src = src.split('Leaf2').join('Leaf');

if(hasCRLF) src = src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('Done - all Leaf2 replaced with Leaf');
