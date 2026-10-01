/* 单局存档：每次进入备战时自动存。格式沿用旧版（chain-demo-save-v4），老存档能接着玩 */
import { ITEMS } from '../data/cards';
import { HEROES } from '../data/heroes';
import { TALENTS } from '../data/talents';
import { rng } from '../core/rng';
import { store, KEYS } from '../platform/storage';
import { G, freshRun, type Offer, type RunStats } from './state';
import { newCard } from './cards';
import { recalcMods } from './mods';

export interface SaveData {
  hero: string; round: number; gold: number; wall: number; wallMax: number; relics: string[]; skills: string[]; foeSet: string;
  bestChain: number; heat: number; run: RunStats | null; boss8: string; endless: boolean; lock: Offer | null;
  cards: { key: string; tier: number; adj: string | null; loc: any; idx: number; hoard: number; grow: number; qp: number }[];
  secret?: Record<string, number>;
  /** 新版加的：种子和随机数状态（旧存档没有，读的时候另起一个） */
  seed?: number;
  rng?: number;
}

/** rngState：进入备战之前的随机数状态（读档后今晚的出怪和三站不变） */
export function saveGame(rngState = rng.state) {
  const s: SaveData = {
    hero: G.hero, round: G.round, gold: G.gold, wall: G.wall, wallMax: G.wallMax, relics: G.relics, skills: G.skills, foeSet: G.foeSet,
    bestChain: G.bestChain, heat: G.heat || 0, run: G.run, boss8: G.boss8, endless: !!G.endless, lock: G.lock || null,
    cards: G.cards.map((c) => ({ key: c.key, tier: c.tier, adj: c.adj, loc: c.loc, idx: c.idx, hoard: c.hoard, grow: c.grow || 0, qp: c.qp || 0 })),
    secret: G.secret, seed: G.seed, rng: rngState,
  };
  store.setJson(KEYS.save, s);
}

export const loadSave = () => store.json<SaveData | null>(KEYS.save, null);
export const clearSave = () => store.del(KEYS.save);

/** 把存档读回 G。返回 false 表示存档坏了或人物不存在 */
export function restoreSave(s: SaveData | null): boolean {
  if (!s || !HEROES[s.hero]) return false;
  Object.assign(G, {
    hero: s.hero, round: s.round, gold: s.gold, wall: s.wall, wallMax: s.wallMax, foeSet: s.foeSet || 'dark', relics: s.relics || [],
    skills: (s.skills || []).filter((k) => TALENTS[k]), bestChain: s.bestChain || 0, heat: s.heat || 0, run: s.run || freshRun(),
    boss8: s.boss8 || 'eye', endless: !!s.endless, maxRound: s.endless ? 999 : 8, lock: s.lock || null, fightWave: null, cards: [],
    secret: s.secret || {}, seed: s.seed ?? 0,
  });
  if (s.rng != null) rng.state = s.rng;
  for (const d of s.cards || []) {
    if (!ITEMS[d.key]) continue;
    const c = newCard(d.key, d.tier, d.adj);
    c.loc = d.loc;
    c.idx = d.idx;
    c.hoard = d.hoard || 0;
    c.grow = d.grow || 0;
    c.qp = d.qp || 0;
    G.cards.push(c);
  }
  recalcMods();
  return true;
}
