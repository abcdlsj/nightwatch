/* 规则遗物各自有多强：每个流派的成型阵容带上一件规则遗物，打若干种子，和不带比守住率、掉墙
 * 用法：NIGHTS=8 N=6 [ARCH=fire,ice] [ONLY=kiln,duet] npx vitest run -c vitest.balance.config.ts tests/balance/rules.balance.ts --reporter=verbose
 * How strong each rule relic is: each archetype's assembled lineup carries one rule relic over several seeds, compared with none by hold rate and wall lost. Usage as above
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
function night(arch: string, r: number, seed: number, extra: string[] = []) {
  const A = ARCHS[arch]; reseed(seed); const H = HEROES[A.hero];
  Object.assign(G, { hero: A.hero, seed, heat: 0, run: freshRun(), round: r, maxRound: 9, endless: false, gold: 0, cards: [], relics: [...relicsFor(arch, r), ...extra], skills: talentsFor(arch, r), secret: {}, seenFoes: {}, foeSet: 'dark', phase: 'battle', speed: 1, full: false, gems: {}, boss9: finalBosses()[seed % 5] });
  let x = 0; for (const [k, t, a] of boardFor(arch, r)) { const c = newCard(k, t, a || null); c.loc = 'board'; c.idx = x; x += c.size; G.cards.push(c); }
  const cr = carryFor(arch, r, G.cards.map((c) => c.key)); if (cr) { const c = G.cards.find((x) => x.key === cr.key)!; c.carry = true; c.star = cr.star; }
  recalcMods();
  const wm = [...G.relics.map((k) => RELICS[k].m.wall || 0), ...G.skills.map((k) => TALENTS[k].m.wall || 0)].reduce((s, v) => s + v, 0);
  G.wallMax = G.wall = Math.max(5, H.wall + wm);
  const w = makeWave(r);
  startBattle({ wave: w, ambush: false, wager: null, beats: [] });
  let n = 0; while (!B!.over && n++ < 24000) simStep(1 / 60);
  return { win: B!.result === 'win', lost: B!.wallLost, stk: B!.stkN || 0 };
}
it('规则遗物逐件比', () => {
  const R = +(process.env.NIGHTS || 8);
  const N = +(process.env.N || 6);
  const archs = process.env.ARCH ? process.env.ARCH.split(',') : Object.keys(ARCHS);
  const rules = ['', ...(process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(RELICS).filter((k) => RELICS[k].rule))];
  const rows: string[] = [];
  for (const k of rules) {
    let win = 0, lost = 0, stk = 0, n = 0;
    for (const a of archs)
      for (let s = 1; s <= N; s++) {
        const o = night(a, R, s * 7919 + R, k ? [k] : []);
        win += +o.win; lost += o.lost; stk += o.stk; n++;
      }
    rows.push(`${(k || '不带').padEnd(10)} 守住 ${Math.round((100 * win) / n)}%  掉墙 ${(lost / n).toFixed(1)}  大招 ${(stk / n).toFixed(1)}`);
  }
  console.log(`第${R}夜，${archs.length} 个流派 × ${N} 局\n` + rows.join('\n'));
}, 3_600_000);
