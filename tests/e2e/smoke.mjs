/* 冒烟测试：机器人自动玩一整局，报告每夜城墙剩余、同屏最多敌人数和页面报错。
 * 用法：node tests/e2e/smoke.mjs [人物序号0/1/2] [--url=地址] [--shots] [--seed=数字]
 * 不给 --url 时自己起一个 vite preview（需要先 npm run build）。 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const HERO = +(args.find((a) => /^\d$/.test(a)) ?? 0);
const SHOTS = args.includes('--shots');
const seedArg = args.find((a) => a.startsWith('--seed='));
let url = args.find((a) => a.startsWith('--url='))?.slice(6);

let server = null;
if (!url) {
  url = 'http://localhost:4317/';
  const up = await fetch(url).then(() => true, () => false);
  if (!up) {
    server = spawn('npx', ['vite', 'preview', '--port', '4317', '--strictPort'], { stdio: 'pipe' });
    await new Promise((ok) => server.stdout.on('data', (d) => /4317/.test(String(d)) && ok()));
  }
}
if (seedArg) url += (url.includes('?') ? '&' : '?') + 'seed=' + seedArg.slice(7);

const BOT = `()=>{const g=__game,G=g.G;const P=G.prep;
 if(G.phase!=='prep')return 'wait';
 if(P.step>=3&&!P.cur)return 'ready';
 if(!P.cur){const pref=['train','field','grocer','altar','parcel','shop','black','giant','smith','forge','storm','frostshop','chest','furnace','enchant','job','bank','spring','gamble','ambush'];
   const d=P.doors.slice().sort((a,b)=>(pref.indexOf(a)+99)%120-(pref.indexOf(b)+99)%120)[0];g.enterEvent(d);return 'enter '+d;}
 const c=P.cur;
 if(c.mode==='shop'||c.mode==='pick'||c.mode==='gift'){
   const aff=c.offers.filter(o=>!o.sold&&o.price<=G.gold).sort((a,b)=>(b.card.tier-a.card.tier)||(b.price-a.price));
   if(aff.length&&g.acquire(aff[0],null))return 'got '+aff[0].card.key;
   g.finishStep();return 'leave';}
 if(c.mode==='choice'||c.mode==='relic'){if(c.opts.length)c.opts[0].act();else g.finishStep();return 'chose';}
 if(c.mode==='gshop'){const it=c.goods.find(x=>!x.sold&&x.price<=G.gold&&G.gold-x.price>=4);if(it){G.gold-=it.price;it.sold=true;g.gainRelic(it.k,true);return 'gear';}g.finishStep();return 'leave';}
 if(c.mode==='ambush'){G.speed=20;document.querySelector('#pbody .ev-btns .btn.red').click();return 'ambush';}
 if(c.mode==='reward'){c.apply();g.finishStep();return 'reward';}
 if(c.mode==='talk'||c.mode==='talent'){const b=document.querySelector('#pbody .opt')||document.querySelector('#pbody .ev-btns .btn');if(b){b.click();return c.mode;}}
 g.finishStep();return 'skip';}`;

async function skip(pg) {
  for (let i = 0; i < 20; i++) {
    const vis = await pg.evaluate(() => {
      const s = document.querySelector('#story');
      return s && !s.hidden && getComputedStyle(s).display !== 'none';
    });
    if (!vis) return;
    const b = await pg.$('#stSkip');
    if (b) await b.click();
    await pg.waitForTimeout(250);
  }
}

const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
/* 测试用存档：人物全部解锁 */
await pg.addInitScript(() => {
  if (!localStorage.getItem('chain-meta-v1')) localStorage.setItem('chain-meta-v1', JSON.stringify({ heroes: { ayla: 1, mo: 1, ying: 1, jun: 1, li: 1 } }));
});
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e)));
pg.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
await pg.goto(url);
await pg.waitForTimeout(500);
await pg.click('#startBtn');
await pg.waitForTimeout(400);
await pg.click(`.hero >> nth=${HERO}`);
await pg.waitForTimeout(400);
await pg.click(`.kit >> nth=${process.pid % 3}`);
await pg.waitForTimeout(800);
if (SHOTS) mkdirSync('shots', { recursive: true });
let result = 'lost';
for (let rnd = 1; rnd <= 8; rnd++) {
  await skip(pg);
  for (let k = 0; k < 300; k++) {
    const r = await pg.evaluate(`(${BOT})()`);
    if (r === 'ready') break;
    if (r === 'wait') {
      await skip(pg);
      await pg.waitForTimeout(200);
    }
  }
  const st = await pg.evaluate(() => ({ r: __game.G.round, g: __game.G.gold, w: __game.G.wall, rel: __game.G.relics.length, tal: __game.G.skills.join(','), n: __game.G.cards.length }));
  console.log(JSON.stringify(st));
  const slow = SHOTS && (rnd === 3 || rnd === 7);
  await pg.evaluate((s) => (__game.G.speed = s), slow ? 1 : 20);
  await pg.click('#goBtn');
  if (slow) {
    await pg.waitForTimeout(13000);
    await pg.screenshot({ path: `shots/battle_${rnd}.png` });
    await pg.evaluate(() => (__game.G.speed = 20));
  }
  let maxn = 0;
  for (let i = 0; i < 900; i++) {
    const ph = await pg.evaluate(() => __game.G.phase);
    if (ph !== 'battle') break;
    maxn = Math.max(maxn, await pg.evaluate(() => (__game.B ? __game.B.en.length : 0)));
    await pg.waitForTimeout(100);
  }
  const info = await pg.evaluate(() => ({ ph: __game.G.phase, w: __game.G.wall }));
  console.log('  ', JSON.stringify(info), 'maxEnemies', maxn);
  if (info.ph === 'report') {
    if (rnd === 8) { result = 'won'; break; }
    await pg.waitForTimeout(300);
    await pg.click('#cashBtn');
    await pg.waitForTimeout(500);
  } else {
    if (rnd === 8 && info.ph !== 'over') result = 'won';
    break;
  }
}
await pg.waitForTimeout(3000);
await skip(pg);
if (SHOTS) await pg.screenshot({ path: 'shots/end.png' });
console.log('result', result, 'errs', JSON.stringify(errs.slice(0, 5)));
await b.close();
server?.kill();
process.exit(errs.length ? 1 : 0);
