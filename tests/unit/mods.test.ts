/* 模组：示例模组能通过检查、合并进各张表，人物能正常打一夜，首领进第九夜轮换；写错的条目会被跳过并报出来 / Mods: the sample mod passes validation and merges into the tables, its hero can play a night, its boss joins the night-9 rotation, and invalid entries are skipped and reported */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale, L } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { placeKit } from '../../src/game/prep';
import { HEROES, KITS } from '../../src/data/heroes';
import { ITEMS } from '../../src/data/cards';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { finalBosses } from '../../src/game/plan';
import { applyMod } from '../../src/mod/apply';
import example from '../../mods/_example';

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

describe('模组', () => {
  it('示例模组没有错误，内容都合并进去了', () => {
    const r = applyMod(example);
    expect(r.errors).toEqual([]);
    expect(HEROES.wei?.n).toBe('苇');
    expect(ITEMS.tide?.hero).toBe('wei');
    expect(finalBosses()).toContain('reedking');
    expect((L as any).heroStory.wei.arcs.length).toBe(1);
  });

  it('模组人物能打一夜', () => {
    reseed(3);
    Object.assign(G, { hero: 'wei', foeSet: 'dark', round: 1, maxRound: 9, heat: 0, run: freshRun(), cards: [], relics: [], skills: [], gold: 10, endless: false, full: false, secret: {}, seenFoes: {} });
    G.wall = G.wallMax = HEROES.wei.wall;
    placeKit(KITS.wei[0].cards);
    recalcMods();
    G.phase = 'battle';
    startBattle({ wave: makeWave(1), ambush: false, wager: null, beats: [] });
    for (let i = 0; i < 60 * 120 && !B!.over; i++) simStep(1 / 60);
    expect(['win', 'lose']).toContain(B!.result);
    expect(B!.kills).toBeGreaterThan(0);
  });

  it('写错的条目被跳过，并说明原因', () => {
    const r = applyMod({
      id: 'bad-one',
      name: '坏的',
      cards: { dagger: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1, dmg: 5, fx: 'knife', n: 'x', d: 'x', f: '' }, weird: { size: 4, tag: 'wood', t: 0, up: 'cd', cd: 1, dmg: 5, fx: 'laser', n: 'x', d: 'x', f: '' } as never },
      enemies: { blob: { hp: 10, spd: 0.05, armor: 0, wall: 1, spr: 'slime', sc: 1, col: '#fff', faction: 'swamp', n: '团子', intents: [{ t: 3, a: 'dance', n: '', d: '' }] } },
      sprites: { oops: ['ab', 'abc'] },
    });
    expect(r.errors.some((e) => e.includes('dagger') && e.includes('重名'))).toBe(true);
    expect(r.errors.some((e) => e.includes('weird'))).toBe(true);
    expect(r.errors.some((e) => e.includes('dance'))).toBe(true);
    expect(r.errors.some((e) => e.includes('oops'))).toBe(true);
    expect(ITEMS.weird).toBeUndefined();
  });
});
