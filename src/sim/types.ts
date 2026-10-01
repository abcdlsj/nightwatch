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
  /** 动画相位，也决定游魂什么时候虚化 */
  ph: number;
  armorB: number; hasteB: number;
  healT: number; bornT: number; raiseT: number; lobT: number;
  sprK: string | null;
  revealed: boolean;
  dashT: number; hardT: number;
  /** 当前意图序号和倒计时 */
  ii: number; it: number;
  dead: boolean;
  emerge?: boolean;
  raised?: boolean;
  shellN?: number;
  lowSaid?: boolean;
}

export interface Projectile {
  x: number; y: number; sx: number; sy: number;
  tgt: Enemy | null; tx: number; ty: number;
  spd: number; kind: string; arc?: number; dur?: number; age: number;
  vx?: number; vy?: number;
  onHit: (e: Enemy | null, x?: number, y?: number) => void;
  done: boolean;
}

export interface EnemyRock { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; done?: boolean }

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
  /** 界面主循环用的时间累积 */
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
  /** 慢镜头剩余（真实时间） */
  slowT: number;
  kt?: number[];
  wallBy?: Record<string, number>;
}
