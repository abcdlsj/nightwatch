/* 掉落与抽取：商店卡、词缀、遗物、天赋、「对路」选项 */
import { ITEMS, ADJ, ADJ_NODMG } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import { FIT_CHANCE } from '../data/meta';
import { rand, pick } from '../core/rng';
import { G, heat, type Offer } from './state';
import { basePrice, hasKind, hasTag, hasGrow, hasAmmo, hasBig } from './cards';
import { cardOpen } from './unlocks';

/* ---------------- 卡牌 ---------------- */
export function rollAdj(key: string, force?: boolean, exclude?: string | null, maxTier?: number) {
  if (!force && rand() > 0.12) return null;
  const r = rand();
  const rare = 0.06 + 0.025 * G.round;
  const unc = 0.3;
  let tier = r < rare ? 2 : r < rare + unc ? 1 : 0;
  if (maxTier !== undefined) tier = Math.min(tier, maxTier);
  let pool = Object.keys(ADJ).filter((k) => ADJ[k].r === tier);
  if (ITEMS[key].dmg === 0) pool = pool.filter((k) => ADJ_NODMG.includes(k));
  if (exclude) pool = pool.filter((k) => k !== exclude);
  if (!pool.length) pool = ADJ_NODMG.filter((k) => k !== exclude);
  return pick(pool);
}

export type ItemFilter = (it: (typeof ITEMS)[string]) => boolean;

export function rollItem(filter?: ItemFilter | null) {
  const R = G.round;
  const pool: [string, number][] = [];
  for (const k in ITEMS) {
    const it = ITEMS[k];
    if (it.noPool || (it.hero && it.hero !== G.hero) || !cardOpen(k)) continue;
    if (filter && !filter(it)) continue;
    if (it.t === 2 && R < 2) continue;
    const w = (it.size === 1 ? 4 : it.size === 2 ? 3 : R >= 4 ? 2.5 : 1.3) * (it.hero ? 1.4 : 1);
    pool.push([k, w]);
  }
  if (!pool.length) return pick(Object.keys(ITEMS).filter((k) => !ITEMS[k].noPool && !ITEMS[k].hero));
  let t = rand() * pool.reduce((a, b) => a + b[1], 0);
  for (const [k, w] of pool) {
    t -= w;
    if (t <= 0) return k;
  }
  return pool[0][0];
}

export function makeOffer(filter?: ItemFilter | null, opt: { black?: number | boolean; free?: number | boolean } = {}): Offer {
  const key = rollItem(filter);
  let tier = ITEMS[key].t;
  if (opt.black || rand() < (G.round >= 5 ? 0.18 : G.round >= 3 ? 0.08 : 0)) tier = Math.min(opt.free ? 2 : 3, tier + 1);
  const adj = rollAdj(key, !!opt.black);
  let price = basePrice(key, adj, tier);
  if (opt.black) price = Math.round(price * 1.5);
  if (opt.free) price = 0;
  else if (heat(3)) price += 1;
  return { card: { key, tier, adj, size: ITEMS[key].size, dl: 0, hoard: 0 }, price, sold: false };
}

/** 锁住的卡原价出现在下一家店的第一格 */
export function lockedOffers(offers: Offer[]) {
  if (!G.lock) return offers;
  const L0 = G.lock;
  offers[0] = { card: Object.assign({}, L0.card), price: L0.price, sold: false, locked: true };
  return offers;
}

/* ---------------- 遗物 ---------------- */
export function rollGear(n: number, bonus?: number, maxTier?: number) {
  const R = G.round + (bonus || 0);
  const w = [Math.max(10, 62 - 8 * R), 24 + 2 * R, R >= 2 ? 4 + 4 * R : 0, R >= 4 ? 2 * R - 4 : 0];
  if (maxTier !== undefined) for (let i = maxTier + 1; i < 4; i++) w[i] = 0;
  const out: string[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    let t = rand() * w.reduce((a, b) => a + b, 0);
    let tier = 0;
    for (let i = 0; i < 4; i++) {
      t -= w[i];
      if (t <= 0) {
        tier = i;
        break;
      }
    }
    const pool = Object.keys(RELICS).filter(
      (k) => RELICS[k].t === tier && !RELICS[k].fit && (!RELICS[k].hero || RELICS[k].hero === G.hero) && !out.includes(k) && !(RELICS[k].u && G.relics.includes(k)),
    );
    if (pool.length) out.push(pick(pool));
  }
  return out;
}
export const gearPrice = (k: string) => [5, 9, 14, 20][RELICS[k].t] + Math.floor(G.round / 2);

/* ---------------- 天赋 ---------------- */
export function talentOk(id: string) {
  const T = TALENTS[id];
  return !!T && !G.skills.includes(id) && (!T.hero || T.hero === G.hero);
}

export function rollTalents(n: number, bias?: string) {
  const out: string[] = [];
  const pool = Object.keys(TALENTS).filter((k) => talentOk(k) && !TALENTS[k].fit);
  const w = (id: string) => {
    const T = TALENTS[id];
    return [6, 3, 1.3][T.r] * (T.hero ? 1.5 : 1) * (bias && T.cat === bias ? 3 : 1) * (T.r === 2 && G.round < 3 ? 0.3 : 1);
  };
  while (out.length < n) {
    const p = pool.filter((k) => !out.includes(k));
    if (!p.length) break;
    let t = rand() * p.reduce((s, k) => s + w(k), 0);
    let got = p[p.length - 1];
    for (const k of p) {
      t -= w(k);
      if (t <= 0) {
        got = k;
        break;
      }
    }
    out.push(got);
  }
  const f = fitTalent(out);
  if (f) out.push(f);
  return out;
}

/* ---------------- 对路：手里有某类卡时，偶尔多一个针对性选项 ----------------
 * 这些遗物和天赋平时不进随机池，只在条件满足时才可能冒出来 */
const RELIC_FIT: Record<string, () => boolean> = {
  scabbard: () => hasKind('weapon'),
  chant: () => hasKind('weapon'),
  groove: hasGrow,
  grit: hasGrow,
  bellows: () => hasTag('fire'),
  rat: () => hasTag('poison'),
  coil: () => hasTag('volt'),
  frostlens: () => hasTag('ice'),
  loader: hasAmmo,
  pulley: hasBig,
  lampfair: () => hasKind('lamp'),
  fusebox: () => hasKind('firearm'),
  mletter: () => false,
};
const TALENT_FIT: Record<string, () => boolean> = {
  f_sweep: () => hasKind('weapon'),
  f_hone: hasGrow,
  f_quick: () => hasKind('weapon') || hasAmmo(),
};

export function fitRelic(have: string[], chance?: number) {
  if (rand() >= (chance == null ? FIT_CHANCE : chance)) return null;
  const p = Object.keys(RELICS).filter((k) => {
    const R0 = RELICS[k];
    return R0.fit && RELIC_FIT[k]?.() && !have.includes(k) && !(R0.u && G.relics.includes(k));
  });
  return p.length ? pick(p) : null;
}
export function withFit(list: string[], chance?: number) {
  const k = fitRelic(list, chance);
  return k ? list.concat(k) : list;
}
export function fitTalent(have: string[]) {
  if (rand() >= FIT_CHANCE) return null;
  const p = Object.keys(TALENTS).filter((id) => TALENTS[id].fit && TALENT_FIT[id]?.() && talentOk(id) && !have.includes(id));
  return p.length ? pick(p) : null;
}
