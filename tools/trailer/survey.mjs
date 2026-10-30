/* 挑镜头：几个流派各打一夜，隔几秒截一张，记同屏敌人数和最大伤害 / scout shots: a few archetypes each fight a night; screenshot every few seconds, logging enemies on screen and the biggest hit */
import { openGame, stage, fight, tick, OUT } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const [r, ...archs] = process.argv.slice(2);
mkdirSync(`${OUT}/survey`, { recursive: true });
for (const arch of archs) {
  const g = await openGame();
  await stage(g.pg, arch, +r);
  await fight(g.pg);
  for (const t of [4, 8, 12, 16]) {
    await tick(g.pg, 4000);
    const s = await g.pg.evaluate(() => ({ ph: __game.G.phase, en: __game.B?.en.length, wall: __game.G.wall, chain: __game.B?.maxChain }));
    console.log(arch, t, JSON.stringify(s));
    await g.pg.screenshot({ path: `${OUT}/survey/${arch}-${r}-${t}.png` });
  }
  await g.close();
}
