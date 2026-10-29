/* 模组世界：一个模组可以带一整个自己的世界（开场、敌人套、首领、事件、店里的卡、剧情、战斗规则）。
 * 人物写了 def.world，选了这个人，这一局就进那个世界；原版人物的局完全不受影响。
 * 这里放世界的登记表和各处要用的判断，规则代码（sim/、app/）只来这里问「这一局能不能出这个」。
 * Mod worlds: a mod can bring a whole world of its own (opening, enemy set, bosses, events, shop cards, story, battle rules). A hero with def.world starts their runs in that world; base heroes' runs are untouched. This holds the world registry and the checks used everywhere; rules code (sim/, app/) only asks here whether something may appear this run.
 */
import { HEROES } from '../data/heroes';
import type { Card } from './state';
import { G } from './state';
import type { ItemDef } from '../data/types';

export type Hook = (x: Record<string, any>) => void;
/** 改一张卡的数值：返回要加的固定伤害、百分比加成、独立乘区、攻速 / adjust one card's numbers: return flat damage, percentage bonuses, independent multipliers and attack speed to add */
export type StatHook = (c: Card | (Partial<Card> & { key: string }), it: ItemDef) => { flat?: number; pct?: [string, number][]; xs?: [string, number][]; spd?: number } | void;

export interface WorldDef {
  id: string;
  n: string;
  d?: string;
  /** 这个世界固定用哪套敌人（模组 foesets 里的名字） / the enemy set this world always uses (a key in the mod's foesets) */
  foeSet?: string;
  /** 原版的东西还出不出：默认原版的通用卡、遗物、天赋、事件都照常出；写 false 就不出 / whether base-game things still appear: by default base neutral cards, relics, talents and events all do; false turns that kind off */
  base?: { cards?: boolean; relics?: boolean; talents?: boolean; events?: boolean };
  /** 这个世界里不出的原版事件 / base events that never appear in this world */
  noEvents?: string[];
  /** 第一夜第一站固定的门（原版是商店和战场） / night 1's fixed first doors (the base game uses shop and field) */
  firstDoors?: string[];
  /** 剧情：按 src/locales/zh-CN/story.ts 的结构写，这个世界的局里盖在公共剧情上面 / story in the shape of src/locales/zh-CN/story.ts, laid over the shared story during this world's runs */
  story?: Record<string, any>;
  /** 这个世界里给原版东西换个名字或图标：{ relics: { gem_red: { n, f } }, events: { spring: { ico, n } } } / rename or re-icon base things in this world */
  rename?: Record<string, Record<string, Record<string, any>>>;
  /** 战斗事件（和天赋钩子一样，另有 end：一场打完） / battle events (same as talent hooks, plus end: a fight finished) */
  hooks?: Record<string, Hook>;
  /** 改卡的数值（这个世界的局里每张卡都过一遍） / adjust card numbers (every card goes through it in this world's runs) */
  stat?: StatHook;
  /** 进到一夜的备战（开新局、读档、守住一夜之后都会调） / entering a night's prep (called on a new run, on load and after each held night) */
  night?: () => void;
  /** 备战页「今晚情报」里多写一行（返回 HTML） / an extra line in prep's 'tonight' intel (returns HTML) */
  note?: () => string;
}

export const WORLDS: Record<string, WorldDef> = {};
/** 人物自己的战斗钩子和数值钩子（天性写代码的那一半） / heroes' own battle hooks and stat hooks (the code half of a nature) */
export const HERO_HOOKS: Record<string, Record<string, Hook>> = {};
export const HERO_STATS: Record<string, StatHook> = {};

/** 这一局在哪个世界（原版是空串） / which world this run is in ('' for the base game) */
export const worldId = (h = G.hero) => HEROES[h]?.world || '';
export const curWorld = (): WorldDef | null => WORLDS[worldId()] || null;

/** 一样东西属于哪个世界：自己写的 world，不然看它的专属人物 / which world a thing belongs to: its own world, else its hero's */
export const ownerWorld = (d: { world?: string; hero?: string }) => d.world || (d.hero ? worldId(d.hero) : '');

/** 这一局能不能出这样东西：原版的局只出原版的；世界里出这个世界的，再加原版里不带人物的通用东西（世界可以关掉） / whether this thing may appear this run: base runs only see base things; a world sees its own plus base neutral things (which the world can turn off) */
export function inWorld(d: { world?: string; hero?: string } | undefined, kind: 'cards' | 'relics' | 'talents' | 'events') {
  if (!d) return false;
  const w = worldId();
  const o = ownerWorld(d);
  if (o === w) return true;
  if (!w || o || d.hero) return false;
  return WORLDS[w]?.base?.[kind] !== false;
}
/** 敌人（首领轮换用）：严格按世界分 / enemies (for boss rotation): strictly by world */
export const enemyInWorld = (d: { world?: string; hidden?: string } | undefined) => !!d && (d.world || (d.hidden ? worldId(d.hidden) : '')) === worldId();

/** 这一局生效的战斗钩子：世界的 + 人物的 / battle hooks active this run: the world's plus the hero's */
export function runHooks(ev: string, x: Record<string, any> = {}) {
  const W = curWorld();
  W?.hooks?.[ev]?.(x);
  HERO_HOOKS[G.hero]?.[ev]?.(x);
}
/** 这一局生效的数值钩子 / stat hooks active this run */
export function statHooks(): StatHook[] {
  const out: StatHook[] = [];
  const W = curWorld();
  if (W?.stat) out.push(W.stat);
  if (HERO_STATS[G.hero]) out.push(HERO_STATS[G.hero]);
  return out;
}

/** 世界自己的局内状态（存档里跟着走）：牌型等级、盲注、清卡次数…… / the world's own run state (saved with the run): hand levels, blinds, purge count… */
export const ws = (): Record<string, any> => (G.ws ||= {});

/** 模组敌人的代码钩子（类型见 src/mod/types.ts 的 EnemyHook） / mod enemies' code hooks (type: EnemyHook in src/mod/types.ts) */
export const ENEMY_HOOKS: Record<string, import('../mod/types').EnemyHook> = {};
/** 模组事件的代码：出现条件和进门之后做什么 / mod events' code: when they appear and what happens on entering */
export const EVENT_CODE: Record<string, Pick<import('../mod/types').ModEvent, 'need' | 'enter'>> = {};
