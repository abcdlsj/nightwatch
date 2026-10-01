/* 从旧版数据迁移而来，直接在这里改 */
import type { HeroDef, KitDef } from './types';

export const HEROES: Record<string, HeroDef> = {
 "ayla": {
  "col": "#f0a64b",
  "portrait": "p_ayla",
  "wall": 30,
  "gold": 8,
  "start": [
   [
    "dagger",
    0,
    3
   ],
   [
    "oathsword",
    1,
    4
   ]
  ]
 },
 "mo": {
  "col": "#b08cff",
  "portrait": "p_mo",
  "wall": 22,
  "gold": 12,
  "start": [
   [
    "vial",
    0,
    3
   ],
   [
    "icicle",
    0,
    4
   ]
  ]
 },
 "ying": {
  "col": "#ffd166",
  "portrait": "p_ying",
  "wall": 26,
  "gold": 10,
  "start": [
   [
    "firefly",
    0,
    3
   ],
   [
    "clock",
    1,
    4
   ]
  ]
 }
} as unknown as Record<string, HeroDef>;

/** 起手三选一：每人四套，第一套固定出现 */
export const KITS: Record<string, KitDef[]> = {
 "ayla": [
  {
   "cards": [
    [
     "dagger",
     0
    ],
    [
     "oathsword",
     1
    ]
   ]
  },
  {
   "cards": [
    [
     "emberblade",
     1
    ],
    [
     "oilflask",
     0
    ],
    [
     "brand",
     0
    ]
   ]
  },
  {
   "cards": [
    [
     "javelin",
     1
    ],
    [
     "armorer",
     1
    ],
    [
     "dagger",
     1
    ]
   ]
  },
  {
   "cards": [
    [
     "dagger",
     0
    ],
    [
     "vetblade",
     1
    ],
    [
     "rally",
     1
    ]
   ],
   "gold": -3
  }
 ],
 "mo": [
  {
   "cards": [
    [
     "vial",
     0
    ],
    [
     "icicle",
     0
    ]
   ]
  },
  {
   "cards": [
    [
     "needle",
     1
    ],
    [
     "acidvial",
     0
    ]
   ]
  },
  {
   "cards": [
    [
     "arcbottle",
     0
    ],
    [
     "appwand",
     0
    ]
   ],
   "gold": -4
  },
  {
   "cards": [
    [
     "frostvial",
     0
    ],
    [
     "condenser",
     0
    ],
    [
     "vial",
     0
    ]
   ]
  }
 ],
 "ying": [
  {
   "cards": [
    [
     "firefly",
     0
    ],
    [
     "clock",
     1
    ]
   ]
  },
  {
   "cards": [
    [
     "oilspill",
     0
    ],
    [
     "paperkite",
     1
    ]
   ]
  },
  {
   "cards": [
    [
     "paperlamp",
     1
    ],
    [
     "lamps",
     0
    ]
   ]
  },
  {
   "cards": [
    [
     "gear",
     1
    ],
    [
     "windup",
     1
    ]
   ],
   "gold": -3
  }
 ]
} as unknown as Record<string, KitDef[]>;
