// data.js — TREE node definitions, STUMP_DEFS, constants

const SAVE_KEY = 'mycelium_pact_save';

const TREE = [
  {id:'root',name:'Awakening',lore:'The oldest thread stirs.',cost:0,effect:'',spc:0,sps:0,mult:null,parent:null,depth:0},
  {id:'shallow_roots',name:'Shallow Roots',lore:'Fingers reach through cold ash.',cost:10,effect:'+1 spore/click',spc:1,sps:0,mult:null,parent:'root',depth:1},
  {id:'fungal_web',name:'Fungal Web',lore:'A hush spreads beneath your feet.',cost:40,effect:'+1 spore/sec',spc:0,sps:1,mult:null,parent:'shallow_roots',depth:2},
  {id:'spore_burst',name:'Spore Burst',lore:'Life explodes in tiny clouds.',cost:120,effect:'+3 spore/click',spc:3,sps:0,mult:null,parent:'fungal_web',depth:3},
  {id:'deep_mycelium',name:'Deep Mycelium',lore:'The network goes deeper than bone.',cost:200,effect:'+3 spore/sec',spc:0,sps:3,mult:null,parent:'fungal_web',depth:3},
  {id:'tender_shoots',name:'Tender Shoots',lore:'Green dares to remember.',cost:60,effect:'+2 spore/click',spc:2,sps:0,mult:null,parent:'shallow_roots',depth:2},
  {id:'moss_bloom',name:'Moss Bloom',lore:'Stone wears velvet again.',cost:180,effect:'+4 spore/sec',spc:0,sps:4,mult:null,parent:'tender_shoots',depth:3},
  {id:'rain_sense',name:'Rain Sense',lore:'You taste thunder before it forms.',cost:500,effect:'×1.5 spore/sec',spc:0,sps:0,mult:{type:'sps',val:1.5},parent:'moss_bloom',depth:4},
  {id:'stone_lichen',name:'Stone Lichen',lore:'Even granite becomes a garden.',cost:800,effect:'+10 spore/sec',spc:0,sps:10,mult:null,parent:'moss_bloom',depth:4},
  {id:'first_sapling',name:'First Sapling',lore:'It remembered. It came back.',cost:250,effect:'+5 spore/click',spc:5,sps:0,mult:null,parent:'tender_shoots',depth:3},
  {id:'canopy_reach',name:'Canopy Reach',lore:'Arms open to a sky that forgot them.',cost:600,effect:'+8 spore/sec',spc:0,sps:8,mult:null,parent:'first_sapling',depth:4},
  {id:'sunlight_draw',name:'Sunlight Draw',lore:'The old warmth returns to willing roots.',cost:1500,effect:'×2 spore/click',spc:0,sps:0,mult:{type:'spc',val:2},parent:'canopy_reach',depth:5},
  {id:'wind_pact',name:'Wind Pact',lore:'The wind agreed to carry your name.',cost:2000,effect:'+20 spore/sec',spc:0,sps:20,mult:null,parent:'canopy_reach',depth:5},
  {id:'root_network',name:'Root Network',lore:'Every living thing is your kin now.',cost:900,effect:'×1.5 all income',spc:0,sps:0,mult:{type:'all',val:1.5},parent:'first_sapling',depth:4},
  {id:'heartwood',name:'Heartwood',lore:'The core of the old tree beats once more.',cost:2500,effect:'+30 spore/sec',spc:0,sps:30,mult:null,parent:'root_network',depth:5},
  {id:'ancient_sap',name:'Ancient Sap',lore:'Time flows differently in old wood.',cost:6000,effect:'×2 spore/sec',spc:0,sps:0,mult:{type:'sps',val:2},parent:'heartwood',depth:6},
  {id:'spirit_bloom',name:'Spirit Bloom',lore:'You bloom where you walk.',cost:8000,effect:'×2 spore/click',spc:0,sps:0,mult:{type:'spc',val:2},parent:'heartwood',depth:6},
  {id:'canopy_crown',name:'Canopy Crown',lore:'The forest remembers your name.',cost:12000,effect:'Unlocks Rebirth',spc:0,sps:0,mult:null,parent:'root_network',depth:6},
];

// Stump positions as ratios of screen size — actual pixel positions
// are computed at runtime in canvas.js using window.innerWidth/innerHeight
const STUMP_DEFS = [
  {id:'s0', rx:0.22, ry:0.70},
  {id:'s1', rx:0.42, ry:0.78},
  {id:'s2', rx:0.63, ry:0.72},
  {id:'s3', rx:0.80, ry:0.67},
];
