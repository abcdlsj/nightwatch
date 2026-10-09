/* 每日挑战：按 UTC 日期定种子、人物和难度，全世界同一天打的是同一局。
 * 规则：全部流派开放、首领和剧情由种子定、不算熟练和成就、只有一次机会、战斗中途退出算失守。
 * 状态存在 nw-daily，跟局外进度分开。
 * Daily challenge: the UTC date sets the seed, hero and difficulty, so everyone plays the same run that day.
 * Rules: every archetype is open, the boss and story come from the seed, no mastery or achievements, one attempt only, quitting mid-battle counts as a loss.
 * State lives under nw-daily, apart from meta progress.
 */
import { HERO_ORDER, HEROES } from '../data/heroes';
import { store, KEYS } from '../platform/storage';
import { G, freshRun } from './state';

/** 每日挑战的长夜难度轮换（和 5 个人物错开，20 天走完所有组合） / the daily's Long Night rotation (offset from the 5 heroes so 20 days cover every pairing) */
const HEATS = [0, 1, 2, 3];
const DAY_MS = 86400000;

export const dayKey = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);
const dayNum = (day: string) => Math.floor(Date.parse(day + 'T00:00:00Z') / DAY_MS);

/** FNV-1a：日期字符串变成 32 位种子 / FNV-1a: turn the date string into a 32-bit seed */
export function dailySeed(day: string) {
  let h = 0x811c9dc5;
  for (const c of 'nightwatch-daily:' + day) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface DailySpec {
  day: string;
  seed: number;
  hero: string;
  heat: number;
}
export function dailySpec(day = dayKey()): DailySpec {
  const n = dayNum(day);
  const heroes = HERO_ORDER.filter((h) => HEROES[h]);
  return { day, seed: dailySeed(day), hero: heroes[n % heroes.length], heat: HEATS[n % HEATS.length] };
}

/* ---------------- 本机记录：今天打没打过、结果、交没交 ---------------- / ---------------- Local record: played today or not, the result, submitted or not ---------------- */
export interface DailyResult {
  day: string; hero: string; heat: number; nights: number; wall: number; kills: number; won: boolean;
}
export interface DailyRec {
  day: string;
  /** on：打着呢；done：打完了（res 为空表示这局作废了，比如被新开的一局覆盖） / on: in progress; done: finished (an empty res means the run was voided, e.g. overwritten by a new run) */
  state: 'on' | 'done';
  res?: DailyResult;
  /** 已经交过成绩 / the score has been submitted */
  sent?: boolean;
}

export const dailyRec = (): DailyRec | null => store.json<DailyRec | null>(KEYS.daily, null);
const setRec = (r: DailyRec) => store.setJson(KEYS.daily, r);

/** 今天的每日挑战还能不能开 / whether today's daily can still be started */
export const dailyAvailable = (day = dayKey()) => dailyRec()?.day !== day;

export function markDailyStart(day: string) {
  setRec({ day, state: 'on' });
}
/** 这局的成绩（守住几夜、城墙、击杀） / this run's result (nights held, wall, kills) */
export function dailyResult(won: boolean): DailyResult {
  const R = G.run || freshRun();
  return {
    day: G.daily || '', hero: G.hero, heat: G.heat || 0,
    nights: won ? G.maxRound : Math.max(0, G.round - 1),
    wall: won ? Math.max(0, G.wall) : 0,
    kills: R.kills || 0,
    won,
  };
}
export function markDailyDone(res: DailyResult) {
  const r = dailyRec();
  /* 已经记过结果就不改（结局页重复进来不会刷新成绩） / never overwrite a recorded result (re-entering the end screen won't change it) */
  if (r && r.day === res.day && r.state === 'done' && r.res) return r;
  const n: DailyRec = { day: res.day, state: 'done', res };
  setRec(n);
  return n;
}
export function markDailySent() {
  const r = dailyRec();
  if (r) setRec({ ...r, sent: true });
}
