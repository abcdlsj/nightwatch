/* 卡牌规则：格子、相邻、伤害公式、价格。全是纯计算，不碰界面 / Card rules: slots, adjacency, damage formula, price. All pure computation, no UI */
import { ITEMS, UPS, ADJ, normAdj } from '../data/cards';
import type { Kind, Tag } from '../data/types';
import { L } from '../i18n';
import { vr } from '../core/rng';
import { G, type Card, type CardSpec, type Zone } from './state';
import { mv } from './mods';
import { TUNE } from './tuning';

let UID = 1;

export function newCard(key: string, tier?: number | null, adj?: string | null): Card {
  return {
    id: UID++, key, tier: tier == null ? ITEMS[key].t : tier, adj: normAdj(adj), size: ITEMS[key].size, loc: null, idx: -1,
    hoard: 0, grow: 0, qp: 0, dl: (vr() * -3.4).toFixed(2),
    charge: 0, mom: 0, frozen: 0, hasteT: 0, anvil: 0, ammo: null, stk: 0, rage: 0, cnt: 0, lastT: -9, lastFire: -9, ox: 0,
    nb: null, right: null, echoLog: [], evLog: {},
    bDmg: 0, bTrig: 0, bSrc: null, bBy: null, bCh: 0, bHs: 0, bRl: 0, bBf: 0, bTr: 0,
  };
}

/* ---------------- 格子 ---------------- / ---------------- Slots ---------------- */
export const zoneN = (z: Zone) => (z === 'board' ? 8 : 4);

export function occ(z: Zone): (Card | null)[] {
  const a: (Card | null)[] = Array(zoneN(z)).fill(null);
  for (const c of G.cards) if (c.loc === z) for (let i = 0; i < c.size; i++) a[c.idx + i] = c;
  return a;
}

export function fits(z: Zone, idx: number, size: number, ignore?: Card | null) {
  const n = zoneN(z);
  if (idx < 0 || idx + size > n) return false;
  const o = occ(z);
  for (let i = idx; i < idx + size; i++) if (o[i] && o[i] !== ignore) return false;
  return true;
}

export function firstFit(size: number): { z: Zone; i: number } | null {
  for (const z of ['board', 'stash'] as Zone[]) for (let i = 0; i + size <= zoneN(z); i++) if (fits(z, i, size)) return { z, i };
  return null;
}

export function neighbors(c: Card): Card[] {
  if (c.loc !== 'board') return [];
  const o = occ('board');
  const r: Card[] = [];
  const L0 = o[c.idx - 1],
    R = o[c.idx + c.size];
  if (L0) r.push(L0);
  if (R) r.push(R);
  /* 环城：最左和最右的卡互为相邻 / Ring Wall: the leftmost and rightmost cards are neighbors */
  if (mv('t_ring')) {
    const bc = boardCards();
    const far = c === bc[0] ? bc[bc.length - 1] : c === bc[bc.length - 1] ? bc[0] : null;
    if (far && far !== c && !r.includes(far)) r.push(far);
  }
  return r;
}

export function rightOf(c: Card) {
  if (c.loc !== 'board') return null;
  return occ('board')[c.idx + c.size] || null;
}

export const boardCards = () => G.cards.filter((c) => c.loc === 'board').sort((a, b) => a.idx - b.idx);
/** 棋盘最左和最右的卡 / the cards at the board's far left and far right */
export const ends = (): [Card | undefined, Card | undefined] => {
  const b = boardCards();
  return [b[0], b[b.length - 1]];
};
export const countSame = (key: string, tier: number) => G.cards.filter((c) => c.key === key && c.tier === tier).length;

/* ---------------- 品质与数值 ---------------- / ---------------- Tier and values ---------------- */
export const stepOf = (c: CardSpec | Card) => Math.max(0, c.tier - ITEMS[c.key].t);
export const dmgMul = (c: Card) => UPS[ITEMS[c.key].up].d[stepOf(c)];
export const chainOf = (c: Card) => (ITEMS[c.key].chain || 0) + stepOf(c) + mv('chain');
export const chargeAmt = (c: CardSpec | Card) => ITEMS[c.key].charge! * [1, 1.5, 2, 2.7][stepOf(c)];

export const kindOf = (c: { key: string }): Kind | '' => ITEMS[c.key].kind || '';
export const countKind = (k: Kind, ex?: Card) => boardCards().filter((o) => o !== ex && kindOf(o) === k).length;
export const countTag = (t: Tag, ex?: Card) => boardCards().filter((o) => o !== ex && ITEMS[o.key].tag === t).length;

export function maxAmmo(c: CardSpec | Card) {
  const a = ITEMS[c.key].ammo;
  return a == null ? null : a + stepOf(c) + mv('ammo');
}

export function buffAmt(c: Card) {
  const it = ITEMS[c.key];
  let a = it.buff! * (1 + 0.2 * stepOf(c)) + (c.rage || 0);
  if (it.buffKind) a += it.buffKind.amt * countKind(it.buffKind.kind);
  return a;
}

/* ---------------- 成长与任务 ---------------- / ---------------- Growth and quests ---------------- */
/** 带【成长】关键词的卡 / cards with the 【growth】 keyword */
export const isGrow = (c: { key: string }) => !!ITEMS[c.key].grow;

export function growCard(c: Card, v: number) {
  c.grow = (c.grow || 0) + v * (1 + mv('t_photo'));
}

export function questN(c: Card) {
  const q = ITEMS[c.key].quest;
  return q ? Math.ceil(q.n * (mv('t_map') ? 0.5 : 1)) : 0;
}
export function questAdd(c: Card, v?: number) {
  if (ITEMS[c.key].quest) c.qp = (c.qp || 0) + (v || 1);
}

/** 夜晚结束时结算任务，返回完成了的卡和原来的名字 / settle quests when the night ends; returns completed cards and their original names */
export function finishQuests(): { c: Card; from: string }[] {
  const done: { c: Card; from: string }[] = [];
  for (const c of G.cards) {
    const q = ITEMS[c.key].quest;
    if (!q || (c.qp || 0) < questN(c)) continue;
    const from = ITEMS[c.key].n;
    c.key = q.into;
    c.qp = 0;
    if (mv('t_map')) c.tier = Math.min(3, c.tier + 1);
    done.push({ c, from });
  }
  return done;
}

/* ---------------- 对路：按卡型加攻速 ---------------- / ---------------- On-path: attack speed by card type ---------------- */
export const hasKind = (k: Kind) => G.cards.some((c) => ITEMS[c.key].kind === k);
export const hasTag = (t: Tag) => G.cards.some((c) => ITEMS[c.key].tag === t);
export const hasGrow = () => G.cards.some(isGrow);
export const hasAmmo = () => G.cards.some((c) => ITEMS[c.key].ammo != null);
export const hasBig = () => G.cards.some((c) => c.size === 3);

export function fitSpd(c: Card) {
  const it = ITEMS[c.key];
  let s = mv('kspd_' + it.kind) + mv('tspd_' + it.tag);
  if (c.size === 3) s += mv('s3spd');
  if (it.ammo != null) s += mv('ammoSpd');
  if (isGrow(c)) {
    s += mv('growSpd');
    if (mv('t_growspd')) s += Math.min(0.4, Math.floor((c.grow || 0) / 5) * 0.04) * mv('t_growspd');
  }
  return s;
}

/* ---------------- 伤害公式 ----------------
 * (基础 + 固定) × (1 + Σ加成) × Π独立乘区 × 暴击 × 连锁倍率 × 目标易伤
 * 独立乘区：致命、钻品质、传说遗物、6 层羁绊……每一项单独相乘，后期主要靠它们
 * ---------------- Damage formula ---------------- / (base + flat) × (1 + Σbonus) × Πindependent multipliers × crit × chain multiplier × target vulnerability / Independent multipliers: Deadly, diamond tier, legendary relics, 6-stack synergy… each multiplies separately; late game leans on them
 */
/** 连锁倍率：被回响、齐鸣、遗物带出来的出手，每深一层加一截（系数见 tuning.ts） / chain multiplier: hits triggered by echoes, choruses or relics add a step per extra depth (coefficient in tuning.ts) */
export const comboMul = (depth: number) => 1 + TUNE.combo * Math.min(TUNE.comboMax, Math.max(0, depth));
export interface Stats {
  base: number;
  flat: number;
  pct: [string, number][];
  psum: number;
  /** 独立乘区：每一项单独相乘 [名字, 倍率] / independent multipliers: each multiplies separately [name, multiplier] */
  xs: [string, number][];
  mult: number;
  total: number;
  cd: number;
  cdRaw: number;
  crit: number;
}

export function stats(c: Card | (CardSpec & Partial<Card>), t: number | null): Stats {
  const it = ITEMS[c.key],
    a = c.adj,
    s = stepOf(c),
    U = UPS[it.up];
  const T = L.ui.stats;
  const base = Math.round((it.dmg * U.d[s] + (it.dmg > 0 ? (c.grow || 0) + (c.stk || 0) : 0)) * 10) / 10;
  const flat = 0;
  const pct: [string, number][] = [];
  if (a === 'heavy') pct.push([ADJ.heavy.n, 0.5]);
  /* 钟摆越摆越狠；主发条越被上弦越狠 / the pendulum hits harder each swing; the mainspring hits harder the more it is wound */
  if (it.swing && (c as Card).sw) pct.push([L.ui.stats.swing + '×' + (c as Card).sw, it.swing[0] * (c as Card).sw!]);
  if (it.perCharged && (c as Card).chN) pct.push([L.ui.stats.wound + '×' + Math.min(20, (c as Card).chN!), it.perCharged * Math.min(20, (c as Card).chN!)]);
  if (a === 'resonance') {
    const nb = c.nb || neighbors(c as Card);
    const n = nb.filter((x) => ITEMS[x.key].tag === it.tag).length;
    if (n) pct.push([ADJ.resonance.n + '×' + n, 0.25 * n]);
  }
  const mp = (k: string, l: string) => {
    const v = mv(k);
    if (v) pct.push([l, v]);
  };
  if (it.per && c.loc === 'board') {
    const P = it.per;
    let n = 0;
    if (P.elem) n = new Set(boardCards().map((o) => ITEMS[o.key].tag)).size;
    else if (P.kind) n = countKind(P.kind, c as Card);
    else if (P.tag) n = countTag(P.tag, c as Card);
    if (n) pct.push([(P.elem ? T.elem : P.kind ? L.terms.kinds[P.kind] : L.terms.tags[P.tag!]) + '×' + n, P.pct * n]);
  }
  if (mv('t_alch') && c.loc === 'board') {
    const n = countKind('potion');
    if (n) pct.push([T.alch + '×' + n, 0.04 * n * mv('t_alch')]);
  }
  mp('dmg', T.bonus);
  mp('tag_' + it.tag, T.bonus + '·' + L.terms.tags[it.tag]);
  mp('s' + it.size, T.bonus + '·' + T.size[it.size]);
  if (c.loc === 'board') {
    const bc = boardCards();
    if (bc[0] === c) mp('left', T.left);
    if (bc[bc.length - 1] === c) mp('right', T.right);
    if (mv('lonely') && !(c.nb || neighbors(c as Card)).length) mp('lonely', T.lonely);
    if (mv('full') && occ('board').every(Boolean)) mp('full', T.full);
    /* 【站位】：相邻同类卡、旁边的军旗这类加成 / 【position】: bonuses from adjacent same-type cards, a nearby banner, and the like */
    const nb = c.nb || neighbors(c as Card);
    if (it.lineKind) {
      const n = nb.filter((x) => ITEMS[x.key].kind === it.lineKind!.kind).length;
      if (n) pct.push([L.terms.kinds[it.lineKind.kind] + '×' + n, it.lineKind.pct * n]);
    }
    if (it.dmg > 0)
      for (const n of nb) {
        const av = ITEMS[n.key].auraNb;
        if (av) pct.push([ITEMS[n.key].n, av * (isMid(n) ? 2 : 1)]);
      }
  }
  const psum = pct.reduce((s2, p) => s2 + p[1], 0);
  const xs: [string, number][] = [];
  if (a === 'deadly') xs.push([ADJ.deadly.n, 1.5]);
  if (c.tier >= 3) xs.push([T.diamond, TUNE.diamond]);
  if (c.carry) xs.push([T.carry, TUNE.carry * (1 + TUNE.star * ((c as Card).star || 0)) * (1 + mv('xcarry'))]);
  if (c.carry && it.asCarry) xs.push([T.asCarry, 1 + it.asCarry]);
  /* 【站位】 / 【position】 */
  if (c.loc === 'board') {
    const nb = c.nb || neighbors(c as Card);
    const bc = boardCards();
    /* 中军帐：占着正中时，所有站位乘区再加一截 / Command Tent: while on the center slot, all position multipliers gain another step */
    const pb = bc.filter((o) => ITEMS[o.key].posBoost && isMid(o)).reduce((s2, o) => s2 + ITEMS[o.key].posBoost! * (1 + 0.25 * stepOf(o)), 0);
    if (it.posMid && isMid(c as Card)) xs.push([T.pos, 1 + it.posMid + pb]);
    if (it.posEdge && (bc[0] === c || bc[bc.length - 1] === c)) xs.push([T.pos, 1 + it.posEdge + pb]);
    if (it.flank && nb.length === 2 && nb.every((n) => ITEMS[n.key].dmg === 0)) xs.push([T.pos, 1 + it.flank + pb]);
  }
  const xm = (k: string, l: string) => {
    const v = mv(k);
    if (v) xs.push([l, 1 + v]);
  };
  xm('xdmg', T.bonus);
  xm('xtag_' + it.tag, T.bonus + '·' + L.terms.tags[it.tag]);
  const mult = xs.reduce((m, x) => m * x[1], 1);
  const total = (base + flat) * Math.max(0.1, 1 + psum) * mult;
  let cd = it.cd * U.c[s];
  if (a === 'twin') cd *= 1.6;
  if (a === 'heavy') cd *= 1.3;
  if (it.swing && (c as Card).sw) cd *= 1 + it.swing[1] * (c as Card).sw!;
  let spd = 1;
  /* 疾速：冷却 -15%，开战 5 秒内再快一倍 / Swift: cooldown -15%, and twice as fast in the first 5 s of battle */
  if (a === 'swift') spd += 0.18 + (t != null && t < 5 ? 1 : 0);
  if (it.kind === 'potion' && c.loc === 'board') {
    const j = boardCards().filter((o) => ITEMS[o.key].kindHaste).length;
    if (j) spd += 0.06 * j * countKind('potion');
  }
  if (mv('t_last') && G.wall < G.wallMax * 0.35) spd += 0.25;
  spd = Math.max(0.3, spd + mv('spd') + fitSpd(c as Card));
  /* 军旗手：相邻的兵器卡暴击率加一截 / Standard-Bearer: adjacent weapon cards gain crit chance */
  let critNb = 0;
  if (it.kind === 'weapon' && c.loc === 'board') for (const n of c.nb || neighbors(c as Card)) critNb += (ITEMS[n.key].critNb || 0) * (1 + 0.5 * stepOf(n));
  return { base, flat, pct, psum, xs, mult, total, cd: Math.max(0.25, cd / spd), cdRaw: it.cd, crit: 0.05 + (a === 'precise' ? 0.2 : 0) + mv('crit') + critNb };
}

/** 占着棋盘正中（第 4、5 格） / occupies the board center (slots 4 and 5) */
export const isMid = (c: Card) => c.loc === 'board' && c.idx <= 4 && c.idx + c.size > 3;
/** C 位；还没立 C 位时，「为 C 位服务」的卡就服务棋盘上伤害最高的那张 / carry; until one is set, cards that 'serve the carry' serve the highest-damage card on the board */
export const carryCard = () =>
  G.cards.find((c) => c.carry && c.loc === 'board') ||
  boardCards()
    .filter((c) => ITEMS[c.key].dmg > 0)
    .sort((a, b) => stats(b, null).total / stats(b, null).cd - stats(a, null).total / stats(a, null).cd)[0] ||
  null;
/** 立 C 位：同一时间只有一张 / set the carry: only one at a time */
export function setCarry(c: Card) {
  for (const o of G.cards) if (o !== c) o.carry = false;
  c.carry = true;
}

/* ---------------- 价格 ---------------- / ---------------- Price ---------------- */
export const basePrice = (k: string, adj: string | null, tier: number) =>
  [3, 6, 10, 16][tier] + (ITEMS[k].size - 1) + (adj ? [1, 2, 3][ADJ[adj].r] : 0);
export const sellValue = (c: Card) => Math.max(1, Math.floor(basePrice(c.key, c.adj, c.tier) / 2)) + c.hoard;
