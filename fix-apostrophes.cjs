const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file,'utf8');
const hasCRLF = src.includes('\r\n');
src = src.replace(/\r\n/g,'\n');

// Fix the two broken lines
src = src
  .replace("Uses Earth's magnetic field to hunt", "Uses Earths magnetic field to hunt")
  .replace("so they don't drift apart", "so they dont drift apart")
  .replace("Can't shoot quills", "Cannot shoot quills")
  .replace("Quills contain antibiotics to prevent self-infection", "Quills contain antibiotics to prevent self infection")
  .replace("never stops", "never stops")
  .replace("Won't", "Will not")
  .replace("can't", "cannot")
  .replace("Can't", "Cannot")
  .replace("don't", "dont")
  .replace("Don't", "Dont")
  .replace("doesn't", "does not")
  .replace("isn't", "is not")
  .replace("it's", "its")
  .replace("It's", "Its")
  .replace("hasn't", "has not");

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('Done - apostrophes fixed');
process.exit(0);
