/* 关键界面截图：标题、选人、起手、备战、卡牌详情、战斗、图鉴。用于迁移前后对照。
 * 用法：node tests/e2e/shots.mjs --url=地址 --out=目录
 * Key-screen screenshots: title, hero select, opening, prep, card details, battle, codex. Used for before/after comparison across migrations. Usage: node tests/e2e/shots.mjs --url= --out=dir
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const url = arg('url', 'http://localhost:4317/');
const out = arg('out', 'shots');
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
/* 测试用存档：人物全部解锁 / test save: all heroes unlocked */
await pg.addInitScript(() => {
  if (!localStorage.getItem('chain-meta-v1')) localStorage.setItem('chain-meta-v1', JSON.stringify({ heroes: { ayla: 1, mo: 1, ying: 1, jun: 1, li: 1 } }));
  if (!localStorage.getItem('chain-tips')) localStorage.setItem('chain-tips', JSON.stringify({ tutorial: 1 }));
});
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e)));
const shot = (n) => pg.screenshot({ path: `${out}/${n}.png` });
await pg.goto(url);
await pg.waitForTimeout(800);
await shot('01-title');
await pg.click('#startBtn');
await pg.waitForTimeout(400);
await shot('02-heroes');
await pg.click('.hero >> nth=1');
await pg.waitForTimeout(400);
await shot('03-kits');
await pg.click('.kit >> nth=0');
await pg.waitForTimeout(600);
await shot('04-story');
for (let i = 0; i < 8; i++) {
  const s = await pg.$('#stSkip');
  if (s && (await s.isVisible())) { await s.click(); await pg.waitForTimeout(250); }
}
await pg.waitForTimeout(400);
await shot('05-talk');
await pg.evaluate(() => { const g = __game, G = g.G; G.prep.talkDone = true; G.prep.cur = null; g.finishStep(); g.finishStep(); });
await pg.waitForTimeout(300);
await shot('06-doors');
await pg.evaluate(() => { const g = __game, G = g.G;
  G.cards = G.cards.filter((c) => { c.el && c.el.remove(); return false; });
  [['vial', 0, null, 0], ['prism', 1, null, 1], ['frost', 2, 'chill', 3], ['starfall', 3, 'echo', 5]].forEach(([k, t, a, i]) => { const c = g.newCard(k, t, a); c.loc = 'board'; c.idx = i; G.cards.push(c); });
  g.finishStep(); g.afterChange(); });
await pg.waitForTimeout(400);
await shot('07-board');
await pg.click('#board .card >> nth=3');
await pg.waitForTimeout(500);
await shot('08-sheet');
await pg.evaluate(() => { document.querySelector('#sheet').hidden = true; });
await pg.click('#goBtn');
await pg.waitForTimeout(6000);
await shot('09-battle');
await pg.evaluate(() => { __game.G.speed = 20; });
for (let i = 0; i < 200; i++) { if ((await pg.evaluate(() => __game.G.phase)) !== 'battle') break; await pg.waitForTimeout(200); }
await pg.waitForTimeout(1500);
await shot('10-report');
await pg.evaluate(() => __game.closeSheet());
await pg.evaluate(() => __game.titleScreen());
await pg.waitForTimeout(300);
await pg.click('#cdxBtn');
await pg.waitForTimeout(400);
await shot('11-codex');
console.log('errs', JSON.stringify(errs));
await b.close();
