/* 可复现的随机数。
 * 规则相关的随机（出怪、掉落、暴击、商店……）都走 rng，给定种子就能完整复现一局；
 * 纯表现的随机（粒子、飘字、台词挑哪句）用 vr，不影响结算，也不打乱 rng 的序列。 */

/** mulberry32：32 位状态，够快，分布够用 */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  get state(): number {
    return this.s;
  }
  set state(v: number) {
    this.s = v >>> 0;
  }
}

export const newSeed = () => (Math.random() * 4294967296) >>> 0;

/** 规则随机。新开一局时 reseed */
export const rng = new Rng(newSeed());
export const reseed = (seed: number) => {
  rng.state = seed;
};

export const rand = () => rng.next();
export const rnd = (a: number, b: number) => a + rng.next() * (b - a);
export const pick = <T>(a: readonly T[]): T => a[Math.floor(rng.next() * a.length)];
/** 打乱顺序（沿用旧版的 sort 写法，保证同种子结果一致） */
export const shuffled = <T>(a: readonly T[]): T[] => a.slice().sort(() => rng.next() - 0.5);

/** 表现随机：不影响结算 */
export const vr = () => Math.random();
export const vrnd = (a: number, b: number) => a + Math.random() * (b - a);
export const vpick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
