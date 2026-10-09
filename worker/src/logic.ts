/* 接口的纯逻辑：校验埋点和成绩、清洗昵称、排名条件。不碰 Cloudflare 的运行时，单测直接跑
 * Pure logic for the API: validate events and scores, clean nicknames, build rank conditions. No Cloudflare runtime here, so unit tests run it directly
 */

/** 每日挑战固定 9 夜 / the daily challenge is always 9 nights */
export const DAILY_NIGHTS = 9;
export const NAME_MAX = 12;
export const EVENTS_MAX = 50;
export const PROPS_MAX = 1024;

const UID = /^[A-Za-z0-9-]{8,40}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const EV_NAME = /^[a-z][a-z0-9_]{0,23}$/;
const SHORT = /^[A-Za-z0-9._-]{0,24}$/;

export const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const isUid = (s: unknown): s is string => typeof s === 'string' && UID.test(s);
export const isDay = (s: unknown): s is string => typeof s === 'string' && DAY.test(s) && dayKey(Date.parse(s + 'T00:00:00Z')) === s;

/** 只收今天和昨天（UTC）的成绩：跨零点打完的那一局也能交 / accept scores for today and yesterday (UTC) only, so a run that crosses midnight can still be submitted */
export function dayOpen(day: string, now: number) {
  return day === dayKey(now) || day === dayKey(now - 86400000);
}

const int = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const short = (v: unknown) => (typeof v === 'string' && SHORT.test(v) ? v : '');

/* ---------------- 昵称 ---------------- / ---------------- Nicknames ---------------- */
/** 简单的敏感词表：命中就换成默认昵称。只拦最常见的，宁缺勿滥 / a small blocklist: a hit falls back to the default name. Only the most common words; better to miss some than over-block */
const BLOCK = ['fuck', 'shit', 'bitch', 'nigger', 'nigga', 'cunt', 'admin', '操你', '草泥马', '傻逼', '煞笔', '妈逼', '你妈', '鸡巴', '屌', '婊'];
export const DEFAULT_NAME = '守夜人';

export function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_NAME;
  /* 去掉控制字符、零宽字符和尖括号，合并空白 / strip control and zero-width characters and angle brackets, collapse whitespace */
  const s = [...raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff<>&"'`]/g, '').replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('');
  if (!s) return DEFAULT_NAME;
  const flat = s.toLowerCase().replace(/[\s._\-*]/g, '');
  return BLOCK.some((w) => flat.includes(w)) ? DEFAULT_NAME : s;
}

/* ---------------- 成绩 ---------------- / ---------------- Scores ---------------- */
export interface Score {
  day: string; uid: string; name: string; hero: string; heat: number; nights: number; wall: number; kills: number; won: number;
}

/** 校验一条成绩，不合法返回错误原因 / validate a score; returns the reason when invalid */
export function parseScore(b: any, now: number): Score | string {
  if (!b || typeof b !== 'object') return 'body';
  if (!isDay(b.day) || !dayOpen(b.day, now)) return 'day';
  if (!isUid(b.uid)) return 'uid';
  const hero = typeof b.hero === 'string' && /^[a-z]{1,16}$/.test(b.hero) ? b.hero : null;
  const heat = int(b.heat, 0, 8),
    nights = int(b.nights, 0, DAILY_NIGHTS),
    wall = int(b.wall, 0, 200),
    kills = int(b.kills, 0, 100000),
    won = b.won === true || b.won === 1 ? 1 : b.won === false || b.won === 0 ? 0 : null;
  if (hero == null || heat == null || nights == null || wall == null || kills == null || won == null) return 'fields';
  /* 守到黎明就是守满 9 夜；没守住的城墙一定是 0 / reaching dawn means all 9 nights; a fallen wall is always 0 */
  if (won ? nights !== DAILY_NIGHTS : nights >= DAILY_NIGHTS) return 'won';
  return { day: b.day, uid: b.uid, name: cleanName(b.name), hero, heat, nights, wall: won ? wall : 0, kills, won };
}

/** 排名规则：先比守住几夜，再比城墙剩余，再比击杀，最后先交的在前 / ranking: nights held, then wall left, then kills, then earliest submission */
export const RANK_ORDER = 'nights DESC, wall DESC, kills DESC, ts ASC';
/** 比这条成绩更好的条件（名次 = 满足条件的条数 + 1） / the condition for a better score (rank = matching rows + 1) */
export const BETTER =
  '(nights > ?1 OR (nights = ?1 AND (wall > ?2 OR (wall = ?2 AND (kills > ?3 OR (kills = ?3 AND ts < ?4))))))';

/* ---------------- 埋点 ---------------- / ---------------- Events ---------------- */
export interface EvRow {
  ts: number; day: string; uid: string; sid: string; name: string; v: string; plat: string; lang: string; props: string;
}

/** 一批埋点：坏的单条丢掉，整批坏了返回错误原因 / a batch of events: bad single events are dropped; a bad batch returns the reason */
export function parseEvents(b: any, now: number): EvRow[] | string {
  if (!b || typeof b !== 'object' || !Array.isArray(b.ev)) return 'body';
  if (!isUid(b.uid)) return 'uid';
  const sid = isUid(b.sid) ? b.sid : '';
  const v = short(b.v),
    plat = short(b.plat),
    lang = short(b.lang);
  const rows: EvRow[] = [];
  for (const e of b.ev.slice(0, EVENTS_MAX)) {
    if (!e || typeof e !== 'object' || typeof e.n !== 'string' || !EV_NAME.test(e.n)) continue;
    /* 客户端时间只信个大概：差太多就用服务器时间 / client time is only roughly trusted: fall back to server time when far off */
    const ts = typeof e.t === 'number' && Math.abs(e.t - now) < 7 * 86400000 ? Math.round(e.t) : now;
    let props = '{}';
    if (e.p && typeof e.p === 'object') {
      const s = JSON.stringify(e.p);
      if (s.length <= PROPS_MAX) props = s;
    }
    rows.push({ ts, day: dayKey(ts), uid: b.uid, sid, name: e.n, v, plat, lang, props });
  }
  return rows;
}

/** 允许的来源：ALLOWED_ORIGINS 用逗号分隔，填 * 表示都放行 / allowed origins: ALLOWED_ORIGINS is comma-separated; * allows all */
export function allowOrigin(origin: string | null, allowed: string | undefined) {
  const list = (allowed || '*').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes('*')) return '*';
  return origin && list.includes(origin) ? origin : null;
}
