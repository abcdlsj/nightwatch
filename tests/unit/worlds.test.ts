/* 模组世界：杀戮尖塔、小丑牌能加载、两个世界互不串门，每个人物都能打完前几夜，首领能打 / Mod worlds: Slay the Spire and Balatro load cleanly, worlds stay apart, every hero clears the first nights, and bosses can be fought */
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
import deal, { bestHand, ctx, hpMul } from '../../mods/midnight-deal';
import { newCard, stats } from '../../src/game/cards';

const MODS = [deal, spire];
const HERO_LIST = ['ironclad', 'silent', 'dk_red', 'dk_plasma'];

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
    newRun('ironclad', 0, 1);
    expect(curWorld()!.id).toBe('spire');
    expect(finalBosses().every((k) => EN[k].world === 'spire')).toBe(true);
    for (let i = 0; i < 200; i++) {
      const it = ITEMS[rollItem()];
      expect(!it.hero || HEROES[it.hero].world === 'spire').toBe(true);
      expect(!it.world || it.world === 'spire').toBe(true);
    }
    expect(hiddenBoss('ironclad')).toBe('sts_heart');
    expect(hiddenBoss('silent')).toBe('sts_heart2');
    expect((L.story as any).nights[0].title).toContain('底层');
    newRun('dk_plasma', 0, 1);
    expect(curWorld()!.id).toBe('deal');
    for (let i = 0; i < 200; i++) expect(ITEMS[rollItem()].world).not.toBe('spire');
    expect(finalBosses().every((k) => EN[k].world === 'deal')).toBe(true);
    expect((L.story as any).nights[0].title).toContain('小盲');
    newRun('ayla', 0, 1);
    expect((L.story as any).nights[0].title).not.toContain('底层');
    expect((L.story as any).nights[0].title).not.toContain('小盲');
  });

  for (const h of HERO_LIST)
    it(`${h} 的两套起手都能打完前两夜`, () => {
      for (const k of [0, 1]) {
        newRun(h, k, 7 + k);
        for (const r of [1, 2]) expect(night(r)).toBe('win');
      }
    });

  it('牌型：按点数和花色凑，只有凑进去的牌计分', () => {
    newRun('dk_red', 0, 1);
    const mk = (ks: string[]) => ks.map((k) => newCard(k, ITEMS[k].t));
    expect(bestHand(mk(['pc_s2', 'pc_h9'])).id).toBe('high');
    const p = bestHand(mk(['pc_s9', 'pc_h9', 'pc_c3']));
    expect(p.id).toBe('pair');
    expect(p.scoring.length).toBe(2);
    expect(bestHand(mk(['pc_s9', 'pc_h9', 'pc_c3', 'pc_d3'])).id).toBe('two');
    expect(bestHand(mk(['pc_sa', 'pc_h2', 'pc_c3', 'pc_d4', 'pc_s5'])).id).toBe('straight');
    expect(bestHand(mk(['pc_h2', 'pc_h7', 'pc_h9', 'pc_hj', 'pc_hk', 'pc_s9'])).id).toBe('flush');
    expect(bestHand(mk(['pc_h9', 'pc_ht', 'pc_hj', 'pc_hq', 'pc_hk'])).id).toBe('sflush');
    expect(bestHand(mk(['pc_s9', 'pc_h9', 'pc_c9', 'pc_d4', 'pc_s4'])).id).toBe('full');
    expect(bestHand(mk(['pc_h2', 'pc_h7', 'pc_h9', 'pc_hj', 'pc_s9']), { four: true }).id).toBe('flush');
  });

  it('计分：筹码 × 倍率，小丑在背包里也算，敌人血量跟着底注涨', () => {
    newRun('dk_red', 0, 1);
    const x = ctx();
    expect(x.hand.id).toBe('pair');
    expect(x.scoring.size).toBe(2);
    expect(x.jokers.map((j) => j.key)).toEqual(['jk_jolly']);
    const k = G.cards.find((c) => c.key === 'pc_hk')!;
    /* (10 筹码 + 对子 10) × (对子 2 + 红色牌组 4 + 开心小丑 8) = 280 / (10 + 10) × (2 + 4 + 8) = 280 */
    expect(Math.round(stats(k, null).total)).toBe(280);
    expect(hpMul(9) / hpMul(1)).toBeGreaterThan(8);
  });

  it('第四夜的精英和各个首领都打得起来，不报错', () => {
    for (const [h, boss] of [['ironclad', 'sts_lagavulin'], ['silent', 'sts_heart'], ['dk_plasma', 'dl_tooth'], ['dk_red', 'dl_naneinf']])
      expect(['win', 'lose']).toContain((newRun(h, 0, 3), night(9, boss)));
    for (const h of ['ironclad', 'dk_red']) for (const boss of (newRun(h, 0, 3), finalBosses())) {
      newRun(h, 0, 3);
      const r = night(9, boss);
      expect(['win', 'lose']).toContain(r);
    }
  });
});
