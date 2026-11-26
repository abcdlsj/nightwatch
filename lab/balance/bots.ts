/**
 * Nightwatch Balance Lab — Full-Fidelity Headless Game Driver & 4-Tier Player Personas
 *
 * Uses 100% REAL `src/sim/`, `src/game/`, and `src/data/` modules with zero rule drift.
 * Models 4 distinct player archetypes for an auto-battler deckbuilder:
 *   1. novice_random    — Ignores text/synergies/positions, clicks loosely, weak merging
 *   2. reader_basic     — Carefully reads cards, sticks to kit/wind, basic adjacency & merges
 *   3. skilled_builder  — Builds 4/6-tag synergies or reactions, respects positions/interest/multipliers
 *   4. master_optimizer — Exact spatial board permutation, chain/echo hunting, strategic wagers & economy
 */
import { ITEMS, ADJ, ADJ_NODMG } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { TALENTS } from '../../src/data/talents';
import { EVENTS } from '../../src/data/events';
import { HEROES, KITS, PATHS, AWAKEN, AWAKEN_NIGHT } from '../../src/data/heroes';
import { FOESETS, EN } from '../../src/data/enemies';
import { WAGERS, SYN, SYN2, MAST_LV } from '../../src/data/meta';
import type { Tag, Kind } from '../../src/data/types';
import { initLocale } from '../../src/i18n';
import { setStorage } from '../../src/platform/storage';
import { reseed, rand, pick, shuffled } from '../../src/core/rng';
import { G, freshRun, heat, type Card, type Offer } from '../../src/game/state';
import { META, mastStart } from '../../src/game/meta';
import { recalcMods, mv, afford } from '../../src/game/mods';
import {
  newCard,
  stats,
  sellValue,
  basePrice,
  chainOf,
  zoneN,
  setCarry,
  boardCards,
  neighbors,
  firstFit,
  isMid,
  countKind,
  countTag,
  stepOf,
} from '../../src/game/cards';
import {
  rollGear,
  gearPrice,
  makeOffer,
  withFit,
  rollTalents,
  refreshCost,
  freeCap,
  rollWind,
  rollAdj,
  rollItem,
  rollRule,
  steerOffers,
  lockedOffers,
  wpick,
  RULE_NIGHTS,
} from '../../src/game/loot';
import {
  rollDoors,
  acquireState,
  checkMerges,
  removeCard,
  gainRelicState,
  learnTalentState,
  placeKit,
  EVENT_FILTER,
  trainCap,
  intactNeed,
  rollWagers,
  hordeWave,
  STACK_GOLD,
  stackRelic,
  ambushFoe,
  ambushWave,
  ambushGold,
} from '../../src/game/prep';
import { pathsOf, pathOpen, pathOf } from '../../src/game/unlocks';
import { nightRewards } from '../../src/game/rewards';
import { nightInfo } from '../../src/game/nights';
import { finalBosses, lastNight, jumpNights, nightKind, GEM_NIGHTS } from '../../src/game/plan';
import { synCount, synPairs } from '../../src/game/synergy';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, settleWin, setOnEnd } from '../../src/sim/battle';
import { TUNE } from '../../src/game/tuning';

export type Persona = 'novice_random' | 'reader_basic' | 'skilled_builder' | 'master_optimizer';

export interface RunOpts {
  hero: string;
  persona: Persona;
  seed: number;
  heat?: number;
  full?: boolean;
  kitIdx?: number;
  targetPath?: string;
  foeSet?: 'dark' | 'frost' | 'auto';
  boss9?: string;
  mastLv?: number;
  /** Whether all hero paths & heroes are unlocked in card pool (default true; false simulates brand-new account) */
  unlockAll?: boolean;
  tuneOverride?: Partial<typeof TUNE>;
}

export interface RunResult {
  hero: string;
  persona: Persona;
  seed: number;
  heat: number;
  full: boolean;
  win: boolean;
  nightReached: number;
  wallLeft: number;
  wallMax: number;
  totalWallLost: number;
  kills: number;
  maxHit: number;
  maxChain: number;
  maxCombo: number;
  rxTotal: number;
  ultTotal: number;
  foeSet: string;
  boss9: string;
  kitPath: string;
  wind: string;
  awaken: string;
  wagersWon: number;
  ambushesWon: number;
  finalBoard: Array<{ key: string; tier: number; adj: string | null; carry: boolean; idx: number; dmg: number }>;
  relics: string[];
  ruleRelics: string[];
  talents: string[];
  lostThreat: string;
  lostToEnemy: string;
  nightSurvived: number[]; // 1 if survived night i+1, else 0
}

export interface FixedBoardCard {
  key: string;
  tier: number;
  adj?: string | null;
  carry?: boolean;
  star?: number;
  grow?: number;
  vet?: number;
}

export interface FixedNightOpts {
  hero: string;
  night: number;
  seed: number;
  heat?: number;
  full?: boolean;
  foeSet?: 'dark' | 'frost';
  boss9?: string;
  boss12?: string;
  awaken?: string;
  board: FixedBoardCard[];
  relics: string[];
  talents: string[];
  wallBonus?: number;
  tuneOverride?: Partial<typeof TUNE>;
}

export interface FixedNightResult {
  win: boolean;
  wallLost: number;
  wallLeft: number;
  wallMax: number;
  duration: number;
  kills: number;
  totalDmg: number;
  dps: number;
  maxHit: number;
  maxChain: number;
  rxN: number;
  stkN: number;
  threats: string[];
  boss: string;
  cardDmgs: Record<string, number>;
  /** Continuous performance score for surrogate search & optimization */
  score: number;
}

let headlessInited = false;
const BASE_TUNE = { ...TUNE };

export function initHeadless() {
  if (headlessInited) return;
  headlessInited = true;
  setStorage({
    get: () => null,
    set: () => {},
    del: () => {},
  });
  initLocale();
  setOnEnd(() => {});
}

function resetTune(override?: Partial<typeof TUNE>) {
  Object.assign(TUNE, BASE_TUNE);
  if (override) Object.assign(TUNE, override);
}

/** Element reaction pairings */
const REACTION_PARTNERS: Record<Tag, Tag[]> = {
  fire: ['ice', 'volt', 'poison'],
  ice: ['fire', 'volt', 'blade'],
  volt: ['fire', 'ice'],
  poison: ['fire'],
  blade: ['ice'],
  mech: [],
};

/** Primary tags associated with each hero path */
export const PATH_MAIN_TAGS: Record<string, Tag[]> = {
  // ayla
  blade: ['blade'],
  oil: ['fire'],
  drill: ['blade', 'mech'],
  // mo
  elem: ['fire', 'ice'],
  poison: ['poison'],
  storm: ['volt'],
  // ying
  lamp: ['fire', 'mech'],
  gear: ['mech'],
  cracker: ['fire'],
  // jun
  turret: ['mech', 'fire'],
  works: ['mech', 'blade', 'ice'],
  line: ['fire', 'mech'],
  // li
  chart: ['volt', 'ice', 'mech'],
  frost: ['ice'],
  meteor: ['fire', 'volt'],
};

function setupMeta(hero: string, mastLv: number, unlockAll: boolean) {
  META.runs = unlockAll ? 20 : 1;
  META.heroes = unlockAll
    ? { ayla: 1, mo: 1, ying: 1, jun: 1, li: 1 }
    : { [hero]: 1 };
  const pts = mastLv <= 0 ? 0 : MAST_LV[Math.min(mastLv, MAST_LV.length) - 1];
  if (unlockAll) {
    // Allow all hero paths to be unlocked without granting free mastStart perks unless mastLv > 0
    META.mast = { ayla: pts, mo: pts, ying: pts, jun: pts, li: pts };
  } else {
    META.mast = { [hero]: pts };
  }
}

/* ---------------- Card & Build Valuation ---------------- */

function getHeroPreferredTags(hero: string, kitPath: string, persona: Persona): Tag[] {
  const base = PATH_MAIN_TAGS[kitPath] ? [...PATH_MAIN_TAGS[kitPath]] : [];
  if (G.wind && !base.includes(G.wind as Tag)) {
    if (persona === 'reader_basic') {
      // careful reader follows kit first, wind second
      base.push(G.wind as Tag);
    } else if (persona === 'skilled_builder' || persona === 'master_optimizer') {
      // skilled/master weighs wind strongly if compatible
      base.push(G.wind as Tag);
    }
  }
  return base.length ? base : ['blade'];
}

function getActiveMainTag(preferred: Tag[]): Tag {
  const counts = synCount();
  let best: Tag = preferred[0] || 'blade';
  let bestN = -1;
  for (const [t, n] of Object.entries(counts)) {
    if ((n || 0) > bestN) {
      bestN = n || 0;
      best = t as Tag;
    }
  }
  return best;
}

/** Estimate single-card combat value on a board context */
function estimateCardValue(c: Card, preferred: Tag[], persona: Persona): number {
  const it = ITEMS[c.key];
  if (persona === 'novice_random') {
    // Novice overvalues tier & shiny big raw damage, ignores CD/synergy/hooks
    return (it.dmg > 0 ? it.dmg * (1 + c.tier * 0.8) : 6 + c.tier * 4) / Math.pow(c.size, 0.5);
  }

  const st = stats(c, null);
  let val = 0;

  if (it.dmg > 0) {
    // Armor resistance scaling
    const armor = G.round >= 6 ? 5 : G.round >= 3 ? 3 : 0;
    const pen = (it.pen || 0) + (it.armorMul ? 10 : 0) + mv('pen');
    const effArmor = Math.max(0, armor - pen);
    const perHit = it.burn || it.poison ? st.total : Math.max(1, st.total - effArmor * 0.7);
    let multi = it.multi || 1;
    if (it.kindMulti) multi += Math.min(3, countKind(it.kindMulti, c));
    if (it.nbMulti) multi += 2;
    let dps = (perHit * multi) / Math.max(0.25, st.cd);
    dps *= 1 + st.crit * (1 + mv('critDmg'));

    // Attack mode scaling
    if (it.aoe) dps *= 1 + Math.min(2.2, (it.aoe / 16) * (1 + mv('aoe')));
    if (it.fx === 'bell' || it.fx === 'blizzard' || it.fx === 'rain' || it.fx === 'avalanche') dps *= 2.3;
    if (it.fx === 'sweep' || it.fx === 'discharge') dps *= 1.85;
    if (it.fx === 'firefly') dps *= 2.2;
    if (it.fx === 'slash' || it.fx === 'fslash') dps *= 1.45;
    if (it.pierce) dps *= 1 + 0.3 * Math.min(5, it.pierce);
    if (it.chain != null || it.fx === 'bolt') {
      const ch = it.chainCrowd ? Math.min(it.chainCrowd, 6) : chainOf(c);
      dps *= 1 + 0.55 * Math.min(6, ch);
    }
    if (it.burn) dps += ((it.burn * (1 + 0.6 * stepOf(c)) * (1 + mv('burn'))) * (it.aoe ? 2.5 : 1.3)) / Math.max(0.5, st.cd) * 1.4;
    if (it.poison) dps += ((it.poison * (1 + 0.6 * stepOf(c)) * (1 + mv('poison'))) * (it.aoe || it.fx === 'rain' ? 2.8 : 1.5)) / Math.max(0.5, st.cd) * 1.7;
    if (it.poisonX) dps *= 1.9;
    if (it.slow) dps *= 1 + it.slow * 0.7;
    if (it.freeze || it.slowFrz) dps *= 1.35;
    if (it.zone) dps *= 1.35;
    if (it.shieldGain) dps += it.shieldGain * (1 + 0.4 * stepOf(c)) * 1.8;
    if (it.shieldDmg) dps *= 1.45;
    if (it.overkill || it.boomer) dps *= 1.25;
    if (it.bossMul || it.exec) dps *= 1.2;
    if (it.onChain) dps *= 1.25;
    if (it.asCarry && c.carry) dps *= 1.35;
    if (it.quest) dps *= 1.35;
    if (it.grow) dps *= 1.25;
    if (it.ammo != null) {
      // Check if we have a reloader
      const hasReloader = G.cards.some((o) => ITEMS[o.key].reload);
      dps *= hasReloader ? 1.05 : 0.62;
    }
    if (c.carry) dps *= 1.35;
    val = dps;
  } else {
    // Support card valuation
    const tierScale = 1 + 0.45 * stepOf(c);
    let sup = 9 * tierScale;
    if (it.horn) sup = 26 * tierScale;
    else if (it.triggerCarry) sup = 32 * tierScale;
    else if (it.chargeCarry) sup = 25 * tierScale;
    else if (it.charge || it.chargeAll || it.chargeSmall || it.chargeHasted) sup = 20 * tierScale;
    else if (it.buff || it.buffCarry || it.stackCarry) sup = 18 * tierScale;
    else if (it.hasteNb || it.hasteKind || it.hasteSmall || it.hasteCarry) sup = 19 * tierScale;
    else if (it.prism || it.fuse) sup = 20 * tierScale;
    else if (it.detonate || it.detonateP) sup = 22 * tierScale;
    else if (it.shieldGain) sup = 14 * tierScale;
    else if (it.reload) {
      const hasAmmo = G.cards.some((o) => ITEMS[o.key].ammo != null);
      sup = hasAmmo ? 24 * tierScale : 9 * tierScale;
    } else if (it.auraNb || it.critNb || it.posBoost) sup = 18 * tierScale;
    else if (it.passive) sup = 17 * tierScale;

    // Scale support value with board DPS in later rounds
    const roundMul = 0.75 + G.round * 0.22;
    val = sup * roundMul;
    // Cap support saturation if too many supports already
    const supCount = G.cards.filter((o) => o.loc === 'board' && ITEMS[o.key].dmg === 0 && o !== c).length;
    if (supCount >= 3) val *= 0.55;
  }

  // Affix valuation
  if (c.adj) {
    if (c.adj === 'deadly') val *= 1.48;
    else if (c.adj === 'echo') val *= persona === 'master_optimizer' ? 1.75 : persona === 'skilled_builder' ? 1.55 : 1.25;
    else if (c.adj === 'twin') val *= 1.25;
    else if (c.adj === 'swift') val *= 1.28;
    else if (c.adj === 'heavy') val *= 1.18;
    else if (c.adj === 'precise') val *= 1.16;
    else if (c.adj === 'resonance') val *= 1.18;
    else if (c.adj === 'fiery' || c.adj === 'frosty' || c.adj === 'toxic' || c.adj === 'thunder') val *= 1.22;
    else if (c.adj === 'golden') val *= G.round <= 5 ? 1.18 : 1.04;
    else val *= 1.1;
  }

  // Synergy & Hero Nature bonuses
  if (persona !== 'novice_random') {
    const tagMatch = preferred.includes(it.tag);
    const windMatch = G.wind === it.tag || G.wind2 === it.tag;
    const mainTag = getActiveMainTag(preferred);
    const rxPartner = REACTION_PARTNERS[mainTag]?.includes(it.tag);

    if (tagMatch) val *= persona === 'reader_basic' ? 1.45 : 1.65;
    else if (windMatch) val *= 1.35;
    else if (persona !== 'reader_basic' && rxPartner) val *= 1.28;

    // Hero nature alignment
    if (G.hero === 'ying' && c.size === 1) val *= persona === 'reader_basic' ? 1.2 : 1.45;
    if (G.hero === 'ayla' && c.vet && c.vet >= 2) val *= 1 + Math.min(0.45, c.vet * 0.08);
    if (G.hero === 'li' && (it.chargeCarry || it.buffCarry || it.critCarry || it.freezeCarry || it.stackCarry || it.triggerCarry)) {
      val *= 1.35;
    }
    if (G.hero === 'mo' && (it.tag === 'fire' || it.tag === 'ice' || it.tag === 'volt' || it.tag === 'poison')) {
      val *= 1.15;
    }
    if (G.hero === 'jun' && (it.posMid || it.posEdge || it.flank || it.shieldGain || it.shieldDmg)) {
      val *= 1.2;
    }
  }

  return val / c.size;
}

/** Compute full-board spatial score for skilled/master board arrangement */
function evaluateBoardArrangement(cards: Card[], preferred: Tag[], persona: Persona): number {
  let x = 0;
  for (const c of cards) {
    c.loc = 'board';
    c.idx = x;
    x += c.size;
  }
  recalcMods();

  let score = 0;
  let dmgCount = 0;
  let supCount = 0;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const it = ITEMS[c.key];
    const nb = neighbors(c);
    c.nb = nb;

    const baseVal = estimateCardValue(c, preferred, persona) * c.size;
    if (it.dmg > 0) {
      dmgCount++;
      score += baseVal;
      // Positional multipliers
      if (it.posMid && isMid(c)) score += baseVal * it.posMid * 0.9;
      if (it.posEdge && (i === 0 || i === cards.length - 1)) score += baseVal * it.posEdge * 0.9;
      if (it.flank && nb.length === 2 && nb.every((n) => ITEMS[n.key].dmg === 0)) score += baseVal * it.flank * 0.9;
      if (it.lineKind) {
        const lk = nb.filter((n) => ITEMS[n.key].kind === it.lineKind!.kind).length;
        score += baseVal * it.lineKind.pct * lk * 0.7;
      }
    } else {
      supCount++;
      score += baseVal * 0.5;
    }

    // Adjacency synergy
    if (it.charge || it.buff || it.horn || it.hasteNb || it.prism || it.auraNb || it.critNb || it.reload || it.nbMulti) {
      for (const n of nb) {
        const nit = ITEMS[n.key];
        const nVal = nit.dmg > 0 ? estimateCardValue(n, preferred, persona) * n.size : 8;
        if (it.horn) {
          score += nVal * (nit.onChain ? 0.85 : nit.chainMulti ? 0.75 : 0.45);
        }
        if (it.charge && (!it.chargeKind || nit.kind === it.chargeKind)) {
          score += nVal * (it.chargeBig && n.size === 3 ? 0.5 : 0.3);
        }
        if (it.buff) score += nVal * 0.32;
        if (it.hasteNb) score += nVal * (nit.hasteMul ? 0.6 : 0.28);
        if (it.prism && ['fire', 'ice', 'volt'].includes(nit.tag)) score += nVal * 0.35;
        if (it.auraNb && nit.dmg > 0) score += nVal * it.auraNb * (isMid(c) ? 1.8 : 0.9);
        if (it.critNb && nit.kind === 'weapon') score += nVal * 0.25;
        if (it.reload && nit.ammo != null) score += nVal * 0.7;
      }
    }
    if (c.key === 'beacontower' && nb.length === 2) {
      score += 22;
    }
    if (c.key === 'tent' && isMid(c)) {
      score += 25;
    }
    if (c.adj === 'echo') {
      // Echo adjacent to fast cards or another echo is huge!
      for (const n of nb) {
        const nSt = stats(n, null);
        if (n.adj === 'echo') score += 55;
        else score += (20 / Math.max(0.5, nSt.cd)) * (ITEMS[n.key].dmg > 0 ? 1.1 : 0.8);
      }
    }
    if (c.adj === 'ignite' && i + 1 < cards.length) {
      const right = cards[i + 1];
      if (ITEMS[right.key].dmg > 0) score += 10;
    }
    if (c.adj === 'resonance') {
      const sameNb = nb.filter((n) => ITEMS[n.key].tag === it.tag).length;
      score += sameNb * 10;
    }
    // Li's nature: carryNb — fast cards next to carry!
    if (G.hero === 'li' && c.carry) {
      for (const n of nb) {
        const nCd = ITEMS[n.key].cd || 2;
        score += 18 / Math.max(0.6, nCd);
      }
    }
    // Ayla's Old Habits: reward keeping cards in their vetAt slot!
    if (G.hero === 'ayla' && c.vet && c.vetAt === c.idx) {
      score += c.vet * 8;
    }
    // Left / right relic/talent bonuses
    if (i === 0 && mv('left') && it.dmg > 0) score += baseVal * mv('left') * 0.8;
    if (i === cards.length - 1 && mv('right') && it.dmg > 0) score += baseVal * mv('right') * 0.8;
  }

  // Synergy & reaction bonuses
  const sc = synCount();
  for (const [tag, cnt] of Object.entries(sc)) {
    const n = cnt || 0;
    if (n >= 6) score *= 1.24;
    else if (n >= 4) score *= 1.12;
    else if (n >= 2) score *= 1.04;
    void tag;
  }
  const pairs = synPairs(sc);
  if (pairs.length) score *= 1 + Math.min(0.22, pairs.length * 0.08);
  // Reward element reactions if Mo or fire+ice / fire+volt / fire+poison / ice+volt
  if (persona === 'skilled_builder' || persona === 'master_optimizer') {
    const tags = new Set(cards.filter((c) => ITEMS[c.key].dmg > 0).map((c) => ITEMS[c.key].tag));
    if (tags.has('fire') && tags.has('ice')) score *= 1.07;
    if (tags.has('volt') && (tags.has('fire') || tags.has('ice'))) score *= 1.06;
    if (tags.has('fire') && tags.has('poison')) score *= 1.06;
  }
  // Penalize 0-damage boards!
  if (dmgCount === 0) score *= 0.05;
  if (supCount > dmgCount + 1 && G.hero !== 'li') score *= 0.78;

  return score;
}

/** Arrange cards onto board (8 slots) and stash (4 slots) according to persona skill */
function arrangeBoard(preferred: Tag[], persona: Persona, optimizeOrder = true) {
  const all = G.cards.slice();
  if (!all.length) return;

  for (const c of all) {
    c.loc = null;
    c.idx = -1;
    c.nb = null;
  }

  if (persona === 'novice_random') {
    // Novice just puts highest-tier / newest cards on board in arbitrary order
    const sorted = all.slice().sort((a, b) => b.tier - a.tier || ITEMS[b.key].dmg - ITEMS[a.key].dmg);
    let x = 0;
    for (const c of sorted) {
      if (x + c.size <= 8) {
        c.loc = 'board';
        c.idx = x;
        x += c.size;
      }
    }
    packStashAndSell(all, preferred, persona);
    recalcMods();
    return;
  }

  // Choose subset for the 8-slot board using greedy / knapsack
  // First score every card independently
  const scored = all
    .map((c) => ({ c, v: estimateCardValue(c, preferred, persona) * c.size }))
    .sort((a, b) => b.v - a.v);

  let chosen: Card[] = [];
  if (persona === 'reader_basic' || !optimizeOrder) {
    let used = 0;
    for (const { c } of scored) {
      if (used + c.size <= 8) {
        chosen.push(c);
        used += c.size;
      }
    }
    // Simple arrangement: put supports next to strongest attacker
    const isSup = (c: Card) => ITEMS[c.key].dmg === 0 || c.adj === 'echo';
    const dmgs = chosen.filter((c) => !isSup(c));
    const sups = chosen.filter(isSup);
    const order: Card[] = [];
    dmgs.forEach((c, i) => {
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
    packStashAndSell(all, preferred, persona);
    recalcMods();
    return;
  }

  // Skilled & Master: subset selection + spatial permutation optimization!
  // 0-1 knapsack on size <= 8 (exact DP since max slots = 8, n <= 12)
  const cap = 8;
  const n = scored.length;
  // Build candidate subsets: greedy + top DP knapsack + keeping carry & echo cards
  const dp: { val: number; items: Card[] }[] = Array.from({ length: cap + 1 }, () => ({ val: -1, items: [] }));
  dp[0] = { val: 0, items: [] };
  for (let i = 0; i < n; i++) {
    const { c, v } = scored[i];
    const w = c.size;
    for (let s = cap; s >= w; s--) {
      if (dp[s - w].val >= 0 && dp[s - w].val + v > dp[s].val) {
        dp[s] = { val: dp[s - w].val + v, items: [...dp[s - w].items, c] };
      }
    }
  }
  let bestDp = dp[0];
  for (let s = 1; s <= cap; s++) if (dp[s].val > bestDp.val) bestDp = dp[s];
  chosen = bestDp.items.slice();

  // Guarantee at least one damage card if any exists
  if (chosen.every((c) => ITEMS[c.key].dmg === 0)) {
    const firstDmg = scored.find((x) => ITEMS[x.c.key].dmg > 0);
    if (firstDmg) {
      chosen = [firstDmg.c];
      let used = firstDmg.c.size;
      for (const { c } of scored) {
        if (c !== firstDmg.c && used + c.size <= 8) {
          chosen.push(c);
          used += c.size;
        }
      }
    }
  }

  // Spatial permutation search
  let bestOrder = chosen.slice();
  let bestScore = evaluateBoardArrangement(bestOrder, preferred, persona);

  if (chosen.length >= 2) {
    if (persona === 'master_optimizer' && chosen.length <= 6) {
      // Exact permutation search up to 6 cards (<= 720 perms) — super fast!
      const perm = chosen.slice();
      const searchPerm = (k: number) => {
        if (k === perm.length) {
          const sc = evaluateBoardArrangement(perm, preferred, persona);
          if (sc > bestScore) {
            bestScore = sc;
            bestOrder = perm.slice();
          }
          return;
        }
        for (let i = k; i < perm.length; i++) {
          [perm[k], perm[i]] = [perm[i], perm[k]];
          searchPerm(k + 1);
          [perm[k], perm[i]] = [perm[i], perm[k]];
        }
      };
      // Limit to <= 5 cards exact (120 perms), else pairwise hill-climb
      if (chosen.length <= 5) {
        searchPerm(0);
      } else {
        bestOrder = hillClimbOrder(chosen, preferred, persona);
      }
    } else {
      bestOrder = hillClimbOrder(chosen, preferred, persona);
    }
  }

  // Commit bestOrder
  for (const c of all) {
    c.loc = null;
    c.idx = -1;
    c.nb = null;
  }
  let x = 0;
  for (const c of bestOrder) {
    c.loc = 'board';
    c.idx = x;
    x += c.size;
  }
  packStashAndSell(all, preferred, persona);
  recalcMods();
}

function hillClimbOrder(chosen: Card[], preferred: Tag[], persona: Persona): Card[] {
  const order = chosen.slice();
  let bestScore = evaluateBoardArrangement(order, preferred, persona);
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        [order[i], order[j]] = [order[j], order[i]];
        const sc = evaluateBoardArrangement(order, preferred, persona);
        if (sc > bestScore + 0.01) {
          bestScore = sc;
          improved = true;
        } else {
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
    }
    if (!improved) break;
  }
  return order;
}

function packStashAndSell(all: Card[], preferred: Tag[], persona: Persona) {
  const remaining = all
    .filter((c) => !c.loc)
    .sort((a, b) => estimateCardValue(b, preferred, persona) - estimateCardValue(a, preferred, persona));
  let s = 0;
  for (const c of remaining) {
    // Master/skilled sells low-value non-mergeable stash cards if gold is below interest threshold
    const hasPairCandidate = G.cards.some((o) => o !== c && o.key === c.key && o.tier <= c.tier);
    if (s + c.size <= zoneN('stash') && (persona === 'novice_random' || hasPairCandidate || c.tier >= 1 || c.adj === 'echo' || c.adj === 'deadly')) {
      c.loc = 'stash';
      c.idx = s;
      s += c.size;
    } else if (!ITEMS[c.key].noSell) {
      G.gold += sellValue(c);
      removeCard(c);
    } else if (s + c.size <= zoneN('stash')) {
      c.loc = 'stash';
      c.idx = s;
      s += c.size;
    }
  }
}

/* ---------------- Relic, Talent, Awakening Valuation ---------------- */

function scoreRelic(k: string, preferred: Tag[], persona: Persona): number {
  const r = RELICS[k];
  if (!r) return 0;
  if (persona === 'novice_random') return rand() * 10 + r.t;

  const m = r.m;
  const mainTag = getActiveMainTag(preferred);
  let v = r.t * 2.5;

  // Rule relics
  if (r.rule) {
    const boardTags = new Set(boardCards().filter((c) => ITEMS[c.key].dmg > 0).map((c) => ITEMS[c.key].tag));
    const hasRx = ['fire', 'ice', 'volt', 'poison'].filter((t) => boardTags.has(t as Tag)).length >= 2;
    if (k === 'resfork') return hasRx ? 28 : 6;
    if (k === 'reagent') return hasRx ? 24 : 5;
    if (k === 'kiln') return boardTags.has('fire') ? 26 : 4;
    if (k === 'duet') return boardTags.size >= 2 ? 25 : 7;
    if (k === 'ringwall') return boardCards().length >= 4 ? 22 : 10;
    if (k === 'rallyhorn') return 21;
    if (k === 'metronome') return boardCards().some((c) => ITEMS[c.key].cd <= 1.5) ? 20 : 12;
    if (k === 'linkage') {
      const hasChain = boardCards().some((c) => c.adj === 'echo' || ITEMS[c.key].horn || ITEMS[c.key].triggerCarry);
      return hasChain ? 30 : 9;
    }
  }

  for (const [mk, val] of Object.entries(m)) {
    if (mk === 'xdmg') v += val * 85;
    else if (mk === 'xcarry') v += val * (G.hero === 'li' ? 95 : 55);
    else if (mk.startsWith('xtag_')) {
      const tg = mk.slice(5) as Tag;
      const cnt = countTag(tg);
      v += val * (cnt >= 2 || preferred.includes(tg) ? 80 : 15);
    } else if (mk === 'dmg') v += val * 32;
    else if (mk === 'spd') v += val * 42;
    else if (mk === 'crit') v += val * 35;
    else if (mk === 'critDmg') v += val * 12;
    else if (mk.startsWith('tag_')) {
      const tg = mk.slice(4) as Tag;
      v += val * (preferred.includes(tg) || tg === mainTag ? 36 : 6);
    } else if (mk.startsWith('tspd_')) {
      const tg = mk.slice(5) as Tag;
      v += val * (preferred.includes(tg) || tg === mainTag ? 42 : 6);
    } else if (mk.startsWith('kspd_')) {
      const kd = mk.slice(5) as Kind;
      v += val * (countKind(kd) >= 1 ? 38 : 6);
    } else if (mk === 's1') v += val * (G.hero === 'ying' ? 45 : 18);
    else if (mk === 's2') v += val * 22;
    else if (mk === 's3') v += val * (boardCards().some((c) => c.size === 3) ? 35 : 8);
    else if (mk === 'chain') v += val * (preferred.includes('volt') ? 10 : 2);
    else if (mk === 'burn') v += val * (preferred.includes('fire') ? 10 : 2);
    else if (mk === 'slow' || mk === 'slowVuln') v += val * (preferred.includes('ice') ? 16 : 3);
    else if (mk === 'aoe') v += val * 18;
    else if (mk === 'pen') v += val * 3.5;
    else if (mk === 'startCharge') v += val * 25;
    else if (mk === 'full') v += val * 30;
    else if (mk === 'left' || mk === 'right') v += val * 16;
    else if (mk === 'wall') {
      if (val < 0 && G.wallMax + val < 12) v -= 25;
      else v += val * (G.hero === 'jun' ? 1.2 : 0.45);
    } else if (mk === 'shieldStart' || mk === 'regen') v += val * 0.9;
    else if (mk === 'interest' || mk === 'winGold') v += val * (G.round <= 5 ? 3.5 : 0.8);
    else if (mk === 'killGold') v += val * (G.round <= 5 ? 120 : 25);
    else if (mk === 'enemySpd') v -= val * 45;
    else if (mk.startsWith('t_')) v += 8;
  }

  // Skilled/master penalize glass cannon if wall is low
  if (k === 'glass' && G.wall <= 14) v -= 20;
  return v;
}

function scoreTalent(id: string, preferred: Tag[], persona: Persona): number {
  const T = TALENTS[id];
  if (!T) return 0;
  if (persona === 'novice_random') return rand() * 10;
  let v = T.r * 3;
  for (const [mk, val] of Object.entries(T.m)) {
    if (mk === 'xcarry') v += val * 90;
    else if (mk === 'dmg') v += val * 35;
    else if (mk === 'spd') v += val * 45;
    else if (mk === 'crit') v += val * 35;
    else if (mk === 'critDmg') v += val * 12;
    else if (mk.startsWith('tag_')) {
      const tg = mk.slice(4) as Tag;
      v += val * (preferred.includes(tg) ? 38 : 6);
    } else if (mk === 's1') v += val * (G.hero === 'ying' ? 45 : 15);
    else if (mk === 's2' || mk === 's3') v += val * 22;
    else if (mk === 'startCharge') v += val * 26;
    else if (mk === 'pen') v += val * 4;
    else if (mk === 'full') v += val * 28;
    else if (mk === 'left' || mk === 'right') v += val * 16;
    else if (mk === 'chain') v += val * (preferred.includes('volt') ? 10 : 2);
    else if (mk === 'burn') v += val * (preferred.includes('fire') ? 10 : 2);
    else if (mk === 'slow' || mk === 'slowVuln') v += val * (preferred.includes('ice') ? 16 : 3);
    else if (mk === 'aoe') v += val * 18;
    else if (mk === 'wall' || mk === 'shieldStart' || mk === 'regen') v += val * (G.wall < G.wallMax * 0.65 ? 1.5 : 0.65);
    else if (mk === 'interest' || mk === 'winGold') v += val * (G.round <= 5 ? 3.5 : 0.8);
    else if (mk === 't_sweep' || mk === 't_bloodlust' || mk === 't_opener') v += 11;
    else if (mk === 't_echo' || mk === 't_revenge' || mk === 't_last') v += 7;
  }
  return v;
}

function pickAwaken(hero: string, persona: Persona): string {
  const opts = AWAKEN[hero];
  if (!opts || !opts.length) return '';
  if (persona === 'novice_random') return pick(opts).id;
  if (hero === 'ayla') return 'ayla_b'; // vetCd (+4% spd per vet night) scales great
  if (hero === 'mo') return 'mo_b'; // rxQuick (0.5 -> 0.2s cd) or mo_a (+15% rxCharge)
  if (hero === 'ying') return 'ying_b'; // +5% dmg per small card
  if (hero === 'jun') return G.round <= 6 ? 'jun_a' : 'jun_a'; // +3% per 10 maxWall
  if (hero === 'li') return 'li_b'; // carryGrow x1.08 per night (independent mult!)
  return opts[0].id;
}

/* ---------------- Buying & Prep Decisions ---------------- */

function offerScore(of: Offer, preferred: Tag[], persona: Persona): number {
  const tmp = { ...of.card, loc: 'board', idx: 0, nb: [], grow: 0, stk: 0, mom: 0 } as unknown as Card;
  let score = estimateCardValue(tmp, preferred, persona) * of.card.size;
  const dup = G.cards.some((c) => c.key === of.card.key && c.tier === of.card.tier && c.tier < 3);
  if (dup) {
    score *= persona === 'novice_random' ? 1.15 : persona === 'reader_basic' ? 1.75 : 2.25;
  }
  // Check if buying reaches 2/4/6 synergy
  if (persona === 'skilled_builder' || persona === 'master_optimizer') {
    const cnt = synCount()[ITEMS[of.card.key].tag] || 0;
    if (cnt === 1 || cnt === 3 || cnt === 5) score *= 1.18;
  }
  return score;
}

function buyOffers(offers: Offer[], preferred: Tag[], persona: Persona, free: boolean) {
  for (let guard = 0; guard < 4; guard++) {
    const board = boardCards();
    const used = board.reduce((s, c) => s + c.size, 0);
    const weakest = board.length
      ? Math.min(...board.map((c) => estimateCardValue(c, preferred, persona) * c.size))
      : 0;

    // Interest preservation for skilled/master (every 6g = +1g interest, up to 3+mv('interest'))
    const maxIntGold = (3 + mv('interest')) * 6;
    const minGoldReserve =
      persona === 'master_optimizer' && G.round >= 2 && G.round <= 6 && used >= 6
        ? Math.min(maxIntGold, Math.floor(G.gold / 6) * 6)
        : 0;

    const cands = offers
      .filter((o) => !o.sold && (free || afford(o.price)))
      .filter((o) => {
        if (free) return true;
        if (persona === 'novice_random') return rand() < 0.7;
        const dup = G.cards.some((c) => c.key === o.card.key && c.tier === o.card.tier && c.tier < 3);
        const worth = offerScore(o, preferred, persona);
        // Protect interest breakpoint unless it's a merge, empty slot, or big upgrade
        if (minGoldReserve > 0 && G.gold - o.price < minGoldReserve && !dup && worth < weakest * 1.45) {
          return false;
        }
        const bar = G.gold >= 14 ? weakest * 0.72 : weakest * 0.95;
        return dup || used + o.card.size <= 8 || worth > bar;
      })
      .sort((a, b) => offerScore(b, preferred, persona) - offerScore(a, preferred, persona));

    const of = cands[0];
    if (!of) break;

    let res = acquireState(of, null);
    if (!res.ok && res.why === 'full') {
      // Sell weakest non-carry card if new offer is better or merges
      const sellable = G.cards
        .filter((c) => !ITEMS[c.key].noSell && !c.carry)
        .sort((a, b) => estimateCardValue(a, preferred, persona) * a.size - estimateCardValue(b, preferred, persona) * b.size);
      const victim = sellable[0];
      if (victim) {
        G.gold += sellValue(victim);
        removeCard(victim);
        res = acquireState(of, null);
      }
    }
    if (!res.ok) break;
    checkMerges();
    arrangeBoard(preferred, persona, false);
    if (free) return;
  }

  // Master/skilled locks an unaffordable merge or echo/deadly card for next shop
  if (!free && !G.lock && (persona === 'skilled_builder' || persona === 'master_optimizer')) {
    const lockable = offers
      .filter((o) => !o.sold && o.price > G.gold)
      .filter((o) => {
        const dup = G.cards.some((c) => c.key === o.card.key && c.tier === o.card.tier && c.tier < 3);
        return dup || o.card.adj === 'echo' || o.card.adj === 'deadly';
      })
      .sort((a, b) => offerScore(b, preferred, persona) - offerScore(a, preferred, persona))[0];
    if (lockable) {
      G.lock = { card: { ...lockable.card }, price: lockable.price, sold: false };
    }
  }
}

function doTalk(preferred: Tag[], persona: Persona, mastLv: number) {
  let cat: 'atk' | 'def' | 'tech' | 'eco' = 'atk';
  if (persona === 'novice_random') {
    cat = pick(['atk', 'def', 'tech', 'eco']);
  } else if (G.wall < G.wallMax * 0.55) {
    cat = 'def';
  } else if (G.round <= 3) {
    cat = persona === 'master_optimizer' ? 'tech' : 'atk';
  } else {
    cat = G.hero === 'jun' ? 'def' : 'atk';
  }

  // Real talkReward(cat) from actions.ts
  if (cat === 'atk') {
    const tags = boardCards().map((c) => ITEMS[c.key].tag);
    const main = tags.sort((a, b) => tags.filter((x) => x === b).length - tags.filter((x) => x === a).length)[0];
    const of = makeOffer(main ? (it) => it.tag === main && it.dmg > 0 : null, { free: 1 });
    const r = acquireState(of, null);
    if (r.ok) {
      checkMerges();
      arrangeBoard(preferred, persona);
    } else {
      G.gold += 4;
    }
  } else if (cat === 'def') {
    G.wallMax += 4;
    G.wall += 4;
  } else if (cat === 'tech') {
    const r = rollGear(1, 0, 1)[0];
    if (r) gainRelicState(r);
    else G.gold += 5;
  } else {
    G.gold += 5;
  }

  const picks = rollTalents((heat(8) ? 2 : 3) + (mastLv >= 2 ? 1 : 0), cat);
  if (picks.length) {
    const best = picks.slice().sort((a, b) => scoreTalent(b, preferred, persona) - scoreTalent(a, preferred, persona))[0];
    learnTalentState(best);
  }
}

function doJump(preferred: Tag[], persona: Persona) {
  const h = G.hero;
  const dmgs = boardCards()
    .filter((c) => ITEMS[c.key].dmg > 0)
    .sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size);

  if (h === 'mo') {
    const tags: Tag[] = ['fire', 'ice', 'volt', 'poison'];
    const tg =
      persona === 'novice_random'
        ? pick(tags)
        : preferred.find((t) => tags.includes(t)) ||
          (dmgs.find((c) => tags.includes(ITEMS[c.key].tag)) ? ITEMS[dmgs.find((c) => tags.includes(ITEMS[c.key].tag))!.key].tag : 'fire');
    const of = makeOffer((it) => it.tag === tg && it.dmg > 0, { free: 1 });
    of.card.tier = Math.min(Math.max(freeCap(), ITEMS[of.card.key].t), of.card.tier + 1);
    const r = acquireState(of, null);
    if (!r.ok) G.gold += 5;
    checkMerges();
    arrangeBoard(preferred, persona);
    const best = boardCards()
      .filter((c) => ITEMS[c.key].tag === tg && ITEMS[c.key].dmg > 0)
      .sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0];
    if (best) setCarry(best);
    recalcMods();
    return;
  }

  if (h === 'ying') {
    const smalls = boardCards()
      .filter((c) => c.size === 1)
      .sort((a, b) => b.tier - a.tier || estimateCardValue(b, preferred, persona) - estimateCardValue(a, preferred, persona));
    const c = smalls[0] || dmgs[0];
    const cap = G.round >= 7 ? 3 : 2;
    if (c) {
      if (c.tier < cap) {
        c.tier++;
        G.gold += 3;
      } else {
        const p = pathsOf('ying').find((x) => x.cards.includes(c.key) && pathOpen('ying', x));
        const of = makeOffer((it) => it.size === 1 && it.hero === 'ying' && (!p || p.cards.some((k) => ITEMS[k] === it)), { free: 1 });
        if (!acquireState(of, null).ok) G.gold += 5;
      }
      checkMerges();
      arrangeBoard(preferred, persona, false);
    }
    return;
  }

  const cur = boardCards().find((c) => c.carry);
  const c =
    h === 'li' && cur && persona !== 'novice_random'
      ? cur
      : persona === 'novice_random'
        ? pick(dmgs.length ? dmgs : boardCards())
        : dmgs[0];
  if (!c) return;
  setCarry(c);
  if (h === 'ayla') c.grow = (c.grow || 0) + 4 + G.round;
  else if (h === 'jun') {
    const n = 2 + G.round;
    G.wallMax += n;
    G.wall += n;
  } else if (h === 'li') {
    c.star = cur === c ? (c.star || 0) + 1 : Math.max(c.star || 0, 1);
  }
  recalcMods();
}

function doMason(preferred: Tag[], persona: Persona) {
  if (G.run) G.run.intact = Math.max(0, (G.run.intact || 0) - intactNeed());
  const upCands = boardCards()
    .filter((c) => c.tier < 3)
    .sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size);
  if (persona === 'novice_random') {
    if (rand() < 0.4 && upCands.length) {
      pick(upCands).tier++;
      checkMerges();
    } else if (rand() < 0.5) {
      G.wallMax += 6;
      G.wall += 6;
    } else {
      G.gold += 8;
    }
    return;
  }
  if (upCands.length && (upCands[0].tier >= 1 || G.round >= 4)) {
    upCands[0].tier++;
    checkMerges();
    arrangeBoard(preferred, persona);
  } else if (G.hero === 'jun' || G.wall < G.wallMax * 0.7) {
    G.wallMax += 6;
    G.wall += 6;
  } else {
    G.gold += 8;
  }
}

const SHOP_FOR_TAG: Record<Tag, string[]> = {
  blade: ['smith', 'armory'],
  mech: ['smith'],
  fire: ['forge'],
  volt: ['storm'],
  ice: ['frostshop'],
  poison: ['apothecary'],
};

function doorScore(id: string, preferred: Tag[], persona: Persona): number {
  if (persona === 'novice_random') return rand() * 10;
  const needHeal = G.wall < G.wallMax * (persona === 'reader_basic' ? 0.55 : 0.45);
  const rich = G.gold >= 14;
  const boardUsed = boardCards().reduce((s, c) => s + c.size, 0);

  if (needHeal && (id === 'spring' || id === 'camp')) return 95;
  if (id === 'oracle') return persona === 'master_optimizer' ? 88 : 72;
  if (id === 'mirror') return G.wallMax >= 22 && boardCards().some((c) => c.tier >= 2) ? 84 : 30;
  if (id === 'altar') return 78;
  if (id === 'mentor') return 74;
  if (id === 'tutor') return G.gold >= 7 && boardCards().some((c) => ITEMS[c.key].dmg > 0 && !c.adj) ? 82 : 25;
  if (id === 'inscribe') return boardCards().some((c) => !c.adj) ? 70 : 35;
  if (id === 'train') return G.cards.some((c) => c.loc === 'board' && c.tier < trainCap()) ? 73 : 20;
  if (id === 'quench') return G.cards.some((c) => c.loc === 'board' && c.tier < 3 && c.adj && ADJ[c.adj].r === 0) ? 75 : 22;
  if (id === 'hone') return boardCards().some((c) => ITEMS[c.key].dmg > 0) ? 62 : 20;
  if (id === 'drill') return !boardCards().some((c) => c.carry) ? 76 : 20;
  if (id === 'grocer') return rich ? 80 : 40;
  if (id === 'black') return rich ? 77 : 32;
  if (id === 'parcel') return 66;
  if (id === 'manual') return 68;
  if (id === 'pilgrim') return 64;
  if (id === 'field') return boardUsed < 8 ? 72 : 55;
  if (id === 'chest') return 58;
  if (id === 'shop') return G.gold >= 6 ? 71 : 42;
  for (const tg of preferred) {
    if (SHOP_FOR_TAG[tg]?.includes(id)) return G.gold >= 6 ? 76 : 45;
  }
  if (id === 'ambush') {
    // Master hunts ambush only on mid-game with strong high-tier board & full wall
    const highTiers = boardCards().filter((c) => c.tier >= 1).length;
    if (persona === 'master_optimizer' && G.round >= 4 && G.round <= 6 && G.wall >= G.wallMax * 0.85 && boardUsed >= 7 && highTiers >= 3) {
      return 68;
    }
    return 14;
  }
  if (id === 'ritual') return G.wallMax >= 24 && persona !== 'reader_basic' ? 68 : 24;
  if (id === 'furnace') return G.cards.some((c) => c.loc === 'stash') ? 65 : 22;
  if (id === 'brickyard') return G.wall >= 22 && persona === 'master_optimizer' ? 60 : 15;
  if (id === 'bank') return G.gold >= 12 ? 56 : 30;
  if (id === 'job') return 38;
  if (id === 'camp') return 54;
  if (id === 'enchant') return 52;
  if (id === 'graft') return 35;
  if (id === 'recycle') return G.cards.filter((c) => c.loc === 'stash').length >= 2 ? 55 : 18;
  if (id === 'scrap') return 22;
  if (id === 'swap') return 34;
  if (id === 'refugee') return 20;
  if (id === 'gamble') return 25;
  if (EVENTS[id]?.cat === 'shop') return G.gold >= 8 ? 50 : 28;
  return 30;
}

function executeDoor(d: string, preferred: Tag[], persona: Persona, runAmbush: () => boolean) {
  const ev = EVENTS[d];
  if (!ev) return;

  if (ev.cat === 'shop') {
    let offers = [0, 1, 2].map(() => makeOffer(EVENT_FILTER[d], { black: ev.black }));
    if (d === 'shop') offers = steerOffers(offers);
    offers = lockedOffers(offers);
    if (d === 'auction') {
      const of = makeOffer(null, { black: 1 });
      of.price = Math.round(of.price * 1.2);
      offers = [of];
    }
    buyOffers(offers, preferred, persona, false);

    // Reroll logic
    const maxRerolls =
      d === 'auction'
        ? 0
        : persona === 'novice_random'
          ? 0
          : persona === 'reader_basic'
            ? 1
            : persona === 'skilled_builder'
              ? 1
              : 2;
    for (let rr = 0; rr < maxRerolls; rr++) {
      const rc = refreshCost(rr);
      if (G.gold >= rc + (persona === 'master_optimizer' ? 6 : 5)) {
        G.gold -= rc;
        offers = [0, 1, 2].map(() => makeOffer(EVENT_FILTER[d], { black: ev.black }));
        buyOffers(offers, preferred, persona, false);
      } else {
        break;
      }
    }
  } else if (d === 'field') {
    buyOffers([0, 1, 2].map(() => makeOffer(null, { free: 1 })), preferred, persona, true);
  } else if (d === 'chest') {
    buyOffers([makeOffer(null, { free: 1 })], preferred, persona, true);
  } else if (d === 'pilgrim') {
    buyOffers([0, 1].map(() => makeOffer((it) => it.hero === G.hero, { free: 1 })), preferred, persona, true);
  } else if (d === 'manual') {
    if (rand() < 0.5) {
      const picks = rollTalents(2);
      if (picks.length) learnTalentState(picks.sort((a, b) => scoreTalent(b, preferred, persona) - scoreTalent(a, preferred, persona))[0]);
    } else {
      buyOffers([0, 1].map(() => makeOffer((it) => it.hero === G.hero && it.t >= Math.min(1, freeCap()), { free: 1 })), preferred, persona, true);
    }
  } else if (d === 'mentor') {
    const picks = rollTalents(2);
    if (picks.length) learnTalentState(picks.sort((a, b) => scoreTalent(b, preferred, persona) - scoreTalent(a, preferred, persona))[0]);
  } else if (d === 'altar') {
    const list = withFit(rollGear(3, 0, 2));
    const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
    if (best) gainRelicState(best);
  } else if (d === 'parcel') {
    const list = withFit(rollGear(1, 1, 2), 0.3);
    const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
    if (best) gainRelicState(best);
  } else if (d === 'oracle') {
    const list = rollRule(3);
    const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
    if (best) gainRelicState(best);
  } else if (d === 'grocer') {
    const goods = withFit(rollGear(3, 1)).sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona));
    for (const g of goods) {
      const p = gearPrice(g);
      if (afford(p) && (persona === 'novice_random' || scoreRelic(g, preferred, persona) >= 8)) {
        G.gold -= p;
        gainRelicState(g);
      }
    }
  } else if (d === 'train') {
    const pool = shuffled(G.cards.filter((c) => c.tier < trainCap())).slice(0, 3);
    const best = pool.sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0];
    if (best) {
      best.tier++;
      checkMerges();
    }
  } else if (d === 'enchant') {
    const pool = shuffled(G.cards).slice(0, 3);
    const target = pool.sort((a, b) => (!a.adj ? 1 : 0) - (!b.adj ? 1 : 0) || estimateCardValue(b, preferred, persona) - estimateCardValue(a, preferred, persona))[0];
    if (target) {
      const a = rollAdj(target.key, true, target.adj, 1);
      if (a) target.adj = a;
    }
  } else if (d === 'inscribe') {
    const hasDmg = G.cards.some((c) => ITEMS[c.key].dmg > 0);
    const affs = shuffled(Object.keys(ADJ).filter((a) => ADJ[a].r < 2 && (hasDmg || ADJ_NODMG.includes(a)))).slice(0, 3);
    if (rand() < 0.35) {
      const rarePool = Object.keys(ADJ).filter((a) => ADJ[a].r === 2 && !affs.includes(a));
      if (rarePool.length) affs[2] = wpick(rarePool);
    }
    const rankAdj = (a: string) => (a === 'echo' ? 100 : a === 'deadly' ? 95 : a === 'twin' ? 80 : a === 'swift' ? 70 : a === 'heavy' ? 60 : 50);
    const chosenAdj = persona === 'novice_random' ? pick(affs) : affs.sort((a, b) => rankAdj(b) - rankAdj(a))[0];
    const ok = G.cards.filter((c) => c.adj !== chosenAdj && (ITEMS[c.key].dmg > 0 || ADJ_NODMG.includes(chosenAdj)));
    const target = ok.sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0];
    if (target && chosenAdj) target.adj = chosenAdj;
  } else if (d === 'quench') {
    const pool = shuffled(G.cards.filter((c) => c.tier < 3 && c.adj)).slice(0, 3);
    const best = pool
      .filter((c) => c.adj !== 'echo' && c.adj !== 'deadly')
      .sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0];
    if (best) {
      best.tier++;
      best.adj = null;
      checkMerges();
    }
  } else if (d === 'tutor') {
    const dmgs = G.cards.filter((c) => ITEMS[c.key].dmg > 0).sort((a, b) => stats(b, null).total - stats(a, null).total).slice(0, 3);
    if (dmgs.length && afford(5)) {
      const c = dmgs[0];
      const pool = Object.keys(ADJ).filter((k) => ADJ[k].r === 2 && k !== c.adj);
      if (pool.length) {
        G.gold -= 5;
        c.adj = wpick(pool);
      }
    }
  } else if (d === 'hone') {
    const dmgs = G.cards.filter((c) => ITEMS[c.key].dmg > 0).sort((a, b) => stats(b, null).total - stats(a, null).total).slice(0, 3);
    if (dmgs.length) {
      const c = dmgs.sort((a, b) => (b.carry ? 1 : 0) - (a.carry ? 1 : 0) || stats(a, null).cd - stats(b, null).cd)[0];
      c.grow = (c.grow || 0) + 3 + G.round;
    }
  } else if (d === 'drill') {
    const dmgs = boardCards().filter((c) => ITEMS[c.key].dmg > 0).sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size);
    if (dmgs.length) setCarry(dmgs[0]);
  } else if (d === 'furnace') {
    const pool = shuffled(G.cards).slice(0, 4);
    const victim = pool.sort((a, b) => estimateCardValue(a, preferred, persona) * a.size - estimateCardValue(b, preferred, persona) * b.size)[0];
    if (victim && G.cards.length >= 2 && !victim.carry) {
      removeCard(victim);
      const list = withFit(rollGear(3, 3));
      const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
      if (best) gainRelicState(best);
    }
  } else if (d === 'ritual') {
    if (G.wallMax > 15) {
      G.wallMax = Math.max(5, G.wallMax - 5);
      G.wall = Math.min(G.wall, G.wallMax);
      const list = withFit(rollGear(3, 2));
      const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
      if (best) gainRelicState(best);
    }
  } else if (d === 'mirror') {
    const pool = shuffled(G.cards).slice(0, 3);
    const best = pool.sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0];
    if (best && G.wallMax > 12) {
      const spot = firstFit(best.size);
      if (spot) {
        const n = newCard(best.key, best.tier, null);
        n.loc = spot.z;
        n.idx = spot.i;
        G.cards.push(n);
        G.wallMax = Math.max(5, G.wallMax - 4);
        G.wall = Math.min(G.wall, G.wallMax);
        checkMerges();
      }
    }
  } else if (d === 'spring') {
    G.wall = Math.min(G.wallMax, G.wall + 8);
  } else if (d === 'camp') {
    if (G.wall < G.wallMax * 0.65) {
      G.wall = Math.min(G.wallMax, G.wall + 6);
    } else {
      const picks = rollTalents(2);
      if (picks.length) learnTalentState(picks.sort((a, b) => scoreTalent(b, preferred, persona) - scoreTalent(a, preferred, persona))[0]);
    }
  } else if (d === 'brickyard') {
    if (G.wall > 14) {
      if (G.wall >= 20 && G.cards.some((c) => c.tier < 3)) {
        const pool = shuffled(G.cards.filter((c) => c.tier < 3)).slice(0, 3);
        if (pool.length) {
          G.wall -= 10;
          pool.sort((a, b) => estimateCardValue(b, preferred, persona) * b.size - estimateCardValue(a, preferred, persona) * a.size)[0].tier++;
          checkMerges();
        }
      } else {
        G.wall -= 6;
        G.gold += 9;
      }
    }
  } else if (d === 'job') {
    G.gold += 3;
  } else if (d === 'bank') {
    G.gold += Math.max(2, Math.min(10, Math.round(G.gold * 0.3)));
  } else if (d === 'recycle') {
    const bag = G.cards.filter((c) => c.loc === 'stash');
    const g = bag.reduce((s, c) => s + basePrice(c.key, c.adj, c.tier), 0);
    bag.forEach(removeCard);
    G.gold += g;
  } else if (d === 'scrap') {
    const pool = shuffled(G.cards).slice(0, 4);
    const victim = pool.sort((a, b) => estimateCardValue(a, preferred, persona) - estimateCardValue(b, preferred, persona))[0];
    if (victim && G.cards.length >= 3 && !victim.carry) {
      G.gold += basePrice(victim.key, victim.adj, victim.tier);
      removeCard(victim);
    }
  } else if (d === 'swap') {
    const pool = shuffled(G.cards.filter((c) => c.tier < 3 && !c.carry)).slice(0, 3);
    const victim = pool.sort((a, b) => estimateCardValue(a, preferred, persona) - estimateCardValue(b, preferred, persona))[0];
    if (victim) {
      const k = rollItem((it) => it.size === victim.size && it !== ITEMS[victim.key]);
      victim.key = k;
      victim.tier = Math.min(3, Math.max(victim.tier, ITEMS[k].t) + 1);
      victim.qp = 0;
      checkMerges();
    }
  } else if (d === 'ambush') {
    runAmbush();
  }
}

/* ---------------- Main Full-Run Simulator ---------------- */

export function playFullRun(opts: RunOpts): RunResult {
  initHeadless();
  resetTune(opts.tuneOverride);

  const hero = opts.hero;
  const persona = opts.persona;
  const heatLv = opts.heat ?? 0;
  const full = !!opts.full;
  const mastLv = opts.mastLv ?? 0;
  const unlockAll = opts.unlockAll ?? true;

  setupMeta(hero, mastLv, unlockAll);
  reseed(opts.seed);

  const H = HEROES[hero];
  const wallStart = Math.round(H.wall * (heatLv >= 4 ? 0.8 : 1));
  Object.assign(G, {
    hero,
    seed: opts.seed,
    heat: heatLv,
    run: freshRun(),
    round: 1,
    maxRound: full ? 15 : 9,
    endless: false,
    lock: null,
    fightWave: null,
    gold: H.gold,
    wall: wallStart,
    wallMax: wallStart,
    cards: [],
    relics: [],
    skills: [],
    bestChain: 0,
    secret: {},
    seenFoes: {},
    foeSet: '',
    ws: {},
    speed: 1,
    full,
    gems: {},
    arc: 0,
    wind: '',
    wind2: '',
    omen: '',
    rot: null,
    windRelic: false,
    awaken: '',
    daily: '',
    dailyFight: 0,
    kitPath: '',
  });

  G.foeSet =
    opts.foeSet && opts.foeSet !== 'auto'
      ? opts.foeSet
      : pick(Object.keys(FOESETS).filter((k) => !FOESETS[k].world));
  G.boss9 = opts.boss9 || pick(finalBosses());
  G.boss12 = pick(finalBosses().filter((k) => k !== G.boss9));
  G.wind = rollWind();
  G.maxRound = lastNight();

  // Select starting kit
  const kits = KITS[hero];
  let kit = kits[0];
  if (opts.kitIdx != null && kits[opts.kitIdx]) {
    kit = kits[opts.kitIdx];
  } else if (opts.targetPath) {
    kit = kits.find((k) => k.path === opts.targetPath) || kits[0];
  } else if (!unlockAll) {
    kit = kits[0];
  } else if (persona === 'novice_random') {
    kit = pick(kits);
  } else {
    // Pick kit that matches wind if available, else rotate deterministically by seed
    const windKit = kits.find((k) => PATH_MAIN_TAGS[k.path]?.includes(G.wind as Tag));
    kit = windKit || kits[opts.seed % kits.length];
  }

  G.kitPath = kit.path;
  placeKit(kit.cards);
  if (kit.gold) G.gold = Math.max(0, G.gold + kit.gold);
  if (mastLv > 0) mastStart();
  recalcMods();

  const preferred = getHeroPreferredTags(hero, kit.path, persona);
  const last = lastNight();
  const nightSurvived = Array(last).fill(0);
  let rxTotal = 0;
  let ultTotal = 0;
  let wagersWon = 0;
  let ambushesWon = 0;
  let lostThreat = '';
  let lostToEnemy = '';

  const runAmbushFight = (): boolean => {
    G.prep.fought = true;
    const foe = ambushFoe();
    const w = ambushWave(foe);
    G.phase = 'battle';
    startBattle({ wave: w, ambush: true, wagers: [], beats: [] });
    let steps = 0;
    while (!B!.over && steps < 60 * 300) {
      simStep(1 / 60);
      steps++;
    }
    const b = B!;
    G.phase = 'prep';
    settleWin();
    if (b.result === 'win') {
      G.gold += ambushGold();
      if (!b.fled) {
        ambushesWon++;
        const list = withFit(rollGear(3, 3));
        const best = list.sort((a, z) => scoreRelic(z, preferred, persona) - scoreRelic(a, preferred, persona))[0];
        if (best) gainRelicState(best);
      }
      return true;
    }
    return false;
  };

  for (let r = 1; r <= last; r++) {
    G.round = r;
    G.phase = 'prep';
    const gem = full ? GEM_NIGHTS[r] : undefined;
    const isLastFull = full && r === 15;
    G.prep = {
      step: 0,
      cur: null,
      doors: [],
      talk: r % 2 === 1 && !gem && !isLastFull,
      gem: gem && G.gems[gem] == null ? gem : undefined,
      rule: RULE_NIGHTS.includes(r),
      mason: (G.run?.intact || 0) >= intactNeed(),
      awaken: r >= AWAKEN_NIGHT && !G.awaken && !!AWAKEN[hero],
      wagers: rollWagers(),
      wager: [],
    };
    G.nextWave = makeWave(r);

    // 1. Gem scene (full line — take all 3 gems so Night 15 fights Hidden Boss)
    if (G.prep.gem) {
      G.gems[G.prep.gem] = 1;
      gainRelicState('gem_' + G.prep.gem);
    }

    // 2. Night Talk + Talent
    if (G.prep.talk) {
      doTalk(preferred, persona, mastLv);
    }

    // 3. Free Rule Relic at Nights 3 & 7
    if (G.prep.rule) {
      const list = rollRule(3);
      if (list.length) {
        const best = list.sort((a, b) => scoreRelic(b, preferred, persona) - scoreRelic(a, preferred, persona))[0];
        gainRelicState(best);
      }
    }

    // 4. Free Awakening at Night 6
    if (G.prep.awaken) {
      G.awaken = pickAwaken(hero, persona);
      recalcMods();
    }

    // 5. Free Wall Mason if intact streak full
    if (G.prep.mason) {
      doMason(preferred, persona);
    }

    // 6. Leap Event at Nights 3, 5, 7 (, 11)
    if (jumpNights().includes(r)) {
      doJump(preferred, persona);
    }

    // 7. Three Prep Stops
    for (let step = 0; step < 3; step++) {
      G.prep.step = step;
      rollDoors();
      const doors = G.prep.doors;
      if (!doors.length) continue;
      const d = doors.slice().sort((a, b) => doorScore(b, preferred, persona) - doorScore(a, preferred, persona))[0];
      executeDoor(d, preferred, persona, runAmbushFight);
      arrangeBoard(preferred, persona, step === 2);
    }

    if (nightKind(r) === 'quiet') {
      nightSurvived[r - 1] = 1;
      break;
    }

    // 8. Wagers decision
    const chosenWagers: string[] = [];
    if (persona === 'master_optimizer' && r >= 2 && r <= 6 && r !== 4 && G.wall >= G.wallMax * 0.92 && boardCards().filter((c) => c.tier >= 1).length >= 2 && boardCards().reduce((s, c) => s + c.size, 0) >= 7) {
      // Strategically take 1 safe wager when solidly ahead to accelerate economy/relics
      const avail = G.prep.wagers || [];
      if (avail.includes('horde') && r <= 5) chosenWagers.push('horde');
      else if (avail.includes('iron') && r <= 5 && G.wall >= G.wallMax) chosenWagers.push('iron');
    } else if (persona === 'novice_random' && r >= 3 && rand() < 0.15 && G.prep.wagers?.length) {
      chosenWagers.push(pick(G.prep.wagers));
    }

    // 9. Battle!
    G.phase = 'battle';
    let wave = G.nextWave!;
    if (chosenWagers.includes('horde')) wave = hordeWave(wave);
    startBattle({ wave, ambush: false, wagers: chosenWagers, beats: nightInfo(r).beats });
    let steps = 0;
    while (!B!.over && steps < 60 * 400) {
      simStep(1 / 60);
      steps++;
    }
    const b = B!;
    rxTotal += b.rxN || 0;
    ultTotal += b.stkN || 0;

    if (b.result !== 'win') {
      lostThreat = wave.threats?.[0] || 'fixed';
      if (b.wallBy) {
        lostToEnemy = Object.entries(b.wallBy).sort((a, z) => z[1] - a[1])[0]?.[0] || '';
      }
      return buildRunResult(false, r);
    }

    nightSurvived[r - 1] = 1;
    settleWin();

    // Intact wall tracking + Jun's intactWall awakening
    if (b.wallLost === 0 && G.run) {
      G.run.intact = (G.run.intact || 0) + 1;
      if (mv('intactWall')) {
        G.wallMax += mv('intactWall');
        G.wall += mv('intactWall');
      }
    }

    // Night gold rewards
    const gold = nightRewards(r, b.wallLost).reduce((s, x) => s + x[1], 0);
    G.gold += gold;

    // Wager payouts
    for (const wk of chosenWagers) {
      const W = WAGERS[wk];
      if (!W) continue;
      wagersWon++;
      if (W.gold) G.gold += W.gold;
      if (W.heal) G.wall = Math.min(G.wallMax, G.wall + W.heal);
      if (W.relic) {
        const rr = rollGear(1, 1)[0];
        if (rr) gainRelicState(rr);
      }
      if (W.up) {
        const c = pick(boardCards().filter((x) => x.tier < 2));
        if (c) {
          c.tier++;
          checkMerges();
        } else G.gold += 3;
      }
    }
    if (STACK_GOLD[chosenWagers.length]) G.gold += STACK_GOLD[chosenWagers.length];
    if (stackRelic(chosenWagers.length)) {
      const rr = rollGear(1, 4)[0];
      if (rr) gainRelicState(rr);
    }
  }

  return buildRunResult(true, last);

  function buildRunResult(win: boolean, nightReached: number): RunResult {
    return {
      hero,
      persona,
      seed: opts.seed,
      heat: heatLv,
      full,
      win,
      nightReached,
      wallLeft: Math.round(G.wall),
      wallMax: Math.round(G.wallMax),
      totalWallLost: Math.round(G.run?.wallLost || 0),
      kills: G.run?.kills || 0,
      maxHit: Math.round(G.run?.maxHit || 0),
      maxChain: G.bestChain,
      maxCombo: G.run?.maxCombo || 0,
      rxTotal,
      ultTotal,
      foeSet: G.foeSet,
      boss9: G.boss9,
      kitPath: G.kitPath,
      wind: G.wind,
      awaken: G.awaken || '',
      wagersWon,
      ambushesWon,
      finalBoard: boardCards().map((c) => ({
        key: c.key,
        tier: c.tier,
        adj: c.adj,
        carry: !!c.carry,
        idx: c.idx,
        dmg: Math.round(c.bDmg || 0),
      })),
      relics: G.relics.slice(),
      ruleRelics: G.relics.filter((k) => RELICS[k]?.rule),
      talents: G.skills.slice(),
      lostThreat,
      lostToEnemy,
      nightSurvived,
    };
  }
}

/* ---------------- Fixed-Board Single-Night Evaluator (for Audit & GPU Surrogate!) ---------------- */

export function evaluateFixedNight(opts: FixedNightOpts): FixedNightResult {
  initHeadless();
  resetTune(opts.tuneOverride);
  setupMeta(opts.hero, 4, true);
  reseed(opts.seed);

  const H = HEROES[opts.hero];
  const heatLv = opts.heat ?? 0;
  const full = !!opts.full;
  const baseWall = Math.round(H.wall * (heatLv >= 4 ? 0.8 : 1));

  Object.assign(G, {
    hero: opts.hero,
    seed: opts.seed,
    heat: heatLv,
    run: freshRun(),
    round: opts.night,
    maxRound: full ? 15 : 9,
    endless: false,
    gold: 0,
    wall: baseWall,
    wallMax: baseWall,
    cards: [],
    relics: opts.relics.slice(),
    skills: opts.talents.slice(),
    bestChain: 0,
    secret: {},
    seenFoes: {},
    foeSet: opts.foeSet ?? (opts.seed % 2 === 0 ? 'dark' : 'frost'),
    phase: 'battle',
    speed: 1,
    full,
    gems: full ? { red: 1, blue: 1, green: 1 } : {},
    boss9: opts.boss9 || finalBosses()[opts.seed % finalBosses().length],
    boss12: opts.boss12 || finalBosses()[(opts.seed + 2) % finalBosses().length],
    awaken: opts.awaken || '',
    wind: '',
    wind2: '',
    omen: '',
    rot: null,
    daily: '',
  });

  let x = 0;
  for (const spec of opts.board) {
    const it = ITEMS[spec.key];
    if (!it || x + it.size > 8) continue;
    const c = newCard(spec.key, spec.tier, spec.adj || null);
    c.loc = 'board';
    c.idx = x;
    if (spec.carry) c.carry = true;
    if (spec.star) c.star = spec.star;
    if (spec.grow) c.grow = spec.grow;
    if (spec.vet) {
      c.vet = spec.vet;
      c.vetAt = x;
    }
    x += c.size;
    G.cards.push(c);
  }

  recalcMods();
  const wallMod =
    G.relics.reduce((s, k) => s + (RELICS[k]?.m.wall || 0), 0) +
    G.skills.reduce((s, k) => s + (TALENTS[k]?.m.wall || 0), 0) +
    (opts.wallBonus || 0);
  G.wallMax = Math.max(5, baseWall + wallMod);
  G.wall = G.wallMax;

  const wave = makeWave(opts.night);
  startBattle({ wave, ambush: false, wagers: [], beats: [] });

  let steps = 0;
  while (!B!.over && steps < 60 * 400) {
    simStep(1 / 60);
    steps++;
  }
  const b = B!;
  const win = b.result === 'win';
  const totalDmg = G.cards.reduce((s, c) => s + (c.bDmg || 0), 0);
  const dps = totalDmg / Math.max(1, b.t);
  const wallRatio = Math.max(0, G.wall / Math.max(1, G.wallMax));
  const cardDmgs: Record<string, number> = {};
  for (const c of G.cards) cardDmgs[c.key] = (cardDmgs[c.key] || 0) + Math.round(c.bDmg || 0);

  // Smooth composite performance score:
  // If win: 1000 + wall preservation bonus (0..500) + speed/DPS bonus (0..1500+)
  // If loss: progress ratio based on totalDmg & kills (0..950)
  const score = win
    ? 1000 + wallRatio * 500 + Math.min(2500, dps * 1.2) + Math.max(0, (120 - b.t) * 5)
    : Math.min(950, b.kills * 3 + Math.sqrt(Math.max(0, totalDmg)) * 2.5);

  return {
    win,
    wallLost: Math.round(b.wallLost),
    wallLeft: Math.round(G.wall),
    wallMax: Math.round(G.wallMax),
    duration: Math.round(b.t * 10) / 10,
    kills: b.kills,
    totalDmg: Math.round(totalDmg),
    dps: Math.round(dps),
    maxHit: Math.round(b.maxHit),
    maxChain: b.maxChain,
    rxN: b.rxN || 0,
    stkN: b.stkN || 0,
    threats: wave.threats || [],
    boss: opts.night === 9 ? G.boss9 : opts.night === 12 ? G.boss12 : '',
    cardDmgs,
    score: Math.round(score),
  };
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

export function getHeroCardPool(hero: string, includeGeneric = true): string[] {
  return Object.keys(ITEMS).filter((k) => {
    const it = ITEMS[k];
    if (it.noPool || it.world) return false;
    if (it.hero === hero) return true;
    return includeGeneric && !it.hero;
  });
}

export function getCardPath(key: string): string {
  const p = pathOf(key);
  return p ? `${p[0]}:${p[1].id}` : 'generic';
}
