const fs = require('fs');
const file = 'src/EcoHeroes.jsx';
let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

function SR(old, next, label) {
  if (c.includes(old)) {
    c = c.split(old).join(next);
    console.log('  DONE: ' + label);
  } else {
    console.log('  SKIP: ' + label);
  }
}

// Fix 1: ROSTER -> ANIMALS in the heading
SR(
  `}'S ROSTER</div>`,
  `}'S ANIMALS</div>`,
  'Heading ROSTER -> ANIMALS'
);

// Fix 2: pts free -> eco free in daily claim
SR(
  `\`+\${DAILY_REWARD.toLocaleString()} pts free\``,
  `\`+\${DAILY_REWARD.toLocaleString()} eco free\``,
  'Daily claim pts -> eco'
);

// Also fix the cards subtitle
SR(
  `cards · click any card for highlights`,
  `animals · click any for details`,
  'Subtitle cards -> animals'
);

// Sanity
const ok = c.includes("S ANIMALS") && c.includes("eco free");
if (!ok) {
  console.log('SANITY FAILED: ' + (!c.includes("S ANIMALS") ? 'ANIMALS missing ' : '') + (!c.includes("eco free") ? 'eco free missing' : ''));
  process.exit(1);
}

fs.writeFileSync(file, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('');
console.log('SUCCESS');
