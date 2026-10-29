/* 连招谱：成型阵容打一夜，会记下打出的组合，并且每种这局只报一次 / Combo book: an assembled lineup records the combos it performs in one night, and each is announced only once per run */
import { it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { newCard } from '../../src/game/cards';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { setView, nullView } from '../../src/sim/view';
import { COMBO } from '../../src/data/combos';
import { HEROES } from '../../src/data/heroes';
import { ARCHS, boardFor, relicsFor, talentsFor } from '../balance/builds';

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

it('成型阵容打一夜能记下组合，每种只报一次', () => {
  const said: string[] = [];
  setView({ ...nullView, discover: (id) => said.push(id) });
  const arch = 'ice';
  const r = 6;
  reseed(3);
  const H = HEROES[ARCHS[arch].hero];
  Object.assign(G, { hero: ARCHS[arch].hero, foeSet: 'dark', boss9: 'eye', round: r, maxRound: 9, heat: 0, run: freshRun(), cards: [], relics: relicsFor(arch, r), skills: talentsFor(arch, r), gold: 0, endless: false, secret: {}, seenFoes: {}, phase: 'battle' });
  G.wall = G.wallMax = H.wall;
  let x = 0;
  for (const [key, tier, adj] of boardFor(arch, r)) {
    const c = newCard(key, tier, adj || null);
    c.loc = 'board';
    c.idx = x;
    x += c.size;
    G.cards.push(c);
  }
  recalcMods();
  startBattle({ wave: makeWave(r), ambush: false, wagers: [], beats: [] });
  for (let i = 0; i < 60 * 300 && !B!.over; i++) simStep(1 / 60);
  setView(nullView);
  expect(said.length).toBeGreaterThan(0);
  expect(new Set(said).size).toBe(said.length);
  for (const id of said) expect(COMBO[id]).toBeTruthy();
  expect(G.run!.combos).toEqual(said);
});
