/* 战斗模拟对外的表现接口。模拟层只在这里「喊一声」，由界面层实现；
 * 无界面跑模拟（测试、平衡脚本）时用默认的空实现。 */
import type { Card } from '../game/state';
import type { Enemy } from './types';
import type { Line } from '../data/types';

export interface SimView {
  /* 战场特效（战场坐标） */
  part(x: number, y: number, vx: number, vy: number, life: number, col: string, sz?: number): void;
  num(x: number, y: number, str: string, col: string, s: number): void;
  /** 伤害飘字：由界面决定要不要显示（同屏太多时会抽掉一部分） */
  dmgNum(e: Enemy, a: number, crit: boolean, kind: 'burn' | 'poison' | null): void;
  ring(x: number, y: number, r0: number, r1: number, col: string, life: number): void;
  bolt(pts: [number, number][], col: string, life: number, straight?: boolean): void;
  boom(x: number, y: number, r: number, col: string): void;
  /** 命中迸溅：tag 是出手卡的元素（灼烧、中毒跳伤按火、毒算） */
  hit(x: number, y: number, tag: string | null, crit: boolean, kill: boolean): void;
  shake(n: number): void;
  wallFlash(): void;
  coins(x: number, y: number, n: number): void;
  /* 卡牌 */
  cardFx(c: Card, cls: 'pop' | 'shake'): void;
  cardFlag(c: Card, flag: 'frozen' | 'haste', on: boolean): void;
  cardAmmo(c: Card): void;
  cardNum(c: Card): void;
  link(a: Card, b: Card, col: string, life?: number): void;
  /* 界面 */
  sfx(k: string, p?: string | number): void;
  say(who: string, text: Line, pri?: number): void;
  toast(msg: string): void;
  banner(msg: string, col?: string): void;
  tip(key: string, text: string, delay?: number): void;
  hud(): void;
  boss(e: Enemy | null): void;
  meetFoe(type: string, firstEver: boolean): void;
  chain(n: number): void;
  combo(n: number): void;
  buzz(p: number | number[]): void;
}

const noop = () => {};
export const nullView: SimView = {
  part: noop, num: noop, dmgNum: noop, ring: noop, bolt: noop, boom: noop, hit: noop, shake: noop, wallFlash: noop, coins: noop,
  cardFx: noop, cardFlag: noop, cardAmmo: noop, cardNum: noop, link: noop,
  sfx: noop, say: noop, toast: noop, banner: noop, tip: noop, hud: noop, boss: noop, meetFoe: noop, chain: noop, combo: noop, buzz: noop,
};

export let view: SimView = nullView;
export const setView = (v: SimView) => {
  view = v;
};
