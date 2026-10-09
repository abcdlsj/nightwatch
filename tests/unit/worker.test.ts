/* 接口的校验逻辑（worker/src/logic.ts）：成绩、埋点、昵称、跨域 / API validation (worker/src/logic.ts): scores, events, nicknames, CORS */
import { describe, it, expect } from 'vitest';
import { parseScore, parseEvents, cleanName, allowOrigin, isDay, DEFAULT_NAME } from '../../worker/src/logic';

const NOW = Date.parse('2026-10-09T12:00:00Z');
const ok = { day: '2026-10-09', uid: 'abcdef12-3456', name: '小明', hero: 'mo', heat: 2, nights: 6, wall: 0, kills: 340, won: false };

describe('成绩', () => {
  it('合法的成绩原样收下', () => {
    expect(parseScore(ok, NOW)).toEqual({ ...ok, won: 0 });
  });
  it('只收今天和昨天', () => {
    expect(typeof parseScore({ ...ok, day: '2026-10-08' }, NOW)).toBe('object');
    expect(parseScore({ ...ok, day: '2026-10-07' }, NOW)).toBe('day');
    expect(parseScore({ ...ok, day: '2026-10-10' }, NOW)).toBe('day');
    expect(isDay('2026-02-30')).toBe(false);
  });
  it('守到黎明必须是 9 夜，没守住不能是 9 夜，没守住城墙按 0 算', () => {
    expect(parseScore({ ...ok, won: true, nights: 8 }, NOW)).toBe('won');
    expect(parseScore({ ...ok, won: false, nights: 9 }, NOW)).toBe('won');
    expect((parseScore({ ...ok, wall: 12 }, NOW) as any).wall).toBe(0);
    expect((parseScore({ ...ok, won: true, nights: 9, wall: 12 }, NOW) as any).wall).toBe(12);
  });
  it('数值越界、类型不对都拒收', () => {
    expect(parseScore({ ...ok, kills: -1 }, NOW)).toBe('fields');
    expect(parseScore({ ...ok, heat: 9 }, NOW)).toBe('fields');
    expect(parseScore({ ...ok, nights: 2.5 }, NOW)).toBe('fields');
    expect(parseScore({ ...ok, hero: '<x>' }, NOW)).toBe('fields');
    expect(parseScore({ ...ok, uid: 'short' }, NOW)).toBe('uid');
    expect(parseScore(null, NOW)).toBe('body');
  });
});

describe('昵称', () => {
  it('去掉控制字符和尖括号，截到 12 个字', () => {
    expect(cleanName('  <b>守夜​人</b>  ')).toBe('b守夜人/b');
    expect(cleanName('一二三四五六七八九十甲乙丙丁')).toBe('一二三四五六七八九十甲乙');
  });
  it('空的、不是字符串的、命中敏感词的用默认昵称', () => {
    expect(cleanName('   ')).toBe(DEFAULT_NAME);
    expect(cleanName(42)).toBe(DEFAULT_NAME);
    expect(cleanName('F.u.c.k you')).toBe(DEFAULT_NAME);
  });
});

describe('埋点', () => {
  it('坏的单条丢掉，时间离谱的用服务器时间', () => {
    const rows = parseEvents(
      { uid: 'abcdef12-3456', sid: 'sess-12345678', v: '0.2.0', plat: 'web', lang: 'zh-CN', ev: [{ n: 'open', t: NOW - 1000, p: { a: 1 } }, { n: 'Bad Name', t: NOW }, { n: 'run_end', t: 0 }] },
      NOW,
    );
    expect(Array.isArray(rows)).toBe(true);
    const r = rows as Exclude<typeof rows, string>;
    expect(r.map((x) => x.name)).toEqual(['open', 'run_end']);
    expect(r[0]).toMatchObject({ ts: NOW - 1000, day: '2026-10-09', props: '{"a":1}', plat: 'web' });
    expect(r[1].ts).toBe(NOW);
  });
  it('一批最多 50 条，props 太大的丢成空对象', () => {
    const ev = Array.from({ length: 80 }, () => ({ n: 'x', t: NOW, p: { s: 'a'.repeat(2000) } }));
    const r = parseEvents({ uid: 'abcdef12-3456', ev }, NOW) as any[];
    expect(r.length).toBe(50);
    expect(r[0].props).toBe('{}');
  });
  it('没有 uid 整批拒收', () => {
    expect(parseEvents({ ev: [] }, NOW)).toBe('uid');
  });
});

describe('跨域', () => {
  it('* 都放行；列表里的放行；别的不放行', () => {
    expect(allowOrigin('https://a.com', '*')).toBe('*');
    expect(allowOrigin('https://a.com', 'https://a.com, https://b.com')).toBe('https://a.com');
    expect(allowOrigin('https://c.com', 'https://a.com')).toBe(null);
  });
});
