/* 敌情：四夜一段，一段之内敌情不变（构筑是长期的，给玩家时间针对它成型）。
 * 第 1 夜全固定；第 2~5、6~9 夜各一段（普通 9 夜只遇到两套），完整线再加 10~13、14~15，无尽接着四夜一段。
 * 每段抽 3 套，第一套是主力，和上一段的主力不重样；每夜按空位多少用前 1~3 套。
 * 只由本局种子和段号决定，不动 rng 的序列：读档、提前预告都一样
 * Threats: four nights per segment, unchanged within a segment (builds are long-term, so players get time to answer them).
 * Night 1 is fully fixed; nights 2~5 and 6~9 are one segment each (a normal 9-night run meets two sets), the full line adds 10~13 and 14~15, and endless continues in fours.
 * Each segment draws 3, the first being the main one, never the same as the previous segment's main; each night uses the first 1~3 depending on its open slots.
 * Decided only by the run seed and segment number, without touching rng's sequence: identical on reload and when previewed
 */
import { THREATS } from '../data/threats';
import { Rng } from '../core/rng';
import { G } from './state';
import { lastNight } from './plan';

/** 第几档编队：第 1~3 夜 / 第 4~6 夜 / 第 7 夜起 / squad tier: nights 1~3 / 4~6 / 7+ */
export const threatTier = (r: number) => (r <= 3 ? 0 : r <= 6 ? 1 : 2);

const SEG = 4;
/** 第 r 夜属于第几段（第 1 夜不算，返回 -1） / which segment night r belongs to (-1 for night 1) */
export const segOf = (r: number) => (r < 2 ? -1 : Math.floor((r - 2) / SEG));
/** 第 s 段从第几夜到第几夜（普通流程和完整线截在最后一夜） / the nights segment s spans (capped at the last night outside endless) */
export function segRange(s: number): [number, number] {
  const a = 2 + s * SEG;
  return [a, G.endless ? a + SEG - 1 : Math.min(a + SEG - 1, lastNight())];
}

/** 段里每一夜都抽得到的敌情：用这段最早一夜的档位判断，后面档位只会更高 / threats available on every night of the segment: judged by the segment's first night, since later tiers only go up */
function draw(s: number, avoid: string | null): string[] {
  const rg = new Rng((G.seed ^ Math.imul(s + 1, 0x9e3779b1)) >>> 0);
  rg.next();
  const tier = threatTier(segRange(s)[0]);
  const out: string[] = [];
  while (out.length < 3) {
    const pool = Object.keys(THREATS).filter((k) => THREATS[k].comps[tier] && !out.includes(k) && !(out.length === 0 && k === avoid));
    if (!pool.length) break;
    let t = rg.next() * pool.reduce((sum, k) => sum + THREATS[k].w, 0);
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

/** 第 s 段的三套敌情。主力避开上一段的主力，所以从第 0 段一路推上来 / segment s's three threats. The main avoids the previous segment's main, so it is derived forward from segment 0 */
export function segThreats(s: number): string[] {
  let prev: string | null = null;
  for (let i = 0; i < s; i++) prev = draw(i, prev)[0] ?? null;
  return draw(s, prev);
}

/** 第 r 夜用的敌情（前 n 套） / the threats night r uses (the first n) */
export const nightThreats = (r: number, n: number) => (segOf(r) < 0 ? [] : segThreats(segOf(r)).slice(0, n));

/** 段末那一夜预告下一段：返回下一段的夜数范围和敌情，不是段末返回 null / on a segment's last night, preview the next: its night range and threats, or null otherwise */
export function nextSeg(r: number): { from: number; to: number; ids: string[] } | null {
  const s = segOf(r + 1);
  if (s < 0 || s === segOf(r) || (!G.endless && r + 1 > lastNight())) return null;
  const [from, to] = segRange(s);
  return { from, to, ids: segThreats(s) };
}
