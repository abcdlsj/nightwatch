import type { EnemyDef } from '../data/types';
import type { Card, Wave } from '../game/state';

export interface Enemy {
  d: EnemyDef;
  type: string;
  x: number;
  y: number;
  x0: number;
  hp: number;
  maxHp: number;
  armor: number;
  shield: number;
  slowT: number; slowA: number;
  burnT: number; burnD: number; burnSrc: Card | null; burnTick: number;
  poisonT: number; poisonD: number; poisonSrc: Card | null; poisonTick: number;
  frzT: number; frzN: number;
  vulnT: number; vulnA: number;
  flash: number;
  /** 动画相位，也决定游魂什么时候虚化 / animation phase; also decides when wraiths turn ethereal */
  ph: number;
  armorB: number; hasteB: number;
  healT: number; bornT: number; raiseT: number; lobT: number;
  sprK: string | null;
  revealed: boolean;
  dashT: number; hardT: number;
  /** 上弦：快一半的剩余秒数 / wind-up: roughly half the remaining seconds */
  rushT?: number;
  /** 当前意图序号和倒计时 / current intent index and countdown */
  ii: number; it: number;
  dead: boolean;
  emerge?: boolean;
  raised?: boolean;
  shellN?: number;
  lowSaid?: boolean;
  /** 元素反应的内置冷却（到这个时刻前不再反应） / elemental reaction internal cooldown (no further reaction until this time) */
  rxT?: number;
}

export interface Projectile {
  x: number; y: number; sx: number; sy: number;
  tgt: Enemy | null; tx: number; ty: number;
  spd: number; kind: string; arc?: number; dur?: number; age: number;
  vx?: number; vy?: number;
  onHit: (e: Enemy | null, x?: number, y?: number) => void;
  done: boolean;
}

export interface EnemyRock { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; done?: boolean; /** 砸到城墙的伤害（不填按投石车） / damage dealt to the wall (defaults to the catapult's) */ d?: number }

export interface Battle {
  t: number;
  spawns: Wave;
  si: number;
  en: Enemy[];
  pr: Projectile[];
  epr: EnemyRock[];
  graves: { x: number; y: number; t: number }[];
  sched: { t: number; f: () => void }[];
  shield: number;
  maxChain: number;
  wallLost: number;
  endT: number;
  over: boolean;
  result?: 'win' | 'lose';
  /** 界面主循环用的时间累积 / time accumulator for the UI main loop */
  acc: number;
  boss: Enemy | null;
  greed: number;
  kills: number;
  flags: Record<string, any>;
  rlog: Record<string, number[]>;
  beats: any[];
  bi: number;
  surges: number[];
  lowSaid: boolean;
  wager: string | null;
  ambush: boolean;
  fled?: number;
  maxCombo: number;
  combo: number;
  lastKill?: number;
  maxHit: number;
  /** 慢镜头剩余（真实时间） / remaining slow-motion time (real time) */
  slowT: number;
  kt?: number[];
  wallBy?: Record<string, number>;
  /** 本场元素反应、流派连招次数 / this battle's elemental reaction and archetype combo counts */
  rxN?: number;
  stkN?: number;
  /** 地面效果（火油坑、毒池、冰雾……） / ground effects (oil pits, poison pools, frost mist…) */
  zones?: GroundZone[];
}

/** 地面效果：每 0.5 秒对范围内的敌人打一下并施加状态 / ground effect: every 0.5 s hits enemies inside and applies statuses */
export interface GroundZone { x: number; y: number; r: number; t: number; next: number; dmg: number; src: Card; burn?: number; poison?: number; slow?: number; col: string }
