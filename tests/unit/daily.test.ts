/* 每日挑战：同一天所有人一样；不受个人进度影响；不动局外进度 / Daily challenge: identical for everyone on a day; unaffected by personal progress; leaves meta progress alone */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { initLocale } from '../../src/i18n';
import { G, freshRun } from '../../src/game/state';
import { dailySpec, dailySeed, dailyResult } from '../../src/game/daily';
import { HERO_ORDER, PATHS } from '../../src/data/heroes';
import { META, unlock, nextBoss, runMastLv } from '../../src/game/meta';
import { pathOpen, heroUnlocked } from '../../src/game/unlocks';
import { reseed } from '../../src/core/rng';

beforeAll(() => initLocale());
afterEach(() => {
  G.daily = '';
});

describe('每日挑战', () => {
  it('同一天种子、人物、难度固定；不同天种子不同', () => {
    expect(dailySpec('2026-10-09')).toEqual(dailySpec('2026-10-09'));
    expect(dailySeed('2026-10-09')).not.toBe(dailySeed('2026-10-10'));
  });
  it('20 天里每个人物和每档难度都轮到', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const s = dailySpec(new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));
      seen.add(s.hero + ':' + s.heat);
    }
    expect(seen.size).toBe(HERO_ORDER.length * 4);
  });
  it('全部流派、人物都开放，熟练按 0 级算', () => {
    const h = HERO_ORDER[1];
    const last = PATHS[h][PATHS[h].length - 1];
    G.daily = '2026-10-09';
    expect(pathOpen(h, last)).toBe(true);
    expect(heroUnlocked(HERO_ORDER[HERO_ORDER.length - 1])).toBe(true);
    expect(runMastLv()).toBe(0);
  });
  it('不解锁成就，首领不看个人轮换', () => {
    G.daily = '2026-10-09';
    const had = { ...META.ach };
    unlock('rich');
    expect(META.ach).toEqual(had);
    META.bossCycle = { [HERO_ORDER[0]]: ['eye'] };
    reseed(1);
    const a = nextBoss(HERO_ORDER[0]);
    reseed(1);
    G.daily = '';
    const b = nextBoss(HERO_ORDER[0]);
    expect(typeof a).toBe('string');
    expect(b).not.toBe('eye');
    META.bossCycle = {};
  });
  it('成绩：输了算守住的夜数、城墙 0；赢了算 9 夜和剩余城墙', () => {
    Object.assign(G, { daily: '2026-10-09', hero: 'mo', heat: 2, round: 5, maxRound: 9, wall: 7, run: { ...freshRun(), kills: 123 } });
    expect(dailyResult(false)).toEqual({ day: '2026-10-09', hero: 'mo', heat: 2, nights: 4, wall: 0, kills: 123, won: false });
    expect(dailyResult(true)).toMatchObject({ nights: 9, wall: 7, won: true });
  });
});
