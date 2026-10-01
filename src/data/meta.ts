/* 从旧版数据迁移而来，直接在这里改 */
import type { Tag } from './types';

/** 成就：w=1 表示守到黎明时结算 */
export const ACH: { id: string; w?: number; n: string; d: string }[] = [
 {
  "id": "dawn",
  "w": 1
 },
 {
  "id": "solo",
  "w": 1
 },
 {
  "id": "fullwall",
  "w": 1
 },
 {
  "id": "norelic",
  "w": 1
 },
 {
  "id": "notalent",
  "w": 1
 },
 {
  "id": "nobrick",
  "w": 1
 },
 {
  "id": "h_ayla",
  "w": 1
 },
 {
  "id": "h_mo",
  "w": 1
 },
 {
  "id": "h_ying",
  "w": 1
 },
 {
  "id": "frost",
  "w": 1
 },
 {
  "id": "bothsets",
  "w": 1
 },
 {
  "id": "pure",
  "w": 1
 },
 {
  "id": "smalls",
  "w": 1
 },
 {
  "id": "giants",
  "w": 1
 },
 {
  "id": "gambler",
  "w": 1
 },
 {
  "id": "heat1",
  "w": 1
 },
 {
  "id": "heat4",
  "w": 1
 },
 {
  "id": "heat8",
  "w": 1
 },
 {
  "id": "chain8"
 },
 {
  "id": "chain11"
 },
 {
  "id": "hit1k"
 },
 {
  "id": "hit10k"
 },
 {
  "id": "combo50"
 },
 {
  "id": "combo120"
 },
 {
  "id": "kills150"
 },
 {
  "id": "dia"
 },
 {
  "id": "dia3"
 },
 {
  "id": "syn4"
 },
 {
  "id": "syn6"
 },
 {
  "id": "rich"
 },
 {
  "id": "quickeye"
 },
 {
  "id": "end2"
 },
 {
  "id": "end5"
 },
 {
  "id": "brood",
  "w": 1
 },
 {
  "id": "bell701"
 }
] as never;

/** 长夜难度档数（0 是正常难度） */
export const HEAT_MAX = 8;

/** 加码：给今晚加难度换奖励 */
export const WAGERS: Record<string, { gold?: number; relic?: number; up?: number; heal?: number; n: string; d: string; r: string }> = {
 "horde": {
  "gold": 6
 },
 "iron": {
  "relic": 1
 },
 "rush": {
  "up": 1
 },
 "brittle": {
  "gold": 5,
  "heal": 5
 },
 "dark": {
  "gold": 4
 }
} as never;

/** 羁绊：同元素凑够张数 → 修正项 */
export const SYN: Record<Tag, [number, Record<string, number>][]> = {
 "blade": [
  [
   2,
   {
    "crit": 0.08
   }
  ],
  [
   4,
   {
    "crit": 0.12,
    "critDmg": 0.5
   }
  ],
  [
   6,
   {
    "tag_blade": 0.4
   }
  ]
 ],
 "fire": [
  [
   2,
   {
    "burn": 0.3
   }
  ],
  [
   4,
   {
    "burn": 0.5,
    "aoe": 0.25
   }
  ],
  [
   6,
   {
    "tag_fire": 0.4
   }
  ]
 ],
 "ice": [
  [
   2,
   {
    "slow": 0.15
   }
  ],
  [
   4,
   {
    "slowVuln": 0.3
   }
  ],
  [
   6,
   {
    "tag_ice": 0.4
   }
  ]
 ],
 "volt": [
  [
   2,
   {
    "chain": 1
   }
  ],
  [
   4,
   {
    "chain": 1,
    "tag_volt": 0.2
   }
  ],
  [
   6,
   {
    "tag_volt": 0.4
   }
  ]
 ],
 "mech": [
  [
   2,
   {
    "tag_mech": 0.15
   }
  ],
  [
   4,
   {
    "startCharge": 0.2
   }
  ],
  [
   6,
   {
    "spd": 0.15
   }
  ]
 ],
 "poison": [
  [
   2,
   {
    "poison": 0.3
   }
  ],
  [
   4,
   {
    "poison": 0.6
   }
  ],
  [
   6,
   {
    "tag_poison": 0.5
   }
  ]
 ]
} as never;

/** 熟练：各级所需点数 */
export const MAST_LV = [
 5,
 15,
 30,
 50
];

export const HIST_MAX = 40;
export const SECRET_N = 5;
export const FIT_CHANCE = 0.4;
