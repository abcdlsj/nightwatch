/* 一局的夜晚编排：一共几夜、哪夜是精英 / 首领、哪夜有跃迁和宝石。
 * 普通流程 9 夜：第 4 夜暗影骑士，第 9 夜首领（五个里轮换）。
 * 完整游戏线 15 夜：第 9 夜首领打完天不亮，接着守；第 12 夜再来一个首领，第 15 夜是这个守夜人自己的隐藏首领。
 * 隐藏首领要三颗宝石都拿到（第 6、10、13 夜之前的剧情里给）；少一颗，第 15 夜就只有一段对话，然后天亮。 */
import { EN } from '../data/enemies';
import { G } from './state';

export const NIGHTS = 9;
export const FULL_NIGHTS = 15;
/** 暗影骑士（小首领） */
export const MID_BOSS_NIGHT = 4;
/** 完整线里第二个首领 */
export const FULL_BOSS2_NIGHT = 12;

export type Gem = 'red' | 'blue' | 'green';
export const GEMS: Gem[] = ['red', 'blue', 'green'];
/** 哪夜之前给哪颗宝石（完整线才有） */
export const GEM_NIGHTS: Record<number, Gem> = { 6: 'red', 10: 'blue', 13: 'green' };

/** 跃迁事件（定 C 位）：普通流程第 3、5、7 夜之前，完整线再加第 11 夜 */
export const jumpNights = () => (G.full ? [3, 5, 7, 11] : [3, 5, 7]);

/** 这局的最后一夜 */
export const lastNight = () => (G.full ? FULL_NIGHTS : NIGHTS);

/** 第 9 夜首领的候选（数据里标了 final 的首领） */
export const finalBosses = () => Object.keys(EN).filter((k) => EN[k].final);
/** 某个守夜人的隐藏首领 */
export const hiddenBoss = (hero: string) => Object.keys(EN).find((k) => EN[k].hidden === hero) || null;

export const gemCount = () => GEMS.filter((g) => G.gems?.[g] === 1).length;
/** 三颗宝石都拿到，第 15 夜才有隐藏首领 */
export const hiddenOpen = () => G.full && gemCount() === GEMS.length && !!hiddenBoss(G.hero);

export type NightKind = 'plain' | 'elite' | 'boss' | 'hidden' | 'quiet' | 'endless';
/** 这一夜是什么夜：quiet 是完整线第 15 夜宝石不全（只有剧情，不打） */
export function nightKind(r: number): NightKind {
  if (G.endless) return 'endless';
  if (r === MID_BOSS_NIGHT) return 'elite';
  if (r === NIGHTS) return 'boss';
  if (G.full && r === FULL_BOSS2_NIGHT) return 'boss';
  if (G.full && r === FULL_NIGHTS) return hiddenOpen() ? 'hidden' : 'quiet';
  return 'plain';
}
/** 这夜的首领是谁（不是首领夜返回 null） */
export function nightBoss(r: number): string | null {
  const k = nightKind(r);
  if (k === 'boss') return r === NIGHTS ? G.boss9 : G.boss12;
  if (k === 'hidden') return hiddenBoss(G.hero);
  return null;
}
