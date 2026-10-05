/* 剧情取用：同一段剧情先找这个人物自己的（人物剧情文件，按这局走的那一套），找不到再用公共的。
 * 只挑文本，不碰界面；界面层拿到页面数组后自己播。 */
import { L } from '../i18n';
import { G } from './state';
import type { Gem } from './plan';

/** 剧情页：说话人（hero / narr / 配角 / 敌人）+ 台词；或者标题页 */
export type Page = { who?: string; t?: any; title?: string; act?: string };
/** 夜谈 / 宝石这类对话：几句开场、一个问题、几个回答 */
export interface Scene {
  title: string;
  who: string;
  lines: [string, any][];
  q: string;
}
export interface GemScene extends Scene {
  take: { t: any; re: [string, any][] };
  refuse: { t: any; re: [string, any][] };
}

const S = () => L.story as any;
/** 这个人物的剧情文件（没有就是空对象） */
export const heroStory = (h = G.hero): any => (L as any).heroStory?.[h] || {};
/** 这局走的那一套（人物剧情里的 arcs[G.arc]） */
export const arcOf = (h = G.hero): any => {
  const a = heroStory(h).arcs;
  return (a && a[G.arc % a.length]) || {};
};

/** 完整游戏线里的一段剧情页：人物的优先，公共的兜底 */
export function fullPages(key: 'noDawn' | 'quiet' | 'trueWin'): Page[] {
  const own = heroStory().full?.[key];
  if (own) return own;
  return S().full[key];
}
/** 第 9 夜首领倒下、天却没亮（完整线）：按首领挑 */
export function noDawnPages(boss: string): Page[] {
  const own = heroStory().full?.noDawn;
  const lead = S().full.noDawnBy?.[boss];
  const base: Page[] = own || S().full.noDawn;
  return lead ? [{ who: 'narr', t: lead }, ...base] : base;
}
export function gemScene(g: Gem): GemScene {
  return heroStory().full?.gems?.[g] || S().full.gems[g];
}

/** 夜谈：这套剧情的 → 人物不分套的 → 公共的（按第几次夜谈轮） */
export function talkScene(r: number): any {
  return arcOf().talks?.[r] || heroStory().talks?.[r] || heroStory().full?.talks?.[r] || S().talks[Math.floor((r - 1) / 2) % S().talks.length];
}
/** 这个人物在第 r 夜（或某个首领夜）说的话：有就替换公共剧情里「hero」那几句 */
export function heroBeats(r: number, boss: string | null): [number, string, any][] | null {
  const H = heroStory();
  /* 完整线的夜晚（含第 12、15 夜）先用完整线自己写的 */
  if (r > 9) return H.full?.nights?.[r] || (boss ? H.bosses?.[boss]?.beats : null) || null;
  if (boss) return H.bosses?.[boss]?.beats || null;
  return arcOf().nights?.[r] || null;
}
/** 开场：公共的开场之后，接上这套剧情自己的一两页 */
export function prologuePages(): Page[] {
  return [...(S().prologue as Page[]), ...(arcOf().intro || [])];
}
/** 守到黎明（普通九夜）：按首领、按人物挑 */
export function winPages(boss: string): Page[] {
  const own = heroStory().bosses?.[boss]?.win;
  if (own) return own;
  return [{ who: 'narr', t: S().winBy[boss] || S().win[0].t }, ...S().win.slice(1)];
}
/** 第 15 夜隐藏首领出来之前 */
export const hiddenPrePages = (): Page[] | null => heroStory().full?.hiddenPre || null;
