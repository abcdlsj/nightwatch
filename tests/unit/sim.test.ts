/* 无界面跑战斗：同一种子、同一阵容，结果必须完全一样；各人物起手都能正常打完前几夜 / Headless battles: the same seed and lineup must give identical results; every hero's opening can clear the first nights */
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
import { finalBosses, hiddenBoss, nightKind } from '../../src/game/plan';
import { EN } from '../../src/data/enemies';
import { INTENTS } from '../../src/sim/enemies';

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

function newRun(hero: string, kit: number, seed: number, foeSet = 'dark') {
  reseed(seed);
  Object.assign(G, { hero, foeSet, boss9: 'eye', round: 1, maxRound: 9, heat: 0, run: freshRun(), cards: [], relics: [], skills: [], gold: 10, endless: false, secret: {}, seenFoes: {} });
  G.wall = G.wallMax = HEROES[hero].wall;
  placeKit(KITS[hero][kit].cards);
  recalcMods();
}

/** 打一夜，返回结果摘要 / play one night and return a result summary */
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

  it('第九夜首领（五个）都能打起来，招式都认识', () => {
    expect(finalBosses().length).toBe(5);
    for (const boss of finalBosses()) {
      for (const it of EN[boss].intents || []) expect(INTENTS[it.a], `${boss} 的招式 ${it.a}`).toBeTruthy();
      newRun('mo', 0, 77);
      G.boss9 = boss;
      const r = night(9);
      expect(r.result).toBe('lose');
      expect(r.spawned).toBeGreaterThan(50);
    }
  });

  it('完整线：每个人物都有隐藏首领，三颗宝石齐了第十五夜才出现', () => {
    for (const hero of Object.keys(HEROES)) {
      const k = hiddenBoss(hero)!;
      expect(k, hero).toBeTruthy();
      for (const it of EN[k].intents || []) expect(INTENTS[it.a], `${k} 的招式 ${it.a}`).toBeTruthy();
      newRun(hero, 0, 99);
      G.full = true;
      G.gems = { red: 1, blue: 1, green: -1 };
      expect(nightKind(15)).toBe('quiet');
      G.gems.green = 1;
      expect(nightKind(15)).toBe('hidden');
      const r = night(15);
      expect(r.result).toBe('lose');
      G.full = false;
    }
  });

  it('完整线第十到十四夜都能打起来，第十二夜有首领', () => {
    newRun('li', 0, 4);
    G.full = true;
    G.boss12 = 'mistmother';
    for (const r of [10, 11, 12, 13, 14]) {
      const w = makeWave(r);
      expect(w.length, `第${r}夜`).toBeGreaterThan(40);
      if (r === 12) expect(w.some((s) => s.type === 'mistmother')).toBe(true);
    }
    G.full = false;
  });

  it('第八夜（首领前夜）带一个精英', () => {
    newRun('ayla', 0, 5);
    G.round = 8;
    expect(makeWave(8).some((s) => EN[s.type].elite)).toBe(true);
  });
});
