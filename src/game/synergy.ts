/* 羁绊：棋盘上同元素的卡凑到 2 / 4 / 6 张，全队拿加成，层数叠加；两种元素都凑到 2 张时再加一条联动 / Synergy: 2 / 4 / 6 cards of the same element on the board give the whole team bonuses that stack; having 2 cards of two different elements also adds a link */
import { ITEMS } from '../data/cards';
import { SYN, SYN2, SYN2_NEED } from '../data/meta';
import type { Mods, Tag } from '../data/types';
import { G } from './state';
import { TUNE } from './tuning';

export function synCount(): Partial<Record<Tag, number>> {
  const n: Partial<Record<Tag, number>> = {};
  for (const c of G.cards)
    if (c.loc === 'board') {
      const t = ITEMS[c.key].tag;
      if (SYN[t]) n[t] = (n[t] || 0) + 1;
    }
  return n;
}

export const synLevel = (t: Tag, n: number) => SYN[t].filter((s) => n >= s[0]).length;

/** 生效的联动 / active dual-synergy links */
export const synPairs = (n = synCount()) => Object.keys(SYN2).filter((k) => (n[SYN2[k].a] || 0) >= SYN2_NEED && (n[SYN2[k].b] || 0) >= SYN2_NEED);

export function synMods(): Mods {
  const n = synCount(),
    out: Mods = {};
  const add = (m: Mods) => {
    for (const k in m) out[k] = (out[k] || 0) + m[k];
  };
  for (const t in n) for (const [need, m] of SYN[t as Tag]) if (n[t as Tag]! >= need) add(m);
  if (TUNE.syn2) for (const k of synPairs(n)) add(SYN2[k].m);
  return out;
}
