/* 平衡模拟用的机器人：按流派偏好买卡、合成、摆棋盘、拿遗物、学天赋，然后无界面打完一整局。
 * 只调规则层和模拟层，不碰界面。策略不求最优，求「一个认真玩某流派的普通玩家」。 */
import { ITEMS } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { EVENTS } from '../../src/data/events';
import { HEROES, KITS } from '../../src/data/heroes';
import { FOESETS } from '../../src/data/enemies';
import type { Tag } from '../../src/data/types';
import { reseed, pick, rng } from '../../src/core/rng';
import { G, freshRun, type Card, type Offer } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { stats, sellValue, chainOf, zoneN, fits } from '../../src/game/cards';
import { rollGear, gearPrice, makeOffer, withFit, rollTalents } from '../../src/game/loot';
import { rollDoors, acquireState, checkMerges, removeCard, gainRelicState, learnTalentState, placeKit, EVENT_FILTER } from '../../src/game/prep';
import { nightRewards } from '../../src/game/rewards';
import { nightInfo } from '../../src/game/nights';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, settleWin } from '../../src/sim/battle';

export type Focus = Tag | 'any';

/** 一张卡大概值多少：输出卡看每秒伤害，辅助卡给个固定分 */
export function cardScore(c: Card, focus: Focus) {
  const it = ITEMS[c.key];
  let v: number;
  if (it.dmg > 0) {
    const st = stats(c, null);
    /* 第 3 夜起有护甲怪（骷髅 2 + 盾卫光环 3），单发小的卡打不动 */
    const armor = G.round >= 3 ? 4 + (it.pen || 0) * -1 : 0;
    const per = it.burn || it.poison ? st.total : Math.max(1, st.total - Math.max(0, armor));
    v = (per * (it.multi || 1)) / st.cd;
    if (it.chain != null || it.fx === 'bolt') v *= 1 + 0.6 * chainOf(c) * 0.6;
    if (it.aoe) v *= 1.8;
    if (it.pierce) v *= 1 + 0.25 * it.pierce;
    if (it.burn || it.poison) v *= 1.4;
    if (it.fx === 'bell' || it.fx === 'blizzard' || it.fx === 'sweep') v *= 2;
    if (it.ammo != null) v *= 0.6;
  } else v = 6 + 6 * c.tier;
  if (focus !== 'any' && it.tag === focus) v *= 2.2;
  return v / c.size;
}

/** 把最值钱的卡排上棋盘（按单格价值从高到低塞满 8 格），其余进背包，背包放不下就卖 */
function arrange(focus: Focus) {
  const all = G.cards.slice().sort((a, b) => cardScore(b, focus) * b.size - cardScore(a, focus) * a.size);
  for (const c of all) {
    c.loc = null;
    c.idx = -1;
  }
  let used = 0;
  const chosen: Card[] = [];
  for (const c of all)
    if (used + c.size <= 8) {
      chosen.push(c);
      used += c.size;
    }
  /* 输出卡按分数排，辅助卡（充能、增伤、齐鸣、回响）插在最强的输出卡两边 */
  const isSup = (c: Card) => ITEMS[c.key].dmg === 0 || c.adj === 'echo';
  const dmgCards = chosen.filter((c) => !isSup(c));
  const sups = chosen.filter(isSup);
  const order: Card[] = [];
  dmgCards.forEach((c, i) => {
    if (i === 0 && sups.length) order.push(sups.shift()!);
    order.push(c);
    if (sups.length) order.push(sups.shift()!);
  });
  order.push(...sups);
  let x = 0;
  for (const c of order) {
    c.loc = 'board';
    c.idx = x;
    x += c.size;
  }
  let s = 0;
  for (const c of all) {
    if (c.loc) continue;
    if (s + c.size <= zoneN('stash')) {
      c.loc = 'stash';
      c.idx = s;
      s += c.size;
    } else {
      G.gold += sellValue(c);
      removeCard(c);
    }
  }
  recalcMods();
}

function offerWorth(of: Offer, focus: Focus) {
  const tmp = { ...of.card, loc: 'board', nb: [], grow: 0, stk: 0, mom: 0 } as unknown as Card;
  const dup = G.cards.some((c) => c.key === of.card.key && c.tier === of.card.tier);
  return cardScore(tmp, focus) * of.card.size * (dup ? 1.8 : 1);
}

/** 买得起、值得买就买：能合成的、棋盘还有空位的、比最弱那张好的 */
function buyFrom(offers: Offer[], focus: Focus, free: boolean) {
  for (let guard = 0; guard < 4; guard++) {
    const board = G.cards.filter((c) => c.loc === 'board');
    const used = board.reduce((s2, c) => s2 + c.size, 0);
    const weakest = board.length ? Math.min(...board.map((c) => cardScore(c, focus) * c.size)) : 0;
    const cands = offers
      .filter((o) => !o.sold && o.price <= G.gold)
      .filter((o) => {
        const dup = G.cards.some((c) => c.key === o.card.key && c.tier === o.card.tier);
        return free || dup || used + o.card.size <= 8 || offerWorth(o, focus) > weakest;
      })
      .sort((x, y) => offerWorth(y, focus) - offerWorth(x, focus));
    const of = cands[0];
    if (!of) return;
    let r = acquireState(of, null);
    if (!r.ok && r.why === 'full') {
      const w = G.cards.slice().sort((x, y) => cardScore(x, focus) * x.size - cardScore(y, focus) * y.size)[0];
      if (w) {
        G.gold += sellValue(w);
        removeCard(w);
        r = acquireState(of, null);
      }
    }
    if (!r.ok) return;
    checkMerges();
    arrange(focus);
    if (free) return;
  }
}

function relicWorth(k: string, focus: Focus) {
  const m = RELICS[k].m;
  let v = 0;
  for (const [key, val] of Object.entries(m)) {
    if (key === 'dmg' || key === 'spd' || key === 'crit' || key === 'critDmg') v += val * 10;
    else if (focus !== 'any' && key === 'tag_' + focus) v += val * 12;
    else if (key === 'chain' && focus === 'volt') v += val * 3;
    else if (key === 'wall' || key === 'shieldStart' || key === 'regen') v += val * 0.2;
    else if (key.startsWith('t_')) v += 1.5;
    else v += Math.abs(val) * 2;
  }
  return v + RELICS[k].t;
}
const takeRelic = (list: string[], focus: Focus) => {
  const k = list.slice().sort((a, b) => relicWorth(b, focus) - relicWorth(a, focus))[0];
  if (k) gainRelicState(k);
};

const SHOP_FOR: Record<string, string[]> = {
  blade: ['smith', 'armory'], mech: ['smith'], fire: ['forge'], volt: ['storm'], ice: ['frostshop'], poison: ['apothecary'], any: [],
};

function prep(focus: Focus) {
  G.phase = 'prep';
  G.prep = { step: 0, cur: null, doors: [], talk: G.round % 2 === 1 };
  if (G.prep.talk) {
    const picks = rollTalents(3, 'atk');
    if (picks.length) learnTalentState(picks[0]);
  }
  for (let step = 0; step < 3; step++) {
    G.prep.step = step;
    rollDoors();
    const rich = G.gold >= 14;
    const pref = [...SHOP_FOR[focus], ...(rich ? ['black', 'grocer'] : []), 'shop', 'giant', 'altar', 'field', 'train', 'grocer', 'chest', 'parcel', 'black', 'armory', 'forge', 'storm', 'smith', 'frostshop', 'apothecary', 'job', 'bank'];
    const d = G.prep.doors.slice().sort((a, b) => ((pref.indexOf(a) + 99) % 140) - ((pref.indexOf(b) + 99) % 140))[0];
    const ev = EVENTS[d];
    if (!ev) continue;
    if (ev.cat === 'shop') {
      let offers = [0, 1, 2].map(() => makeOffer(EVENT_FILTER[d], { black: ev.black }));
      buyFrom(offers, focus, false);
      offers = [0, 1, 2].map(() => makeOffer(EVENT_FILTER[d], { black: ev.black }));
      buyFrom(offers, focus, false);
    } else if (d === 'field') buyFrom([0, 1, 2].map(() => makeOffer(null, { free: 1 })), focus, true);
    else if (d === 'chest') buyFrom([makeOffer(null, { free: 1 })], focus, true);
    else if (d === 'altar') takeRelic(withFit(rollGear(3, 0, 2)), focus);
    else if (d === 'parcel') takeRelic(withFit(rollGear(1, 1, 2), 0.3), focus);
    else if (d === 'grocer') {
      const goods = withFit(rollGear(3, 1));
      const k = goods.sort((a, b) => relicWorth(b, focus) - relicWorth(a, focus))[0];
      for (const g2 of goods.sort((a, b) => relicWorth(b, focus) - relicWorth(a, focus)))
        if (G.gold >= gearPrice(g2)) {
          G.gold -= gearPrice(g2);
          gainRelicState(g2);
        }
      void k;
    } else if (d === 'train') {
      const c = G.cards.filter((x) => x.tier < 2 && x.loc === 'board').sort((a, b) => cardScore(b, focus) - cardScore(a, focus))[0];
      if (c) {
        c.tier++;
        checkMerges();
      }
    } else if (d === 'job') G.gold += 3;
    else if (d === 'bank') G.gold += Math.max(2, Math.min(10, Math.round(G.gold * 0.3)));
    arrange(focus);
  }
}

export interface NightLog {
  r: number;
  result: 'win' | 'lose';
  t: number;
  kills: number;
  wall: number;
  maxHit: number;
  maxChain: number;
  topCard: string;
  topShare: number;
  board: string;
  gold: number;
}
export interface RunLog {
  hero: string;
  focus: Focus;
  seed: number;
  win: boolean;
  night: number;
  nights: NightLog[];
  board: string[];
  relics: string[];
}

function battle(r: number): NightLog {
  G.phase = 'battle';
  const wave = makeWave(r);
  startBattle({ wave, ambush: false, wager: null, beats: nightInfo(r).beats });
  let steps = 0;
  while (!B!.over && steps < 60 * 400) {
    simStep(1 / 60);
    steps++;
  }
  const b = B!;
  const tot = G.cards.reduce((s, c) => s + c.bDmg, 0) || 1;
  const top = G.cards.slice().sort((a, z) => z.bDmg - a.bDmg)[0];
  const log: NightLog = {
    r, result: b.result || 'lose', t: Math.round(b.t), kills: b.kills, wall: Math.round(G.wall), maxHit: Math.round(b.maxHit), maxChain: b.maxChain,
    topCard: top ? top.key + '@' + top.tier : '-', topShare: top ? Math.round((top.bDmg / tot) * 100) : 0,
    board: G.cards.filter((c) => c.loc === 'board').map((c) => `${c.key}@${c.tier}:${Math.round(c.bDmg)}`).join(' '), gold: G.gold,
  };
  if (b.result === 'win') {
    settleWin();
    const gold = nightRewards(r, b.wallLost).reduce((s, x) => s + x[1], 0);
    G.gold += gold;
  }
  return log;
}

export function playRun(hero: string, focus: Focus, seed: number, opts: { heat?: number } = {}): RunLog {
  reseed(seed);
  const H = HEROES[hero];
  Object.assign(G, {
    hero, heat: opts.heat || 0, run: freshRun(), round: 1, maxRound: 8, endless: false, lock: null, fightWave: null, gold: H.gold, wall: H.wall, wallMax: H.wall,
    cards: [], relics: [], skills: [], bestChain: 0, secret: {}, seenFoes: {}, foeSet: pick(Object.keys(FOESETS)), boss8: pick(['eye', 'brood']), speed: 1,
  });
  void rng;
  const kits = KITS[hero];
  /* 起手：挑和流派最搭的一套 */
  const kit = kits.slice().sort((a, b) => kitFit(b.cards, focus) - kitFit(a.cards, focus))[0];
  placeKit(kit.cards);
  if (kit.gold) G.gold = Math.max(0, G.gold + kit.gold);
  recalcMods();
  const nights: NightLog[] = [];
  for (let r = 1; r <= 8; r++) {
    G.round = r;
    prep(focus);
    const n = battle(r);
    nights.push(n);
    if (n.result !== 'win') return done(false, r);
  }
  return done(true, 8);
  function done(win: boolean, night: number): RunLog {
    return {
      hero, focus, seed, win, night, nights,
      board: G.cards.filter((c) => c.loc === 'board').map((c) => c.key + '@' + c.tier),
      relics: G.relics.slice(),
    };
  }
}
const kitFit = (cards: [string, number][], focus: Focus) => cards.filter(([k]) => focus === 'any' || ITEMS[k].tag === focus).length;

export { fits };
