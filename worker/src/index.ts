/* 守夜人的接口（Cloudflare Worker + D1）
 *   POST /e        埋点，一次一批
 *   POST /score    提交每日挑战成绩（每人每天只记第一次）
 *   GET  /board    某天的排行榜：?day=YYYY-MM-DD&uid=...（带 uid 会附上自己的名次）
 * 请求体用 text/plain 发 JSON：浏览器不发预检，sendBeacon 也能用
 * Night Watch API (Cloudflare Worker + D1)
 *   POST /e        analytics events, one batch per request
 *   POST /score    submit a daily-challenge score (only the first per player per day counts)
 *   GET  /board    a day's leaderboard: ?day=YYYY-MM-DD&uid=... (with uid, your own rank is included)
 * Bodies are JSON sent as text/plain, so browsers skip the preflight and sendBeacon works too
 */
import { parseEvents, parseScore, allowOrigin, isDay, isUid, dayKey, RANK_ORDER, BETTER } from './logic';

/* D1 的最小类型，免得多装一个依赖 / minimal D1 types, to avoid another dependency */
interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
interface D1 {
  prepare(sql: string): D1Stmt;
  batch(s: D1Stmt[]): Promise<unknown>;
}
export interface Env {
  DB: D1;
  ALLOWED_ORIGINS?: string;
}

const BODY_MAX = 64 * 1024;
const TOP = 100;

function cors(req: Request, env: Env): Record<string, string> {
  const o = allowOrigin(req.headers.get('Origin'), env.ALLOWED_ORIGINS);
  return o ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' } : {};
}
const json = (data: unknown, h: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...h, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

async function body(req: Request): Promise<any> {
  const len = +(req.headers.get('Content-Length') || 0);
  if (len > BODY_MAX) return null;
  const s = await req.text();
  if (s.length > BODY_MAX) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function postEvents(req: Request, env: Env, h: Record<string, string>) {
  const rows = parseEvents(await body(req), Date.now());
  if (typeof rows === 'string') return json({ ok: false, err: rows }, h, 400);
  if (rows.length) {
    const st = env.DB.prepare('INSERT INTO events (ts, day, uid, sid, name, v, plat, lang, props) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    await env.DB.batch(rows.map((r) => st.bind(r.ts, r.day, r.uid, r.sid, r.name, r.v, r.plat, r.lang, r.props)));
  }
  return json({ ok: true, n: rows.length }, h);
}

async function rankOf(env: Env, day: string, uid: string) {
  const me = await env.DB.prepare('SELECT name, hero, heat, nights, wall, kills, won, ts FROM scores WHERE day = ? AND uid = ?')
    .bind(day, uid)
    .first<{ name: string; hero: string; heat: number; nights: number; wall: number; kills: number; won: number; ts: number }>();
  if (!me) return null;
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM scores WHERE day = ?5 AND ${BETTER}`)
    .bind(me.nights, me.wall, me.kills, me.ts, day)
    .first<{ n: number }>();
  const { ts: _ts, ...rest } = me;
  return { rank: (r?.n || 0) + 1, ...rest };
}

async function postScore(req: Request, env: Env, h: Record<string, string>) {
  const now = Date.now();
  const s = parseScore(await body(req), now);
  if (typeof s === 'string') return json({ ok: false, err: s }, h, 400);
  /* 每人每天只记第一次：重复提交不覆盖 / first submission per player per day wins; resubmitting never overwrites */
  const res = await env.DB.prepare('INSERT OR IGNORE INTO scores (day, uid, name, hero, heat, nights, wall, kills, won, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(s.day, s.uid, s.name, s.hero, s.heat, s.nights, s.wall, s.kills, s.won, now)
    .run();
  return json({ ok: true, first: res.meta.changes > 0, me: await rankOf(env, s.day, s.uid) }, h);
}

async function getBoard(url: URL, env: Env, h: Record<string, string>) {
  const day = url.searchParams.get('day') || dayKey(Date.now());
  if (!isDay(day)) return json({ ok: false, err: 'day' }, h, 400);
  const uid = url.searchParams.get('uid');
  const top = await env.DB.prepare(`SELECT name, hero, heat, nights, wall, kills, won, uid FROM scores WHERE day = ? ORDER BY ${RANK_ORDER} LIMIT ${TOP}`)
    .bind(day)
    .all<{ name: string; hero: string; heat: number; nights: number; wall: number; kills: number; won: number; uid: string }>();
  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ?').bind(day).first<{ n: number }>();
  /* uid 不外传，只标出哪一行是自己 / uids are never sent out; only mark which row is yours */
  const rows = top.results.map(({ uid: u, ...r }, i) => ({ rank: i + 1, ...r, me: !!uid && u === uid }));
  return json({ ok: true, day, total: total?.n || 0, top: rows, me: uid && isUid(uid) ? await rankOf(env, day, uid) : null }, h);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    try {
      if (req.method === 'POST' && url.pathname === '/e') return await postEvents(req, env, h);
      if (req.method === 'POST' && url.pathname === '/score') return await postScore(req, env, h);
      if (req.method === 'GET' && url.pathname === '/board') return await getBoard(url, env, h);
      if (req.method === 'GET' && url.pathname === '/') return json({ ok: true }, h);
      return json({ ok: false, err: 'not found' }, h, 404);
    } catch (e) {
      console.error(e);
      return json({ ok: false, err: 'server' }, h, 500);
    }
  },
};
