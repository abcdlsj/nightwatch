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
  const skipBtn = `<div class="st-tap">${S.tap}</div><button class="btn sm st-skip" id="stSkip">${S.skip}</button>`;
  const show = () => {
    const p = pages[i];
    ov.hidden = false;
    if (p.title) {
      ov.innerHTML = `<canvas class="st-scene" width="120" height="68"></canvas><div class="st-title"><small>${p.act || ''}</small><h2>${p.title}</h2></div>${skipBtn}`;
      drawScene(ov.querySelector('canvas')!, mode);
      typing = null;
      $('#stSkip').onclick = (e) => {
        e.stopPropagation();
        end();
      };
      SFX.play('bell');
      return;
    }
    const w = who(p);
    let tx = p.t;
    if (tx === '@intro') tx = HEROES[G.hero].intro;
    if (typeof tx === 'object') tx = tx[G.hero];
    full = tx;
    ov.innerHTML = `<canvas class="st-scene" width="120" height="68"></canvas><div class="st-box" style="--sc:${w.c}"><img class="st-por" src="${w.img}" alt=""><div class="st-body"><b>${w.n}</b><p id="stText"></p></div></div>${skipBtn}`;
    drawScene(ov.querySelector('canvas')!, mode);
    $('#stSkip').onclick = (e) => {
      e.stopPropagation();
      end();
    };
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

/** 剧情页背景：小镇剪影 + 天空（夜里是那只眼睛，黎明是太阳） / story page background: town silhouette + sky (the eye at night, the sun at dawn) */
function drawScene(cv: HTMLCanvasElement, mode: Mode) {
  const x = cv.getContext('2d')!;
  const W = cv.width,
    H = cv.height;
  let s = G.round * 977 + 3;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const sky = x.createLinearGradient(0, 0, 0, H);
  if (mode === 'dawn') {
    sky.addColorStop(0, '#2b2a5a');
    sky.addColorStop(0.6, '#e0785a');
    sky.addColorStop(1, '#ffd08a');
  } else if (mode === 'fall') {
    sky.addColorStop(0, '#1a0508');
    sky.addColorStop(1, '#6e1b2a');
  } else {
    sky.addColorStop(0, '#05060f');
    sky.addColorStop(1, '#1d1633');
  }
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);
  if (mode !== 'dawn')
    for (let i = 0; i < 50; i++) {
      x.fillStyle = r() < 0.3 ? '#c79bff' : '#f4f4f4';
      x.globalAlpha = 0.3 + r() * 0.7;
      x.fillRect(Math.floor(r() * W), Math.floor(r() * H * 0.6), 1, 1);
    }
  x.globalAlpha = 1;
  if (mode === 'dawn') {
    x.fillStyle = '#fff1b0';
    for (let a = 0; a < 14; a++) for (let b = 0; b < 14; b++) if ((a - 7) ** 2 + (b - 7) ** 2 < 40) x.fillRect(53 + a, 40 + b, 1, 1);
  } else {
    const R0 = 3 + G.round * 1.4;
    const cx = 90,
      cy = 16;
    for (let a = -R0; a <= R0; a++)
      for (let b = -R0 * 0.6; b <= R0 * 0.6; b++) {
        const d = (a * a) / (R0 * R0) + (b * b) / (R0 * R0 * 0.36);
        if (d > 1) continue;
        x.fillStyle = d > 0.75 ? '#6e1b2a' : d > 0.35 ? '#e43b44' : Math.abs(a) < R0 * 0.18 ? '#1a1c2c' : '#fee761';
        x.fillRect(Math.round(cx + a), Math.round(cy + b), 1, 1);
      }
    x.globalAlpha = 0.25;
    x.fillStyle = '#e43b44';
    for (let k = 0; k < 30; k++) x.fillRect(Math.round(cx + (r() - 0.5) * R0 * 4), Math.round(cy + (r() - 0.5) * R0 * 2), 1, 1);
    x.globalAlpha = 1;
  }
  x.fillStyle = mode === 'dawn' ? '#3a2a3a' : '#0b0a14';
  let hx = 0;
  while (hx < W) {
    const w = 4 + Math.floor(r() * 8),
      h = 10 + Math.floor(r() * 16);
    x.fillRect(hx, H - 16 - h, w, h + 16);
    if (r() < 0.3) x.fillRect(hx + Math.floor(w / 2) - 1, H - 16 - h - 5, 2, 5);
    for (let wy = H - 14 - h; wy < H - 18; wy += 3)
      for (let wx = hx + 1; wx < hx + w - 1; wx += 2)
        if (r() < 0.25) {
          x.fillStyle = mode === 'fall' ? '#ff5a2a' : '#ffcd75';
          x.fillRect(wx, wy, 1, 1);
          x.fillStyle = mode === 'dawn' ? '#3a2a3a' : '#0b0a14';
        }
    hx += w;
  }
  x.fillStyle = mode === 'dawn' ? '#5a4050' : '#2a2130';
  x.fillRect(0, H - 12, W, 12);
  for (let bx = 0; bx < W; bx += 6) x.fillRect(bx, H - 15, 4, 3);
  x.fillStyle = mode === 'dawn' ? '#7a5a60' : '#4a3a40';
  for (let bx = 0; bx < W; bx += 8) x.fillRect(bx + 1, H - 9, 6, 2);
  for (let tt = 10; tt < W; tt += 28) {
    x.fillStyle = '#ffcd75';
    x.fillRect(tt, H - 18, 1, 2);
    x.fillStyle = '#ef7d57';
    x.fillRect(tt, H - 19, 1, 1);
  }
  if (mode === 'fall')
    for (let i = 0; i < 40; i++) {
      x.fillStyle = r() < 0.5 ? '#ef7d57' : '#ffcd75';
      x.fillRect(Math.floor(r() * W), H - 20 - Math.floor(r() * 30), 1, 1);
    }
}
