/* 成型阵容逐夜测：每个流派一套「认真玩的玩家到第 N 夜大概有的棋盘」，每夜单独打若干种子，
 * 看守不守得住、墙掉多少、主力是谁。测的是卡牌强度和怪物成长曲线，不受机器人水平影响。
 * 用法：npm run bench            RUNS=12 ARCH=volt,fire npm run bench */
import { it, beforeAll } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { newCard } from '../../src/game/cards';
import { nightInfo } from '../../src/game/nights';
import { HEROES } from '../../src/data/heroes';
import { RELICS } from '../../src/data/relics';
import { TALENTS } from '../../src/data/talents';
import { makeWave } from '../../src/sim/waves';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { ARCHS, boardFor, relicsFor, talentsFor, carryFor } from './builds';
import { TUNE } from '../../src/game/tuning';

const RUNS = +(process.env.RUNS || 8);
const PICK = (process.env.ARCH || Object.keys(ARCHS).join(',')).split(',');
const HEAT = +(process.env.HEAT || 0);
if (process.env.TUNE) Object.assign(TUNE, JSON.parse(process.env.TUNE));

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

function night(arch: string, r: number, seed: number, foeSet: string) {
  const A = ARCHS[arch];
  reseed(seed);
  const H = HEROES[A.hero];
  Object.assign(G, {
    hero: A.hero, heat: HEAT, run: freshRun(), round: r, maxRound: 8, endless: false, gold: 0, wall: H.wall, wallMax: H.wall, cards: [], relics: relicsFor(arch, r),
    skills: talentsFor(arch, r), secret: {}, seenFoes: {}, foeSet, boss8: seed % 2 ? 'eye' : 'brood', phase: 'battle', speed: 1,
  });
  let x = 0;
  for (const [key, tier, adj] of boardFor(arch, r)) {
    const c = newCard(key, tier, adj || null);
    c.loc = 'board';
    c.idx = x;
    x += c.size;
    G.cards.push(c);
  }
  const cr = carryFor(arch, r, G.cards.map((c) => c.key));
  if (cr) {
    const c = G.cards.find((x) => x.key === cr.key)!;
    c.carry = true;
    c.star = cr.star;
  }
  recalcMods();
  const wallMod = [...G.relics.map((k) => RELICS[k].m.wall || 0), ...G.skills.map((k) => TALENTS[k].m.wall || 0)].reduce((s, v) => s + v, 0);
  G.wallMax = Math.max(5, H.wall + wallMod);
  G.wall = G.wallMax;
  startBattle({ wave: makeWave(r), ambush: false, wager: null, beats: nightInfo(r).beats });
  let steps = 0;
  while (!B!.over && steps < 60 * 400) {
    simStep(1 / 60);
    steps++;
  }
  const b = B!;
  const tot = G.cards.reduce((s, c) => s + c.bDmg, 0) || 1;
  const top = G.cards.slice().sort((a, z) => z.bDmg - a.bDmg)[0];
  return { win: b.result === 'win', lost: Math.round(b.wallLost), t: b.t, top: top.key, share: top.bDmg / tot, maxHit: b.maxHit, chain: b.maxChain };
}

it('成型阵容逐夜', () => {
  const out: Record<string, unknown> = {};
  const lines: string[] = [];
  for (const arch of PICK) {
    const cells: string[] = [];
    const rec: unknown[] = [];
    for (let r = 1; r <= 8; r++) {
      const res: ReturnType<typeof night>[] = [];
      for (let i = 0; i < RUNS; i++) res.push(night(arch, r, 7919 * i + r * 31 + 1, i % 2 ? 'frost' : 'dark'));
      const win = res.filter((x) => x.win).length / res.length;
      const lost = res.reduce((s, x) => s + x.lost, 0) / res.length;
      cells.push(`${String(Math.round(win * 100)).padStart(3)}%${lost ? '-' + Math.round(lost) : ''}`.padEnd(8));
      const tops: Record<string, number> = {};
      for (const x of res) tops[x.top] = (tops[x.top] || 0) + 1;
      rec.push({ r, win, lost, tops, maxHit: Math.max(...res.map((x) => x.maxHit)), chain: Math.max(...res.map((x) => x.chain)) });
    }
    out[arch] = rec;
    lines.push(`${arch.padEnd(8)} ${cells.join('')}`);
  }
  console.log(`\n模式 ${process.env.BUILD || "plain"}，难度 ${HEAT}，每格 ${RUNS} 局。格式：守住比例-平均掉墙\n${'流派'.padEnd(7)} ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ('第' + n + '夜').padEnd(7)).join('')}\n` + lines.join('\n'));
  mkdirSync('shots', { recursive: true });
  writeFileSync('shots/bench.json', JSON.stringify(out, null, 1));
}, 3_600_000);
