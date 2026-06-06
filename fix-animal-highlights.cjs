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

// ── P1: Replace HIGHLIGHTS with animal facts ──
P('Replace HIGHLIGHTS with animal facts',
"const getHighlights = card => HIGHLIGHTS[`${card.first} ${card.last}`] || null;",
`const ANIMAL_FACTS = {
  'BAMBOO PANDA':['Eats up to 38kg of bamboo per day','Has a false thumb — an enlarged wrist bone','Can swim and climb trees expertly','Cubs are born the size of a stick of butter','Black-and-white pattern helps with temperature control'],
  'DAISY SQUIRREL':['Buries thousands of nuts per season — and forgets most','Can find food buried under a foot of snow','Teeth never stop growing throughout life','Can fall from 30m and land safely','Communicates danger with unique tail flicks'],
  'HAZEL HEDGEHOG':['Has up to 7,000 spines on its body','Rolls into a perfect ball when threatened','Eats beetles, slugs and caterpillars','Hibernates through winter months','Surprisingly fast — can run 2km per hour'],
  'RUSTY FOX':['Remembers the location of thousands of food caches','Can hear a mouse under 3 feet of snow','Runs up to 50 km/h in short bursts','Uses Earth\'s magnetic field to hunt','Has vertical pupils like a cat'],
  'WHISKER OTTER':['Holds hands while sleeping so they don\'t drift apart','Uses rocks as tools to crack open shellfish','Has the densest fur of any mammal — 1M hairs per sq inch','Can hold its breath for 8 minutes','Plays games for fun — a sign of high intelligence'],
  'BUDDY BEAVER':['Builds dams that can flood entire forests','Teeth are orange due to iron-reinforced enamel','Can hold its breath for 15 minutes','Second largest rodent on Earth','Creates its own wetland ecosystem'],
  'PICO PORCUPINE':['Has over 30,000 quills — each barbed like a fishhook','Quills grow back after being lost','Can\'t shoot quills — they detach on contact','Quills contain antibiotics to prevent self-infection','Excellent climbers despite their size'],
  'SWIFT MEERKAT':['Immune to venom — eats scorpions for breakfast','Takes turns acting as sentinel on watch duty','Teaches pups how to handle dangerous prey','Can detect predators from over 300m away','Lives in groups of up to 30 individuals'],
  'LUNA WOLF':['Can howl loud enough to be heard 10km away','Mates for life in most cases','Packs have complex social hierarchies','Runs up to 60 km/h when hunting','Responsible for reshaping entire river ecosystems'],
  'TITAN TORTOISE':['Can live over 150 years','Goes months without food or water','Grows its entire life — never stops','Shell is part of its spine — cannot leave it','One of the few truly ancient creatures still alive'],
  'FLASH CHEETAH':['Fastest land animal — 0 to 112 km/h in 3 seconds','Cannot roar — purrs like a domestic cat','Hunts by sight, not smell','Needs 30 minutes to rest after each chase','Has black tear-mark streaks to reduce sun glare'],
  'RIPPLE DOLPHIN':['Sleeps with one eye open — rests half its brain at a time','Has its own unique whistle — a personal name','Can swim up to 60 km/h','Echolocates with clicks up to 1000 per second','Has been observed teaching fishing techniques to young'],
  'STORM ORCA':['Largest member of the dolphin family','Has distinct dialects between family groups','Females live up to 100 years','Hunts great white sharks for their livers','No recorded wild orca attack on a human'],
  'BLAZE JAGUAR':['Swims for fun — loves water unlike most cats','Bite force strong enough to pierce turtle shells','Black coat is camouflage — spots still visible in light','Kills with a skull-crushing bite rather than neck bite','Sacred animal in many ancient civilizations'],
  'AURORA SWAN':['Mates for life — mourns a lost partner','Can fly up to 95 km/h','Nest size can reach 1.8m wide','Young called cygnets — grey for first year','Has the most feathers of any bird species'],
  'MUFASA LION':['Only social cat — lives in prides','Roar can be heard from 8km away','Sleeps up to 20 hours per day','Has retractable claws — kept sharp for hunting','Males grow distinctive manes by age 3'],
  'TUSK ELEPHANT':['Largest land animal on Earth','Can recognize themselves in a mirror','Mourns its dead — returns to visit bones','Communicates through vibrations felt through feet','Memory is extraordinary — never forgets a face'],
  'ZEUS EAGLE':['Eyesight is 4-8× stronger than a human\'s','Dives at over 160 km/h to catch prey','Mates for life and returns to same nest each year','Nest can weigh over 900kg after years of building','Symbol of power in over 25 national flags'],
  'ECHO WOLF':['Howls to communicate across vast distances','Plays to strengthen pack social bonds','Paws have webbing between toes for swimming','Navigates using an internal magnetic compass','Responsible for restoring balance to Yellowstone'],
  'ATLAS BEAR':['Can smell food from 20km away','Runs up to 55 km/h — faster than a horse','Hibernates up to 7 months a year','Has the strongest bite force of any land predator','Extremely intelligent — uses tools in captivity'],
  'STRIPE BADGER':['Can dig faster than a human can with a shovel','Fearless — will defend itself against lions','Has remarkably tough skin — very hard to bite through','Honey badger is its close relative','Plays dead convincingly to escape predators'],
  'ROCKY RACCOON':['Washes food before eating — even in the wild','Has incredibly dexterous front paws','Can remember solutions to puzzles for 3 years','Has 40 different sounds for communication','Can open locks, jars, and latches'],
  'GAIA GORILLA':['Shares 98.3% of DNA with humans','Makes new sleeping nests every single night','Can learn sign language — over 1,000 signs','Has its own unique fingerprints','Lives in family groups led by a silverback'],
  'CORAL OCTOPUS':['Has three hearts and blue blood','Can squeeze through any opening bigger than its beak','Each arm has its own mini-brain and can act independently','Changes skin texture and color in milliseconds','Highly intelligent — solves puzzles and plays games'],
  'RUBY CARDINAL':['Only female songbirds that sing in North America','Bright red color from pigments in food they eat','Can live up to 15 years in the wild','Raises two or three broods per year','Mate for life — male feeds female during courtship'],
  'MOCHA MOOSE':['Largest member of the deer family','Can dive up to 6m underwater to eat plants','Newborn calves can outrun a human within days','Antlers grow up to 1.8m wide — shed every year','A single moose can eat 20kg of vegetation daily'],
  'PIP CHIPMUNK':['Stores food in cheek pouches — can hold 35+ nuts at once','Hibernates for 5 months with food stored underground','Has a speed of up to 33 km/h despite tiny size','Can carry its body weight in food per trip','Makes at least 3 different alarm call types'],
  'SUNDANCE RHINO':['Skin is 5cm thick — like armor plating','Horn is made of keratin — same as human fingernails','Can run up to 55 km/h despite massive size','Has poor eyesight but excellent hearing and smell','Rolls in mud to protect skin from sunburn and insects'],
};
const getHighlights = card => ANIMAL_FACTS[card.first+' '+card.last] || null;`
);

// ── P2: Fix "No NBA record" fallback text ──
P('Fix no-highlights fallback text',
"'Custom design — no NBA record on file. The legend is yours to write.':'No NBA record on file for this player.'",
"'Custom animal — their legend is still being written.':'No animal facts on file yet for this creature.'"
);

// ── P3: Fix CAREER HIGHLIGHTS label ──
P('Fix CAREER HIGHLIGHTS label',
'<Award size={11}/>CAREER HIGHLIGHTS',
'<Award size={11}/>ECO FACTS'
);

// ── P4: Fix shop card highlights text ──
P('Fix shop highlights text',
"'Pay points, take it home. Click any card for full details & career highlights.'",
"'Pay points, take it home. Click any card for full details & eco facts.'"
);

if(hasCRLF) src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(file,src,'utf8');
console.log('\nAPPLIED:'+ok+' SKIPPED:'+skip);
process.exit(0);
