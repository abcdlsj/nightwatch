/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
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
 },
 "jun": {
  "col": "#c99a6b",
  "portrait": "p_jun",
  "wall": 34,
  "gold": 8,
  "start": [
   [
    "turret",
    0,
    3
   ],
   [
    "scaffold",
    0,
    5
   ]
  ]
 },
 "li": {
  "col": "#8fd3ff",
  "portrait": "p_li",
  "wall": 26,
  "gold": 11,
  "start": [
   [
    "starseed",
    0,
    3
   ],
   [
    "astrolabe",
    0,
    4
   ]
  ]
 }
} as unknown as Record<string, HeroDef>;

/** 起手三选一：每人四套，第一套固定出现 / opening choice of three: four sets per hero; the first always appears */
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
   ],
   "path": "blade"
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
     "cinder",
     0
    ]
   ],
   "path": "oil"
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
   ],
   "path": "blade"
  },
  {
   "cards": [
    [
     "pike",
     0
    ],
    [
     "warhorn",
     1
    ],
    [
     "dagger",
     0
    ]
   ],
   "path": "drill"
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
   ],
   "path": "elem"
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
   ],
   "path": "poison"
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
   "gold": -4,
   "path": "storm"
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
   ],
   "path": "elem"
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
   ],
   "path": "lamp"
  },
  {
   "cards": [
    [
     "firecracker",
     0
    ],
    [
     "matchbox",
     0
    ],
    [
     "crackers",
     0
    ]
   ],
   "path": "cracker"
  },
  {
   "cards": [
    [
     "oilspill",
     1
    ],
    [
     "lamps",
     0
    ]
   ],
   "path": "lamp"
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
   "gold": -3,
   "path": "gear"
  }
 ],
 "jun": [
  {
   "cards": [
    [
     "scaffold",
     0
    ],
    [
     "turret",
     0
    ]
   ],
   "path": "turret"
  },
  {
   "cards": [
    [
     "turret",
     0
    ],
    [
     "scaffold",
     0
    ],
    [
     "caltrop",
     0
    ]
   ],
   "path": "turret",
   "gold": -3
  },
  {
   "cards": [
    [
     "palisade",
     0
    ],
    [
     "caltrop",
     0
    ],
    [
     "watchtower",
     1
    ]
   ],
   "path": "works",
   "gold": -2
  },
  {
   "cards": [
    [
     "powderkeg",
     0
    ],
    [
     "powderkeg",
     0
    ],
    [
     "dagger",
     0
    ]
   ],
   "path": "line"
  }
 ],
 "li": [
  {
   "cards": [
    [
     "starseed",
     0
    ],
    [
     "astrolabe",
     0
    ]
   ],
   "path": "chart"
  },
  {
   "cards": [
    [
     "astrolabe",
     0
    ],
    [
     "comet",
     1
    ]
   ],
   "path": "chart",
   "gold": -4
  },
  {
   "cards": [
    [
     "frostar",
     0
    ],
    [
     "starseed",
     0
    ]
   ],
   "path": "frost"
  },
  {
   "cards": [
    [
     "stardust",
     0
    ],
    [
     "pulsar",
     1
    ]
   ],
   "path": "meteor",
   "gold": -3
  }
 ]
} as unknown as Record<string, KitDef[]>;

/** 人物解锁顺序：用前一个人物守到黎明一次，解锁下一个 / hero unlock order: reach dawn once with the previous hero to unlock the next */
export const HERO_ORDER = ['ayla', 'mo', 'ying', 'jun', 'li'];

/** 专属卡分流派：第一个一开始就有，后面的按这个人物的熟练等级解锁（mast 是需要的等级） / exclusive cards split by archetype: the first is available from the start, the rest unlock by this hero's mastery level (mast is the required level) */
export interface PathDef {
  id: string;
  mast: number;
  cards: string[];
  n: string;
  d: string;
}
export const PATHS: Record<string, PathDef[]> = {
  ayla: [
    { id: 'blade', mast: 0, cards: ['oathsword', 'cleaver', 'arrowrain', 'greatsword', 'executioner', 'vetblade', 'javelin', 'ballista', 'whetstone', 'bloodrage', 'nightsword', 'axe', 'headxbow', 'armorer', 'honeblade'], n: '', d: '' },
    { id: 'oil', mast: 1, cards: ['oilflask', 'firebrand', 'detonate', 'emberblade', 'flamethrower', 'phoenix', 'cinder', 'oilpit', 'oiltrap', 'sparkwick'], n: '', d: '' },
    { id: 'drill', mast: 2, cards: ['warhorn', 'rally', 'wardrum', 'flagpole', 'banner', 'shieldwall', 'pike'], n: '', d: '' },
  ],
  mo: [
    { id: 'elem', mast: 0, cards: ['vial', 'prism', 'starfall', 'frostvial', 'icebomb', 'condenser', 'crucible', 'sunflare', 'jars', 'frost', 'rime', 'dualflask'], n: '', d: '' },
    { id: 'poison', mast: 1, cards: ['acidvial', 'plague', 'putrefy', 'needle', 'snakekiss', 'acidrain', 'plagueburst', 'concentrate', 'miasma', 'quicklime', 'midas', 'supersat', 'sagedrop', 'smokebomb'], n: '', d: '' },
    { id: 'storm', mast: 2, cards: ['arcbottle', 'stormflask', 'resonate', 'shockvenom', 'tesla', 'thunder', 'netcoil', 'appwand', 'thunderking'], n: '', d: '' },
  ],
  ying: [
    { id: 'lamp', mast: 0, cards: ['firefly', 'oilspill', 'fuse', 'dragonlantern', 'paperkite', 'lamplight', 'beacon', 'oilpot', 'moth', 'skylantern', 'marquee', 'lamps', 'ffjar'], n: '', d: '' },
    { id: 'gear', mast: 1, cards: ['musicbox', 'pendulum', 'gear', 'windup', 'clockwork', 'mainspring', 'toolbox', 'wickcut', 'pocketwatch', 'clock'], n: '', d: '' },
    { id: 'cracker', mast: 2, cards: ['firecracker', 'crackers', 'rocket', 'fireworks', 'matchbox', 'stall', 'volley'], n: '', d: '' },
  ],
  jun: [
    { id: 'turret', mast: 0, cards: ['turret', 'scaffold', 'bigcannon', 'mortar', 'shellman', 'gunner', 'grapeshot', 'bombard', 'cannon', 'tent', 'kiln', 'crenel'], n: '', d: '' },
    { id: 'works', mast: 1, cards: ['palisade', 'caltrop', 'watchtower', 'bastion', 'moat', 'spikewall', 'mason', 'sling', 'alarmbell'], n: '', d: '' },
    { id: 'line', mast: 2, cards: ['powderkeg', 'crossbows', 'cogline', 'beehive', 'beacontower', 'trebuchet'], n: '', d: '' },
  ],
  li: [
    { id: 'chart', mast: 0, cards: ['astrolabe', 'lens', 'comet', 'starseed', 'orrery', 'spyglass', 'wishstar', 'chartpage', 'sirius', 'moondial'], n: '', d: '' },
    { id: 'frost', mast: 1, cards: ['frostar', 'glacier', 'rimelance', 'northstar', 'rimeglass', 'aurora', 'icemoon', 'frostseal', 'avalanche'], n: '', d: '' },
    { id: 'meteor', mast: 2, cards: ['stardust', 'starfire', 'pulsar', 'fallstar', 'galaxy', 'nova'], n: '', d: '' },
  ],
};

