/* 解锁：人物（按顺序，用前一个守到黎明解锁下一个）、每个人物各自的长夜难度、专属卡流派（按熟练等级） / Unlocks: heroes (in order, reach dawn with the previous one to unlock the next), per-hero Long Night difficulty, and archetypes of exclusive cards (by mastery level) */
import { HEROES, HERO_ORDER, PATHS, type PathDef } from '../data/heroes';
import { ITEMS } from '../data/cards';
import { HEAT_MAX } from '../data/meta';
import type { KitDef } from '../data/types';
import { META, saveMeta, mastLv } from './meta';

/* ---------------- 人物 ---------------- / ---------------- Heroes ---------------- */
export const heroUnlocked = (h: string) => !!META.heroes?.[h] || !!HEROES[h]?.free;
export const heroList = () => HERO_ORDER.filter((h) => HEROES[h]);
/** 解锁 h 需要先用谁守到黎明 / which hero must be held to dawn to unlock h */
export const heroNeeds = (h: string) => HERO_ORDER[HERO_ORDER.indexOf(h) - 1] || HERO_ORDER[0];

/** 用 h 守到黎明：解锁下一个人物，返回新解锁的人物（没有就是 null） / reached dawn with h: unlock the next hero and return the newly unlocked one (null if none) */
export function unlockNextHero(h: string): string | null {
  const nx = HERO_ORDER[HERO_ORDER.indexOf(h) + 1];
  if (!nx || heroUnlocked(nx)) return null;
  META.heroes![nx] = 1;
  saveMeta();
  return nx;
}

/* ---------------- 长夜难度：每个人物各自解锁 ---------------- / ---------------- Long Night difficulty: unlocked per hero ---------------- */
export function heatOf(h: string) {
  return (META.heat![h] ||= { max: 0, sel: 0 });
}
/** 在当前最高难度守到黎明：这个人物解锁下一档，返回新档位（没有就是 0） / reaching dawn at the current top tier: unlock the next tier for this hero and return it (0 if none) */
export function heatWon(h: string, played: number) {
  const H = heatOf(h);
  if (played < H.max || H.max >= HEAT_MAX) return 0;
  H.max = played + 1;
  H.sel = H.max;
  saveMeta();
  return H.max;
}

/* ---------------- 专属卡流派 ---------------- / ---------------- Exclusive card archetypes ---------------- */
export const pathsOf = (h: string): PathDef[] => PATHS[h] || [];
export const pathOpen = (h: string, p: PathDef) => mastLv(h) >= p.mast;
const PATH_OF: Record<string, [string, PathDef]> = {};
/** 这张专属卡属于哪个人物的哪个流派 / which hero and archetype an exclusive card belongs to */
export const pathOf = (k: string) => PATH_OF[k];
for (const h in PATHS) for (const p of PATHS[h]) for (const k of p.cards) PATH_OF[k] = [h, p];

/** 这张卡进不进店：通用卡都进；专属卡要它的流派解锁了 / whether a card can appear in shops: all generic cards can; an exclusive card needs its archetype unlocked */
export function cardOpen(key: string) {
  const it = ITEMS[key];
  if (!it.hero) return true;
  const hp = PATH_OF[key];
  return !hp || pathOpen(hp[0], hp[1]);
}
export function kitOpen(h: string, k: KitDef) {
  const p = pathsOf(h).find((x) => x.id === k.path);
  return !p || pathOpen(h, p);
}

/* ---------------- 完整游戏线：三个流派的起手各守到一次黎明 ---------------- / ---------------- Full game line: hold dawn once with an opening set from each of the three archetypes ---------------- */
const pathWins = (h: string) => META.pathWins?.[h] || {};
/** 解锁进度：守过黎明的流派数 / 这个人物一共几个流派 / unlock progress: archetypes held to dawn / total archetypes for this hero */
export function fullProgress(h: string) {
  const ps = pathsOf(h);
  const w = pathWins(h);
  return { n: ps.filter((p) => w[p.id]).length, of: Math.max(1, ps.length) };
}
export const fullOpen = (h: string) => {
  const p = fullProgress(h);
  return p.n >= p.of;
};
/** 用某个流派的起手守到黎明：记一笔，返回进度和这次是不是刚好解锁 / hold dawn with an opening set from an archetype: record it and return the progress and whether this exactly unlocked it */
export function markPathWin(h: string, path: string) {
  if (!path || !pathsOf(h).some((p) => p.id === path)) return null;
  const was = fullOpen(h);
  ((META.pathWins ||= {})[h] ||= {})[path] = 1;
  saveMeta();
  const p = fullProgress(h);
  return { ...p, opened: !was && fullOpen(h) };
}
/** 选人页的勾选状态（每个人物各记各的） / the checkbox state on hero select (tracked per hero) */
export const fullSelected = (h: string) => fullOpen(h) && !!META.fullSel?.[h];
/* ---------------- 异象和流派轮换：三个流派都守到黎明、长夜难度解锁到 5 以后才能开 ---------------- / ---------------- Omens and archetype rotation: available once all three archetypes have held dawn and Long Night 5 is unlocked ---------------- */
export const VARIANT_HEAT = 5;
/** 这个人物三套流派完成了没有、长夜解锁到几档 / whether this hero finished all three archetypes, and how far Long Night is unlocked */
export const variantOpen = (h: string) => fullOpen(h) && heatOf(h).max >= VARIANT_HEAT;
export const omenSelected = (h: string) => variantOpen(h) && !!META.omenSel?.[h];
export const rotSelected = (h: string) => variantOpen(h) && !!META.rotSel?.[h];
export function setVariant(kind: 'omen' | 'rot', h: string, on: boolean) {
  const k = kind === 'omen' ? 'omenSel' : 'rotSel';
  (META[k] ||= {})[h] = on ? 1 : 0;
  saveMeta();
}
export function setFullSelected(h: string, on: boolean) {
  (META.fullSel ||= {})[h] = on ? 1 : 0;
  saveMeta();
}
