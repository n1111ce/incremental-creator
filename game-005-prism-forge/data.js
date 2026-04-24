// data.js — static game data: upgrades, colors, palette

var UPGRADES = {
  A1: { label: 'Brighter Nodes',  cost: [50,150,400,900,2000],        maxLevel:5, effect:'lightTap +50% per level',        row:0, col:0, shape:'square' },
  A2: { label: 'Crystal Focus',   cost: [200,600,1500],               maxLevel:3, effect:'Node respawn -25% per level',     row:0, col:1, shape:'square', requires:'A1' },
  A3: { label: 'Mirror Array',    cost: [800],                        maxLevel:1, effect:'UNLOCK Mirror Array',             row:0, col:2, shape:'diamond', requires:'A2', unlock:'mirrorArray' },

  B1: { label: 'Prism Speed',     cost: [75,220,600],                 maxLevel:3, effect:'Prisms spawn orbs 30% faster',   row:1, col:0, shape:'square' },
  B2: { label: 'Dual Color',      cost: [300,900],                    maxLevel:2, effect:'+1 orb type per level',          row:1, col:1, shape:'square', requires:'B1' },
  B3: { label: 'Spectral Golem',  cost: [1200],                       maxLevel:1, effect:'UNLOCK Spectral Golem',          row:1, col:2, shape:'diamond', requires:'B2', unlock:'spectralGolem' },

  C1: { label: 'Storm Sense',     cost: [2000,5500],                  maxLevel:2, effect:'+2 sparks per level',            row:2, col:0, shape:'square' },
  C2: { label: 'Tempest Eye',     cost: [5000,12000],                 maxLevel:2, effect:'Green zone +15\u00b0 per level', row:2, col:1, shape:'square', requires:'C1' },
  C3: { label: 'Storm Crystal',   cost: [15000],                      maxLevel:1, effect:'UNLOCK Storm Crystal',           row:2, col:2, shape:'diamond', requires:'C2', unlock:'stormCrystal' },

  D1: { label: 'Void Attunement', cost: [3000,8000],                  maxLevel:2, effect:'Void conversion +50% bonus',    row:3, col:0, shape:'square' },
  D2: { label: 'Dark Flow',       cost: [8000,20000],                 maxLevel:2, effect:'Void prism cd -25%',            row:3, col:1, shape:'square', requires:'D1' },
  D3: { label: 'Void Prism',      cost: [25000],                      maxLevel:1, effect:'UNLOCK Void Prism',             row:3, col:2, shape:'diamond', requires:'D2', unlock:'voidPrism' },

  E1: { label: 'Shard Collector', cost: [10000,25000,50000,100000,200000],   maxLevel:5, effect:'+20% vault speed',        row:4, col:0, shape:'square' },
  E2: { label: 'Vault Memory',    cost: [30000,80000,200000,500000,1000000], maxLevel:5, effect:'+25% prestige bonus',     row:4, col:2, shape:'square' },
};

var GEM_COLORS = ['red','orange','yellow','green','blue','violet'];

var VAT_COLORS = [
  ['red','orange','yellow'],   // vat 0: warm
  ['green','blue'],            // vat 1: cool
  ['violet','white']           // vat 2: arcane
];

var PALETTE = {
  bg:           '#0a0a1a',
  crystalBlue:  '#4bc8f0',
  gold:         '#c8a84b',
  crimson:      '#e05050',
  emerald:      '#50c878',
  violet:       '#9b50e0',
  amber:        '#e09050',
  whiteLight:   '#e8f4ff',
};

var COLOR_MAP = {
  red:    '#e05050',
  orange: '#e09050',
  yellow: '#e8d050',
  green:  '#50c878',
  blue:   '#4bc8f0',
  violet: '#9b50e0',
  white:  '#e8f4ff',
  void:   '#3a0a4a',
};

// Color names for display
var COLOR_NAMES = ['white','red','orange','yellow','green','blue','violet'];

// Prism color cycle (index 0–6)
var PRISM_CYCLE = ['white','red','orange','yellow','green','blue','violet'];
