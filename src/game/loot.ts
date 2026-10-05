/* 掉落与抽取：商店卡、词缀、遗物、天赋、「对路」选项 / Loot and rolls: shop cards, affixes, relics, talents, and 'on-path' options */
import { ITEMS, ADJ, ADJ_NODMG } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import { FIT_CHANCE } from '../data/meta';
import { rand, pick } from '../core/rng';
import { G, heat, type Offer } from './state';
import { basePrice, hasKind, hasTag, hasGrow, hasAmmo, hasBig } from './cards';
import { cardOpen, heroUnlocked, pathOf } from './unlocks';
import { OMENS } from '../data/meta';
import type { Tag } from '../data/types';
import { mv } from './mods';

/* ---------------- 卡牌 ---------------- / ---------------- Cards ---------------- */
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

/** 外乡卡：别的守夜人的专属卡（那个人物解锁了才会来），贵一点；不管解锁了几个人物，总共只占一成左右
 * foreign cards: another watcher's exclusive cards (only once that hero is unlocked), a bit pricier; about a tenth of draws in total however many heroes are unlocked */
export const isForeign = (k: string) => !!ITEMS[k].hero && ITEMS[k].hero !== G.hero;
const FOREIGN_SHARE = 0.1;
export const FOREIGN_TAX = 2;
const foreignOk = (k: string) => {
  if (ITEMS[k].local) return false;
  /* 流派轮换：外乡卡只来客串的那个流派（不看那个人物的熟练） / archetype rotation: foreign cards only come from the guest archetype (regardless of that hero's mastery) */
  if (G.rot) {
    const p = pathOf(k);
    return !!p && p[0] === G.rot.gh && p[1].id === G.rot.gp;
  }
  return heroUnlocked(ITEMS[k].hero!) && cardOpen(k);
};
/** 本家的卡这局卖不卖：流派轮换时少一个流派 / whether a home card is sold this run: rotation drops one archetype */
export const homeOk = (k: string) => {
  if (!cardOpen(k)) return false;
  const p = G.rot && ITEMS[k].hero === G.hero ? pathOf(k) : null;
  return !p || p[1].id !== G.rot!.off;
};
/** 外乡卡占比和加价：流派轮换时客串流派占三成；异象「外乡人」占四成；这两种都不加价 / foreign share and surcharge: rotation's guest archetype takes 30%; the 'Stranger' omen 40%; neither adds a surcharge */
const foreignShare = () => (G.omen && OMENS[G.omen].foreign) || (G.rot ? 0.3 : FOREIGN_SHARE);
export const foreignTax = () => (G.rot || (G.omen && OMENS[G.omen].foreign) ? 0 : FOREIGN_TAX);
/** 风向的卡权重翻倍 / the wind's cards get double weight */
const WIND_W = 2;

export function rollItem(filter?: ItemFilter | null) {
  const R = G.round;
  const pool: [string, number][] = [];
  for (const k in ITEMS) {
    const it = ITEMS[k];
    const fg = isForeign(k);
    if (it.noPool || (fg ? !foreignOk(k) : !homeOk(k))) continue;
    if (filter && !filter(it)) continue;
    if (it.t === 2 && R < 2) continue;
    const w = (it.size === 1 ? 4 : it.size === 2 ? 3 : R >= 4 ? 2.5 : 1.3) * (fg ? 1 : it.hero ? 1.4 : 1) * (G.wind === it.tag || G.wind2 === it.tag ? WIND_W : 1);
    pool.push([k, w]);
  }
  /* 外乡卡整体缩到总权重的一成 / scale foreign cards down to a tenth of the total weight */
  let own = 0,
    far = 0;
  for (const [k, w] of pool) isForeign(k) ? (far += w) : (own += w);
  if (far && own) {
    const sh = foreignShare();
    const f = (own * sh) / (1 - sh) / far;
    for (const p of pool) if (isForeign(p[0])) p[1] *= f;
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
  else price += (heat(3) ? 1 : 0) + mv('tax') + (isForeign(key) ? foreignTax() : 0);
  return { card: { key, tier, adj, size: ITEMS[key].size, dl: 0, hoard: 0 }, price, sold: false };
}

/** 锁住的卡原价出现在下一家店的第一格 / a locked card reappears at full price in the next shop's first slot */
export function lockedOffers(offers: Offer[]) {
  if (!G.lock) return offers;
  const L0 = G.lock;
  offers[0] = { card: Object.assign({}, L0.card), price: L0.price, sold: false, locked: true };
  return offers;
}

/* ---------------- 风向 ---------------- / ---------------- Wind ---------------- */
/** 开局定风向：只在这个人物能买到至少 4 张的元素里挑 / pick the run's wind at start: only among elements this hero can buy at least 4 cards of */
export function rollWind(not: Tag | '' = ''): Tag | '' {
  const n: Partial<Record<Tag, number>> = {};
  for (const k in ITEMS) {
    const it = ITEMS[k];
    if (it.noPool || (it.hero && it.hero !== G.hero) || !homeOk(k)) continue;
    n[it.tag] = (n[it.tag] || 0) + 1;
  }
  const ts = (Object.keys(n) as Tag[]).filter((t) => n[t]! >= 4 && t !== not).sort();
  return ts.length ? pick(ts) : '';
}
/** 这件遗物顺不顺风：加这个元素的伤害、攻速，或者加它的招牌状态 / whether a relic suits the wind: boosts this element's damage or speed, or its signature status */
const WIND_MOD: Partial<Record<Tag, string[]>> = { fire: ['burn'], ice: ['slow', 'slowVuln'], volt: ['chain'] };
export const windRelic = (k: string, w: Tag | '' = G.wind) =>
  !!w && Object.keys(RELICS[k].m).some((m) => m === 'tag_' + w || m === 'xtag_' + w || m === 'tspd_' + w || (WIND_MOD[w] || []).includes(m));

/* ---------------- 遗物 ---------------- / ---------------- Relics ---------------- */
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
    const pool = Object.keys(RELICS).filter((k) => RELICS[k].t === tier && gearOk(k) && !out.includes(k));
    if (pool.length) out.push(pick(pool));
  }
  /* 风向保底：第一次挑遗物时，没有顺风的就换掉最后一件 / wind guarantee: the first relic pick swaps its last item for a wind relic if none is there */
  if (G.wind && !G.windRelic && out.length) {
    G.windRelic = true;
    if (!out.some((k) => windRelic(k))) {
      const pool = Object.keys(RELICS).filter((k) => w[RELICS[k].t] > 0 && gearOk(k) && windRelic(k) && !out.includes(k));
      if (pool.length) out[out.length - 1] = pick(pool);
    }
  }
  return out;
}
const gearOk = (k: string) => !RELICS[k].fit && !RELICS[k].gem && !RELICS[k].rule && (!RELICS[k].hero || RELICS[k].hero === G.hero) && !(RELICS[k].u && G.relics.includes(k));
/** 规则遗物三选一：第 2、6 夜守住之后（第 3、7 夜备战开头） / rule relics, three to choose from: after holding nights 2 and 6 (at the start of prep for nights 3 and 7) */
export const RULE_NIGHTS = [3, 7];
/** 规则遗物对不对路：用得上的权重 ×3（不对路的也可能出，给换打法留余地） / whether a rule relic suits the board: usable ones get ×3 weight (others can still show up, leaving room to pivot) */
const elems = () => new Set(G.cards.filter((c) => c.loc === 'board' && ITEMS[c.key].dmg > 0).map((c) => ITEMS[c.key].tag));
const RULE_FIT: Record<string, () => boolean> = {
  resfork: () => ['fire', 'ice', 'volt', 'poison'].filter((t) => elems().has(t as Tag)).length >= 2,
  reagent: () => ['fire', 'ice', 'volt', 'poison'].filter((t) => elems().has(t as Tag)).length >= 2,
  kiln: () => hasTag('fire'),
  duet: () => elems().size >= 2,
  linkage: () => G.cards.some((c) => c.loc === 'board' && (c.adj === 'echo' || ITEMS[c.key].horn)) || mv('chain') > 0,
  ringwall: () => G.cards.filter((c) => c.loc === 'board').length >= 4,
};
export function rollRule(n: number) {
  const out: string[] = [];
  const pool = Object.keys(RELICS).filter((k) => RELICS[k].rule && !G.relics.includes(k));
  const w = (k: string) => (RULE_FIT[k] ? (RULE_FIT[k]() ? 3 : 1) : 2);
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
  return out;
}
export const gearPrice = (k: string) => [5, 9, 14, 20][RELICS[k].t] + Math.floor(G.round / 2) + mv('tax');

/* ---------------- 天赋 ---------------- / ---------------- Talents ---------------- */
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
 * 这些遗物和天赋平时不进随机池，只在条件满足时才可能冒出来
 * ---------------- On-path: holding a certain card type occasionally adds a tailored option ---------------- / these relics and talents never enter the random pool; they only appear when conditions are met
 */
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
