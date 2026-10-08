/* 布局检查：按手机尺寸（默认 iPhone Air 420×912，刘海 62 / 底部 34）逐屏截图，并检查
 *   1) 有没有元素跑到屏幕外（横向溢出、纵向超出且不可滚动）
 *   2) 主界面有没有在底部留下大块空白
 *   3) 固定在顶部的弹窗有没有压到刘海里
 * 用法：node tests/e2e/layout.mjs [--url=] [--out=shots/layout] [--size=420x912] [--safe=62,34] [--engine=webkit]
 * Layout check: screenshot every screen at phone sizes (default iPhone Air 420×912 with a 62px notch / 34px home bar) and check 1) whether anything overflows the screen (horizontal overflow, or vertical beyond a non-scrollable area) 2) whether main screens leave a large blank band at the bottom 3) whether top-anchored popups intrude into the notch. Usage: node tests/e2e/layout.mjs [--url=] [--out=shots/layout] [--size=420x912] [--safe=62,34] [--engine=webkit]
 */
import { webkit, chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const [W, H] = arg('size', '420x912').split('x').map(Number);
const safe = arg('safe', '62,34');
const [SAT, SAB] = safe.split(',').map(Number);
const out = arg('out', 'shots/layout');
const url = arg('url', 'http://localhost:4317/') + '?seed=7&safe=' + safe;
mkdirSync(out, { recursive: true });
const engine = arg('engine', 'webkit') === 'chromium' ? chromium : webkit;
const b = await engine.launch();
const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true });
/* 测试用存档：人物全部解锁 / test save: all heroes unlocked */
await pg.addInitScript(() => {
  if (!localStorage.getItem('chain-meta-v1')) localStorage.setItem('chain-meta-v1', JSON.stringify({ heroes: { ayla: 1, mo: 1, ying: 1, jun: 1, li: 1 } }));
  if (!localStorage.getItem('chain-tips')) localStorage.setItem('chain-tips', JSON.stringify({ tutorial: 1 }));
});
const errs = [];
const problems = [];
pg.on('pageerror', (e) => errs.push(String(e)));

/** 找出可见但超出屏幕的元素（在可滚动容器里的不算） / find visible elements that overflow the screen (excluding those in scrollable containers) */
const check = (name) =>
  pg.evaluate(
    ({ name, W, H, SAT, SAB }) => {
      const res = [];
      const scrollable = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && p.scrollHeight > p.clientHeight + 1) return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
        if (el.closest('[hidden]') || el.id === 'bg' || el.id === 'crt' || el.id === 'fx') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const desc = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '');
        if (r.right > W + 1 || r.left < -1) res.push(`${name}: 横向出界 ${desc} [${Math.round(r.left)},${Math.round(r.right)}]`);
        if ((r.bottom > H + 1 || r.top < -1) && !scrollable(el) && !el.classList.contains('card')) res.push(`${name}: 纵向出界 ${desc} [${Math.round(r.top)},${Math.round(r.bottom)}]`);
        const fixedTop = s.position === 'fixed' && r.top < SAT - 1 && r.height < H * 0.9 && !/^(screen|sheet|story)$/.test(el.id);
        if (fixedTop) res.push(`${name}: 压到刘海 ${desc} top=${Math.round(r.top)}`);
      }
      if (document.scrollingElement.scrollHeight > H + 1) res.push(`${name}: 整页可以滚动 ${document.scrollingElement.scrollHeight}`);
      const app = document.querySelector('#app').getBoundingClientRect();
      const act = document.querySelector('#actions').getBoundingClientRect();
      if (H - SAB - act.bottom > 24) res.push(`${name}: 底部留白 ${Math.round(H - SAB - act.bottom)}px`);
      if (act.bottom > H - SAB + 1) res.push(`${name}: 底栏压到横条 ${Math.round(act.bottom)} > ${H - SAB}`);
      return res.slice(0, 12);
    },
    { name, W, H, SAT, SAB },
  );
let i = 0;
const shot = async (name) => {
  await pg.waitForTimeout(350);
  const n = String(++i).padStart(2, '0') + '-' + name;
  await pg.screenshot({ path: `${out}/${n}.png` });
  problems.push(...(await check(n)));
};
const skipStory = async () => {
  for (let k = 0; k < 10; k++) {
    const s = await pg.$('#stSkip');
    if (s && (await s.isVisible())) await s.click();
    else break;
    await pg.waitForTimeout(200);
  }
};
const g = (f, a) => pg.evaluate(f, a);

await pg.goto(url);
await pg.waitForTimeout(800);
await shot('title');
await pg.click('#startBtn');
await shot('heroes');
await pg.click('.hero >> nth=2');
await shot('kits');
await pg.click('.kit >> nth=0');
await pg.waitForTimeout(300);
await shot('story');
await skipStory();
await shot('talk');
await g(() => { const G = __game.G; G.prep.talkDone = true; G.prep.cur = null; __game.enterEvent('shop'); });
await shot('shop');
await g(() => __game.finishStep());
await g(() => __game.enterEvent('altar'));
await shot('altar');
/* 规则遗物三选一（第 3、7 夜备战开头） / rule-relic pick (start of prep for nights 3 and 7) */
await g(() => { const g = __game, G = g.G; G.prep.saved = G.prep.cur; g.startRule(); g.renderPrep(); });
await shot('rule');
await g(() => { const g = __game, G = g.G; G.prep.cur = G.prep.saved; g.renderPrep(); });
await g(() => { const g = __game, G = g.G; G.prep.cur = null; G.prep.step = 3;
  [['vial', 0, null, 0], ['prism', 1, null, 1], ['frost', 2, 'chill', 3], ['starfall', 3, 'echo', 5]].forEach(([k, t, a, i]) => { const c = g.newCard(k, t, a); c.loc = 'stash'; c.idx = 0; });
  /* 完整线第 13 夜：三套敌情，还要预告下一段，预告最长 / full-line night 13: three threats plus the next segment's preview, the longest preview */
  G.full = true; G.round = 13; G.nextWave = g.makeWave(13); g.renderPreview();
  g.afterChange(); });
await shot('ready');
await g(() => { const g = __game, G = g.G; G.full = false; G.round = 1; G.nextWave = g.makeWave(1); g.renderPreview(); g.afterChange(); });
await g(() => __game.setDrawer(true));
await shot('drawer');
await g(() => __game.setDrawer(false));
await pg.click('#board .card >> nth=0');
await shot('card-sheet');
await g(() => __game.closeSheet());
await pg.click('#relicBtn');
await shot('relics');
await g(() => __game.closeSheet());
await g(() => { const G = __game.G; G.round = 9; G.nextWave = __game.makeWave(9); });
await pg.click('#goBtn');
await pg.waitForTimeout(4000);
await shot('battle-boss');
await g(() => { const G = __game.G; G.phase = 'over'; __game.B.over = true; G.run.got = ['dawn', 'solo']; __game.endScreen(true); });
await shot('end');
await g(() => __game.titleScreen());
await pg.click('#cdxBtn');
await shot('codex-cards');
await pg.click('.cx-main .btn >> nth=3');
await shot('codex-foes');
await g(() => __game.closeSheet());
await pg.click('#achBtn');
await shot('achievements');
await g(() => __game.closeSheet());
await pg.click('#hisBtn');
await shot('history');
await g(() => __game.closeSheet());
/* 顶部弹出物：成就和提示气泡 / top popups: achievements and tooltips */
await g(() => { __game.unlockTest?.('dawn'); });
await pg.click('#goldChip', { force: true }).catch(() => {});
await shot('popups');

console.log(problems.length ? problems.join('\n') : '没有发现布局问题');
console.log('errs', JSON.stringify(errs));
await b.close();
