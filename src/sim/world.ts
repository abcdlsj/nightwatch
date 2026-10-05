/* 战场坐标。模拟用「格子」做单位：手机上约 180 格宽，城墙在底部。
 * 尺寸由界面量出来后写进 world；无界面跑的时候用默认值。
 * Battlefield coordinates. The sim uses 'cells' as units: about 180 cells wide on phones, with the wall at the bottom. The UI measures the size and writes it into world; headless runs use the defaults.
 */
import type { Card } from '../game/state';

export const world = {
  W: 180,
  H: 300,
  /** 顶部被首领血条挡住的高度 / height occluded at the top by the boss health bar */
  top: 0,
  /** 射程线：敌人走到这里以下才能被打到（0~1，越大越靠近城墙） / range line: enemies must come below it to be hit (0–1, larger is closer to the wall) */
  range: 0.13,
  /** 卡牌出手位置（x）。界面量 DOM，无界面时按格子估算 / card firing positions (x). The UI measures the DOM; headless runs estimate from slots */
  originX: (c: Card) => ((c.idx + c.size / 2) / 8) * world.W,
};
export const RANGE0 = 0.13;

/** 长度单位：战场宽度 / 180 / unit of length: battlefield width / 180 */
export const K = () => world.W / 180;
export const WALLY = () => world.H - 7;
export const ex = (e: { x: number }) => e.x * world.W;
export const ey = (e: { y: number }) => world.top + e.y * (WALLY() - 2 - world.top);
