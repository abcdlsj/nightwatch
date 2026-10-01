/* 修正项：遗物 + 天赋 + 羁绊加在一起，mv('键') 取值 */
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import type { Mods } from '../data/types';
import { G } from './state';
import { synMods } from './synergy';

export let M: Mods = {};

export function recalcMods() {
  const m: Mods = {};
  const add = (x: Mods) => {
    for (const k in x) m[k] = (m[k] || 0) + x[k];
  };
  for (const r of G.relics) add(RELICS[r].m);
  for (const s of G.skills) if (TALENTS[s]) add(TALENTS[s].m);
  add(synMods());
  M = m;
}

export const mv = (k: string) => M[k] || 0;
