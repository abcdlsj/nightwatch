/* 修正项：遗物 + 天赋 + 羁绊加在一起，mv('键') 取值 / Modifiers: relics + talents + synergy added together; mv('key') reads the value */
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import type { Mods } from '../data/types';
import { G } from './state';
import { synMods } from './synergy';

export let M: Mods = {};

export function recalcMods() {
  const m: Mods = {};
  /* 普通修正项相加；x 开头的是独立乘区，多个来源相乘（存的是 倍率-1） / plain modifiers add; keys starting with x are independent multipliers that multiply across sources (stored as multiplier - 1) */
  const add = (x: Mods) => {
    for (const k in x) m[k] = k[0] === 'x' ? (1 + (m[k] || 0)) * (1 + x[k]) - 1 : (m[k] || 0) + x[k];
  };
  for (const r of G.relics) add(RELICS[r].m);
  for (const s of G.skills) if (TALENTS[s]) add(TALENTS[s].m);
  add(synMods());
  M = m;
}

export const mv = (k: string) => M[k] || 0;
