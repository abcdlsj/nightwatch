/* 备战规则：选门、加码、拿卡/卖卡/合成、拿遗物/学天赋。只改状态，界面由 app/ 刷新 / Prep rules: choose doors, modifiers, take/sell/merge cards, take relics/learn talents. Changes state only; app/ refreshes the UI */
import { ADJ, ITEMS } from '../data/cards';
import { EVENTS } from '../data/events';
import { EN, ELITES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import { WAGERS } from '../data/meta';
import { rand, rnd, pick, shuffled } from '../core/rng';
import { clamp } from '../core/util';
import { G, type Card, type Offer, type Wave, type Zone } from './state';
import { recalcMods } from './mods';
import { newCard, firstFit, countSame, zoneN } from './cards';
import { talentOk, type ItemFilter } from './loot';
import { cardOpen } from './unlocks';
import { foeKey } from './foes';

/* ---------------- 备战事件的条件 ---------------- / ---------------- Prep event conditions ---------------- */
export const EVENT_FILTER: Record<string, ItemFilter> = {
  smith: (it) => it.tag === 'blade' || it.tag === 'mech',
  forge: (it) => it.tag === 'fire',
  storm: (it) => it.tag === 'volt',
  frostshop: (it) => it.tag === 'ice',
  giant: (it) => it.size >= 2,
  armory: (it) => it.kind === 'weapon' || it.kind === 'firearm',
  apothecary: (it) => it.kind === 'potion' || it.kind === 'lamp',
};
/** 这个人物能买到的卡里，满足条件的有几张（专属卡要流派解锁） / how many of the cards this hero can buy meet the condition (exclusive cards need their archetype unlocked) */
const poolN = (f: ItemFilter) => Object.keys(ITEMS).filter((k) => !ITEMS[k].noPool && (!ITEMS[k].hero || ITEMS[k].hero === G.hero) && cardOpen(k) && f(ITEMS[k])).length;
/** 专卖店（铁匠铺、炼火工坊……）：这个人物能买的同类卡不到 4 张就不开 / specialty shop (smithy, fire forge…): does not open unless this hero has at least 4 buyable cards of that kind */
const shopOk = (id: string) => () => poolN(EVENT_FILTER[id]) >= 4;
const EVENT_NEED: Record<string, () => boolean> = {
  ...Object.fromEntries(Object.keys(EVENT_FILTER).map((id) => [id, shopOk(id)])),
  enchant: () => G.cards.length > 0,
  train: () => G.cards.some((c) => c.tier < 2),
  gamble: () => G.gold >= 3,
  spring: () => G.wall < G.wallMax,
  furnace: () => G.cards.length >= 2,
  mentor: () => Object.keys(TALENTS).some(talentOk),
  ambush: () => G.round !== 4 && (G.round < 8 || G.endless) && !(G.prep && G.prep.fought),
  refugee: () => G.cards.length >= 3,
  ritual: () => G.wallMax > 15,
  recycle: () => G.cards.some((c) => c.loc === 'stash'),
  hone: () => G.cards.some((c) => ITEMS[c.key].dmg > 0),
  pilgrim: () => G.cards.length > 0,
  swap: () => G.cards.some((c) => c.tier < 3),
  tutor: () => G.gold >= 5 && G.cards.some((c) => ITEMS[c.key].dmg > 0),
  drill: () => G.cards.some((c) => c.loc === 'board' && ITEMS[c.key].dmg > 0),
  /* 隐藏事件不进随机池，只由下面的 SECRET_DOORS 塞进来 / hidden events stay out of the random pool and are only inserted by SECRET_DOORS below */
  s_letter: () => false,
  s_karl: () => false,
  /* 规则遗物的匣子：不进随机池，由备战开头塞进来 / the rule-relic box: never in the random pool; inserted at the start of prep */
  rule: () => false,
};
/** 隐藏事件：条件写死，第一局就能触发 / hidden events: hard-coded conditions, triggerable from the first run */
const SECRET_DOORS: [string, () => boolean][] = [
  ['s_letter', () => G.hero === 'ying' && G.round >= 3 && !G.secret.letter && G.cards.some((c) => c.key === 'musicbox')],
  ['s_karl', () => G.hero === 'ayla' && !!G.secret.karlKill && !G.secret.karl],
];

/** 风向对应的专卖店，抽中的权重翻倍 / the specialty shop matching the wind gets double draw weight */
const WIND_SHOP: Partial<Record<string, string>> = { blade: 'smith', mech: 'smith', fire: 'forge', volt: 'storm', ice: 'frostshop' };
const doorW = (i: string) => EVENTS[i].w * (G.wind && WIND_SHOP[G.wind] === i ? 2 : 1);

export function rollDoors() {
  const R = G.round,
    P = G.prep;
  const ids = Object.keys(EVENTS).filter((id) => {
    const e = EVENTS[id];
    return (!e.minR || R >= e.minR) && (!EVENT_NEED[id] || EVENT_NEED[id]());
  });
  const isRare = (i: string) => EVENTS[i].cat === 'rare';
  const out: string[] = [];
  if (R === 1 && P.step === 0) out.push('shop', 'field');
  while (out.length < 3) {
    const pool = ids.filter((i) => !out.includes(i) && !(isRare(i) && (P.rare || out.some(isRare))));
    if (!pool.length) break;
    let t = rand() * pool.reduce((s, i) => s + doorW(i), 0);
    let got: string | null = null;
    for (const i of pool) {
      t -= doorW(i);
      if (t <= 0) {
        got = i;
        break;
      }
    }
    out.push(got || pool[pool.length - 1]);
  }
  if (!out.some((i) => EVENTS[i].cat === 'shop' || EVENTS[i].cat === 'free')) out[out.findIndex((i) => !isRare(i))] = 'shop';
  if (out.some(isRare)) P.rare = 1;
  P.doors = out.sort(() => rand() - 0.5);
  /* 隐藏事件：换掉一扇门，但保证至少还剩一家店或一份白给 / hidden events: replace a door but guarantee at least one shop or one freebie remains */
  if (P.step !== 0 || G.endless) return;
  const hit = SECRET_DOORS.find(([id, ok]) => ok() && !P.doors.includes(id));
  if (!hit) return;
  const keep = (i: string) => EVENTS[i].cat === 'shop' || EVENTS[i].cat === 'free';
  let at = P.doors.findIndex((i) => !keep(i));
  if (at < 0) at = P.doors.findIndex((i, k) => P.doors.some((j, m) => m !== k && keep(j)));
  if (at < 0) at = 0;
  P.doors[at] = hit[0];
}

/* ---------------- 加码 ---------------- / ---------------- Modifiers ---------------- */
export const rollWagers = () => shuffled(Object.keys(WAGERS)).slice(0, 2);

/** 蜂拥：敌人多三成 / Swarm: 30% more enemies */
export function hordeWave(w: Wave): Wave {
  const add = w
    .filter((s) => !EN[s.type].boss && !EN[s.type].elite && !noScale(s.type) && rand() < 0.3)
    .map((s) => Object.assign({}, s, { t: s.t + rnd(0.3, 1.2), x: clamp(s.x + rnd(-0.08, 0.08), 0.05, 0.95) }));
  const out = w.concat(add).sort((a, b) => a.t - b.t) as Wave;
  out.surges = w.surges;
  out.threats = w.threats;
  return out;
}
/** 这些敌人不随夜数加量 / these enemies do not scale in number with the night */
export const noScale = (t: string) => ['eye', 'knight', 'golem', 'siege', 'catapult', 'mimic', 'necro'].includes(t);

/* ---------------- 拦路 ---------------- / ---------------- Roadblock ---------------- */
export const ambushFoe = () => foeKey(pick(ELITES));
export const ambushGold = () => 3 + Math.floor(G.round / 2);
export function ambushWave(k: string): Wave {
  const S: Wave = [{ type: k, t: 1.2, x: 0.5, y: -0.04 }];
  for (const s of G.nextWave!) {
    if (s.t > 9) break;
    const d = EN[s.type];
    if (d.boss || d.elite || d.cargo) continue;
    S.push({ type: s.type, t: s.t + 2.5, x: s.x, y: s.y });
  }
  S.sort((a, b) => a.t - b.t);
  S.surges = [];
  return S;
}

/* ---------------- 拿东西 ---------------- / ---------------- Taking things ---------------- */
export function gainRelicState(r: string) {
  G.relics.push(r);
  const w = RELICS[r].m.wall;
  if (w) {
    G.wallMax = Math.max(5, G.wallMax + w);
    G.wall = w > 0 ? G.wall + w : Math.min(G.wall, G.wallMax);
  }
  recalcMods();
}

export function learnTalentState(id: string) {
  if (!talentOk(id)) return false;
  G.skills.push(id);
  const w = TALENTS[id].m.wall;
  if (w) {
    G.wallMax += w;
    G.wall += w;
  }
  recalcMods();
  return true;
}

export const removeCard = (c: Card) => {
  G.cards = G.cards.filter((x) => x !== c);
};

export type Dest = { z: Zone; i: number } | 'merge' | null;

/** 买下 / 拿走一张卡。dest 不给就自动找空位（或合成）。返回失败原因或新卡 / buy / take a card. Without dest, find a free slot automatically (or merge). Returns the failure reason or the new card */
export function acquireState(of: Offer, dest: Dest): { ok: true; card: Card } | { ok: false; why: 'gone' | 'full' | 'gold' } {
  if (of.sold || G.phase !== 'prep') return { ok: false, why: 'gone' };
  const canMerge = of.card.tier < 3 && countSame(of.card.key, of.card.tier) >= 1;
  if (!dest) {
    const fit = firstFit(of.card.size);
    dest = fit || (canMerge ? 'merge' : null);
    if (!dest) return { ok: false, why: 'full' };
  }
  if (G.gold < of.price) return { ok: false, why: 'gold' };
  G.gold -= of.price;
  of.sold = true;
  if (of.locked) {
    of.locked = false;
    G.lock = null;
  }
  const c = newCard(of.card.key, of.card.tier, of.card.adj);
  G.cards.push(c);
  if (dest === 'merge') {
    c.loc = 'temp';
    c.idx = -1;
  } else {
    c.loc = dest.z;
    c.idx = dest.i;
  }
  const cur = G.prep.cur;
  if (cur && (cur.mode === 'pick' || cur.mode === 'gift')) {
    cur.taken = true;
    cur.offers.forEach((o: Offer) => (o.sold = true));
  }
  return { ok: true, card: c };
}

/** 两张同名同品质合成下一档（背包里的也算）。返回每次合成留下的那张卡（按发生顺序） / merge two same-name, same-tier cards into the next tier (bag included). Returns the card left by each merge, in order */
export function checkMerges(): Card[] {
  const merged: Card[] = [];
  for (let guard = 0; guard < 8; guard++) {
    const groups: Record<string, Card[]> = {};
    for (const c of G.cards)
      if (c.tier < 3) {
        const k = c.key + '_' + c.tier;
        (groups[k] = groups[k] || []).push(c);
      }
    let did = false;
    for (const k in groups) {
      const g = groups[k];
      if (g.length < 2) continue;
      const rank = (c: Card) => (c.loc === 'board' ? 0 : c.loc === 'stash' ? 1 : 2);
      g.sort((a, b) => rank(a) - rank(b) || a.idx - b.idx);
      const [t, a] = g;
      const adjs = [t, a]
        .map((x) => x.adj)
        .filter(Boolean)
        .sort((x, y) => ADJ[y!].r - ADJ[x!].r);
      if (adjs.length) t.adj = adjs[0];
      t.hoard += a.hoard;
      t.grow = (t.grow || 0) + (a.grow || 0);
      t.qp = Math.max(t.qp || 0, a.qp || 0);
      if (a.carry) t.carry = true;
      t.star = Math.max(t.star || 0, a.star || 0);
      removeCard(a);
      t.tier++;
      if (t.loc === 'temp') {
        const f = firstFit(t.size);
        if (f) {
          t.loc = f.z;
          t.idx = f.i;
        }
      }
      merged.push(t);
      did = true;
      break;
    }
    if (!did) break;
  }
  G.cards.filter((c) => c.loc === 'temp').forEach(removeCard);
  return merged;
}

/* ---------------- 拖拽排列 ---------------- / ---------------- Drag arrangement ---------------- */
/** 插入排列：目标位置被占时，把两边的卡往外挤，腾出位置；挤不下才算失败 / insertion: when the target slot is occupied, push the cards on both sides outward to make room; only fail if there is no room */
export function insertPlan(z: Zone, i: number, size: number, ignore: Card | null) {
  const n = zoneN(z);
  const others = G.cards.filter((o) => o.loc === z && o !== ignore).sort((a, b) => a.idx - b.idx);
  if (others.reduce((s, o) => s + o.size, 0) + size > n) return null;
  const mid = i + size / 2;
  const items: { o: Card | null; p: number; s: number }[] = others.map((o) => ({ o, p: o.idx, s: o.size }));
  items.splice(items.filter((t) => t.p + t.s / 2 < mid).length, 0, { o: null, p: i, s: size });
  let end = 0;
  for (const t of items) {
    t.p = Math.max(t.p, end);
    end = t.p + t.s;
  }
  let st = n;
  for (let j = items.length - 1; j >= 0; j--) {
    const t = items[j];
    t.p = Math.min(t.p, st - t.s);
    st = t.p;
  }
  if (items[0].p < 0) return null;
  const me = items.find((t) => !t.o)!;
  return { i: me.p, moves: items.filter((t) => t.o && t.p !== t.o.idx).map((t) => [t.o, t.p] as [Card, number]) };
}

/** 新开一局时放下起手卡 / place the opening cards when a run starts */
export function placeKit(cards: [string, number][]) {
  let i = 3;
  for (const [key, t] of cards) {
    const c = newCard(key, t);
    c.loc = 'board';
    c.idx = i;
    i += c.size;
    G.cards.push(c);
  }
}

