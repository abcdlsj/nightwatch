/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
import type { TalentDef } from './types';

export const TALENTS: Record<string, TalentDef> = {
 "quick": {
  "cat": "atk",
  "r": 0,
  "m": {
   "spd": 0.08
  }
 },
 "sharp": {
  "cat": "atk",
  "r": 0,
  "m": {
   "crit": 0.06
  }
 },
 "heavy": {
  "cat": "atk",
  "r": 1,
  "m": {
   "critDmg": 0.5
  }
 },
 "vanguard": {
  "cat": "atk",
  "r": 0,
  "m": {
   "left": 0.35
  }
 },
 "rearguard": {
  "cat": "atk",
  "r": 0,
  "m": {
   "right": 0.35
  }
 },
 "loner": {
  "cat": "atk",
  "r": 1,
  "m": {
   "lonely": 0.35
  }
 },
 "opener": {
  "cat": "atk",
  "r": 1,
  "m": {
   "t_opener": 1
  }
 },
 "bloodlust": {
  "cat": "atk",
  "r": 2,
  "m": {
   "t_bloodlust": 1
  }
 },
 "tough": {
  "cat": "def",
  "r": 0,
  "m": {
   "wall": 6
  }
 },
 "bulwark": {
  "cat": "def",
  "r": 0,
  "m": {
   "shieldStart": 7
  }
 },
 "mender": {
  "cat": "def",
  "r": 1,
  "m": {
   "regen": 4
  }
 },
 "revenge": {
  "cat": "def",
  "r": 1,
  "m": {
   "t_revenge": 1
  }
 },
 "laststand": {
  "cat": "def",
  "r": 2,
  "m": {
   "t_last": 1
  }
 },
 "early": {
  "cat": "tech",
  "r": 0,
  "m": {
   "startCharge": 0.2
  }
 },
 "pierce": {
  "cat": "tech",
  "r": 1,
  "m": {
   "pen": 2
  }
 },
 "crowd": {
  "cat": "tech",
  "r": 1,
  "m": {
   "full": 0.2
  }
 },
 "echoer": {
  "cat": "tech",
  "r": 2,
  "m": {
   "t_echo": 1,
   "chain": 1
  }
 },
 "thrift": {
  "cat": "eco",
  "r": 0,
  "m": {
   "interest": 3
  }
 },
 "wage": {
  "cat": "eco",
  "r": 0,
  "m": {
   "winGold": 2
  }
 },
 "loot": {
  "cat": "eco",
  "r": 1,
  "m": {
   "killGold": 0.05
  }
 },
 "ayla_00": {
  "cat": "def",
  "r": 0,
  "m": {
   "wall": 6
  },
  "hero": "ayla"
 },
 "ayla_01": {
  "cat": "def",
  "r": 1,
  "m": {
   "shieldStart": 6
  },
  "hero": "ayla"
 },
 "ayla_02": {
  "cat": "def",
  "r": 2,
  "m": {
   "regen": 4,
   "wall": 6
  },
  "hero": "ayla"
 },
 "ayla_10": {
  "cat": "atk",
  "r": 0,
  "m": {
   "tag_blade": 0.2
  },
  "hero": "ayla"
 },
 "ayla_11": {
  "cat": "atk",
  "r": 1,
  "m": {
   "pen": 3
  },
  "hero": "ayla"
 },
 "ayla_12": {
  "cat": "atk",
  "r": 2,
  "m": {
   "crit": 0.13,
   "critDmg": 0.65
  },
  "hero": "ayla"
 },
 "ayla_20": {
  "cat": "tech",
  "r": 0,
  "m": {
   "tag_mech": 0.2
  },
  "hero": "ayla"
 },
 "ayla_21": {
  "cat": "tech",
  "r": 1,
  "m": {
   "startCharge": 0.33
  },
  "hero": "ayla"
 },
 "ayla_22": {
  "cat": "tech",
  "r": 2,
  "m": {
   "spd": 0.16,
   "full": 0.26
  },
  "hero": "ayla"
 },
 "mo_00": {
  "cat": "atk",
  "r": 0,
  "m": {
   "burn": 0.52
  },
  "hero": "mo"
 },
 "mo_01": {
  "cat": "atk",
  "r": 1,
  "m": {
   "aoe": 0.33
  },
  "hero": "mo"
 },
 "mo_02": {
  "cat": "atk",
  "r": 2,
  "m": {
   "tag_fire": 0.39,
   "burn": 0.78
  },
  "hero": "mo"
 },
 "mo_10": {
  "cat": "def",
  "r": 0,
  "m": {
   "slow": 0.33
  },
  "hero": "mo"
 },
 "mo_11": {
  "cat": "def",
  "r": 1,
  "m": {
   "slowVuln": 0.33
  },
  "hero": "mo"
 },
 "mo_12": {
  "cat": "def",
  "r": 2,
  "m": {
   "tag_ice": 0.39,
   "enemySpd": -0.08
  },
  "hero": "mo"
 },
 "mo_20": {
  "cat": "tech",
  "r": 0,
  "m": {
   "chain": 1
  },
  "hero": "mo"
 },
 "mo_21": {
  "cat": "tech",
  "r": 1,
  "m": {
   "tag_volt": 0.26
  },
  "hero": "mo"
 },
 "mo_22": {
  "cat": "tech",
  "r": 2,
  "m": {
   "spd": 0.13,
   "chain": 2
  },
  "hero": "mo"
 },
 "ying_00": {
  "cat": "atk",
  "r": 0,
  "m": {
   "s1": 0.2
  },
  "hero": "ying"
 },
 "ying_01": {
  "cat": "atk",
  "r": 1,
  "m": {
   "left": 0.26,
   "right": 0.26
  },
  "hero": "ying"
 },
 "ying_02": {
  "cat": "atk",
  "r": 2,
  "m": {
   "s1": 0.39,
   "full": 0.26
  },
  "hero": "ying"
 },
 "ying_10": {
  "cat": "tech",
  "r": 0,
  "m": {
   "startCharge": 0.26
  },
  "hero": "ying"
 },
 "ying_11": {
  "cat": "tech",
  "r": 1,
  "m": {
   "spd": 0.13
  },
  "hero": "ying"
 },
 "ying_12": {
  "cat": "tech",
  "r": 2,
  "m": {
   "tag_mech": 0.33,
   "spd": 0.07
  },
  "hero": "ying"
 },
 "ying_20": {
  "cat": "atk",
  "r": 0,
  "m": {
   "crit": 0.08
  },
  "hero": "ying"
 },
 "ying_21": {
  "cat": "atk",
  "r": 1,
  "m": {
   "critDmg": 0.78
  },
  "hero": "ying"
 },
 "ying_22": {
  "cat": "atk",
  "r": 2,
  "m": {
   "dmg": 0.2,
   "crit": 0.08
  },
  "hero": "ying"
 },
 "f_sweep": {
  "cat": "atk",
  "r": 1,
  "fit": 1,
  "m": {
   "t_sweep": 1
  }
 },
 "f_hone": {
  "cat": "atk",
  "r": 1,
  "fit": 1,
  "m": {
   "growSpd": 0.2
  }
 },
 "f_quick": {
  "cat": "tech",
  "r": 0,
  "fit": 1,
  "m": {
   "kspd_weapon": 0.08,
   "ammoSpd": 0.1
  }
 },
 "jun_00": {
  "cat": "def",
  "r": 0,
  "m": {
   "wall": 8
  },
  "hero": "jun"
 },
 "jun_01": {
  "cat": "def",
  "r": 1,
  "m": {
   "shieldStart": 8
  },
  "hero": "jun"
 },
 "jun_02": {
  "cat": "def",
  "r": 2,
  "m": {
   "regen": 5,
   "wall": 8
  },
  "hero": "jun"
 },
 "jun_10": {
  "cat": "atk",
  "r": 0,
  "m": {
   "tag_mech": 0.2
  },
  "hero": "jun"
 },
 "jun_11": {
  "cat": "atk",
  "r": 1,
  "m": {
   "aoe": 0.3
  },
  "hero": "jun"
 },
 "jun_12": {
  "cat": "atk",
  "r": 2,
  "m": {
   "s3": 0.35,
   "s2": 0.2
  },
  "hero": "jun"
 },
 "jun_20": {
  "cat": "tech",
  "r": 0,
  "m": {
   "startCharge": 0.25
  },
  "hero": "jun"
 },
 "jun_21": {
  "cat": "tech",
  "r": 1,
  "m": {
   "spd": 0.12
  },
  "hero": "jun"
 },
 "jun_22": {
  "cat": "tech",
  "r": 2,
  "m": {
   "full": 0.3
  },
  "hero": "jun"
 },
 "li_00": {
  "cat": "tech",
  "r": 0,
  "m": {
   "xcarry": 0.1
  },
  "hero": "li"
 },
 "li_01": {
  "cat": "tech",
  "r": 1,
  "m": {
   "startCharge": 0.25
  },
  "hero": "li"
 },
 "li_02": {
  "cat": "tech",
  "r": 2,
  "m": {
   "xcarry": 0.2
  },
  "hero": "li"
 },
 "li_10": {
  "cat": "atk",
  "r": 0,
  "m": {
   "tag_ice": 0.2
  },
  "hero": "li"
 },
 "li_11": {
  "cat": "atk",
  "r": 1,
  "m": {
   "slowVuln": 0.3
  },
  "hero": "li"
 },
 "li_12": {
  "cat": "atk",
  "r": 2,
  "m": {
   "tag_ice": 0.35,
   "slow": 0.3
  },
  "hero": "li"
 },
 "li_20": {
  "cat": "atk",
  "r": 0,
  "m": {
   "crit": 0.08
  },
  "hero": "li"
 },
 "li_21": {
  "cat": "atk",
  "r": 1,
  "m": {
   "critDmg": 0.6
  },
  "hero": "li"
 },
 "li_22": {
  "cat": "atk",
  "r": 2,
  "m": {
   "tag_volt": 0.3,
   "chain": 1
  },
  "hero": "li"
 }
} as unknown as Record<string, TalentDef>;

/** 天赋类别：颜色和图标 / talent categories: color and icon */
export const TCAT: Record<string, { c: string; ico: string; n: string }> = {
 "atk": {
  "c": "#ff8a5b",
  "ico": "claw:R"
 },
 "def": {
  "c": "#9fc4e0",
  "ico": "badge:c"
 },
 "tech": {
  "c": "#ffd166",
  "ico": "ring:y"
 },
 "eco": {
  "c": "#7ee8a2",
  "ico": "r_purse"
 }
} as never;
