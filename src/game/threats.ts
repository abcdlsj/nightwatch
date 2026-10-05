/* 每夜的敌情：从 THREATS 里抽 1~3 套，第一套是主力，和上一夜的主力不重样。
 * 只由本局种子和夜数决定，不动 rng 的序列：读档、备战时提前看都一样
 * Each night's threats: draw 1~3 from THREATS, the first being the main one, never the same as last night's main.
 * Decided only by the run seed and the night number, without touching rng's sequence: identical on reload or when previewed during prep
 */
import { THREATS } from '../data/threats';
import { Rng } from '../core/rng';
import { G } from './state';

/** 第几档编队：第 1~3 夜 / 第 4~6 夜 / 第 7 夜起 / squad tier: nights 1~3 / 4~6 / 7+ */
export const threatTier = (r: number) => (r <= 3 ? 0 : r <= 6 ? 1 : 2);

function draw(r: number, n: number, avoid: string | null): string[] {
  const rg = new Rng((G.seed ^ Math.imul(r + 1, 0x9e3779b1)) >>> 0);
  rg.next();
  const tier = threatTier(r);
  const out: string[] = [];
  while (out.length < n) {
    const pool = Object.keys(THREATS).filter((k) => THREATS[k].comps[tier] && !out.includes(k) && !(out.length === 0 && k === avoid));
    if (!pool.length) break;
    let t = rg.next() * pool.reduce((s, k) => s + THREATS[k].w, 0);
    let got = pool[pool.length - 1];
    for (const k of pool) {
      t -= THREATS[k].w;
      if (t <= 0) {
        got = k;
        break;
      }
    }
    out.push(got);
  }
  return out;
}

/** 第 r 夜的敌情（n 套）。主力避开上一夜的主力，所以从第 2 夜一路推上来 / night r's threats (n of them). The main avoids last night's main, so it is derived forward from night 2 */
export function nightThreats(r: number, n: number): string[] {
  let prev: string | null = null;
  for (let i = 2; i < r; i++) prev = draw(i, 1, prev)[0] ?? null;
  return draw(r, n, prev);
}
