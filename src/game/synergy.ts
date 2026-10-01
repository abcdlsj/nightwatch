/* 羁绊：棋盘上同元素的卡凑到 2 / 4 / 6 张，全队拿加成，层数叠加 */
import { ITEMS } from '../data/cards';
import { SYN } from '../data/meta';
import type { Mods, Tag } from '../data/types';
import { G } from './state';

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

export function synMods(): Mods {
  const n = synCount(),
    out: Mods = {};
  for (const t in n)
    for (const [need, m] of SYN[t as Tag]) if (n[t as Tag]! >= need) for (const k in m) out[k] = (out[k] || 0) + m[k];
  return out;
}
