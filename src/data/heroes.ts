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


/** 天性：每个守夜人一条一直生效的规矩，决定这个人物怎么构筑（文字在语言包 heroes.*.sig） / Nature: one always-on rule per watcher that shapes how they build (text in locale heroes.*.sig)
 *  ayla 老规矩：卡在同一格连着守几夜，伤害一夜比一夜高 / old habits: a card held on the same slot night after night hits harder each night
 *  mo   调和：元素反应更狠，打出反应的卡顺手充能 / attunement: stronger reactions, and the reacting card gets charge
 *  ying 满堂灯火：小卡越多，小卡越快 / a hall full of lamps: the more small cards, the faster they all go
 *  jun  以墙为本：城墙上限越高伤害越高；墙完好两夜就攒满 / the wall comes first: higher max wall means more damage; two intact nights fill the mason
 *  li   众星拱月：C 位两边的卡出手，给 C 位充能 / stars around the moon: cards beside the carry charge it when they fire */
export const SIGS: Record<string, Record<string, number>> = {
  ayla: { vet: 0.06, vetCap: 6 },
  mo: { rx: 0.4, rxCharge: 0.1 },
  ying: { smallHaste: 0.03 },
  jun: { wallDmg: 0.03, intactFast: 1 },
  li: { carryNb: 0.05 },
};

/** 觉醒：第 6 夜备战开头二选一，把天性往两个方向推（文字在语言包 heroes.awaken） / Awakening: a pick of two at the start of night 6's prep, pushing the nature in one of two directions (text in locale heroes.awaken) */
export const AWAKEN: Record<string, { id: string; m: Record<string, number> }[]> = {
  ayla: [
    { id: 'ayla_a', m: { vetCap: 6 } },
    { id: 'ayla_b', m: { vetCd: 0.04 } },
  ],
  mo: [
    { id: 'mo_a', m: { rxCharge: 0.15 } },
    { id: 'mo_b', m: { rxQuick: 1 } },
  ],
  ying: [
    { id: 'ying_a', m: { smallHaste: 0.02 } },
    { id: 'ying_b', m: { smallDmg: 0.05 } },
  ],
  jun: [
    { id: 'jun_a', m: { wallDmg: 0.03 } },
    { id: 'jun_b', m: { intactWall: 3 } },
  ],
  li: [
    { id: 'li_a', m: { carryNb: 0.05 } },
    { id: 'li_b', m: { carryGrow: 0.08 } },
  ],
};
export const AWAKEN_NIGHT = 6;
