/* 一局游戏的状态。规则层只读写这里，不碰 DOM；界面层通过 ui/* 渲染它 */
import type { Tag } from '../data/types';

export type Zone = 'board' | 'stash' | 'temp' | null;

export interface Card {
  id: number;
  key: string;
  tier: number;
  adj: string | null;
  size: number;
  loc: Zone;
  idx: number;
  /** 珍藏词缀攒下的售价 */
  hoard: number;
  /** 成长：永久加的基础伤害 */
  grow: number;
  /** 任务进度 */
  qp: number;
  /** C 位：这局的主力，自带独立乘区（同一时间只有一张） */
  carry?: boolean;
  /** 星辉：璃的跃迁事件给 C 位叠的层数，每层再乘一截 */
  star?: number;
  /** 卡面闪光动画的错开延迟（纯表现） */
  dl: string | number;
  /* ---- 战斗中 ---- */
  charge: number;
  mom: number;
  frozen: number;
  hasteT: number;
  anvil: number;
  ammo: number | null;
  stk: number;
  rage: number;
  cnt: number;
  lastT: number;
  /** 上次触发的时间（普朗克时间限制用） */
  lastFire: number;
  /** 战场上的出手位置（战场坐标，由界面量出来或按格子估算） */
  ox: number;
  nb: Card[] | null;
  right: Card | null;
  echoLog: number[];
  evLog: Record<string, number[]>;
  /* ---- 战报统计 ---- */
  bDmg: number;
  bTrig: number;
  bSrc: Record<string, number> | null;
  bCh: number;
  bHs: number;
  bRl: number;
  bBf: number;
  bTr: number;
}

/** 商店 / 奖励里的一张卡（还没到手） */
export interface CardSpec {
  key: string;
  tier: number;
  adj: string | null;
  size: number;
  dl?: number | string;
  hoard?: number;
}
export interface Offer {
  card: CardSpec;
  price: number;
  sold: boolean;
  locked?: boolean;
}

export interface SpawnSpec {
  type: string;
  t: number;
  x: number;
  y: number;
}
export type Wave = SpawnSpec[] & { surges?: number[] };

/** 这一局的统计（成就、过往守夜用） */
export interface RunStats {
  maxBoard: number;
  wallLost: number;
  maxHit: number;
  kills: number;
  wagers: number;
  maxCombo: number;
  got: string[];
  lastPure?: boolean;
  lastSmall?: boolean;
  lastBig?: boolean;
  newHeat?: number;
  /** 这局解锁的新人物 */
  newHero?: string;
  hid?: number;
}

/** 备战时当前打开的那一站 */
export interface PrepStop {
  id: string;
  mode: string;
  [k: string]: any;
}
export interface Prep {
  step: number;
  cur: PrepStop | null;
  doors: string[];
  talk?: boolean;
  talkDone?: boolean;
  rare?: number;
  fought?: boolean;
  wagers?: string[];
  wager?: string | null;
  tipI?: number;
}

export type Phase = 'title' | 'prep' | 'battle' | 'report' | 'over';

export interface GameState {
  hero: string;
  foeSet: string;
  skills: string[];
  phase: Phase;
  round: number;
  maxRound: number;
  gold: number;
  wall: number;
  wallMax: number;
  /** 战斗倍速（界面的 1×/2×/3× 按钮） */
  speed: number;
  cards: Card[];
  relics: string[];
  prep: Prep;
  nextWave: Wave | null;
  fightWave: Wave | null;
  bestChain: number;
  firstPrep: boolean;
  heat: number;
  run: RunStats | null;
  boss8: string;
  endless: boolean;
  lock: Offer | null;
  seenFoes: Record<string, number>;
  secret: Record<string, number>;
  /** 本局种子：开局时定好，和 rng 的状态一起存档 */
  seed: number;
}

export const G: GameState = {
  hero: 'ayla',
  foeSet: 'dark',
  skills: [],
  phase: 'title',
  round: 1,
  maxRound: 8,
  gold: 10,
  wall: 25,
  wallMax: 25,
  speed: 1,
  cards: [],
  relics: [],
  prep: { step: 0, cur: null, doors: [] },
  nextWave: null,
  fightWave: null,
  bestChain: 0,
  firstPrep: true,
  heat: 0,
  run: null,
  boss8: 'eye',
  endless: false,
  lock: null,
  seenFoes: {},
  secret: {},
  seed: 0,
};

export const freshRun = (): RunStats => ({ maxBoard: 0, wallLost: 0, maxHit: 0, kills: 0, wagers: 0, maxCombo: 0, got: [] });

export const heat = (n: number) => (G.heat || 0) >= n;

export type { Tag };
