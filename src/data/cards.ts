/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
import type { ItemDef, UpgradeCurve, AdjDef, Tag, Kind } from './types';

export const ITEMS: Record<string, ItemDef> = {
 "dagger": {
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "cd",
  "cd": 1,
  "dmg": 5,
  "fx": "knife",
  "kind": "weapon"
 },
 "spark": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.4,
  "dmg": 4,
  "fx": "spark",
  "burn": 2
 },
 "icicle": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "cd",
  "cd": 1.3,
  "dmg": 6,
  "fx": "ice",
  "slow": 0.25
 },
 "bolt": {
  "size": 1,
  "tag": "volt",
  "t": 0,
  "up": "mix",
  "cd": 1.8,
  "dmg": 6,
  "fx": "bolt",
  "chain": 2,
  "kind": "sky"
 },
 "sling": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "dmg",
  "cd": 1.8,
  "dmg": 7,
  "fx": "rock",
  "kb": 0.04,
  "kind": "weapon",
  "hero": "jun"
 },
 "clock": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.2,
  "dmg": 0,
  "fx": "none",
  "charge": 0.15,
  "kind": "gadget",
  "hero": "ying"
 },
 "axe": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 24,
  "fx": "axe",
  "pen": 4,
  "kind": "weapon",
  "hero": "ayla"
 },
 "cannon": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 17,
  "fx": "shell",
  "aoe": 22,
  "kind": "firearm",
  "hero": "jun"
 },
 "frost": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "mix",
  "cd": 2,
  "dmg": 15,
  "fx": "ice",
  "slow": 0.4,
  "hero": "mo"
 },
 "tesla": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "mix",
  "cd": 2.8,
  "dmg": 12,
  "fx": "bolt",
  "chain": 4,
  "kind": "gadget",
  "hero": "mo"
 },
 "anvil": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "buff": 0.5,
  "kind": "gadget"
 },
 "bell": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "cd",
  "cd": 5,
  "dmg": 12,
  "fx": "bell",
  "chargeAll": 0.25
 },
 "thunder": {
  "size": 3,
  "tag": "volt",
  "t": 2,
  "up": "dmg",
  "cd": 3.6,
  "dmg": 22,
  "fx": "bolt",
  "chain": 6,
  "kind": "sky",
  "hero": "mo"
 },
 "venom": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "dmg",
  "cd": 1.5,
  "dmg": 4,
  "fx": "sting",
  "poison": 3.5,
  "kind": "potion"
 },
 "oathsword": {
  "local": 1,
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "mix",
  "cd": 2,
  "dmg": 16,
  "fx": "slash",
  "hero": "ayla",
  "kind": "weapon",
  "quest": {
   "n": 40,
   "into": "nightsword"
  }
 },
 "warhorn": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.8,
  "dmg": 0,
  "fx": "none",
  "horn": 1,
  "hero": "ayla",
  "kind": "gadget"
 },
 "ballista": {
  "size": 3,
  "tag": "blade",
  "t": 2,
  "up": "dmg",
  "cd": 4.2,
  "dmg": 58,
  "fx": "arrow",
  "pierce": 6,
  "hero": "ayla",
  "kind": "weapon"
 },
 "vial": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.6,
  "dmg": 6,
  "fx": "shell",
  "aoe": 16,
  "burn": 3,
  "hero": "mo",
  "kind": "potion"
 },
 "prism": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "cd",
  "cd": 2.4,
  "dmg": 0,
  "fx": "none",
  "prism": 1,
  "hero": "mo"
 },
 "starfall": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 5,
  "dmg": 66,
  "fx": "meteor",
  "aoe": 40,
  "burn": 8,
  "hero": "mo",
  "kind": "sky"
 },
 "oilflask": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.6,
  "dmg": 3,
  "fx": "shell",
  "aoe": 14,
  "burn": 3,
  "hero": "ayla",
  "kind": "potion"
 },
 "firebrand": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "mix",
  "cd": 2.6,
  "dmg": 20,
  "fx": "fslash",
  "burn": 4,
  "hero": "ayla"
 },
 "detonate": {
  "size": 1,
  "tag": "fire",
  "t": 1,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "detonate": 1,
  "hero": "ayla"
 },
 "acidvial": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "dmg",
  "cd": 1.5,
  "dmg": 4,
  "fx": "sting",
  "poison": 3.5,
  "hero": "mo",
  "kind": "potion",
  "vuln": [
   2,
   0.15
  ]
 },
 "plague": {
  "size": 2,
  "tag": "poison",
  "t": 1,
  "up": "dmg",
  "cd": 2.8,
  "dmg": 8,
  "fx": "gas",
  "aoe": 24,
  "poison": 7,
  "hero": "mo",
  "kind": "potion"
 },
 "putrefy": {
  "size": 3,
  "tag": "poison",
  "t": 2,
  "up": "mix",
  "cd": 4.5,
  "dmg": 12,
  "fx": "gas",
  "aoe": 40,
  "poison": 12,
  "hero": "mo",
  "kind": "potion"
 },
 "emberblade": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.5,
  "dmg": 4,
  "fx": "spark",
  "burn": 2,
  "hero": "ayla",
  "kind": "weapon",
  "critBurn": 2
 },
 "cleaver": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 26,
  "fx": "axe",
  "pen": 6,
  "hero": "ayla",
  "kind": "weapon"
 },
 "arrowrain": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "cd",
  "cd": 2.2,
  "dmg": 10,
  "fx": "arrow",
  "pierce": 3,
  "hero": "ayla",
  "kind": "weapon"
 },
 "brand": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.8,
  "dmg": 3,
  "fx": "spark",
  "burn": 4,
  "hero": "ayla",
  "burnDur": 6
 },
 "whetstone": {
  "size": 1,
  "tag": "blade",
  "t": 1,
  "up": "cd",
  "cd": 3.2,
  "dmg": 0,
  "fx": "none",
  "fuse": {
   "tag": "blade",
   "amt": 0.12
  },
  "hero": "ayla",
  "kind": "gadget"
 },
 "greatsword": {
  "size": 3,
  "tag": "blade",
  "t": 2,
  "up": "mix",
  "cd": 3.4,
  "dmg": 40,
  "fx": "slash",
  "hero": "ayla",
  "kind": "weapon"
 },
 "flamethrower": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 12,
  "fx": "flame",
  "aoe": 20,
  "burn": 4,
  "hero": "ayla",
  "kind": "firearm"
 },
 "phoenix": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 4.6,
  "dmg": 34,
  "fx": "meteor",
  "aoe": 36,
  "burn": 8,
  "hero": "ayla",
  "kind": "sky"
 },
 "rally": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "charge": 0.35,
  "hero": "ayla",
  "chargeKind": "weapon"
 },
 "cinder": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "cd",
  "cd": 0.9,
  "dmg": 2,
  "fx": "spark",
  "burn": 1,
  "hero": "ayla"
 },
 "executioner": {
  "size": 2,
  "tag": "blade",
  "t": 2,
  "up": "dmg",
  "cd": 3,
  "dmg": 44,
  "fx": "knife",
  "hero": "ayla",
  "kind": "weapon"
 },
 "oilpit": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 3.4,
  "dmg": 8,
  "fx": "shell",
  "aoe": 26,
  "burn": 5,
  "hero": "ayla",
  "kind": "firearm"
 },
 "bloodrage": {
  "size": 1,
  "tag": "blade",
  "t": 1,
  "up": "cd",
  "cd": 2.8,
  "dmg": 0,
  "fx": "none",
  "buff": 0.4,
  "hero": "ayla"
 },
 "needle": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "cd",
  "cd": 0.9,
  "dmg": 3,
  "fx": "sting",
  "poison": 3.5,
  "hero": "mo",
  "kind": "potion"
 },
 "snakekiss": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "dmg",
  "cd": 1.7,
  "dmg": 5,
  "fx": "sting",
  "poison": 5,
  "hero": "mo",
  "kind": "potion"
 },
 "acidrain": {
  "size": 2,
  "tag": "poison",
  "t": 1,
  "up": "dmg",
  "cd": 3,
  "dmg": 7,
  "fx": "gas",
  "aoe": 24,
  "poison": 6,
  "hero": "mo",
  "kind": "potion"
 },
 "plagueburst": {
  "size": 2,
  "tag": "poison",
  "t": 1,
  "up": "cd",
  "cd": 3.6,
  "dmg": 0,
  "fx": "none",
  "detonateP": 1,
  "hero": "mo",
  "kind": "potion"
 },
 "arcbottle": {
  "size": 1,
  "tag": "volt",
  "t": 0,
  "up": "dmg",
  "cd": 1.6,
  "dmg": 5,
  "fx": "bolt",
  "chain": 1,
  "hero": "mo",
  "kind": "potion"
 },
 "stormflask": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "mix",
  "cd": 2.6,
  "dmg": 11,
  "fx": "bolt",
  "chain": 3,
  "hero": "mo",
  "kind": "potion"
 },
 "frostvial": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "cd",
  "cd": 1.5,
  "dmg": 6,
  "fx": "ice",
  "slow": 0.3,
  "hero": "mo",
  "kind": "potion"
 },
 "icebomb": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "dmg",
  "cd": 3,
  "dmg": 18,
  "fx": "shell",
  "aoe": 22,
  "hero": "mo",
  "kind": "potion",
  "slow": 0.25
 },
 "concentrate": {
  "size": 2,
  "tag": "poison",
  "t": 2,
  "up": "dmg",
  "cd": 2.2,
  "dmg": 10,
  "fx": "sting",
  "poison": 17,
  "hero": "mo",
  "kind": "potion"
 },
 "miasma": {
  "size": 3,
  "tag": "poison",
  "t": 2,
  "up": "mix",
  "cd": 4.8,
  "dmg": 16,
  "fx": "gas",
  "aoe": 44,
  "poison": 22,
  "hero": "mo",
  "kind": "potion"
 },
 "resonate": {
  "size": 1,
  "tag": "volt",
  "t": 1,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "fuse": {
   "tag": "volt",
   "amt": 0.15
  },
  "hero": "mo",
  "kind": "potion"
 },
 "sunflare": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 4.4,
  "dmg": 34,
  "fx": "flame",
  "aoe": 34,
  "burn": 7,
  "hero": "mo",
  "kind": "sky"
 },
 "quicklime": {
  "size": 1,
  "tag": "poison",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 5,
  "fx": "sting",
  "poison": 4,
  "hero": "mo",
  "kind": "potion"
 },
 "firefly": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 1.3,
  "dmg": 5,
  "fx": "firefly",
  "hero": "ying",
  "kind": "lamp"
 },
 "musicbox": {
  "local": 1,
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "chargeSmall": 0.2,
  "hero": "ying",
  "kind": "gadget",
  "snd": "mbox"
 },
 "pendulum": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "mix",
  "cd": 3.4,
  "dmg": 42,
  "fx": "sweep",
  "hero": "ying",
  "kind": "gadget"
 },
 "oilspill": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.2,
  "dmg": 3,
  "fx": "spark",
  "burn": 2,
  "hero": "ying",
  "kind": "lamp",
  "burnMul": 1.5
 },
 "fuse": {
  "size": 1,
  "tag": "fire",
  "t": 1,
  "up": "cd",
  "cd": 2.8,
  "dmg": 0,
  "fx": "none",
  "fuse": {
   "tag": "fire",
   "amt": 0.15
  },
  "hero": "ying",
  "kind": "lamp"
 },
 "dragonlantern": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 4,
  "dmg": 34,
  "fx": "meteor",
  "aoe": 36,
  "burn": 8,
  "hero": "ying",
  "kind": "lamp"
 },
 "paperlamp": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.4,
  "dmg": 5,
  "fx": "spark",
  "burn": 2,
  "hero": "ying",
  "kind": "lamp",
  "per": {
   "kind": "lamp",
   "pct": 0.15
  }
 },
 "gear": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 1.2,
  "dmg": 6,
  "fx": "knife",
  "hero": "ying",
  "kind": "weapon"
 },
 "windup": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "charge": 0,
  "hero": "ying",
  "kind": "gadget",
  "hasteNb": 1.5
 },
 "firecracker": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.8,
  "dmg": 9,
  "fx": "shell",
  "aoe": 16,
  "hero": "ying",
  "kind": "firearm"
 },
 "paperkite": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.4,
  "dmg": 7,
  "fx": "firefly",
  "hero": "ying",
  "kind": "lamp"
 },
 "lamplight": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.8,
  "dmg": 10,
  "fx": "flame",
  "aoe": 20,
  "burn": 3,
  "hero": "ying",
  "kind": "lamp"
 },
 "clockwork": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "dmg",
  "cd": 2.2,
  "dmg": 20,
  "fx": "arrow",
  "pierce": 1,
  "hero": "ying",
  "kind": "weapon"
 },
 "beacon": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "cd",
  "cd": 5.2,
  "dmg": 18,
  "fx": "bell",
  "chargeAll": 0.2,
  "hero": "ying",
  "kind": "lamp"
 },
 "oilpot": {
  "size": 1,
  "tag": "fire",
  "t": 1,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "charge": 0,
  "hero": "ying",
  "kind": "lamp",
  "reload": 1,
  "reloadElse": 0.1
 },
 "moth": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 14,
  "fx": "fslash",
  "burn": 3,
  "hero": "ying",
  "kind": "lamp"
 },
 "mainspring": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "mix",
  "cd": 3.8,
  "dmg": 40,
  "fx": "sweep",
  "hero": "ying",
  "kind": "gadget"
 },
 "skylantern": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "mix",
  "cd": 3.2,
  "dmg": 14,
  "fx": "meteor",
  "aoe": 24,
  "burn": 4,
  "hero": "ying",
  "kind": "lamp"
 },
 "toolbox": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 3.4,
  "dmg": 0,
  "fx": "none",
  "buff": 0.35,
  "hero": "ying",
  "kind": "gadget",
  "buffKind": {
   "kind": "gadget",
   "amt": 0.1
  }
 },
 "sparkwick": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 0,
  "passive": 1,
  "dmg": 6,
  "fx": "spark",
  "burn": 2,
  "hero": "ayla"
 },
 "frostseal": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "cd",
  "cd": 2,
  "dmg": 4,
  "fx": "ice",
  "slow": 0,
  "freeze": 1,
  "hero": "li"
 },
 "rime": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 19,
  "fx": "ice",
  "slow": 0.2,
  "frozenMul": 3,
  "hero": "mo"
 },
 "avalanche": {
  "size": 3,
  "tag": "ice",
  "t": 2,
  "up": "mix",
  "cd": 4.4,
  "dmg": 26,
  "fx": "avalanche",
  "per": {
   "tag": "ice",
   "pct": 0.2
  },
  "kind": "sky",
  "hero": "li"
 },
 "netcoil": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "passive": 1,
  "dmg": 10,
  "fx": "discharge",
  "kind": "gadget",
  "hero": "mo"
 },
 "appwand": {
  "size": 1,
  "tag": "volt",
  "t": 0,
  "up": "mix",
  "cd": 1.6,
  "dmg": 5,
  "fx": "bolt",
  "chain": 1,
  "quest": {
   "n": 150,
   "into": "thunderking"
  },
  "hero": "mo"
 },
 "thunderking": {
  "size": 1,
  "tag": "volt",
  "t": 0,
  "up": "mix",
  "cd": 1.6,
  "dmg": 7,
  "fx": "bolt",
  "chain": 4,
  "noPool": 1,
  "hero": "mo"
 },
 "headxbow": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 60,
  "fx": "arrow",
  "pierce": 3,
  "ammo": 3,
  "kind": "weapon",
  "hero": "ayla"
 },
 "armorer": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 4.5,
  "dmg": 0,
  "fx": "none",
  "reload": 1,
  "reloadElse": 0.1,
  "kind": "gadget",
  "hero": "ayla"
 },
 "volley": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 3.2,
  "dmg": 7,
  "fx": "knife",
  "multi": 3,
  "kind": "firearm",
  "hero": "ying"
 },
 "smokebomb": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "cd",
  "cd": 1.8,
  "dmg": 3,
  "fx": "sting",
  "poison": 1,
  "vuln": [
   4,
   0.25
  ],
  "kind": "potion",
  "hero": "mo"
 },
 "guillotine": {
  "size": 3,
  "tag": "blade",
  "t": 2,
  "up": "dmg",
  "cd": 5,
  "dmg": 40,
  "fx": "axe",
  "exec": 0.2,
  "kind": "gadget",
  "hero": "ayla"
 },
 "honeblade": {
  "grow": 1,
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "dmg",
  "cd": 1.4,
  "dmg": 5,
  "fx": "knife",
  "kind": "weapon",
  "hero": "ayla"
 },
 "alarmbell": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "passive": 1,
  "dmg": 0,
  "fx": "none",
  "kind": "gadget",
  "hero": "jun"
 },
 "wardrum": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 4,
  "dmg": 0,
  "fx": "none",
  "hasteKind": {
   "kind": "weapon",
   "t": 1.5
  },
  "hero": "ayla",
  "snd": "drum"
 },
 "vetblade": {
  "grow": 1,
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.2,
  "dmg": 14,
  "fx": "slash",
  "stack": 1,
  "kind": "weapon",
  "hero": "ayla"
 },
 "javelin": {
  "size": 1,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 1.6,
  "dmg": 35,
  "fx": "knife",
  "ammo": 2,
  "kind": "weapon",
  "hero": "ayla"
 },
 "oiltrap": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 0,
  "passive": 1,
  "dmg": 0,
  "fx": "none",
  "hero": "ayla"
 },
 "flagpole": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "passive": 1,
  "dmg": 0,
  "fx": "none",
  "hero": "ayla"
 },
 "nightsword": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "mix",
  "cd": 2,
  "dmg": 24,
  "fx": "slash",
  "exec": 0.15,
  "kind": "weapon",
  "hero": "ayla",
  "noPool": 1
 },
 "crucible": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 4,
  "dmg": 26,
  "fx": "flame",
  "aoe": 30,
  "burn": 3,
  "per": {
   "elem": 1,
   "pct": 0.2
  },
  "kind": "potion",
  "hero": "mo"
 },
 "condenser": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "cd",
  "cd": 1.8,
  "dmg": 5,
  "fx": "ice",
  "slow": 0,
  "freeze": 0.8,
  "kind": "potion",
  "hero": "mo"
 },
 "shockvenom": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "mix",
  "cd": 2.6,
  "dmg": 8,
  "fx": "bolt",
  "chain": 3,
  "kind": "potion",
  "hero": "mo"
 },
 "midas": {
  "size": 1,
  "tag": "poison",
  "t": 1,
  "up": "dmg",
  "cd": 1.8,
  "dmg": 4,
  "fx": "sting",
  "poison": 3,
  "kind": "potion",
  "hero": "mo"
 },
 "jars": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "passive": 1,
  "dmg": 0,
  "fx": "none",
  "kindHaste": 1,
  "kind": "potion",
  "hero": "mo"
 },
 "supersat": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "dmg",
  "cd": 1.5,
  "dmg": 4,
  "fx": "sting",
  "poison": 3,
  "kind": "potion",
  "hero": "mo",
  "quest": {
   "n": 300,
   "into": "sagedrop"
  }
 },
 "sagedrop": {
  "size": 1,
  "tag": "poison",
  "t": 0,
  "up": "dmg",
  "cd": 1.3,
  "dmg": 6,
  "fx": "sting",
  "poison": 5,
  "poisonDur": 6,
  "kind": "potion",
  "hero": "mo",
  "noPool": 1
 },
 "marquee": {
  "size": 2,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.4,
  "dmg": 16,
  "fx": "firefly",
  "kind": "lamp",
  "hero": "ying"
 },
 "crackers": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 2.2,
  "dmg": 5,
  "fx": "shell",
  "aoe": 14,
  "multi": 3,
  "kind": "firearm",
  "hero": "ying"
 },
 "wickcut": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "hasteNb": 2,
  "kind": "gadget",
  "hero": "ying"
 },
 "lamps": {
  "grow": 1,
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.4,
  "dmg": 5,
  "fx": "spark",
  "burn": 2,
  "kind": "lamp",
  "hero": "ying"
 },
 "ffjar": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0.6,
  "dmg": 4,
  "fx": "firefly",
  "ammo": 6,
  "kind": "lamp",
  "hero": "ying"
 },
 "pocketwatch": {
  "size": 2,
  "tag": "mech",
  "t": 2,
  "up": "cd",
  "cd": 10,
  "dmg": 0,
  "fx": "none",
  "hasteSmall": 3,
  "kind": "gadget",
  "hero": "ying"
 },
 "banner": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "passive": 1,
  "kind": "gadget",
  "hero": "ayla",
  "critNb": 0.15
 },
 "shieldwall": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "mix",
  "cd": 2,
  "dmg": 22,
  "fx": "slash",
  "kind": "weapon",
  "hero": "ayla",
  "onChain": 0.8
 },
 "pike": {
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "cd",
  "cd": 1.3,
  "dmg": 10,
  "fx": "arrow",
  "pierce": 1,
  "kind": "weapon",
  "hero": "ayla",
  "onChain": 0.6
 },
 "rocket": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.1,
  "dmg": 9,
  "fx": "shell",
  "aoe": 10,
  "multi": 2,
  "kind": "firearm",
  "hero": "ying",
  "ammo": 5
 },
 "fireworks": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 3.2,
  "dmg": 16,
  "fx": "shell",
  "aoe": 30,
  "multi": 3,
  "burn": 2,
  "kind": "firearm",
  "hero": "ying",
  "ammo": 3
 },
 "matchbox": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "cd",
  "cd": 2.2,
  "dmg": 0,
  "fx": "none",
  "charge": 0.25,
  "chargeKind": "firearm",
  "kind": "gadget",
  "hero": "ying"
 },
 "stall": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 10,
  "fx": "shell",
  "aoe": 18,
  "multi": 3,
  "kind": "firearm",
  "hero": "ying",
  "per": {
   "kind": "firearm",
   "pct": 0.12
  }
 },
 "turret": {
  "size": 2,
  "tag": "mech",
  "t": 0,
  "up": "dmg",
  "cd": 2,
  "dmg": 17,
  "fx": "shell",
  "aoe": 14,
  "posMid": 0.5,
  "kind": "firearm",
  "hero": "jun"
 },
 "scaffold": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 2.4,
  "dmg": 0,
  "fx": "none",
  "charge": 0.2,
  "kind": "gadget",
  "hero": "jun"
 },
 "bigcannon": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "dmg",
  "cd": 4.8,
  "dmg": 48,
  "fx": "quake",
  "aoe": 36,
  "flank": 0.6,
  "kind": "firearm",
  "hero": "jun"
 },
 "mortar": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "mix",
  "cd": 2.8,
  "dmg": 20,
  "fx": "shell",
  "aoe": 24,
  "burn": 2,
  "posEdge": 0.4,
  "kind": "firearm",
  "hero": "jun"
 },
 "shellman": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "reload": 1,
  "reloadElse": 0.15,
  "kind": "gadget",
  "hero": "jun"
 },
 "palisade": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "shieldGain": 3,
  "kind": "gadget",
  "hero": "jun"
 },
 "caltrop": {
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "cd",
  "cd": 1.2,
  "dmg": 7,
  "fx": "knife",
  "slow": 0.2,
  "kind": "weapon",
  "hero": "jun"
 },
 "watchtower": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 20,
  "fx": "arrow",
  "pierce": 2,
  "posEdge": 0.5,
  "kind": "weapon",
  "hero": "jun"
 },
 "bastion": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "mix",
  "cd": 4,
  "dmg": 26,
  "fx": "bell",
  "shieldGain": 5,
  "kind": "gadget",
  "hero": "jun"
 },
 "powderkeg": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "dmg",
  "cd": 1.8,
  "dmg": 10,
  "fx": "shell",
  "aoe": 16,
  "lineKind": {
   "kind": "firearm",
   "pct": 0.35
  },
  "kind": "firearm",
  "hero": "jun"
 },
 "crossbows": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "mix",
  "cd": 2.2,
  "dmg": 20,
  "fx": "arrow",
  "pierce": 4,
  "lineKind": {
   "kind": "weapon",
   "pct": 0.25
  },
  "kind": "weapon",
  "hero": "jun"
 },
 "cogline": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "passive": 1,
  "auraNb": 0.2,
  "kind": "gadget",
  "hero": "jun"
 },
 "astrolabe": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 1.8,
  "dmg": 0,
  "fx": "none",
  "chargeCarry": 0.4,
  "kind": "gadget",
  "hero": "li"
 },
 "lens": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.4,
  "dmg": 0,
  "fx": "none",
  "buffCarry": 0.5,
  "kind": "gadget",
  "hero": "li"
 },
 "comet": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "mix",
  "cd": 2.2,
  "dmg": 26,
  "fx": "bolt",
  "chain": 4,
  "kind": "sky",
  "hero": "li"
 },
 "starseed": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "mix",
  "cd": 1.4,
  "dmg": 8,
  "fx": "ice",
  "slow": 0.25,
  "hero": "li"
 },
 "orrery": {
  "size": 2,
  "tag": "mech",
  "t": 2,
  "up": "cd",
  "cd": 3,
  "dmg": 0,
  "fx": "none",
  "chargeCarry": 0.6,
  "buffCarry": 0.3,
  "kind": "gadget",
  "hero": "li"
 },
 "frostar": {
  "size": 1,
  "tag": "ice",
  "t": 0,
  "up": "cd",
  "cd": 1.2,
  "dmg": 7,
  "fx": "ice",
  "slow": 0.3,
  "freeze": 0.4,
  "hero": "li"
 },
 "glacier": {
  "size": 3,
  "tag": "ice",
  "t": 2,
  "up": "mix",
  "cd": 4,
  "dmg": 26,
  "fx": "blizzard",
  "slow": 0.4,
  "kind": "sky",
  "hero": "li"
 },
 "rimelance": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "dmg",
  "cd": 2.2,
  "dmg": 22,
  "fx": "arrow",
  "pierce": 2,
  "frozenMul": 1.6,
  "kind": "weapon",
  "hero": "li"
 },
 "stardust": {
  "size": 1,
  "tag": "volt",
  "t": 0,
  "up": "cd",
  "cd": 1.6,
  "dmg": 4,
  "fx": "knife",
  "multi": 3,
  "hero": "li"
 },
 "starfire": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "mix",
  "cd": 4.2,
  "dmg": 28,
  "fx": "meteor",
  "aoe": 36,
  "burn": 4,
  "kind": "sky",
  "hero": "li"
 },
 "pulsar": {
  "size": 2,
  "tag": "volt",
  "t": 1,
  "up": "mix",
  "cd": 2,
  "dmg": 14,
  "fx": "bolt",
  "chain": 3,
  "kind": "sky",
  "hero": "li",
  "asCarry": 0.5
 },
 "gunner": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.4,
  "dmg": 0,
  "fx": "none",
  "charge": 0.25,
  "chargeKind": "firearm",
  "buff": 0.25,
  "kind": "gadget",
  "hero": "jun"
 },
 "grapeshot": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "mix",
  "cd": 2.6,
  "dmg": 6,
  "fx": "shell",
  "aoe": 14,
  "multi": 4,
  "posMid": 0.35,
  "kind": "firearm",
  "hero": "jun"
 },
 "bombard": {
  "size": 3,
  "tag": "fire",
  "t": 2,
  "up": "dmg",
  "cd": 4.4,
  "dmg": 40,
  "fx": "shell",
  "aoe": 30,
  "burn": 3,
  "posMid": 0.5,
  "kind": "firearm",
  "hero": "jun"
 },
 "moat": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "mix",
  "cd": 2.8,
  "dmg": 12,
  "fx": "sweep",
  "slow": 0.35,
  "posEdge": 0.3,
  "hero": "jun"
 },
 "spikewall": {
  "size": 2,
  "tag": "blade",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 14,
  "fx": "axe",
  "kind": "weapon",
  "shieldDmg": 0.4,
  "hero": "jun"
 },
 "mason": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "passive": 1,
  "kind": "gadget",
  "hero": "jun"
 },
 "stakes": {
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "mix",
  "cd": 1.6,
  "dmg": 7,
  "fx": "rock",
  "kb": 0.035,
  "kind": "weapon",
  "hero": "jun"
 },
 "beehive": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "mix",
  "cd": 3,
  "dmg": 8,
  "fx": "knife",
  "multi": 6,
  "lineKind": {
   "kind": "firearm",
   "pct": 0.25
  },
  "kind": "firearm",
  "hero": "jun",
  "pen": 3
 },
 "beacontower": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "cd",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "passive": 1,
  "kind": "gadget",
  "hero": "jun"
 },
 "trebuchet": {
  "size": 3,
  "tag": "mech",
  "t": 2,
  "up": "dmg",
  "cd": 4.2,
  "dmg": 38,
  "fx": "quake",
  "aoe": 26,
  "lineKind": {
   "kind": "gadget",
   "pct": 0.4
  },
  "kind": "gadget",
  "hero": "jun"
 },
 "sextant": {
  "size": 1,
  "tag": "mech",
  "t": 0,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "hasteCarry": 1,
  "kind": "gadget",
  "hero": "li"
 },
 "spyglass": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 4,
  "dmg": 0,
  "fx": "none",
  "critCarry": 1,
  "kind": "gadget",
  "hero": "li"
 },
 "wishstar": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "passive": 1,
  "kind": "gadget",
  "hero": "li"
 },
 "northstar": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "dmg",
  "cd": 2.4,
  "dmg": 16,
  "fx": "ice",
  "freeze": 0.8,
  "frozenMul": 1.8,
  "kind": "sky",
  "hero": "li"
 },
 "rimeglass": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "cd",
  "cd": 2.6,
  "dmg": 0,
  "fx": "none",
  "buffCarry": 0.2,
  "freezeCarry": 0.6,
  "kind": "gadget",
  "hero": "li"
 },
 "aurora": {
  "size": 3,
  "tag": "ice",
  "t": 2,
  "up": "mix",
  "cd": 4.4,
  "dmg": 20,
  "fx": "blizzard",
  "slow": 0.3,
  "freeze": 0.5,
  "kind": "sky",
  "hero": "li"
 },
 "icemoon": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "mix",
  "cd": 2.2,
  "dmg": 16,
  "fx": "arrow",
  "pierce": 2,
  "frozenMul": 1.8,
  "kind": "sky",
  "hero": "li",
  "asCarry": 0.4
 },
 "fallstar": {
  "size": 1,
  "tag": "fire",
  "t": 0,
  "up": "mix",
  "cd": 1.8,
  "dmg": 5,
  "fx": "shell",
  "aoe": 14,
  "burn": 1,
  "multi": 2,
  "hero": "li"
 },
 "galaxy": {
  "size": 3,
  "tag": "volt",
  "t": 2,
  "up": "mix",
  "cd": 3.6,
  "dmg": 10,
  "fx": "bolt",
  "chain": 1,
  "multi": 5,
  "kind": "sky",
  "hero": "li"
 },
 "nova": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 3,
  "dmg": 14,
  "fx": "meteor",
  "aoe": 24,
  "burn": 2,
  "stack": 2,
  "kind": "sky",
  "hero": "li"
 },
 "chartpage": {
  "size": 1,
  "tag": "mech",
  "t": 1,
  "up": "mix",
  "cd": 2.4,
  "dmg": 0,
  "fx": "none",
  "kind": "gadget",
  "hero": "li",
  "stackCarry": 2
 },
 "sirius": {
  "size": 3,
  "tag": "volt",
  "t": 2,
  "up": "dmg",
  "cd": 3.6,
  "dmg": 64,
  "fx": "bolt",
  "kind": "sky",
  "hero": "li",
  "chain": 2,
  "asCarry": 0.5
 },
 "moondial": {
  "size": 1,
  "tag": "ice",
  "t": 1,
  "up": "mix",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "kind": "gadget",
  "hero": "li",
  "passive": 1
 },
 "tent": {
  "size": 2,
  "tag": "mech",
  "t": 2,
  "up": "mix",
  "cd": 0,
  "dmg": 0,
  "fx": "none",
  "kind": "gadget",
  "hero": "jun",
  "passive": 1,
  "posBoost": 0.2
 },
 "crenel": {
  "size": 1,
  "tag": "blade",
  "t": 0,
  "up": "cd",
  "cd": 1,
  "dmg": 6,
  "fx": "arrow",
  "kind": "weapon",
  "hero": "jun",
  "pierce": 1,
  "posEdge": 0.6
 },
 "kiln": {
  "size": 2,
  "tag": "fire",
  "t": 1,
  "up": "dmg",
  "cd": 2.8,
  "dmg": 16,
  "fx": "flame",
  "kind": "firearm",
  "hero": "jun",
  "aoe": 20,
  "burn": 3,
  "shieldGain": 2,
  "posMid": 0.3
 },
 "dualflask": {
  "size": 2,
  "tag": "ice",
  "t": 1,
  "up": "dmg",
  "cd": 2.6,
  "dmg": 16,
  "fx": "shell",
  "kind": "potion",
  "hero": "mo",
  "aoe": 22,
  "burn": 3,
  "slow": 0.3
 }
} as unknown as Record<string, ItemDef>;

/** 升品曲线：d 伤害倍率、c 冷却倍率，按升了几档取值 / tier-up curve: d damage multiplier, c cooldown multiplier, indexed by how many tiers were gained */
export const UPS: Record<string, UpgradeCurve> = {
 "dmg": {
  "d": [
   1,
   2,
   3.4,
   5.6
  ],
  "c": [
   1,
   1,
   1,
   1
  ]
 },
 "cd": {
  "d": [
   1,
   1.3,
   1.7,
   2.2
  ],
  "c": [
   1,
   0.75,
   0.58,
   0.45
  ]
 },
 "mix": {
  "d": [
   1,
   1.55,
   2.3,
   3.4
  ],
  "c": [
   1,
   0.87,
   0.76,
   0.66
  ]
 }
};

export const ADJ: Record<string, AdjDef> = {
 "swift": {
  "r": 0,
  "c": "#5ad1a8"
 },
 "momentum": {
  "r": 1,
  "c": "#8fdc5a"
 },
 "rush": {
  "r": 1,
  "c": "#c4ea5d"
 },
 "sharp": {
  "r": 0,
  "c": "#e3e9f0"
 },
 "fervor": {
  "r": 0,
  "c": "#ff8a66"
 },
 "deadly": {
  "r": 2,
  "c": "#ff4d6a"
 },
 "precise": {
  "r": 0,
  "c": "#ffd166"
 },
 "echo": {
  "r": 2,
  "c": "#c79bff"
 },
 "twin": {
  "r": 2,
  "c": "#ff95dc"
 },
 "ignite": {
  "r": 1,
  "c": "#ffa53b"
 },
 "resonance": {
  "r": 1,
  "c": "#6ab7ff"
 },
 "greedy": {
  "r": 0,
  "c": "#f5d04a"
 },
 "hoard": {
  "r": 0,
  "c": "#e8b86b"
 },
 "chill": {
  "r": 0,
  "c": "#9fe8ff"
 },
 "sturdy": {
  "r": 0,
  "c": "#b3c2d2"
 },
 "heavy": {
  "r": 1,
  "c": "#c99a6b"
 }
} as unknown as Record<string, AdjDef>;

/** 不打伤害的卡只能抽到这些词缀 / cards that deal no damage can only roll these affixes */
export const ADJ_NODMG = [
 "swift",
 "momentum",
 "rush",
 "echo",
 "twin",
 "ignite",
 "hoard",
 "sturdy"
];

export const TIERS = [
 {
  "c": "#d08a4c",
  "bg": "#ecd2ad"
 },
 {
  "c": "#aebccc",
  "bg": "#e4ebf3"
 },
 {
  "c": "#ffc328",
  "bg": "#ffe79a"
 },
 {
  "c": "#45dcff",
  "bg": "#c2f4ff"
 }
] as { c: string; bg: string; n: string }[];

/** 遗物品阶颜色 / relic rarity colors */
export const GT = [
 {
  "c": "#c8d0d8"
 },
 {
  "c": "#5aa9ff"
 },
 {
  "c": "#b77cff"
 },
 {
  "c": "#ff5a5a"
 }
] as { c: string; n: string }[];

export const TAGS: Tag[] = [
 "blade",
 "fire",
 "ice",
 "volt",
 "mech",
 "poison"
];

export const TAGC: Record<Tag, string> = {
 "blade": "#c9d4e0",
 "fire": "#f06d3b",
 "volt": "#f5c542",
 "ice": "#5cc8f0",
 "mech": "#b08a5a",
 "poison": "#7ddc5f"
};

/** 功能标签：和元素交叉，用于「每有一张某类卡」 / function tags: cross with elements, used by 'per card of a type' */
export const KINDS: Record<Kind, string[]> = {
 "weapon": [
  "dagger",
  "axe",
  "oathsword",
  "ballista",
  "emberblade",
  "cleaver",
  "arrowrain",
  "greatsword",
  "executioner",
  "sling",
  "gear",
  "clockwork"
 ],
 "firearm": [
  "cannon",
  "firecracker",
  "flamethrower",
  "oilpit"
 ],
 "potion": [
  "vial",
  "acidvial",
  "plague",
  "putrefy",
  "needle",
  "snakekiss",
  "acidrain",
  "plagueburst",
  "arcbottle",
  "stormflask",
  "frostvial",
  "icebomb",
  "concentrate",
  "miasma",
  "resonate",
  "quicklime",
  "venom",
  "oilflask"
 ],
 "gadget": [
  "clock",
  "anvil",
  "whetstone",
  "musicbox",
  "pendulum",
  "windup",
  "mainspring",
  "toolbox",
  "warhorn",
  "tesla"
 ],
 "lamp": [
  "firefly",
  "paperlamp",
  "dragonlantern",
  "lamplight",
  "beacon",
  "skylantern",
  "oilspill",
  "oilpot",
  "fuse",
  "moth",
  "paperkite"
 ],
 "sky": [
  "thunder",
  "starfall",
  "sunflare",
  "phoenix",
  "bolt"
 ]
};
