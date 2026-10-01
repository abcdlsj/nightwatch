/* 单夜诊断：某流派某夜，谁撞的墙、每张卡打了多少 */
import { it, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { newCard, stats } from '../../src/game/cards';
import { nightInfo } from '../../src/game/nights';
import { HEROES } from '../../src/data/heroes';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { ARCHS, boardFor, relicsFor, talentsFor } from './builds';
import { TUNE } from '../../src/game/tuning';
beforeAll(() => { initLocale(); setOnEnd(() => {}); if (process.env.TUNE) Object.assign(TUNE, JSON.parse(process.env.TUNE)); });
it('why', () => {
  const arch = process.env.ARCH || 'ice', r = +(process.env.R || 4);
  const A = ARCHS[arch]; reseed(+(process.env.SEED || 1));
  Object.assign(G, { hero: A.hero, heat: 0, run: freshRun(), round: r, gold: 0, wall: HEROES[A.hero].wall, wallMax: HEROES[A.hero].wall, cards: [], relics: relicsFor(arch, r), skills: talentsFor(arch, r), secret: {}, seenFoes: {}, foeSet: process.env.SET || 'dark', boss8: 'eye', phase: 'battle' });
  let x = 0; for (const [k, t, a] of boardFor(arch, r)) { const c = newCard(k, t, a || null); c.loc = 'board'; c.idx = x; x += c.size; G.cards.push(c); }
  recalcMods();
  console.log('board', G.cards.map((c) => `${c.key}@${c.tier} dmg${Math.round(stats(c, null).total)} cd${stats(c, null).cd.toFixed(2)}`).join(' | '));
  startBattle({ wave: makeWave(r), ambush: false, wager: null, beats: nightInfo(r).beats });
  let s = 0; let kn: any = null; while (!B!.over && s < 24000) { simStep(1 / 60); s++; kn = kn || B!.en.find((e) => e.type === 'knight'); if (s % 300 === 0 && kn) console.log('t', B!.t.toFixed(0), 'knight hp', Math.round(kn.hp), '/', Math.round(kn.maxHp), 'shield', Math.round(kn.shield), 'y', kn.y.toFixed(2), 'dead', kn.dead, 'wall', G.wall.toFixed(1)); }
  console.log('result', B!.result, 't', B!.t.toFixed(1), 'kills', B!.kills, 'wallBy', JSON.stringify(B!.wallBy), 'dmg', G.cards.map((c) => c.key + ':' + Math.round(c.bDmg)).join(' '));
});
