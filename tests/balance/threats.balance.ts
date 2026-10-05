/* 按敌情分开看守住率：每个流派的成型阵容打若干种子，按这夜抽到的敌情统计（带 * 的是主力）。调 THREATS 的 pw 用
 * 用法：NIGHTS=7,8 N=10 npx vitest run -c vitest.balance.config.ts tests/balance/threats.balance.ts --reporter=verbose
 * Hold rate split by threat: each archetype's assembled lineup plays several seeds, tallied by the night's drawn threats (* marks the main one). Used to tune THREATS pw. Usage as above
 */
import { it, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { newCard } from '../../src/game/cards';
import { HEROES } from '../../src/data/heroes';
import { RELICS } from '../../src/data/relics';
import { TALENTS } from '../../src/data/talents';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { ARCHS, boardFor, relicsFor, talentsFor, carryFor } from './builds';
import { finalBosses } from '../../src/game/plan';
beforeAll(() => { initLocale(); setOnEnd(() => {}); });
function night(arch: string, r: number, seed: number) {
  const A = ARCHS[arch]; reseed(seed); const H = HEROES[A.hero];
  Object.assign(G, { hero: A.hero, seed, heat: 0, run: freshRun(), round: r, maxRound: 9, endless: false, gold: 0, cards: [], relics: relicsFor(arch, r), skills: talentsFor(arch, r), secret: {}, seenFoes: {}, foeSet: 'dark', phase: 'battle', speed: 1, full: false, gems: {}, boss9: finalBosses()[seed % 5] });
  let x = 0; for (const [k, t, a] of boardFor(arch, r)) { const c = newCard(k, t, a || null); c.loc = 'board'; c.idx = x; x += c.size; G.cards.push(c); }
  const cr = carryFor(arch, r, G.cards.map((c) => c.key)); if (cr) { const c = G.cards.find((x) => x.key === cr.key)!; c.carry = true; c.star = cr.star; }
  recalcMods();
  const wm = [...G.relics.map((k) => RELICS[k].m.wall || 0), ...G.skills.map((k) => TALENTS[k].m.wall || 0)].reduce((s, v) => s + v, 0);
  G.wallMax = G.wall = Math.max(5, H.wall + wm);
  const w = makeWave(r);
  startBattle({ wave: w, ambush: false, wager: null, beats: [] });
  let n = 0; while (!B!.over && n++ < 24000) simStep(1 / 60);
  return { win: B!.result === 'win', lost: B!.wallLost, th: w.threats! };
}
it('按敌情分开看', () => {
  const R = (process.env.NIGHTS || '6,9').split(',').map(Number);
  const archs = Object.keys(ARCHS);
  for (const r of R) {
    const stat: Record<string, [number, number, number]> = {};
    for (const a of archs) for (let s = 1; s <= +(process.env.N || 12); s++) {
      const o = night(a, r, s * 7919 + r);
      for (const [i, k] of o.th.entries()) { const z = (stat[k + (i ? '' : '*')] ||= [0, 0, 0]); z[0]++; z[1] += +o.win; z[2] += o.lost; }
    }
    console.log(`第${r}夜`, Object.entries(stat).sort().map(([k, [n, w, l]]) => `${k}:${Math.round((100 * w) / n)}%/${(l / n).toFixed(0)} n${n}`).join('  '));
  }
}, 3_600_000);
