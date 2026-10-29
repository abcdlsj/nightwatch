/* 进出模组世界：把世界的剧情盖到公共剧情上，给原版东西换名字和图标；回到原版的局时全部还原。
 * 开新局、读档、换语言之后都要调一次 enterWorld()。
 * Entering and leaving a mod world: lay the world's story over the shared story and rename / re-icon base things; restore everything for base runs. Call enterWorld() after a new run, a load and a language switch.
 */
import { L } from '../i18n';
import { RELICS } from '../data/relics';
import { EVENTS } from '../data/events';
import { EN } from '../data/enemies';
import { ITEMS } from '../data/cards';
import { TALENTS } from '../data/talents';
import { curWorld, worldId } from '../game/world';

/** 深合并（数组整个换掉） / deep merge (arrays are replaced whole) */
export function deepMerge(into: any, from: any) {
  for (const k in from) {
    if (from[k] && typeof from[k] === 'object' && !Array.isArray(from[k]) && into[k] && typeof into[k] === 'object' && !Array.isArray(into[k])) deepMerge(into[k], from[k]);
    else into[k] = from[k];
  }
  return into;
}
const clone = (o: any) => JSON.parse(JSON.stringify(o));

/** 每个语言包自己的公共剧情（盖世界剧情之前的那份） / each locale pack's own shared story (before any world story is laid over it) */
const BASE = new WeakMap<object, any>();
export function baseStory(): any {
  if (!BASE.has(L)) BASE.set(L, L.story);
  return BASE.get(L);
}
/** 世界剧情的缓存：同一个语言包、同一个世界只合并一次 / world story cache: merged once per locale pack and world */
const MERGED = new WeakMap<object, Record<string, any>>();

const REGS: Record<string, Record<string, any>> = { relics: RELICS, events: EVENTS, enemies: EN, cards: ITEMS, talents: TALENTS };
/** 换掉之前的原值，回到原版时还原 / original values before renaming, restored when leaving the world */
let saved: { reg: Record<string, any>; k: string; f: string; v: any }[] = [];
let inWorld = '';

export function restoreRenames() {
  for (const s of saved.reverse()) if (s.reg[s.k]) s.reg[s.k][s.f] = s.v;
  saved = [];
  inWorld = '';
}

export function enterWorld() {
  const w = worldId();
  const base = baseStory();
  const W = curWorld();
  let story = base;
  if (W?.story) {
    let m = MERGED.get(L);
    if (!m) MERGED.set(L, (m = {}));
    story = m[w] ||= deepMerge(clone(base), W.story);
  }
  (L as any).story = story;
  if (inWorld === w && saved.length) return;
  restoreRenames();
  inWorld = w;
  for (const [kind, ents] of Object.entries(W?.rename || {})) {
    const reg = REGS[kind];
    if (!reg) continue;
    for (const [k, fields] of Object.entries(ents)) {
      if (!reg[k]) continue;
      for (const [f, v] of Object.entries(fields)) {
        saved.push({ reg, k, f, v: reg[k][f] });
        reg[k][f] = v;
      }
    }
  }
}
