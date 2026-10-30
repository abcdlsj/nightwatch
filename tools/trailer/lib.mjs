/* 宣传片录制工具：起开发服务器、假时钟逐帧推进、截图存帧、记录音效时间点。
 * 素材都写到 .local/trailer/ 下（不进仓库）。
 * Trailer capture helpers: start the dev server, step a fake clock frame by frame, save frames, log SFX timings. Output goes to .local/trailer/ (not committed).
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/** TRAILER_LANG=en 用英文界面录，素材另放 .local/trailer/en/ / TRAILER_LANG=en records the English UI into .local/trailer/en/ */
export const LANG = process.env.TRAILER_LANG || '';
export const OUT = LANG ? `.local/trailer/${LANG}` : '.local/trailer';
export const FPS = 30;
/** 432×768 CSS 像素 × 2.5 = 1080×1920 / 432×768 CSS px × 2.5 = 1080×1920 */
export const VIEW = { width: 432, height: 768 };
export const DPR = 2.5;
const PORT = 4399;

export async function devServer() {
  const url = `http://localhost:${PORT}/`;
  if (await fetch(url).then(() => true, () => false)) return { url, stop() {} };
  const p = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
  await new Promise((ok) => p.stdout.on('data', (d) => String(d).includes(String(PORT)) && ok()));
  return { url, stop: () => p.kill() };
}

/** 本地存档：人物全解锁、关掉小提示和统计、去掉「添加到主屏幕」提示 / local save: all heroes unlocked, tips and stats off, no add-to-home-screen hint */
function initSave(lang) {
  if (lang) localStorage.setItem('chain-lang', lang);
  localStorage.setItem('chain-meta-v1', JSON.stringify({ heroes: { ayla: 1, mo: 1, ying: 1, jun: 1, li: 1 }, runs: 12, wins: 3 }));
  localStorage.setItem('chain-settings', JSON.stringify({ tips: false, stats: false }));
  localStorage.setItem('nw-ios-hint', '1');
  /* 记录音效：每次 SFX.play 记下假时钟时间，供后期按剪辑重放 / log SFX: each SFX.play records the fake-clock time so post can replay it along the edit */
  window.__sfxLog = [];
  window.process = { env: {} };
  /* 录屏时藏掉台词气泡、敌人介绍卡和首领血条（会挡画面，也带剧情、人物名和首领名） / hide voice bubbles and enemy intro cards while recording (they cover the action and carry story and names); the elite/boss bar shows names too */
  addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = '#bark,#foeCard{display:none!important} #bossbar{visibility:hidden!important}';
    document.head.appendChild(st);
  });
}

export async function openGame({ seed = 7, audio = false } = {}) {
  const srv = await devServer();
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.error('pageerror', String(e)));
  await pg.addInitScript(initSave, LANG);
  if (!audio) await pg.clock.install({ time: 0 });
  await pg.goto(srv.url + '?seed=' + seed);
  for (let i = 0; i < 100 && !(await pg.evaluate(() => !!window.__game)); i++) await pg.waitForTimeout(100);
  if (!audio) await pg.clock.runFor(1500);
  else await pg.waitForTimeout(1500);
  /* 包一层 SFX.play 记时间 / wrap SFX.play to log the time */
  await pg.evaluate(async () => {
    const m = await import('/src/audio/sfx.ts');
    const orig = m.SFX.play;
    m.SFX.play = (k, p) => {
      window.__sfxLog.push([performance.now(), k, p ?? null]);
      return orig(k, p);
    };
  });
  return {
    pg, browser,
    async close() {
      await browser.close();
      srv.stop();
    },
  };
}

/** 往前推 ms 毫秒（rAF 按 60Hz 走），并让 CSS 动画同步前进 / advance ms (rAF at 60Hz) and move CSS animations along with it */
export async function tick(pg, ms) {
  const n = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < n; i++) await pg.clock.runFor(1000 / 60);
  await pg.evaluate((dt) => {
    for (const a of document.getAnimations()) {
      if (!a.__paused) {
        a.__paused = true;
        a.pause();
        a.currentTime = 0;
      }
      a.currentTime = (Number(a.currentTime) || 0) + dt;
    }
  }, ms);
}

/** 录一段：每帧先调 step(i)（可动鼠标等），推进一帧再截图 / record a clip: each frame calls step(i) (move the mouse, etc.), advances one frame, then screenshots */
export async function record(pg, name, seconds, step) {
  const dir = join(OUT, 'clips', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const t0 = await pg.evaluate(() => performance.now());
  const n = Math.round(seconds * FPS);
  for (let i = 0; i < n; i++) {
    if (step) await step(i, i / FPS);
    await tick(pg, 1000 / FPS);
    await pg.screenshot({ path: join(dir, String(i).padStart(5, '0') + '.png') });
  }
  const t1 = await pg.evaluate(() => performance.now());
  const sfx = await pg.evaluate(([a, b]) => window.__sfxLog.filter((e) => e[0] >= a && e[0] < b), [t0, t1]);
  writeFileSync(join(dir, 'sfx.json'), JSON.stringify(sfx.map(([t, k, p]) => [+((t - t0) / 1000).toFixed(3), k, p])));
  console.log(`clip ${name}: ${n} frames, ${sfx.length} sfx`);
  return dir;
}

/** 跳过剧情 / skip story */
export async function skipStory(pg) {
  for (let i = 0; i < 30; i++) {
    const b = await pg.$('#stSkip');
    const vis = b && (await pg.evaluate(() => { const s = document.querySelector('#story'); return s && !s.hidden && getComputedStyle(s).display !== 'none'; }));
    if (!vis) return;
    await b.click();
    await tick(pg, 300);
  }
}

/** 开一局并跳到第 r 夜备战，摆上平衡测试里某个流派的成型阵容（board 可以自己给 [key, tier, adj?][]）
 * start a run, jump to night r's prep, and lay out an archetype's assembled board from the balance tests (or pass your own board as [key, tier, adj?][]) */
export async function stage(pg, arch, r, { board, bag = [], gold = 30, kit = 0 } = {}) {
  const hero = await pg.evaluate(async (arch) => (await import('/tests/balance/builds.ts')).ARCHS[arch].hero, arch);
  await pg.evaluate((h) => window.__game.newGame(h), hero);
  await tick(pg, 500);
  await pg.click(`.kit >> nth=${kit}`);
  await tick(pg, 800);
  await skipStory(pg);
  await pg.evaluate(
    async ({ arch, r, board, bag, gold }) => {
      const g = window.__game, G = g.G;
      const B = await import('/tests/balance/builds.ts');
      const { recalcMods } = await import('/src/game/mods.ts');
      const { toPrep } = await import('/src/app/flow.ts');
      const { clearCardEls } = await import('/src/ui/card-view.ts').catch(() => ({}));
      G.round = r;
      G.gold = gold;
      G.relics = B.relicsFor(arch, r);
      G.skills = B.talentsFor(arch, r);
      G.cards = [];
      clearCardEls?.();
      let x = 0;
      for (const [key, tier, adj] of board || B.boardFor(arch, r)) {
        const c = g.newCard(key, tier, adj || null);
        c.loc = 'board'; c.idx = x; x += c.size;
        G.cards.push(c);
      }
      let y = 0;
      for (const [key, tier, adj] of bag) {
        const c = g.newCard(key, tier, adj || null);
        c.loc = 'stash'; c.idx = y; y += c.size;
        G.cards.push(c);
      }
      const cr = B.carryFor?.(arch, r, G.cards.map((c) => c.key));
      if (cr) Object.assign(G.cards.find((c) => c.key === cr.key), { carry: true, star: cr.star });
      recalcMods();
      g.renderRelics();
      G.firstPrep = false;
      toPrep();
      G.prep.talk = false;
      G.prep.talkDone = true;
      Object.assign(G.prep, { ruleDone: true, awakenDone: true, masonDone: true });
      g.renderPrep();
      g.afterChange();
    },
    { arch, r, board, bag, gold },
  );
  await tick(pg, 600);
  await skipStory(pg);
}

/** 开战 / start the battle */
export async function fight(pg, speed = 1) {
  await pg.evaluate((s) => { window.__game.G.speed = s; window.__game.startBattle(); }, speed);
}

/** 元素中心点 / center of an element */
export async function center(pg, sel) {
  return pg.evaluate((s) => {
    const e = typeof s === 'string' ? document.querySelector(s) : null;
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, sel);
}

/** 画一个手指光标（录屏里看得见按在哪） / draw a finger cursor so the footage shows where the touch is */
export async function finger(pg, p, down) {
  await pg.evaluate(({ p, down }) => {
    let f = document.getElementById('__finger');
    if (!f) {
      f = document.createElement('div');
      f.id = '__finger';
      f.style.cssText = 'position:fixed;z-index:99999;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;pointer-events:none;transition:none;box-sizing:border-box;';
      document.body.appendChild(f);
    }
    if (!p) return void (f.style.display = 'none');
    f.style.display = 'block';
    f.style.left = p.x + 'px';
    f.style.top = p.y + 'px';
    f.style.background = down ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.22)';
    f.style.border = '3px solid rgba(255,255,255,' + (down ? 0.95 : 0.6) + ')';
    f.style.transform = down ? 'scale(.82)' : 'scale(1)';
  }, { p, down });
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 生成一段拖拽的逐帧动作：t0 秒按下，持续 dur 秒拖到 to，之后抬手 / build per-frame actions for a drag: press at t0, drag to `to` over dur seconds, then release */
export function dragPlan(pg, from, to, t0, dur, hold = 0.25) {
  let state = 'idle';
  return async (i, t) => {
    if (t < t0 - 0.35) return finger(pg, null);
    if (t < t0) {
      const k = ease((t - (t0 - 0.35)) / 0.35);
      return finger(pg, { x: from.x + 40 * (1 - k), y: from.y + 60 * (1 - k) }, false);
    }
    if (state === 'idle') {
      await pg.mouse.move(from.x, from.y);
      await pg.mouse.down();
      state = 'down';
    }
    const k = Math.min(1, Math.max(0, (t - t0 - hold) / dur));
    const p = { x: from.x + (to.x - from.x) * ease(k), y: from.y + (to.y - from.y) * ease(k) };
    if (state === 'down') {
      await pg.mouse.move(p.x, p.y, { steps: 2 });
      await finger(pg, p, true);
      if (k >= 1 && t > t0 + hold + dur + 0.12) {
        await pg.mouse.up();
        state = 'up';
      }
      return;
    }
    if (state === 'up') await finger(pg, to, false);
    if (t > t0 + hold + dur + 0.7) await finger(pg, null);
  };
}

/** 把几段逐帧动作串起来 / chain several per-frame actions */
export const both = (...fs) => async (i, t) => {
  for (const f of fs) if (f) await f(i, t);
};
