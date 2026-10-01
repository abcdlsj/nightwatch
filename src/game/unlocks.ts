/* 解锁：人物（按顺序，用前一个守到黎明解锁下一个）、每个人物各自的长夜难度、专属卡流派（按熟练等级） */
import { HEROES, HERO_ORDER, PATHS, type PathDef } from '../data/heroes';
import { ITEMS } from '../data/cards';
import { HEAT_MAX } from '../data/meta';
import type { KitDef } from '../data/types';
import { META, saveMeta, mastLv } from './meta';

/* ---------------- 人物 ---------------- */
export const heroUnlocked = (h: string) => !!META.heroes?.[h];
export const heroList = () => HERO_ORDER.filter((h) => HEROES[h]);
/** 解锁 h 需要先用谁守到黎明 */
export const heroNeeds = (h: string) => HERO_ORDER[HERO_ORDER.indexOf(h) - 1];

/** 用 h 守到黎明：解锁下一个人物，返回新解锁的人物（没有就是 null） */
export function unlockNextHero(h: string): string | null {
  const nx = HERO_ORDER[HERO_ORDER.indexOf(h) + 1];
  if (!nx || heroUnlocked(nx)) return null;
  META.heroes![nx] = 1;
  saveMeta();
  return nx;
}

/* ---------------- 长夜难度：每个人物各自解锁 ---------------- */
export function heatOf(h: string) {
  return (META.heat![h] ||= { max: 0, sel: 0 });
}
/** 在当前最高难度守到黎明：这个人物解锁下一档，返回新档位（没有就是 0） */
export function heatWon(h: string, played: number) {
  const H = heatOf(h);
  if (played < H.max || H.max >= HEAT_MAX) return 0;
  H.max = played + 1;
  H.sel = H.max;
  saveMeta();
  return H.max;
}

/* ---------------- 专属卡流派 ---------------- */
export const pathsOf = (h: string): PathDef[] => PATHS[h] || [];
export const pathOpen = (h: string, p: PathDef) => mastLv(h) >= p.mast;
const PATH_OF: Record<string, [string, PathDef]> = {};
for (const h in PATHS) for (const p of PATHS[h]) for (const k of p.cards) PATH_OF[k] = [h, p];

/** 这张卡进不进店：通用卡都进；专属卡要它的流派解锁了 */
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
