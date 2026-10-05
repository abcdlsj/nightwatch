/* 单局存档：每次进入备战时自动存。格式沿用旧版（chain-demo-save-v4），老存档能接着玩 / Per-run save: written automatically each time prep begins. The format follows the old version (chain-demo-save-v4), so old saves keep working */
import { ITEMS } from '../data/cards';
import { HEROES } from '../data/heroes';
import { TALENTS } from '../data/talents';
import { EN } from '../data/enemies';
import { OMENS } from '../data/meta';
import { rng } from '../core/rng';
import { store, KEYS } from '../platform/storage';
import { G, freshRun, type GameState, type Offer, type RunStats } from './state';
import { newCard } from './cards';
import { recalcMods } from './mods';
import { NIGHTS, FULL_NIGHTS } from './plan';

export interface SaveData {
  hero: string; round: number; gold: number; wall: number; wallMax: number; relics: string[]; skills: string[]; foeSet: string;
  bestChain: number; heat: number; run: RunStats | null; boss9?: string; boss12?: string; full?: boolean; gems?: Record<string, number>; arc?: number; kitPath?: string;
  /** 旧版（8 夜）存档里的首领 / the boss in old-version (8-night) saves */
  boss8?: string;
  endless: boolean; lock: Offer | null;
  cards: { key: string; tier: number; adj: string | null; loc: any; idx: number; hoard: number; grow: number; qp: number; carry?: boolean; star?: number }[];
  secret?: Record<string, number>;
  wind?: string; windRelic?: boolean;
  wind2?: string; omen?: string; rot?: { off: string; gh: string; gp: string } | null;
  /** 新版加的：种子和随机数状态（旧存档没有，读的时候另起一个） / added in the new version: seed and RNG state (missing in old saves; start a fresh one on load) */
  seed?: number;
  rng?: number;
}

/** rngState：进入备战之前的随机数状态（读档后今晚的出怪和三站不变） / rngState: the RNG state from before prep (loading gives the same spawns and three stops) */
export function saveGame(rngState = rng.state) {
  const s: SaveData = {
    hero: G.hero, round: G.round, gold: G.gold, wall: G.wall, wallMax: G.wallMax, relics: G.relics, skills: G.skills, foeSet: G.foeSet,
    bestChain: G.bestChain, heat: G.heat || 0, run: G.run, boss9: G.boss9, boss12: G.boss12, full: G.full, gems: G.gems, arc: G.arc, kitPath: G.kitPath,
    endless: !!G.endless, lock: G.lock || null,
    cards: G.cards.map((c) => ({ key: c.key, tier: c.tier, adj: c.adj, loc: c.loc, idx: c.idx, hoard: c.hoard, grow: c.grow || 0, qp: c.qp || 0, carry: c.carry || undefined, star: c.star || undefined })),
    secret: G.secret, seed: G.seed, rng: rngState, wind: G.wind, windRelic: G.windRelic,
    wind2: G.wind2 || '', omen: G.omen || '', rot: G.rot || null,
  };
  store.setJson(KEYS.save, s);
}

export const loadSave = () => store.json<SaveData | null>(KEYS.save, null);
export const clearSave = () => store.del(KEYS.save);

/** 把存档读回 G。返回 false 表示存档坏了或人物不存在 / load the save back into G. Returns false if the save is corrupt or the hero does not exist */
export function restoreSave(s: SaveData | null): boolean {
  if (!s || !HEROES[s.hero]) return false;
  Object.assign(G, {
    hero: s.hero, round: s.round, gold: s.gold, wall: s.wall, wallMax: s.wallMax, foeSet: s.foeSet || 'dark', relics: s.relics || [],
    skills: (s.skills || []).filter((k) => TALENTS[k]), bestChain: s.bestChain || 0, heat: s.heat || 0, run: s.run || freshRun(),
    boss9: EN[s.boss9 || s.boss8 || ''] ? s.boss9 || s.boss8 : 'eye', boss12: EN[s.boss12 || ''] ? s.boss12 : 'brood', full: !!s.full, gems: s.gems || {}, arc: s.arc || 0, kitPath: s.kitPath || '',
    endless: !!s.endless, maxRound: s.endless ? 999 : s.full ? FULL_NIGHTS : NIGHTS, lock: s.lock || null, fightWave: null, cards: [],
    secret: s.secret || {}, seed: s.seed ?? 0, wind: (s.wind || '') as GameState['wind'], windRelic: !!s.windRelic,
    wind2: (s.wind2 || '') as GameState['wind'], omen: OMENS[s.omen || ''] ? s.omen : '', rot: s.rot || null,
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
    c.carry = !!d.carry;
    c.star = d.star || 0;
    G.cards.push(c);
  }
  recalcMods();
  return true;
}
