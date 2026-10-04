/* 平衡报告：每个流派 × 每个人物跑若干个种子，统计守到黎明的比例和平均撑到第几夜。
 * 用法：npm run balance            （默认每格 20 局）
 *       RUNS=50 FOCUS=volt npm run balance */
import { it, beforeAll } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { initLocale } from '../../src/i18n';
import { setOnEnd } from '../../src/sim/battle';
import { HEROES } from '../../src/data/heroes';
import { playRun, type Focus, type RunLog } from './bot';

const RUNS = +(process.env.RUNS || 20);
const FOCI = (process.env.FOCUS || 'blade,fire,ice,volt,mech,poison,any').split(',') as Focus[];
const HEAT = +(process.env.HEAT || 0);
/** FULL=1：跑完整游戏线（15 夜） */
const FULL = !!+(process.env.FULL || 0);

beforeAll(() => {
  initLocale();
  setOnEnd(() => {});
});

it('平衡报告', () => {
  const logs: RunLog[] = [];
  const rows: string[] = [];
  for (const focus of FOCI) {
    const mine: RunLog[] = [];
    for (const hero of Object.keys(HEROES)) for (let i = 0; i < RUNS; i++) mine.push(playRun(hero, focus, 1000 * i + hero.length * 7 + 13, { heat: HEAT, full: FULL }));
    logs.push(...mine);
    const win = mine.filter((r) => r.win).length / mine.length;
    const avg = mine.reduce((s, r) => s + (r.win ? r.night + 1 : r.night), 0) / mine.length;
    const pass = [...Array(mine[0].nights.length > 9 || FULL ? 15 : 9).keys()].map((i) => i + 1).map((n) => Math.round((mine.filter((r) => r.night > n || r.win).length / mine.length) * 100));
    const tops: Record<string, number> = {};
    for (const r of mine) for (const n of r.nights.slice(-1)) tops[n.topCard.split('@')[0]] = (tops[n.topCard.split('@')[0]] || 0) + 1;
    const topList = Object.entries(tops).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}×${v}`).join(' ');
    rows.push(`${focus.padEnd(7)} 黎明 ${String(Math.round(win * 100)).padStart(3)}%  平均到第 ${avg.toFixed(1)} 夜  逐夜存活 ${pass.join('/')}  最后一夜主力 ${topList}`);
  }
  console.log(`\n难度 ${HEAT}，每个人物每个流派 ${RUNS} 局\n` + rows.join('\n'));
  mkdirSync('shots', { recursive: true });
  writeFileSync('shots/balance.json', JSON.stringify(logs, null, 1));
}, 3_600_000);
