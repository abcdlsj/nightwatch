/* 从旧版数据迁移而来，直接在这里改 */
import type { RelicDef } from './types';

export const RELICS: Record<string, RelicDef> = {
 "whet": {
  "t": 0,
  "ico": "r_whet",
  "m": {
   "tag_blade": 0.15
  }
 },
 "oil": {
  "t": 0,
  "ico": "r_oil",
  "m": {
   "burn": 0.5
  }
 },
 "sand": {
  "t": 0,
  "ico": "r_glass",
  "m": {
   "spd": 0.06
  }
 },
 "scope": {
  "t": 0,
  "ico": "r_scope",
  "m": {
   "crit": 0.05
  }
 },
 "brick": {
  "t": 0,
  "ico": "badge:g",
  "m": {
   "wall": 4
  }
 },
 "jar": {
  "t": 0,
  "ico": "potion:y",
  "m": {
   "interest": 2
  }
 },
 "icepack": {
  "t": 0,
  "ico": "potion:C",
  "m": {
   "tag_ice": 0.15
  }
 },
 "wire": {
  "t": 0,
  "ico": "ring:o",
  "m": {
   "tag_volt": 0.15
  }
 },
 "grease": {
  "t": 0,
  "ico": "potion:N",
  "m": {
   "tag_mech": 0.15
  }
 },
 "tinder": {
  "t": 0,
  "ico": "book:R",
  "m": {
   "tag_fire": 0.15
  }
 },
 "bracer": {
  "t": 0,
  "ico": "boot:N",
  "m": {
   "s1": 0.12
  }
 },
 "strap": {
  "t": 0,
  "ico": "badge:N",
  "m": {
   "s2": 0.12
  }
 },
 "pole": {
  "t": 0,
  "ico": "scroll:N",
  "m": {
   "s3": 0.12
  }
 },
 "coin": {
  "t": 0,
  "ico": "r_lucky",
  "m": {
   "winGold": 2
  }
 },
 "abacus": {
  "t": 1,
  "ico": "scroll:b",
  "m": {
   "interest": 3
  }
 },
 "fortune": {
  "t": 2,
  "ico": "badge:g",
  "m": {
   "winGold": 3
  }
 },
 "treasure": {
  "t": 3,
  "ico": "gem:R",
  "u": 1,
  "m": {
   "interest": 8
  }
 },
 "shroom": {
  "t": 0,
  "ico": "shroom:R",
  "m": {
   "dmg": 0.1,
   "wall": -2
  }
 },
 "mud": {
  "t": 0,
  "ico": "boot:g",
  "m": {
   "enemySpd": -0.04
  }
 },
 "heart": {
  "t": 1,
  "ico": "r_heart",
  "m": {
   "startCharge": 0.3
  }
 },
 "flag": {
  "t": 1,
  "ico": "r_flag",
  "m": {
   "left": 0.5
  }
 },
 "horn": {
  "t": 1,
  "ico": "claw:y",
  "m": {
   "right": 0.5
  }
 },
 "cloud": {
  "t": 1,
  "ico": "r_jar",
  "m": {
   "chain": 1
  }
 },
 "charm": {
  "t": 1,
  "ico": "r_charm",
  "m": {
   "slowVuln": 0.25
  }
 },
 "spike": {
  "t": 1,
  "ico": "claw:g",
  "m": {
   "pen": 2
  }
 },
 "rampart": {
  "t": 1,
  "ico": "r_rampart",
  "m": {
   "wall": 8
  }
 },
 "buckler": {
  "t": 1,
  "ico": "badge:c",
  "m": {
   "shieldStart": 5
  }
 },
 "hunter": {
  "t": 1,
  "ico": "claw:o",
  "m": {
   "killGold": 0.05
  }
 },
 "spyglass": {
  "t": 1,
  "ico": "orb:b",
  "m": {
   "range": -0.05
  }
 },
 "fang": {
  "t": 1,
  "ico": "claw:w",
  "m": {
   "critDmg": 0.5
  }
 },
 "trowel": {
  "t": 1,
  "ico": "badge:y",
  "m": {
   "regen": 3
  }
 },
 "powder": {
  "t": 1,
  "ico": "potion:s",
  "m": {
   "aoe": 0.25
  }
 },
 "lone": {
  "t": 1,
  "ico": "badge:P",
  "m": {
   "lonely": 0.4
  }
 },
 "hammer": {
  "t": 2,
  "ico": "r_hammer",
  "m": {
   "s3": 0.3,
   "spd": -0.05
  }
 },
 "glass": {
  "t": 2,
  "ico": "gem:C",
  "m": {
   "xdmg": 0.25,
   "wall": -8
  }
 },
 "shell": {
  "t": 2,
  "ico": "r_shell",
  "m": {
   "shellChain": 1
  },
  "u": 1
 },
 "purse": {
  "t": 2,
  "ico": "r_purse",
  "m": {
   "interest": 5
  }
 },
 "roster": {
  "t": 2,
  "ico": "book:b",
  "m": {
   "full": 0.25
  }
 },
 "wisp": {
  "t": 2,
  "ico": "orb:l",
  "m": {
   "burn": 1,
   "tag_fire": 0.1
  }
 },
 "stormeye": {
  "t": 2,
  "ico": "orb:Y",
  "m": {
   "chain": 2,
   "tag_volt": 0.1
  }
 },
 "permafrost": {
  "t": 2,
  "ico": "gem:c",
  "m": {
   "slow": 0.5,
   "tag_ice": 0.2
  }
 },
 "medal": {
  "t": 2,
  "ico": "badge:Y",
  "m": {
   "dmg": 0.15,
   "crit": 0.05
  }
 },
 "timer": {
  "t": 2,
  "ico": "orb:o",
  "m": {
   "spd": 0.15,
   "dmg": -0.05
  }
 },
 "oath": {
  "t": 3,
  "ico": "scroll:R",
  "m": {
   "xdmg": 0.2,
   "wall": 10
  },
  "u": 1
 },
 "hourglass": {
  "t": 3,
  "ico": "potion:Y",
  "m": {
   "spd": 0.25
  },
  "u": 1
 },
 "dragonheart": {
  "t": 3,
  "ico": "gem:R",
  "m": {
   "xtag_fire": 0.25,
   "burn": 1
  },
  "u": 1
 },
 "shard": {
  "t": 3,
  "ico": "gem:P",
  "m": {
   "xdmg": 0.35,
   "enemySpd": 0.1
  },
  "u": 1
 },
 "box": {
  "t": 3,
  "ico": "book:s",
  "m": {
   "xtag_mech": 0.25,
   "startCharge": 0.3
  },
  "u": 1
 },
 "venom": {
  "t": 3,
  "ico": "claw:l",
  "m": {
   "xtag_blade": 0.25,
   "crit": 0.1
  },
  "u": 1
 },
 "dogtag": {
  "t": 0,
  "ico": "badge:g",
  "hero": "ayla",
  "m": {
   "tag_blade": 0.1,
   "wall": 3
  }
 },
 "oathbook": {
  "t": 1,
  "ico": "book:N",
  "hero": "ayla",
  "m": {
   "shieldStart": 6,
   "regen": 2
  }
 },
 "aflask": {
  "t": 1,
  "ico": "potion:s",
  "hero": "ayla",
  "m": {
   "spd": 0.08,
   "crit": 0.03
  }
 },
 "whistle": {
  "t": 2,
  "ico": "claw:Y",
  "hero": "ayla",
  "m": {
   "left": 0.3,
   "right": 0.3
  }
 },
 "oldflag": {
  "t": 3,
  "ico": "scroll:b",
  "u": 1,
  "hero": "ayla",
  "m": {
   "xdmg": 0.12,
   "tag_mech": 0.2,
   "wall": 6
  }
 },
 "stone": {
  "t": 2,
  "ico": "gem:R",
  "hero": "mo",
  "m": {
   "burn": 0.5,
   "slow": 0.3,
   "chain": 1
  }
 },
 "expired": {
  "t": 0,
  "ico": "potion:l",
  "hero": "mo",
  "m": {
   "dmg": 0.12,
   "enemySpd": 0.03
  }
 },
 "goggles": {
  "t": 0,
  "ico": "orb:c",
  "hero": "mo",
  "m": {
   "crit": 0.04,
   "aoe": 0.1
  }
 },
 "notes": {
  "t": 1,
  "ico": "book:P",
  "hero": "mo",
  "m": {
   "tag_volt": 0.15,
   "tag_ice": 0.15
  }
 },
 "catalyst": {
  "t": 3,
  "ico": "potion:o",
  "u": 1,
  "hero": "mo",
  "m": {
   "spd": 0.2,
   "burn": 0.5
  }
 },
 "pocketwatch": {
  "t": 1,
  "ico": "orb:y",
  "hero": "ying",
  "m": {
   "spd": 0.08,
   "startCharge": 0.1
  }
 },
 "jarflies": {
  "t": 0,
  "ico": "potion:l",
  "hero": "ying",
  "m": {
   "s1": 0.15
  }
 },
 "earring": {
  "t": 0,
  "ico": "ring:y",
  "hero": "ying",
  "m": {
   "tag_mech": 0.1,
   "crit": 0.02
  }
 },
 "oilcan": {
  "t": 2,
  "ico": "potion:N",
  "hero": "ying",
  "m": {
   "s1": 0.2,
   "spd": 0.06
  }
 },
 "lampbook": {
  "t": 3,
  "ico": "book:y",
  "u": 1,
  "hero": "ying",
  "m": {
   "xdmg": 0.12,
   "s1": 0.3
  }
 },
 "kindling": {
  "t": 0,
  "ico": "orb:o",
  "m": {
   "t_kindling": 1
  }
 },
 "icechain": {
  "t": 0,
  "ico": "ring:C",
  "m": {
   "t_icechain": 1
  }
 },
 "magazine": {
  "t": 0,
  "ico": "book:g",
  "m": {
   "ammo": 1
  }
 },
 "chaingear": {
  "t": 1,
  "ico": "ring:y",
  "m": {
   "t_chain": 1
  }
 },
 "lootbag": {
  "t": 1,
  "ico": "book:N",
  "m": {
   "t_loot": 1
  }
 },
 "alchbook": {
  "t": 1,
  "ico": "book:P",
  "m": {
   "t_alch": 1
  }
 },
 "photo": {
  "t": 1,
  "ico": "scroll:y",
  "m": {
   "t_photo": 1
  },
  "u": 1
 },
 "thunderdrum": {
  "t": 2,
  "ico": "orb:Y",
  "m": {
   "t_drum": 1
  }
 },
 "tyrantnail": {
  "t": 2,
  "ico": "claw:R",
  "m": {
   "t_nail": 1
  }
 },
 "treasuremap": {
  "t": 3,
  "ico": "scroll:N",
  "m": {
   "t_map": 1
  },
  "u": 1
 },
 "scabbard": {
  "t": 1,
  "ico": "claw:w",
  "fit": 1,
  "m": {
   "t_splash": 1
  }
 },
 "chant": {
  "t": 1,
  "ico": "scroll:w",
  "fit": 1,
  "m": {
   "kspd_weapon": 0.15
  }
 },
 "groove": {
  "t": 2,
  "ico": "claw:R",
  "fit": 1,
  "m": {
   "t_groove": 1
  }
 },
 "grit": {
  "t": 1,
  "ico": "potion:w",
  "fit": 1,
  "m": {
   "t_growspd": 1
  }
 },
 "bellows": {
  "t": 1,
  "ico": "boot:o",
  "fit": 1,
  "m": {
   "t_ember": 1
  }
 },
 "rat": {
  "t": 1,
  "ico": "shroom:l",
  "fit": 1,
  "m": {
   "t_plague": 1
  }
 },
 "coil": {
  "t": 1,
  "ico": "ring:Y",
  "fit": 1,
  "m": {
   "tspd_volt": 0.15
  }
 },
 "frostlens": {
  "t": 1,
  "ico": "gem:C",
  "fit": 1,
  "m": {
   "t_frostlens": 1
  }
 },
 "loader": {
  "t": 1,
  "ico": "badge:N",
  "fit": 1,
  "m": {
   "ammoSpd": 0.2
  }
 },
 "pulley": {
  "t": 1,
  "ico": "ring:N",
  "fit": 1,
  "m": {
   "s3spd": 0.15
  }
 },
 "lampfair": {
  "t": 1,
  "ico": "orb:y",
  "fit": 1,
  "m": {
   "kspd_lamp": 0.15
  }
 },
 "fusebox": {
  "t": 1,
  "ico": "book:o",
  "fit": 1,
  "m": {
   "kspd_firearm": 0.15
  }
 },
 "mletter": {
  "t": 2,
  "u": 1,
  "ico": "scroll:y",
  "hero": "ying",
  "fit": 1,
  "m": {
   "s1": 0.12,
   "startCharge": 0.15
  }
 },
 "blueprint": {
  "t": 0,
  "ico": "scroll:N",
  "hero": "jun",
  "m": {
   "shieldStart": 5,
   "wall": 3
  }
 },
 "plumb": {
  "t": 1,
  "ico": "claw:N",
  "hero": "jun",
  "m": {
   "tag_mech": 0.15,
   "s2": 0.12
  }
 },
 "mortarboard": {
  "t": 2,
  "ico": "book:N",
  "hero": "jun",
  "m": {
   "aoe": 0.2,
   "startCharge": 0.15
  }
 },
 "citadel": {
  "t": 3,
  "ico": "badge:N",
  "u": 1,
  "hero": "jun",
  "m": {
   "xdmg": 0.15,
   "wall": 10
  }
 },
 "telescope": {
  "t": 0,
  "ico": "orb:c",
  "hero": "li",
  "m": {
   "crit": 0.06
  }
 },
 "starchart": {
  "t": 1,
  "ico": "scroll:c",
  "hero": "li",
  "m": {
   "tag_volt": 0.12,
   "tag_ice": 0.12
  }
 },
 "compass": {
  "t": 2,
  "ico": "ring:c",
  "hero": "li",
  "m": {
   "startCharge": 0.2,
   "critDmg": 0.4
  }
 },
 "polaris": {
  "t": 3,
  "ico": "gem:c",
  "u": 1,
  "hero": "li",
  "m": {
   "xcarry": 0.3
  }
 },
 "gem_red": {
  "t": 3,
  "ico": "gem:R",
  "u": 1,
  "gem": "red",
  "m": {
   "xdmg": 0.12,
   "wall": -6
  }
 },
 "gem_blue": {
  "t": 3,
  "ico": "gem:c",
  "u": 1,
  "gem": "blue",
  "m": {
   "startCharge": 0.3,
   "chain": 1,
   "tax": 1
  }
 },
 "gem_green": {
  "t": 3,
  "ico": "gem:G",
  "u": 1,
  "gem": "green",
  "m": {
   "regen": 3,
   "shieldStart": 4,
   "enemySpd": 0.05
  }
 }
} as unknown as Record<string, RelicDef>;
