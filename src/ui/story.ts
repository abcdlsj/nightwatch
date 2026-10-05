/* 剧情页：开场、黎明、城破。逐字打出，点一下继续，可以跳过 / Story pages: opening, dawn, breach. Types out character by character; tap to continue, can skip */
import { HEROES } from '../data/heroes';
import { L } from '../i18n';
import { G } from '../game/state';
import { foundSecret } from '../game/meta';
import { unlock } from '../game/meta';
import { boardCards } from '../game/cards';
import { spr } from '../render/sprites';
import { SFX } from '../audio/sfx';
import { $ } from './dom';

import { fullPages, noDawnPages, prologuePages, winPages, hiddenPrePages, type Page } from '../game/story';
import { voiceOf } from './voice';
type Mode = 'dawn' | 'fall' | 'night';

export function playStory(pages: Page[], mode: Mode, done?: () => void) {
  const ov = $('#story');
  let i = 0,
    typing: ReturnType<typeof setInterval> | null = null,
    full = '';
  const S = L.ui.story;
  const who = (p: Page) => {
    if (p.who === 'narr') return { n: S.narr, img: spr('lantern').url, c: '#9fb3ba' };
    if (p.who === 'knight') return { n: S.knight, img: spr('knight').url, c: '#c79bff' };
    if (p.who === 'eye') return { n: S.eye, img: spr('eye').url, c: '#ff6b5b' };
    return voiceOf(p.who || 'narr');
  };
  /* 背景整屏画一次，翻页只换前景 / the full-screen backdrop is drawn once; paging only swaps the foreground */
  ov.hidden = false;
  ov.className = 'st-' + mode;
  ov.innerHTML = `<canvas class="st-bg"></canvas><div class="st-vig"></div><div class="st-fg"></div><button class="btn sm st-skip" id="stSkip">${S.skip}</button>`;
  drawScene(ov.querySelector('canvas')!, mode);
  const fg = ov.querySelector<HTMLElement>('.st-fg')!;
  $('#stSkip').onclick = (e) => {
    e.stopPropagation();
    end();
  };
  const show = () => {
    const p = pages[i];
    if (p.title) {
      fg.innerHTML = `<div class="st-title"><small>${p.act || ''}</small><h2>${p.title}</h2></div><div class="st-tap">${S.tap}</div>`;
      typing = null;
      SFX.play('bell');
      return;
    }
    const w = who(p);
    let tx = p.t;
    if (tx === '@intro') tx = HEROES[G.hero].intro;
    if (typeof tx === 'object') tx = tx[G.hero];
    full = tx;
    fg.innerHTML = `<div class="st-box" style="--sc:${w.c}"><img class="st-por" src="${w.img}" alt=""><div class="st-body"><b>${w.n}</b><p id="stText"></p></div><i class="st-next" aria-label="${S.tap}">▼</i></div>`;
    let k = 0;
    const el = $('#stText');
    if (typing) clearInterval(typing);
    typing = setInterval(() => {
      k++;
      el.textContent = full.slice(0, k);
      if (k % 3 === 0) SFX.play('ui');
      if (k >= full.length) {
        clearInterval(typing!);
        typing = null;
      }
    }, 28);
  };
  const end = () => {
    if (typing) clearInterval(typing);
    ov.hidden = true;
    ov.onclick = null;
    ov.innerHTML = '';
    done && done();
  };
  ov.onclick = () => {
    SFX.ensure();
    if (typing) {
      clearInterval(typing);
      typing = null;
      $('#stText').textContent = full;
      return;
    }
    i++;
    if (i >= pages.length) end();
    else show();
  };
  show();
}

export const playPrologue = (done: () => void) => playStory(prologuePages(), 'night', done);
/** 完整线第 15 夜：隐藏首领出来之前（人物写了才有） / full line, night 15: before the hidden boss appears (only if the hero has one) */
export function playHiddenPre(done: () => void) {
  const p = hiddenPrePages();
  if (p) playStory(p, 'night', done);
  else done();
}
/** 完整线：第 9 夜首领倒下，天没亮 / full line: the night-9 boss falls but dawn does not come */
export const playNoDawn = (done: () => void) => playStory(noDawnPages(G.boss9), 'night', done);
/** 完整线：第 15 夜宝石不全，安静地天亮 / full line: night 15 with a missing gem, dawn comes quietly */
export const playQuiet = (done: () => void) => playStory(fullPages('quiet'), 'dawn', done);
/** 完整线：打倒隐藏首领，真正的天亮 / full line: beat the hidden boss and true dawn arrives */
export const playTrueWin = (done: () => void) => playStory(fullPages('trueWin'), 'dawn', done);
export const playLose = (done: () => void) => playStory(L.story.lose as Page[], 'fall', done);

/** 黎明：首领不同第一句不同；满足条件时多出隐藏剧情（借来的星、第七百零一下） / dawn: the first line varies by boss; extra hidden scenes appear when conditions are met (the borrowed star, the seven-hundred-and-first strike) */
export function playWin(done: () => void) {
  const S = L.story as any;
  const pages: Page[] = winPages(G.boss9);
  const onBoard = (k: string) => boardCards().some((c) => c.key === k);
  if (G.hero === 'mo' && onBoard('starfall')) {
    foundSecret('star');
    pages.push(...S.secretStar);
  }
  if (onBoard('bell')) {
    foundSecret('bell');
    pages.push(...S.secretBell);
    unlock('bell701');
  }
  playStory(pages, 'dawn', done);
}

/** 剧情页背景：竖屏整幅像素画。上面是天（夜里那只眼睛，黎明是太阳，城破是火光），中间远山和晨钟城，下面是城墙和火把
 * story backdrop: one full portrait pixel painting. Sky on top (the eye at night, the sun at dawn, firelight on a breach), distant hills and the bell city in the middle, the wall and torches below */
function drawScene(cv: HTMLCanvasElement, mode: Mode) {
  const W = 96;
  const H = Math.max(150, Math.min(230, Math.round((W * innerHeight) / Math.max(1, innerWidth))));
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  let s = G.round * 977 + 3;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const px = (c: string, X: number, Y: number, w = 1, h = 1) => {
    x.fillStyle = c;
    x.fillRect(Math.round(X), Math.round(Y), w, h);
  };
  const dawn = mode === 'dawn',
    fall = mode === 'fall';
  const hor = Math.round(H * 0.5); // 远山脚 / foot of the far hills
  const town = Math.round(H * 0.6); // 城里屋脚 / base of the town houses
  const wallTop = Math.round(H * 0.66); // 城墙垛口 / top of the battlements

  /* 天：分段的像素色带，不用平滑渐变 / sky: stepped pixel colour bands, no smooth gradient */
  const bands = dawn
    ? ['#1d1b3a', '#2b2a5a', '#4a2f63', '#7a3a63', '#b5505a', '#e0785a', '#f4a35e', '#ffd08a']
    : fall
      ? ['#0d0306', '#1a0508', '#2a0a10', '#3d0f18', '#521422', '#6e1b2a', '#8a2a24', '#b0401e']
      : ['#04050c', '#05060f', '#080a18', '#0c0d20', '#110f28', '#171330', '#1d1633', '#251a3d'];
  for (let y = 0; y < town; y++) {
    const t = y / town;
    const k = Math.min(bands.length - 1, Math.floor(t * bands.length + (((y * 7) % 3) - 1) * 0.15));
    px(bands[k], 0, y, W, 1);
  }
  /* 星星：夜里满天，黎明只剩几颗 / stars: all over at night, only a few at dawn */
  const nStar = dawn ? 10 : fall ? 25 : 90;
  for (let i = 0; i < nStar; i++) {
    const sx = r() * W,
      sy = r() * hor * (dawn ? 0.35 : 0.9);
    x.globalAlpha = 0.3 + r() * 0.7;
    const big = r() < 0.08;
    const c = r() < 0.25 ? '#c79bff' : r() < 0.2 ? '#9fd8ff' : '#f4f4f4';
    if (big && !dawn) {
      px(c, sx, sy);
      x.globalAlpha *= 0.5;
      px(c, sx - 1, sy);
      px(c, sx + 1, sy);
      px(c, sx, sy - 1);
      px(c, sx, sy + 1);
    } else px(c, sx, sy);
  }
  x.globalAlpha = 1;

  if (dawn) {
    /* 太阳从远山后面露出来，带几圈光晕 / the sun peeks over the far hills with a few halo rings */
    const cx = W * 0.5,
      cy = hor + 2;
    for (let R = 30; R > 9; R -= 5) {
      x.globalAlpha = 0.07;
      for (let a = -R; a <= R; a++) for (let b = -R; b <= 0; b++) if (a * a + b * b <= R * R) px('#fff1b0', cx + a, cy + b);
    }
    x.globalAlpha = 1;
    for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) if (a * a + b * b <= 81) px(a * a + b * b > 60 ? '#ffd08a' : '#fff1b0', cx + a, cy + b);
  } else {
    /* 那只眼睛：越到后面越大；外面一圈暗红的光和血丝 / the eye: grows night by night, with a dark red glow and veins around it */
    const R0 = Math.min(16, 6 + G.round * 0.8);
    const cx = W * 0.66,
      cy = H * 0.17;
    for (let g = 3; g >= 1; g--) {
      x.globalAlpha = 0.08 * g;
      const R = R0 * (1 + g * 0.45);
      for (let a = -R; a <= R; a++) for (let b = -R * 0.6; b <= R * 0.6; b++) if ((a * a) / (R * R) + (b * b) / (R * R * 0.36) <= 1) px(fall ? '#ff5a2a' : '#6e1b2a', cx + a, cy + b);
    }
    x.globalAlpha = 0.5;
    for (let k = 0; k < 7; k++) {
      let vx = cx,
        vy = cy;
      const ang = r() * Math.PI * 2;
      for (let st = 0; st < R0 * 1.6; st++) {
        vx += Math.cos(ang) + (r() - 0.5);
        vy += Math.sin(ang) * 0.6 + (r() - 0.5) * 0.6;
        px('#a32a3a', vx, vy);
      }
    }
    x.globalAlpha = 1;
    for (let a = -R0; a <= R0; a++)
      for (let b = -R0 * 0.6; b <= R0 * 0.6; b++) {
        const d = (a * a) / (R0 * R0) + (b * b) / (R0 * R0 * 0.36);
        if (d > 1) continue;
        px(d > 0.75 ? '#6e1b2a' : d > 0.4 ? '#e43b44' : Math.abs(a) < R0 * 0.16 ? '#1a1c2c' : d > 0.2 ? '#f4a35e' : '#fee761', cx + a, cy + b);
      }
    px('#fff8d0', cx - R0 * 0.35, cy - R0 * 0.2, 2, 1);
  }

  /* 远山两层 / two layers of distant hills */
  const ridge = (base: number, amp: number, col: string, step: number) => {
    let y = base - r() * amp;
    for (let X = 0; X < W; X++) {
      if (X % step === 0) y = Math.max(base - amp, Math.min(base, y + (r() - 0.5) * amp * 0.9));
      px(col, X, Math.round(y), 1, town - Math.round(y) + 1);
    }
  };
  ridge(hor - 4, 14, dawn ? '#5a3a5e' : fall ? '#2a0a14' : '#141228', 3);
  ridge(hor + 3, 9, dawn ? '#3f2a48' : fall ? '#1f0710' : '#0e0d1e', 2);

  /* 晨钟城：屋顶剪影 + 亮着的窗 + 正中的钟楼 / the bell city: rooftop silhouettes, lit windows, and the bell tower in the middle */
  const house = dawn ? '#2e2236' : '#0b0a14';
  const win = fall ? '#ff5a2a' : '#ffcd75';
  const tw = Math.round(W * 0.5);
  let hx = 0;
  while (hx < W) {
    const w = 4 + Math.floor(r() * 7),
      h = 8 + Math.floor(r() * 14);
    if (Math.abs(hx + w / 2 - tw) < 8) {
      hx += w;
      continue;
    }
    const top = town + 6 - h;
    px(house, hx, top, w, wallTop - top + 2);
    if (r() < 0.45) for (let k = 0; k < Math.ceil(w / 2); k++) px(house, hx + k, top - k, w - 2 * k, 1); // 尖顶 / pitched roof
    if (r() < 0.25) px(house, hx + Math.floor(w / 2), top - 6, 1, 4); // 烟囱 / chimney
    for (let wy = top + 2; wy < wallTop - 1; wy += 3)
      for (let wx = hx + 1; wx < hx + w - 1; wx += 2) if (r() < (dawn ? 0.08 : 0.28)) px(win, wx, wy);
    hx += w;
  }
  /* 钟楼 / bell tower */
  const tTop = Math.round(H * 0.3);
  px(house, tw - 4, tTop + 8, 9, wallTop - tTop);
  for (let k = 0; k < 6; k++) px(house, tw - 5 + k, tTop + 8 - k, 11 - 2 * k, 1);
  px(house, tw, tTop - 2, 1, 4);
  px(dawn ? '#ffe79a' : '#ffcd75', tw - 2, tTop + 11, 5, 4);
  px('#3a2a20', tw - 1, tTop + 12, 3, 3);
  px(dawn ? '#ffe79a' : '#ffcd75', tw, tTop + 15, 1, 1);
  for (let wy = tTop + 19; wy < wallTop - 2; wy += 4) if (r() < 0.6) px(win, tw - 1 + (wy % 3), wy);
  if (fall) {
    /* 城里起火：火苗和往上飘的火星 / fires in the town: flames and rising embers */
    for (let k = 0; k < 6; k++) {
      const fx = r() * W,
        fy = town + 2 - r() * 8;
      for (let j = 0; j < 6; j++) px(j < 2 ? '#fee761' : j < 4 ? '#ef7d57' : '#b13e53', fx + (r() - 0.5) * 3, fy - j);
    }
    for (let i = 0; i < 60; i++) {
      x.globalAlpha = 0.4 + r() * 0.6;
      px(r() < 0.5 ? '#ef7d57' : '#ffcd75', r() * W, town - r() * H * 0.45);
    }
    x.globalAlpha = 1;
  }

  /* 城墙：垛口、砖缝、火把，一直铺到屏幕底 / the wall: battlements, mortar lines, torches, all the way to the bottom of the screen */
  const stone = dawn ? '#6a4c58' : fall ? '#3a1e26' : '#2a2130';
  const stoneHi = dawn ? '#8a6470' : fall ? '#4e2a30' : '#3a2e40';
  const stoneLo = dawn ? '#4a3440' : fall ? '#22101a' : '#1a1420';
  px(stone, 0, wallTop + 4, W, H - wallTop);
  for (let bx = 0; bx < W; bx += 8) {
    px(stone, bx, wallTop, 5, 4);
    px(stoneHi, bx, wallTop, 5, 1);
  }
  px(stoneHi, 0, wallTop + 4, W, 1);
  for (let y = wallTop + 8, row = 0; y < H; y += 5, row++) {
    px(stoneLo, 0, y, W, 1);
    for (let bx = row % 2 ? 0 : 5; bx < W; bx += 10) px(stoneLo, bx, y - 4, 1, 4);
    for (let k = 0; k < 4; k++) if (r() < 0.6) px(stoneHi, r() * W, y - 3);
  }
  /* 火把：只在垛口间亮一小团暖光（棋盘格抖动，不糊成一片） / torches: a small dithered warm glow between the merlons, not a smudge */
  for (let tx = 12; tx < W; tx += 24) {
    const ty = wallTop + 9;
    for (let a = -5; a <= 5; a++)
      for (let b = -5; b <= 4; b++) {
        const d = a * a + b * b;
        if (d <= 25 && (a + b) % 2 === 0) px(d < 9 ? '#8a5a40' : stoneHi, tx + a, ty + b);
      }
    px('#3a2418', tx, ty, 1, 5);
    px('#5a3a28', tx - 1, ty, 3, 1);
    px('#b13e53', tx, ty - 3, 1, 1);
    px('#ef7d57', tx - 1, ty - 2, 3, 1);
    px('#fee761', tx, ty - 2, 1, 2);
  }
  /* 墙头一个守夜人的剪影，提着灯 / a watchman silhouette on the wall, holding a lantern */
  const mx = Math.round(W * 0.26),
    my = wallTop;
  const fig = dawn ? '#1d1424' : '#020205';
  px(fig, mx, my - 12, 3, 3); // 头 / head
  px(fig, mx - 1, my - 13, 5, 1); // 帽檐 / hat brim
  px(fig, mx, my - 14, 3, 1);
  px(fig, mx - 1, my - 9, 5, 6); // 身子和斗篷 / body and cloak
  px(fig, mx - 2, my - 5, 7, 2);
  px(fig, mx, my - 3, 1, 3); // 腿 / legs
  px(fig, mx + 2, my - 3, 1, 3);
  px(fig, mx + 4, my - 8, 1, 3); // 手臂 / arm
  px(fig, mx + 5, my - 6, 1, 1);
  px('#ffcd75', mx + 5, my - 5, 1, 2); // 灯 / lantern
  px('#fee761', mx + 5, my - 4, 1, 1);
  x.globalAlpha = 0.35;
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 2], [2, 0], [-2, 0]]) px('#ffcd75', mx + 5 + a, my - 5 + b);
  x.globalAlpha = 1;
}
