/* 投稿封面：用游戏字体排字，配一张战斗帧，出 16:9 和 3:4 两张。先跑 shots.mjs 录好镜头。
 * 用法：node tools/trailer/cover.mjs [镜头 帧号]（默认 blade 60）。输出到 .local/trailer/bili/
 * Upload covers: game-font type over a battle frame, in 16:9 and 3:4. Run shots.mjs first.
 * Usage: node tools/trailer/cover.mjs [shot frame] (default blade 60). Output goes to .local/trailer/bili/
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { devServer, OUT } from './lib.mjs';

const [shot = 'blade', frame = '60'] = process.argv.slice(2);
const png = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64');
const shotImg = png(join(OUT, 'clips', shot, String(+frame).padStart(5, '0') + '.png'));
const dir = join(OUT, 'bili');
mkdirSync(dir, { recursive: true });

/* 字少、字大：封面在列表里只有指甲盖大，一眼要看清是什么游戏、有什么爽点 / few words, big type: in the feed a cover is thumbnail-sized, so the genre and the hook must read at a glance */
const CSS = `
*{box-sizing:border-box;margin:0}
body{background:#0f1c20;overflow:hidden;font-family:var(--zh)}
.cv{position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 40%,#3a1530 0%,#14101f 55%,#0b0d14 100%)}
.cv:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 3px,transparent 3px 6px);z-index:5;pointer-events:none}
.shot{position:absolute;image-rendering:pixelated;border:6px solid #ffd166;box-shadow:0 0 0 6px #0f1c20,0 0 60px rgba(255,120,80,.55),0 30px 60px rgba(0,0,0,.6)}
.logo{display:flex;gap:6px;line-height:1;color:#fff}
.logo span{text-shadow:0 10px 0 #7a1f1a,0 18px 0 rgba(0,0,0,.55)}
.logo span:nth-child(2){color:#ffd166;text-shadow:0 10px 0 #8a5a12,0 18px 0 rgba(0,0,0,.55)}
.en{font-family:'Silkscreen',monospace;color:#ff8a5b;letter-spacing:6px}
.hook{color:#fff;background:#d7263d;padding:10px 22px 14px;box-shadow:0 0 0 5px #0f1c20,8px 8px 0 5px #0f1c20;transform:rotate(-2deg);display:inline-block}
.hook b{color:#ffe066}
.tags{display:flex;gap:14px;flex-wrap:wrap}
.tags i{font-style:normal;color:#0f1c20;background:#ffd166;padding:6px 14px 9px;box-shadow:0 0 0 4px #0f1c20}
.tags i.g{background:#7ae582}
.boom{position:absolute;font-family:'PixNum','Pixelify Sans',var(--zh);color:#ffe066;text-shadow:0 6px 0 #b3261e,0 0 30px rgba(255,90,40,.9);transform:rotate(-8deg);z-index:6}
`;

const LAYOUTS = {
  '封面-16x9': {
    w: 1920, h: 1080,
    html: `<div class="cv" style="width:1920px;height:1080px">
      <img class="shot" src="${shotImg}" style="left:110px;top:40px;height:1000px;transform:rotate(-3deg)">
      <div class="boom" style="left:470px;top:70px;font-size:120px">连杀 21!</div>
      <div style="position:absolute;left:820px;top:150px;display:flex;flex-direction:column;gap:34px">
        <div class="logo" style="font-size:230px"><span>守</span><span>夜</span><span>人</span></div>
        <div class="en" style="font-size:48px">NIGHT WATCH</div>
        <div><div class="hook" style="font-size:78px">摆卡合成，<b>连锁爆炸</b></div></div>
        <div class="tags" style="font-size:44px"><i>像素构筑</i><i>自动战斗</i><i class="g">网页就能玩</i><i class="g">支持模组</i></div>
      </div></div>`,
  },
  '封面-3x4': {
    w: 1080, h: 1440,
    html: `<div class="cv" style="width:1080px;height:1440px">
      <img class="shot" src="${shotImg}" style="left:220px;top:300px;height:1180px;transform:rotate(3deg)">
      <div class="boom" style="left:40px;top:560px;font-size:100px">连杀 21!</div>
      <div style="position:absolute;left:0;right:0;top:40px;display:flex;flex-direction:column;align-items:center;gap:14px;z-index:6">
        <div class="logo" style="font-size:190px"><span>守</span><span>夜</span><span>人</span></div>
        <div class="hook" style="font-size:66px">摆卡合成，<b>连锁爆炸</b></div>
      </div>
      <div class="tags" style="position:absolute;left:40px;bottom:50px;font-size:42px;z-index:6;flex-direction:column;align-items:flex-start"><i class="g">网页就能玩</i><i class="g">支持模组</i></div>
      </div>`,
  },
};

const srv = await devServer();
const b = await chromium.launch();
try {
  for (const [name, L] of Object.entries(LAYOUTS)) {
    const pg = await b.newPage({ viewport: { width: L.w, height: L.h } });
    /* 开在游戏页面上，好用它的 @font-face 和 --zh 变量 / open on the game page to reuse its @font-face rules and the --zh variable */
    await pg.goto(srv.url);
    await pg.waitForFunction(() => !!window.__game);
    await pg.evaluate(({ css, html }) => {
      document.body.className = '';
      document.body.innerHTML = html;
      const st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
    }, { css: CSS, html: L.html });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: join(dir, name + '.jpg'), type: 'jpeg', quality: 92 });
    await pg.close();
    console.log('封面 / cover:', join(dir, name + '.jpg'));
  }
} finally {
  await b.close();
  srv.stop();
}
