/* 从旧版数据迁移而来，直接在这里改 */
import type { EnemyDef } from './types';

export const EN: Record<string, EnemyDef> = {
 "slime": {
  "hp": 10,
  "spd": 0.055,
  "armor": 0,
  "wall": 1,
  "spr": "slime",
  "sc": 1,
  "col": "#a7f070",
  "faction": "swamp"
 },
 "bat": {
  "hp": 6,
  "spd": 0.1,
  "armor": 0,
  "wall": 1,
  "spr": "bat",
  "sc": 1,
  "zig": 1,
  "col": "#a64ca6",
  "faction": "wing"
 },
 "skel": {
  "hp": 20,
  "spd": 0.045,
  "armor": 2,
  "wall": 2,
  "spr": "skel",
  "sc": 1,
  "col": "#94b0c2",
  "faction": "dead"
 },
 "bug": {
  "hp": 14,
  "spd": 0.05,
  "armor": 0,
  "wall": 1,
  "spr": "bug",
  "sc": 1,
  "split": 2,
  "col": "#38b764",
  "faction": "swamp"
 },
 "mini": {
  "hp": 5,
  "spd": 0.08,
  "armor": 0,
  "wall": 1,
  "spr": "mini",
  "sc": 1,
  "col": "#a7f070",
  "faction": "swamp",
  "small": 1
 },
 "golem": {
  "hp": 110,
  "spd": 0.028,
  "armor": 5,
  "wall": 5,
  "spr": "golem",
  "sc": 1,
  "col": "#c28a4d",
  "faction": "war"
 },
 "knight": {
  "hp": 1000,
  "spd": 0.022,
  "armor": 3,
  "wall": 12,
  "spr": "b_knight",
  "sc": 1,
  "elite": 1,
  "fixed": 1,
  "col": "#a64ca6",
  "intents": [
   {
    "t": 6,
    "a": "shield"
   },
   {
    "t": 8,
    "a": "dash"
   }
  ],
  "faction": "dead"
 },
 "eye": {
  "final": 1,
  "hp": 11000,
  "spd": 0.012,
  "armor": 3,
  "wall": 99,
  "spr": "b_eye",
  "sc": 1,
  "boss": 1,
  "fixed": 1,
  "col": "#e43b44",
  "intents": [
   {
    "t": 7,
    "a": "summon"
   },
   {
    "t": 9,
    "a": "gaze"
   },
   {
    "t": 8,
    "a": "harden"
   }
  ],
  "faction": "abyss"
 },
 "shaman": {
  "hp": 26,
  "spd": 0.04,
  "armor": 0,
  "wall": 2,
  "spr": "shaman",
  "sc": 1,
  "col": "#38b764",
  "heal": 0.12,
  "aura": 34,
  "faction": "cult"
 },
 "shieldb": {
  "hp": 44,
  "spd": 0.035,
  "armor": 4,
  "wall": 2,
  "spr": "shieldb",
  "sc": 1,
  "col": "#41a6f6",
  "guard": 3,
  "aura": 30,
  "faction": "dead"
 },
 "drummer": {
  "hp": 26,
  "spd": 0.045,
  "armor": 0,
  "wall": 2,
  "spr": "drummer",
  "sc": 1,
  "col": "#e43b44",
  "haste": 0.35,
  "aura": 34,
  "faction": "war"
 },
 "bomber": {
  "hp": 10,
  "spd": 0.085,
  "armor": 0,
  "wall": 3,
  "spr": "bomber",
  "sc": 1,
  "col": "#ef7d57",
  "bomb": 0.45,
  "faction": "war"
 },
 "ghost": {
  "hp": 16,
  "spd": 0.05,
  "armor": 0,
  "wall": 1,
  "spr": "ghost",
  "sc": 1,
  "col": "#73eff7",
  "phase": 1,
  "faction": "dead"
 },
 "necro": {
  "hp": 34,
  "spd": 0.03,
  "armor": 0,
  "wall": 3,
  "spr": "necro",
  "sc": 1,
  "col": "#b77cff",
  "raise": 2,
  "faction": "cult"
 },
 "siege": {
  "hp": 240,
  "spd": 0.02,
  "armor": 3,
  "wall": 8,
  "spr": "siege",
  "sc": 1,
  "col": "#c28a4d",
  "cargo": [
   "skel",
   5
  ],
  "faction": "war"
 },
 "mimic": {
  "hp": 60,
  "spd": 0.028,
  "armor": 1,
  "wall": 3,
  "spr": "chest_m",
  "spr2": "mimic",
  "sc": 1,
  "col": "#ffcd75",
  "mimic": 3,
  "faction": "swamp"
 },
 "berserker": {
  "hp": 50,
  "spd": 0.04,
  "armor": 1,
  "wall": 3,
  "spr": "berserker",
  "sc": 1,
  "col": "#e43b44",
  "rage": 1.8,
  "faction": "war"
 },
 "catapult": {
  "hp": 70,
  "spd": 0.03,
  "armor": 2,
  "wall": 3,
  "spr": "catapult",
  "sc": 1,
  "col": "#c28a4d",
  "stopAt": 0.3,
  "lob": [
   4.5,
   1
  ],
  "faction": "war"
 },
 "f_mite": {
  "hp": 10,
  "spd": 0.06,
  "armor": 0,
  "wall": 1,
  "spr": "f_mite",
  "sc": 1,
  "col": "#73eff7",
  "faction": "frost"
 },
 "f_owl": {
  "hp": 6,
  "spd": 0.1,
  "armor": 0,
  "wall": 1,
  "spr": "f_owl",
  "sc": 1,
  "zig": 1,
  "col": "#f4f4f4",
  "faction": "frost"
 },
 "f_husk": {
  "hp": 20,
  "spd": 0.045,
  "armor": 2,
  "wall": 2,
  "spr": "f_husk",
  "sc": 1,
  "col": "#41a6f6",
  "faction": "frost"
 },
 "f_egg": {
  "hp": 14,
  "spd": 0.05,
  "armor": 0,
  "wall": 1,
  "spr": "f_egg",
  "sc": 1,
  "split": 2,
  "col": "#73eff7",
  "faction": "frost",
  "splitInto": "f_chip"
 },
 "f_chip": {
  "hp": 5,
  "spd": 0.08,
  "armor": 0,
  "wall": 1,
  "spr": "f_chip",
  "sc": 1,
  "col": "#73eff7",
  "faction": "frost",
  "small": 1
 },
 "f_yeti": {
  "hp": 110,
  "spd": 0.028,
  "armor": 5,
  "wall": 5,
  "spr": "f_yeti",
  "sc": 1,
  "col": "#f4f4f4",
  "faction": "frost",
  "chill": 2
 },
 "f_warden": {
  "hp": 44,
  "spd": 0.035,
  "armor": 4,
  "wall": 2,
  "spr": "f_warden",
  "sc": 1,
  "col": "#73eff7",
  "guard": 3,
  "aura": 30,
  "faction": "frost"
 },
 "f_witch": {
  "hp": 26,
  "spd": 0.04,
  "armor": 0,
  "wall": 2,
  "spr": "f_witch",
  "sc": 1,
  "col": "#41a6f6",
  "heal": 0.12,
  "aura": 34,
  "faction": "frost"
 },
 "f_horn": {
  "hp": 26,
  "spd": 0.045,
  "armor": 0,
  "wall": 2,
  "spr": "f_horn",
  "sc": 1,
  "col": "#c28a4d",
  "haste": 0.35,
  "aura": 34,
  "faction": "frost"
 },
 "f_beetle": {
  "hp": 10,
  "spd": 0.085,
  "armor": 0,
  "wall": 3,
  "spr": "f_beetle",
  "sc": 1,
  "col": "#41a6f6",
  "bomb": 0.45,
  "faction": "frost"
 },
 "f_wisp": {
  "hp": 16,
  "spd": 0.05,
  "armor": 0,
  "wall": 1,
  "spr": "f_wisp",
  "sc": 1,
  "col": "#f4f4f4",
  "phase": 1,
  "faction": "frost"
 },
 "f_priest": {
  "hp": 34,
  "spd": 0.03,
  "armor": 0,
  "wall": 3,
  "spr": "f_priest",
  "sc": 1,
  "col": "#73eff7",
  "raise": 2,
  "faction": "frost",
  "raiseAs": "f_husk"
 },
 "f_sled": {
  "hp": 240,
  "spd": 0.02,
  "armor": 3,
  "wall": 8,
  "spr": "f_sled",
  "sc": 1,
  "col": "#73eff7",
  "cargo": [
   "f_husk",
   5
  ],
  "faction": "frost",
  "chill": 2
 },
 "f_wolf": {
  "hp": 50,
  "spd": 0.04,
  "armor": 1,
  "wall": 3,
  "spr": "f_wolf",
  "sc": 1,
  "col": "#94b0c2",
  "rage": 1.8,
  "faction": "frost",
  "chill": 1
 },
 "f_ballista": {
  "hp": 70,
  "spd": 0.03,
  "armor": 2,
  "wall": 3,
  "spr": "f_ballista",
  "sc": 1,
  "col": "#73eff7",
  "stopAt": 0.3,
  "lob": [
   4.5,
   1
  ],
  "faction": "frost"
 },
 "a_brute": {
  "hp": 220,
  "spd": 0.028,
  "armor": 2,
  "wall": 8,
  "spr": "e_brute",
  "sc": 1,
  "elite": 1,
  "col": "#e43b44",
  "rage": 0.8,
  "faction": "war",
  "intents": [
   {
    "t": 6,
    "a": "roar"
   },
   {
    "t": 11,
    "a": "dash"
   }
  ]
 },
 "a_golem": {
  "hp": 280,
  "spd": 0.022,
  "armor": 6,
  "wall": 10,
  "spr": "e_golem",
  "sc": 1,
  "elite": 1,
  "col": "#c28a4d",
  "faction": "war",
  "intents": [
   {
    "t": 7,
    "a": "harden"
   },
   {
    "t": 9,
    "a": "quake"
   }
  ]
 },
 "a_lich": {
  "hp": 150,
  "spd": 0.025,
  "armor": 0,
  "wall": 8,
  "spr": "e_lich",
  "sc": 1,
  "elite": 1,
  "col": "#b77cff",
  "raise": 2,
  "faction": "cult",
  "intents": [
   {
    "t": 9,
    "a": "skels"
   },
   {
    "t": 8,
    "a": "shield"
   }
  ]
 },
 "fa_brute": {
  "hp": 220,
  "spd": 0.028,
  "armor": 2,
  "wall": 8,
  "spr": "e_wolf",
  "sc": 1,
  "elite": 1,
  "col": "#94b0c2",
  "rage": 0.8,
  "faction": "frost",
  "intents": [
   {
    "t": 6,
    "a": "roar"
   },
   {
    "t": 11,
    "a": "dash"
   }
  ],
  "chill": 2
 },
 "fa_golem": {
  "hp": 280,
  "spd": 0.022,
  "armor": 6,
  "wall": 10,
  "spr": "e_yeti",
  "sc": 1,
  "elite": 1,
  "col": "#f4f4f4",
  "faction": "frost",
  "intents": [
   {
    "t": 7,
    "a": "harden"
   },
   {
    "t": 9,
    "a": "quake"
   }
  ]
 },
 "fa_lich": {
  "hp": 150,
  "spd": 0.025,
  "armor": 0,
  "wall": 8,
  "spr": "e_priest",
  "sc": 1,
  "elite": 1,
  "col": "#73eff7",
  "raise": 2,
  "faction": "frost",
  "intents": [
   {
    "t": 9,
    "a": "skels"
   },
   {
    "t": 8,
    "a": "shield"
   }
  ],
  "raiseAs": "f_husk"
 },
 "f_crow": {
  "hp": 8,
  "spd": 0.045,
  "armor": 0,
  "wall": 2,
  "spr": "f_crow",
  "sc": 1,
  "col": "#c2f4ff",
  "dive": 3.6,
  "faction": "frost"
 },
 "f_shell": {
  "hp": 36,
  "spd": 0.034,
  "armor": 0,
  "wall": 2,
  "spr": "f_shell",
  "sc": 1,
  "col": "#73eff7",
  "shell": 3,
  "faction": "frost"
 },
 "f_mage": {
  "hp": 30,
  "spd": 0.035,
  "armor": 0,
  "wall": 2,
  "spr": "f_mage",
  "sc": 1,
  "col": "#41a6f6",
  "stopAt": 0.28,
  "fbolt": 5,
  "faction": "frost"
 },
 "brood": {
  "final": 1,
  "hp": 11000,
  "spd": 0.011,
  "armor": 2,
  "wall": 99,
  "spr": "b_brood",
  "sc": 1,
  "boss": 1,
  "fixed": 1,
  "col": "#7ddc5f",
  "faction": "abyss",
  "intents": [
   {
    "t": 6,
    "a": "brood"
   },
   {
    "t": 9,
    "a": "drain"
   },
   {
    "t": 8,
    "a": "molt"
   }
  ]
 },
 "mutebell": {
  "final": 1,
  "hp": 10000,
  "spd": 0.012,
  "armor": 2,
  "wall": 99,
  "spr": "b_bell",
  "sc": 1,
  "boss": 1,
  "fixed": 1,
  "col": "#c9b37a",
  "faction": "dead",
  "intents": [
   {
    "t": 7,
    "a": "toll",
    "v": 4
   },
   {
    "t": 8,
    "a": "hush",
    "v": 4
   },
   {
    "t": 9,
    "a": "knell",
    "v": 0.15
   }
  ]
 },
 "mistmother": {
  "final": 1,
  "hp": 9500,
  "spd": 0.013,
  "armor": 1,
  "wall": 99,
  "spr": "b_mist",
  "sc": 1,
  "boss": 1,
  "fixed": 1,
  "col": "#9fd8d0",
  "faction": "swamp",
  "intents": [
   {
    "t": 6,
    "a": "veil",
    "v": 5
   },
   {
    "t": 8,
    "a": "lure",
    "v": 2
   },
   {
    "t": 7,
    "a": "pilfer",
    "v": 2
   }
  ]
 },
 "siegelord": {
  "final": 1,
  "hp": 12500,
  "spd": 0.009,
  "armor": 4,
  "wall": 99,
  "spr": "b_siege",
  "sc": 1,
  "boss": 1,
  "fixed": 1,
  "col": "#c28a4d",
  "faction": "war",
  "intents": [
   {
    "t": 7,
    "a": "deploy",
    "v": 4
   },
   {
    "t": 9,
    "a": "barrage",
    "v": 4
   },
   {
    "t": 11,
    "a": "ram",
    "v": 2.5
   }
  ]
 }
} as unknown as Record<string, EnemyDef>;

export const FACTIONS = [
 "swamp",
 "wing",
 "dead",
 "cult",
 "war",
 "abyss",
 "frost"
] as const;

/** 两套敌人：霜潮按角色一一替换原来那套 */
export const FOESETS: Record<string, { map: Record<string, string>; n: string }> = {
 "dark": {
  "map": {}
 },
 "frost": {
  "map": {
   "slime": "f_mite",
   "bat": "f_owl",
   "skel": "f_husk",
   "bug": "f_egg",
   "mini": "f_chip",
   "golem": "f_yeti",
   "shieldb": "f_warden",
   "shaman": "f_witch",
   "drummer": "f_horn",
   "bomber": "f_beetle",
   "ghost": "f_wisp",
   "necro": "f_priest",
   "siege": "f_sled",
   "berserker": "f_wolf",
   "catapult": "f_ballista",
   "a_brute": "fa_brute",
   "a_golem": "fa_golem",
   "a_lich": "fa_lich"
  }
 }
} as never;

/** 拦路和无尽夜用的精英 */
export const ELITES = [
 "a_brute",
 "a_golem",
 "a_lich"
];
