/* 无界面跑战斗：同一种子、同一阵容，结果必须完全一样；各人物起手都能正常打完前几夜 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { placeKit } from '../../src/game/prep';
import { KITS, HEROES } from '../../src/data/heroes';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, settleWin, setOnEnd } from '../../src/sim/battle';
import { nightInfo } from '../../src/game/nights';

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

function newRun(hero: string, kit: number, seed: number, foeSet = 'dark') {
  reseed(seed);
  Object.assign(G, { hero, foeSet, boss8: 'eye', round: 1, maxRound: 8, heat: 0, run: freshRun(), cards: [], relics: [], skills: [], gold: 10, endless: false, secret: {}, seenFoes: {} });
  G.wall = G.wallMax = HEROES[hero].wall;
  placeKit(KITS[hero][kit].cards);
  recalcMods();
}

/** 打一夜，返回结果摘要 */
function night(r: number) {
  G.round = r;
  G.phase = 'battle';
  const wave = makeWave(r);
  startBattle({ wave, ambush: false, wager: null, beats: nightInfo(r).beats });
  let steps = 0;
  while (!B!.over && steps < 60 * 300) {
    simStep(1 / 60);
    steps++;
  }
  const b = B!;
  const out = { r, result: b.result, kills: b.kills, wall: Math.round(G.wall * 100) / 100, t: Math.round(b.t * 100) / 100, maxChain: b.maxChain, spawned: wave.length };
  if (b.result === 'win') settleWin();
  return out;
}

describe('战斗模拟', () => {
  it('同一种子结果完全一致', () => {
    const run = () => {
      newRun('mo', 0, 12345);
      return [night(1), night(2), night(3)];
    };
    const a = run(),
      b = run();
    expect(a).toEqual(b);
    expect(a[0].result).toBe('win');
    expect(a[0].kills).toBeGreaterThan(20);
  });

  it('不同种子会打出不同的局面', () => {
    newRun('ayla', 0, 1);
    const a = night(1);
    newRun('ayla', 0, 2);
    const b = night(1);
    expect(a.t === b.t && a.kills === b.kills && a.spawned === b.spawned).toBe(false);
  });

  for (const hero of Object.keys(HEROES))
    for (let k = 0; k < 4; k++)
      it(`${hero} 起手 ${k}：第一夜能正常打完（霜潮）`, () => {
        newRun(hero, k, 1000 + k, 'frost');
        const r = night(1);
        expect(['win', 'lose']).toContain(r.result);
        expect(r.kills).toBeGreaterThan(0);
      });

  it('第八夜首领（两种）都能打起来', () => {
    for (const boss of ['eye', 'brood']) {
      newRun('mo', 0, 77);
      G.boss8 = boss;
      const r = night(8);
      expect(r.result).toBe('lose');
      expect(r.spawned).toBeGreaterThan(50);
    }
  });
});
