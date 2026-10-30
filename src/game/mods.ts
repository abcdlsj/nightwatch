/* 修正项：遗物 + 天赋 + 羁绊加在一起，mv('键') 取值 / Modifiers: relics + talents + synergy added together; mv('key') reads the value */
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import type { Mods } from '../data/types';
import { G } from './state';
import { synMods } from './synergy';
import { OMENS } from '../data/meta';
import { SIGS, AWAKEN } from '../data/heroes';
import { curWorld } from './world';

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
  /* 天性和觉醒 / nature and awakening */
  if (SIGS[G.hero]) add(SIGS[G.hero]);
  const aw = G.awaken && AWAKEN[G.hero]?.find((a) => a.id === G.awaken);
  if (aw) add(aw.m);
  const O = G.omen ? OMENS[G.omen] : null;
  if (O?.m) add(O.m);
  if (O?.wind && G.wind) add({ ['xtag_' + G.wind]: O.wind });
  const wm = curWorld()?.mods?.();
  if (wm) add(wm);
  M = m;
}

export const mv = (k: string) => M[k] || 0;

/** 钱够不够花：修正项 debt 允许欠几金（账房、信用卡） / whether you can pay: the debt modifier allows going that many gold below zero */
export const afford = (n: number) => G.gold + mv('debt') >= n;
