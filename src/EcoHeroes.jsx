import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { supabase, signOut as supabaseSignOut } from './lib/supabase.js';
import { loadAllData, subscribeToTrades } from './lib/dataStore.js';
import { persistProfile, persistRoster, persistBinderData, sendTrade as sendTradeToSupabase, updateTradeStatus, applyTradeAccept, loadTradesOnly } from './lib/persist.js';
import {
  ArrowLeftRight, Palette, Library, Sparkles, TrendingUp, Flame, Filter, Gift,
  Package, Mail, X, Check, Home, Store, ShoppingCart, ArrowRight, Shuffle,
  ChevronLeft, ChevronRight, Lock, Coins, RefreshCcw, User as UserIcon, LogOut,
  Trophy, Award, Crown, Zap, Send, Users, Inbox, Gem, Star,
  Music, Disc3, Pause, Play, SkipForward, SkipBack, Volume2, VolumeX,
  Pencil, Eraser, Square, Circle as CircleIcon, Minus, PaintBucket,
  Copy, Clipboard, RotateCcw, Brush, Edit3, Gamepad2, Search, ArrowUpDown,
  Grid3x3,
 Rocket, Leaf } from 'lucide-react';

/* CONSTANTS */
const RARITIES = {
  common:    { label:'COMMON',    color:'#9ca3af', glow:'rgba(156,163,175,0.35)', tier:1, price:500,    pps:[4,12]    },
  uncommon:  { label:'UNCOMMON',  color:'#22c55e', glow:'rgba(34,197,94,0.4)',    tier:2, price:2500,   pps:[15,35]   },
  rare:      { label:'RARE',      color:'#3b82f6', glow:'rgba(59,130,246,0.5)',   tier:3, price:15000,  pps:[55,80]   },
  oldschool: { label:'OLD SCHOOL',color:'#b45309', glow:'rgba(180,83,9,0.5)',     tier:4, price:30000,  pps:[70,92]   },
  legend:    { label:'LEGEND',    color:'#a855f7', glow:'rgba(168,85,247,0.55)',  tier:5, price:75000,  pps:[85,105]  },
  mythic:    { label:'MYTHIC',    color:'#ef4444', glow:'rgba(239,68,68,0.65)',   tier:6, price:250000, pps:[100,130] },
};
const MATERIALS = {
  bronze:        { label:'BRONZE',        color:'#cd7f32', glow:'rgba(205,127,50,0.45)',  mult:1.0,  weight:55,  gem:'●' },
  silver:        { label:'SILVER',        color:'#d4d4d8', glow:'rgba(212,212,216,0.5)',  mult:1.5,  weight:25,  gem:'◆' },
  gold:          { label:'GOLD',          color:'#fbbf24', glow:'rgba(251,191,36,0.6)',   mult:2.5,  weight:12,  gem:'★' },
  platinum:      { label:'PLATINUM',      color:'#e0f2fe', glow:'rgba(186,230,253,0.7)',  mult:5,    weight:5,   gem:'✦' },
  diamond:       { label:'DIAMOND',       color:'#67e8f9', glow:'rgba(103,232,249,0.75)', mult:10,   weight:2.5, gem:'◈' },
  spark:         { label:'SPARK',         color:'#fde047', glow:'rgba(253,224,71,0.7)',   mult:13,   weight:0,   gem:'✧' },
  flame:         { label:'FLAME',         color:'#f97316', glow:'rgba(249,115,22,0.85)',  mult:17,   weight:0,   gem:'▲' },
  fireball:      { label:'FIREBALL',      color:'#dc2626', glow:'rgba(220,38,38,0.9)',    mult:21,   weight:0,   gem:'◉' },
  supernova:     { label:'SUPERNOVA',     color:'#ec4899', glow:'rgba(236,72,153,0.85)',  mult:25,   weight:0.5, gem:'✷' },
  crescent_moon: { label:'CRESCENT MOON', color:'#c4b5fd', glow:'rgba(196,181,253,0.75)', mult:35,   weight:0,   gem:'☾' },
  half_moon:     { label:'HALF MOON',     color:'#a78bfa', glow:'rgba(167,139,250,0.85)', mult:55,   weight:0,   gem:'◐' },
  full_moon:     { label:'FULL MOON',     color:'#fef08a', glow:'rgba(254,240,138,0.95)', mult:90,   weight:0,   gem:'◯' },
};
const HABITATS = [
  {abbr:'RAINFOREST',name:'RAINFOREST',primary:'#1e7a3f',accent:'#daa520',hue:140},
  {abbr:'SAVANNA',   name:'SAVANNA',   primary:'#c9905a',accent:'#8b4513',hue:30},
  {abbr:'ARCTIC',    name:'ARCTIC',    primary:'#5fb3e8',accent:'#ffffff',hue:200},
  {abbr:'OCEAN',     name:'OCEAN',     primary:'#1e3a8a',accent:'#22d3ee',hue:215},
  {abbr:'DESERT',    name:'DESERT',    primary:'#daa520',accent:'#8b4513',hue:40},
  {abbr:'FOREST',    name:'FOREST',    primary:'#2d6a4f',accent:'#fb923c',hue:150},
  {abbr:'TUNDRA',    name:'TUNDRA',    primary:'#8eaeb8',accent:'#0a3a4f',hue:200},
  {abbr:'WETLAND',   name:'WETLAND',   primary:'#5a7a4f',accent:'#f472b6',hue:120},
];
const TEAM_LOOKUP = HABITATS.reduce((m,t)=>({...m,[t.abbr]:t}),{});
const POSITIONS = ['PG','SG','SF','PF','C'];
const PACK_TYPES = {
  daily:    { id:'daily',    label:'DAILY PACK',     subtitle:'3 cards · low rare odds',          price:0,      free:true, accent:'#fb923c', rarityWeights:{common:55,uncommon:25,rare:12,oldschool:5,legend:2.5,mythic:0.5}, materialWeights:{bronze:60,silver:25,gold:10,platinum:3.5,diamond:1.3,supernova:0.2} },
  premium:  { id:'premium',  label:'PREMIUM PACK',   subtitle:'3 cards · boosted rare odds',      price:25000,  accent:'#fbbf24', rarityWeights:{common:30,uncommon:30,rare:22,oldschool:10,legend:6,mythic:2}, materialWeights:{bronze:35,silver:35,gold:18,platinum:8,diamond:3,supernova:1} },
  diamond:  { id:'diamond',  label:'DIAMOND PACK',   subtitle:'3 cards · platinum+ guaranteed × 1', price:120000, accent:'#67e8f9', guaranteedMaterial:'platinum', rarityWeights:{common:15,uncommon:20,rare:28,oldschool:18,legend:14,mythic:5}, materialWeights:{bronze:15,silver:25,gold:30,platinum:18,diamond:9,supernova:3} },
  supernova:{ id:'supernova',label:'SUPERNOVA PACK', subtitle:'diamond guaranteed · 30% supernova chance', price:500000, accent:'#ec4899', guaranteedMaterial:'diamond', supernovaHitChance:0.30, rarityWeights:{common:5,uncommon:10,rare:20,oldschool:20,legend:30,mythic:15}, materialWeights:{bronze:5,silver:15,gold:25,platinum:25,diamond:20,supernova:10} },
  fireball: { id:'fireball', label:'FIREBALL PACK', subtitle:'3 asteroid cards', price:8000, accent:'#f97316', rarityWeights:{rare:50,legend:35,mythic:15}, materialWeights:{bronze:5,silver:15,gold:25,platinum:10,diamond:5,supernova:2,spark:25,flame:10,fireball:3} },
  rocky:    { id:'rocky',    label:'ROCKY PACK',    subtitle:'3 asteroid cards', price:15000, accent:'#a16207', rarityWeights:{rare:40,legend:40,mythic:20}, materialWeights:{silver:10,gold:20,platinum:15,diamond:8,supernova:3,spark:20,flame:18,fireball:6} },
  smash:    { id:'smash',    label:'SMASH PACK',    subtitle:'5 asteroid cards', price:30000, accent:'#dc2626', rarityWeights:{rare:30,legend:45,mythic:25}, materialWeights:{gold:10,platinum:18,diamond:15,supernova:7,spark:15,flame:20,fireball:15} },
  meteroid: { id:'meteroid', label:'METEROID PACK', subtitle:'2 moon cards',     price:12000, accent:'#c4b5fd', rarityWeights:{legend:60,mythic:40}, materialWeights:{silver:10,gold:20,platinum:15,diamond:10,supernova:5,crescent_moon:25,half_moon:12,full_moon:3} },
  moon:     { id:'moon',     label:'MOON PACK',     subtitle:'5 moon cards',     price:50000, accent:'#a78bfa', rarityWeights:{legend:40,mythic:60}, materialWeights:{platinum:5,diamond:15,supernova:15,crescent_moon:25,half_moon:25,full_moon:15} },
  asteroid_alien: { id:'asteroid_alien', label:'ZYLGOR ROULETTE', subtitle:'1 random asteroid card', price:10000, accent:'#f97316', rarityWeights:{rare:50,legend:40,mythic:10}, materialWeights:{gold:10,platinum:15,diamond:15,supernova:5,spark:25,flame:20,fireball:10} },
  moon_alien:     { id:'moon_alien',     label:'SELENE ROULETTE', subtitle:'1 random moon card',     price:25000, accent:'#c4b5fd', rarityWeights:{legend:55,mythic:45}, materialWeights:{platinum:10,diamond:15,supernova:10,crescent_moon:25,half_moon:25,full_moon:15} },
};
const DAILY_REWARD = 5000;

// Hunger system â€” drops 1% every 5 real minutes (300000ms)
const HUNGER_DROP_INTERVAL_MS = 300000;
const HUNGER_DROP_AMOUNT = 1;

// Animal size tiers â€” determines food effectiveness
const ANIMAL_SIZE = {
  tiny:   ['CHIPMUNK','SQUIRREL','HEDGEHOG','RACCOON','CARDINAL','SKUNK','PORCUPINE'],
  small:  ['OTTER','BEAVER','BADGER','FOX','RABBIT'],
  medium: ['WOLF','PANDA','TIGER','LEOPARD','MOOSE'],
  large:  ['LION','ELEPHANT','BEAR','GORILLA','RHINO'],
  giant:  ['WHALE','ORCA','EAGLE','PENGUIN','CAMEL','OWL'],
};
function getAnimalSize(card) {
  const name = (card.last || '').toUpperCase();
  for (const [tier, animals] of Object.entries(ANIMAL_SIZE)) {
    if (animals.some(a => name.includes(a))) return tier;
  }
  return 'medium';
}

// Food items â€” fullness% is base for medium animal, scaled by size
const FOOD_ITEMS = [
  { id:'seeds',       label:'SEEDS',        emoji:'ðŸŒ±', basePct:25,  sizeScale:true,  price:50,   desc:'Plants & seeds â€” great for small animals' },
  { id:'berries',     label:'BERRIES',      emoji:'ðŸ«', basePct:15,  sizeScale:false, price:80,   desc:'15% fullness for any animal' },
  { id:'white_bread', label:'WHITE BREAD',  emoji:'ðŸž', basePct:45,  sizeScale:false, price:120,  desc:'45% fullness for any animal' },
  { id:'small_fish',  label:'SMALL FISH',   emoji:'ðŸŸ', basePct:30,  sizeScale:false, price:200,  desc:'30% fullness â€” best for small/medium' },
  { id:'large_fish',  label:'LARGE FISH',   emoji:'ðŸ ', basePct:65,  sizeScale:false, price:400,  desc:'65% fullness â€” feeds large animals well' },
  { id:'chicken',     label:'CHICKEN',      emoji:'ðŸ—', basePct:60,  sizeScale:false, price:350,  desc:'60% fullness â€” medium meat' },
  { id:'steak',       label:'STEAK',        emoji:'ðŸ¥©', basePct:85,  sizeScale:false, price:600,  desc:'85% fullness â€” premium meat' },
];

// Size multipliers for sizeScale foods (seeds/plants)
const SIZE_FOOD_MULT = { tiny:2.0, small:1.5, medium:1.0, large:0.3, giant:0.1 };

function getFoodPct(foodId, card) {
  const food = FOOD_ITEMS.find(f => f.id === foodId);
  if (!food) return 0;
  if (!food.sizeScale) return food.basePct;
  const mult = SIZE_FOOD_MULT[getAnimalSize(card)] || 1.0;
  return Math.min(100, Math.round(food.basePct * mult));
}

// Shelter build materials
const SHELTER_SIZES = {
  xs:{label:'EXTRA SMALL',wood:6,  stone:4, glass:3, brick:3, slots:4, eco:2, desc:'Fits 4 animals'},
  s: {label:'SMALL',      wood:12, stone:8, glass:6, brick:6, slots:8, eco:5, desc:'Fits 8 animals'},
  m: {label:'MEDIUM',     wood:22, stone:14,glass:10,brick:10,slots:16,eco:12,desc:'Fits 16 animals'},
  l: {label:'LARGE',      wood:38, stone:22,glass:18,brick:18,slots:28,eco:22,desc:'Fits 28 animals'},
  xl:{label:'EXTRA LARGE',wood:60, stone:35,glass:28,brick:28,slots:48,eco:40,desc:'Fits 48 animals'},
};
const TRAVEL_DURATION_MS = 60000;
const TRAVEL_MATERIALS = ['wood','stone','glass','brick'];
const INJURY_STATES = {minor:'MINOR INJURY',injured:'INJURED',major:'MAJOR INJURY'};
const VET_PACK_ITEMS = [
  {id:'vet_minor',label:'MINOR VET PACK',emoji:'🩹',heals:'minor',price:200,desc:'Heals minor injuries'},
  {id:'vet_mid',  label:'VET PACK',       emoji:'💊',heals:'injured',price:500,desc:'Heals injuries'},
  {id:'vet_major',label:'MAJOR VET PACK', emoji:'🏥',heals:'major',price:1200,desc:'Heals major injuries'},
];

// Pack sizes: 3-card is base price, 5-card is 1.25x, 10-card is 1.75x
// (per-card cost gets cheaper at larger sizes — bulk discount).
const PACK_SIZES = {
  3:  { count:3,  multiplier:1.00, label:'3 CARDS',  short:'3'  },
  5:  { count:5,  multiplier:1.25, label:'5 CARDS',  short:'5'  },
  10: { count:10, multiplier:1.75, label:'10 CARDS', short:'10' },
};

const HIGHLIGHTS = {
  'LEBRON JAMES':['4× NBA Champion (2012, 2013, 2016, 2020)','4× League MVP · 4× Finals MVP','21× NBA All-Star (most ever)','All-Time Scoring Leader (40,000+ pts)','Drafted #1 overall · 2003'],
  'MICHAEL JORDAN':['6× NBA Champion (1991-93, 1996-98)','6× Finals MVP · 5× League MVP','14× NBA All-Star','10× Scoring Champion','Defensive Player of the Year · 1988'],
  'KOBE BRYANT':['5× NBA Champion (2000-02, 2009-10)','2× Finals MVP · 1× League MVP','18× NBA All-Star','81-point game vs Toronto · Jan 22, 2006','Numbers 8 and 24 retired by Lakers'],
  'KAREEM ABDUL-JABBAR':['6× NBA Champion · 2× Finals MVP','6× League MVP (most all-time)','19× NBA All-Star','Held NBA scoring record for 39 years','Inventor & master of the skyhook'],
  'VINCE CARTER':['8× NBA All-Star','2000 Slam Dunk Contest Champion','22 NBA seasons (most ever)','"Le Dunk de la Mort" · Sydney 2000','Rookie of the Year · 1999'],
  'MAGIC JOHNSON':['5× NBA Champion (1980, 82, 85, 87, 88)','3× Finals MVP · 3× League MVP','12× NBA All-Star','Started at center as rookie · won Finals MVP','All-time assists leader at retirement'],
  'MUGGSY BOGUES':['Shortest player in NBA history · 5\'3"','14 NBA seasons (1987-2001)','Hornets all-time assists leader','Career: 6,858 assists · 1,369 steals','1987 NBA Draft · #12 overall'],
  'MANUTE BOL':['Tallest player in NBA history (tied) · 7\'7"','Only player with more career blocks than points','2,086 career blocks','15 blocks in a single half · 1986','Humanitarian · Sudanese refugee advocate'],
  'LARRY BIRD':['3× NBA Champion (1981, 1984, 1986)','3× League MVP (1984, 1985, 1986)','12× NBA All-Star','Rookie of the Year · 1980','2× Finals MVP'],
  'BILL RUSSELL':['11× NBA Champion (most rings ever)','5× League MVP','12× NBA All-Star','NBA Finals MVP trophy named after him','Defensive icon · changed how the game is played'],
  'HAKEEM OLAJUWON':['2× NBA Champion (1994, 1995)','1994 League MVP · 2× Finals MVP','12× NBA All-Star','NBA all-time blocks leader · 3,830','Master of "The Dream Shake"'],
  'KARL MALONE':['2× League MVP (1997, 1999)','14× NBA All-Star','2nd all-time scorer at retirement','"The Mailman" · always delivered','11× All-NBA First Team'],
  'DIRK NOWITZKI':['NBA Champion · 2011 Finals MVP','League MVP · 2007','14× NBA All-Star','21 seasons with one franchise (Mavericks)','Pioneer of the 7-foot stretch shooter'],
  'TIM DUNCAN':['5× NBA Champion (1999, 2003, 05, 07, 14)','2× League MVP · 3× Finals MVP','15× NBA All-Star','Rookie of the Year · 1998','Spurs jersey #21 retired'],
  'JASON KIDD':['NBA Champion · 2011 (Mavericks)','10× NBA All-Star','2× Olympic Gold Medalist','107 career triple-doubles','Co-Rookie of the Year · 1995'],
  'PAU GASOL':['2× NBA Champion (2009, 2010)','6× NBA All-Star','Rookie of the Year · 2002','Spanish basketball icon · 4× Olympic medalist','Retired Lakers jersey #16'],
  'STEVE NASH':['2× League MVP (2005, 2006)','8× NBA All-Star','5× Assists leader','50-40-90 club · 4 times','Suns offensive revolution architect'],
  'ROBERT HORRY':['7× NBA Champion ("Big Shot Bob")','Game-winning 3s in 4 different finals','2002 buzzer-beater vs Kings','Played for 3 different championship teams','16 NBA seasons of clutch shotmaking'],
  'BRUCE BOWEN':['3× NBA Champion (2003, 2005, 2007)','8× NBA All-Defensive Team','Spurs jersey #12 retired','Premier 3-and-D wing of his era','82 games × 8 straight seasons'],
  'BRIAN SCALABRINE':['NBA Champion · 2008 (Boston Celtics)','"The White Mamba" cult phenomenon','11 NBA seasons','Beloved bench presence · championship glue','Became fan-favorite broadcaster'],
  'JULIUS ERVING':['3× ABA Champion · 1× NBA Champion (1983)','3× League MVP (combined ABA/NBA)','11× NBA All-Star · 5× ABA All-Star','Pioneered above-the-rim play','1976 ABA Slam Dunk Contest icon'],
  'SHAWN KEMP':['6× NBA All-Star','6× All-NBA selection','"The Reign Man" · Sonics legend','1994 Slam Dunk Contest finalist','Drafted at 19 directly from high school'],
  'PENNY HARDAWAY':['4× NBA All-Star','2× All-NBA First Team','#1 pick · Lil Penny ad icon','Magic franchise legend before injuries','Now head coach at Memphis'],
  'DOMINIQUE WILKINS':['9× NBA All-Star','"The Human Highlight Film"','2× NBA Slam Dunk Contest Champion','1985-86 NBA Scoring Champion','Hawks jersey #21 retired'],
  'KURT RAMBIS':['4× NBA Champion with Lakers (1982, 85, 87, 88)','Iconic black-rim glasses & blue-collar grit','14 NBA seasons · Showtime Lakers role player','Later Lakers head coach & assistant','Drafted #58 overall · Knicks 1980'],
  'JEROME WILLIAMS':['"The Junkyard Dog" · pure hustle nickname','9 NBA seasons · Pistons, Raptors, Bulls, Knicks','Beloved Toronto fan favorite','Defensive energy player · all 100% effort','Drafted #26 overall · Pistons 1996'],
  'ANDERSON VAREJAO':['NBA Champion · 2015 Warriors','12 seasons with Cleveland Cavaliers','"Wild Thing" · Brazilian fan favorite','Career: 7,800+ rebounds','Brazilian basketball icon · Olympics 2008'],
  'ERIC SNOW':['NBA Finals appearance · 2001 Sixers','13 NBA seasons · defensive PG','Career: 4,925 assists · 1,068 steals','Drafted #43 overall · Bucks 1995','Cleveland Cavaliers veteran leader'],
  'JOHN STARKS':['NBA All-Star · 1994','NBA Sixth Man of the Year · 1997','NBA Finals appearance · 1994 Knicks','Famous left-handed dunk · 1993 ECF Game 2','Undrafted out of Oklahoma State'],
  'HORACE GRANT':['4× NBA Champion (3 with Bulls, 1 with Lakers)','NBA All-Star · 1994','Signature sports goggles look','17 NBA seasons','Drafted #10 overall · Bulls 1987'],
  'ANTHONY MASON':['NBA Sixth Man of the Year · 1995','NBA All-Star · 2001','Knicks fan favorite · "Mase"','Famous undrafted hustle career','Inventive haircuts & passing big man'],
  'BEN WALLACE':['NBA Champion · 2004 Pistons','4× Defensive Player of the Year (most ever)','4× NBA All-Star','Undrafted to Hall of Fame','Pistons jersey #3 retired'],
  'MANU GINOBILI':['4× NBA Champion (2003, 05, 07, 14)','2× NBA All-Star','NBA Sixth Man of the Year · 2008','Olympic Gold Medal · Argentina 2004','Pioneered the Euro Step in the NBA'],
  'ALLEN IVERSON':['NBA MVP · 2001','11× NBA All-Star · 2× All-Star MVP','4× NBA scoring champion','Rookie of the Year · 1997','Sixers jersey #3 retired · "The Answer"'],
  'TRACY MCGRADY':['7× NBA All-Star','2× NBA scoring champion (2003, 2004)','13 points in 35 seconds vs Spurs · 2004','NBA Most Improved Player · 2001','Drafted #9 overall · Raptors 1997'],
  'CHARLES BARKLEY':['NBA MVP · 1993','11× NBA All-Star','1996 Olympic Dream Team gold','11× All-NBA selection','"Sir Charles" · 1996 Top 50 player'],
  'JOHN STOCKTON':['NBA all-time assists leader (15,806)','NBA all-time steals leader (3,265)','10× NBA All-Star','19 seasons with Utah Jazz','2× Olympic Gold Medalist'],
  'WILT CHAMBERLAIN':['100-point game · March 2, 1962','4× NBA MVP · 13× All-Star','2× NBA Champion (1967, 1972)','50.4 points per game season · 1961-62','Averaged 22.9 rebounds per game career'],
};
const getHighlights = card => HIGHLIGHTS[`${card.first} ${card.last}`] || null;

const TYLER_ROSTER = [
  {id:'ty_c1',first:'MUFASA',last:'LION',number:24,pps:100,rarity:'legend',material:'gold',team:'SAVANNA',tag:'KING OF PRIDE',pose:'dunk'},
  {id:'ty_c2',first:'TUSK',last:'ELEPHANT',number:50,pps:108,rarity:'legend',material:'diamond',team:'SAVANNA',tag:'GRAY MOUNTAIN',pose:'skyhook'},
  {id:'ty_c3',first:'ZEUS',last:'EAGLE',number:1,pps:97,rarity:'legend',material:'gold',team:'FOREST',tag:'SKY MONARCH',pose:'jumpman'},
  {id:'ty_c4',first:'ECHO',last:'WOLF',number:11,pps:89,rarity:'rare',material:'silver',team:'FOREST',tag:'PACK CALLER',pose:'jumpman'},
  {id:'ty_c5',first:'RUSTY',last:'FOX',number:9,pps:72,rarity:'rare',material:'gold',team:'FOREST',tag:'CLEVER TRICKSTER',pose:'fadeaway'},
  {id:'ty_c6',first:'ATLAS',last:'BEAR',number:33,pps:85,rarity:'legend',material:'silver',team:'FOREST',tag:'FOREST GIANT',pose:'dunk'},
  {id:'ty_c7',first:'STRIPE',last:'BADGER',number:14,pps:58,rarity:'rare',material:'bronze',team:'FOREST',tag:'FIERCE DIGGER',pose:'fadeaway'},
  {id:'ty_c8',first:'ROCKY',last:'RACCOON',number:7,pps:18,rarity:'common',material:'silver',team:'FOREST',tag:'NIGHT BANDIT'},
  {id:'ty_c9',first:'WHISKER',last:'OTTER',number:5,pps:42,rarity:'uncommon',material:'gold',team:'WETLAND',tag:'BELLY SURFER'},
  {id:'ty_c10',first:'PIP',last:'CHIPMUNK',number:1,pps:6,rarity:'common',material:'bronze',team:'FOREST',tag:'CHEEK STUFFER'},
];
const CARTER_ROSTER = [
  {id:'cr_c1',first:'LEVIATHAN',last:'WHALE',number:100,pps:118,rarity:'mythic',material:'diamond',team:'OCEAN',tag:'OCEAN TITAN',pose:'skyhook'},
  {id:'cr_c2',first:'GAIA',last:'GORILLA',number:8,pps:90,rarity:'legend',material:'gold',team:'RAINFOREST',tag:'JUNGLE GUARDIAN',pose:'jumpman'},
  {id:'cr_c3',first:'SPIRIT',last:'WOLF',number:6,pps:95,rarity:'legend',material:'gold',team:'TUNDRA',tag:'WHITE GHOST',pose:'jumpman'},
  {id:'cr_c4',first:'COSMOS',last:'OWL',number:6,pps:122,rarity:'mythic',material:'platinum',team:'FOREST',tag:'NIGHT ORACLE',pose:'fadeaway'},
  {id:'cr_c5',first:'BUDDY',last:'BEAVER',number:8,pps:28,rarity:'uncommon',material:'bronze',team:'WETLAND',tag:'DAM BUILDER'},
];
const PACK_POOL = [
  // COMMON - small/common creatures
  {first:'ROCKY',last:'RACCOON',number:7,rarity:'common',team:'FOREST',tag:'NIGHT BANDIT'},
  {first:'DAISY',last:'SQUIRREL',number:2,rarity:'common',team:'FOREST',tag:'NUT GATHERER'},
  {first:'PIP',last:'CHIPMUNK',number:1,rarity:'common',team:'FOREST',tag:'CHEEK STUFFER'},
  {first:'HAZEL',last:'HEDGEHOG',number:4,rarity:'common',team:'FOREST',tag:'PRICKLY BALL'},
  {first:'BUDDY',last:'BEAVER',number:8,rarity:'common',team:'WETLAND',tag:'DAM BUILDER'},
  // UNCOMMON - quirky/cool
  {first:'WHISKER',last:'OTTER',number:5,rarity:'uncommon',team:'WETLAND',tag:'BELLY SURFER'},
  {first:'RUBY',last:'CARDINAL',number:3,rarity:'uncommon',team:'FOREST',tag:'CRIMSON FLASH'},
  {first:'SAGE',last:'SKUNK',number:6,rarity:'uncommon',team:'FOREST',tag:'STINK MASTER'},
  {first:'PICO',last:'PORCUPINE',number:9,rarity:'uncommon',team:'FOREST',tag:'NEEDLE GUARD'},
  // RARE - mid-tier
  {first:'MOCHA',last:'MOOSE',number:12,rarity:'rare',team:'TUNDRA',tag:'ANTLER GIANT',pose:'skyhook'},
  {first:'ECHO',last:'WOLF',number:11,rarity:'rare',team:'FOREST',tag:'PACK CALLER',pose:'jumpman'},
  {first:'STRIPE',last:'BADGER',number:14,rarity:'rare',team:'FOREST',tag:'FIERCE DIGGER',pose:'fadeaway'},
  {first:'CORAL',last:'OCTOPUS',number:8,rarity:'rare',team:'OCEAN',tag:'EIGHT-ARM MIND'},
  {first:'RUSTY',last:'FOX',number:9,rarity:'rare',team:'FOREST',tag:'CLEVER TRICKSTER',pose:'fadeaway'},
  // OLDSCHOOL - endangered species
  {first:'BAMBOO',last:'PANDA',number:1,rarity:'oldschool',team:'RAINFOREST',tag:'BLACK AND WHITE',pose:'jumpman'},
  {first:'STORM',last:'TIGER',number:23,rarity:'oldschool',team:'RAINFOREST',tag:'JUNGLE STALKER',pose:'fadeaway'},
  {first:'SNOWY',last:'LEOPARD',number:18,rarity:'oldschool',team:'ARCTIC',tag:'GHOST OF MOUNTAINS',pose:'jumpman'},
  {first:'SUNDANCE',last:'RHINO',number:4,rarity:'oldschool',team:'SAVANNA',tag:'HORNED TANK',pose:'dunk'},
  // LEGEND - apex creatures
  {first:'ZEUS',last:'EAGLE',number:1,rarity:'legend',team:'FOREST',tag:'SKY MONARCH',pose:'jumpman'},
  {first:'MUFASA',last:'LION',number:24,rarity:'legend',team:'SAVANNA',tag:'KING OF PRIDE',pose:'dunk'},
  {first:'TUSK',last:'ELEPHANT',number:50,rarity:'legend',team:'SAVANNA',tag:'GRAY MOUNTAIN',pose:'skyhook'},
  {first:'ATLAS',last:'BEAR',number:33,rarity:'legend',team:'FOREST',tag:'FOREST GIANT',pose:'dunk'},
  {first:'SPIRIT',last:'WOLF',number:6,rarity:'legend',team:'TUNDRA',tag:'WHITE GHOST',pose:'jumpman'},
  {first:'EMPEROR',last:'PENGUIN',number:12,rarity:'legend',team:'ARCTIC',tag:'ICE SOVEREIGN',pose:'fadeaway'},
  {first:'NOMAD',last:'CAMEL',number:3,rarity:'legend',team:'DESERT',tag:'DUNE WALKER',pose:'jumpman'},
  // MYTHIC - pantheon
  {first:'LEVIATHAN',last:'WHALE',number:100,rarity:'mythic',team:'OCEAN',tag:'OCEAN TITAN',pose:'skyhook'},
  {first:'PHOENIX',last:'CRANE',number:7,rarity:'mythic',team:'WETLAND',tag:'RISING FLAME',pose:'jumpman'},
  {first:'APEX',last:'ORCA',number:13,rarity:'mythic',team:'OCEAN',tag:'BLACK AND WHITE FURY',pose:'fadeaway'},
  {first:'HELIOS',last:'LION',number:33,rarity:'mythic',team:'SAVANNA',tag:'GOLDEN MANE',pose:'dunk'},
  {first:'GAIA',last:'GORILLA',number:8,rarity:'mythic',team:'RAINFOREST',tag:'JUNGLE GUARDIAN',pose:'jumpman'},
  {first:'COSMOS',last:'OWL',number:6,rarity:'mythic',team:'FOREST',tag:'NIGHT ORACLE',pose:'fadeaway'},
];
const TRADERS = [
  {id:'mossy',name:'Mossy Mara',vibe:'LOWBALLER',color:'#f87171',emoji:'🦔',bio:'Always overvalues her cards. Drives a hard bargain, watch the fine print.',mood:'Eyeing your roster…',
    inventory:[
      {id:'sv1',first:'SPIKE',last:'PORCUPINE',number:5,pps:38,rarity:'uncommon',material:'silver',team:'FOREST',tag:'QUILL MASTER',priceMod:1.4},
      {id:'sv2',first:'DART',last:'FROG',number:12,pps:32,rarity:'uncommon',material:'silver',team:'RAINFOREST',tag:'POISON DART',priceMod:1.3},
      {id:'sv3',first:'BLINK',last:'MOLE',number:24,pps:5,rarity:'common',material:'bronze',team:'FOREST',tag:'UNDERGROUND PRO',priceMod:1.5},
      {id:'sv4',first:'SWIFT',last:'MEERKAT',number:13,pps:78,rarity:'rare',material:'gold',team:'DESERT',tag:'SENTINEL SCOUT',pose:'fadeaway',priceMod:1.4},
    ]},
  {id:'gina',name:'Gentle Gaia',vibe:'FAIR TRADER',color:'#4ade80',emoji:'🌻',bio:'Trades fair, sometimes throws in bonus packs. Beloved at the eco shop.',mood:'Got something nice for ya.',
    inventory:[
      {id:'gn1',first:'LUNA',last:'WOLF',number:41,pps:92,rarity:'legend',material:'gold',team:'TUNDRA',tag:'MOONLIGHT HOWLER',pose:'fadeaway',priceMod:1.0},
      {id:'gn2',first:'TITAN',last:'TORTOISE',number:21,pps:96,rarity:'legend',material:'platinum',team:'DESERT',tag:'ANCIENT SHELL',pose:'skyhook',priceMod:1.0},
      {id:'gn3',first:'FLASH',last:'CHEETAH',number:5,pps:72,rarity:'rare',material:'gold',team:'SAVANNA',tag:'SPEED LEGEND',pose:'jumpman',priceMod:1.0},
      {id:'gn4',first:'RIPPLE',last:'DOLPHIN',number:16,pps:70,rarity:'rare',material:'silver',team:'OCEAN',tag:'WAVE RIDER',pose:'skyhook',priceMod:1.0},
    ]},
  {id:'hank',name:'Hawk-Eye Hank',vibe:'TOUGH SELL',color:'#fbbf24',emoji:'🦅',bio:'Wants top eco points for top animals. No lowballs accepted.',mood:'Bring real value, we talk.',
    inventory:[
      {id:'hk1',first:'STORM',last:'ORCA',number:34,pps:94,rarity:'legend',material:'diamond',team:'OCEAN',tag:'OCEAN PREDATOR',pose:'fadeaway',priceMod:1.6},
      {id:'hk2',first:'BLAZE',last:'JAGUAR',number:32,pps:91,rarity:'legend',material:'gold',team:'RAINFOREST',tag:'JUNGLE GHOST',pose:'dunk',priceMod:1.55},
      {id:'hk3',first:'AURORA',last:'SWAN',number:6,pps:115,rarity:'mythic',material:'supernova',team:'WETLAND',tag:'GRACE OF FLIGHT · 1-OF-1',pose:'jumpman',priceMod:1.8},
    ]},
];
const STARTING_USERS = {
  tyler: { username:'tyler', displayName:'Tyler', color:'#fb923c', emoji:'🦊', points:3000, ownedCards:TYLER_ROSTER, packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'] },
  carter:{ username:'carter',displayName:'Carter',color:'#22d3ee', emoji:'🐺', points:3000, ownedCards:CARTER_ROSTER,packsAvailable:1, dailyClaimed:false, lastDailyDate:null, unlockedTracks:['vibes','practice'] },
};

// Bronze-only starter for future new accounts (account creation still disabled).
// Real low-key NBA players so they're authentic, just not superstars.
const NEW_USER_STARTER = [
  {id:'ns_c1',first:'ROCKY',last:'RACCOON',number:7,pps:6,rarity:'common',material:'bronze',team:'FOREST',tag:'NIGHT BANDIT'},
  {id:'ns_c2',first:'DAISY',last:'SQUIRREL',number:2,pps:7,rarity:'common',material:'bronze',team:'FOREST',tag:'NUT GATHERER'},
  {id:'ns_c3',first:'HAZEL',last:'HEDGEHOG',number:4,pps:8,rarity:'common',material:'bronze',team:'FOREST',tag:'PRICKLY BALL'},
  {id:'ns_c4',first:'BUDDY',last:'BEAVER',number:8,pps:9,rarity:'common',material:'bronze',team:'WETLAND',tag:'DAM BUILDER'},
  {id:'ns_c5',first:'PIP',last:'CHIPMUNK',number:1,pps:11,rarity:'common',material:'bronze',team:'FOREST',tag:'CHEEK STUFFER'},
];

// Music tracks (synthesized live via Tone.js — no external audio files)
const MUSIC_TRACKS = [
  {id:'vibes',     name:'FOREST BREEZE',  subtitle:'gentle woodland',  price:0,      free:true,  tempo:'80 BPM',  vibe:'NATURE',   color:'#4ade80'},
  {id:'practice',  name:'RIVER FLOW',     subtitle:'babbling stream',  price:0,      free:true,  tempo:'72 BPM',  vibe:'WATER',    color:'#60a5fa'},
  {id:'gametime',  name:'JUNGLE BEATS',   subtitle:'wild rhythm',      price:15000,              tempo:'104 BPM', vibe:'WILD',     color:'#22d3ee'},
  {id:'crunch',    name:'CRUNCH TIME',    subtitle:'4th quarter heat', price:40000,              tempo:'124 BPM', vibe:'INTENSE',  color:'#ef4444'},
  {id:'champs',    name:'CHAMPIONSHIP',   subtitle:'victory anthem',   price:100000,             tempo:'118 BPM', vibe:'TRIUMPH',  color:'#fbbf24'},
];

/* SVG PORTRAITS */
function PortraitDunk({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="200" rx="55" ry="38" fill={color} opacity="0.9"/><ellipse cx="100" cy="165" rx="35" ry="28" fill={color}/><circle cx="100" cy="120" r="32" fill={color}/><ellipse cx="76" cy="92" rx="10" ry="20" fill={color} transform="rotate(-18,76,92)"/><ellipse cx="124" cy="92" rx="10" ry="20" fill={color} transform="rotate(18,124,92)"/><ellipse cx="88" cy="126" rx="8" ry="6" fill={color} opacity="0.7"/><ellipse cx="112" cy="126" rx="8" ry="6" fill={color} opacity="0.7"/><path d="M60 230 Q50 260 44 270 Q38 260 52 245 Z" fill={color}/><path d="M140 230 Q150 260 156 270 Q162 260 148 245 Z" fill={color}/><ellipse cx="155" cy="268" rx="14" ry="8" fill={color} opacity="0.6"/><ellipse cx="45" cy="268" rx="14" ry="8" fill={color} opacity="0.6"/></svg>);}
function PortraitJumpman({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="205" rx="52" ry="35" fill={color} opacity="0.9"/><ellipse cx="100" cy="168" rx="32" ry="26" fill={color}/><circle cx="100" cy="118" r="34" fill={color}/><ellipse cx="78" cy="85" rx="9" ry="24" fill={color} transform="rotate(-10,78,85)"/><ellipse cx="122" cy="85" rx="9" ry="24" fill={color} transform="rotate(10,122,85)"/><ellipse cx="86" cy="124" rx="7" ry="5" fill={color} opacity="0.65"/><ellipse cx="114" cy="124" rx="7" ry="5" fill={color} opacity="0.65"/><ellipse cx="100" cy="133" rx="14" ry="9" fill={color} opacity="0.8"/><path d="M72 235 Q64 255 58 268 Q68 258 76 262 Z" fill={color}/><path d="M128 235 Q136 255 142 268 Q132 258 124 262 Z" fill={color}/><path d="M55 200 Q30 185 22 195 Q18 182 38 178 Q50 175 65 192 Z" fill={color}/><path d="M145 200 Q170 185 178 195 Q182 182 162 178 Q150 175 135 192 Z" fill={color}/></svg>);}
function PortraitFadeaway({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="195" rx="44" ry="55" fill={color}/><circle cx="100" cy="115" r="48" fill={color}/><ellipse cx="72" cy="75" rx="14" ry="30" fill={color} transform="rotate(-15,72,75)"/><ellipse cx="128" cy="75" rx="14" ry="30" fill={color} transform="rotate(15,128,75)"/><ellipse cx="80" cy="118" rx="18" ry="20" fill={color} opacity="0.5"/><ellipse cx="120" cy="118" rx="18" ry="20" fill={color} opacity="0.5"/><path d="M55 190 Q30 210 28 235 Q20 215 38 200 Q46 194 58 198 Z" fill={color}/><path d="M145 190 Q170 210 172 235 Q180 215 162 200 Q154 194 142 198 Z" fill={color}/></svg>);}
function PortraitSkyhook({color}){return(<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="155" rx="22" ry="55" fill={color}/><circle cx="100" cy="88" r="26" fill={color}/><path d="M22 140 Q10 120 8 100 Q18 95 30 108 Q50 100 78 138 Z" fill={color}/><path d="M178 140 Q190 120 192 100 Q182 95 170 108 Q150 100 122 138 Z" fill={color}/><path d="M30 108 Q18 130 15 158 Q28 148 42 148 Q60 140 78 138 Z" fill={color} opacity="0.85"/><path d="M170 108 Q182 130 185 158 Q172 148 158 148 Q140 140 122 138 Z" fill={color} opacity="0.85"/><ellipse cx="100" cy="215" rx="12" ry="30" fill={color}/><path d="M88 240 Q78 258 72 268 Q84 260 92 262 Z" fill={color}/><path d="M112 240 Q122 258 128 268 Q116 260 108 262 Z" fill={color}/></svg>);}
const POSE_PORTRAITS = { dunk:PortraitDunk, jumpman:PortraitJumpman, fadeaway:PortraitFadeaway, skyhook:PortraitSkyhook };

/* LOGO BADGE — Carter's circular emblem with orbiting tagline */
function LogoBadge({size=180, accent='#1D9E75', primary='#fff7ed', dark='#085041'}){
  return (
    <svg viewBox="0 0 200 220" style={{width:size, height:Math.round(size*1.1), display:'block', flexShrink:0}}>
      <circle cx="100" cy="95" r="54" fill="#5DCAA5"/>
      <clipPath id="gcl"><circle cx="100" cy="95" r="54"/></clipPath>
      <g clipPath="url(#gcl)">
        <ellipse cx="83" cy="88" rx="36" ry="44" fill="#3B6D11"/>
        <ellipse cx="123" cy="63" rx="23" ry="19" fill="#4a8a18"/>
        <ellipse cx="96" cy="134" rx="29" ry="16" fill="#3B6D11"/>
        <ellipse cx="70" cy="75" rx="12" ry="15" fill="#27500A"/>
        <ellipse cx="90" cy="96" rx="10" ry="12" fill="#27500A"/>
        <ellipse cx="119" cy="72" rx="9" ry="11" fill="#27500A"/>
        <line x1="118" y1="90" x2="150" y2="90" stroke="#1D9E75" strokeWidth="2" opacity="0.5"/>
        <line x1="116" y1="99" x2="151" y2="99" stroke="#1D9E75" strokeWidth="2" opacity="0.4"/>
        <line x1="119" y1="108" x2="150" y2="108" stroke="#1D9E75" strokeWidth="2" opacity="0.3"/>
      </g>
      <circle cx="100" cy="95" r="54" fill="none" stroke="#085041" strokeWidth="1.8"/>
      <g transform="translate(148,53)">
        <ellipse cx="0" cy="3" rx="6" ry="4" fill="#D85A30" transform="rotate(-40,0,3)"/>
        <circle cx="4" cy="-4" r="4" fill="#D85A30"/>
        <polygon points="1,-8 -1,-13 5,-9" fill="#D85A30"/>
        <polygon points="6,-7 5,-13 10,-9" fill="#D85A30"/>
        <ellipse cx="7" cy="-2" rx="2.5" ry="2" fill="#F5C4B3"/>
        <path d="M-6,6 Q-10,12 -7,16 Q-3,10 -2,7" fill="#D85A30"/>
        <ellipse cx="-7" cy="16" rx="3" ry="2.5" fill="#faeeda"/>
      </g>
      <g transform="translate(162,94)">
        <ellipse cx="0" cy="4" rx="6" ry="5" fill="#B4B2A9"/>
        <circle cx="0" cy="-4" r="5" fill="#B4B2A9"/>
        <polygon points="-4,-8 -6,-14 -1,-9" fill="#888780"/>
        <polygon points="4,-8 6,-14 1,-9" fill="#888780"/>
        <ellipse cx="0" cy="-2" rx="2.5" ry="2" fill="#D3D1C7"/>
        <circle cx="-2" cy="-6" r="1.2" fill="#444441"/>
        <circle cx="2" cy="-6" r="1.2" fill="#444441"/>
        <line x1="-3" y1="9" x2="-4" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="0" y1="9" x2="0" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3" y1="9" x2="4" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(147,143)">
        <ellipse cx="-6" cy="-2" rx="7" ry="5" fill="#F4C0D1" opacity="0.9" transform="rotate(30,-6,-2)"/>
        <ellipse cx="6" cy="-2" rx="7" ry="5" fill="#F4C0D1" opacity="0.9" transform="rotate(-30,6,-2)"/>
        <ellipse cx="-5" cy="4" rx="5" ry="3" fill="#ED93B1" opacity="0.9"/>
        <ellipse cx="5" cy="4" rx="5" ry="3" fill="#ED93B1" opacity="0.9"/>
        <ellipse cx="0" cy="0" rx="1.5" ry="5" fill="#4B1528"/>
        <line x1="-1" y1="-5" x2="-5" y2="-10" stroke="#4B1528" strokeWidth="0.8"/>
        <circle cx="-5" cy="-11" r="1.2" fill="#4B1528"/>
        <line x1="1" y1="-5" x2="5" y2="-10" stroke="#4B1528" strokeWidth="0.8"/>
        <circle cx="5" cy="-11" r="1.2" fill="#4B1528"/>
      </g>
      <g transform="translate(100,156)">
        <ellipse cx="0" cy="4" rx="6" ry="7" fill="#AFA9EC"/>
        <circle cx="0" cy="-5" r="5.5" fill="#AFA9EC"/>
        <polygon points="-4,-9 -6,-15 -1,-10" fill="#7F77DD"/>
        <polygon points="4,-9 6,-15 1,-10" fill="#7F77DD"/>
        <circle cx="-2.5" cy="-6" r="2.5" fill="#faeeda"/>
        <circle cx="2.5" cy="-6" r="2.5" fill="#faeeda"/>
        <circle cx="-2.5" cy="-6" r="1.2" fill="#26215C"/>
        <circle cx="2.5" cy="-6" r="1.2" fill="#26215C"/>
        <polygon points="0,-4 -1,-2 1,-2" fill="#EF9F27"/>
      </g>
      <g transform="translate(53,143)">
        <ellipse cx="0" cy="0" rx="5" ry="3" fill="#2C2C2A"/>
        <path d="M-5,0 Q-13,-6 -15,-3" stroke="#2C2C2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M5,0 Q13,-6 15,-3" stroke="#2C2C2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="0" cy="-3" r="3" fill="#faeeda"/>
        <path d="M2.5,-3 L6,-2" stroke="#EF9F27" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M-2.5,3 Q0,7 2.5,3" fill="#2C2C2A"/>
      </g>
      <g transform="translate(37,94)">
        <ellipse cx="0" cy="4" rx="7" ry="6" fill="#633806"/>
        <circle cx="0" cy="-5" r="5.5" fill="#633806"/>
        <circle cx="-5" cy="-10" r="3" fill="#633806"/>
        <circle cx="5" cy="-10" r="3" fill="#633806"/>
        <circle cx="-5" cy="-10" r="1.8" fill="#FAC775"/>
        <circle cx="5" cy="-10" r="1.8" fill="#FAC775"/>
        <ellipse cx="0" cy="-2" rx="3" ry="2.5" fill="#FAC775"/>
        <circle cx="0" cy="-3" r="1" fill="#412402"/>
        <circle cx="-2.5" cy="-6" r="1.2" fill="#412402"/>
        <circle cx="2.5" cy="-6" r="1.2" fill="#412402"/>
      </g>
      <g transform="translate(53,50)">
        <ellipse cx="0" cy="3" rx="5.5" ry="4.5" fill="#888780"/>
        <circle cx="0" cy="-3" r="5" fill="#888780"/>
        <ellipse cx="-2" cy="-4" rx="2" ry="1.6" fill="#2C2C2A"/>
        <ellipse cx="2" cy="-4" rx="2" ry="1.6" fill="#2C2C2A"/>
        <circle cx="-4" cy="-8" r="2.5" fill="#888780"/>
        <circle cx="4" cy="-8" r="2.5" fill="#888780"/>
        <ellipse cx="0" cy="-1" rx="2" ry="1.8" fill="#D3D1C7"/>
        <circle cx="0" cy="-2" r="1" fill="#2C2C2A"/>
        <path d="M5,5 Q10,9 9,14 Q6,9 5,13 Q3,9 2,6" fill="#888780"/>
      </g>
      <text x="100" y="177" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" fill="#085041" letterSpacing="2.5">DESIGN Â· COLLECT Â· TRADE</text>
      <text x="100" y="196" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#085041" letterSpacing="2.5">ECO</text>
      <text x="100" y="214" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="#1D9E75" letterSpacing="5">HEROES</text>
    </svg>
  );
}

/* HELPERS */
const BINDER_PRICE = 25000;
const BINDER_PAGES_PRICE = 10000;
const BINDER_PAGES_BATCH = 5;
const MAX_BINDERS = 12;
const FINISH_PRICE = (mat) => mat==='bronze' ? 0 : Math.round(((MATERIALS[mat] && MATERIALS[mat].mult) || 1) * 3000);
const getCardValue = c => Math.floor(RARITIES[c.rarity].price * MATERIALS[c.material||'bronze'].mult);
const DAMAGE_PENALTY = [0, 0.10, 0.25, 0.45];
const DAMAGE_LABEL = ['HEALTHY','SLIGHTLY INJURED','INJURED','MAJOR INJURY'];
const CASE_PRICE = { soft:5000, clear:15000, silver:40000, gold:100000 };
const CASE_PROTECT = { soft:0.15, clear:0.05, silver:0.01, gold:0 };
const CASE_LABEL = { soft:'SOFT SLEEVE', clear:'CLEAR CASE', silver:'SILVER CASE', gold:'GOLD CASE' };
const BASE_DAMAGE_CHANCE = 0.01;
const effPps = (basePps, dmg) => Math.round((basePps||0) * (1 - (DAMAGE_PENALTY[dmg]||0)));
const effValue = (baseVal, dmg) => Math.floor((baseVal||0) * (1 - (DAMAGE_PENALTY[dmg]||0)));
function getCardHunger(me, cardId){
  if(!me || !me.cardHunger) return 100;
  return me.cardHunger[cardId] ?? 100;
}
function getCardState(me, cardId){
  const cs = me && me.binderData && me.binderData.cardStates;
  return (cs && cs[cardId]) || { damage:0, caseType:null };
}

// Identity key for merging duplicate cards. Pulled NBA cards with identical
// player + rarity + material + team merge into one stack with a qty count.
// Custom mints are kept unique (they're unique art pieces, not collectibles).
const cardKey = c => c.id?.startsWith('mint_')
  ? `mint:${c.id}`
  : `${(c.first||'').trim()}|${(c.last||'').trim()}|${c.number}|${c.team}|${c.rarity}|${c.material||'bronze'}`;

// Add a card to a collection, merging into an existing stack if one matches.
// Returns a new array; never mutates input.
function addCardWithMerge(cards, newCard){
  const key = cardKey(newCard);
  const idx = cards.findIndex(c => cardKey(c) === key);
  if(idx >= 0){
    const existing = cards[idx];
    const updated = { ...existing, qty: (existing.qty || 1) + (newCard.qty || 1) };
    return [...cards.slice(0,idx), updated, ...cards.slice(idx+1)];
  }
  return [...cards, newCard];
}

// Add multiple cards, auto-merging each.
function addCardsWithMerge(cards, newCards){
  let out = cards;
  for(const c of newCards) out = addCardWithMerge(out, c);
  return out;
}

// Remove ONE copy of a card by id. If qty > 1 just decrement; if qty === 1 remove.
function removeOneCardById(cards, cardId){
  const idx = cards.findIndex(c => c.id === cardId);
  if(idx < 0) return cards;
  const card = cards[idx];
  if((card.qty || 1) > 1){
    return [...cards.slice(0,idx), { ...card, qty: card.qty - 1 }, ...cards.slice(idx+1)];
  }
  return cards.filter(c => c.id !== cardId);
}

// One-time cleanup: collapse all existing duplicates in a collection into stacks.
// Returns { cards, mergedCount } so the caller can show feedback.
function mergeAllDuplicates(cards){
  const groups = new Map();
  const order = [];
  for(const c of cards){
    const key = cardKey(c);
    if(!groups.has(key)){
      groups.set(key, { ...c, qty: c.qty || 1 });
      order.push(key);
    } else {
      const g = groups.get(key);
      g.qty = (g.qty || 1) + (c.qty || 1);
    }
  }
  const result = order.map(k => groups.get(k));
  const mergedCount = cards.length - result.length;
  return { cards: result, mergedCount };
}
const getCardHue = c => (TEAM_LOOKUP[c.team] || HABITATS[0]).hue;
function pickWeighted(weights){const total=Object.values(weights).reduce((a,b)=>a+b,0);let r=Math.random()*total;for(const[k,w]of Object.entries(weights)){r-=w;if(r<=0)return k;}return Object.keys(weights)[0];}

function PointsCounter({value,paused}){
  return <div data-pts-counter="true" style={{display:'flex',alignItems:'baseline',gap:6,fontFamily:'"JetBrains Mono",monospace'}}>
    <span style={{fontSize:32,fontWeight:800,color:paused?'#a8a29e':'#fff7ed',letterSpacing:'-0.04em',textShadow:paused?'none':'0 0 24px rgba(255,107,0,0.45)',lineHeight:1}}>{Math.floor(value).toLocaleString()}</span>
    <span style={{fontSize:11,color:'#4ade80',fontWeight:700,letterSpacing:'0.15em'}}>ECO</span>
  </div>;
}
function FilterChip({active,onClick,color,label}){
  return <button onClick={onClick} style={{padding:'5px 10px',borderRadius:999,border:`1px solid ${active?color:'#44403c'}`,background:active?`${color}22`:'transparent',color:active?color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',fontSize:9.5,fontWeight:700,letterSpacing:'0.1em',cursor:'pointer',transition:'all 200ms'}}>{label}</button>;
}
function QuickAction({icon:Icon,label,sub,accent,badge,onClick,disabled}){
  const [hover,setHover] = useState(false);
  return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{position:'relative',flex:1,minWidth:180,display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:12,border:`1px solid ${(!disabled&&hover)?accent:'rgba(255,255,255,0.08)'}`,background:(!disabled&&hover)?`${accent}15`:'rgba(255,255,255,0.03)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.55:1,transition:'all 220ms',textAlign:'left',color:'#fff7ed',fontFamily:'"Outfit",sans-serif'}}>
    <div style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${accent}22`,color:accent,flexShrink:0}}><Icon size={18} strokeWidth={2.4}/></div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,letterSpacing:'0.06em',lineHeight:1}}>{label}</div>
      <div style={{fontSize:11,color:'#a8a29e',marginTop:3,fontFamily:'"JetBrains Mono",monospace'}}>{sub}</div>
    </div>
    {badge && <div style={{position:'absolute',top:-6,right:-6,minWidth:20,height:20,padding:'0 6px',borderRadius:10,background:accent,color:'#0a0a0a',fontSize:10,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"JetBrains Mono",monospace',boxShadow:`0 0 12px ${accent}`}}>{badge}</div>}
  </button>;
}
function Toast({message,kind='ok',onDone}){
  // Re-arm the timer only when a new message arrives, not on every parent
  // re-render. The points ticker re-renders App every 100ms, which used to
  // recreate `onDone` and reset this timer forever — pill never closed.
  useEffect(()=>{const id=setTimeout(onDone,4000);return()=>clearTimeout(id);},[message]);
  const isErr=kind==='err';
  return <div style={{position:'fixed',top:24,left:'50%',transform:'translateX(-50%)',zIndex:300,padding:'12px 20px',background:isErr?'linear-gradient(135deg, #b91c1c, #7f1d1d)':'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',borderRadius:999,fontFamily:'"Bebas Neue",sans-serif',fontSize:16,letterSpacing:'0.08em',display:'flex',alignItems:'center',gap:8,boxShadow:`0 12px 40px ${isErr?'rgba(185,28,28,0.5)':'rgba(255,107,0,0.5)'}`,animation:'float-up 300ms ease-out'}}>
    {isErr?<X size={16} strokeWidth={3}/>:<Check size={16} strokeWidth={3}/>}{message}
  </div>;
}

/* MATERIAL BADGE */
function MaterialBadge({material,small,large}){
  const m = MATERIALS[material||'bronze'];
  const isSn = material==='supernova';
  return <div style={{display:'inline-flex',alignItems:'center',gap:large?6:3,padding:small?'2px 6px':(large?'4px 10px':'2px 7px'),borderRadius:large?8:6,background:isSn?'linear-gradient(90deg,#ec4899,#a855f7,#3b82f6)':`${m.color}22`,border:isSn?'1px solid #fff':`1px solid ${m.color}88`,boxShadow:large?`0 0 12px ${m.glow}`:'none',animation:isSn?'supernova-shift 3s linear infinite':'none'}}>
    <span style={{fontSize:small?9:(large?15:12),color:isSn?'#fff':m.color,textShadow:isSn?'0 0 6px rgba(255,255,255,0.8)':'none',lineHeight:1}}>{m.gem}</span>
    <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:small?8.5:(large?14:10),color:isSn?'#fff':m.color,letterSpacing:'0.12em',lineHeight:1,textShadow:isSn?'0 0 4px rgba(255,255,255,0.6)':'none'}}>{m.label}</span>
  </div>;
}

/* PLAYER CARD */
function PlayerCard({card,hovered,onHover,onLeave,onClick,damage=0}){
  const r = RARITIES[card.rarity];
  const m = MATERIALS[card.material||'bronze'];
  const hue = getCardHue(card);
  const isMythic = card.rarity==='mythic';
  const isLegend = card.rarity==='legend';
  const isSn = (card.material||'bronze')==='supernova';
  const hasPose = card.pose && POSE_PORTRAITS[card.pose];
  const Pose = hasPose ? POSE_PORTRAITS[card.pose] : null;
  return <div onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick} style={{position:'relative',aspectRatio:'5 / 7',borderRadius:14,cursor:'pointer',transform:hovered?'translateY(-6px) rotate(-0.5deg)':'translateY(0)',transition:'transform 350ms cubic-bezier(.2,.8,.2,1), box-shadow 350ms',boxShadow:hovered?`0 24px 60px -10px ${m.glow}, 0 0 0 2px ${m.color}, inset 0 0 60px rgba(0,0,0,0.4)`:`0 8px 24px -6px rgba(0,0,0,0.6), 0 0 0 1.5px ${m.color}cc, inset 0 0 40px rgba(0,0,0,0.5)`,background:`linear-gradient(155deg, hsl(${hue} 70% 22%) 0%, hsl(${hue} 60% 8%) 100%)`,overflow:'hidden'}}>
    {isSn && <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(115deg, transparent 20%, rgba(236,72,153,0.25) 35%, rgba(168,85,247,0.3) 50%, rgba(59,130,246,0.25) 65%, transparent 80%)',mixBlendMode:'overlay',animation:'sheen 2.5s ease-in-out infinite'}}/>}
    {isMythic && !isSn && <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, rgba(255,200,80,0.25) 50%, rgba(255,255,255,0.18) 55%, transparent 70%)',mixBlendMode:'overlay',animation:'sheen 3.5s ease-in-out infinite'}}/>}
    <div style={{position:'absolute',top:0,right:0,width:'60%',height:'100%',background:`linear-gradient(115deg, transparent 0%, transparent 40%, ${r.color}22 40.5%, ${r.color}22 55%, transparent 55.5%)`,pointerEvents:'none'}}/>
    {/* number watermark removed */}
    {card.portrait ? (
      <div style={{position:'absolute',top:'10%',left:'8%',right:'8%',bottom:'30%',borderRadius:8,overflow:'hidden',background:'rgba(0,0,0,0.15)'}}>
        <img src={card.portrait} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
      </div>
    ) : hasPose ? <div style={{position:'absolute',top:'12%',left:'10%',right:'10%',bottom:'32%',color:r.color,filter:`drop-shadow(0 4px 10px ${r.glow})`}}><Pose color={r.color}/></div> : <div style={{position:'absolute',top:'15%',left:'10%',right:'10%',bottom:'32%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,opacity:0.5,pointerEvents:'none'}}>🐾</div>}
    {card.signatureMove && <div style={{position:'absolute',top:'42%',left:8,padding:'2px 7px',borderRadius:4,background:'rgba(0,0,0,0.65)',border:`1px solid ${r.color}66`,fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.15em',color:r.color}}>{card.signatureMove}</div>}
    <div style={{position:'absolute',top:10,left:10,padding:'3px 14px 3px 8px',background:r.color,color:'#0a0a0a',fontSize:9,fontWeight:900,letterSpacing:'0.12em',fontFamily:'"Bebas Neue",sans-serif',clipPath:'polygon(0 0, 100% 0, 92% 100%, 0 100%)'}}>{r.label}</div>
    {damage>0 && <div style={{position:'absolute',top:34,left:10,padding:'2px 7px',borderRadius:4,background:'rgba(0,0,0,0.75)',border:'1px solid #fca5a5',fontFamily:'"JetBrains Mono",monospace',fontSize:7.5,letterSpacing:'0.1em',color:'#fca5a5'}}>{DAMAGE_LABEL[damage]}</div>}
    <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
      <div style={{fontSize:10,fontWeight:700,color:'#fff7ed99',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>{card.team}</div>
      <MaterialBadge material={card.material||'bronze'} small/>
    </div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px 12px 14px',background:'linear-gradient(180deg, transparent, rgba(0,0,0,0.85) 35%)'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.18em',color:r.color,marginBottom:2,fontFamily:'"JetBrains Mono",monospace'}}>{card.tag}</div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,fontWeight:700,color:'#fff7ed',lineHeight:0.95}}>{card.first}</div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,fontWeight:700,color:'#fff7ed',lineHeight:0.95}}>{card.last}</div>
      <div style={{marginTop:8,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:6,background:'rgba(255,255,255,0.06)',border:`1px solid ${m.color}66`}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <Flame size={12} style={{color:'#fb923c'}}/>
          <span style={{fontSize:9,fontWeight:700,color:'#fdba74',letterSpacing:'0.1em',fontFamily:'"JetBrains Mono",monospace'}}>EARN</span>
        </div>
        <div style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:700,color:damage>0?'#fca5a5':'#fff7ed',fontSize:13}}>{effPps(card.pps,damage)}<span style={{color:'#fb923c',fontSize:10}}>/s</span></div>
      </div>
    </div>
    {(isLegend||isMythic) && <Sparkles size={14} style={{position:'absolute',bottom:110,right:12,color:r.color,filter:`drop-shadow(0 0 6px ${r.color})`}}/>}
    {(card.qty||1) > 1 && <div style={{position:'absolute',top:'42%',right:8,minWidth:28,padding:'3px 7px',borderRadius:6,background:'linear-gradient(135deg, #fff7ed, #fbbf24)',color:'#0c0907',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,fontWeight:800,letterSpacing:'0.04em',boxShadow:'0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(251,191,36,0.5)',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,border:'1.5px solid rgba(0,0,0,0.4)'}}>×{card.qty}</div>}
  </div>;
}

/* MINI CARD */
function MiniCard({card,selected,onClick,dim}){
  const r = RARITIES[card.rarity];
  const m = MATERIALS[card.material||'bronze'];
  const hue = getCardHue(card);
  const isSn = (card.material||'bronze')==='supernova';
  return <button onClick={onClick} style={{position:'relative',flexShrink:0,width:96,aspectRatio:'5/7',borderRadius:8,cursor:'pointer',border:'none',padding:0,opacity:dim?0.35:1,outline:selected?`3px solid ${m.color}`:'none',outlineOffset:2,background:`linear-gradient(155deg, hsl(${hue} 70% 22%), hsl(${hue} 60% 8%))`,boxShadow:`0 0 0 1.5px ${m.color}aa, 0 4px 10px rgba(0,0,0,0.4)`,overflow:'hidden',transition:'all 200ms'}}>

    {isSn && <div style={{position:'absolute',inset:0,background:'linear-gradient(115deg, transparent 30%, rgba(236,72,153,0.3) 50%, transparent 70%)',animation:'sheen 2s ease-in-out infinite',pointerEvents:'none'}}/>}
    <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'4px 5px 5px',background:'linear-gradient(transparent, rgba(0,0,0,0.9))'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:9,color:'#fff',lineHeight:1}}>{card.first}</div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:9,color:'#fff',lineHeight:1}}>{card.last}</div>
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:8,color:r.color,marginTop:2}}>{card.pps}/s</div>
    </div>
    <div style={{position:'absolute',top:3,left:3,width:6,height:6,borderRadius:3,background:r.color,boxShadow:`0 0 6px ${r.color}`}}/>
    <div style={{position:'absolute',top:3,right:3,fontSize:9,lineHeight:1,color:m.color,textShadow:isSn?'0 0 6px #fff':'none'}}>{m.gem}</div>
  </button>;
}

/* CARD DETAIL MODAL */
function Attr({label,value,icon}){
  return <div>
    <div style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:'#78716c',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}><span style={{color:'#fb923c'}}>{icon}</span>{label}</div>
    <div style={{marginTop:3,fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:700,color:'#fff7ed'}}>{value}</div>
  </div>;
}
function CardDetailModal({card,onClose,onSell,isMine=true,onEdit,binders,onAddToBinder,inBinder,onRemoveFromBinder,damage=0,caseType=null,onRepair,onEncase}){
  const [flipped,setFlipped] = useState(false);
  const [pickBinder,setPickBinder] = useState(false);
  const [pickCase,setPickCase] = useState(false);
  if(!card) return null;
  const r = RARITIES[card.rarity];
  const m = MATERIALS[card.material||'bronze'];
  const t = TEAM_LOOKUP[card.team];
  const value = getCardValue(card);
  const highlights = getHighlights(card);
  const hue = getCardHue(card);
  return <div style={{position:'fixed',inset:0,zIndex:160,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:380,width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
      <button onClick={onClose} style={{alignSelf:'flex-end',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>

      {/* Card flip container */}
      <div onClick={()=>setFlipped(f=>!f)} style={{width:'100%',maxWidth:300,aspectRatio:'5/7',perspective:'1200px',cursor:'pointer'}}>
        <div style={{position:'relative',width:'100%',height:'100%',transformStyle:'preserve-3d',transition:'transform 700ms cubic-bezier(.2,.8,.2,1)',transform:flipped?'rotateY(180deg)':'rotateY(0deg)'}}>
          {/* FRONT */}
          <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden'}}>
            <PlayerCard card={card} damage={damage}/>
          </div>
          {/* BACK */}
          <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:'rotateY(180deg)',borderRadius:14,overflow:'hidden',background:`linear-gradient(155deg, hsl(${hue} 50% 14%) 0%, hsl(${hue} 40% 6%) 100%)`,border:`1.5px solid ${m.color}cc`,boxShadow:`0 8px 24px -6px rgba(0,0,0,0.6), 0 0 0 1.5px ${m.color}cc, inset 0 0 40px rgba(0,0,0,0.5)`,padding:'14px 14px 12px',display:'flex',flexDirection:'column',color:'#fff7ed'}}>
            {/* Back: header strip */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,paddingBottom:8,borderBottom:`1px solid ${r.color}55`}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,lineHeight:1,letterSpacing:'0.02em',color:'#fff7ed',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.first} {card.last}</div>
                <div style={{fontSize:9,color:'#a8a29e',marginTop:3,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em'}}>{t?.name || card.team}</div>
              </div>
              <div style={{padding:'2px 7px',borderRadius:4,background:r.color,color:'#0a0a0a',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{r.label}</div>
            </div>
            {/* Stat strip */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:'8px 0',borderBottom:`1px solid ${r.color}33`}}>
              <BackStat label="EARNS" value={`${card.pps}/s`} color={r.color}/>
              <BackStat label="WORTH" value={value>=1000?`${(value/1000).toFixed(1)}K`:value} color={m.color}/>
              <BackStat label="MATERIAL" value={m.label.slice(0,4)} color={m.color}/>
            </div>
            {/* Highlights — like real card back */}
            <div style={{flex:1,padding:'8px 0',overflowY:'auto',minHeight:0}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:11,color:r.color,letterSpacing:'0.18em',marginBottom:6,display:'flex',alignItems:'center',gap:5}}><Award size={11}/>CAREER HIGHLIGHTS</div>
              {highlights ? <ul style={{listStyle:'none',padding:0,margin:0}}>{highlights.map((h,i)=><li key={i} style={{display:'flex',alignItems:'flex-start',gap:6,padding:'3px 0',fontSize:10,color:'#d4d4d8',lineHeight:1.4}}><span style={{color:r.color,marginTop:1,flexShrink:0}}>▸</span><span>{h}</span></li>)}</ul> : <div style={{fontSize:10,color:'#78716c',fontStyle:'italic',padding:'4px 0'}}>{card.id?.startsWith('mint_')?'Custom design — no NBA record on file. The legend is yours to write.':'No NBA record on file for this player.'}</div>}
            </div>
            {/* Footer strip */}
            <div style={{paddingTop:6,borderTop:`1px solid ${r.color}33`,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:8,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.12em'}}>
              <span>ECO HEROES</span>
              <span>{m.gem} {m.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <button onClick={()=>setFlipped(f=>!f)} style={{padding:'5px 14px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#a8a29e',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'0.18em',display:'flex',alignItems:'center',gap:6}}>
        <RefreshCcw size={11}/>{flipped?'SHOW FRONT':'FLIP FOR HIGHLIGHTS'}
      </button>

      {/* Action buttons */}
      <div style={{width:'100%',maxWidth:300,display:'flex',flexDirection:'column',gap:8}}>
        <div style={{padding:'10px 12px',borderRadius:10,background:'linear-gradient(135deg, rgba(255,107,0,0.1), transparent)',border:'1px solid rgba(255,107,0,0.25)',textAlign:'center'}}>
          <div style={{fontSize:9,color:'#fdba74',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>MARKET VALUE{(card.qty||1)>1?` · STACK OF ${card.qty}`:''}</div>
          <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:18,fontWeight:800,color:'#fff7ed',marginTop:2}}>{value.toLocaleString()} <span style={{fontSize:11,color:'#fb923c'}}>PTS</span>{(card.qty||1)>1 && <span style={{fontSize:11,color:'#fbbf24',marginLeft:6}}>each</span>}</div>
          <div style={{fontSize:9,color:'#78716c',marginTop:4,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em'}}>{RARITIES[card.rarity].price.toLocaleString()} × {m.mult}× ({m.label}){(card.qty||1)>1?` · earns ${card.pps*card.qty}/sec total`:''}</div>
        </div>
        {isMine && damage>0 && <div style={{padding:'8px 12px',borderRadius:8,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.35)',textAlign:'center'}}>
          <div style={{fontSize:9,color:'#fca5a5',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>CONDITION: {DAMAGE_LABEL[damage]}</div>
          <div style={{fontSize:9,color:'#78716c',marginTop:3,fontFamily:'"JetBrains Mono",monospace'}}>earning {Math.round(DAMAGE_PENALTY[damage]*100)}% less</div>
        </div>}
        {isMine && damage>0 && onRepair && <button onClick={()=>onRepair(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.35)',color:'#86efac',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><RefreshCcw size={13}/>REPAIR TO MINT - {Math.floor(getCardValue(card)*0.20*damage).toLocaleString()} PTS</button>}


        {false && <div>
          <div style={{fontSize:9,color:'#fde68a',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',textAlign:'center',marginBottom:2}}>PICK A CASE (PROTECTS FROM DAMAGE)</div>
          {['soft','clear','silver','gold'].map(ct=><button key={ct} onClick={()=>{ onEncase(card,ct); setPickCase(false); }} style={{width:'100%',padding:'8px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.06em',display:'flex',justifyContent:'space-between'}}><span>{CASE_LABEL[ct]}</span><span style={{color:'#fbbf24',fontFamily:'"JetBrains Mono",monospace',fontSize:10}}>{CASE_PRICE[ct].toLocaleString()}</span></button>)}
          <button onClick={()=>setPickCase(false)} style={{width:'100%',padding:'6px',borderRadius:6,background:'none',border:'none',color:'#78716c',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'0.12em'}}>CANCEL</button>
        </div>}


        {isMine && !inBinder && pickBinder && <div style={{width:'100%',display:'flex',flexDirection:'column',gap:6,padding:10,borderRadius:8,background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.25)'}}>
          <div style={{fontSize:9,color:'#93c5fd',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',textAlign:'center',marginBottom:2}}>PICK A BINDER</div>
          {(binders||[]).map(b=><button key={b.id} onClick={()=>{ onAddToBinder(b.id); }} style={{width:'100%',padding:'8px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.06em',textAlign:'left'}}>{b.title}</button>)}
          <button onClick={()=>setPickBinder(false)} style={{width:'100%',padding:'6px',borderRadius:6,background:'none',border:'none',color:'#78716c',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'0.12em'}}>CANCEL</button>
        </div>}
        {isMine && onEdit && <button onClick={()=>onEdit(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.3)',color:'#c4b5fd',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Brush size={13}/>EDIT THIS CARD{(card.qty||1)>1?` · ALL ${card.qty}`:''}</button>}
        {isMine && onSell && <button onClick={()=>onSell(card)} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',color:'#fca5a5',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>{(card.qty||1)>1 ? `SELL 1 OF ${card.qty} · +${Math.floor(value*0.6).toLocaleString()} PTS` : `SELL FOR ${Math.floor(value*0.6).toLocaleString()} PTS`}</button>}
      </div>
    </div>
  </div>;
}
function BackStat({label,value,color}){
  return <div style={{textAlign:'center',padding:'4px 2px',borderRadius:5,background:'rgba(0,0,0,0.3)'}}>
    <div style={{fontSize:8,color:'#78716c',letterSpacing:'0.12em',fontFamily:'"JetBrains Mono",monospace'}}>{label}</div>
    <div style={{fontSize:11,fontWeight:800,color:color||'#fff7ed',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{value}</div>
  </div>;
}

/* PACK GENERATION */
function generatePackCards(packType, count = 3){
  const cfg = PACK_TYPES[packType];
  const out = [];
  // Pack-level Supernova guarantee: roll once per pack. If it hits,
  // pick a random slot that will be forced to supernova material.
  // Acts as a FLOOR — natural per-card supernova rolls still apply
  // on top, so larger packs scale up naturally.
  const supernovaHitSlot = (cfg.supernovaHitChance && Math.random() < cfg.supernovaHitChance)
    ? Math.floor(Math.random() * count)
    : -1;
  for(let i=0;i<count;i++){
    const rarity = pickWeighted(cfg.rarityWeights);
    let material = pickWeighted(cfg.materialWeights);
    if(i===0 && cfg.guaranteedMaterial){
      const order = ['bronze','silver','gold','platinum','diamond','supernova'];
      const minIdx = order.indexOf(cfg.guaranteedMaterial);
      const curIdx = order.indexOf(material);
      if(curIdx<minIdx) material = cfg.guaranteedMaterial;
    }
    // Pack-level supernova hit overrides the natural roll for this slot.
    // Supernova ≥ Diamond, so the diamond+ guarantee is never broken.
    if(i===supernovaHitSlot) material = 'supernova';
    const candidates = PACK_POOL.filter(c=>c.rarity===rarity);
    const base = candidates.length ? candidates[Math.floor(Math.random()*candidates.length)] : PACK_POOL[Math.floor(Math.random()*PACK_POOL.length)];
    const range = RARITIES[rarity].pps;
    const pps = Math.floor(range[0] + Math.random()*(range[1]-range[0]));
    out.push({...base, id:`p${Date.now()}_${i}_${Math.floor(Math.random()*9999)}`, pps, material});
  }
  return out;
}

/* PACK OPENER WITH SWIPE */
function PackOpener({pack,onClose,onAdd,onSupernova,onFullMoon}){
  const [stage,setStage] = useState('pack');
  const [revealIdx,setRevealIdx] = useState(0);
  const [dragX,setDragX] = useState(0);
  const [dragging,setDragging] = useState(false);
  const [celebratedIds,setCelebratedIds] = useState(new Set());
  const startXRef = useRef(0);
  const cards = pack.cards;
  const cfg = PACK_TYPES[pack.type];

  // Trigger Supernova celebration on reveal
  useEffect(()=>{
    if(stage!=='reveal') return;
    const cur = cards[revealIdx];
    if(cur && (cur.material==='supernova' || cur.material==='full_moon') && !celebratedIds.has(cur.id)){
      if(cur.material==='full_moon'){ onFullMoon && onFullMoon(cur); } else { onSupernova && onSupernova(cur); }
      setCelebratedIds(prev => new Set([...prev, cur.id]));
    }
  },[stage,revealIdx,cards,onSupernova,celebratedIds]);

  const ripPack = () => { setStage('opening'); setTimeout(()=>setStage('reveal'),1200); };
  const next = () => { if(revealIdx<cards.length-1) setRevealIdx(i=>i+1); else { onAdd(cards); onClose(); }};
  const prev = () => { if(revealIdx>0) setRevealIdx(i=>i-1); };

  const onPointerDown = (e) => {
    if(stage!=='reveal') return;
    startXRef.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => { if(!dragging) return; setDragX(e.clientX - startXRef.current); };
  const onPointerUp = () => {
    if(!dragging) return;
    setDragging(false);
    const t = 70;
    if(dragX < -t) next();
    else if(dragX > t) prev();
    setDragX(0);
  };

  const cur = cards[revealIdx];
  const r = cur ? RARITIES[cur.rarity] : null;
  const m = cur ? MATERIALS[cur.material||'bronze'] : null;

  const packGrad = pack.type==='supernova' ? 'linear-gradient(160deg, #ec4899, #a855f7 40%, #3b82f6 70%, #1a0f0a)'
    : pack.type==='diamond' ? 'linear-gradient(160deg, #67e8f9, #06b6d4 50%, #1a0f0a)'
    : pack.type==='premium' ? 'linear-gradient(160deg, #fbbf24, #b45309 50%, #1a0f0a)'
    : 'linear-gradient(160deg, #fb923c, #c2410c 50%, #1a0f0a)';
  const topGrad = pack.type==='supernova' ? 'linear-gradient(160deg, #ec4899, #a855f7)'
    : pack.type==='diamond' ? 'linear-gradient(160deg, #67e8f9, #06b6d4)'
    : pack.type==='premium' ? 'linear-gradient(160deg, #fbbf24, #b45309)'
    : 'linear-gradient(160deg, #fb923c, #c2410c)';
  const botGrad = pack.type==='supernova' ? 'linear-gradient(160deg, #3b82f6, #1a0f0a)'
    : pack.type==='diamond' ? 'linear-gradient(160deg, #06b6d4, #1a0f0a)'
    : pack.type==='premium' ? 'linear-gradient(160deg, #b45309, #1a0f0a)'
    : 'linear-gradient(160deg, #c2410c, #1a0f0a)';

  return <div style={{position:'fixed',inset:0,zIndex:200,background:'radial-gradient(ellipse at center, rgba(0,0,0,0.85), rgba(0,0,0,0.98))',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    {stage!=='opening' && <button onClick={()=>{ if(stage==='reveal') onAdd(cards); onClose(); }} style={{position:'absolute',top:24,right:24,zIndex:5,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>}
    {stage==='pack' && <div style={{textAlign:'center'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:cfg.accent,letterSpacing:'0.2em',marginBottom:18}}>{cfg.label}</div>
      <div onClick={ripPack} style={{cursor:'pointer',width:220,height:320,margin:'0 auto',borderRadius:16,background:packGrad,border:`3px solid ${cfg.accent}`,boxShadow:`0 0 60px ${cfg.accent}99, inset 0 0 60px rgba(0,0,0,0.5)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24,position:'relative',transition:'transform 200ms',animation:'pack-bob 2.2s ease-in-out infinite'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        <div style={{position:'absolute',inset:0,borderRadius:13,background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.25) 55%, transparent 70%)',animation:'sheen 3s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:42,color:'#fff7ed',letterSpacing:'0.06em',textShadow:'0 4px 12px rgba(0,0,0,0.6)',lineHeight:0.9,textAlign:'center'}}>ECO<br/>HEROES</div>
        <div style={{padding:'6px 14px',borderRadius:999,background:'rgba(0,0,0,0.5)',fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'#fff7ed',fontWeight:700,letterSpacing:'0.15em'}}>3 CARDS · {cfg.guaranteedMaterial?`${MATERIALS[cfg.guaranteedMaterial].label}+ × 1`:'1 GUARANTEED'}</div>
        <div style={{fontSize:14,color:'#fff7ed',opacity:0.9,marginTop:8,fontWeight:600}}>👆 TAP TO RIP</div>
      </div>
    </div>}
    {stage==='opening' && <div style={{textAlign:'center'}}>
      <div style={{position:'relative',width:220,height:320,margin:'0 auto'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',borderRadius:'16px 16px 0 0',background:topGrad,border:`3px solid ${cfg.accent}`,borderBottom:'none',animation:'rip-top 1.1s cubic-bezier(.4,.0,.6,1) forwards',clipPath:'polygon(0 0, 100% 0, 100% 95%, 92% 100%, 78% 92%, 65% 100%, 50% 88%, 35% 100%, 22% 92%, 8% 100%, 0 95%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'50%',borderRadius:'0 0 16px 16px',background:botGrad,border:`3px solid ${cfg.accent}`,borderTop:'none',animation:'rip-bottom 1.1s cubic-bezier(.4,.0,.6,1) forwards',clipPath:'polygon(0 5%, 8% 0, 22% 8%, 35% 0, 50% 12%, 65% 0, 78% 8%, 92% 0, 100% 5%, 100% 100%, 0 100%)'}}/>
        <div style={{position:'absolute',inset:'30% 25%',background:`radial-gradient(circle, ${cfg.accent}ee, transparent 70%)`,animation:'burst 1.1s ease-out forwards',borderRadius:'50%'}}/>
      </div>
      <div style={{marginTop:24,fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:'#fff7ed',letterSpacing:'0.18em',animation:'pulse-text 0.6s ease-in-out infinite'}}>OPENING…</div>
    </div>}
    {stage==='reveal' && cur && <div style={{textAlign:'center',maxWidth:520,width:'100%',userSelect:'none'}}>
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:13,color:m.color,letterSpacing:'0.2em',marginBottom:14,textTransform:'uppercase'}}>CARD {revealIdx+1} OF {cards.length} · {r.label} · {m.label}</div>
      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{width:'100%',maxWidth:280,margin:'0 auto',position:'relative',touchAction:'pan-y',cursor:dragging?'grabbing':'grab'}}>
        <div key={revealIdx} style={{transform:`translateX(${dragX}px) rotate(${dragX*0.05}deg)`,transition:dragging?'none':'transform 250ms cubic-bezier(.2,.8,.2,1)',animation:dragging?'none':'reveal-card 700ms cubic-bezier(.2,.8,.2,1)',position:'relative'}}>
          <div style={{position:'absolute',inset:-40,borderRadius:'50%',background:`radial-gradient(circle, ${m.glow}, transparent 70%)`,filter:'blur(20px)',zIndex:-1,animation:'aura-pulse 2.5s ease-in-out infinite'}}/>
          <PlayerCard card={cur}/>
        </div>
      </div>
      <div style={{marginTop:18,fontFamily:'"JetBrains Mono",monospace',fontSize:12,color:'#fb923c',letterSpacing:'0.15em'}}>+{cur.pps}/sec · WORTH {getCardValue(cur).toLocaleString()} PTS</div>
      <div style={{marginTop:24,display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
        <div style={{display:'flex',gap:6}}>
          {cards.map((_,i)=><div key={i} style={{width:i===revealIdx?22:8,height:8,borderRadius:4,background:i===revealIdx?m.color:i<revealIdx?`${m.color}66`:'rgba(255,255,255,0.15)',transition:'all 250ms'}}/>)}
        </div>
        <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'#a8a29e',letterSpacing:'0.18em',display:'flex',alignItems:'center',gap:10}}>
          {revealIdx>0 && <><ChevronLeft size={14}/> SWIPE</>}
          <span style={{color:'#52525b'}}>·</span>
          {revealIdx<cards.length-1 ? <>SWIPE <ChevronRight size={14}/></> : <button onClick={()=>{onAdd(cards);onClose();}} style={{padding:'8px 20px',borderRadius:999,background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.12em',display:'inline-flex',alignItems:'center',gap:6}}>ADD TO COLLECTION <ArrowRight size={14}/></button>}
        </div>
      </div>
    </div>}
  </div>;
}

/* TRADE SIDE */
function TradeSide({label,color,cards,points,value,onRemoveCard,onPointsChange,maxPoints}){
  return <div style={{padding:10,borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${color}33`}}>
    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color,letterSpacing:'0.12em',marginBottom:8}}>{label}</div>
    <div style={{display:'flex',flexWrap:'wrap',gap:6,minHeight:80,marginBottom:8}}>
      {cards.length===0 && <div style={{width:'100%',minHeight:80,borderRadius:8,border:'1px dashed rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#52525b',fontSize:11,fontStyle:'italic'}}>tap cards below to add</div>}
      {cards.map(c=><div key={c.id} style={{position:'relative'}}>
        <MiniCard card={c} onClick={()=>onRemoveCard(c.id)}/>
        <X size={12} style={{position:'absolute',top:-4,right:-4,background:'#0a0a0a',borderRadius:'50%',padding:2,color:'#f87171',border:'1px solid #f87171'}}/>
      </div>)}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <Coins size={12} style={{color:'#fb923c'}}/>
      {onPointsChange ? <input type="number" value={points} onChange={e=>onPointsChange(Math.max(0,Math.min(maxPoints||9999999,parseInt(e.target.value)||0)))} placeholder="0" style={{flex:1,minWidth:0,padding:'5px 8px',borderRadius:6,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"JetBrains Mono",monospace',fontSize:11,fontWeight:700}}/> : <div style={{flex:1,padding:'5px 8px',borderRadius:6,background:'rgba(0,0,0,0.4)',color:'#fff7ed',fontFamily:'"JetBrains Mono",monospace',fontSize:11,fontWeight:700}}>{points.toLocaleString()}</div>}
      <span style={{fontSize:9,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>PTS</span>
    </div>
    <div style={{marginTop:6,fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',textAlign:'right'}}>VALUE: <span style={{color}}>{value.toLocaleString()}</span></div>
  </div>;
}

/* AI TRADE TABLE */
function TradeTable({trader,ownedCards,points,onClose,onComplete,onToast}){
  const [mode,setMode] = useState('user');
  const [yourCardIds,setYourCardIds] = useState([]);
  const [theirCardIds,setTheirCardIds] = useState([]);
  const [yourPoints,setYourPoints] = useState(0);
  const [theirPoints,setTheirPoints] = useState(0);
  const [tab,setTab] = useState('yours');

  const yourSel = ownedCards.filter(c=>yourCardIds.includes(c.id));
  const theirSel = trader.inventory.filter(c=>theirCardIds.includes(c.id));
  const yourValue = yourSel.reduce((s,c)=>s+getCardValue(c),0) + yourPoints;
  const theirValue = theirSel.reduce((s,c)=>s+getCardValue(c)*(c.priceMod||1),0) + theirPoints;
  const fairness = yourValue===0 && theirValue===0 ? 0 : (yourValue-theirValue)/Math.max(theirValue,1);

  const toggleYour = id => setYourCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleTheir = id => setTheirCardIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const generateAIOffer = () => {
    const sortedTheir = [...trader.inventory].sort((a,b)=>getCardValue(a)-getCardValue(b));
    const offer = sortedTheir.slice(0,trader.id==='gina'?2:1);
    const sortedYours = [...ownedCards].sort((a,b)=>getCardValue(b)-getCardValue(a));
    const want = sortedYours.slice(0,1);
    setTheirCardIds(offer.map(c=>c.id));
    setYourCardIds(want.map(c=>c.id));
    const offerVal = offer.reduce((s,c)=>s+getCardValue(c)*(c.priceMod||1),0);
    const wantVal = want.reduce((s,c)=>s+getCardValue(c),0);
    let pts = 0;
    if(trader.id==='steve') pts = Math.max(0,wantVal-offerVal)*0.5;
    if(trader.id==='gina') pts = Math.max(0,wantVal-offerVal);
    if(trader.id==='hank') pts = Math.max(0,wantVal-offerVal)*1.2;
    setYourPoints(Math.floor(pts));
    setTheirPoints(0);
  };

  const send = () => {
    let accepted = false;
    if(trader.id==='steve') accepted = fairness>=0.15;
    else if(trader.id==='gina') accepted = fairness>=-0.10;
    else if(trader.id==='hank') accepted = fairness>=0.25;
    if(theirSel.length===0 && theirPoints===0) accepted = false;
    if(yourSel.length===0 && yourPoints===0) accepted = false;
    if(yourPoints>points){ onToast('NOT ENOUGH POINTS','err'); return; }
    if(accepted){
      onComplete({give:yourSel, receive:theirSel.map(c=>({...c,id:`t${Date.now()}_${c.id}`})), givePoints:yourPoints, receivePoints:theirPoints});
      onToast(`${trader.name.split(' ')[0].toUpperCase()} ACCEPTED!`);
      onClose();
    } else {
      onToast(`${trader.name.split(' ')[0].toUpperCase()} REJECTED. SWEETEN IT.`,'err');
    }
  };

  return <div style={{position:'fixed',inset:0,zIndex:150,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:720,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:`1px solid ${trader.color}55`,boxShadow:`0 30px 80px rgba(0,0,0,0.8), 0 0 60px ${trader.color}22`,maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{padding:'18px 20px',background:`linear-gradient(180deg, ${trader.color}22, transparent)`,borderBottom:`1px solid ${trader.color}33`,display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:54,height:54,borderRadius:14,background:`${trader.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,border:`2px solid ${trader.color}`}}>{trader.emoji}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:'#fff7ed',letterSpacing:'0.04em'}}>{trader.name.toUpperCase()}</span>
            <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:`${trader.color}22`,color:trader.color,letterSpacing:'0.1em',fontFamily:'"JetBrains Mono",monospace'}}>{trader.vibe}</span>
          </div>
          <div style={{fontSize:11.5,color:'#a8a29e',marginTop:2,fontStyle:'italic'}}>"{trader.mood}"</div>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'#a8a29e',cursor:'pointer',padding:4}}><X size={20}/></button>
      </div>
      <div style={{display:'flex',padding:'12px 20px 6px',gap:8}}>
        <button onClick={()=>setMode('user')} style={{flex:1,padding:'8px 12px',borderRadius:8,background:mode==='user'?'#fb923c':'rgba(255,255,255,0.04)',color:mode==='user'?'#0a0a0a':'#a8a29e',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>YOU PROPOSE</button>
        <button onClick={()=>{setMode('them');generateAIOffer();}} style={{flex:1,padding:'8px 12px',borderRadius:8,background:mode==='them'?'#fb923c':'rgba(255,255,255,0.04)',color:mode==='them'?'#0a0a0a':'#a8a29e',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Shuffle size={13}/>THEY PROPOSE</button>
      </div>
      <div style={{padding:'14px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <TradeSide label={`${trader.name.split(' ')[0].toUpperCase()} GIVES`} color={trader.color} cards={theirSel} points={theirPoints} value={Math.floor(theirValue)} onRemoveCard={id=>toggleTheir(id)} onPointsChange={mode==='them'?null:setTheirPoints}/>
        <TradeSide label="YOU GIVE" color="#fb923c" cards={yourSel} points={yourPoints} value={Math.floor(yourValue)} onRemoveCard={id=>toggleYour(id)} onPointsChange={mode==='them'?null:setYourPoints} maxPoints={points}/>
      </div>
      <div style={{padding:'0 20px 6px'}}>
        <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:2,background:'rgba(255,255,255,0.3)'}}/>
          <div style={{position:'absolute',top:0,bottom:0,left:fairness>=0?'50%':`${50+fairness*50}%`,right:fairness>=0?`${50-Math.min(fairness*50,50)}%`:'50%',background:Math.abs(fairness)<0.1?'#4ade80':(fairness>0?'#fb923c':'#f87171'),borderRadius:3,transition:'all 250ms'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#78716c',marginTop:4,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>
          <span>← FAVORS YOU</span>
          <span style={{color:Math.abs(fairness)<0.1?'#4ade80':'#a8a29e'}}>{Math.abs(fairness)<0.05?'FAIR DEAL':`${Math.abs(fairness*100).toFixed(0)}% ${fairness>0?'OVERPAY':'UNDERPAY'}`}</span>
          <span>FAVORS THEM →</span>
        </div>
      </div>
      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          <button onClick={()=>setTab('yours')} style={{padding:'6px 12px',borderRadius:8,border:tab==='yours'?'2px solid #fb923c':'2px solid transparent',background:tab==='yours'?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.04)',color:tab==='yours'?'#fb923c':'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            🦊 STEP 1: YOUR OFFER ({yourCardIds.length} selected)
          </button>
          <button onClick={()=>setTab('theirs')} style={{padding:'6px 12px',borderRadius:8,border:tab==='theirs'?`2px solid ${trader.color}`:'2px solid transparent',background:tab==='theirs'?`${trader.color}22`:'rgba(255,255,255,0.04)',color:tab==='theirs'?trader.color:'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            {trader.emoji} STEP 2: WHAT YOU WANT ({theirCardIds.length} selected)
          </button>
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
          {(tab==='yours'?ownedCards:trader.inventory).map(c=>{
            const sel = tab==='yours'?yourCardIds.includes(c.id):theirCardIds.includes(c.id);
            if(tab==='yours') return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleYour(c.id)}/>;
            return <MiniCard key={c.id} card={c} selected={sel} onClick={()=>toggleTheir(c.id)}/>;
          })}
        </div>
      </div>
      <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10,alignItems:'center'}}>
        <button onClick={()=>{setYourCardIds([]);setTheirCardIds([]);setYourPoints(0);setTheirPoints(0);}} style={{padding:'9px 14px',borderRadius:8,background:'rgba(255,255,255,0.04)',color:'#a8a29e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:6}}><RefreshCcw size={12}/>CLEAR</button>
        <div style={{flex:1}}/>
        <button onClick={send} style={{padding:'10px 22px',borderRadius:8,background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.12em',display:'flex',alignItems:'center',gap:6}}>{mode==='user'?'SEND OFFER':'ACCEPT'}<ArrowRight size={14}/></button>
      </div>
    </div>
  </div>;
}

/* FRIEND TRADE MODAL */
function FriendTradeModal({me,friend,onClose,onSend,onToast}){
  const [yourCardIds,setYourCardIds] = useState([]);
  const [theirCardIds,setTheirCardIds] = useState([]);
  const [yourPoints,setYourPoints] = useState(0);
  const [theirPoints,setTheirPoints] = useState(0);
  const [message,setMessage] = useState('');

  const yourSel = me.ownedCards.filter(c=>yourCardIds.includes(c.id));
  const theirSel = friend.ownedCards.filter(c=>theirCardIds.includes(c.id));
  const yourVal = yourSel.reduce((s,c)=>s+getCardValue(c),0) + yourPoints;
  const theirVal = theirSel.reduce((s,c)=>s+getCardValue(c),0) + theirPoints;
  const fairness = yourVal===0 && theirVal===0 ? 0 : (yourVal-theirVal)/Math.max(theirVal,1);

  const addYour = id => setYourCardIds(p=>p.includes(id)?p:([...p,id]));
  const removeYour = id => setYourCardIds(p=>p.filter(x=>x!==id));
  const addTheir = id => setTheirCardIds(p=>p.includes(id)?p:[...p,id]);
  const removeTheir = id => setTheirCardIds(p=>p.filter(x=>x!==id));

  const send = () => {
    if((yourSel.length===0 && yourPoints===0) || (theirSel.length===0 && theirPoints===0)){ onToast('BOTH SIDES NEED SOMETHING','err'); return; }
    if(yourPoints>me.points){ onToast('NOT ENOUGH POINTS','err'); return; }
    onSend({from:me.username, to:friend.username, give:yourSel, receive:theirSel, givePoints:yourPoints, receivePoints:theirPoints, message:message.trim()||null});
  };

  return <div style={{position:'fixed',inset:0,zIndex:150,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:720,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:`1px solid ${friend.color}55`,maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{padding:'18px 20px',background:`linear-gradient(180deg, ${friend.color}22, transparent)`,borderBottom:`1px solid ${friend.color}33`,display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:54,height:54,borderRadius:14,background:`${friend.color}33`,fontSize:30,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${friend.color}`}}>{friend.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:'#fff7ed',letterSpacing:'0.04em'}}>TRADE WITH {friend.displayName.toUpperCase()}</div>
          <div style={{fontSize:11.5,color:'#a8a29e',marginTop:2}}>{friend.ownedCards.length} cards · {friend.points.toLocaleString()} pts · they'll see this on next login</div>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'#a8a29e',cursor:'pointer',padding:4}}><X size={20}/></button>
      </div>
      <div style={{padding:'14px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <TradeSide label={`${friend.displayName.toUpperCase()} GIVES`} color={friend.color} cards={theirSel} points={theirPoints} value={Math.floor(theirVal)} onRemoveCard={id=>removeTheir(id)} onPointsChange={setTheirPoints}/>
        <TradeSide label="YOU GIVE" color="#fb923c" cards={yourSel} points={yourPoints} value={Math.floor(yourVal)} onRemoveCard={id=>removeYour(id)} onPointsChange={setYourPoints} maxPoints={me.points}/>
      </div>
      <div style={{padding:'0 20px 6px'}}>
        <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:2,background:'rgba(255,255,255,0.3)'}}/>
          <div style={{position:'absolute',top:0,bottom:0,left:fairness>=0?'50%':`${50+fairness*50}%`,right:fairness>=0?`${50-Math.min(fairness*50,50)}%`:'50%',background:Math.abs(fairness)<0.1?'#4ade80':(fairness>0?'#fb923c':'#f87171'),borderRadius:3,transition:'all 250ms'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#78716c',marginTop:4,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>
          <span>← FAVORS YOU</span>
          <span style={{color:Math.abs(fairness)<0.1?'#4ade80':'#a8a29e'}}>{Math.abs(fairness)<0.05?'FAIR DEAL':`${Math.abs(fairness*100).toFixed(0)}% ${fairness>0?'OVERPAY':'UNDERPAY'}`}</span>
          <span>FAVORS THEM →</span>
        </div>
      </div>
      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{fontSize:9,color:'#fb923c',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:'rgba(251,146,60,0.1)',borderRadius:6,textAlign:'center'}}>🦊 YOUR OFFER ({yourCardIds.length})</div>
          <div style={{fontSize:9,color:friend.color,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',padding:'5px 8px',background:friend.color+'18',borderRadius:6,textAlign:'center'}}>{friend.emoji} WHAT YOU WANT ({theirCardIds.length})</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {me.ownedCards.map(c=>{
              const sel=yourCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>sel?removeYour(c.id):addYour(c.id)}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?'#fb923c':'rgba(255,255,255,0.08)'),background:sel?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?'#fb923c':'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:'#fb923c'}}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:220,overflowY:'auto'}}>
            {friend.ownedCards.map(c=>{
              const sel=theirCardIds.includes(c.id);
              return(
                <button key={c.id} onPointerUp={()=>sel?removeTheir(c.id):addTheir(c.id)}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'5px 7px',borderRadius:7,border:'1px solid '+(sel?friend.color:'rgba(255,255,255,0.08)'),background:sel?friend.color+'22':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',width:'100%'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sel?friend.color:'#374151',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                    <div style={{fontSize:7,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{c.pps}/s · {c.rarity}</div>
                  </div>
                  {sel&&<span style={{fontSize:9,color:friend.color}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <input type="text" value={message} onChange={e=>setMessage(e.target.value)} placeholder={`Add a message to ${friend.displayName}…`} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"Outfit",sans-serif',fontSize:13,outline:'none'}}/>
      </div>
      <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10,alignItems:'center'}}>
        <button onClick={()=>{setYourCardIds([]);setTheirCardIds([]);setYourPoints(0);setTheirPoints(0);setMessage('');}} style={{padding:'9px 14px',borderRadius:8,background:'rgba(255,255,255,0.04)',color:'#a8a29e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:6}}><RefreshCcw size={12}/>CLEAR</button>
        <div style={{flex:1}}/>
        <button onClick={send} style={{padding:'10px 22px',borderRadius:8,background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.12em',display:'flex',alignItems:'center',gap:6}}>SEND OFFER<Send size={14}/></button>
      </div>
    </div>
  </div>;
}

/* PENDING TRADES MODAL */
function PendingTradesModal({me,allUsers,trades,onClose,onAccept,onReject}){
  const inbox = trades.filter(t=>t.to===me.username && t.status==='pending');
  const outbox = trades.filter(t=>t.from===me.username && t.status==='pending');
  const [tab,setTab] = useState('inbox');
  const [lastAction,setLastAction] = useState(null);
  const list = tab==='inbox' ? inbox : outbox;

  // Auto-close 7 seconds after the last accept/reject so the user sees the
  // result then naturally returns to the rest of the app. Resets if they
  // take another action; cleared if they close manually.
  useEffect(()=>{
    if(!lastAction) return;
    const t = setTimeout(onClose, 7000);
    return ()=>clearTimeout(t);
  },[lastAction,onClose]);

  const handleAccept = (trade) => { onAccept(trade); setLastAction(Date.now()); };
  const handleReject = (trade) => { onReject(trade); setLastAction(Date.now()); };

  return <div style={{position:'fixed',inset:0,zIndex:150,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:560,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(255,107,0,0.3)',maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{padding:'18px 20px',borderBottom:'1px solid rgba(255,107,0,0.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Inbox size={22} style={{color:'#fb923c'}}/>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,color:'#fff7ed',letterSpacing:'0.04em'}}>TRADE OFFERS</div>
            <div style={{fontSize:11,color:'#a8a29e'}}>{inbox.length} incoming · {outbox.length} pending out</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'#a8a29e',cursor:'pointer',padding:4}}><X size={20}/></button>
      </div>
      <div style={{display:'flex',padding:'12px 20px 0',gap:6}}>
        <button onClick={()=>setTab('inbox')} style={{padding:'6px 12px',borderRadius:6,border:'none',background:tab==='inbox'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='inbox'?'#fb923c':'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>INBOX ({inbox.length})</button>
        <button onClick={()=>setTab('outbox')} style={{padding:'6px 12px',borderRadius:6,border:'none',background:tab==='outbox'?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.04)',color:tab==='outbox'?'#fb923c':'#a8a29e',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',cursor:'pointer'}}>OUTBOX ({outbox.length})</button>
      </div>
      <div style={{padding:'14px 20px 20px',display:'flex',flexDirection:'column',gap:10}}>
        {list.length===0 && <div style={{padding:'40px 20px',textAlign:'center',color:'#52525b',fontStyle:'italic'}}>{tab==='inbox'?'No pending offers. Quiet day.':'You haven\'t sent any offers.'}</div>}
        {list.map(trade=>{
          const otherUser = allUsers[tab==='inbox'?trade.from:trade.to];
          return <div key={trade.id} style={{padding:14,borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${otherUser?.color||'#444'}33`}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:`${otherUser?.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,border:`1px solid ${otherUser?.color}`}}>{otherUser?.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:15,color:'#fff7ed',letterSpacing:'0.04em'}}>{tab==='inbox'?`${otherUser?.displayName.toUpperCase()} → YOU`:`YOU → ${otherUser?.displayName.toUpperCase()}`}</div>
                <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{new Date(trade.sentAt).toLocaleString()}</div>
              </div>
            </div>
            {trade.message && <div style={{padding:'8px 10px',borderRadius:6,background:'rgba(0,0,0,0.3)',color:'#d4d4d8',fontSize:12,fontStyle:'italic',marginBottom:10}}>"{trade.message}"</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div>
                <div style={{fontSize:9,color:otherUser?.color,letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>{tab==='inbox'?'THEY GIVE':'YOU GAVE'}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {trade.give.map(c=><MiniCard key={c.id} card={c}/>)}
                  {trade.givePoints>0 && <div style={{padding:'4px 8px',borderRadius:6,background:'rgba(251,146,60,0.15)',color:'#fdba74',fontSize:10,fontFamily:'"JetBrains Mono",monospace',alignSelf:'center'}}>+{trade.givePoints.toLocaleString()} PTS</div>}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,color:'#fb923c',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>{tab==='inbox'?'YOU GIVE':'THEY GIVE'}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {trade.receive.map(c=><MiniCard key={c.id} card={c}/>)}
                  {trade.receivePoints>0 && <div style={{padding:'4px 8px',borderRadius:6,background:'rgba(251,146,60,0.15)',color:'#fdba74',fontSize:10,fontFamily:'"JetBrains Mono",monospace',alignSelf:'center'}}>+{trade.receivePoints.toLocaleString()} PTS</div>}
                </div>
              </div>
            </div>
            {tab==='inbox' && <div style={{display:'flex',gap:8,marginTop:12}}>
              <button onClick={()=>handleReject(trade)} style={{flex:1,padding:'8px',borderRadius:6,background:'rgba(248,113,113,0.1)',color:'#fca5a5',border:'1px solid rgba(248,113,113,0.3)',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em'}}>REJECT</button>
              <button onClick={()=>handleAccept(trade)} style={{flex:1,padding:'8px',borderRadius:6,background:'linear-gradient(135deg, #4ade80, #16a34a)',color:'#0a0a0a',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em'}}>ACCEPT</button>
            </div>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}

/* SPACE SCREEN */
const SPACE_STARS = Array.from({length:80}, () => ({
  top: Math.random()*100,
  left: Math.random()*100,
  size: 1 + Math.random()*2,
  delay: Math.random()*4
}));

function FeedAnimation({food,onDone}){
  React.useEffect(()=>{const t=setTimeout(onDone,1300);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"relative",width:180,height:120}}>
        <div style={{position:"absolute",left:70,top:50,fontSize:36,animation:"feed-bounce 0.7s ease-in-out"}}>{"🐾"}</div>
        <div style={{position:"absolute",left:100,top:35,fontSize:30,animation:"food-fly 1.2s ease-in-out forwards"}}>{food}</div>
        <div style={{position:"absolute",left:50,top:15,fontSize:16,fontWeight:700,color:"#4ade80",fontFamily:'"Bebas Neue",sans-serif',letterSpacing:"0.1em",animation:"nom-pop 1.2s ease-out forwards"}}>{"NOM!"}</div>
      </div>
    </div>
  );
}

function FoodScreen({me,onFeed,onHeal,onToast}){
  const [selCard,setSelCard]=useState(null);
  const [selFood,setSelFood]=useState(null);
  const [selVet,setSelVet]=useState(null);
  const [mode,setMode]=useState('food');
  const [feedAnim,setFeedAnim]=useState(null);
  const cards=me.ownedCards||[];
  const foodInv=me.foodInventory||{};
  const vetInv=me.vetInventory||{};
  const getHunger=c=>(me.cardHunger&&me.cardHunger[c.id])??100;
  const getInjury=c=>me.cardInjury&&me.cardInjury[c.id];
  const hCol=h=>h>60?'#4ade80':h>30?'#fbbf24':'#ef4444';
  const doFeed=()=>{
    if(!selCard||!selFood)return;
    if(!(foodInv[selFood]>0)){onToast('No '+selFood+' left!','err');return;}
    const fi=FOOD_ITEMS.find(function(f){return f.id===selFood;});
    onFeed(selCard.id,selFood);setSelFood(null);setSelCard(null);
    if(fi){setFeedAnim(fi.emoji);}
  };
  const doHeal=()=>{
    if(!selCard||!selVet)return;
    if(!(vetInv[selVet]>0)){onToast('No vet packs!','err');return;}
    if(!getInjury(selCard)){onToast('Not injured!','err');return;}
    onHeal(selCard.id,selVet);setSelVet(null);setSelCard(null);
  };
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <>
    {feedAnim&&<FeedAnimation food={feedAnim} onDone={function(){setFeedAnim(null);}}/>}
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#4ade80',letterSpacing:'0.08em',margin:'0 0 4px'}}>FEED & CARE</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 14px',...mono}}>Select an animal then choose food or vet pack</p>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['food','vet'].map(m=>(
          <button key={m} onClick={()=>{setMode(m);setSelFood(null);setSelVet(null);}}
            style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:mode===m?'rgba(74,222,128,0.2)':'rgba(255,255,255,0.05)',color:mode===m?'#4ade80':'#78716c',...t,fontSize:14,letterSpacing:'0.1em',cursor:'pointer'}}>
            {m==='food'?'FOOD':'VET PACKS'}
          </button>
        ))}
      </div>
      <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>SELECT ANIMAL</div>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
        {cards.map(c=>{
          const h=getHunger(c);const inj=getInjury(c);const sel=selCard&&selCard.id===c.id;
          return(
            <button key={c.id} onClick={()=>setSelCard(sel?null:c)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#4ade80':'rgba(255,255,255,0.08)'),background:sel?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🐾</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.05em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.first} {c.last}</div>
                {inj&&<div style={{fontSize:9,color:'#f87171',...mono}}>⚠ {INJURY_STATES[inj]}</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:9,color:'#78716c',...mono}}>HUNGER</div>
                <div style={{fontSize:13,fontWeight:700,color:hCol(h),...mono}}>{h}%</div>
                <div style={{width:48,height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,marginTop:2}}>
                  <div style={{width:h+'%',height:'100%',background:hCol(h),borderRadius:2}}/>
                </div>
              </div>
            </button>
          );
        })}
        {cards.length===0&&<div style={{padding:'20px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No animals yet.</div>}
      </div>
      {mode==='food'&&(
        <div>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>CHOOSE FOOD (YOUR STOCK)</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {FOOD_ITEMS.map(f=>{
              const qty=foodInv[f.id]||0;const sel=selFood===f.id;
              return(
                <button key={f.id} onClick={()=>qty>0&&setSelFood(sel?null:f.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#4ade80':qty>0?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)'),background:sel?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',cursor:qty>0?'pointer':'default',opacity:qty>0?1:0.4,textAlign:'left'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{f.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{f.label}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>{f.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:qty>0?'#4ade80':'#52525b',...mono,fontWeight:700}}>x{qty}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>+{f.basePct}%</div>
                  </div>
                </button>
              );
            })}
          </div>
          {selCard&&selFood&&(
            <button onClick={doFeed} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#4ade80,#22c55e)',color:'#052e16',...t,fontSize:18,letterSpacing:'0.1em',cursor:'pointer'}}>
              FEED {selCard.first.toUpperCase()} {selCard.last.toUpperCase()}
            </button>
          )}
        </div>
      )}
      {mode==='vet'&&(
        <div>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:6}}>CHOOSE VET PACK</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {VET_PACK_ITEMS.map(v=>{
              const qty=vetInv[v.id]||0;const sel=selVet===v.id;
              return(
                <button key={v.id} onClick={()=>qty>0&&setSelVet(sel?null:v.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,border:'1px solid '+(sel?'#34d399':qty>0?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)'),background:sel?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)',cursor:qty>0?'pointer':'default',opacity:qty>0?1:0.4,textAlign:'left'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{v.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{v.label}</div>
                    <div style={{fontSize:9,color:'#78716c',...mono}}>{v.desc}</div>
                  </div>
                  <div style={{fontSize:11,color:qty>0?'#34d399':'#52525b',...mono,fontWeight:700,flexShrink:0}}>x{qty}</div>
                </button>
              );
            })}
          </div>
          {selCard&&selVet&&getInjury(selCard)&&(
            <button onClick={doHeal} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#34d399,#059669)',color:'#052e16',...t,fontSize:18,letterSpacing:'0.1em',cursor:'pointer'}}>
              HEAL {selCard.first.toUpperCase()} {selCard.last.toUpperCase()}
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}

function TravelScreen({me,onSendExpedition,onCollectExpedition,onToast}){
  const cards=me.ownedCards||[];
  const expeditions=me.expeditions||{};
  const [,tick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>tick(n=>n+1),1000);return()=>clearInterval(t);},[]);
  const now=Date.now();
  const getInjury=c=>me.cardInjury&&me.cardInjury[c.id];
  const getHunger=c=>(me.cardHunger&&me.cardHunger[c.id])??100;
  const away=c=>{const e=expeditions[c.id];return e&&e.returnAt>now;};
  const ready=c=>{const e=expeditions[c.id];return e&&e.returnAt<=now&&!e.collected;};
  const tl=c=>{const e=expeditions[c.id];if(!e)return null;const ms=e.returnAt-now;if(ms<=0)return'00:00';const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+(s%60).toString().padStart(2,'0');};
  const me2={wood:'🪵',stone:'🪨',glass:'🔷',brick:'🧱'};
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#c4b5fd',letterSpacing:'0.08em',margin:'0 0 4px'}}>EXPEDITIONS</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 8px',...mono}}>Send animals to gather shelter materials</p>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TRAVEL_MATERIALS.map(m=>(
          <div key={m} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:99,background:'rgba(255,255,255,0.06)',fontSize:11,color:'#a8a29e',...mono}}>
            <span>{me2[m]}</span>
            <span style={{fontWeight:700,color:'#fff7ed'}}>{(me.materials||{})[m]||0}</span>
            <span style={{fontSize:9,color:'#78716c',textTransform:'uppercase'}}> {m}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {cards.map(c=>{
          const a=away(c);const r=ready(c);const inj=getInjury(c);const h=getHunger(c);const exp=expeditions[c.id];
          return(
            <div key={c.id} style={{padding:'12px',borderRadius:12,border:'1px solid '+(r?'rgba(196,181,253,0.5)':a?'rgba(196,181,253,0.2)':'rgba(255,255,255,0.08)'),background:r?'rgba(196,181,253,0.06)':'rgba(255,255,255,0.02)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🐾</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'#fff7ed',...t,letterSpacing:'0.05em'}}>{c.first} {c.last}</div>
                  {inj&&<div style={{fontSize:9,color:'#f87171',...mono}}>⚠ {INJURY_STATES[inj]}</div>}
                  {!inj&&h<30&&<div style={{fontSize:9,color:'#fbbf24',...mono}}>⚠ Very hungry</div>}
                </div>
                <div style={{flexShrink:0}}>
                  {a&&!r&&<div style={{textAlign:'center'}}><div style={{fontSize:9,color:'#78716c',...mono}}>RETURNS IN</div><div style={{fontSize:16,color:'#c4b5fd',...mono,fontWeight:700}}>{tl(c)}</div></div>}
                  {r&&<button onClick={()=>onCollectExpedition(c.id)} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#c4b5fd,#a78bfa)',color:'#1e1b4b',...t,fontSize:13,letterSpacing:'0.08em',cursor:'pointer'}}>COLLECT</button>}
                  {!a&&!r&&<button onClick={()=>{if(inj){onToast('Heal first!','err');return;}if(h<10){onToast('Feed first!','err');return;}onSendExpedition(c.id);}} style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(196,181,253,0.3)',background:'rgba(196,181,253,0.08)',color:'#c4b5fd',...t,fontSize:13,letterSpacing:'0.08em',cursor:'pointer'}}>SEND</button>}
                </div>
              </div>
              {r&&exp&&exp.reward&&(
                <div style={{marginTop:8,padding:'6px 10px',borderRadius:8,background:'rgba(196,181,253,0.1)',display:'flex',gap:10,flexWrap:'wrap'}}>
                  <div style={{fontSize:9,color:'#c4b5fd',...mono,width:'100%',marginBottom:2}}>REWARD READY:</div>
                  {Object.entries(exp.reward).map(([m,q])=>q>0&&<div key={m} style={{fontSize:12,color:'#fff7ed',...mono}}>{me2[m]} +{q} {m}</div>)}
                  {exp.injured&&<div style={{fontSize:11,color:'#f87171',...mono,width:'100%'}}>Returned injured!</div>}
                </div>
              )}
            </div>
          );
        })}
        {cards.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No animals to send yet.</div>}
      </div>
    </div>
  );
}

function ShelterScreen({me,onBuildShelter,onToast,onAssignAnimal}){
  const [selSize,setSelSize]=useState(null);
  const mats=me.materials||{};
  const ghs=me.shelters||[];
  const me2={wood:'🪵',stone:'🪨',glass:'🔷',brick:'🧱'};
  const mc={wood:'#fb923c',stone:'#94a3b8',glass:'#67e8f9',brick:'#f87171'};
  const canAfford=sz=>['wood','stone','glass','brick'].every(k=>(mats[k]||0)>=SHELTER_SIZES[sz][k]);
  const doBuild=()=>{if(!selSize)return;if(!canAfford(selSize)){onToast('Not enough materials!','err');return;}onBuildShelter(selSize);setSelSize(null);};
  const t={fontFamily:'"Bebas Neue",sans-serif'};
  const mono={fontFamily:'"JetBrains Mono",monospace'};
  return(
    <div style={{padding:'16px 12px 120px',maxWidth:520,margin:'0 auto'}}>
      <h2 style={{...t,fontSize:28,color:'#86efac',letterSpacing:'0.08em',margin:'0 0 4px'}}>SHELTER</h2>
      <p style={{fontSize:11,color:'#78716c',margin:'0 0 12px',...mono}}>Build with expedition materials</p>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {TRAVEL_MATERIALS.map(m=>(
          <div key={m} style={{flex:1,minWidth:60,padding:'8px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',textAlign:'center'}}>
            <div style={{fontSize:20,marginBottom:2}}>{me2[m]}</div>
            <div style={{fontSize:16,fontWeight:700,color:mc[m],...mono}}>{mats[m]||0}</div>
            <div style={{fontSize:8,color:'#78716c',textTransform:'uppercase',letterSpacing:'0.1em'}}>{m}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>BUILD NEW SHELTER</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
        {Object.entries(SHELTER_SIZES).map(([key,sz])=>{
          const can=canAfford(key);const sel=selSize===key;
          return(
            <button key={key} onClick={()=>can&&setSelSize(sel?null:key)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:'1px solid '+(sel?'#86efac':can?'rgba(134,239,172,0.25)':'rgba(255,255,255,0.06)'),background:sel?'rgba(134,239,172,0.1)':'rgba(255,255,255,0.02)',cursor:can?'pointer':'default',opacity:can?1:0.5,textAlign:'left'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(134,239,172,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🌿</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz.label} — {sz.desc}</div>
                <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
                  {['wood','stone','glass','brick'].map(m=><span key={m} style={{fontSize:9,color:(mats[m]||0)>=sz[m]?mc[m]:'#ef4444',...mono}}>{me2[m]}{sz[m]} {m}</span>)}
                </div>
              </div>
              <div style={{fontSize:11,color:'#86efac',...mono,flexShrink:0}}>+{sz.eco}/s</div>
            </button>
          );
        })}
      </div>
      {selSize&&canAfford(selSize)&&(
        <button onClick={doBuild} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#86efac,#22c55e)',color:'#052e16',...t,fontSize:20,letterSpacing:'0.1em',cursor:'pointer',marginBottom:20}}>
          BUILD {SHELTER_SIZES[selSize].label} SHELTER
        </button>
      )}
      {ghs.length>0&&(
        <>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>YOUR SHELTERS ({ghs.length})</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {ghs.map((gh,i)=>{const sz=SHELTER_SIZES[gh.size];return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,border:'1px solid rgba(134,239,172,0.2)',background:'rgba(134,239,172,0.04)'}}>
                <span style={{fontSize:24}}>🌿</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz&&sz.label||gh.size} SHELTER</div>
                  <div style={{fontSize:9,color:'#78716c',...mono}}>Built {new Date(gh.builtAt).toLocaleDateString()}</div>
                </div>
                <div style={{fontSize:11,color:'#86efac',...mono}}>+{sz&&sz.eco||0}/s</div>
              </div>
            );})}
          </div>
        </>
      )}
      {ghs.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#52525b',fontSize:12,fontStyle:'italic'}}>No shelters yet. Go on expeditions to gather materials!</div>}
      {ghs.length>0&&(
        <div style={{marginTop:16}}>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.15em',...mono,marginBottom:8}}>ASSIGN ANIMALS TO SHELTERS</div>
          {ghs.map(function(gh,gi){
            var sz=SHELTER_SIZES[gh.size];
            var assigned=(gh.animals||[]);
            var slots=sz?sz.slots:4;
            var cards=me.ownedCards||[];
            return(
              <div key={gi} style={{marginBottom:14,padding:'12px',borderRadius:12,border:'1px solid rgba(134,239,172,0.2)',background:'rgba(134,239,172,0.03)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{fontSize:12,color:'#fff7ed',...t,letterSpacing:'0.06em'}}>{sz&&sz.label} SHELTER</div>
                  <div style={{fontSize:10,color:'#86efac',...mono}}>{assigned.length}/{slots} ANIMALS</div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  {assigned.map(function(aid){
                    var ac=cards.find(function(c){return c.id===aid;});
                    return ac?(
                      <div key={aid} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:8,background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.25)'}}>
                        <span style={{fontSize:11,color:'#86efac',...mono}}>{ac.first} {ac.last}</span>
                        <button onClick={function(){onAssignAnimal(gi,aid,false);}} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:12,padding:'0 0 0 4px',lineHeight:1}}>x</button>
                      </div>
                    ):null;
                  })}
                  {assigned.length<slots&&onAssignAnimal&&(
                    <select onChange={function(e){if(e.target.value){onAssignAnimal(gi,e.target.value,true);e.target.value='';}}} style={{padding:'3px 8px',borderRadius:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(134,239,172,0.4)',color:'#fff7ed',fontSize:11,...mono,cursor:'pointer'}}>
                      <option value=''>+ Add animal</option>
                      {cards.filter(function(c){return!ghs.some(function(g){return(g.animals||[]).includes(c.id);});}).map(function(c){
                        return(<option key={c.id} value={c.id}>{c.first} {c.last} ({c.rarity})</option>);
                      })}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SpaceScreen({me, users, setUsers, currentUsername, onBack, onOpenPack, onSpinRoulette}){
  const [loc, setLoc] = useState('earth');
  const [launching, setLaunching] = useState(false);
  const [warning, setWarning] = useState(null);

  const spendPoints = (n) => {
    /* setUsers removed - was crashing */
  };

  const showWarn = (msg) => { setWarning(msg); setTimeout(()=>setWarning(null), 2400); };

  const tryTravel = (dest, cost) => {
    if (cost > me.points) { showWarn('Need ' + cost.toLocaleString() + ' pts'); return; }
    if (cost > 0) spendPoints(cost);
    setLoc(dest);
  };

  const launch = () => {
    setLaunching(true);
    setTimeout(() => { setLoc('atmosphere'); setLaunching(false); }, 2200);
  };

  const fmt = (n) => n >= 1000000 ? (n/1000000) + 'M' : (n >= 1000 ? (n/1000) + 'K' : n);

  const stars = SPACE_STARS.map((s,i) =>
    <div key={i} style={{position:'absolute',top:s.top+'%',left:s.left+'%',width:s.size,height:s.size,borderRadius:'50%',background:'#fff',animation:'twinkle 3s ease-in-out '+s.delay+'s infinite',opacity:0.6,pointerEvents:'none'}}/>
  );

  const destBtn = (label, cost, icon, opts) => {
    const locked = opts && opts.locked;
    const canAfford = !locked && me.points >= cost;
    const onClick = locked
      ? () => showWarn(label + ' coming soon!')
      : (canAfford ? () => tryTravel(opts.dest, cost) : () => showWarn('Need ' + cost.toLocaleString() + ' pts'));
    return <button onClick={onClick} style={{padding:'9px 12px',borderRadius:14,border:'2px solid '+(locked?'rgba(168,85,247,0.25)':(canAfford?'rgba(251,191,36,0.55)':'rgba(220,38,38,0.45)')),background:locked?'rgba(15,10,30,0.7)':'rgba(20,15,40,0.85)',color:'#fff7ed',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,fontFamily:'"Outfit",sans-serif',backdropFilter:'blur(6px)',minWidth:84}}>
      <div style={{fontSize:22,lineHeight:1}}>{locked ? '🔒' : icon}</div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.14em'}}>{label}</div>
      <div style={{fontSize:9,color:locked?'#a8a29e':(canAfford?'#fbbf24':'#dc2626'),fontWeight:700,letterSpacing:'0.1em',fontFamily:'"JetBrains Mono",monospace'}}>{cost===0 ? 'FREE' : fmt(cost) + ' PTS'}</div>
    </button>;
  };

  const bg = loc==='asteroids' ? 'linear-gradient(180deg, #0a0414 0%, #2d1810 50%, #4a1a0a 100%)'
    : loc==='moon' ? 'linear-gradient(180deg, #050410 0%, #14163b 50%, #2a2a4a 100%)'
    : 'linear-gradient(180deg, #050314 0%, #0a0820 40%, #1a0f3d 100%)';

  return <div style={{position:'relative',width:'100%',minHeight:'66vh',borderRadius:18,overflow:'hidden',background:bg,border:'1px solid rgba(124,58,237,0.3)',boxShadow:'0 8px 40px rgba(0,0,0,0.6)'}}>
    {stars}

    {warning && <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',padding:'8px 14px',borderRadius:10,background:'rgba(220,38,38,0.92)',color:'#fff',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',fontSize:11,zIndex:50,whiteSpace:'nowrap'}}>{warning}</div>}

    {loc === 'earth' && <>
      <button onClick={launch} disabled={launching} style={{position:'absolute',top:24,left:'50%',transform:'translateX(-50%)',padding:'14px 36px',borderRadius:50,border:'none',background:launching?'rgba(120,80,40,0.6)':'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',fontSize:24,letterSpacing:'0.18em',cursor:launching?'wait':'pointer',boxShadow:'0 8px 28px rgba(255,107,0,0.55)',zIndex:10,animation:launching?'none':'pulse-glow 2s ease-in-out infinite'}}>{launching ? '🚀 LAUNCHING' : '↑ UP'}</button>

      <div style={{position:'absolute',bottom:'-65%',left:'-30%',right:'-30%',aspectRatio:'1',borderRadius:'50%',background:'radial-gradient(circle at 35% 30%, #4ade80 0%, #16a34a 18%, #1e40af 38%, #1e3a8a 65%, #0c0a1f 100%)',boxShadow:'inset 0 30px 60px rgba(255,255,255,0.08), 0 0 100px rgba(59,130,246,0.4)',zIndex:1}}/>

      <div style={{position:'absolute',bottom:'40%',left:'50%',transform:'translateX(-50%)',zIndex:5}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,animation:launching?'rocket-launch 2.2s cubic-bezier(.4,.0,.7,1) forwards':'rocket-bob 2.6s ease-in-out infinite'}}>
          <div style={{padding:'6px 12px',borderRadius:14,background:'rgba(255,255,255,0.95)',color:'#0a0a0a',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',fontSize:12,position:'relative',whiteSpace:'nowrap'}}>READY?<div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'7px solid #fff'}}/></div>
          <div style={{fontSize:46,lineHeight:1}}>🚀</div>
        </div>
      </div>

      <button onClick={onBack} style={{position:'absolute',bottom:14,left:14,padding:'8px 12px',borderRadius:50,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(0,0,0,0.6)',color:'#e7e5e4',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.14em',fontSize:10,cursor:'pointer',zIndex:10}}>← HOME</button>
    </>}

    {loc === 'atmosphere' && <>
      <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',zIndex:5}}>{destBtn('UP', 10000000, '↑', {locked:true})}</div>
      <div style={{position:'absolute',top:'44%',left:12,transform:'translateY(-50%)',zIndex:5}}>{destBtn('WEST', 10000000, '←', {locked:true})}</div>
      <div style={{position:'absolute',top:'44%',right:12,transform:'translateY(-50%)',zIndex:5}}>{destBtn('EAST', 10000000, '→', {locked:true})}</div>
      <div style={{position:'absolute',top:'22%',left:'24%',zIndex:5}}>{destBtn('ASTEROIDS', 5000, '💥', {dest:'asteroids'})}</div>
      <div style={{position:'absolute',top:'18%',right:'22%',zIndex:5}}>{destBtn('MOON', 11000, '🌕', {dest:'moon'})}</div>

      <div style={{position:'absolute',bottom:'27%',left:'50%',transform:'translateX(-50%)',textAlign:'center',zIndex:5}}>
        <div style={{padding:'3px 10px',borderRadius:50,background:'rgba(251,191,36,0.18)',border:'1px solid rgba(251,191,36,0.5)',color:'#fbbf24',fontSize:9,letterSpacing:'0.22em',fontFamily:'"JetBrains Mono",monospace',display:'inline-block'}}>YOU ARE HERE</div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,letterSpacing:'0.18em',color:'#fff7ed',marginTop:5}}>ATMOSPHERE</div>
        <div style={{fontSize:9,color:'#a8a29e',letterSpacing:'0.2em',fontFamily:'"JetBrains Mono",monospace'}}>FREE TO HOVER</div>
        <div style={{marginTop:4,fontSize:28,animation:'rocket-bob 2.4s ease-in-out infinite'}}>🚀</div>
      </div>

      <div style={{position:'absolute',bottom:'-40%',left:'-25%',right:'-25%',aspectRatio:'2.5',borderTopLeftRadius:'50%',borderTopRightRadius:'50%',background:'linear-gradient(180deg, #1e40af 0%, #1e3a8a 40%, #0c0a1f 100%)',zIndex:1,opacity:0.85}}/>

      <button onClick={()=>showWarn('MINIGAMES COMING SOON')} style={{position:'absolute',bottom:14,left:14,padding:'8px 12px',borderRadius:50,border:'1px solid rgba(168,85,247,0.4)',background:'rgba(40,20,60,0.85)',color:'#c4b5fd',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.12em',fontSize:10,cursor:'pointer',zIndex:10}}>🎮 MINIGAME</button>
      <button onClick={onBack} style={{position:'absolute',bottom:14,right:14,padding:'8px 12px',borderRadius:50,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(0,0,0,0.6)',color:'#e7e5e4',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.14em',fontSize:10,cursor:'pointer',zIndex:10}}>🏠 HOME</button>
    </>}

    {(loc === 'asteroids' || loc === 'moon') && (() => {
      const m = loc === 'moon';
      const accent = m ? '#c4b5fd' : '#fbbf24';
      const title = m ? 'LUNA' : 'ASTEROID BELT';
      const blurb = m ? 'Lunar visitors trade strange new packs' : 'Asteroid miners deal in cosmic cards';
      const packs = m ? ['METEROID PACK','MOON PACK'] : ['FIREBALL','ROCKY','SMASH'];
      const cardTypes = m ? ['🌕 FULL MOON','🌗 HALF MOON','🌙 CRESCENT MOON'] : ['🔥 FIREBALL','🪨 ROCKY','💥 SMASH'];
      const bigIcon = m ? '🌕' : '☄️';
      return <div style={{position:'relative',padding:'18px 16px 64px',zIndex:5,textAlign:'center'}}>
        <div style={{fontSize:54,marginBottom:6,filter:'drop-shadow(0 4px 20px '+accent+'88)'}}>{bigIcon}</div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:26,letterSpacing:'0.22em',color:'#fff7ed'}}>{title}</div>
        <div style={{fontSize:11,color:'#a8a29e',letterSpacing:'0.14em',marginBottom:14,fontFamily:'"JetBrains Mono",monospace'}}>{blurb}</div>

        <div style={{padding:'10px 14px',borderRadius:14,background:'rgba(20,15,40,0.85)',border:'1px dashed '+accent+'55',marginBottom:12,backdropFilter:'blur(6px)'}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.16em',color:accent,marginBottom:6}}>👽 ALIEN TRADERS</div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,padding:'10px',borderRadius:10,background:'rgba(0,0,0,0.45)'}}>
              <div style={{fontSize:34,filter:'drop-shadow(0 4px 8px '+accent+'66)'}}>{m?'🛸':'👽'}</div>
              <div style={{textAlign:'left',flex:1,minWidth:0}}>
                <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:15,color:'#fff7ed',letterSpacing:'0.1em'}}>{m?'SELENE':'ZYLGOR'}</div>
                <div style={{fontSize:9,color:accent,letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace'}}>{m?'LUNAR MERCHANT':'COSMIC GAMBLER'}</div>
                <div style={{fontSize:10,color:'#d6d3d1',marginTop:2,fontFamily:'"Outfit",sans-serif'}}>{m?'One spin, one random moon card':'One spin, one random asteroid card'}</div>
              </div>
            </div>
            <button onClick={()=>onSpinRoulette(m?'moon_alien':'asteroid_alien')} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid '+accent+'88',background:'linear-gradient(135deg, '+accent+'44, '+accent+'11)',color:accent,cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.16em',marginTop:8}}>🎰 SPIN ROULETTE · {(m?25000:10000).toLocaleString()} PTS</button>
          <div style={{fontSize:11,color:'#d6d3d1',fontFamily:'"Outfit",sans-serif'}}>Strange new collectors await — trading coming soon</div>
        </div>

        <div style={{padding:'10px 14px',borderRadius:14,background:'rgba(20,15,40,0.85)',border:'1px dashed '+accent+'55',marginBottom:12,backdropFilter:'blur(6px)'}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.16em',color:accent,marginBottom:8}}>📦 EXCLUSIVE PACKS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
            {(m ? [{id:'meteroid',name:'METEROID',cost:12000,count:2},{id:'moon',name:'MOON',cost:50000,count:5}] : [{id:'fireball',name:'FIREBALL',cost:8000,count:3},{id:'rocky',name:'ROCKY',cost:15000,count:3},{id:'smash',name:'SMASH',cost:30000,count:5}]).map(p => { const aff = me.points >= p.cost; return <button key={p.id} disabled={!aff} onClick={()=>onOpenPack(p.id, p.count)} style={{padding:'10px 14px',borderRadius:12,border:'1px solid '+accent+'66',background:aff?'rgba(0,0,0,0.5)':'rgba(60,60,60,0.3)',color:aff?accent:'#666',cursor:aff?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,minWidth:200,opacity:aff?1:0.55}}><span>{p.name} <span style={{fontSize:9,opacity:0.7}}>· {p.count}c</span></span><span style={{fontSize:11,opacity:0.9,fontFamily:'"JetBrains Mono",monospace'}}>{p.cost.toLocaleString()}</span></button>; })}
          </div>

        </div>

        <div style={{padding:'10px 14px',borderRadius:14,background:'rgba(20,15,40,0.85)',border:'1px dashed '+accent+'55',backdropFilter:'blur(6px)'}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.16em',color:accent,marginBottom:8}}>✨ NEW CARD TIERS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
            {cardTypes.map(t => <span key={t} style={{padding:'4px 10px',borderRadius:50,border:'1px solid '+accent+'66',background:'rgba(0,0,0,0.4)',color:'#fff7ed',fontFamily:'"Outfit",sans-serif',fontSize:11,fontWeight:600}}>{t}</span>)}
          </div>
        </div>

        <button onClick={()=>setLoc('atmosphere')} style={{position:'absolute',bottom:14,left:14,padding:'8px 12px',borderRadius:50,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(0,0,0,0.6)',color:'#e7e5e4',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.14em',fontSize:10,cursor:'pointer'}}>← ATMOSPHERE</button>
        <button onClick={onBack} style={{position:'absolute',bottom:14,right:14,padding:'8px 12px',borderRadius:50,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(0,0,0,0.6)',color:'#e7e5e4',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.14em',fontSize:10,cursor:'pointer'}}>🏠 HOME</button>
      </div>;
    })()}
  </div>;
}

/* ALIEN ROULETTE WHEEL */
function AlienRoulette({card, packType, accent, onClose, onAddCard, wheelPool, onFullMoon}){
  const [stage, setStage] = useState('idle');
  const [spinDeg, setSpinDeg] = useState(0);
  // wheelPool comes from props (handleSpinRoulette builds it from SPACE_POOL)

  useEffect(() => {
    setStage('spinning');
    const jitter = (Math.random() * 24) - 12;
    const t1 = setTimeout(() => setSpinDeg(6 * 360 + jitter), 60);
    const t2 = setTimeout(() => { setStage('won'); if(card && card.material === 'full_moon'){ onFullMoon && onFullMoon(card); } }, 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const slices = wheelPool.map((p, i) => {
    const startRad = (i * 36 - 18 - 90) * Math.PI / 180;
    const endRad = (i * 36 + 18 - 90) * Math.PI / 180;
    const x1 = 50 + 48 * Math.cos(startRad);
    const y1 = 50 + 48 * Math.sin(startRad);
    const x2 = 50 + 48 * Math.cos(endRad);
    const y2 = 50 + 48 * Math.sin(endRad);
    const path = 'M 50 50 L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A 48 48 0 0 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z';
    const fill = i % 2 === 0 ? '#1a0f3d' : '#0c0820';
    const labelRad = (i * 36 - 90) * Math.PI / 180;
    const labelX = 50 + 30 * Math.cos(labelRad);
    const labelY = 50 + 30 * Math.sin(labelRad);
    const labelRot = i * 36;
    return <g key={i}>
      <path d={path} fill={fill} fillOpacity={0.95} stroke="#fff7ed" strokeOpacity="0.35" strokeWidth="0.3"/>
      <g transform={'translate(' + labelX.toFixed(2) + ' ' + labelY.toFixed(2) + ') rotate(' + labelRot + ')'}>
        <text textAnchor="middle" fontFamily='"Bebas Neue",sans-serif' fontSize="5" fill='#fff7ed' y="-1" fontWeight="700">{p.number}</text>
        <text textAnchor="middle" fontFamily='"Bebas Neue",sans-serif' fontSize="2.8" fill={accent} y="3" letterSpacing="0.05">{p.last}</text>
      </g>
    </g>;
  });

  return <div style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.94)',backdropFilter:'blur(14px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',animation:'fade-in 200ms ease-out'}}>
    {stage !== 'won' && <>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,letterSpacing:'0.24em',color:accent,marginBottom:18,textShadow:'0 0 24px ' + accent}}>SPINNING THE WHEEL</div>
      <div style={{position:'relative',width:'min(86vw, 360px)',aspectRatio:'1'}}>
        <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'14px solid transparent',borderRight:'14px solid transparent',borderTop:'26px solid ' + accent,zIndex:2,filter:'drop-shadow(0 4px 10px ' + accent + ')'}}/>
        <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',transform:'rotate(' + spinDeg + 'deg)',transition:'transform 4s cubic-bezier(.16,.84,.24,1)',borderRadius:'50%',boxShadow:'0 0 80px ' + accent + 'aa, inset 0 0 30px rgba(0,0,0,0.6)'}}>
          {slices}
          <circle cx="50" cy="50" r="7" fill="#0c0907" stroke={accent} strokeWidth="1.2"/>
          <circle cx="50" cy="50" r="3" fill={accent}/>
        </svg>
      </div>
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'#a8a29e',letterSpacing:'0.18em',marginTop:18}}>{packType === 'moon_alien' ? 'SELENE SPINS THE FATES' : 'ZYLGOR SPINS THE WHEEL'}</div>
    </>}
    {stage === 'won' && <div style={{textAlign:'center',animation:'fade-in 400ms ease-out'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,letterSpacing:'0.24em',color:accent,marginBottom:18,textShadow:'0 0 36px ' + accent}}>YOU WON!</div>
      <div style={{padding:'28px 32px',borderRadius:20,background:'linear-gradient(135deg, ' + accent + '33, rgba(20,15,40,0.96))',border:'2px solid ' + accent,boxShadow:'0 0 60px ' + accent + '88, 0 12px 40px rgba(0,0,0,0.7)',marginBottom:22,minWidth:280,maxWidth:'90vw'}}>

        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:'#fff7ed',letterSpacing:'0.1em',marginTop:8}}>{card.first} {card.last}</div>
        <div style={{fontSize:11,color:'#a8a29e',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',marginTop:6}}>{card.team} | {(card.rarity || '').toUpperCase()}</div>
        {card.tag && <div style={{fontSize:10,color:accent,letterSpacing:'0.2em',marginTop:10,fontFamily:'"JetBrains Mono",monospace',fontStyle:'italic'}}>{card.tag}</div>}
      </div>
      <button onClick={() => { onAddCard([card]); onClose(); }} style={{padding:'14px 32px',borderRadius:50,border:'none',background:'linear-gradient(135deg, ' + accent + ', ' + accent + 'cc)',color:'#0c0907',fontFamily:'"Bebas Neue",sans-serif',fontSize:16,letterSpacing:'0.18em',cursor:'pointer',boxShadow:'0 10px 30px ' + accent + '88',fontWeight:700}}>+ ADD TO COLLECTION</button>
    </div>}
  </div>;
}

/* MOBILE FAB + NAV SHEET */
function MobileFAB({isOpen,onClick}){
  return <button className="mobile-fab" onClick={onClick} aria-label="Open menu" style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) rotate(${isOpen?45:0}deg)`,width:60,height:60,borderRadius:'50%',border:'none',background:'linear-gradient(135deg, #22c55e, #16a34a)',color:'#f0fdf4',cursor:'pointer',fontSize:34,fontWeight:200,lineHeight:1,boxShadow:'0 8px 24px rgba(74,222,128,0.4), 0 0 0 4px rgba(8,20,12,0.92)',zIndex:55,display:'none',alignItems:'center',justifyContent:'center',padding:0,transition:'transform 250ms cubic-bezier(.4,.0,.2,1)'}}>+</button>;
}

function MobileNavSheet({onClose,screen,setScreen,setLeaderboardOpen,refreshTrades,setInboxOpen,setMusicStoreOpen,inboxCount}){
  const go = (fn) => { fn(); onClose(); };
  const items = [
    {label:'HOME',sub:'ROSTER',Icon:Home,onPick:()=>go(()=>setScreen('home')),active:screen==='home'},
    {label:'SHOP',sub:'TRADE · BUY',Icon:Store,onPick:()=>go(()=>setScreen('shop')),active:screen==='shop'},
    {label:'COLLECT',sub:'DEEP DIVE',Icon:Library,onPick:()=>go(()=>setScreen('collection')),active:screen==='collection'},

    {label:'LEADERS',sub:'FAMILY RANKS',Icon:Trophy,color:'#fbbf24',onPick:()=>go(()=>setLeaderboardOpen(true))},
    {label:'TRAVEL',sub:'EXPEDITIONS',Icon:Rocket,color:'#c4b5fd',onPick:()=>go(()=>setScreen('travel')),active:screen==='travel'},
    {label:'FOOD',sub:'FEED · VET',Icon:Sparkles,color:'#4ade80',onPick:()=>go(()=>setScreen('food')),active:screen==='food'},
    {label:'SHELTER',sub:'BUILD',Icon:Sparkles,color:'#86efac',onPick:()=>go(()=>setScreen('shelter')),active:screen==='shelter'},
    {label:'DESIGN',sub:'MINT NEW',Icon:Palette,hero:true,onPick:()=>go(()=>setScreen('design')),active:screen==='design'},
    {label:'INBOX',sub:`${inboxCount} OFFERS`,Icon:Inbox,color:inboxCount>0?'#a855f7':null,onPick:()=>go(()=>{refreshTrades(); setInboxOpen(true);})},
  ];
  const renderBtn = (it,fullWidth) => {
    const accent = it.color || '#fb923c';
    const bg = it.active
      ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
      : (it.hero ? `linear-gradient(135deg, ${accent}33, ${accent}11)` : 'rgba(255,255,255,0.04)');
    const txt = it.active ? '#0a0a0a' : (it.hero ? accent : '#fff7ed');
    return <button key={it.label} onClick={it.onPick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:fullWidth?'14px 12px':'18px 12px',borderRadius:14,border:it.hero?`1px solid ${accent}55`:'1px solid rgba(255,255,255,0.06)',background:bg,color:txt,cursor:'pointer',fontFamily:'"Outfit",sans-serif',boxShadow:it.active?`0 6px 20px ${accent}55`:'none',gridColumn:fullWidth?'1 / -1':'auto'}}>
      <it.Icon size={fullWidth?20:24} strokeWidth={2.2}/>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:fullWidth?15:17,letterSpacing:'0.08em',lineHeight:1}}>{it.label}</div>
      <div style={{fontSize:9,letterSpacing:'0.16em',opacity:0.75,fontWeight:600,fontFamily:'"JetBrains Mono",monospace'}}>{it.sub}</div>
    </button>;
  };
  const music = {label:'MUSIC',sub:'TUNES · LIBRARY',Icon:Music,onPick:()=>go(()=>setMusicStoreOpen(true))};
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:54,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',animation:'fade-in 200ms ease-out'}}>
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(180deg, #1a0f0a, #0c0907)',borderTopLeftRadius:22,borderTopRightRadius:22,borderTop:'1px solid rgba(255,107,0,0.3)',padding:'14px 18px max(28px, env(safe-area-inset-bottom)) 18px',animation:'slide-up 280ms cubic-bezier(.2,.8,.2,1)',maxHeight:'82vh',overflowY:'auto'}}>
      <div style={{width:44,height:4,borderRadius:2,background:'rgba(255,255,255,0.2)',margin:'0 auto 14px'}}/>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#a8a29e',letterSpacing:'0.22em',textAlign:'center',marginBottom:14}}>MENU</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
        {items.map(it => renderBtn(it,false))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
        {renderBtn(music,true)}
      </div>
    </div>
  </div>;
}

/* LEADERBOARD MODAL */
function LeaderboardModal({users,currentUsername,onClose}){
  const rows = Object.values(users).map(u => {
    const pps = (u.ownedCards||[]).reduce((s,c)=>s + (c.pps||0)*(c.qty||1), 0);
    return {...u, pps};
  }).sort((a,b) => b.points - a.points);

  return <div style={{position:'fixed',inset:0,zIndex:150,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:520,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(251,191,36,0.4)',boxShadow:'0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(251,191,36,0.15)',maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{padding:'20px 22px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid rgba(251,191,36,0.25)',background:'linear-gradient(180deg, rgba(251,191,36,0.12), transparent)'}}>
        <Trophy size={26} style={{color:'#fbbf24'}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:26,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>LEADERBOARD</div>
          <div style={{fontSize:11,color:'#a8a29e',marginTop:3,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>FAMILY · RANKED BY POINTS</div>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'#a8a29e',cursor:'pointer',padding:4}}><X size={20}/></button>
      </div>
      <div style={{padding:'14px 18px 20px',display:'flex',flexDirection:'column',gap:8}}>
        {rows.map((u,i) => {
          const isMe = u.username === currentUsername;
          const rank = i+1;
          const medal = rank===1 ? '#fbbf24' : rank===2 ? '#d4d4d8' : rank===3 ? '#cd7f32' : '#52525b';
          return <div key={u.username} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:isMe?'linear-gradient(135deg, rgba(255,107,0,0.18), rgba(255,107,0,0.05))':'rgba(255,255,255,0.03)',border:isMe?'1px solid rgba(255,107,0,0.5)':`1px solid ${u.color}22`,boxShadow:isMe?'0 0 20px rgba(255,107,0,0.15)':'none'}}>
            <div style={{minWidth:34,height:34,borderRadius:'50%',background:`${medal}22`,border:`2px solid ${medal}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:medal,letterSpacing:'0.02em',flexShrink:0}}>{rank}</div>
            <div style={{width:38,height:38,borderRadius:10,background:`${u.color}33`,fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${u.color}`,flexShrink:0}}>{u.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:17,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1,display:'flex',alignItems:'center',gap:6}}>{u.displayName.toUpperCase()}{isMe && <span style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:'rgba(255,107,0,0.25)',color:'#fb923c',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>YOU</span>}</div>
              <div style={{fontSize:10,color:'#78716c',marginTop:3,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em'}}>{(u.ownedCards||[]).length} CARDS</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:18,fontWeight:800,color:'#fff7ed',lineHeight:1}}>{Math.floor(u.points).toLocaleString()}</div>
              <div style={{fontSize:10,color:'#4ade80',marginTop:4,fontFamily:'"JetBrains Mono",monospace',fontWeight:700,display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}><TrendingUp size={10}/>+{u.pps}/sec</div>
            </div>
          </div>;
        })}
      </div>
      <div style={{padding:'10px 22px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',fontSize:10,color:'#52525b',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.12em',textAlign:'center'}}>YOUR POINTS UPDATE LIVE · OTHERS SHOW LAST KNOWN TOTAL</div>
    </div>
  </div>;
}

/* USER MENU MODAL */
function UserMenuModal({me,allUsers,onClose,onSwitchUser,onLogout}){
  return <div style={{position:'fixed',inset:0,zIndex:150,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:380,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:`1px solid ${me.color}55`}}>
      <div style={{padding:'24px',display:'flex',alignItems:'center',gap:14,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{width:54,height:54,borderRadius:14,background:`${me.color}33`,fontSize:28,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${me.color}`}}>{me.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{me.displayName.toUpperCase()}</div>
          <div style={{fontSize:11,color:'#a8a29e',marginTop:5,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em'}}>{me.ownedCards.length} CARDS · {me.points.toLocaleString()} PTS</div>
        </div>
      </div>
      <div style={{padding:'18px 24px'}}>
        <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',marginBottom:10}}>SWITCH TO</div>
        {Object.values(allUsers).filter(u=>u.username!==me.username).map(u=>(
          <button key={u.username} onClick={()=>onSwitchUser(u.username)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 14px',marginBottom:8,borderRadius:10,background:`${u.color}1a`,border:`1px solid ${u.color}55`,cursor:'pointer',color:'#fff7ed',textAlign:'left'}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${u.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,border:`1px solid ${u.color}`}}>{u.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{u.displayName.toUpperCase()}</div>
              <div style={{fontSize:10,color:'#a8a29e',marginTop:3,fontFamily:'"JetBrains Mono",monospace'}}>{u.ownedCards.length} cards · {u.points.toLocaleString()} pts</div>
            </div>
            <ArrowRight size={14} style={{color:u.color}}/>
          </button>
        ))}
        <button onClick={onLogout} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:'12px',marginTop:6,borderRadius:10,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',color:'#fca5a5',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}><LogOut size={14}/>LOG OUT</button>
        <div style={{marginTop:14,padding:10,borderRadius:8,background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',fontSize:10.5,color:'#c4a3f0',textAlign:'center',fontStyle:'italic'}}>Friends can create accounts soon · for now play as Tyler or Carter</div>
      </div>
    </div>
  </div>;
}

/* GOAT PHOTOS — login screen face-off art.
   Embedded as WebP data URLs (~36KB total) so the artifact stays single-file.
   When this migrates to a real project, move these to /public and reference by URL. */
const LEBRON_PHOTO = "data:image/webp;base64,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";
const JORDAN_PHOTO = "data:image/webp;base64,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";

/* LOGIN SCREEN */
function GoatPickerScreen({me, onPickGoat}){
  const [hovered,setHovered] = useState(null);
  // The two legends, with their pose, colors, rings, lifetime stats, and nickname.
  const lebron = {
    id:'fox', name:'THE', last:'FOX', team:'FOREST', number:9, pose:'fadeaway',
    primary:'#7c2d12', accent:'#fb923c',
    rings:null, stats:{ pts:'45 KM/H', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },
    nickname:'SLY COLLECTOR',
  };
  const mj = {
    id:'wolf', name:'THE', last:'WOLF', team:'TUNDRA', number:6, pose:'jumpman',
    primary:'#0f4c39', accent:'#22d3ee',
    rings:null, stats:{ pts:'60 KM/H', ast:'LOYAL', reb:'BOLD', stl:'STRONG' },
    nickname:'PACK TRADER',
  };

  const PlayerSide = ({goat, side, isHovered, onHover, onLeave}) => {
    const Pose = POSE_PORTRAITS[goat.pose];
    return (
      <div onPointerUp={()=>onPickGoat(goat.id)} onMouseEnter={onHover} onMouseLeave={onLeave} style={{position:'relative',flex:1,minWidth:280,maxWidth:380,padding:'24px 22px 22px',borderRadius:18,background:`linear-gradient(${side==='left'?'135deg':'225deg'}, ${goat.primary} 0%, ${goat.primary}80 50%, #0c0907 110%)`,border:`2px solid ${goat.accent}`,boxShadow:isHovered?`0 30px 70px ${goat.accent}55, 0 0 60px ${goat.accent}40, inset 0 0 60px rgba(0,0,0,0.4)`:`0 12px 36px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.4)`,transition:'all 350ms cubic-bezier(.2,.8,.2,1)',transform:isHovered?'translateY(-6px)':'translateY(0)',overflow:'hidden',display:'flex',flexDirection:'column',cursor:'pointer'}}>
        {/* Sheen */}
        <div style={{position:'absolute',inset:0,borderRadius:17,background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.12) 55%, transparent 70%)',animation:isHovered?'sheen 1.8s ease-in-out infinite':'none',pointerEvents:'none'}}/>
        {/* number watermark removed */}
        {/* Header strip: name + rings */}
        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}}>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:34,letterSpacing:'0.04em',color:'#fff7ed',lineHeight:0.9}}>{goat.name}</div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:34,letterSpacing:'0.04em',color:goat.accent,lineHeight:0.9}}>{goat.last}</div>
            <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:'#fff7edcc',marginTop:6,letterSpacing:'0.18em'}}>{goat.team}</div>
          </div>

        </div>
        {/* Tagline */}
        <div style={{position:'relative',padding:'4px 10px',borderRadius:4,background:`${goat.accent}cc`,color:goat.primary,fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.15em',alignSelf:'flex-start',marginBottom:12,fontWeight:700}}>{goat.nickname}</div>
        {/* Stick-figure pose */}
        <div style={{position:'relative',flex:1,minHeight:260,maxHeight:300,display:'flex',alignItems:'center',justifyContent:'center',color:goat.accent,filter:`drop-shadow(0 12px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 18px ${goat.accent}55)`,marginBottom:14,pointerEvents:'none'}}>
          <div style={{width:'70%',height:'100%',transition:'transform 400ms',transform:isHovered?'scale(1.06)':'scale(1)'}}>
            <Pose color={goat.accent}/>
          </div>
        </div>
        {/* Stats block */}
        <div style={{position:'relative',padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.55)',border:`1px solid ${goat.accent}33`,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px'}}>
            <StatLine label="SPEED" value={goat.stats.pts} accent={goat.accent}/>
            <StatLine label="SKILL" value={goat.stats.ast} accent={goat.accent}/>
            <StatLine label="TRAIT" value={goat.stats.reb} accent={goat.accent}/>
            <StatLine label="POWER" value={goat.stats.stl} accent={goat.accent}/>
          </div>
        </div>
        {/* Single "PLAY AS [ME]" button — themed for the picked goat */}
        <button onPointerUp={()=>onPickGoat(goat.id)} style={{position:'relative',padding:'13px 16px',borderRadius:10,background:`linear-gradient(135deg, ${me.color}, ${me.color}cc)`,border:'none',color:'#0a0a0a',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:17,letterSpacing:'0.08em',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,boxShadow:isHovered?`0 6px 18px ${me.color}99`:`0 3px 10px ${me.color}66`,transition:'all 220ms',zIndex:10}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(2px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
          <span style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20,lineHeight:1}}>{me.emoji}</span>
            PLAY AS {me.displayName.toUpperCase()}
          </span>
          <ArrowRight size={16}/>
        </button>
      </div>
    );
  };

  return <div style={{minHeight:'100vh',width:'100%',background:`radial-gradient(ellipse at 30% 20%, rgba(10,80,40,0.35) 0%, transparent 50%),radial-gradient(ellipse at 70% 20%, rgba(15,110,86,0.25) 0%, transparent 50%),radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.1) 0%, transparent 60%),linear-gradient(180deg, #060f08, #030a05)`,padding:'28px 20px 32px',fontFamily:'"Outfit",sans-serif',display:'flex',flexDirection:'column',alignItems:'center'}}>
    {/* Header — the badge is the brand */}
    <div style={{textAlign:'center',marginBottom:14,display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#a8a29e',letterSpacing:'0.32em',marginBottom:10}}>WELCOME {me.displayName.toUpperCase()} · PICK YOUR SPIRIT ANIMAL</div>
      <LogoBadge size={200} accent="#fb923c" primary="#fff7ed"/>
    </div>
    {/* PLAY!! stamp */}
    <div style={{display:'inline-flex',alignItems:'center',gap:10,padding:'10px 28px',borderRadius:14,background:'linear-gradient(135deg, #22c55e, #15803d)',color:'#f0fdf4',fontFamily:'"Bebas Neue",sans-serif',fontSize:32,letterSpacing:'0.12em',boxShadow:'0 8px 28px rgba(74,222,128,0.4), inset 0 -3px 0 rgba(0,0,0,0.3)',marginBottom:10,transform:'rotate(-2deg)'}}>
      P · L · A · Y <span style={{fontSize:38,marginLeft:4}}>!!</span>
    </div>
    <div style={{fontSize:11,color:'#a8a29e',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',marginBottom:24}}>CHOOSE YOUR ECO SPIRIT</div>

    {/* GOAT face-off */}
    <div style={{position:'relative',display:'flex',gap:20,alignItems:'stretch',justifyContent:'center',flexWrap:'wrap',width:'100%',maxWidth:880,margin:'0 auto'}}>
      <PlayerSide goat={lebron} side="left" isHovered={hovered==='lebron'} onHover={()=>setHovered('lebron')} onLeave={()=>setHovered(null)}/>
      {/* VS badge — visible on wide screens */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:5,pointerEvents:'none'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #fff7ed, #c2410c 70%)',color:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Bebas Neue",sans-serif',fontSize:26,letterSpacing:'0.04em',boxShadow:'0 0 30px rgba(255,107,0,0.6), 0 4px 14px rgba(0,0,0,0.6)',border:'3px solid #fb923c',pointerEvents:'none'}}>VS</div>
      </div>
      <PlayerSide goat={mj} side="right" isHovered={hovered==='mj'} onHover={()=>setHovered('mj')} onLeave={()=>setHovered(null)}/>
    </div>
  </div>;
}

// Legacy LoginScreen — replaced by GoatPickerScreen + App.jsx auth flow.
// Kept for reference; not rendered anywhere.
function LoginScreen({users,onLogin,loading}){
  const [hovered,setHovered] = useState(null);
  // Hard-coded GOAT data per the design sketch
  const lebron = {
    id:'fox', name:'THE', last:'FOX', team:'FOREST', number:9, pose:'fadeaway',
    primary:'#7c2d12', accent:'#fb923c',
    rings:null, stats:{ pts:'45 KM/H', ast:'CUNNING', reb:'CLEVER', stl:'FAST' },
    nickname:'SLY COLLECTOR',
  };
  const mj = {
    id:'wolf', name:'THE', last:'WOLF', team:'TUNDRA', number:6, pose:'jumpman',
    primary:'#0f4c39', accent:'#22d3ee',
    rings:null, stats:{ pts:'60 KM/H', ast:'LOYAL', reb:'BOLD', stl:'STRONG' },
    nickname:'PACK TRADER',
  };
  // Tyler picks LeBron side (orange aura), Carter picks MJ side (purple aura)
  const tyler = users?.tyler;
  const carter = users?.carter;

  const PlayerSide = ({goat, side, isHovered, onHover, onLeave}) => {
    const Pose = POSE_PORTRAITS[goat.pose];
    const userList = [tyler, carter].filter(Boolean);
    return (
      <div onMouseEnter={onHover} onMouseLeave={onLeave} style={{position:'relative',flex:1,minWidth:280,maxWidth:380,padding:'24px 22px 22px',borderRadius:18,background:`linear-gradient(${side==='left'?'135deg':'225deg'}, ${goat.primary} 0%, ${goat.primary}80 50%, #0c0907 110%)`,border:`2px solid ${goat.accent}`,boxShadow:isHovered?`0 30px 70px ${goat.accent}55, 0 0 60px ${goat.accent}40, inset 0 0 60px rgba(0,0,0,0.4)`:`0 12px 36px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.4)`,transition:'all 350ms cubic-bezier(.2,.8,.2,1)',transform:isHovered?'translateY(-6px)':'translateY(0)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {/* Sheen */}
        <div style={{position:'absolute',inset:0,borderRadius:17,background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.12) 55%, transparent 70%)',animation:isHovered?'sheen 1.8s ease-in-out infinite':'none',pointerEvents:'none'}}/>
        {/* number watermark removed */}
        {/* Header strip: name + rings */}
        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}}>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:34,letterSpacing:'0.04em',color:'#fff7ed',lineHeight:0.9}}>{goat.name}</div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:34,letterSpacing:'0.04em',color:goat.accent,lineHeight:0.9}}>{goat.last}</div>
            <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:'#fff7edcc',marginTop:6,letterSpacing:'0.18em'}}>{goat.team}</div>
          </div>

        </div>
        {/* Tagline */}
        <div style={{position:'relative',padding:'4px 10px',borderRadius:4,background:`${goat.accent}cc`,color:goat.primary,fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.15em',alignSelf:'flex-start',marginBottom:12,fontWeight:700}}>{goat.nickname}</div>
        {/* Player photo — falls back to SVG pose if no photo provided */}
        <div style={{position:'relative',flex:1,minHeight:260,maxHeight:300,display:'flex',alignItems:'center',justifyContent:'center',color:goat.accent,filter:`drop-shadow(0 12px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 18px ${goat.accent}55)`,marginBottom:14}}>
          {goat.photo ? (
            (() => {
              const tilt = goat.isSketch ? (side==='right' ? '1.5deg' : '-1.5deg') : '0deg';
              const restT = goat.isSketch ? `rotate(${tilt}) scale(1)` : 'scale(1)';
              const hoverT = goat.isSketch ? `rotate(${tilt}) scale(1.05)` : 'scale(1.06)';
              return <img src={goat.photo} alt={`${goat.name} ${goat.last}`} draggable={false} style={{height:'100%',maxWidth:'100%',objectFit:'contain',transition:'transform 400ms cubic-bezier(.2,.8,.2,1)',transform:isHovered?hoverT:restT,pointerEvents:'none',userSelect:'none',background:'transparent'}}/>;
            })()
          ) : (
            <div style={{width:'70%',height:'100%',transition:'transform 400ms',transform:isHovered?'scale(1.06)':'scale(1)'}}>
              <Pose color={goat.accent}/>
            </div>
          )}
        </div>
        {/* Stats block */}
        <div style={{position:'relative',padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.55)',border:`1px solid ${goat.accent}33`,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px'}}>
            <StatLine label="SPEED" value={goat.stats.pts} accent={goat.accent}/>
            <StatLine label="SKILL" value={goat.stats.ast} accent={goat.accent}/>
            <StatLine label="TRAIT" value={goat.stats.reb} accent={goat.accent}/>
            <StatLine label="POWER" value={goat.stats.stl} accent={goat.accent}/>
          </div>
        </div>
        {/* "Play with this GOAT" label */}
        <div style={{position:'relative',fontFamily:'"JetBrains Mono",monospace',fontSize:9,color:'#fff7edaa',letterSpacing:'0.18em',textAlign:'center',marginBottom:8}}>VIBE WITH {goat.last} — PICK YOUR ACCOUNT</div>
        {/* Play buttons — one per user account */}
        <div style={{position:'relative',display:'flex',flexDirection:'column',gap:7}}>
          {userList.map(u => (
            <button key={u.username} onClick={()=>onLogin(u.username, goat.id)} style={{padding:'11px 14px',borderRadius:10,background:`linear-gradient(135deg, ${u.color}, ${u.color}cc)`,border:'none',color:'#0a0a0a',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:15,letterSpacing:'0.08em',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,boxShadow:isHovered?`0 6px 18px ${u.color}99`:`0 3px 10px ${u.color}66`,transition:'all 220ms'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(2px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18,lineHeight:1}}>{u.emoji}</span>
                PLAY AS {u.displayName.toUpperCase()}
              </span>
              <span style={{display:'flex',alignItems:'center',gap:6,fontSize:9,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.12em',opacity:0.75}}>
                {u.ownedCards.length}<ArrowRight size={14}/>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return <div style={{minHeight:'100vh',width:'100%',background:`radial-gradient(ellipse at 30% 20%, rgba(10,80,40,0.35) 0%, transparent 50%),radial-gradient(ellipse at 70% 20%, rgba(15,110,86,0.25) 0%, transparent 50%),radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.1) 0%, transparent 60%),linear-gradient(180deg, #060f08, #030a05)`,padding:'28px 20px 32px',fontFamily:'"Outfit",sans-serif',display:'flex',flexDirection:'column',alignItems:'center'}}>
    {/* Header — the badge is the brand */}
    <div style={{textAlign:'center',marginBottom:14,display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#a8a29e',letterSpacing:'0.32em',marginBottom:10}}>WELCOME TO</div>
      <LogoBadge size={200} accent="#fb923c" primary="#fff7ed"/>
    </div>
    {/* PLAY!! stamp */}
    <div style={{display:'inline-flex',alignItems:'center',gap:10,padding:'10px 28px',borderRadius:14,background:'linear-gradient(135deg, #22c55e, #15803d)',color:'#f0fdf4',fontFamily:'"Bebas Neue",sans-serif',fontSize:32,letterSpacing:'0.12em',boxShadow:'0 8px 28px rgba(74,222,128,0.4), inset 0 -3px 0 rgba(0,0,0,0.3)',marginBottom:10,transform:'rotate(-2deg)'}}>
      P · L · A · Y <span style={{fontSize:38,marginLeft:4}}>!!</span>
    </div>
    <div style={{fontSize:11,color:'#a8a29e',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',marginBottom:24}}>PICK YOUR SPIRIT ANIMAL · BUILD THE COLLECTION</div>

    {loading ? (
      <div style={{padding:40,color:'#fb923c',fontFamily:'"JetBrains Mono",monospace',fontSize:13,letterSpacing:'0.15em'}}>LOADING SAVED DATA…</div>
    ) : (
      <>
        {/* GOAT face-off */}
        <div style={{position:'relative',display:'flex',gap:20,alignItems:'stretch',justifyContent:'center',flexWrap:'wrap',width:'100%',maxWidth:880,margin:'0 auto'}}>
          <PlayerSide goat={lebron} side="left" isHovered={hovered==='lebron'} onHover={()=>setHovered('lebron')} onLeave={()=>setHovered(null)}/>
          {/* VS badge — visible on wide screens */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:5,pointerEvents:'none'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #fff7ed, #c2410c 70%)',color:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Bebas Neue",sans-serif',fontSize:26,letterSpacing:'0.04em',boxShadow:'0 0 30px rgba(255,107,0,0.6), 0 4px 14px rgba(0,0,0,0.6)',border:'3px solid #fb923c'}}>VS</div>
          </div>
          <PlayerSide goat={mj} side="right" isHovered={hovered==='mj'} onHover={()=>setHovered('mj')} onLeave={()=>setHovered(null)}/>
        </div>
        {/* Footer: new account placeholder */}
        <div style={{maxWidth:520,width:'100%',marginTop:20,display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          <button disabled style={{padding:'12px 18px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(255,255,255,0.1)',color:'#52525b',fontSize:13,fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.1em',cursor:'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',maxWidth:340}}><Lock size={13}/>NEW ACCOUNT · COMING SOON</button>
          <div style={{fontSize:9.5,color:'#52525b',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.18em'}}>POINTS ONLY ACCRUE WHILE LOGGED IN</div>
        </div>
      </>
    )}
  </div>;
}
function StatLine({label,value,accent}){
  return <div style={{display:'flex',flexDirection:'column'}}>
    <div style={{fontSize:8,color:'#fff7ed99',letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace'}}>{label}</div>
    <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:800,color:'#fff7ed',marginTop:1,letterSpacing:'-0.01em'}}>{value}</div>
  </div>;
}

/* HUNGER BAR */
function HungerBar({pct, small}){
  const color = pct > 60 ? '#4ade80' : pct > 30 ? '#fbbf24' : '#ef4444';
  const label = pct > 60 ? 'FED' : pct > 30 ? 'HUNGRY' : pct > 0 ? 'STARVING' : 'EMPTY';
  if(small) return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <div style={{flex:1,height:4,borderRadius:2,background:'rgba(255,255,255,0.1)',overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',background:color,borderRadius:2,transition:'width 600ms'}}/>
      </div>
      <span style={{fontSize:8,color,fontFamily:'"JetBrains Mono",monospace',fontWeight:700,letterSpacing:'0.05em',minWidth:24}}>{pct}%</span>
    </div>
  );
  return (
    <div style={{padding:'6px 8px',borderRadius:6,background:'rgba(0,0,0,0.3)',border:`1px solid ${color}44`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:8,color:'#a8a29e',letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>HUNGER</span>
        <span style={{fontSize:9,color,fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>{label} Â· {pct}%</span>
      </div>
      <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',background:color,borderRadius:3,transition:'width 600ms',boxShadow:`0 0 6px ${color}88`}}/>
      </div>
    </div>
  );
}

/* PROFILE HEADER */
function ProfileHeader({me, onEditAvatar, onEditFavCard, onInviteFriend, onOpenCard}){
  const favCard = me.favCardId ? me.ownedCards.find(c=>c.id===me.favCardId) : null;
  const totalPPS = me.ownedCards.reduce((s,c)=>{
    const hunger = (me.cardHunger && me.cardHunger[c.id]) ?? 100;
    return hunger > 0 ? s + (c.pps||0)*(c.qty||1) : s;
  }, 0);
  return (
    <div style={{margin:'16px 28px 0',padding:'16px 18px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:16,alignItems:'stretch',flexWrap:'wrap'}}>
      {/* Avatar + name */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,minWidth:80}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:`${me.color}33`,border:`2px solid ${me.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>{me.emoji}</div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1}}>{me.displayName.toUpperCase()}</div>
        <div style={{display:'flex',gap:4}}>
          <button onClick={onEditAvatar} style={{padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>EDIT</button>
          <button onClick={onInviteFriend} style={{padding:'3px 8px',borderRadius:4,background:`${me.color}22`,border:`1px solid ${me.color}55`,color:me.color,cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>+ FRIEND</button>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:8,flex:1,minWidth:120}}>
        <div style={{display:'flex',alignItems:'baseline',gap:6}}>
          <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:28,fontWeight:800,color:'#fff7ed',lineHeight:1}}>{Math.floor(me.points).toLocaleString()}</span>
          <span style={{fontSize:10,color:'#fb923c',fontWeight:700,letterSpacing:'0.15em',fontFamily:'"JetBrains Mono",monospace'}}>ECO</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 8px',borderRadius:999,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',alignSelf:'flex-start'}}>
          <TrendingUp size={10} style={{color:'#4ade80'}}/>
          <span style={{fontSize:10,fontWeight:700,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace'}}>+{totalPPS}/sec</span>
        </div>
        <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace'}}>{me.ownedCards.length} ANIMALS</div>
      </div>
      {/* Fav card */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:90}}>
        <div style={{fontSize:9,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace'}}>FAV ANIMAL</div>
        {favCard ? (
          <div style={{width:80,cursor:'pointer'}} onClick={()=>onOpenCard(favCard)}>
            <PlayerCard card={favCard}/>
          </div>
        ) : (
          <button onClick={onEditFavCard} style={{width:80,aspectRatio:'5/7',borderRadius:8,border:'1px dashed rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.02)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,color:'#52525b'}}>
            <Star size={18} style={{color:'#52525b'}}/>
            <span style={{fontSize:8,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>PICK ONE</span>
          </button>
        )}
        {favCard && <button onClick={onEditFavCard} style={{padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:9,letterSpacing:'0.1em'}}>CHANGE</button>}
      </div>
    </div>
  );
}

/* FAV CARD PICKER MODAL */
function FavCardPicker({me, onClose, onPick}){
  return (
    <div style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:600,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(251,191,36,0.3)',padding:22,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}><Star size={20} style={{color:'#fbbf24'}}/>PICK YOUR FAVOURITE ANIMAL</div>
            <div style={{fontSize:11,color:'#a8a29e',marginTop:2}}>This shows on your profile</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
            {me.ownedCards.map(c=>(
              <button key={c.id} onClick={()=>onPick(c.id)} style={{padding:0,border:me.favCardId===c.id?'2px solid #fbbf24':'2px solid transparent',borderRadius:10,background:'transparent',cursor:'pointer'}}>
                <PlayerCard card={c}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* HOME SCREEN */
function HomeScreen({me,pendingCount,onClaimDaily,onOpenPack,onOpenInbox,onOpenCard,onShowComingSoon}){
  const [filter,setFilter] = useState('all');
  const [hoveredId,setHoveredId] = useState(null);
  const looseAll = useMemo(()=>getLooseCards(me),[me.ownedCards, me.binderData]);
  const visible = filter==='all' ? me.ownedCards : me.ownedCards.filter(c=>c.rarity===filter);

  return <>
    <div style={{padding:'20px 28px 4px',display:'flex',gap:12,flexWrap:'wrap'}}>
      <QuickAction icon={Gift} label={me.dailyClaimed?'DAILY · CLAIMED':'CLAIM DAILY'} sub={me.dailyClaimed?'come back tomorrow':`+${DAILY_REWARD.toLocaleString()} eco free`} accent={me.dailyClaimed?'#52525b':'#4ade80'} badge={!me.dailyClaimed&&'!'} onClick={onClaimDaily} disabled={me.dailyClaimed}/>
      <QuickAction icon={Package} label="OPEN FREE PACK" sub={me.packsAvailable>0?`${me.packsAvailable} pack ready`:'come back tomorrow'} accent={me.packsAvailable>0?'#fb923c':'#52525b'} badge={me.packsAvailable>0&&me.packsAvailable} onClick={()=>me.packsAvailable>0&&onOpenPack('daily')} disabled={me.packsAvailable<=0}/>
      <QuickAction icon={Mail} label="TRADE OFFERS" sub={pendingCount>0?`${pendingCount} waiting for you`:'all clear'} accent={pendingCount>0?'#a855f7':'#52525b'} badge={pendingCount>0&&pendingCount} onClick={onOpenInbox}/>
      <QuickAction icon={Gamepad2} label="MINI GAMES" sub="coming soon · earn points" accent="#52525b" badge="SOON" onClick={()=>onShowComingSoon&&onShowComingSoon()} disabled={false}/>
    </div>
    <div style={{padding:'24px 28px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
      <div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>{me.displayName.toUpperCase()}'S ANIMALS</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:2}}>{visible.length} of {me.ownedCards.length} animals · click any for details</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        <Filter size={13} style={{color:'#78716c',marginRight:4}}/>
        <FilterChip active={filter==='all'} onClick={()=>setFilter('all')} color="#fb923c" label="ALL"/>
        {Object.entries(RARITIES).map(([k,r])=><FilterChip key={k} active={filter===k} onClick={()=>setFilter(k)} color={r.color} label={r.label}/>)}
      </div>
    </div>
    <div style={{padding:'8px 28px 40px',display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',gap:18}}>
      {visible.map((card,idx)=><div key={card.id} className="card-stagger" style={{animationDelay:`${idx*70}ms`,display:'flex',flexDirection:'column',gap:6}}>
        <PlayerCard card={card} damage={getCardState(me,card.id).damage} hovered={hoveredId===card.id} onHover={()=>setHoveredId(card.id)} onLeave={()=>setHoveredId(null)} onClick={()=>onOpenCard(card)}/>
        <HungerBar pct={getCardHunger(me,card.id)} small/>
      </div>)}
    </div>
  </>;
}

/* PACK TILE */
function PackTile({title,subtitle,priceLabel,accent,disabled,onClick,kind,basePrice,points,onOpenSize}){
  const [hover,setHover] = useState(false);
  const grad = kind==='supernova' ? 'linear-gradient(160deg, #ec4899, #a855f7 40%, #3b82f6 70%, #1a0f0a)'
    : kind==='diamond' ? 'linear-gradient(160deg, #67e8f9, #06b6d4 50%, #1a0f0a)'
    : kind==='premium' ? 'linear-gradient(160deg, #fbbf24, #b45309 50%, #1a0f0a)'
    : 'linear-gradient(160deg, #fb923c, #c2410c 50%, #1a0f0a)';
  // multi-size mode: basePrice + onOpenSize provided
  const isMulti = !!basePrice && !!onOpenSize;
  const wrapperProps = isMulti ? {} : {onClick, disabled};
  return <div {...(isMulti ? {} : {})} style={{flex:1,minWidth:200,position:'relative',padding:18,borderRadius:14,background:grad,border:`2px solid ${accent}`,color:'#fff7ed',opacity:disabled?0.55:1,boxShadow:hover&&!disabled?`0 12px 40px ${accent}66, inset 0 0 30px rgba(0,0,0,0.4)`:`0 4px 16px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.4)`,transition:'all 250ms',textAlign:'left',overflow:'hidden',cursor:isMulti?'default':(disabled?'not-allowed':'pointer')}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={isMulti?undefined:onClick}>
    <div style={{position:'absolute',inset:0,borderRadius:13,background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.18) 55%, transparent 70%)',animation:hover&&!disabled?'sheen 1.5s ease-in-out infinite':'none',pointerEvents:'none'}}/>
    <div style={{position:'relative'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,letterSpacing:'0.05em',lineHeight:1}}>{title}</div>
      <div style={{fontSize:10.5,opacity:0.85,marginTop:5,fontWeight:600}}>{subtitle}</div>
      {isMulti ? (
        <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5}}>
          {Object.entries(PACK_SIZES).map(([sz,sCfg])=>{
            const price = Math.floor(basePrice * sCfg.multiplier);
            const canAfford = points >= price;
            return <button key={sz} onClick={(e)=>{ e.stopPropagation(); if(canAfford) onOpenSize(parseInt(sz)); }} disabled={!canAfford} style={{padding:'7px 4px',borderRadius:8,background:canAfford?'rgba(0,0,0,0.55)':'rgba(0,0,0,0.3)',border:`1px solid ${canAfford?accent:'rgba(255,255,255,0.1)'}66`,color:'#fff7ed',cursor:canAfford?'pointer':'not-allowed',opacity:canAfford?1:0.55,fontFamily:'"JetBrains Mono",monospace',display:'flex',flexDirection:'column',alignItems:'center',gap:2,transition:'all 180ms'}} onMouseEnter={e=>{if(canAfford)e.currentTarget.style.background='rgba(0,0,0,0.8)';}} onMouseLeave={e=>{if(canAfford)e.currentTarget.style.background='rgba(0,0,0,0.55)';}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.06em',color:accent,lineHeight:1}}>{sCfg.short} CARDS</div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:3}}>
                {!canAfford && <Lock size={9}/>}{price>=1000?`${(price/1000).toFixed(price>=10000?0:1)}K`:price}
              </div>
            </button>;
          })}
        </div>
      ) : (
        <div style={{marginTop:14,padding:'6px 12px',borderRadius:999,background:'rgba(0,0,0,0.45)',display:'inline-flex',alignItems:'center',gap:6,fontFamily:'"JetBrains Mono",monospace',fontSize:11,fontWeight:800,letterSpacing:'0.1em'}}>
          {disabled && <Lock size={11}/>}{priceLabel}
        </div>
      )}
    </div>
  </div>;
}

/* SHOP SCREEN */
function ShopScreen({me,friends,onBuyCard,onOpenPack,onStartAITrade,onStartFriendTrade,onOpenCard,onToast,onBuyBinder,onBuyPages}){
  const [traderId,setTraderId] = useState('gina');
  const trader = TRADERS.find(t=>t.id===traderId);
  const [hoveredCard,setHoveredCard] = useState(null);

  return <div style={{padding:'24px 28px 40px'}}>
    {friends.length>0 && <div style={{marginBottom:18,padding:'14px 16px',borderRadius:12,background:'linear-gradient(135deg, rgba(168,85,247,0.12), transparent)',border:'1px solid rgba(168,85,247,0.3)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,fontFamily:'"Bebas Neue",sans-serif',fontSize:14,color:'#fff7ed',letterSpacing:'0.12em'}}><Users size={14} style={{color:'#a855f7'}}/>TRADE WITH FRIENDS</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {friends.map(f=>(
          <button key={f.username} onClick={()=>onStartFriendTrade(f)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderRadius:10,background:`${f.color}1a`,border:`1px solid ${f.color}55`,cursor:'pointer'}}>
            <span style={{fontSize:18}}>{f.emoji}</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color:'#fff7ed',letterSpacing:'0.05em',lineHeight:1}}>{f.displayName.toUpperCase()}</div>
              <div style={{fontSize:9.5,color:f.color,fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{f.ownedCards.length} CARDS · {f.points.toLocaleString()} PTS</div>
            </div>
            <Send size={12} style={{color:f.color,marginLeft:4}}/>
          </button>
        ))}
      </div>
    </div>}

    <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
      {TRADERS.map(t=>{
        const active = t.id===traderId;
        return <button key={t.id} onClick={()=>setTraderId(t.id)} style={{flex:1,minWidth:160,padding:'12px 14px',borderRadius:12,border:active?`1px solid ${t.color}`:'1px solid rgba(255,255,255,0.08)',background:active?`${t.color}1f`:'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10,transition:'all 200ms'}}>
          <div style={{width:38,height:38,borderRadius:10,fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',background:`${t.color}22`}}>{t.emoji}</div>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:15,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{t.name.toUpperCase()}</div>
            <div style={{fontSize:9.5,color:t.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em',marginTop:3}}>{t.vibe}</div>
          </div>
        </button>;
      })}
    </div>

    <div style={{position:'relative',borderRadius:18,background:`linear-gradient(180deg, ${trader.color}15, transparent 60%), rgba(0,0,0,0.3)`,border:`1px solid ${trader.color}33`,overflow:'hidden'}}>
      <div style={{padding:'24px 22px 16px',display:'flex',alignItems:'center',gap:16,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{width:78,height:78,borderRadius:18,background:`linear-gradient(160deg, ${trader.color}55, ${trader.color}22)`,border:`2px solid ${trader.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:46,flexShrink:0,boxShadow:`0 8px 30px ${trader.color}44`}}>{trader.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:30,color:'#fff7ed',letterSpacing:'0.03em',lineHeight:1}}>{trader.name.toUpperCase()}</div>
          <div style={{fontSize:12,color:trader.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.12em',marginTop:4}}>{trader.vibe} · {trader.inventory.length} CARDS IN STOCK</div>
          <div style={{fontSize:12,color:'#a8a29e',marginTop:6,fontStyle:'italic'}}>"{trader.bio}"</div>
        </div>
        <button onClick={()=>onStartAITrade(trader)} style={{padding:'12px 18px',borderRadius:10,background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:6,flexShrink:0}}><ArrowLeftRight size={14}/>PROPOSE TRADE</button>
      </div>

      <div style={{padding:'18px 22px'}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.12em',marginBottom:6}}>UNDER THE GLASS · BUY OUTRIGHT</div>
        <div style={{fontSize:11,color:'#a8a29e',marginBottom:14}}>Pay points, take it home. Click any card for full details & career highlights.</div>
        <div style={{position:'relative',padding:'18px 14px',borderRadius:14,background:'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'inset 0 0 30px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.08)'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:60,background:'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',borderRadius:'14px 14px 0 0',pointerEvents:'none'}}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))',gap:14,position:'relative'}}>
            {trader.inventory.map(c=>{
              const price = Math.floor(getCardValue(c)*(c.priceMod||1));
              const canAfford = me.points>=price;
              return <div key={c.id} style={{position:'relative'}}>
                <PlayerCard card={c} hovered={hoveredCard===c.id} onHover={()=>setHoveredCard(c.id)} onLeave={()=>setHoveredCard(null)} onClick={()=>onOpenCard(c,false)}/>
                <button onClick={(e)=>{e.stopPropagation();canAfford?onBuyCard(c,price):onToast('NOT ENOUGH POINTS','err');}} style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',padding:'5px 12px',borderRadius:999,background:canAfford?'linear-gradient(135deg, #ff6b00, #c2410c)':'rgba(80,80,80,0.9)',color:'#fff7ed',border:'2px solid #1a0f0a',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,fontWeight:800,letterSpacing:'0.06em',whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(0,0,0,0.5)',display:'flex',alignItems:'center',gap:4}}>
                  {!canAfford&&<Lock size={9}/>}<ShoppingCart size={9}/>{price.toLocaleString()}
                </button>
              </div>;
            })}
          </div>
        </div>
      </div>

      <div style={{padding:'4px 22px 24px'}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fff7ed',letterSpacing:'0.12em',marginTop:14,marginBottom:14}}>PACK RACK</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:12}}>
          <PackTile kind="daily" title="DAILY PACK" subtitle="3 cards · low rare odds" priceLabel="FREE · 1/DAY" accent="#fb923c" disabled={me.packsAvailable<=0} onClick={()=>onOpenPack('daily')}/>
          <PackTile kind="premium" title="PREMIUM PACK" subtitle="boosted rare odds · choose size" accent="#fbbf24" basePrice={PACK_TYPES.premium.price} points={me.points} onOpenSize={(sz)=>onOpenPack('premium',sz)}/>
          <PackTile kind="diamond" title="DIAMOND PACK" subtitle="platinum+ guaranteed × 1" accent="#67e8f9" basePrice={PACK_TYPES.diamond.price} points={me.points} onOpenSize={(sz)=>onOpenPack('diamond',sz)}/>
          <PackTile kind="supernova" title="SUPERNOVA PACK" subtitle="diamond guaranteed · 30% supernova" accent="#ec4899" basePrice={PACK_TYPES.supernova.price} points={me.points} onOpenSize={(sz)=>onOpenPack('supernova',sz)}/>
        </div>
      </div>
    </div>
    <div style={{marginTop:22,padding:'20px 22px',borderRadius:18,background:'linear-gradient(180deg, rgba(96,165,250,0.1), transparent 60%), rgba(0,0,0,0.3)',border:'1px solid rgba(96,165,250,0.3)'}}>
      <div style={{display:'none'}}><div>BINDERS HIDDEN</div></div>
      {(() => {
        const binders = (me.binderData && me.binderData.binders) || [];
        const atCap = binders.length >= 12;
        const canBuy = me.points >= 25000;
        return <>
          <button onClick={()=> atCap ? onToast('Max 12 binders','err') : (canBuy ? onBuyBinder() : onToast('NOT ENOUGH POINTS','err'))} style={{width:'100%',padding:'14px',borderRadius:12,marginBottom:16,background: atCap ? 'rgba(80,80,80,0.4)' : (canBuy ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(80,80,80,0.6)'),color:'#fff7ed',border:'none',cursor: atCap?'not-allowed':'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:16,letterSpacing:'0.08em',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity: atCap?0.6:1}}>
            {!canBuy && !atCap && <Lock size={13}/>}{atCap ? 'BINDER LIMIT REACHED (12)' : 'BUY NEW BINDER - 25,000 PTS'}
          </button>
          <div style={{fontSize:10,color:'#78716c',letterSpacing:'0.14em',fontFamily:'"JetBrains Mono",monospace',marginBottom:10}}>YOUR BINDERS - ADD PAGES (+5 FOR 10,000)</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {binders.map(b=>{
              const filled = Object.keys(b.slots||{}).length;
              const cap = (b.pageCount||10)*9;
              const canPages = me.points >= 10000;
              return <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{width:8,height:32,borderRadius:4,background:b.coverColor||'#3b82f6'}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:15,color:'#fff7ed',letterSpacing:'0.04em',lineHeight:1}}>{b.title}</div>
                  <div style={{fontSize:9.5,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',marginTop:3}}>{b.pageCount||10} PAGES - {filled}/{cap} CARDS</div>
                </div>
                <button onClick={()=> canPages ? onBuyPages(b.id) : onToast('NOT ENOUGH POINTS','err')} style={{padding:'8px 12px',borderRadius:8,background: canPages ? 'rgba(96,165,250,0.15)' : 'rgba(80,80,80,0.4)',border:'1px solid '+(canPages?'rgba(96,165,250,0.4)':'rgba(255,255,255,0.1)'),color: canPages?'#93c5fd':'#78716c',cursor:canPages?'pointer':'not-allowed',fontFamily:'"JetBrains Mono",monospace',fontSize:10,fontWeight:700,letterSpacing:'0.06em',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
                  {!canPages && <Lock size={9}/>}+5 PAGES
                </button>
              </div>;
            })}
          </div>
        </>;
      })()}
    </div>
  </div>;
}

/* DESIGN SCREEN */
function DesignBlock({title,children}){
  return <div style={{padding:14,borderRadius:12,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)'}}>
    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:13,color:'#fb923c',letterSpacing:'0.14em',marginBottom:12}}>{title}</div>{children}
  </div>;
}
function Lab({children}){return <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>{children}</div>;}
function TextInput({label,value,onChange,placeholder}){
  return <div>
    <Lab>{label}</Lab>
    <input value={value} onChange={e=>onChange(e.target.value.toUpperCase())} placeholder={placeholder} style={{width:'100%',marginTop:6,padding:'8px 10px',borderRadius:6,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.04em',outline:'none',boxSizing:'border-box'}}/>
  </div>;
}
function NumInput({label,value,onChange,min,max}){
  return <div>
    <Lab>{label}</Lab>
    <input type="number" value={value} min={min} max={max} onChange={e=>onChange(Math.max(min,Math.min(max,parseInt(e.target.value)||0)))} style={{width:'100%',marginTop:6,padding:'8px 10px',borderRadius:6,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:700,outline:'none',boxSizing:'border-box'}}/>
  </div>;
}
function Slider({label,value,onChange}){
  return <div style={{marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
      <Lab>{label}</Lab>
      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:800,color:value>80?'#a855f7':value>60?'#fb923c':'#fff7ed'}}>{value}</span>
    </div>
    <input type="range" min={1} max={100} value={value} onChange={e=>onChange(parseInt(e.target.value))} style={{width:'100%',accentColor:'#fb923c',marginTop:4}}/>
  </div>;
}
function StatRow({label,value,accent}){
  return <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:11.5}}>
    <span style={{color:'#78716c',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>{label}</span>
    <span style={{color:accent||'#fff7ed',fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>{value}</span>
  </div>;
}
function BinderDesignPanel({me, onSaveCover, onToast}){
  const binders = (me.binderData && me.binderData.binders) || [];
  const [selId, setSelId] = useState(binders[0] ? binders[0].id : null);
  const sel = binders.find(b=>b.id===selId) || binders[0];
  const [title, setTitle] = useState(sel ? sel.title : '');
  const [color, setColor] = useState(sel ? (sel.coverColor||'#3b82f6') : '#3b82f6');
  const [icon, setIcon] = useState(sel ? (sel.coverIcon||'star') : 'star');
  const [material, setMaterial] = useState(sel ? (sel.coverMaterial||'bronze') : 'bronze');
  const [coverImage, setCoverImage] = useState(sel ? (sel.coverImage||null) : null);
  const drawClipRef = useRef(null);
  useEffect(()=>{
    if(sel){ setTitle(sel.title||''); setColor(sel.coverColor||'#3b82f6'); setIcon(sel.coverIcon||'star'); setMaterial(sel.coverMaterial||'bronze'); setCoverImage(sel.coverImage||null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selId]);
  if(!sel) return <div style={{textAlign:'center',color:'#78716c',padding:'40px 0',fontFamily:'"Outfit",sans-serif',fontSize:14}}>No binders yet. Buy one in the Shop first!</div>;
  const COLORS = ['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#e2e8f0','#1e293b'];
  const ICONS = ['star','crown','flame','zap','trophy','gem','rocket','sparkles','award','music','gamepad','disc'];
  const FINISHES = ['bronze','silver','gold','platinum','diamond','spark','flame','fireball','supernova','crescent_moon','half_moon','full_moon'];
  const previewBinder = {...sel, title:title||'BINDER', coverColor:color, coverIcon:icon, coverMaterial:material, coverImage};
  const curMat = sel.coverMaterial||'bronze';
  const matChanged = material !== curMat;
  const charge = (matChanged && material!=='bronze') ? FINISH_PRICE(material) : 0;
  return <div style={{display:'flex',flexDirection:'column',gap:18}}>
    <div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:30,letterSpacing:'0.02em'}}>BINDER COVERS</div>
      <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>Name your binders and design their covers. Title, color, and icon are free. Premium finishes cost points.</div>
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {binders.map(b=>{ const active=b.id===selId; return <button key={b.id} onClick={()=>setSelId(b.id)} style={{padding:'8px 12px',borderRadius:10,border:active?'1px solid '+(b.coverColor||'#3b82f6'):'1px solid rgba(255,255,255,0.1)',background:active?(b.coverColor||'#3b82f6')+'22':'rgba(255,255,255,0.03)',color:'#fff7ed',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.04em'}}>{b.title}</button>; })}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 200px',gap:24,alignItems:'start'}}>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#60a5fa',letterSpacing:'0.1em'}}>FRONT COVER</div>
          <div style={{flex:1,height:1,background:'rgba(96,165,250,0.3)'}}/>
        </div>
        <div>
          <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:6}}>TITLE</div>
          <input value={title} onChange={e=>setTitle(e.target.value.toUpperCase().slice(0,20))} placeholder="BINDER NAME" style={{width:'100%',padding:'8px 10px',borderRadius:6,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.04em',outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:8}}>COVER COLOR</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {COLORS.map(col=><button key={col} onClick={()=>setColor(col)} style={{width:32,height:32,borderRadius:8,background:col,border:color===col?'3px solid #fff7ed':'2px solid rgba(255,255,255,0.15)',cursor:'pointer'}}/>)}
          </div>
        </div>
        <div>
          <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:8}}>ICON</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {ICONS.map(ic=>{ const Ic = BINDER_ICONS[ic]||Star; const active=icon===ic; return <button key={ic} onClick={()=>setIcon(ic)} style={{width:38,height:38,borderRadius:8,background:active?color+'33':'rgba(255,255,255,0.04)',border:active?'2px solid '+color:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Ic size={18} color={active?'#fff7ed':'#a8a29e'}/></button>; })}
          </div>
        </div>
        <div>
          <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:8}}>FINISH (PREMIUM = PAID)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {FINISHES.map(mat=>{ const m=MATERIALS[mat]; const active=material===mat; const price=FINISH_PRICE(mat); const owned=mat===curMat; return <button key={mat} onClick={()=>setMaterial(mat)} style={{padding:'8px 6px',borderRadius:8,background:active?m.color+'22':'rgba(255,255,255,0.03)',border:active?'2px solid '+m.color:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:14,color:m.color}}>{m.gem}</span>
              <span style={{fontSize:9,color:'#fff7ed',fontFamily:'"Bebas Neue",sans-serif',letterSpacing:'0.04em'}}>{m.label}</span>
              <span style={{fontSize:7.5,color:owned?'#10b981':(price===0?'#78716c':'#fbbf24'),fontFamily:'"JetBrains Mono",monospace'}}>{owned?'CURRENT':(price===0?'FREE':(price>=1000?(price/1000)+'K':price))}</span>
            </button>; })}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:16,color:'#fbbf24',letterSpacing:'0.1em'}}>BACK COVER</div>
          <div style={{flex:1,height:1,background:'rgba(251,191,36,0.3)'}}/>
        </div>
        <div>
          <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:8}}>DRAWING (OPTIONAL)</div>
          <PaintCanvas portrait={coverImage} onChange={setCoverImage} clipboardRef={drawClipRef}/>
          {coverImage && <button onClick={()=>setCoverImage(null)} style={{marginTop:8,padding:'6px 12px',borderRadius:6,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',color:'#fca5a5',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'0.08em'}}>CLEAR DRAWING</button>}
        </div>
        <button onClick={()=>onSaveCover(sel.id, {title, coverColor:color, coverIcon:icon, coverMaterial:material, coverImage})} style={{width:'100%',padding:'13px',borderRadius:10,background:'linear-gradient(135deg, #ff6b00, #c2410c)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:15,letterSpacing:'0.08em'}}>
          {charge>0 ? 'SAVE COVER - '+(charge>=1000?(charge/1000)+'K':charge)+' PTS' : 'SAVE COVER'}
        </button>
      </div>
      <div>
        <div style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace',fontWeight:700,marginBottom:8,textAlign:'center'}}>PREVIEW</div>
        <BinderCover binder={previewBinder} onClick={()=>{}}/>
      </div>
    </div>
  </div>;
}

function DesignScreen({points,onMint,onToast,editingCard:incomingEdit,onCancelEdit,onUpdateCard,me,onSaveBinderCover}){
  const [first,setFirst] = useState('');
  const [last,setLast] = useState('');
  const [number,setNumber] = useState(7);
  const [team,setTeam] = useState('LAL');
  const [position,setPosition] = useState('SG');
  const [height,setHeight] = useState(76);
  const [scoring,setScoring] = useState(50);
  const [defense,setDefense] = useState(50);
  const [speed,setSpeed] = useState(50);
  const [strength,setStrength] = useState(50);
  const [portrait,setPortrait] = useState(null);
  const [signatureMove,setSignatureMove] = useState(null);
  const [editingCard,setEditingCard] = useState(null);
  const [editPickerOpen,setEditPickerOpen] = useState(false);
  const [designMode,setDesignMode] = useState('cards');
  const clipboardRef = useRef(null);

  const attrTotal = scoring+defense+speed+strength;
  const premiumTeams = ['LAL','GSW','BOS','CHI'];

  // Helper to load a card into the form
  const loadCard = useCallback((c)=>{
    setFirst(c.first||'');
    setLast(c.last||'');
    setNumber(c.number||7);
    setTeam(c.team||'LAL');
    setPosition(c.position||'SG');
    setHeight(c.height||76);
    const guess = Math.min(100, Math.max(20, Math.floor((c.pps||40))));
    setScoring(c.scoring||guess);
    setDefense(c.defense||guess);
    setSpeed(c.speed||guess);
    setStrength(c.strength||guess);
    setPortrait(c.portrait||null);
    setSignatureMove(c.signatureMove||null);
    setEditingCard(c);
  },[]);

  // When parent passes an incomingEdit (e.g. from CardDetailModal "Edit this card"), load it
  useEffect(()=>{
    if(incomingEdit) loadCard(incomingEdit);
  },[incomingEdit,loadCard]);

  const cost = useMemo(()=>{
    let c = 5000;
    c += attrTotal*100;
    if(premiumTeams.includes(team)) c += 5000;
    return c;
  },[attrTotal,team]);

  const isEditing = !!editingCard;
  const rarity = editingCard?.rarity || (attrTotal<250 ? 'common' : attrTotal<320 ? 'uncommon' : attrTotal<360 ? 'rare' : 'legend');
  const material = editingCard?.material || (attrTotal<200 ? 'bronze' : attrTotal<280 ? 'silver' : attrTotal<340 ? 'gold' : attrTotal<380 ? 'platinum' : 'diamond');
  const pps = isEditing ? (editingCard.pps || Math.floor(attrTotal/4)) : Math.floor(attrTotal/4);
  const heightFt = Math.floor(height/12);
  const heightIn = height%12;

  const previewCard = {id:'preview',first:first||'YOUR',last:last||'PLAYER',number,pps,rarity,material,team,tag:editingCard?.tag||`CUSTOM · ${position}`,position,height,portrait,signatureMove,pose:editingCard?.pose};
  const canMint = isEditing ? (first.trim() && last.trim()) : (points>=cost && first.trim() && last.trim());

  const submit = () => {
    if(isEditing){
      if(!first.trim() || !last.trim()){ onToast('NAME YOUR PLAYER','err'); return; }
      onUpdateCard({...editingCard, first, last, number, team, position, height, portrait, signatureMove});
      return;
    }
    if(!canMint){ onToast(points<cost?'NEED MORE POINTS':'NAME YOUR PLAYER','err'); return; }
    onMint({...previewCard,id:`mint_${Date.now()}`,scoring,defense,speed,strength},cost);
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setFirst(''); setLast(''); setNumber(7); setTeam('LAL'); setPosition('SG'); setHeight(76);
    setScoring(50); setDefense(50); setSpeed(50); setStrength(50);
    setPortrait(null); setSignatureMove(null);
    onCancelEdit && onCancelEdit();
  };

  const sigMoves = ['DUNK','SHOOT','PASS','BLOCK'];

  return <div style={{padding:'24px 28px 40px'}}>
    <div style={{display:'flex',gap:8,marginBottom:18}}>
      <button onClick={()=>setDesignMode('cards')} style={{padding:'8px 16px',borderRadius:10,border:designMode==='cards'?'1px solid #fb923c':'1px solid rgba(255,255,255,0.1)',background:designMode==='cards'?'rgba(251,146,60,0.15)':'rgba(255,255,255,0.03)',color:designMode==='cards'?'#fb923c':'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.08em'}}>DESIGN CARDS</button>
      <button onClick={()=>setDesignMode('binders')} style={{padding:'8px 16px',borderRadius:10,border:designMode==='binders'?'1px solid #60a5fa':'1px solid rgba(255,255,255,0.1)',background:designMode==='binders'?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.03)',color:designMode==='binders'?'#60a5fa':'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.08em'}}>DESIGN BINDERS</button>
    </div>
    {designMode==='binders' ? <BinderDesignPanel me={me} onSaveCover={onSaveBinderCover} onToast={onToast}/> : <>
    <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:12,flexWrap:'wrap'}}>
      <div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>{isEditing?'EDIT CARD':'DESIGN STUDIO'}</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>{isEditing?`Editing ${editingCard.first} ${editingCard.last} · changes save in place, no cost`:'Draw the portrait, dial the stats, mint it. Higher attributes = better rarity AND material.'}</div>
      </div>
      <div style={{display:'flex',gap:8}}>
        {isEditing && <button onClick={cancelEdit} style={{padding:'8px 14px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:6}}><X size={13}/>CANCEL EDIT</button>}
        {!isEditing && <button onClick={()=>setEditPickerOpen(true)} style={{padding:'8px 14px',borderRadius:8,background:'rgba(168,85,247,0.12)',border:'1px solid rgba(168,85,247,0.3)',color:'#c4b5fd',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:6}}><Edit3 size={13}/>EDIT OLD CARDS</button>}
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0, 1fr) 240px',gap:24}}>
      <div style={{display:'flex',flexDirection:'column',gap:18}}>
        <DesignBlock title="PORTRAIT STUDIO">
          <PaintCanvas portrait={portrait} onChange={setPortrait} clipboardRef={clipboardRef}/>
        </DesignBlock>
        <DesignBlock title="IDENTITY">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 90px',gap:10}}>
            <TextInput label="FIRST NAME" value={first} onChange={setFirst} placeholder="LeBron"/>
            <TextInput label="LAST NAME" value={last} onChange={setLast} placeholder="James"/>
            <NumInput label="JERSEY #" value={number} onChange={setNumber} min={0} max={99}/>
          </div>
          <div style={{marginTop:14}}>
            <Lab>TEAM</Lab>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(64px, 1fr))',gap:6,marginTop:6}}>
              {HABITATS.map(tt=>{
                const active = tt.abbr===team;
                const premium = premiumTeams.includes(tt.abbr);
                return <button key={tt.abbr} onClick={()=>setTeam(tt.abbr)} style={{padding:'6px 4px',borderRadius:6,background:active?tt.primary:'rgba(255,255,255,0.04)',border:active?`1px solid ${tt.accent}`:'1px solid rgba(255,255,255,0.06)',color:active?tt.accent:'#a8a29e',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,fontWeight:800,letterSpacing:'0.05em',position:'relative'}}>
                  {tt.abbr}
                  {premium && <span style={{position:'absolute',top:-4,right:-4,fontSize:8,color:'#fbbf24'}}>★</span>}
                </button>;
              })}
            </div>
            {!isEditing && <div style={{fontSize:9.5,color:'#78716c',marginTop:6,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em'}}>★ PREMIUM TEAMS · +5,000 PTS COST</div>}
          </div>
        </DesignBlock>
        <DesignBlock title="SIGNATURE MOVE · optional badge on card">
          <div style={{display:'grid',gridTemplateColumns:'repeat(5, 1fr)',gap:6}}>
            <button onClick={()=>setSignatureMove(null)} style={{padding:'10px 0',borderRadius:6,background:!signatureMove?'#fb923c':'rgba(255,255,255,0.04)',color:!signatureMove?'#0a0a0a':'#a8a29e',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em'}}>NONE</button>
            {sigMoves.map(s=>(
              <button key={s} onClick={()=>setSignatureMove(s)} style={{padding:'10px 0',borderRadius:6,background:signatureMove===s?'#fb923c':'rgba(255,255,255,0.04)',color:signatureMove===s?'#0a0a0a':'#a8a29e',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em'}}>{s}</button>
            ))}
          </div>
        </DesignBlock>
        <DesignBlock title="PHYSIQUE">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <Lab>POSITION</Lab>
              <div style={{display:'flex',gap:4,marginTop:6}}>
                {POSITIONS.map(p=>(
                  <button key={p} onClick={()=>setPosition(p)} style={{flex:1,padding:'7px 0',borderRadius:6,background:p===position?'#fb923c':'rgba(255,255,255,0.04)',color:p===position?'#0a0a0a':'#a8a29e',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.06em'}}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <Lab>HEIGHT · {heightFt}'{heightIn}"</Lab>
              <input type="range" min={64} max={92} value={height} onChange={e=>setHeight(parseInt(e.target.value))} style={{width:'100%',accentColor:'#fb923c',marginTop:8}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#52525b',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}><span>5'4"</span><span>7'8"</span></div>
            </div>
          </div>
        </DesignBlock>
        {!isEditing && <DesignBlock title={`ATTRIBUTES · ${attrTotal} TOTAL`}>
          <Slider label="SCORING" value={scoring} onChange={setScoring}/>
          <Slider label="DEFENSE" value={defense} onChange={setDefense}/>
          <Slider label="SPEED" value={speed} onChange={setSpeed}/>
          <Slider label="STRENGTH" value={strength} onChange={setStrength}/>
        </DesignBlock>}
      </div>
      <div style={{position:'sticky',top:16,alignSelf:'start'}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:12,color:'#a8a29e',letterSpacing:'0.18em',marginBottom:8,textAlign:'center'}}>LIVE PREVIEW</div>
        <PlayerCard card={previewCard}/>
        <div style={{marginTop:14,padding:14,borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <StatRow label="RARITY" value={RARITIES[rarity].label} accent={RARITIES[rarity].color}/>
          <StatRow label="MATERIAL" value={MATERIALS[material].label} accent={MATERIALS[material].color}/>
          <StatRow label="EARNS" value={`${pps}/sec`}/>
          <StatRow label="HEIGHT" value={`${heightFt}'${heightIn}"`}/>
          <StatRow label="POSITION" value={position}/>
          {signatureMove && <StatRow label="SIG MOVE" value={signatureMove} accent="#a855f7"/>}
        </div>
        {isEditing ? (
          <div style={{marginTop:12,padding:'14px 14px',borderRadius:12,background:'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(109,40,217,0.1))',border:'1px solid rgba(168,85,247,0.4)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#c4b5fd',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace'}}>EDITING IN PLACE · FREE</div>
            <button onClick={submit} disabled={!canMint} style={{marginTop:12,width:'100%',padding:'12px 0',borderRadius:8,background:canMint?'linear-gradient(135deg, #a855f7, #6d28d9)':'#3f3f46',color:'#fff7ed',border:'none',cursor:canMint?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.12em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <Check size={14}/>SAVE CHANGES
            </button>
          </div>
        ) : (
          <div style={{marginTop:12,padding:'14px 14px',borderRadius:12,background:'linear-gradient(135deg, rgba(255,107,0,0.18), rgba(194,65,12,0.1))',border:'1px solid rgba(255,107,0,0.4)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#fdba74',letterSpacing:'0.18em',fontFamily:'"JetBrains Mono",monospace'}}>MINT COST</div>
            <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:24,fontWeight:800,color:'#fff7ed',marginTop:2,letterSpacing:'-0.02em'}}>{cost.toLocaleString()}</div>
            <button onClick={submit} disabled={!canMint} style={{marginTop:12,width:'100%',padding:'12px 0',borderRadius:8,background:canMint?'linear-gradient(135deg, #ff6b00, #c2410c)':'#3f3f46',color:'#fff7ed',border:'none',cursor:canMint?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.12em',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              {!canMint && <Lock size={13}/>}MINT CARD
            </button>
          </div>
        )}
      </div>
    </div>
    {editPickerOpen && me && <EditOldCardsModal me={me} onClose={()=>setEditPickerOpen(false)} onPick={(c)=>{
      loadCard(c);
      setEditPickerOpen(false);
    }}/>}
    </>}
  </div>;
}

/* ==========================================================
   SUPERNOVA CELEBRATION — fullscreen confetti + fanfare
   ========================================================== */
function MoonCelebration({card,onDone}){
  useEffect(()=>{
    const t = setTimeout(onDone, 1900);
    return ()=>clearTimeout(t);
  },[onDone]);
  return <div onClick={onDone} style={{position:'fixed',inset:0,zIndex:100,background:'radial-gradient(circle at center, #1a1640 0%, #050410 60%, #000 100%)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer',animation:'fade-in 200ms ease-out'}}>
    <div style={{position:'absolute',top:'15%',left:'50%',transform:'translateX(-50%)',fontFamily:'"Bebas Neue",sans-serif',fontSize:'min(48px, 12vw)',letterSpacing:'0.3em',color:'#fef08a',textShadow:'0 0 40px rgba(254,240,138,0.9), 0 0 80px rgba(254,240,138,0.5)',animation:'moon-text-slide 800ms ease-out 200ms backwards',whiteSpace:'nowrap'}}>FULL MOON</div>
    <div style={{position:'absolute',top:'50%',left:'50%',width:60,height:60,borderRadius:'50%',border:'3px solid #fef08a',transform:'translate(-50%,-50%)',animation:'crater-ring 1500ms ease-out 600ms backwards'}}/>
    <div style={{position:'absolute',top:'50%',left:'50%',width:60,height:60,borderRadius:'50%',border:'2px solid #c4b5fd',transform:'translate(-50%,-50%)',animation:'crater-ring 1800ms ease-out 750ms backwards'}}/>
    <div style={{animation:'crater-fall 700ms cubic-bezier(.5,.05,.3,1)'}}>
      <div style={{width:'min(220px, 60vw)',minWidth:180,padding:'24px 20px',borderRadius:14,background:'linear-gradient(135deg, rgba(254,240,138,0.25), rgba(20,15,40,0.9))',border:'2px solid #fef08a',boxShadow:'0 0 80px rgba(254,240,138,0.7), inset 0 0 40px rgba(254,240,138,0.2)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>

        <div style={{fontSize:'min(18px, 5vw)',fontFamily:'"Bebas Neue",sans-serif',color:'#fff7ed',letterSpacing:'0.1em',marginTop:8}}>{card.first} {card.last}</div>
        <div style={{fontSize:10,color:'#fef08a',letterSpacing:'0.2em',marginTop:6,fontFamily:'"JetBrains Mono",monospace'}}>FULL MOON</div>
      </div>
    </div>
    {Array.from({length:14}).map((_, i) => {
      const angle = (i * (360/14)) * Math.PI / 180;
      const dist = 200 + (i % 3) * 40;
      const size = 5 + (i % 4);
      const delay = 700 + (i * 6);
      const dx = (Math.cos(angle) * dist).toFixed(0);
      const dy = (Math.sin(angle) * dist).toFixed(0);
      const palette = i % 3 === 0 ? '#fef08a' : (i % 3 === 1 ? '#c4b5fd' : '#ffffff');
      const glow = i % 3 === 0 ? '0 0 10px rgba(254,240,138,0.9)' : '0 0 6px rgba(196,181,253,0.7)';
      return <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:size,height:size,borderRadius:'50%',background:palette,boxShadow:glow,opacity:0,'--dx':dx+'px','--dy':dy+'px',animation:'dust-fly 1200ms ease-out '+delay+'ms'}}/>;
    })}
    <div style={{position:'absolute',bottom:30,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.2em',fontFamily:'"JetBrains Mono",monospace',animation:'fade-in 500ms ease-out 1500ms backwards'}}>TAP TO CONTINUE</div>
  </div>;
}

function SupernovaCelebration({card,onDone}){
  useEffect(()=>{
    let synth, kick, bell, parts = [];
    let cancelled = false;
    (async()=>{
      try {
        await Tone.start();
        if(cancelled) return;
        synth = new Tone.PolySynth(Tone.Synth, {oscillator:{type:'sawtooth'}, envelope:{attack:0.02,decay:0.3,sustain:0.4,release:0.8}}).toDestination();
        synth.volume.value = -10;
        bell = new Tone.MetalSynth({frequency:350,envelope:{attack:0.001,decay:1.2,release:0.4},harmonicity:5.1,modulationIndex:32,resonance:4000,octaves:1.5}).toDestination();
        bell.volume.value = -18;
        kick = new Tone.MembraneSynth({pitchDecay:0.05,octaves:6,oscillator:{type:'sine'},envelope:{attack:0.001,decay:0.4,sustain:0.01,release:1.4,attackCurve:'exponential'}}).toDestination();
        kick.volume.value = -8;
        const now = Tone.now();
        // Rising arpeggio (C major triad up two octaves)
        const notes = ['C4','E4','G4','C5','E5','G5','C6'];
        notes.forEach((n,i)=>synth.triggerAttackRelease(n,'8n', now + i*0.09));
        // Big chord at top
        synth.triggerAttackRelease(['C5','E5','G5','C6'],'2n', now + notes.length*0.09);
        // Bell hits
        bell.triggerAttackRelease('C6','8n', now + 0.7);
        bell.triggerAttackRelease('E6','8n', now + 1.0);
        bell.triggerAttackRelease('G6','4n', now + 1.3);
        // Kick stabs
        kick.triggerAttackRelease('C2','8n', now);
        kick.triggerAttackRelease('C2','8n', now + 0.6);
        kick.triggerAttackRelease('C2','4n', now + 1.8);
      } catch(e) { /* audio context may not start */ }
    })();
    const t = setTimeout(()=>onDone(), 3600);
    return ()=>{
      cancelled = true;
      clearTimeout(t);
      try { synth?.dispose(); bell?.dispose(); kick?.dispose(); } catch{}
    };
  },[onDone]);
  // Generate confetti pieces
  const pieces = useMemo(()=>{
    const colors = ['#ec4899','#a855f7','#3b82f6','#fbbf24','#67e8f9','#f43f5e','#22c55e'];
    return Array.from({length:80}).map((_,i)=>({
      id:i,
      color:colors[Math.floor(Math.random()*colors.length)],
      left:Math.random()*100,
      delay:Math.random()*0.6,
      duration:2.4+Math.random()*1.4,
      size:6+Math.random()*10,
      rotate:Math.random()*360,
      drift:(Math.random()-0.5)*200,
    }));
  },[]);
  return <div onClick={onDone} style={{position:'fixed',inset:0,zIndex:300,pointerEvents:'auto',cursor:'pointer',overflow:'hidden'}}>
    {/* Radial flash */}
    <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at center, rgba(236,72,153,0.5), rgba(168,85,247,0.3) 30%, transparent 60%)',animation:'sn-flash 1s ease-out'}}/>
    {/* Confetti */}
    {pieces.map(p=>(
      <div key={p.id} style={{position:'absolute',top:'-20px',left:`${p.left}%`,width:p.size,height:p.size*0.5,background:p.color,borderRadius:2,transform:`rotate(${p.rotate}deg)`,animation:`confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(.3,.4,.6,1) forwards`,'--drift':`${p.drift}px`,opacity:0.9,boxShadow:`0 0 8px ${p.color}88`}}/>
    ))}
    {/* Banner text */}
    <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',animation:'sn-banner 2.4s cubic-bezier(.2,.8,.2,1)',pointerEvents:'none'}}>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:'clamp(48px, 12vw, 96px)',background:'linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #fbbf24, #ec4899)',backgroundSize:'200% 100%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'0.04em',lineHeight:0.9,filter:'drop-shadow(0 6px 20px rgba(236,72,153,0.6))',animation:'sn-shimmer 3s linear infinite'}}>SUPERNOVA!</div>
      <div style={{marginTop:14,fontFamily:'"Bebas Neue",sans-serif',fontSize:'clamp(20px,4vw,32px)',color:'#fff7ed',letterSpacing:'0.12em',textShadow:'0 4px 12px rgba(0,0,0,0.6)'}}>{card.first} {card.last}</div>
      <div style={{marginTop:6,fontSize:11,color:'#fcd34d',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.2em'}}>1-OF-1 · 25× MULTIPLIER</div>
    </div>
    <div style={{position:'absolute',bottom:30,left:0,right:0,textAlign:'center',color:'#fff7ed99',fontFamily:'"JetBrains Mono",monospace',fontSize:11,letterSpacing:'0.2em'}}>tap to continue</div>
  </div>;
}

/* ==========================================================
   MUSIC SYSTEM — Tone.js synthesized tracks
   ========================================================== */
const TRACK_BUILDERS = {
  vibes: () => {
    const reverb = new Tone.Reverb(2.4).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:0.5,decay:0.4,sustain:0.5,release:1.6}}).connect(reverb);
    synth.volume.value = -20;
    Tone.Transport.bpm.value = 80;
    const chords = [['C4','E4','G4'],['A3','C4','E4'],['F3','A3','C4'],['G3','B3','D4']];
    let i = 0;
    const loop = new Tone.Loop(time => { synth.triggerAttackRelease(chords[i],'2n', time); i=(i+1)%chords.length; }, '2n').start(0);
    return () => { loop.dispose(); synth.dispose(); reverb.dispose(); };
  },
  practice: () => {
    const filter = new Tone.Filter(800,'lowpass').toDestination();
    const piano = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:0.02,decay:0.5,sustain:0.2,release:0.8}}).connect(filter);
    piano.volume.value = -18;
    const hat = new Tone.MetalSynth({frequency:600,envelope:{attack:0.001,decay:0.08,release:0.05},harmonicity:5.1,modulationIndex:16,resonance:3000,octaves:1}).toDestination();
    hat.volume.value = -28;
    Tone.Transport.bpm.value = 72;
    const notes = ['C4','E4','G4','B4','A4','G4','E4','D4'];
    let i = 0;
    const melody = new Tone.Loop(time => { piano.triggerAttackRelease(notes[i],'4n',time); i=(i+1)%notes.length; }, '4n').start(0);
    const hatLoop = new Tone.Loop(time => hat.triggerAttackRelease('C5','32n',time), '8n').start('8n');
    return () => { melody.dispose(); hatLoop.dispose(); piano.dispose(); hat.dispose(); filter.dispose(); };
  },
  gametime: () => {
    const bass = new Tone.MonoSynth({oscillator:{type:'sawtooth'},envelope:{attack:0.01,decay:0.2,sustain:0.4,release:0.3},filterEnvelope:{attack:0.01,decay:0.2,sustain:0.5,release:0.5,baseFrequency:200,octaves:2}}).toDestination();
    bass.volume.value = -14;
    const kick = new Tone.MembraneSynth().toDestination();
    kick.volume.value = -10;
    const lead = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'square'},envelope:{attack:0.01,decay:0.2,sustain:0.2,release:0.3}}).toDestination();
    lead.volume.value = -22;
    Tone.Transport.bpm.value = 104;
    const bassNotes = ['C2','C2','G2','E2','F2','F2','G2','G2'];
    const leadNotes = ['C5','E5','G5','C5','D5','E5','G5','D5'];
    let bi=0, li=0;
    const bassLoop = new Tone.Loop(time => { bass.triggerAttackRelease(bassNotes[bi],'8n',time); bi=(bi+1)%bassNotes.length; }, '8n').start(0);
    const kickLoop = new Tone.Loop(time => kick.triggerAttackRelease('C2','8n',time), '4n').start(0);
    const leadLoop = new Tone.Loop(time => { lead.triggerAttackRelease(leadNotes[li],'16n',time); li=(li+1)%leadNotes.length; }, '8n').start('4n');
    return () => { bassLoop.dispose(); kickLoop.dispose(); leadLoop.dispose(); bass.dispose(); kick.dispose(); lead.dispose(); };
  },
  crunch: () => {
    const bass = new Tone.MonoSynth({oscillator:{type:'sawtooth'},envelope:{attack:0.005,decay:0.15,sustain:0.3,release:0.2},filterEnvelope:{attack:0.005,decay:0.1,sustain:0.6,release:0.4,baseFrequency:300,octaves:2.5}}).toDestination();
    bass.volume.value = -12;
    const kick = new Tone.MembraneSynth({pitchDecay:0.03,octaves:7}).toDestination();
    kick.volume.value = -8;
    const snare = new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:0.001,decay:0.12,sustain:0}}).toDestination();
    snare.volume.value = -16;
    Tone.Transport.bpm.value = 124;
    const bassNotes = ['E2','E2','E2','G2','A2','A2','G2','E2'];
    let bi=0;
    const bassLoop = new Tone.Loop(time => { bass.triggerAttackRelease(bassNotes[bi],'16n',time); bi=(bi+1)%bassNotes.length; }, '16n').start(0);
    const kickLoop = new Tone.Loop(time => kick.triggerAttackRelease('C2','8n',time), '4n').start(0);
    const snareLoop = new Tone.Loop(time => snare.triggerAttackRelease('16n',time), '2n').start('4n');
    return () => { bassLoop.dispose(); kickLoop.dispose(); snareLoop.dispose(); bass.dispose(); kick.dispose(); snare.dispose(); };
  },
  champs: () => {
    const brass = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sawtooth'},envelope:{attack:0.05,decay:0.3,sustain:0.6,release:0.6}}).toDestination();
    brass.volume.value = -14;
    const bell = new Tone.MetalSynth({frequency:200,envelope:{attack:0.001,decay:0.8,release:0.3},harmonicity:3.1,modulationIndex:24,resonance:3500,octaves:2}).toDestination();
    bell.volume.value = -22;
    const kick = new Tone.MembraneSynth().toDestination();
    kick.volume.value = -10;
    Tone.Transport.bpm.value = 118;
    const fanfare = [['C4','E4','G4'],['F4','A4','C5'],['G4','B4','D5'],['C5','E5','G5']];
    let i = 0;
    const brassLoop = new Tone.Loop(time => { brass.triggerAttackRelease(fanfare[i],'2n',time); i=(i+1)%fanfare.length; }, '2n').start(0);
    const bellLoop = new Tone.Loop(time => bell.triggerAttackRelease('C5','4n',time), '1n').start('2n');
    const kickLoop = new Tone.Loop(time => kick.triggerAttackRelease('C2','8n',time), '4n').start(0);
    return () => { brassLoop.dispose(); bellLoop.dispose(); kickLoop.dispose(); brass.dispose(); bell.dispose(); kick.dispose(); };
  },
};

function MusicStore({me,onClose,onBuy,onPlay,currentTrackId}){
  return <div style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18,overflowY:'auto'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:640,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(255,107,0,0.25)',boxShadow:'0 30px 80px rgba(0,0,0,0.8)',padding:24,maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:30,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}><Music size={26} style={{color:'#4ade80'}}/>NATURE SOUNDS</div>
          <div style={{fontSize:11,color:'#a8a29e',marginTop:2}}>Buy tracks with points · synthesized live</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>
      </div>
      <div style={{display:'grid',gap:10}}>
        {MUSIC_TRACKS.map(t=>{
          const owned = (me.unlockedTracks||[]).includes(t.id);
          const isPlaying = currentTrackId===t.id;
          const canBuy = !owned && me.points>=t.price;
          return <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:14,borderRadius:12,background:isPlaying?'rgba(255,107,0,0.08)':'rgba(255,255,255,0.025)',border:isPlaying?'1px solid rgba(255,107,0,0.4)':'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{width:46,height:46,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%, ${t.color}, ${t.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 0 20px ${t.color}55`,animation:isPlaying?'spin 4s linear infinite':'none'}}>
              <Disc3 size={22} style={{color:'#0a0a0a'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,letterSpacing:'0.04em',color:'#fff7ed',lineHeight:1}}>{t.name}</div>
              <div style={{fontSize:11,color:'#a8a29e',marginTop:3}}>{t.subtitle}</div>
              <div style={{display:'flex',gap:8,marginTop:5,fontSize:9,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>
                <span style={{color:t.color}}>{t.vibe}</span>
                <span style={{color:'#52525b'}}>·</span>
                <span style={{color:'#78716c'}}>{t.tempo}</span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
              {owned ? (
                <button onClick={()=>onPlay(isPlaying?null:t.id)} style={{padding:'8px 14px',borderRadius:8,background:isPlaying?'rgba(255,107,0,0.2)':`linear-gradient(135deg, ${t.color}, ${t.color}aa)`,border:isPlaying?`1px solid ${t.color}`:'none',color:isPlaying?t.color:'#0a0a0a',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:5,minWidth:90,justifyContent:'center'}}>
                  {isPlaying ? <><Pause size={12}/>STOP</> : <><Play size={12}/>PLAY</>}
                </button>
              ) : (
                <button onClick={()=>canBuy&&onBuy(t)} disabled={!canBuy} style={{padding:'8px 14px',borderRadius:8,background:canBuy?'linear-gradient(135deg, #ff6b00, #c2410c)':'#3f3f46',color:'#fff7ed',border:'none',cursor:canBuy?'pointer':'not-allowed',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:5,minWidth:90,justifyContent:'center'}}>
                  {!canBuy && <Lock size={11}/>}
                  {t.price.toLocaleString()}
                </button>
              )}
              {owned && <div style={{fontSize:8,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.15em'}}>OWNED</div>}
              {!owned && <div style={{fontSize:8,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.15em'}}>{t.free?'FREE':'PTS'}</div>}
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

function MusicPlayer({currentTrackId,onTogglePlay,onOpenStore,muted,onToggleMute}){
  const track = currentTrackId ? MUSIC_TRACKS.find(t=>t.id===currentTrackId) : null;
  return <div data-music="true" style={{position:'fixed',bottom:16,left:16,zIndex:45,display:'flex',alignItems:'center',gap:8,padding:'8px 10px 8px 8px',background:'rgba(15,10,8,0.9)',backdropFilter:'blur(12px)',borderRadius:18,border:'1px solid rgba(74,222,128,0.25)',boxShadow:'0 8px 24px -6px rgba(0,0,0,0.7)'}}>
      <button onClick={onOpenStore} title="Music library" style={{width:38,height:38,borderRadius:'50%',background:track?`radial-gradient(circle at 35% 35%, ${track.color}, ${track.color}66)`:'rgba(255,107,0,0.2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:track&&!muted?'spin 4s linear infinite':'none',boxShadow:track?`0 0 16px ${track.color}55`:'none'}}>
        {track ? <Disc3 size={18} style={{color:'#0a0a0a'}}/> : <Music size={16} style={{color:'#4ade80'}}/>}
      </button>
      {track && <>
        <div style={{display:'flex',flexDirection:'column',minWidth:0,maxWidth:120}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:11,color:'#fff7ed',letterSpacing:'0.08em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.name}</div>
          <div style={{fontSize:8,color:track.color,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.15em'}}>{muted?'MUTED':'NOW PLAYING'}</div>
        </div>
        <button onClick={onToggleMute} title={muted?'Unmute':'Mute'} style={{width:28,height:28,borderRadius:6,background:'transparent',border:'none',color:muted?'#78716c':'#fb923c',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
        </button>
        <button onClick={()=>onTogglePlay(null)} title="Stop" style={{width:28,height:28,borderRadius:6,background:'transparent',border:'none',color:'#fca5a5',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <X size={14}/>
        </button>
      </>}
    </div>;
}

/* ==========================================================
   COMING SOON MODAL — generic
   ========================================================== */
function ComingSoonModal({title,body,onClose}){
  return <div style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:440,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(168,85,247,0.3)',boxShadow:'0 30px 80px rgba(0,0,0,0.8)',padding:28,textAlign:'center'}}>
      <div style={{width:64,height:64,margin:'0 auto 14px',borderRadius:'50%',background:'linear-gradient(135deg, #a855f7, #6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 30px rgba(168,85,247,0.4)'}}>
        <Gamepad2 size={32} style={{color:'#fff7ed'}}/>
      </div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:30,letterSpacing:'0.04em',marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:'#a8a29e',lineHeight:1.55,marginBottom:18}}>{body}</div>
      <button onClick={onClose} style={{padding:'10px 24px',borderRadius:8,background:'linear-gradient(135deg, #a855f7, #6d28d9)',color:'#fff7ed',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.12em'}}>GOT IT</button>
    </div>
  </div>;
}

/* ==========================================================
   COLLECTION SCREEN — full deep-dive with sort/filter/search
   ========================================================== */
/* BINDERS */
function findCardSlot(binderData, cardId){
  const binders = (binderData && binderData.binders) || [];
  for(const b of binders){
    const slots = b.slots || {};
    for(const k of Object.keys(slots)){ if(slots[k] === cardId) return { binderId: b.id, slot: Number(k) }; }
  }
  return null;
}
function getLooseCards(me){
  const bd = me.binderData || { binders: [] };
  return me.ownedCards.filter(c => !findCardSlot(bd, c.id));
}
function firstEmptySlot(binder){
  const slots = binder.slots || {};
  const cap = (binder.pageCount || 10) * 9;
  for(let i=0;i<cap;i++){ if(!slots[i]) return i; }
  return -1;
}
const BINDER_ICONS = { star: Star, crown: Crown, flame: Flame, zap: Zap, trophy: Trophy, gem: Gem, rocket: Rocket, sparkles: Sparkles, award: Award, music: Music, gamepad: Gamepad2, disc: Disc3 };

function BinderCover({binder, onClick}){
  const [showBack, setShowBack] = useState(false);
  const mat = MATERIALS[binder.coverMaterial || 'bronze'] || MATERIALS.bronze;
  const color = binder.coverColor || '#3b82f6';
  const Icon = BINDER_ICONS[binder.coverIcon || 'star'] || Star;
  const filled = Object.keys(binder.slots || {}).length;
  const cap = (binder.pageCount || 10) * 9;
  return <div style={{position:'relative',width:'100%'}}>
    <button onClick={onClick} style={{position:'relative',textAlign:'left',cursor:'pointer',width:'100%',aspectRatio:'3/4',borderRadius:14,border:'2px solid '+mat.color,background:'linear-gradient(140deg, '+color+', '+color+'99 55%, #0c0907)',boxShadow:'0 8px 28px -6px '+color+'88, inset 0 0 30px '+mat.glow,padding:14,display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:10,background:'linear-gradient(180deg, '+mat.color+', '+color+')',opacity:0.8}}/>
      {showBack ? (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,width:'100%'}}>
          {binder.coverImage ? <img src={binder.coverImage} alt="" style={{maxWidth:'88%',maxHeight:'78%',objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'}}/> : <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.12em',textAlign:'center',lineHeight:1.5}}>NO BACK<br/>DESIGN YET</div>}
          <div style={{fontSize:8,color:'rgba(255,255,255,0.5)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.18em'}}>BACK</div>
        </div>
      ) : (
        <>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{padding:'3px 8px',borderRadius:20,background:'rgba(0,0,0,0.4)',fontSize:8,letterSpacing:'0.14em',color:mat.color,fontFamily:'"JetBrains Mono",monospace'}}>{mat.label}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,flex:1,minHeight:0}}>
            <Icon size={34} color="#fff7ed" strokeWidth={2}/>
          </div>
          <div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#fff7ed',letterSpacing:'0.06em',lineHeight:1,textShadow:'0 2px 6px rgba(0,0,0,0.6)'}}>{binder.title || 'BINDER'}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.7)',fontFamily:'"JetBrains Mono",monospace',marginTop:4}}>{filled}/{cap} CARDS</div>
          </div>
        </>
      )}
    </button>
    <button onClick={(e)=>{e.stopPropagation(); setShowBack(s=>!s);}} title="Flip cover" style={{position:'absolute',bottom:8,right:8,width:28,height:28,borderRadius:8,background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff7ed',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
      <RotateCcw size={13}/>
    </button>
  </div>;
}

function BinderPocket({card, onClick}){
  if(!card){
    return <div onClick={onClick} style={{aspectRatio:'3/4',borderRadius:10,border:'1.5px dashed rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
      <div style={{fontSize:18,color:'rgba(255,255,255,0.12)'}}>+</div>
    </div>;
  }
  return <PlayerCard card={card} onClick={onClick}/>;
}

function BinderView({binder, me, onBack, onOpenCard, onPlaceCard, onRemoveCard}){
  const [page, setPage] = useState(0);
  const [pickerSlot, setPickerSlot] = useState(null);
  const [menuSlot, setMenuSlot] = useState(null);
  const slots = binder.slots || {};
  const pageCount = binder.pageCount || 10;
  const mat = MATERIALS[binder.coverMaterial || 'bronze'] || MATERIALS.bronze;
  const cardById = id => me.ownedCards.find(c => c.id === id) || null;
  const startSlot = page * 9;
  const pockets = [];
  for(let i=0;i<9;i++){ const si = startSlot+i; pockets.push({si, card: slots[si] ? cardById(slots[si]) : null}); }
  return <div style={{maxWidth:520,margin:'0 auto',padding:'18px 16px 120px'}}>
    <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#a8a29e',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:11,letterSpacing:'0.1em',marginBottom:14}}>
      <ChevronLeft size={16}/> ALL BINDERS
    </button>
    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:30,color:mat.color,letterSpacing:'0.06em',lineHeight:1}}>{binder.title}</div>
    <div style={{fontSize:10,color:'#78716c',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em',marginTop:4,marginBottom:18}}>PAGE {page+1} OF {pageCount}</div>
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:14}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        {pockets.map(p => <BinderPocket key={p.si} card={p.card} onClick={()=> p.card ? setMenuSlot(p.si) : setPickerSlot(p.si)}/>)}
      </div>
    </div>
    {pickerSlot !== null && (()=>{ const loose = getLooseCards(me); return <div onClick={()=>setPickerSlot(null)} style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,background:'linear-gradient(180deg, #1a0f0a, #0c0907)',borderTopLeftRadius:22,borderTopRightRadius:22,borderTop:'1px solid rgba(96,165,250,0.4)',padding:'16px 16px max(28px, env(safe-area-inset-bottom))',maxHeight:'76vh',overflowY:'auto'}}>
        <div style={{width:44,height:4,borderRadius:2,background:'rgba(255,255,255,0.2)',margin:'0 auto 14px'}}/>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#93c5fd',letterSpacing:'0.08em',textAlign:'center',marginBottom:4}}>ADD A CARD</div>
        <div style={{fontSize:10,color:'#78716c',textAlign:'center',marginBottom:14,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>PAGE {page+1} - POCKET {(pickerSlot%9)+1}</div>
        {loose.length===0 ? <div style={{textAlign:'center',color:'#78716c',padding:'30px 0',fontFamily:'"Outfit",sans-serif',fontSize:13}}>No loose cards left. Everything is filed away!</div> :
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {loose.map(card=><BinderPocket key={card.id} card={card} onClick={()=>{ onPlaceCard(binder.id, pickerSlot, card.id); setPickerSlot(null); }}/>)}
        </div>}
        <button onClick={()=>setPickerSlot(null)} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#a8a29e',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>CANCEL</button>
      </div>
    </div>; })()}
    {menuSlot !== null && (()=>{ const mc = slots[menuSlot] ? cardById(slots[menuSlot]) : null; if(!mc){ return null; } return <div onClick={()=>setMenuSlot(null)} style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:300,background:'linear-gradient(180deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(255,255,255,0.12)',padding:18}}>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#fff7ed',letterSpacing:'0.04em',textAlign:'center'}}>{mc.first} {mc.last}</div>
        <div style={{fontSize:10,color:'#78716c',textAlign:'center',marginBottom:16,fontFamily:'"JetBrains Mono",monospace'}}>{mc.team||''}</div>
        <button onClick={()=>{ setMenuSlot(null); onOpenCard(mc); }} style={{width:'100%',marginBottom:8,padding:'11px',borderRadius:10,background:'rgba(96,165,250,0.12)',border:'1px solid rgba(96,165,250,0.35)',color:'#93c5fd',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>VIEW CARD</button>
        <button onClick={()=>{ onRemoveCard(binder.id, menuSlot); setMenuSlot(null); }} style={{width:'100%',marginBottom:8,padding:'11px',borderRadius:10,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.35)',color:'#fca5a5',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:13,letterSpacing:'0.1em'}}>REMOVE FROM BINDER</button>
        <button onClick={()=>setMenuSlot(null)} style={{width:'100%',padding:'8px',borderRadius:10,background:'none',border:'none',color:'#78716c',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'0.12em'}}>CLOSE</button>
      </div>
    </div>; })()}
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:18,marginTop:18}}>
      <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{display:'flex',alignItems:'center',gap:4,padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:page===0?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)',color:page===0?'#57534e':'#fff7ed',cursor:page===0?'default':'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.08em'}}>
        <ChevronLeft size={16}/> PREV
      </button>
      <button onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} disabled={page>=pageCount-1} style={{display:'flex',alignItems:'center',gap:4,padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:page>=pageCount-1?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)',color:page>=pageCount-1?'#57534e':'#fff7ed',cursor:page>=pageCount-1?'default':'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:14,letterSpacing:'0.08em'}}>
        NEXT <ChevronRight size={16}/>
      </button>
    </div>
  </div>;
}

function BindersScreen({me, onOpenCard, onPlaceCard, onRemoveCard}){
  const [openBinderId, setOpenBinderId] = useState(null);
  const binders = (me.binderData && me.binderData.binders) || [];
  const openBinder = binders.find(b => b.id === openBinderId);
  if(openBinder) return <BinderView binder={openBinder} me={me} onBack={()=>setOpenBinderId(null)} onOpenCard={onOpenCard} onPlaceCard={onPlaceCard} onRemoveCard={onRemoveCard}/>;
  return <div style={{maxWidth:520,margin:'0 auto',padding:'18px 16px 120px'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
      <Grid3x3 size={26} color="#fb923c"/>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:34,color:'#fff7ed',letterSpacing:'0.04em'}}>BINDERS</div>
    </div>
    <div style={{fontSize:12,color:'#a8a29e',marginBottom:20,fontFamily:'"Outfit",sans-serif'}}>{binders.length} binder{binders.length===1?'':'s'} - sort your collection into pages of 9</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      {binders.map(b => <BinderCover key={b.id} binder={b} onClick={()=>setOpenBinderId(b.id)}/>)}
    </div>
    {binders.length===0 && <div style={{textAlign:'center',color:'#78716c',padding:'40px 0',fontFamily:'"Outfit",sans-serif',fontSize:13}}>No binders yet. Buy one in the Shop!</div>}
  </div>;
}

function CollectionScreen({me,onOpenCard,onMergeDuplicates}){
  const [search,setSearch] = useState('');
  const [rarityFilter,setRarityFilter] = useState('all');
  const [materialFilter,setMaterialFilter] = useState('all');
  const [sort,setSort] = useState('rarity');
  const [hoveredId,setHoveredId] = useState(null);
  const looseAll = useMemo(()=>getLooseCards(me),[me.ownedCards, me.binderData]);

  const cards = useMemo(()=>{
    let out = looseAll;
    if(search.trim()){
      const q = search.toLowerCase();
      out = out.filter(c=>(`${c.first} ${c.last}`).toLowerCase().includes(q) || (c.team||'').toLowerCase().includes(q) || (c.tag||'').toLowerCase().includes(q));
    }
    if(rarityFilter!=='all') out = out.filter(c=>c.rarity===rarityFilter);
    if(materialFilter!=='all') out = out.filter(c=>(c.material||'bronze')===materialFilter);
    const sorted = [...out];
    if(sort==='rarity') sorted.sort((a,b)=>RARITIES[b.rarity].tier - RARITIES[a.rarity].tier || (MATERIALS[b.material||'bronze'].mult - MATERIALS[a.material||'bronze'].mult));
    else if(sort==='material') sorted.sort((a,b)=>MATERIALS[b.material||'bronze'].mult - MATERIALS[a.material||'bronze'].mult);
    else if(sort==='earnings') sorted.sort((a,b)=>(b.pps*(b.qty||1)) - (a.pps*(a.qty||1)));
    else if(sort==='value') sorted.sort((a,b)=>getCardValue(b)*(b.qty||1) - getCardValue(a)*(a.qty||1));
    else if(sort==='name') sorted.sort((a,b)=>(`${a.last} ${a.first}`).localeCompare(`${b.last} ${b.first}`));
    return sorted;
  },[looseAll,search,rarityFilter,materialFilter,sort]);

  // Stats — account for stacks
  const totalEarn = looseAll.reduce((s,c)=>s + effPps(c.pps, getCardState(me,c.id).damage)*(c.qty||1), 0);
  const totalValue = looseAll.reduce((s,c)=>s + getCardValue(c)*(c.qty||1), 0);
  const totalCardsCount = looseAll.reduce((s,c)=>s + (c.qty||1), 0);
  const tierCounts = looseAll.reduce((m,c)=>{m[c.rarity]=(m[c.rarity]||0) + (c.qty||1); return m;},{});

  // Detect duplicates that could still be merged (e.g. legacy data from before this feature)
  const dupeCount = useMemo(()=>{
    const seen = new Set();
    let dupes = 0;
    for(const c of looseAll){
      const k = cardKey(c);
      if(seen.has(k)) dupes++;
      else seen.add(k);
    }
    return dupes;
  },[looseAll]);

  return <div style={{padding:'24px 28px 40px'}}>
    {/* Header */}
    <div style={{marginBottom:18,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div>
        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:38,lineHeight:0.9,letterSpacing:'0.02em'}}>{me.displayName.toUpperCase()}'S COLLECTION</div>
        <div style={{fontSize:12,color:'#a8a29e',marginTop:4}}>{looseAll.length} loose{totalCardsCount !== looseAll.length ? ` · ${totalCardsCount} total` : ''} · {totalEarn}/sec · worth {totalValue.toLocaleString()} pts</div>
      </div>
      {dupeCount > 0 && onMergeDuplicates && (
        <button onClick={onMergeDuplicates} title={`Stack ${dupeCount} duplicate${dupeCount===1?'':'s'} into single cards with quantity`} style={{padding:'9px 14px',borderRadius:10,background:'linear-gradient(135deg, #fbbf24, #d97706)',color:'#0a0a0a',border:'none',cursor:'pointer',fontFamily:'"Bebas Neue",sans-serif',fontSize:12,letterSpacing:'0.1em',display:'flex',alignItems:'center',gap:7,boxShadow:'0 4px 14px rgba(251,191,36,0.4)'}}>
          <Library size={13}/>MERGE {dupeCount} DUPLICATE{dupeCount===1?'':'S'}
        </button>
      )}
    </div>

    {/* Stats strip */}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
      {Object.entries(RARITIES).map(([k,r])=>{
        const n = tierCounts[k]||0;
        if(n===0) return null;
        return <div key={k} style={{padding:'5px 11px',borderRadius:999,background:`${r.color}15`,border:`1px solid ${r.color}55`,fontSize:11,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em',color:r.color}}><span style={{fontWeight:800}}>{n}</span> {r.label}</div>;
      })}
    </div>

    {/* Search + sort row */}
    <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
      <div style={{flex:1,minWidth:200,position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#78716c'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search cards by name, team, tag…" style={{width:'100%',padding:'9px 11px 9px 33px',borderRadius:8,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',fontFamily:'"Outfit",sans-serif',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px 4px 12px',borderRadius:8,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.08)'}}>
        <ArrowUpDown size={13} style={{color:'#78716c'}}/>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:'transparent',border:'none',color:'#fff7ed',fontFamily:'"JetBrains Mono",monospace',fontSize:12,cursor:'pointer',outline:'none'}}>
          <option value="rarity" style={{background:'#0a0a0a'}}>RARITY</option>
          <option value="material" style={{background:'#0a0a0a'}}>MATERIAL</option>
          <option value="earnings" style={{background:'#0a0a0a'}}>EARNINGS</option>
          <option value="value" style={{background:'#0a0a0a'}}>VALUE</option>
          <option value="name" style={{background:'#0a0a0a'}}>NAME</option>
        </select>
      </div>
    </div>

    {/* Filter chips */}
    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
      <span style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace',marginRight:4}}>RARITY</span>
      <FilterChip active={rarityFilter==='all'} onClick={()=>setRarityFilter('all')} color="#fb923c" label="ALL"/>
      {Object.entries(RARITIES).map(([k,r])=><FilterChip key={k} active={rarityFilter===k} onClick={()=>setRarityFilter(k)} color={r.color} label={r.label}/>)}
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:18}}>
      <span style={{fontSize:9.5,color:'#78716c',letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace',marginRight:4}}>MATERIAL</span>
      <FilterChip active={materialFilter==='all'} onClick={()=>setMaterialFilter('all')} color="#fb923c" label="ALL"/>
      {Object.entries(MATERIALS).map(([k,mat])=><FilterChip key={k} active={materialFilter===k} onClick={()=>setMaterialFilter(k)} color={mat.color} label={mat.label}/>)}
    </div>

    {/* Cards grid */}
    {cards.length===0 ? (
      <div style={{padding:40,textAlign:'center',color:'#78716c',fontFamily:'"JetBrains Mono",monospace',fontSize:12,letterSpacing:'0.12em'}}>NO CARDS MATCH THESE FILTERS</div>
    ) : (
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:16}}>
        {cards.map((card,idx)=><div key={card.id} className="card-stagger" style={{animationDelay:`${Math.min(idx,12)*50}ms`}}>
          <PlayerCard card={card} damage={getCardState(me,card.id).damage} hovered={hoveredId===card.id} onHover={()=>setHoveredId(card.id)} onLeave={()=>setHoveredId(null)} onClick={()=>onOpenCard(card)}/>
        </div>)}
      </div>
    )}
  </div>;
}

/* ==========================================================
   PAINT CANVAS — drawing surface for Design Studio
   ========================================================== */
function PaintCanvas({portrait,onChange,clipboardRef}){
  const canvasRef = useRef(null);
  const [tool,setTool] = useState('marker');
  const [color,setColor] = useState('#fb923c');
  const [drawing,setDrawing] = useState(false);
  const [shapeStart,setShapeStart] = useState(null);
  const snapshotRef = useRef(null);
  const lastPointRef = useRef(null);
  const W = 280, H = 392;

  // Init: load existing portrait or blank
  useEffect(()=>{
    const c = canvasRef.current;
    if(!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0,0,W,H);
    if(portrait){
      const img = new Image();
      img.onload = ()=>{ ctx.drawImage(img,0,0,W,H); };
      img.src = portrait;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const exportData = () => onChange(canvasRef.current.toDataURL('image/png'));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy };
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    if(tool==='paint'){
      floodFill(ctx, Math.floor(p.x), Math.floor(p.y), color);
      exportData();
      return;
    }
    setDrawing(true);
    lastPointRef.current = p;
    if(tool==='circle' || tool==='box' || tool==='line'){
      setShapeStart(p);
      snapshotRef.current = ctx.getImageData(0,0,W,H);
    } else {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.strokeStyle = tool==='eraser' ? '#fef3c7' : color;
      ctx.lineWidth = tool==='eraser' ? 16 : (tool==='marker' ? 6 : 2);
      // Draw a dot for single click
      ctx.lineTo(p.x+0.1, p.y+0.1);
      ctx.stroke();
    }
  };

  const onPointerMove = (e) => {
    if(!drawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    if(tool==='circle' || tool==='box' || tool==='line'){
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap='round';
      if(tool==='line'){
        ctx.beginPath();
        ctx.moveTo(shapeStart.x, shapeStart.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if(tool==='box'){
        const x = Math.min(shapeStart.x, p.x), y = Math.min(shapeStart.y, p.y);
        const w = Math.abs(p.x - shapeStart.x), h = Math.abs(p.y - shapeStart.y);
        ctx.strokeRect(x, y, w, h);
      } else if(tool==='circle'){
        const r = Math.hypot(p.x - shapeStart.x, p.y - shapeStart.y);
        ctx.beginPath();
        ctx.arc(shapeStart.x, shapeStart.y, r, 0, Math.PI*2);
        ctx.stroke();
      }
    } else {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastPointRef.current = p;
  };

  const onPointerUp = () => {
    if(!drawing) return;
    setDrawing(false);
    setShapeStart(null);
    snapshotRef.current = null;
    exportData();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0,0,W,H);
    exportData();
  };

  const insertPose = (poseKey) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0,0,W,H);
    const PoseComp = POSE_PORTRAITS[poseKey];
    if(!PoseComp) return;
    const svgStr = poseToSVGString(poseKey, color);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
    const img = new Image();
    img.onload = ()=>{
      ctx.drawImage(img, 30, 30, W-60, H-60);
      exportData();
    };
    img.onerror = ()=>{
      // Fallback: just draw a stick figure with current color so user gets something
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(W/2, 90, 28, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W/2,118); ctx.lineTo(W/2,240);
      ctx.moveTo(W/2,150); ctx.lineTo(W/2-40,200);
      ctx.moveTo(W/2,150); ctx.lineTo(W/2+40,200);
      ctx.moveTo(W/2,240); ctx.lineTo(W/2-30,310);
      ctx.moveTo(W/2,240); ctx.lineTo(W/2+30,310);
      ctx.stroke();
      exportData();
    };
    img.src = url;
  };

  const copy = () => {
    if(!clipboardRef) return;
    clipboardRef.current = canvasRef.current.toDataURL('image/png');
  };
  const paste = () => {
    if(!clipboardRef || !clipboardRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.onload = ()=>{ ctx.drawImage(img,0,0,W,H); exportData(); };
    img.src = clipboardRef.current;
  };

  const tools = [
    {id:'pencil',icon:Pencil,label:'PENCIL'},
    {id:'eraser',icon:Eraser,label:'ERASE'},
    {id:'marker',icon:Brush,label:'MARKER'},
    {id:'line',icon:Minus,label:'LINE'},
    {id:'circle',icon:CircleIcon,label:'CIRCLE'},
    {id:'box',icon:Square,label:'BOX'},
    {id:'paint',icon:PaintBucket,label:'FILL'},
  ];
  const palette = ['#000000','#fb923c','#ef4444','#22c55e','#3b82f6','#a855f7','#fbbf24','#67e8f9','#ec4899','#7c2d12','#fef3c7','#ffffff'];

  return <div style={{display:'flex',flexDirection:'column',gap:12,alignItems:'center'}}>
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{width:'100%',maxWidth:280,aspectRatio:`${W}/${H}`,borderRadius:8,touchAction:'none',cursor:'crosshair',background:'#fef3c7',border:'2px solid rgba(255,107,0,0.3)',boxShadow:'0 4px 14px rgba(0,0,0,0.4)'}}
    />
    {/* Tool palette */}
    <div style={{width:'100%',background:'rgba(0,0,0,0.3)',borderRadius:10,padding:8,border:'1px solid rgba(255,255,255,0.06)'}}>
      {/* Drawing tools row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7, 1fr)',gap:4,marginBottom:6}}>
        {tools.map(t=>(
          <button key={t.id} onClick={()=>setTool(t.id)} title={t.label} style={{padding:'7px 0',borderRadius:6,background:tool===t.id?'#fb923c':'rgba(255,255,255,0.04)',border:'none',color:tool===t.id?'#0a0a0a':'#a8a29e',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <t.icon size={14}/>
            <span style={{fontSize:7,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.05em',fontWeight:700}}>{t.label}</span>
          </button>
        ))}
      </div>
      {/* Action row: clear, copy, paste */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginBottom:8}}>
        <button onClick={clearCanvas} title="Clear all" style={{padding:'6px 0',borderRadius:6,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',color:'#fca5a5',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em'}}><RotateCcw size={11}/>CLEAR</button>
        <button onClick={copy} style={{padding:'6px 0',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em'}}><Copy size={11}/>COPY</button>
        <button onClick={paste} style={{padding:'6px 0',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#fff7ed',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'"Bebas Neue",sans-serif',fontSize:11,letterSpacing:'0.08em'}}><Clipboard size={11}/>PASTE</button>
      </div>
      {/* Color palette */}
      <div style={{marginBottom:6}}>
        <div style={{fontSize:8,color:'#78716c',letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>COLOUR</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(12, 1fr)',gap:3}}>
          {palette.map(c=>(
            <button key={c} onClick={()=>setColor(c)} title={c} style={{aspectRatio:'1',borderRadius:4,background:c,border:color===c?'2px solid #fff7ed':'1px solid rgba(255,255,255,0.15)',cursor:'pointer',padding:0,boxShadow:color===c?'0 0 6px rgba(255,255,255,0.4)':'none'}}/>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:28,height:24,border:'1px solid rgba(255,255,255,0.15)',borderRadius:4,padding:0,background:'transparent',cursor:'pointer'}}/>
          <span style={{fontSize:9,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.1em'}}>CUSTOM · {color.toUpperCase()}</span>
        </div>
      </div>
      {/* Insert player (4 SVG poses) */}
      <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontSize:8,color:'#78716c',letterSpacing:'0.16em',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>INSERT PLAYER · loads pose template</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:4}}>
          {Object.keys(POSE_PORTRAITS).map(key=>{
            const Pose = POSE_PORTRAITS[key];
            return <button key={key} onClick={()=>insertPose(key)} title={key} style={{aspectRatio:'5/7',borderRadius:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',padding:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{flex:1,width:'100%',color:'#fb923c'}}><Pose color="#fb923c"/></div>
              <div style={{fontSize:7,color:'#a8a29e',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.08em',marginTop:2}}>{key.toUpperCase()}</div>
            </button>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

// Flood fill for the paint bucket
function floodFill(ctx, startX, startY, hexColor){
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if(startX<0||startX>=W||startY<0||startY>=H) return;
  const data = ctx.getImageData(0,0,W,H);
  const px = data.data;
  const idx = (startY*W + startX) * 4;
  const target = [px[idx], px[idx+1], px[idx+2], px[idx+3]];
  const fill = hexToRgba(hexColor);
  if(target[0]===fill[0] && target[1]===fill[1] && target[2]===fill[2] && target[3]===fill[3]) return;
  const stack = [[startX, startY]];
  const matches = (i) => Math.abs(px[i]-target[0])<8 && Math.abs(px[i+1]-target[1])<8 && Math.abs(px[i+2]-target[2])<8 && Math.abs(px[i+3]-target[3])<8;
  while(stack.length){
    const [x,y] = stack.pop();
    if(x<0||x>=W||y<0||y>=H) continue;
    const i = (y*W + x)*4;
    if(!matches(i)) continue;
    px[i]=fill[0]; px[i+1]=fill[1]; px[i+2]=fill[2]; px[i+3]=fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(data,0,0);
}
function hexToRgba(hex){
  const h = hex.replace('#','');
  const v = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), 255];
}

// Inline SVG strings for the 4 poses (so we can rasterize to canvas)
function poseToSVGString(poseKey, color){
  const c = color;
  const paths = {
    dunk: `<g transform="translate(155, 32)"><circle r="22" fill="${c}"/><line x1="0" y1="-22" x2="0" y2="22" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/></g><path d="M95 88 Q112 60 138 40 L156 56 Q132 72 112 96 Z" fill="${c}"/><path d="M82 64 Q72 64 70 78 Q70 92 86 92 Q98 92 100 80 Q100 64 82 64 Z" fill="${c}"/><path d="M70 92 L112 96 L118 168 L62 158 Z" fill="${c}"/><path d="M65 102 Q35 112 28 144 L42 154 Q52 132 78 122 Z" fill="${c}"/><path d="M82 158 L58 215 L72 226 L100 168 Z" fill="${c}"/><path d="M110 162 L160 235 L144 244 L100 176 Z" fill="${c}"/>`,
    jumpman: `<g transform="translate(170, 22)"><circle r="18" fill="${c}"/><line x1="-18" y1="0" x2="18" y2="0" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/></g><path d="M100 78 L155 28 L168 38 L115 92 Z" fill="${c}"/><ellipse cx="92" cy="72" rx="11" ry="13" fill="${c}"/><path d="M78 88 Q70 110 76 145 L120 155 Q130 120 118 92 Z" fill="${c}"/><path d="M82 98 L40 90 L34 102 L78 118 Z" fill="${c}"/><path d="M82 142 L40 178 L48 192 L92 158 Z" fill="${c}"/><path d="M115 150 L160 220 L144 232 L100 168 Z" fill="${c}"/>`,
    fadeaway: `<g transform="translate(105, 20)"><circle r="18" fill="${c}"/><line x1="0" y1="-18" x2="0" y2="18" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/></g><path d="M88 80 L100 35 L115 38 L105 88 Z" fill="${c}"/><ellipse cx="78" cy="72" rx="11" ry="13" fill="${c}"/><path d="M70 88 Q58 115 65 160 L110 165 Q115 125 105 90 Z" fill="${c}"/><path d="M75 105 L48 130 L55 142 L88 122 Z" fill="${c}"/><path d="M72 158 L52 220 L66 228 L90 168 Z" fill="${c}"/><path d="M100 162 L138 215 L124 224 L92 170 Z" fill="${c}"/>`,
    skyhook: `<g transform="translate(155, 18)"><circle r="20" fill="${c}"/><line x1="0" y1="-20" x2="0" y2="20" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/></g><path d="M85 75 Q120 45 152 30 L160 48 Q128 64 100 92 Z" fill="${c}"/><ellipse cx="78" cy="68" rx="12" ry="14" fill="${c}"/><path d="M65 88 L108 92 L110 175 L62 170 Z" fill="${c}"/><path d="M68 110 L40 130 L44 144 L78 128 Z" fill="${c}"/><path d="M70 168 L60 240 L78 245 L92 175 Z" fill="${c}"/><path d="M100 172 L130 215 L144 208 L112 168 Z" fill="${c}"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">${paths[poseKey]||paths.dunk}</svg>`;
}

/* ==========================================================
   EDIT OLD CARDS MODAL
   ========================================================== */
function EditOldCardsModal({me,onClose,onPick}){
  return <div style={{position:'fixed',inset:0,zIndex:170,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{maxWidth:680,width:'100%',background:'linear-gradient(160deg, #1a0f0a, #0c0907)',borderRadius:18,border:'1px solid rgba(168,85,247,0.3)',boxShadow:'0 30px 80px rgba(0,0,0,0.8)',padding:24,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:26,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}><Edit3 size={22} style={{color:'#a855f7'}}/>EDIT OLD CARD</div>
          <div style={{fontSize:11,color:'#a8a29e',marginTop:2}}>Pick a card to load into the design studio · keeps stats, lets you redraw the portrait</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff7ed',cursor:'pointer',padding:8,borderRadius:8}}><X size={18}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {me.ownedCards.length===0 ? (
          <div style={{padding:30,textAlign:'center',color:'#78716c',fontSize:12}}>NO CARDS YET — open a pack first!</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:10}}>
            {me.ownedCards.map(c=>(
              <button key={c.id} onClick={()=>onPick(c)} style={{padding:0,border:'none',background:'transparent',cursor:'pointer'}}>
                <PlayerCard card={c}/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>;
}

/* NAV BUTTON */
function Butterfly({style}){
  return(
    <div style={{position:'absolute',pointerEvents:'none',fontSize:16,...style}}>
      <span style={{display:'inline-block',animation:'butterfly-wing 0.4s ease-in-out infinite alternate'}}>🦋</span>
    </div>
  );
}

function FloatingNature(){
  // Subtle background butterflies + drifting leaves
  const butterflies = [
    {top:'15%',animationDelay:'0s',  animationDuration:'18s',opacity:0.35},
    {top:'45%',animationDelay:'7s',  animationDuration:'22s',opacity:0.25},
    {top:'28%',animationDelay:'13s', animationDuration:'20s',opacity:0.30},
    {top:'65%',animationDelay:'4s',  animationDuration:'25s',opacity:0.20},
  ];
  const leaves = [
    {left:'10%',top:'20%',animationDelay:'0s',  animationDuration:'8s',  emoji:'🍃'},
    {left:'30%',top:'10%',animationDelay:'3s',  animationDuration:'10s', emoji:'🌸'},
    {left:'55%',top:'15%',animationDelay:'6s',  animationDuration:'9s',  emoji:'🍃'},
    {left:'75%',top:'8%', animationDelay:'1.5s',animationDuration:'11s', emoji:'🌸'},
    {left:'88%',top:'25%',animationDelay:'5s',  animationDuration:'7s',  emoji:'🌿'},
    {left:'20%',top:'5%', animationDelay:'9s',  animationDuration:'12s', emoji:'🌿'},
  ];
  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,overflow:'hidden'}}>
      {/* Waterfall — right side */}
      <div style={{position:'absolute',top:0,right:'1%',width:40,height:'100%',opacity:0.2}}>
        {[0,1,2,3,4,5,6,7].map(i=>(
          <div key={i} style={{position:'absolute',left:i*2+'px',top:0,width:2,height:'100%',background:'linear-gradient(180deg,transparent 0%,#67e8f9 20%,#22d3ee 50%,#67e8f9 80%,transparent 100%)',animation:'waterfall-stream 1.8s linear '+(i*0.22)+'s infinite',borderRadius:2}}/>
        ))}
      </div>
      {/* Waterfall splash at bottom */}
      <div style={{position:'absolute',bottom:'0',right:'0%',width:100,height:45,background:'radial-gradient(ellipse at center,rgba(103,232,249,0.25) 0%,transparent 70%)',animation:'splash-pulse 1.8s ease-in-out infinite',borderRadius:'50%'}}/>
      {butterflies.map((b,i)=>(
        <div key={i} style={{position:'absolute',top:b.top,left:0,animation:'butterfly-fly '+b.animationDuration+' linear '+b.animationDelay+' infinite',opacity:b.opacity}}>
          <span style={{display:'inline-block',fontSize:18,animation:'butterfly-wing 0.45s ease-in-out infinite alternate'}}>🦋</span>
        </div>
      ))}
      {leaves.map((l,i)=>(
        <div key={'l'+i} style={{position:'absolute',left:l.left,top:l.top,animation:'leaf-drift '+l.animationDuration+' ease-in-out '+l.animationDelay+' infinite',opacity:0.3,fontSize:14}}>
          {l.emoji}
        </div>
      ))}
    </div>
  );
}

function NavButton({label,sub,Icon,emoji,isHero,isActive,onClick,color}){
  return <button onClick={onClick} className={isActive?'nav-active':''} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:isHero?'10px 22px':'10px 14px',minWidth:isHero?120:74,borderRadius:12,border:'none',cursor:'pointer',background:isActive?(isHero?'linear-gradient(135deg, #22c55e, #16a34a)':'rgba(74,222,128,0.18)'):(isHero?'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(34,197,94,0.3))':'transparent'),color:isActive?'#f0fdf4':(isHero?'#4ade80':color||'#a8a29e'),transition:'all 250ms',fontFamily:'"Outfit",sans-serif'}} onMouseEnter={e=>{if(!isActive&&!isHero) e.currentTarget.style.background='rgba(255,255,255,0.05)';}} onMouseLeave={e=>{if(!isActive&&!isHero) e.currentTarget.style.background='transparent';}}>
    {emoji ? <span style={{fontSize:isHero?22:18,lineHeight:1}}>{emoji}</span> : <Icon size={isHero?20:16} strokeWidth={2.2}/>}
    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:isHero?14:11,letterSpacing:'0.1em',marginTop:3,lineHeight:1}}>{label}</div>
    <div style={{fontSize:7.5,letterSpacing:'0.18em',marginTop:2,opacity:0.7,fontWeight:600}}>{sub}</div>
  </button>;
}

/* ==========================================================
   MAIN APP — auth, persistent storage, routing
   ========================================================== */

export default function EcoHome({ session }){
  const [storageReady,setStorageReady] = useState(false);
  const [users,setUsers] = useState({});
  const [pendingTrades,setPendingTrades] = useState([]);
  // currentUsername is driven by the Supabase session — set after data loads.
  const [currentUsername,setCurrentUsername] = useState(null);
  const [screen,setScreen] = useState('home');
  const [packOpening,setPackOpening] = useState(null);
  const [aiTradeTable,setAITradeTable] = useState(null);
  const [friendTradeOpen,setFriendTradeOpen] = useState(null);
  const [inboxOpen,setInboxOpen] = useState(false);
  const [userMenuOpen,setUserMenuOpen] = useState(false);
  const [leaderboardOpen,setLeaderboardOpen] = useState(false);
  const [mobileNavOpen,setMobileNavOpen] = useState(false);
  const [rouletteWin,setRouletteWin] = useState(null);
  const [cardDetail,setCardDetail] = useState(null);
  const [toast,setToast] = useState(null);
  const [comingSoonOpen,setComingSoonOpen] = useState(false);
  const [musicTrackId,setMusicTrackId] = useState(null);
  const [musicMuted,setMusicMuted] = useState(false);
  const [musicStoreOpen,setMusicStoreOpen] = useState(false);
  const [supernovaCard,setSupernovaCard] = useState(null);
  const [moonCard,setMoonCard] = useState(null);
  const [editingCardForDesign,setEditingCardForDesign] = useState(null);
  const [favCardPickerOpen,setFavCardPickerOpen] = useState(false);

  const handleFeedAnimal=(cardId,foodId)=>{
    if(!me)return;
    const food=FOOD_ITEMS.find(f=>f.id===foodId);if(!food)return;
    const newInv={...(me.foodInventory||{})};
    if(!newInv[foodId]||newInv[foodId]<1){showToast('No food left!','err');return;}
    newInv[foodId]=(newInv[foodId]||0)-1;
    const card=me.ownedCards.find(c=>c.id===cardId);
    const pct=getFoodPct(foodId,card);
    const cur=(me.cardHunger&&me.cardHunger[cardId])??100;
    const nh=Math.min(100,cur+pct);
    updateUser(me.username,u=>({...u,foodInventory:newInv,cardHunger:{...(u.cardHunger||{}),[cardId]:nh}}));
    showToast('+'+pct+'% hunger restored!','ok');
  };
  const handleHealAnimal=(cardId,vetId)=>{
    if(!me)return;
    const nv={...(me.vetInventory||{})};
    if(!nv[vetId]||nv[vetId]<1){showToast('No vet packs!','err');return;}
    nv[vetId]=(nv[vetId]||0)-1;
    const ni={...(me.cardInjury||{})};delete ni[cardId];
    updateUser(me.username,u=>({...u,vetInventory:nv,cardInjury:ni}));
    showToast('Animal healed!','ok');
  };
  const handleSendExpedition=(cardId)=>{
    if(!me)return;
    const returnAt=Date.now()+TRAVEL_DURATION_MS;
    const reward={};
    TRAVEL_MATERIALS.forEach(m=>{reward[m]=Math.floor(Math.random()*4)+1;});
    const injured=Math.random()<0.25;
    updateUser(me.username,u=>({...u,expeditions:{...(u.expeditions||{}),[cardId]:{returnAt,reward,injured,collected:false}}}));
    showToast('Expedition started! Returns in 1 min','ok');
  };
  const handleCollectExpedition=(cardId)=>{
    if(!me)return;
    const exp=(me.expeditions||{})[cardId];if(!exp||exp.collected)return;
    const nm={...(me.materials||{})};
    Object.entries(exp.reward||{}).forEach(([m,q])=>{nm[m]=(nm[m]||0)+q;});
    const ne={...(me.expeditions||{}),[cardId]:{...exp,collected:true}};
    const ni={...(me.cardInjury||{})};if(exp.injured){ni[cardId]='injured';}
    updateUser(me.username,u=>({...u,materials:nm,expeditions:ne,cardInjury:ni}));
    const ms=Object.entries(exp.reward||{}).filter(([,q])=>q>0).map(([m,q])=>'+'+q+' '+m).join(', ');
    showToast(exp.injured?'Got: '+ms+' — returned injured!':'Collected: '+ms,exp.injured?'err':'ok');
  };
  const handleAssignAnimal=function(ghIndex,cardId,assign){
    if(!me)return;
    var newGhs=(me.shelters||[]).map(function(gh,i){
      if(i!==ghIndex)return gh;
      var animals=gh.animals?gh.animals.slice():[];
      if(assign){if(!animals.includes(cardId))animals.push(cardId);}
      else{animals=animals.filter(function(id){return id!==cardId;});}
      return Object.assign({},gh,{animals:animals});
    });
    updateUser(me.username,function(u){return Object.assign({},u,{shelters:newGhs});});
    showToast(assign?'Animal added to shelter!':'Animal removed.','ok');
  };
  const handleBuildShelter=(size)=>{
    if(!me)return;
    const sz=SHELTER_SIZES[size];if(!sz)return;
    const nm={...(me.materials||{})};
    let ok=true;['wood','stone','glass','brick'].forEach(m=>{if((nm[m]||0)<sz[m])ok=false;});
    if(!ok){showToast('Not enough materials!','err');return;}
    ['wood','stone','glass','brick'].forEach(m=>{nm[m]=(nm[m]||0)-sz[m];});
    const ng=[...(me.shelters||[]),{size,builtAt:Date.now()}];
    updateUser(me.username,u=>({...u,materials:nm,shelters:ng}));
    showToast(sz.label+' shelter built! +'+sz.eco+' ECO/sec','ok');
  };

  const handlePickFavCard = (cardId) => {
    if(!me) return;
    updateUser(me.username, u=>({...u, favCardId:cardId}));
    setFavCardPickerOpen(false);
    showToast('FAVOURITE ANIMAL SET!');
  };
  const musicDisposeRef = useRef(null);
  const [selectedGoat,setSelectedGoat] = useState(null); // 'lebron' | 'mj' — set on login, themes the app background

  const showToast = (msg,kind='ok') => setToast({msg,kind});

  // Load on mount. NOTE: we deliberately do NOT subscribe to realtime
  // changes that would overwrite in-memory user state — that race
  // condition wiped Tyler's roster in the first version of Pass 2.
  // Trade refresh is handled manually when the user opens the inbox.
  useEffect(()=>{
    let cancelled = false;

    (async () => {
      try {
        const { users: nextUsers, pendingTrades: nextTrades } = await loadAllData();
        if (cancelled) return;
        var today=new Date().toDateString();
        var fixedUsers={};
        Object.keys(nextUsers).forEach(function(k){
          var u=nextUsers[k];
          if((u.packsAvailable||0)===0&&u.lastDailyDate!==today){
            fixedUsers[k]=Object.assign({},u,{packsAvailable:1});
          } else {
            fixedUsers[k]=u;
          }
        });
        setUsers(fixedUsers);
        setPendingTrades(nextTrades);
        const sessionEmail = session?.user?.email || '';
        const usernameFromSession = sessionEmail.split('@')[0];
        if (usernameFromSession && nextUsers[usernameFromSession]) {
          setCurrentUsername(usernameFromSession);
          // Theme is chosen on the GoatPickerScreen, not auto-set here.
        }
        setStorageReady(true);
      } catch (err) {
        console.error('[load] failed:', err);
        if (!cancelled) setStorageReady(true);
      }
    })();

    return ()=>{ cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[session?.user?.id]);

  // persistUser is now SPLIT:
  // - profile-only saves (points, packs, daily, tracks) → safe to call frequently
  // - roster saves → only after deliberate card-changing actions
  const persistUser = useCallback(async (username, data)=>{
    // Only the signed-in user can persist their own data (RLS).
    if (username !== currentUsername) return;
    try { await persistProfile(data); } catch (e) { console.error('[persistProfile]', e); }
  },[currentUsername]);

  // Called explicitly after card-changing actions (pack open, mint, sell, AI trade).
  const persistMyRoster = useCallback(async (data) => {
    if (!data || data.username !== currentUsername) return;
    try { await persistRoster(data); } catch (e) { console.error('[persistRoster]', e); }
  },[currentUsername]);

  // Manual trade refresh — used when the user opens the inbox.
  const persistMyBinderData = useCallback(async (data) => {
    if (!data || data.username !== currentUsername) return;
    try { await persistBinderData(data); } catch (e) { console.error('[persistBinderData]', e); }
  },[currentUsername]);

  const refreshTrades = useCallback(async () => {
    try {
      const rows = await loadTradesOnly();
      // Re-resolve to in-memory shape using the existing users map
      const usernameById = new Map();
      Object.values(users).forEach(u => { if (u.id) usernameById.set(u.id, u.username); });
      const trades = rows.map(r => ({
        id: r.id,
        from: usernameById.get(r.from_id),
        to: usernameById.get(r.to_id),
        give: Array.isArray(r.give_cards) ? r.give_cards : [],
        receive: Array.isArray(r.receive_cards) ? r.receive_cards : [],
        givePoints: r.give_points || 0,
        receivePoints: r.receive_points || 0,
        message: r.message || '',
        status: r.status,
        sentAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      }));
      setPendingTrades(trades);
    } catch (e) { console.error('[refreshTrades]', e); }
  }, [users]);

  const persistTrades = useCallback(async ()=>{
    // No-op: trades are written individually via sendTrade / updateTradeStatus / applyTradeAccept.
  },[]);

  const me = currentUsername ? users[currentUsername] : null;
  const friends = me ? Object.values(users).filter(u=>u.username!==me.username) : [];
  const totalPPS = me ? me.ownedCards.reduce((s,c)=>s + effPps(c.pps, getCardState(me,c.id).damage) * (c.qty||1), 0) : 0;
  const inboxCount = me ? pendingTrades.filter(t=>t.to===me.username && t.status==='pending').length : 0;

  // Ensure every user starts with one free binder.
  useEffect(()=>{
    if(!me) return;
    const bd = me.binderData || { binders: [], cardStates: {} };
    if(!bd.binders || bd.binders.length === 0){
      const starter = { id:'binder_'+Date.now(), title:'MY FIRST BINDER', coverColor:'#3b82f6', coverIcon:'star', coverMaterial:'bronze', pageCount:10, slots:{} };
      const next = { binders:[starter], cardStates: bd.cardStates || {} };
      updateUserAndBinders(me.username, u=>({...u, binderData: next}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[me?.username]);

  // Damage accrual - only while online and playing. Loose cards can wear over time.
  useEffect(()=>{
    if(!me) return;
    const id = setInterval(()=>{
      setUsers(prev=>{
        const u = prev[me.username];
        if(!u) return prev;
        const bd = u.binderData || { binders:[], cardStates:{} };
        const slotted = new Set();
        (bd.binders||[]).forEach(b=>Object.values(b.slots||{}).forEach(cid=>slotted.add(cid)));
        const cardStates = {...(bd.cardStates||{})};
        let changed = false;
        for(const c of u.ownedCards){
          if(slotted.has(c.id)) continue;
          const st = cardStates[c.id] || { damage:0, caseType:null };
          if((st.damage||0) >= 3) continue;
          const factor = st.caseType ? (CASE_PROTECT[st.caseType] != null ? CASE_PROTECT[st.caseType] : 1) : 1;
          if(factor === 0) continue;
          if(Math.random() < BASE_DAMAGE_CHANCE * factor){
            cardStates[c.id] = {...st, damage:(st.damage||0)+1};
            changed = true;
          }
        }
        if(!changed) return prev;
        const updated = {...u, binderData:{...bd, cardStates}};
        persistMyBinderData(updated);
        return {...prev, [me.username]:updated};
      });
    }, 20000);
    return ()=>clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[me?.username]);

  // Points ticker — only when logged in
  useEffect(()=>{
    if(!me) return;
    let lastSave = Date.now();
    const id = setInterval(()=>{
      setUsers(prev=>{
        const u = prev[me.username];
        if(!u) return prev;
        const newPoints = u.points + totalPPS/10;
        const updated = {...u, points:newPoints};
        // throttled persist every 5s
        if(Date.now() - lastSave > 5000){
          persistUser(me.username, updated);
          lastSave = Date.now();
        }
        return {...prev, [me.username]:updated};
      });
    },100);
    return ()=>clearInterval(id);
  },[me?.username,totalPPS,persistUser]);

  // Music engine — manages Tone.js track lifecycle
  useEffect(()=>{
    let cancelled = false;
    (async()=>{
      // Stop existing
      if(musicDisposeRef.current){
        try { musicDisposeRef.current(); } catch{}
        musicDisposeRef.current = null;
      }
      try { Tone.Transport.stop(); Tone.Transport.cancel(); } catch{}
      if(!musicTrackId) return;
      try {
        await Tone.start();
        if(cancelled) return;
        const builder = TRACK_BUILDERS[musicTrackId];
        if(!builder) return;
        musicDisposeRef.current = builder();
        Tone.Transport.start();
      } catch(e){ /* user gesture issue or audio failure */ }
    })();
    return ()=>{ cancelled = true; };
  },[musicTrackId]);

  // Mute toggle
  useEffect(()=>{
    try { Tone.Destination.mute = musicMuted; } catch{}
  },[musicMuted]);

  const updateUser = (username, updater) => {
    setUsers(prev=>{
      const u = prev[username];
      if(!u) return prev;
      const newU = typeof updater==='function' ? updater(u) : {...u,...updater};
      persistUser(username,newU);
      return {...prev, [username]:newU};
    });
  };

  // Use this whenever the update changes ownedCards (pack, mint, sell, AI trade).
  // It updates local state, persists profile, AND atomically replaces the roster on Supabase.
  const updateUserAndRoster = (username, updater) => {
    setUsers(prev=>{
      const u = prev[username];
      if(!u) return prev;
      const newU = typeof updater==='function' ? updater(u) : {...u,...updater};
      // Persist profile (points etc.) — fast
      persistUser(username, newU);
      // Persist roster atomically (only allowed for current signed-in user)
      persistMyRoster(newU);
      return {...prev, [username]:newU};
    });
  };

  const updateUserAndBinders = (username, updater) => {
    setUsers(prev=>{
      const u = prev[username];
      if(!u) return prev;
      const newU = typeof updater==='function' ? updater(u) : {...u,...updater};
      persistUser(username, newU);
      persistMyBinderData(newU);
      return {...prev, [username]:newU};
    });
  };

  const handlePlaceCardInBinder = (binderId, slotIndex, cardId) => {
    updateUserAndBinders(me.username, u => {
      const bd = u.binderData || { binders: [], cardStates: {} };
      const binders = bd.binders.map(b => {
        const slots = { ...(b.slots||{}) };
        for(const k of Object.keys(slots)){ if(slots[k]===cardId) delete slots[k]; }
        if(b.id === binderId) slots[slotIndex] = cardId;
        return { ...b, slots };
      });
      return { ...u, binderData: { ...bd, binders } };
    });
  };
  const handleRemoveCardFromBinder = (binderId, slotIndex) => {
    updateUserAndBinders(me.username, u => {
      const bd = u.binderData || { binders: [], cardStates: {} };
      const binders = bd.binders.map(b => {
        if(b.id !== binderId) return b;
        const slots = { ...(b.slots||{}) };
        delete slots[slotIndex];
        return { ...b, slots };
      });
      return { ...u, binderData: { ...bd, binders } };
    });
  };
  const handleAddCardToBinderFirstSlot = (binderId, cardId) => {
    const bd = me.binderData || { binders: [] };
    const binder = bd.binders.find(b=>b.id===binderId);
    if(!binder){ showToast('Binder not found','err'); return; }
    const slot = firstEmptySlot(binder);
    if(slot < 0){ showToast('That binder is full','err'); return; }
    handlePlaceCardInBinder(binderId, slot, cardId);
    showToast('Added to '+binder.title);
    setCardDetail(null);
  };

  const handleLogin = (username, goatId='lebron') => {
    // Legacy no-op — login now happens via App.jsx → Supabase auth
    setSelectedGoat(goatId);
    setScreen('home');
  };
  const handleLogout = async () => {
    if(me) await persistUser(me.username, me);
    setMusicTrackId(null);
    setUserMenuOpen(false);
    await supabaseSignOut();
    // App.jsx will detect the auth state change and re-render the login screen.
  };
  const handleSwitchUser = async (username) => {
    // With real auth, "switching user" means signing out so they can log in as someone else.
    await handleLogout();
  };

  const handleClaimDaily = () => {
    if(!me || me.dailyClaimed) return;
    updateUser(me.username, u=>({...u, points:u.points+DAILY_REWARD, dailyClaimed:true}));
    showToast(`+${DAILY_REWARD.toLocaleString()} DAILY BONUS`);
  };

  const handleOpenPack = (packType, size = 3) => {
    if(!me) return;
    const cfg = PACK_TYPES[packType];
    if(packType==='daily'){
      // Daily is always 3 cards, no size choice
      if(me.packsAvailable<=0){ showToast('NO FREE PACKS','err'); return; }
      updateUser(me.username, u=>({...u, packsAvailable:u.packsAvailable-1}));
      setPackOpening({type:packType, cards:generatePackCards(packType,3)});
      return;
    }
    const sizeCfg = PACK_SIZES[size] || PACK_SIZES[3];
    const price = Math.floor(cfg.price * sizeCfg.multiplier);
    if(me.points<price){ showToast('NOT ENOUGH POINTS','err'); return; }
    updateUser(me.username, u=>({...u, points:u.points-price}));
    setPackOpening({type:packType, cards:generatePackCards(packType, sizeCfg.count)});
  };

  const handleSpinRoulette = (packType) => {
    if(!me) return;
    const cfg = PACK_TYPES[packType];
    if(me.points < cfg.price){ showToast('NOT ENOUGH POINTS','err'); return; }
    updateUser(me.username, u=>({...u, points: u.points - cfg.price}));
    const __wheelPool = generatePackCards(packType, 10); const __winCard = __wheelPool[0]; setRouletteWin({card:__winCard, packType, accent:cfg.accent, wheelPool:__wheelPool});
  };

  const handleAddCardsFromPack = (cards) => {
    if(!me) return;
    updateUserAndRoster(me.username, u=>({...u, ownedCards: addCardsWithMerge(u.ownedCards, cards)}));
    showToast(`+${cards.length} CARDS ADDED`);
  };

  const handleBuyBinder = () => {
    if(!me) return;
    const bd = me.binderData || { binders: [], cardStates: {} };
    if((bd.binders||[]).length >= MAX_BINDERS){ showToast('Max 12 binders','err'); return; }
    if(me.points < BINDER_PRICE){ showToast('NOT ENOUGH POINTS','err'); return; }
    const n = (bd.binders||[]).length + 1;
    const newBinder = { id:'binder_'+Date.now(), title:'BINDER '+n, coverColor:'#8b5cf6', coverIcon:'star', coverMaterial:'bronze', pageCount:10, slots:{} };
    updateUserAndBinders(me.username, u=>({...u, points:u.points-BINDER_PRICE, binderData:{ ...(u.binderData||{binders:[],cardStates:{}}), binders:[...((u.binderData&&u.binderData.binders)||[]), newBinder] }}));
    showToast('New binder added!');
  };
  const handleBuyBinderPages = (binderId) => {
    if(!me) return;
    if(me.points < BINDER_PAGES_PRICE){ showToast('NOT ENOUGH POINTS','err'); return; }
    updateUserAndBinders(me.username, u=>{
      const bd = u.binderData || { binders: [], cardStates: {} };
      const binders = bd.binders.map(b => b.id===binderId ? {...b, pageCount:(b.pageCount||10)+BINDER_PAGES_BATCH} : b);
      return {...u, points:u.points-BINDER_PAGES_PRICE, binderData:{...bd, binders}};
    });
    showToast('+5 pages added!');
  };
  const handleSaveBinderCover = (binderId, cover) => {
    if(!me) return;
    const bd = me.binderData || { binders: [], cardStates: {} };
    const binder = (bd.binders||[]).find(b=>b.id===binderId);
    if(!binder) return;
    const oldMat = binder.coverMaterial || 'bronze';
    const newMat = cover.coverMaterial || 'bronze';
    let charge = 0;
    if(newMat !== oldMat && newMat !== 'bronze'){
      charge = FINISH_PRICE(newMat);
      if(me.points < charge){ showToast('Need ' + charge.toLocaleString() + ' pts for that finish','err'); return; }
    }
    updateUserAndBinders(me.username, u=>{
      const ubd = u.binderData || { binders: [], cardStates: {} };
      const binders = ubd.binders.map(b => b.id===binderId ? {...b, title:(cover.title||b.title), coverColor:cover.coverColor, coverIcon:cover.coverIcon, coverMaterial:newMat, coverImage:(cover.coverImage!==undefined?cover.coverImage:b.coverImage)} : b);
      return {...u, points:u.points - charge, binderData:{...ubd, binders}};
    });
    showToast(charge>0 ? 'Cover updated! -' + charge.toLocaleString() + ' pts' : 'Cover updated!');
  };
  const handleBuyCard = (card,price) => {
    if(!me) return;
    if(me.points<price){ showToast('NOT ENOUGH POINTS','err'); return; }
    const newCard = {...card, id:`b${Date.now()}_${card.id}`};
    updateUserAndRoster(me.username, u=>({...u, points:u.points-price, ownedCards: addCardWithMerge(u.ownedCards, newCard)}));
    showToast(`BOUGHT ${card.first} ${card.last}`);
  };

  const handleAITradeComplete = (deal) => {
    if(!me) return;
    updateUserAndRoster(me.username, u=>{
      // Remove one copy of each given card (decrement stacks)
      let cards = u.ownedCards;
      for(const g of deal.give) cards = removeOneCardById(cards, g.id);
      // Add received cards with merging
      cards = addCardsWithMerge(cards, deal.receive);
      return {...u, points: u.points - deal.givePoints + deal.receivePoints, ownedCards: cards};
    });
  };

  const handleRepairCard = (card) => {
    if(!me) return;
    const dmg = getCardState(me, card.id).damage;
    if(dmg<=0){ showToast('Card is already mint','err'); return; }
    const cost = Math.floor(getCardValue(card) * 0.20 * dmg);
    if(me.points < cost){ showToast('Need ' + cost.toLocaleString() + ' pts to repair','err'); return; }
    updateUserAndBinders(me.username, u=>{
      const bd = u.binderData || { binders:[], cardStates:{} };
      const cardStates = {...(bd.cardStates||{})};
      const st = cardStates[card.id] || {};
      cardStates[card.id] = {...st, damage:0};
      return {...u, points:u.points-cost, binderData:{...bd, cardStates}};
    });
    showToast('Repaired to mint! -' + cost.toLocaleString() + ' pts');
  };
  const handleEncaseCard = (card, caseType) => {
    if(!me) return;
    const price = CASE_PRICE[caseType] || 0;
    if(me.points < price){ showToast('NOT ENOUGH POINTS','err'); return; }
    updateUserAndBinders(me.username, u=>{
      const bd = u.binderData || { binders:[], cardStates:{} };
      const cardStates = {...(bd.cardStates||{})};
      const st = cardStates[card.id] || { damage:0 };
      cardStates[card.id] = {...st, caseType};
      return {...u, points:u.points-price, binderData:{...bd, cardStates}};
    });
    showToast('Sealed in ' + (CASE_LABEL[caseType]||'case') + '!');
  };
  const handleSellCard = (card) => {
    if(!me) return;
    const dmg = getCardState(me, card.id).damage; const value = Math.floor(effValue(getCardValue(card), dmg)*0.6);
    updateUserAndRoster(me.username, u=>({...u, points:u.points+value, ownedCards: removeOneCardById(u.ownedCards, card.id)}));
    const remaining = (card.qty||1) - 1;
    showToast(remaining > 0 ? `SOLD 1 OF ${(card.qty||1)} · +${value.toLocaleString()} PTS` : `SOLD FOR ${value.toLocaleString()} PTS`);
    // Close the detail modal only if no copies remain in the stack
    if(remaining <= 0) setCardDetail(null);
  };

  const handleMintCard = (card,cost) => {
    if(!me) return;
    if(me.points<cost){ showToast('NOT ENOUGH POINTS','err'); return; }
    updateUserAndRoster(me.username, u=>({...u, points:u.points-cost, ownedCards:[...u.ownedCards,card]}));
    showToast(`MINTED ${card.first} ${card.last}`);
    setScreen('home');
  };

  const handleSendFriendTrade = async (offer) => {
    const friend = friends.find(f=>f.username===offer.to);
    if (!friend || !me) return;
    try {
      await sendTradeToSupabase(offer, me.id, friend.id);
      // The realtime subscription will refresh pendingTrades shortly.
      showToast(`OFFER SENT TO ${friend.displayName.toUpperCase()}`);
    } catch (e) {
      console.error('[sendTrade]', e);
      showToast('FAILED TO SEND TRADE','err');
    }
    setFriendTradeOpen(null);
  };

  const handleAcceptTrade = async (trade) => {
    const fromUser = users[trade.from];
    const toUser = users[trade.to];
    if(!fromUser || !toUser) return;
    // Verify both still have what they offered (look up by id; stacks count as having it)
    const fromMissingCards = trade.give.filter(g => !fromUser.ownedCards.some(c=>c.id===g.id));
    const toMissingCards = trade.receive.filter(r => !toUser.ownedCards.some(c=>c.id===r.id));
    const fromShortPoints = fromUser.points < trade.givePoints;
    const toShortPoints = toUser.points < trade.receivePoints;
    const fromHasAll = fromMissingCards.length === 0 && !fromShortPoints;
    const toHasAll = toMissingCards.length === 0 && !toShortPoints;
    if(!fromHasAll || !toHasAll){
      console.log('[acceptTrade] OFFER NO LONGER VALID — debug:');
      console.log('  trade:', trade);
      console.log('  fromUser:', fromUser.username, 'cards:', fromUser.ownedCards.map(c=>c.id), 'points:', fromUser.points);
      console.log('  toUser:', toUser.username, 'cards:', toUser.ownedCards.map(c=>c.id), 'points:', toUser.points);
      console.log('  trade.give ids:', trade.give.map(g=>g.id), 'givePoints:', trade.givePoints);
      console.log('  trade.receive ids:', trade.receive.map(r=>r.id), 'receivePoints:', trade.receivePoints);
      console.log('  fromMissingCards:', fromMissingCards.map(c=>c.id));
      console.log('  toMissingCards:', toMissingCards.map(c=>c.id));
      console.log('  fromShortPoints:', fromShortPoints, 'toShortPoints:', toShortPoints);
      showToast('OFFER NO LONGER VALID','err');
      return;
    }

    // Compute new states for both users (mirrors the original local logic)
    let nextFrom = (()=>{
      let cards = fromUser.ownedCards;
      for(const g of trade.give) cards = removeOneCardById(cards, g.id);
      const incoming = trade.receive.map(c=>({...c, qty:1, id:`tr_${Date.now()}_${c.id}`}));
      cards = addCardsWithMerge(cards, incoming);
      return {...fromUser, points:fromUser.points-trade.givePoints+trade.receivePoints, ownedCards: cards};
    })();
    let nextTo = (()=>{
      let cards = toUser.ownedCards;
      for(const r of trade.receive) cards = removeOneCardById(cards, r.id);
      const incoming = trade.give.map(c=>({...c, qty:1, id:`tr_${Date.now()}_${c.id}`}));
      cards = addCardsWithMerge(cards, incoming);
      return {...toUser, points:toUser.points-trade.receivePoints+trade.givePoints, ownedCards: cards};
    })();

    // Persist both sides atomically via RPC (works regardless of which user is signed in)
    try {
      await applyTradeAccept(trade.id, nextFrom, nextTo);
      // Optimistically update local state; realtime will refresh too
      setUsers(prev => ({...prev, [trade.from]: nextFrom, [trade.to]: nextTo}));
      setPendingTrades(prev => prev.map(t => t.id===trade.id ? {...t, status:'accepted'} : t));
      showToast('TRADE ACCEPTED');
    } catch (e) {
      console.error('[acceptTrade]', e);
      showToast('FAILED TO ACCEPT','err');
    }
  };

  const handleRejectTrade = async (trade) => {
    try {
      await updateTradeStatus(trade.id, 'rejected');
      setPendingTrades(prev => prev.map(t => t.id===trade.id ? {...t, status:'rejected'} : t));
      showToast('OFFER REJECTED');
    } catch (e) {
      console.error('[rejectTrade]', e);
      showToast('FAILED TO REJECT','err');
    }
  };

  const handleResetData = async () => {
    // For safety, this only signs out — actually resetting family data
    // requires admin access in Supabase. Keep this button limited.
    await supabaseSignOut();
    setUsers({});
    setPendingTrades([]);
    setCurrentUsername(null);
    showToast('SIGNED OUT');
  };

  const handleBuyTrack = (track) => {
    if(!me) return;
    if(me.points < track.price){ showToast('NOT ENOUGH POINTS','err'); return; }
    if((me.unlockedTracks||[]).includes(track.id)){ showToast('ALREADY OWNED','err'); return; }
    updateUser(me.username, u=>({...u, points:u.points - track.price, unlockedTracks:[...(u.unlockedTracks||[]), track.id]}));
    showToast(`UNLOCKED ${track.name}`);
  };

  const handlePlayTrack = (id) => {
    if(id === null){ setMusicTrackId(null); return; }
    if(!me || !(me.unlockedTracks||[]).includes(id)){ showToast('TRACK LOCKED','err'); return; }
    setMusicTrackId(id);
  };

  const handleSupernovaReveal = (card) => {
    setSupernovaCard(card);
  };

  const handleEditCardFromModal = (card) => {
    setEditingCardForDesign(card);
    setCardDetail(null);
    setScreen('design');
  };

  const handleUpdateCard = (updated) => {
    if(!me) return;
    updateUserAndRoster(me.username, u=>({
      ...u,
      ownedCards: u.ownedCards.map(c => c.id === updated.id ? updated : c)
    }));
    showToast(`UPDATED ${updated.first} ${updated.last}`);
    setEditingCardForDesign(null);
    setScreen('home');
  };

  const handleMergeDuplicates = () => {
    if(!me) return;
    const { cards, mergedCount } = mergeAllDuplicates(me.ownedCards);
    if(mergedCount === 0){ showToast('NO DUPLICATES TO MERGE'); return; }
    updateUserAndRoster(me.username, u => ({...u, ownedCards: cards}));
    showToast(`MERGED ${mergedCount} DUPLICATE${mergedCount===1?'':'S'}`);
  };

  // Global styles + screen routing
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    @keyframes sheen { 0%,100%{transform:translateX(-100%);} 50%{transform:translateX(100%);} }
    @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,0,0.4);} 50%{box-shadow:0 0 0 8px rgba(255,107,0,0);} }
    @keyframes float-up { 0%{opacity:0;transform:translateY(20px);} 100%{opacity:1;transform:translateY(0);} }
    @keyframes pack-bob { 0%,100%{transform:translateY(0) rotate(-1deg);} 50%{transform:translateY(-10px) rotate(1deg);} }
    @keyframes rip-top { 0%{transform:translateY(0) rotate(0);} 100%{transform:translateY(-160%) rotate(-25deg);opacity:0;} }
    @keyframes rip-bottom { 0%{transform:translateY(0) rotate(0);} 100%{transform:translateY(160%) rotate(20deg);opacity:0;} }
    @keyframes burst { 0%{transform:scale(0);opacity:0;} 30%{opacity:1;} 100%{transform:scale(8);opacity:0;} }
    @keyframes pulse-text { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
    @keyframes reveal-card { 0%{transform:scale(0.3) rotateY(180deg);opacity:0;} 100%{transform:scale(1) rotateY(0);opacity:1;} }
    @keyframes aura-pulse { 0%,100%{opacity:0.5;transform:scale(1);} 50%{opacity:1;transform:scale(1.1);} }
    @keyframes supernova-shift { 0%,100%{filter:hue-rotate(0deg);} 50%{filter:hue-rotate(80deg);} }
    @keyframes sn-flash { 0%{opacity:0;} 30%{opacity:1;} 100%{opacity:0;} }
    @keyframes confetti-fall { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0.95;} 100%{transform:translateY(110vh) translateX(var(--drift)) rotate(720deg);opacity:0.5;} }
    @keyframes sn-banner { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5);} 30%{opacity:1;transform:translate(-50%,-50%) scale(1.1);} 50%{transform:translate(-50%,-50%) scale(1);} 100%{opacity:1;transform:translate(-50%,-50%) scale(1);} }
    @keyframes sn-shimmer { 0%{background-position:0% 50%;} 100%{background-position:200% 50%;} }
    @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
    .card-stagger { animation: float-up 600ms cubic-bezier(.2,.8,.2,1) backwards; }
    .nav-active { animation: pulse-glow 2s ease-in-out infinite; }
    @media (max-width: 600px) { .header-user-button { display: flex !important; } [data-dock] { display: none !important; } [data-music] { display: none !important; } .mobile-fab { display: flex !important; } header[data-app-header] { display: grid !important; grid-template-columns: 1fr auto !important; grid-template-areas: 'brand avatar' 'points points' !important; gap: 10px 8px !important; padding: 10px 14px !important; align-items: center !important; } header[data-app-header] > div:nth-of-type(1) { grid-area: brand !important; min-width: 0 !important; } header[data-app-header] > .header-user-button { grid-area: avatar !important; margin: 0 !important; } header[data-app-header] > div:nth-of-type(2) { grid-area: points !important; text-align: left !important; display: flex !important; justify-content: space-between !important; align-items: center !important; width: 100% !important; } header[data-app-header] [data-pts-counter] > span:first-child { font-size: 26px !important; } } @keyframes slide-up { 0%{transform:translateY(100%);} 100%{transform:translateY(0);} } @keyframes crater-fall { 0% { transform: translateY(-100vh) scale(0.3) rotate(-180deg); opacity: 0; } 60% { transform: translateY(0) scale(1.1) rotate(0deg); opacity: 1; } 75% { transform: translateY(-12px) scale(1.05); } 100% { transform: translateY(0) scale(1); } }
@keyframes crater-ring { 0% { width: 60px; height: 60px; opacity: 0.9; border-width: 3px; } 100% { width: 600px; height: 600px; opacity: 0; border-width: 1px; } }
@keyframes dust-fly { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(0.3); opacity: 0; } }
@keyframes moon-text-slide { 0% { transform: translateX(-50%) translateY(-30px); opacity: 0; } 100% { transform: translateX(-50%) translateY(0); opacity: 1; } }
@keyframes fade-in { 0%{opacity:0;} 100%{opacity:1;} } @keyframes rocket-bob { 0%,100%{transform:translateY(0) rotate(-1deg);} 50%{transform:translateY(-8px) rotate(1deg);} } @keyframes rocket-launch { 0%{transform:translateY(0) scale(1);opacity:1;} 60%{transform:translateY(-300px) scale(0.6);opacity:1;} 100%{transform:translateY(-800px) scale(0.2);opacity:0;} } @keyframes twinkle { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
    @keyframes butterfly-fly { 0%{transform:translateX(-80px) translateY(0px) scaleX(1);} 25%{transform:translateX(25vw) translateY(-40px) scaleX(-1);} 50%{transform:translateX(50vw) translateY(10px) scaleX(1);} 75%{transform:translateX(75vw) translateY(-30px) scaleX(-1);} 100%{transform:translateX(110vw) translateY(0px) scaleX(1);} }
    @keyframes butterfly-wing { 0%,100%{transform:scaleY(1);} 50%{transform:scaleY(0.3);} }
    @keyframes leaf-drift { 0%{transform:translateX(0) translateY(0) rotate(0deg);opacity:0.7;} 100%{transform:translateX(60px) translateY(120px) rotate(180deg);opacity:0;} }
    @keyframes petal-float { 0%{transform:translateX(0) rotate(0deg);opacity:0.6;} 100%{transform:translateX(40px) translateY(80px) rotate(360deg);opacity:0;} }
    @keyframes vine-grow { 0%,100%{opacity:0.6;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.08);} }
    @keyframes waterfall-stream { 0%{transform:translateY(-100%);opacity:0;} 10%{opacity:1;} 90%{opacity:0.8;} 100%{transform:translateY(100vh);opacity:0;} }
    @keyframes splash-pulse { 0%,100%{transform:scaleX(1) scaleY(1);opacity:0.3;} 50%{transform:scaleX(1.4) scaleY(0.7);opacity:0.6;} }
    @keyframes food-fly { 0%{transform:translateX(0) translateY(0) scale(1);opacity:1;} 70%{transform:translateX(-70px) translateY(-25px) scale(1.4);opacity:0.9;} 100%{transform:translateX(-90px) translateY(5px) scale(0.2);opacity:0;} }
    @keyframes feed-bounce { 0%,100%{transform:scale(1);} 30%{transform:scale(1.25);} 60%{transform:scale(0.9);} }
    @keyframes nom-pop { 0%{transform:translateY(0) scale(0.5);opacity:0;} 30%{transform:translateY(-10px) scale(1.2);opacity:1;} 100%{transform:translateY(-35px) scale(1);opacity:0;} }
    [data-dock] { position:relative; }
    [data-dock]::before { content:'🌿🌿'; position:absolute; top:-18px; left:8px; font-size:22px; letter-spacing:-6px; pointer-events:none; animation:vine-grow 2.5s ease-in-out infinite; z-index:51; }
    [data-dock]::after  { content:'🌿🌿'; position:absolute; top:-18px; right:8px; font-size:22px; letter-spacing:-6px; pointer-events:none; animation:vine-grow 2.5s ease-in-out 1.2s infinite; transform:scaleX(-1); z-index:51; display:block; }
    ::-webkit-scrollbar { height:8px; width:8px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#4ade8044; border-radius:4px; }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
  `;

  // Loading state (data fetching after auth). App.jsx handles the actual login screen.
  if(!currentUsername || !storageReady){
    return <>
      <style>{globalStyles}</style>
      <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0908',color:'#f5f3eb',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,opacity:0.7}}>
        Loading your family's data…
      </div>
      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={()=>setToast(null)}/>}
    </>;
  }

  // Goat picker — after PIN login, before the game. User picks LeBron or MJ theme.
  if(currentUsername && !selectedGoat){
    return <>
      <style>{globalStyles}</style>
      <GoatPickerScreen me={users[currentUsername]} onPickGoat={(goatId)=>setSelectedGoat(goatId)}/>
      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={()=>setToast(null)}/>}
    </>;
  }

  // Main app
  const themeBg = selectedGoat==='fox'
    ? `radial-gradient(ellipse at 60% 0%, rgba(134,239,172,0.25) 0%, transparent 50%),radial-gradient(ellipse at 0% 80%, rgba(74,222,128,0.15) 0%, transparent 45%),linear-gradient(180deg, #0f2d18 0%, #0a1f10 100%)`
    : selectedGoat==='wolf'
    ? `radial-gradient(ellipse at 60% 0%, rgba(103,232,249,0.2) 0%, transparent 50%),radial-gradient(ellipse at 0% 80%, rgba(34,211,238,0.12) 0%, transparent 45%),linear-gradient(180deg, #0c2820 0%, #081c16 100%)`
    : `radial-gradient(ellipse at 50% 0%, rgba(134,239,172,0.2) 0%, transparent 50%),linear-gradient(180deg, #0f2d18 0%, #0a1f10 100%)`;
  const themeAccent = selectedGoat==='fox' ? '#fb923c' : selectedGoat==='wolf' ? '#22d3ee' : '#4ade80';
  const themePrimary = selectedGoat==='fox' ? '#7c2d12' : selectedGoat==='wolf' ? '#0f4c39' : '#14532d';
  const themeRgb = selectedGoat==='fox' ? '251,146,60' : selectedGoat==='wolf' ? '34,211,238' : '74,222,128';
  const themePrimaryRgb = selectedGoat==='fox' ? '124,45,18' : selectedGoat==='wolf' ? '15,76,57' : '20,83,45';
  const themeName = selectedGoat==='fox' ? 'CLEVER FOX' : selectedGoat==='wolf' ? 'PACK WOLF' : null;
  const themeTeam = selectedGoat==='fox' ? 'FOREST' : selectedGoat==='wolf' ? 'TUNDRA' : null;
  const themeNumber = selectedGoat==='fox' ? 9 : selectedGoat==='wolf' ? 6 : null;
  const patternAlpha = selectedGoat ? 0.04 : 0.015;

  return (
    <div style={{minHeight:'100vh',width:'100%',background:themeBg,color:'#fff7ed',fontFamily:'"Outfit", system-ui, sans-serif',position:'relative',overflow:'hidden',paddingBottom:140}}>
      <style>{globalStyles}</style>
      <FloatingNature/>
      {/* Pattern overlay removed — clean eco bg */}
      {/* Big jersey watermark in bottom-right — wallpaper-style identification */}
      {/* eco: jersey watermark removed */}
      {/* Top accent stripe — team primary color */}
      {selectedGoat && <div style={{position:'fixed',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${themePrimary}, ${themeAccent} 50%, ${themePrimary})`,zIndex:60,boxShadow:`0 0 16px rgba(${themePrimaryRgb},0.6)`}}/>}
      {/* Side glow — left edge */}
      {selectedGoat && <div style={{position:'fixed',top:0,left:0,bottom:0,width:60,background:`linear-gradient(90deg, rgba(${themePrimaryRgb},0.18), transparent)`,pointerEvents:'none',zIndex:0}}/>}

      <header data-app-header="true" style={{position:'sticky',top:0,zIndex:40,padding:'14px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid rgba(${themeRgb},0.25)`,background:`linear-gradient(180deg, rgba(${themePrimaryRgb},0.18) 0%, rgba(12,9,7,0.85) 100%)`,backdropFilter:'blur(8px)',gap:14}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <LogoBadge size={48} accent="#fb923c" primary="#fff7ed"/>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,letterSpacing:'0.05em',background:'linear-gradient(180deg, #fff7ed, #4ade80)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>ECO</span>
              <span style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#fb923c',letterSpacing:'0.05em'}}>HEROES</span>
              {themeName && <span title={`Vibing with ${themeName} · ${themeTeam}`} style={{display:'inline-flex',alignItems:'center',gap:5,marginLeft:4,padding:'4px 9px 4px 5px',borderRadius:6,background:`linear-gradient(135deg, rgba(${themePrimaryRgb},0.4), rgba(${themePrimaryRgb},0.18))`,border:`1px solid ${themeAccent}`,color:themeAccent,fontFamily:'"JetBrains Mono",monospace',fontSize:9.5,letterSpacing:'0.14em',fontWeight:700,boxShadow:`0 0 12px rgba(${themePrimaryRgb},0.4)`}}>
                <span style={{width:16,height:16,borderRadius:3,background:themeAccent,color:themePrimary,fontFamily:'"Bebas Neue",sans-serif',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,fontWeight:900}}>{themeNumber}</span>
                {themeTeam}
              </span>}
            </div>
            <div style={{fontSize:9.5,color:me.color,letterSpacing:'0.18em',fontWeight:600,marginTop:1,fontFamily:'"JetBrains Mono",monospace'}}>{me.emoji} {me.displayName.toUpperCase()} · LIVE</div>
          </div>
        </div>
        <button className="header-user-button" onClick={()=>setUserMenuOpen(true)} title="Account / sign out" style={{display:'none',alignItems:'center',justifyContent:'center',width:40,height:40,borderRadius:12,background:`${me.color}22`,border:`1px solid ${me.color}`,color:'#fff7ed',fontSize:20,cursor:'pointer',padding:0,marginRight:4,flexShrink:0}}>{me.emoji}</button>
        <div style={{textAlign:'right'}}>
          <PointsCounter value={me.points}/>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:4,padding:'2px 9px',borderRadius:999,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)'}}>
            <TrendingUp size={11} style={{color:'#4ade80'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#4ade80',fontFamily:'"JetBrains Mono",monospace'}}>+{totalPPS}/sec</span>
          </div>
        </div>
      </header>

      {screen==='home' && <HomeScreen me={me} pendingCount={inboxCount} onClaimDaily={handleClaimDaily} onOpenPack={handleOpenPack} onOpenInbox={()=>{ refreshTrades(); setInboxOpen(true); }} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onShowComingSoon={()=>setComingSoonOpen(true)} onEditAvatar={()=>setComingSoonOpen(true)} onInviteFriend={()=>setComingSoonOpen(true)} onEditFavCard={()=>setFavCardPickerOpen(true)}/>}
      {screen==='shop' && <ShopScreen me={me} friends={friends} onBuyCard={handleBuyCard} onOpenPack={handleOpenPack} onStartAITrade={(t)=>setAITradeTable(t)} onStartFriendTrade={(f)=>setFriendTradeOpen(f)} onOpenCard={(c,isMine=false)=>setCardDetail({card:c,isMine})} onToast={showToast} onBuyBinder={handleBuyBinder} onBuyPages={handleBuyBinderPages}/>}
      {screen==='collection' && <CollectionScreen me={me} onOpenCard={(c)=>setCardDetail({card:c,isMine:true})} onMergeDuplicates={handleMergeDuplicates}/>}

      {screen==='space' && <SpaceScreen me={me} users={users} setUsers={setUsers} currentUsername={currentUsername} onBack={()=>setScreen('home')} onOpenPack={handleOpenPack} onSpinRoulette={handleSpinRoulette}/>}
      {screen==='design' && <DesignScreen points={me.points} onMint={handleMintCard} onToast={showToast} editingCard={editingCardForDesign} onCancelEdit={()=>setEditingCardForDesign(null)} onUpdateCard={handleUpdateCard} me={me} onSaveBinderCover={handleSaveBinderCover}/>}
      {screen==='food' && <FoodScreen me={me} onFeed={handleFeedAnimal} onHeal={handleHealAnimal} onToast={showToast}/>}
      {screen==='travel' && <TravelScreen me={me} onSendExpedition={handleSendExpedition} onCollectExpedition={handleCollectExpedition} onToast={showToast}/>}
      {screen==='shelter' && <ShelterScreen me={me} onBuildShelter={handleBuildShelter} onToast={showToast} onAssignAnimal={handleAssignAnimal}/>}

      {/* Bottom dock with USER button */}
      <div data-dock="true" style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',display:'flex',flexWrap:'wrap',justifyContent:'center',gap:6,padding:8,background:'rgba(8,20,12,0.92)',backdropFilter:'blur(14px)',borderRadius:18,border:'none',boxShadow:'0 12px 40px -8px rgba(0,0,0,0.7), 0 0 0 2px #2d5a2e, 0 0 0 4px #1a3d1b, 0 0 0 6px rgba(74,222,128,0.15), 0 0 20px rgba(74,222,128,0.1)',zIndex:50,maxWidth:'calc(100vw - 32px)',overflowX:'auto'}}>
        <NavButton label="HOME" sub="ROSTER" Icon={Home} isActive={screen==='home'} onClick={()=>setScreen('home')}/>
        <NavButton label="SHOP" sub="TRADE · BUY" Icon={Store} isActive={screen==='shop'} onClick={()=>setScreen('shop')}/>
        <NavButton label="COLLECT" sub="DEEP DIVE" Icon={Library} isActive={screen==='collection'} onClick={()=>setScreen('collection')}/>

        <NavButton label="FOOD" sub="FEED · VET" Icon={Sparkles} isActive={screen==='food'} onClick={()=>setScreen('food')} color="#4ade80"/>
        <NavButton label="TRAVEL" sub="EXPEDITIONS" Icon={Rocket} isActive={screen==='travel'} onClick={()=>setScreen('travel')} color="#c4b5fd"/>
        <NavButton label="SHELTER" sub="BUILD" Icon={Sparkles} isActive={screen==='shelter'} onClick={()=>setScreen('shelter')} color="#86efac"/>
        <NavButton label="LEADERS" sub="FAMILY RANKS" Icon={Trophy} isActive={false} onClick={()=>setLeaderboardOpen(true)} color="#fbbf24"/>
        <NavButton label="DESIGN" sub="MINT NEW" Icon={Palette} isHero isActive={screen==='design'} onClick={()=>setScreen('design')}/>
        <NavButton label="INBOX" sub={`${inboxCount} OFFERS`} Icon={Inbox} isActive={false} onClick={()=>{ refreshTrades(); setInboxOpen(true); }} color={inboxCount>0?'#a855f7':undefined}/>
        <div className="dock-user-button"><NavButton label={me.displayName.toUpperCase()} sub="SIGN OUT" emoji={me.emoji} isActive={false} onClick={()=>setUserMenuOpen(true)} color={me.color}/></div>
      </div>

      {packOpening && <PackOpener pack={packOpening} onClose={()=>setPackOpening(null)} onAdd={handleAddCardsFromPack} onSupernova={handleSupernovaReveal} onFullMoon={setMoonCard}/>}
      {aiTradeTable && <TradeTable trader={aiTradeTable} ownedCards={me.ownedCards} points={me.points} onClose={()=>setAITradeTable(null)} onComplete={handleAITradeComplete} onToast={showToast}/>}
      {friendTradeOpen && <FriendTradeModal me={me} friend={friendTradeOpen} onClose={()=>setFriendTradeOpen(null)} onSend={handleSendFriendTrade} onToast={showToast}/>}
      {inboxOpen && <PendingTradesModal me={me} allUsers={users} trades={pendingTrades} onClose={()=>setInboxOpen(false)} onAccept={handleAcceptTrade} onReject={handleRejectTrade}/>}
      {userMenuOpen && <UserMenuModal me={me} allUsers={users} onClose={()=>setUserMenuOpen(false)} onSwitchUser={handleSwitchUser} onLogout={handleLogout}/>}
      {leaderboardOpen && <LeaderboardModal users={users} currentUsername={currentUsername} onClose={()=>setLeaderboardOpen(false)}/>}
      {rouletteWin && <AlienRoulette card={rouletteWin.card} packType={rouletteWin.packType} accent={rouletteWin.accent} wheelPool={rouletteWin.wheelPool} onClose={()=>setRouletteWin(null)} onAddCard={handleAddCardsFromPack} onFullMoon={setMoonCard}/>}
      <MobileFAB isOpen={mobileNavOpen} onClick={()=>setMobileNavOpen(o=>!o)}/>
      {mobileNavOpen && <MobileNavSheet onClose={()=>setMobileNavOpen(false)} screen={screen} setScreen={setScreen} setLeaderboardOpen={setLeaderboardOpen} refreshTrades={refreshTrades} setInboxOpen={setInboxOpen} setMusicStoreOpen={setMusicStoreOpen} inboxCount={inboxCount}/>}
      {cardDetail && <CardDetailModal card={cardDetail.card} isMine={cardDetail.isMine} onClose={()=>setCardDetail(null)} onSell={cardDetail.isMine?handleSellCard:null} onEdit={cardDetail.isMine?handleEditCardFromModal:null} binders={me?((me.binderData&&me.binderData.binders)||[]):[]} inBinder={me?findCardSlot(me.binderData, cardDetail.card.id):null} onAddToBinder={(bid)=>handleAddCardToBinderFirstSlot(bid, cardDetail.card.id)} onRemoveFromBinder={()=>{ const loc=findCardSlot(me.binderData, cardDetail.card.id); if(loc){ handleRemoveCardFromBinder(loc.binderId, loc.slot); setCardDetail(null); } }} damage={me?getCardState(me, cardDetail.card.id).damage:0} caseType={me?getCardState(me, cardDetail.card.id).caseType:null} onRepair={handleRepairCard} onEncase={handleEncaseCard}/>}
      {favCardPickerOpen && me && <FavCardPicker me={me} onClose={()=>setFavCardPickerOpen(false)} onPick={handlePickFavCard}/>}
      {comingSoonOpen && <ComingSoonModal title="MINI GAMES · COMING SOON" body="Quick games to earn extra points are on the way — H-O-R-S-E, free-throw timing, trivia challenges. Check back in a future version!" onClose={()=>setComingSoonOpen(false)}/>}
      {musicStoreOpen && <MusicStore me={me} onClose={()=>setMusicStoreOpen(false)} onBuy={handleBuyTrack} onPlay={handlePlayTrack} currentTrackId={musicTrackId}/>}
      {supernovaCard && <SupernovaCelebration card={supernovaCard} onDone={()=>setSupernovaCard(null)}/>}
      {moonCard && <MoonCelebration card={moonCard} onDone={()=>setMoonCard(null)}/>}
      <MusicPlayer currentTrackId={musicTrackId} onTogglePlay={handlePlayTrack} onOpenStore={()=>setMusicStoreOpen(true)} muted={musicMuted} onToggleMute={()=>setMusicMuted(m=>!m)}/>
      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={()=>setToast(null)}/>}
    </div>
  );
}
