const fs = require('fs');
const c = fs.readFileSync('src/EcoHeroes.jsx','utf8');
const checks = [
  ["HUNGER_DROP_INTERVAL_MS", c.includes("HUNGER_DROP_INTERVAL_MS")],
  ["HungerBar", c.includes("HungerBar")],
  ["ProfileHeader", c.includes("ProfileHeader")],
  ["S ANIMALS", c.includes("S ANIMALS")],
  ["FOOD_ITEMS", c.includes("FOOD_ITEMS")],
  ["favCardId", c.includes("favCardId")],
  ["DAILY_REWARD = 5000", c.includes("DAILY_REWARD = 5000")],
  ["cardHunger", c.includes("cardHunger")],
  ["eco free", c.includes("eco free")],
  ["FavCardPicker", c.includes("FavCardPicker")],
  ["onEditFavCard", c.includes("onEditFavCard")],
  ["favCardPickerOpen", c.includes("favCardPickerOpen")],
];
checks.forEach(([l,f])=>console.log((f?'YES':'NO ') + ' ' + l));
