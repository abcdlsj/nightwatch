/* 一局游戏的状态。规则层只读写这里，不碰 DOM；界面层通过 ui/* 渲染它 / State of one run. The rules layer only reads and writes here and never touches the DOM; the UI renders it through ui/*. */
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
  /** 珍藏词缀攒下的售价 / sale value accrued from collected affixes */
  hoard: number;
  /** 成长：永久加的基础伤害 / growth: permanently added base damage */
  grow: number;
  /** 任务进度 / quest progress */
  qp: number;
  /** C 位：这局的主力，自带独立乘区（同一时间只有一张） / carry: this run's main card, with its own independent multiplier (only one at a time) */
  carry?: boolean;
  /** 星辉：璃的跃迁事件给 C 位叠的层数，每层再乘一截 / starlight: stacks Li's leap event adds to the carry, each stacking another multiplier */
  star?: number;
  /** 卡面闪光动画的错开延迟（纯表现） / staggered delay for the card-face flash animation (cosmetic) */
  dl: string | number;
  /* ---- 战斗中 ---- / ---- In battle ---- */
  charge: number;
  mom: number;
  frozen: number;
  hasteT: number;
  anvil: number;
  /** 下一击必定暴击（千里镜） / next hit is guaranteed to crit (Spyglass) */
  sure?: boolean;
  /** 下一击附带冻结的秒数（冰晶镜） / seconds of freeze on the next hit (Ice Mirror) */
  frostNext?: number;
  ammo: number | null;
  stk: number;
  rage: number;
  cnt: number;
  lastT: number;
  /** 上次触发的时间（普朗克时间限制用） / time of the last trigger (for the Planck-time limit) */
  lastFire: number;
  /** 战场上的出手位置（战场坐标，由界面量出来或按格子估算） / firing position on the battlefield (battlefield coordinates, measured by the UI or estimated from slots) */
  ox: number;
  nb: Card[] | null;
  right: Card | null;
  echoLog: number[];
  evLog: Record<string, number[]>;
  /* ---- 战报统计 ---- / ---- Report stats ---- */
  bDmg: number;
  bTrig: number;
  bSrc: Record<string, number> | null;
  bCh: number;
  bHs: number;
  bRl: number;
  bBf: number;
  bTr: number;
}

/** 商店 / 奖励里的一张卡（还没到手） / a card in a shop / reward (not yet owned) */
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
/** threats：这夜抽到的敌情（第一个是主力） / threats: this night's drawn threats (the first is the main one) */
export type Wave = SpawnSpec[] & { surges?: number[]; threats?: string[] };

/** 这一局的统计（成就、过往守夜用） / this run's stats (for achievements and past nights) */
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
  /** 这局解锁的新人物 / heroes unlocked this run */
  newHero?: string;
  /** 这局守到黎明后，这个人物守过黎明的流派（完整游戏线解锁进度） / after reaching dawn this run, the archetypes this hero has held dawn with (full game line unlock progress) */
  pathWin?: [number, number];
  /** 这局解锁了完整游戏线 / the full game line was unlocked this run */
  newFull?: boolean;
  hid?: number;
}

/** 备战时当前打开的那一站 / the prep stop currently open */
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
  /** 完整线：这夜之前有一颗宝石的剧情 / full line: a gem scene precedes this night */
  gem?: string;
  gemDone?: boolean;
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
  /** 战斗倍速（界面的 1×/2×/3× 按钮） / battle speed (the 1×/2×/3× button in the UI) */
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
  /** 第 9 夜的首领；完整线第 12 夜的首领 / the night-9 boss; the full-line night-12 boss */
  boss9: string;
  boss12: string;
  /** 完整游戏线（15 夜） / the full game line (15 nights) */
  full: boolean;
  /** 宝石：1 拿了，-1 没要，没有键表示还没遇到 / gem: 1 taken, -1 declined, no key means not yet encountered */
  gems: Record<string, number>;
  /** 这局走的是人物的第几套剧情 / which of the hero's story sets this run uses */
  arc: number;
  /** 起手套属于哪个流派（用三个流派各守到一次黎明，解锁完整游戏线） / which archetype the opening set belongs to (hold dawn once with each of the three to unlock the full game line) */
  kitPath: string;
  endless: boolean;
  lock: Offer | null;
  seenFoes: Record<string, number>;
  secret: Record<string, number>;
  /** 本局风向：这个元素的卡、专卖店、遗物更常见（空串表示没有） / this run's wind: cards, specialty shops and relics of this element show up more ('' for none) */
  wind: Tag | '';
  /** 风向的保底遗物已经给过 / the wind's guaranteed relic has been offered */
  windRelic: boolean;
  /** 本局种子：开局时定好，和 rng 的状态一起存档 / this run's seed: set at run start and saved alongside the rng state */
  seed: number;
}

export const G: GameState = {
  hero: 'ayla',
  foeSet: 'dark',
  skills: [],
  phase: 'title',
  round: 1,
  maxRound: 9,
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
  boss9: 'eye',
  boss12: 'brood',
  full: false,
  gems: {},
  arc: 0,
  kitPath: '',
  endless: false,
  lock: null,
  seenFoes: {},
  secret: {},
  seed: 0,
  wind: '',
  windRelic: false,
};

export const freshRun = (): RunStats => ({ maxBoard: 0, wallLost: 0, maxHit: 0, kills: 0, wagers: 0, maxCombo: 0, got: [] });

export const heat = (n: number) => (G.heat || 0) >= n;

export type { Tag };
