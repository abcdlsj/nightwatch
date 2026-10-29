/* 模组世界：倒悬塔、子夜牌局能加载、两个世界互不串门，每个人物都能打完前几夜，首领能打 / Mod worlds: the Spire and Midnight Deal load cleanly, worlds stay apart, every hero clears the first nights, and bosses can be fought */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale, L } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { placeKit } from '../../src/game/prep';
import { HEROES, KITS } from '../../src/data/heroes';
import { ITEMS } from '../../src/data/cards';
import { EN } from '../../src/data/enemies';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd, settleWin } from '../../src/sim/battle';
import { finalBosses, hiddenBoss } from '../../src/game/plan';
import { rollItem } from '../../src/game/loot';
import { applyMod } from '../../src/mod/apply';
import { enterWorld } from '../../src/mod/enter';
import { curWorld } from '../../src/game/world';
import spire from '../../mods/spire';
import deal, { bestHand } from '../../mods/midnight-deal';
import { newCard } from '../../src/game/cards';

const MODS = [deal, spire];
const HERO_LIST = ['chishi', 'qingji', 'choujue', 'zhangfang'];

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
  for (const m of MODS) expect(applyMod(m).errors).toEqual([]);
});

function newRun(hero: string, kit: number, seed: number) {
  reseed(seed);
  const W = HEROES[hero].world ? curWorldOf(hero) : 'dark';
  Object.assign(G, { hero, foeSet: W, round: 1, maxRound: 9, heat: 0, run: freshRun(), cards: [], relics: [], skills: [], gold: 10, endless: false, full: false, secret: {}, seenFoes: {}, ws: {} });
  enterWorld();
  G.wall = G.wallMax = HEROES[hero].wall;
  placeKit(KITS[hero][kit].cards);
  recalcMods();
}
const curWorldOf = (hero: string) => {
  G.hero = hero;
  return curWorld()!.foeSet!;
};
function night(r: number, boss?: string) {
  G.round = r;
  G.phase = 'battle';
  const wave = boss ? [{ t: 1, type: boss, x: 0.5, y: 0 }] as never : makeWave(r);
  startBattle({ wave, ambush: false, wagers: [], beats: [] });
  for (let i = 0; i < 60 * 300 && !B!.over; i++) simStep(1 / 60);
  const res = B!.result;
  if (res === 'win') settleWin();
  return res;
}

describe('模组世界', () => {
  it('世界的东西只在自己的世界里出', () => {
    newRun('ayla', 0, 1);
    expect(curWorld()).toBeNull();
    for (let i = 0; i < 200; i++) expect(ITEMS[rollItem()].world).toBeUndefined();
    expect(finalBosses().some((k) => EN[k].world)).toBe(false);
    newRun('chishi', 0, 1);
    expect(curWorld()!.id).toBe('spire');
    expect(finalBosses().every((k) => EN[k].world === 'spire')).toBe(true);
    for (let i = 0; i < 200; i++) {
      const it = ITEMS[rollItem()];
      expect(!it.hero || HEROES[it.hero].world === 'spire').toBe(true);
      expect(!it.world || it.world === 'spire').toBe(true);
    }
    expect(hiddenBoss('chishi')).toBe('sp_heart');
    expect((L.story as any).nights[0].title).toContain('塔脚');
    newRun('zhangfang', 0, 1);
    expect(curWorld()!.id).toBe('deal');
    for (let i = 0; i < 200; i++) expect(ITEMS[rollItem()].world).not.toBe('spire');
    expect(finalBosses().every((k) => EN[k].world === 'deal')).toBe(true);
    expect((L.story as any).nights[0].title).toContain('小盲');
    newRun('ayla', 0, 1);
    expect((L.story as any).nights[0].title).not.toContain('塔脚');
    expect((L.story as any).nights[0].title).not.toContain('小盲');
  });

  for (const h of HERO_LIST)
    it(`${h} 的两套起手都能打完前两夜`, () => {
      for (const k of [0, 1]) {
        newRun(h, k, 7 + k);
        for (const r of [1, 2]) expect(night(r)).toBe('win');
      }
    });

  it('牌型：按元素凑，鬼牌当任何元素', () => {
    newRun('choujue', 0, 1);
    const mk = (ks: string[]) => ks.map((k) => newCard(k, ITEMS[k].t));
    expect(bestHand(mk(['dl_juggle', 'dl_pins']))).toBe('high');
    expect(bestHand(mk(['dl_juggle', 'dl_grin']))).toBe('pair');
    expect(bestHand(mk(['dl_juggle', 'dl_whip', 'dl_flushjoker', 'dl_grin']))).toBe('four');
    expect(bestHand(mk(['dl_pins', 'dl_juggle', 'dl_twitch', 'dl_collector']))).toBe('straight');
    expect(bestHand(mk(['dl_juggle', 'dl_whip', 'dl_finale', 'dl_flushjoker', 'dl_grin']))).toBe('sflush');
  });

  it('第四夜的精英和各个首领都打得起来，不报错', () => {
    for (const [h, boss] of [['chishi', 'sp_rustknight'], ['chishi', 'sp_heart'], ['zhangfang', 'dl_dealer'], ['choujue', 'dl_house']])
      expect(['win', 'lose']).toContain((newRun(h, 0, 3), night(9, boss)));
    for (const h of ['chishi', 'choujue']) for (const boss of (newRun(h, 0, 3), finalBosses())) {
      newRun(h, 0, 3);
      const r = night(9, boss);
      expect(['win', 'lose']).toContain(r);
    }
  });
});
