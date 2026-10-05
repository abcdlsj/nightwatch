/* 局外进度：成就、长夜难度、熟练、图鉴、过往守夜、隐藏事件计数。
 * 都存在 chain-meta-v1 里，跟单局存档分开，删档不丢。
 * Meta progress: achievements, Long Night difficulty, mastery, codex, past nights, hidden-event counters. All stored under chain-meta-v1, separate from the per-run save, so clearing a save keeps it.
 */
import { ACH, MAST_LV, HIST_MAX } from '../data/meta';
import { heatWon, unlockNextHero, markPathWin } from './unlocks';
import { ITEMS } from '../data/cards';
import { emitEv } from '../core/events';
import { store, KEYS } from '../platform/storage';
import { G, freshRun, type RunStats } from './state';
import { rollGear } from './loot';
import { RELICS } from '../data/relics';
import { HEROES, HERO_ORDER } from '../data/heroes';
import { recalcMods } from './mods';
import { pick } from '../core/rng';
import { finalBosses, lastNight } from './plan';
import { heroStory } from './story';

export interface HistEntry {
  id: number; t: number; h: string; w: number; r: number; en: number; heat: number; set: string; boss: string;
  /** 完整游戏线 / the full game line */
  full?: number;
  k: number; cb: number; ch: number; bd: [string, number, string | 0][]; best: [string, number, string | 0] | null;
  rl: string[]; sk: string[]; ach: string[]; by: string | null; gold: number;
}
export interface Meta {
  ach: Record<string, number>;
  heatMax: number;
  heatSel: number;
  wins: number;
  runs: number;
  sets: Record<string, number>;
  mast?: Record<string, number>;
  endBest?: number;
  cx: { c: Record<string, number>; r: Record<string, number>; t: Record<string, number>; k: Record<string, number> };
  hist: HistEntry[];
  secrets: Record<string, number>;
  /** 解锁了的人物 / unlocked heroes */
  heroes?: Record<string, number>;
  /** 每个人物各自的长夜难度：最高解锁到几档、现在选的几档 / per-hero Long Night difficulty: highest tier unlocked and the tier currently selected */
  heat?: Record<string, { max: number; sel: number }>;
  /** 每个人物下一局走第几套剧情 / which story set each hero takes next run */
  arcNext?: Record<string, number>;
  /** 第 9 夜首领轮换：每个人物这一轮已经打过的首领 / night-9 boss rotation: which bosses each hero has already fought this cycle */
  bossCycle?: Record<string, string[]>;
  /** 每个人物用哪些流派的起手守到过黎明 / which archetypes' opening sets each hero has held to dawn with */
  pathWins?: Record<string, Record<string, number>>;
  /** 选人页上「完整游戏线」勾没勾 / whether the full game line checkbox is ticked on hero select */
  fullSel?: Record<string, number>;
  /** 起手页上「异象」「流派轮换」勾没勾 / whether the omen and rotation boxes are ticked on the opening page */
  omenSel?: Record<string, number>;
  rotSel?: Record<string, number>;
  /** 每个人物打倒过的隐藏首领 / 走到第十五夜的次数 / hidden bosses each hero has beaten / times they reached night 15 */
  fullDone?: Record<string, { hidden?: number; quiet?: number }>;
}

function loadMeta(): Meta {
  const d = { ach: {}, heatMax: 0, heatSel: 0, wins: 0, runs: 0, sets: {} };
  const m = Object.assign(d, store.json(KEYS.meta, {})) as Meta;
  if (!m.cx) m.cx = { c: {}, r: {}, t: {}, k: {} };
  if (!m.hist) m.hist = [];
  if (!m.secrets) m.secrets = {};
  /* 旧存档迁移：玩过的人物都解锁；守到过黎明的人物，下一个也解锁；全局长夜进度分给每个解锁的人物 / old-save migration: unlock every hero played; if a hero reached dawn, unlock the next; give the global Long Night progress to every unlocked hero */
  if (!m.heroes) {
    m.heroes = { [HERO_ORDER[0]]: 1 };
    for (const h of m.hist) {
      if (HEROES[h.h]) m.heroes[h.h] = 1;
      const nx = HERO_ORDER[HERO_ORDER.indexOf(h.h) + 1];
      if (h.w && nx) m.heroes[nx] = 1;
    }
  }
  if (!m.heat) {
    m.heat = {};
    for (const h in m.heroes) m.heat[h] = { max: m.heatMax || 0, sel: Math.min(m.heatSel || 0, m.heatMax || 0) };
  }
  return m;
}
export const META: Meta = loadMeta();
export const saveMeta = () => store.setJson(KEYS.meta, META);

/* ---------------- 成就 ---------------- / ---------------- Achievements ---------------- */
export const ACHM = Object.fromEntries(ACH.map((a) => [a.id, a]));

/** 守到黎明时才结算的成就条件（R 是这局的统计） / achievement conditions settled at dawn (R is this run's stats) */
const ACH_OK: Record<string, (R: RunStats) => unknown> = {
  solo: (R) => R.maxBoard <= 1,
  fullwall: () => G.wall >= G.wallMax,
  norelic: () => !G.relics.length,
  notalent: () => !G.skills.length,
  nobrick: (R) => R.wallLost <= 0,
  h_ayla: () => G.hero === 'ayla',
  h_mo: () => G.hero === 'mo',
  h_ying: () => G.hero === 'ying',
  h_jun: () => G.hero === 'jun',
  h_li: () => G.hero === 'li',
  frost: () => G.foeSet === 'frost',
  bothsets: () => META.sets.dark && META.sets.frost,
  pure: (R) => R.lastPure,
  smalls: (R) => R.lastSmall,
  giants: (R) => R.lastBig,
  gambler: (R) => R.wagers >= 4,
  heat1: () => G.heat >= 1,
  heat4: () => G.heat >= 4,
  heat8: () => G.heat >= 8,
  brood: () => G.boss9 === 'brood',
};

export function unlock(id: string) {
  if (META.ach[id] || !ACHM[id]) return;
  META.ach[id] = Date.now();
  saveMeta();
  if (G.run) G.run.got.push(id);
  emitEv('ach', ACHM[id]);
}
export const achCount = () => ACH.filter((a) => META.ach[a.id]).length;

/** 守到黎明：记录进度、解锁下一档长夜、检查要通关才算的成就 / reaching dawn: record progress, unlock the next Long Night tier, and check achievements that need a completed run */
export function runWon() {
  const R = G.run || freshRun();
  META.wins++;
  META.sets[G.foeSet] = 1;
  /* 难度按人物各自解锁；META.heatMax 记所有人物里最高的一档（标题页显示用） / difficulty unlocks per hero; META.heatMax tracks the highest tier across all heroes (for the title screen) */
  const nh = heatWon(G.hero, G.heat);
  if (nh) {
    R.newHeat = nh;
    META.heatMax = Math.max(META.heatMax, nh);
  }
  R.newHero = unlockNextHero(G.hero) || undefined;
  const pw = markPathWin(G.hero, G.kitPath);
  if (pw) {
    R.pathWin = [pw.n, pw.of];
    R.newFull = pw.opened;
  }
  saveMeta();
  for (const a of ACH) if (a.w && (!ACH_OK[a.id] || ACH_OK[a.id](R))) unlock(a.id);
}

/* ---------------- 完整游戏线：走到第十五夜（打倒隐藏首领 / 宝石不全，安静地天亮） ---------------- / ---------------- Full game line: reach night 15 (beat the hidden boss / quiet dawn with a missing gem) ---------------- */
export function fullDone(kind: 'hidden' | 'quiet') {
  const D = ((META.fullDone ||= {})[G.hero] ||= {});
  D[kind] = (D[kind] || 0) + 1;
  saveMeta();
  unlock('full15');
  if (kind === 'hidden') {
    unlock('truth');
    unlock('hid_' + G.hero);
  }
}

/* ---------------- 剧情：每个人物的几套夜晚按顺序轮，一局一套 ---------------- / ---------------- Story: each hero's night sets cycle in order, one per run ---------------- */
export function nextArc(hero: string) {
  const n = heroStory(hero).arcs?.length || 1;
  const A = (META.arcNext ||= {});
  const k = (A[hero] || 0) % n;
  A[hero] = k + 1;
  saveMeta();
  return k;
}

/* ---------------- 第 9 夜首领轮换：这个人物还没打过的先来，五个都打过一轮再重新开始 ---------------- / ---------------- Night-9 boss rotation: bosses this hero has not fought come first; once all five are done, the cycle restarts ---------------- */
export function nextBoss(hero: string) {
  const all = finalBosses();
  const seen = META.bossCycle?.[hero] || [];
  const pool = all.filter((k) => !seen.includes(k));
  return pick(pool.length ? pool : all);
}
export function markBoss(hero: string, k: string) {
  const C = (META.bossCycle ||= {});
  const seen = (C[hero] ||= []);
  if (!seen.includes(k)) seen.push(k);
  if (finalBosses().every((x) => seen.includes(x))) C[hero] = [];
  saveMeta();
}

/* ---------------- 熟练：每个守夜人各自的轻量局外成长 ---------------- / ---------------- Mastery: lightweight meta progression per watcher ---------------- */
export const mastPts = (h?: string) => (META.mast || {})[h || G.hero] || 0;
export const mastLv = (h?: string) => {
  const p = mastPts(h);
  return MAST_LV.filter((n) => p >= n).length;
};
export const mastNext = (h?: string) => {
  const p = mastPts(h),
    n = MAST_LV.find((x) => p < x);
  return n ? n - p : 0;
};

/** 开局按等级发放：多 2 金 / 夜谈多一选（在夜谈里看） / 送普通遗物 / 首卡升银 / granted by level at run start: +2 gold / one extra night-talk option (shown in the talk) / a common relic / first card upgraded to silver */
export function mastStart() {
  const lv = mastLv();
  if (!lv) return;
  G.gold += 2;
  if (lv >= 3) {
    const r = rollGear(1, 0, 0)[0];
    if (r) {
      G.relics.push(r);
      const w = RELICS[r].m.wall;
      if (w) {
        G.wallMax = Math.max(5, G.wallMax + w);
        G.wall = Math.min(G.wallMax, G.wall + Math.max(0, w));
      }
      recalcMods();
    }
  }
  if (lv >= 4) {
    const c = G.cards.find((x) => x.tier < 1);
    if (c) c.tier++;
  }
}

/** 一局结束时记账，返回这局加了多少、升到几级 / tally at the end of a run; returns how much was gained and which levels were reached */
export function mastGain(win: boolean) {
  const h = G.hero;
  const add = win ? lastNight() + 2 : Math.max(0, G.round - 1);
  if (!add) return null;
  const lv0 = mastLv(h);
  META.mast = META.mast || {};
  META.mast[h] = mastPts(h) + add;
  saveMeta();
  const lv = mastLv(h);
  return { add, lv, up: lv > lv0 ? lv : 0 };
}

/* ---------------- 图鉴 ---------------- / ---------------- Codex ---------------- */
/** 敌人见过几局（跨局记录） / how many runs each enemy has been seen in (tracked across runs) */
export const bestiary = () => store.json<Record<string, number>>(KEYS.bestiary, {});
export function markSeen(type: string) {
  const b = bestiary();
  b[type] = (b[type] || 0) + 1;
  store.setJson(KEYS.bestiary, b);
}
export const foeSeen = (k: string) => !!(bestiary()[k] || META.cx.k[k]);

/** 本局第一次遇到某种敌人：记一笔，返回是不是第一次见（界面据此弹介绍卡） / first time meeting an enemy this run: record it and return whether it is new (the UI pops an intro card) */
export function meetFoe(type: string): { firstEver: boolean } | null {
  if (G.seenFoes[type]) return null;
  G.seenFoes[type] = 1;
  const firstEver = !bestiary()[type];
  markSeen(type);
  return { firstEver };
}

/* 击杀先攒在内存里，结算时一起存，免得每杀一个都写一次 / buffer kills in memory and flush at settlement, rather than writing on every kill */
let cxKills: Record<string, number> = {};
export const codexKill = (type: string) => {
  cxKills[type] = (cxKills[type] || 0) + 1;
};
export function codexSweep() {
  const X = META.cx;
  for (const c of G.cards) if (ITEMS[c.key]) X.c[c.key] = Math.max(X.c[c.key] == null ? -1 : X.c[c.key], c.tier);
  for (const r of G.relics) X.r[r] = 1;
  for (const t of G.skills) X.t[t] = 1;
  for (const k in cxKills) X.k[k] = (X.k[k] || 0) + cxKills[k];
  cxKills = {};
  saveMeta();
}

/* ---------------- 过往守夜：每局记一条，守到黎明后接着守的算同一局 ---------------- / ---------------- Past nights: one entry per run; endless waves after dawn count as the same run ---------------- */
export function recordRun(win: boolean, wallBy: Record<string, number> | null) {
  codexSweep();
  const R = G.run || freshRun();
  const endl = !!G.endless;
  const by = wallBy ? Object.keys(wallBy).sort((a, b) => wallBy[b] - wallBy[a])[0] : null;
  const board = G.cards
    .filter((c) => c.loc === 'board')
    .sort((a, b) => a.idx - b.idx)
    .map((c) => [c.key, c.tier, c.adj || 0] as [string, number, string | 0]);
  const best = G.cards.slice().sort((a, b) => (b.bDmg || 0) - (a.bDmg || 0))[0];
  const old = endl && R.hid ? META.hist.find((h) => h.id === R.hid) : null;
  const e: HistEntry = {
    id: old ? old.id : Date.now(), t: Date.now(), h: G.hero, w: win || endl ? 1 : 0, r: endl ? lastNight() : Math.min(G.round, lastNight()),
    en: endl ? Math.max(0, G.round - endFrom()) : 0, heat: G.heat || 0, set: G.foeSet || 'dark', boss: G.boss9 || 'eye', full: G.full ? 1 : 0,
    k: R.kills || 0, cb: R.maxCombo || 0, ch: G.bestChain || 1, bd: board,
    best: best && best.bDmg ? [best.key, best.tier, best.adj || 0] : null, rl: G.relics.slice(), sk: G.skills.slice(),
    ach: (old ? old.ach : []).concat(R.got || []), by: win || endl ? null : by, gold: G.gold,
  };
  if (old) Object.assign(old, e);
  else {
    META.hist.unshift(e);
    if (META.hist.length > HIST_MAX) META.hist.length = HIST_MAX;
  }
  if (win && G.run) G.run.hid = e.id;
  saveMeta();
}

/* ---------------- 无尽长夜 ---------------- / ---------------- Endless nights ---------------- */
/** 无尽长夜是从第几夜之后开始的（普通 9 夜、完整线 15 夜） / the night Endless starts after (9 normally, 15 on the full line) */
export const endFrom = () => lastNight() + 1;
export function endlessLost() {
  const n = Math.max(0, G.round - endFrom());
  if (n > (META.endBest || 0)) {
    META.endBest = n;
    saveMeta();
  }
  if (n >= 2) unlock('end2');
  if (n >= 5) unlock('end5');
}

/* ---------------- 隐藏事件 ---------------- / ---------------- Hidden events ---------------- */
export function foundSecret(id: string) {
  G.secret[id] = 1;
  if (!META.secrets[id]) {
    META.secrets[id] = Date.now();
    saveMeta();
  }
}
