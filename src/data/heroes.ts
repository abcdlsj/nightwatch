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
     "brand",
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
   "gold": -3,
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
     "oilspill",
     0
    ],
    [
     "paperkite",
     1
    ]
   ],
   "path": "lamp"
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
 ]
} as unknown as Record<string, KitDef[]>;

/** 人物解锁顺序：用前一个人物守到黎明一次，解锁下一个 */
export const HERO_ORDER = ['ayla', 'mo', 'ying'];

/** 专属卡分流派：第一个一开始就有，后面的按这个人物的熟练等级解锁（mast 是需要的等级） */
export interface PathDef {
  id: string;
  mast: number;
  cards: string[];
  n: string;
  d: string;
}
export const PATHS: Record<string, PathDef[]> = {
  ayla: [
    { id: 'blade', mast: 0, cards: ['oathsword', 'cleaver', 'arrowrain', 'greatsword', 'executioner', 'vetblade', 'javelin', 'ballista', 'whetstone', 'bloodrage', 'nightsword'], n: '', d: '' },
    { id: 'oil', mast: 1, cards: ['oilflask', 'firebrand', 'detonate', 'emberblade', 'brand', 'flamethrower', 'phoenix', 'cinder', 'oilpit', 'oiltrap'], n: '', d: '' },
    { id: 'drill', mast: 2, cards: ['warhorn', 'rally', 'wardrum', 'flagpole'], n: '', d: '' },
  ],
  mo: [
    { id: 'elem', mast: 0, cards: ['vial', 'prism', 'starfall', 'frostvial', 'icebomb', 'condenser', 'crucible', 'sunflare', 'jars'], n: '', d: '' },
    { id: 'poison', mast: 1, cards: ['acidvial', 'plague', 'putrefy', 'needle', 'snakekiss', 'acidrain', 'plagueburst', 'concentrate', 'miasma', 'quicklime', 'midas', 'supersat', 'sagedrop'], n: '', d: '' },
    { id: 'storm', mast: 2, cards: ['arcbottle', 'stormflask', 'resonate', 'shockvenom'], n: '', d: '' },
  ],
  ying: [
    { id: 'lamp', mast: 0, cards: ['firefly', 'oilspill', 'fuse', 'dragonlantern', 'paperlamp', 'paperkite', 'lamplight', 'beacon', 'oilpot', 'moth', 'skylantern', 'marquee', 'lamps', 'ffjar'], n: '', d: '' },
    { id: 'gear', mast: 1, cards: ['musicbox', 'pendulum', 'gear', 'windup', 'clockwork', 'mainspring', 'toolbox', 'wickcut', 'pocketwatch'], n: '', d: '' },
    { id: 'cracker', mast: 2, cards: ['firecracker', 'crackers'], n: '', d: '' },
  ],
};
