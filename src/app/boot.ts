/* 装配各层，绑定底栏按钮，跑主循环（由 src/main.ts 在平台层就绪后加载） */
import { initLocale, L } from '../i18n';
import { on } from '../core/events';
import { clamp } from '../core/util';
import { G } from '../game/state';
import { META, mastLv } from '../game/meta';
import { boardCards, newCard, stats } from '../game/cards';
import { TALENTS } from '../data/talents';
import { rollGear, withFit, rollTalents } from '../game/loot';
import { B, simStep } from '../sim/battle';
import { setView } from '../sim/view';
import { makeWave } from '../sim/waves';
import { initBackground, onScene } from '../render/background';
import { initField, drawField } from '../render/field';
import { initOverlay, FX } from '../render/overlay';
import { spr } from '../render/sprites';
import { SFX, initSfx } from '../audio/sfx';
import { MUSIC, initMusic } from '../audio/music';
import { applyAudio } from '../audio/settings';
import { $, $$, applyStaticText } from '../ui/dom';
import { LAYOUT, buildCells, renderOwned, paintCharges, setAfterRender } from '../ui/card-view';
import { updateHUD, toast, bindHudTips, audioLabel, toggleAudio, renderRelics } from '../ui/hud';
import { domView, paintBossbar } from '../ui/battle-view';
import { openTree, openBag, openSyn, closeSheet } from '../ui/sheets';
import { UI } from '../ui/state';
import { initFlow, startBattle, toPrep, newGame, fitField } from './flow';
import { titleScreen, heroSelect, endScreen } from './screens';
import { renderPreview, renderSyn } from './prep/view';
import { enterEvent, finishStep, acquire, afterChange, gainRelic, sellCard } from './prep/actions';
import { sheetActions } from '../ui/sheets';
import { initDrag } from './prep/drag';
import { setDrawer } from './prep/drawer';
import { codexKill, markSeen } from '../game/meta';
import { onBack, onPause, onResume } from '../platform/native';

/* ---------- 装配 ---------- */
initLocale();
applyStaticText();
document.title = L.ui.docTitle;
for (const im of $$('[data-ico]')) (im as HTMLImageElement).src = spr(im.dataset.ico!).url;
initBackground();
initField();
initOverlay();
initSfx();
initMusic();
onScene((n) => MUSIC.set(n));
applyAudio();
$('#muteBtn').textContent = audioLabel();
setView(domView);
initFlow();
initDrag();
setAfterRender(renderSyn);
sheetActions.buy = (o) => acquire(o, null);
sheetActions.sell = (c) => {
  sellCard(c);
  afterChange();
};
bindHudTips();
$('#pvSyn').onclick = () => {
  SFX.ensure();
  openSyn();
};

/* 原生壳：切后台时静音，回来再响；Android 返回键先关弹层和背包 */
onPause(() => SFX.ctx()?.suspend().catch(() => {}));
onResume(() => SFX.ctx()?.resume().catch(() => {}));
onBack(() => {
  if (!$('#sheet').hidden) return closeSheet(), true;
  if (UI.drawer) return setDrawer(false), true;
  return false;
});

/* 成就解锁：右上角弹一下 */
on('ach', (a: { n: string; d: string }) => {
  const n = $$('.achpop').length;
  const el = document.createElement('div');
  el.className = 'achpop';
  el.style.top = 10 + n * 54 + 'px';
  el.innerHTML = `<small>${L.ui.ach.unlocked}</small><b>${a.n}</b><span>${a.d}</span>`;
  document.body.appendChild(el);
  SFX.play('merge');
  setTimeout(() => el.remove(), 3200);
});

/* ---------- 布局：卡宽跟屏幕走 ---------- */
function layout() {
  const avail = Math.min(440, innerWidth) - 16 - 8;
  LAYOUT.cw = Math.floor(avail / 8);
  const vh = innerHeight;
  LAYOUT.ch = Math.round(clamp(Math.min(LAYOUT.cw * 2, (vh - 330) / 2.6), 70, 104));
  document.documentElement.style.setProperty('--cw', LAYOUT.cw + 'px');
  document.documentElement.style.setProperty('--ch', LAYOUT.ch + 'px');
  buildCells();
  renderOwned();
  requestAnimationFrame(fitField);
}
addEventListener('resize', layout);

/* ---------- 底栏 ---------- */
$('#goBtn').onclick = () => {
  SFX.ensure();
  if (G.phase === 'prep' && G.prep.step >= 3) startBattle();
};
$('#bagBtn').onclick = () => {
  SFX.ensure();
  SFX.play('ui');
  if (G.phase !== 'battle') setDrawer(!UI.drawer);
  else toast(L.ui.battle.busy);
};
$('#treeBtn').onclick = () => {
  SFX.ensure();
  openTree();
};
$('#relicBtn').onclick = () => {
  SFX.ensure();
  openBag();
};
$('#speedBtn').onclick = () => {
  SFX.ensure();
  SFX.play('ui');
  G.speed = G.speed >= 3 ? 1 : G.speed + 1;
  updateHUD();
};
$('#muteBtn').onclick = () => {
  SFX.ensure();
  toggleAudio();
};

/* ---------- 主循环：模拟按 1/60 秒定步长推进，画面每帧画一次 ---------- */
let lastT = performance.now();
function loop(now: number) {
  const dtR = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (G.phase === 'battle' && B && !B.over) {
    let sm = 1;
    if (B.slowT > 0) {
      B.slowT -= dtR;
      sm = 0.3;
    }
    B.acc += dtR * G.speed * sm;
    const step = 1 / 60;
    let n = 0;
    const cap = G.speed > 3 ? 40 : 12;
    while (B.acc >= step && n < cap) {
      simStep(step);
      B.acc -= step;
      n++;
      if (B.over) break;
    }
    if (n >= cap) B.acc = 0;
    if (B && !B.over) paintCharges();
    paintBossbar();
    if (B && B.shield > 0) updateHUD();
  }
  if (G.phase === 'battle' || G.phase === 'report' || G.phase === 'over') drawField(dtR * (G.phase === 'battle' ? G.speed : 1));
  FX.draw(dtR);
  requestAnimationFrame(loop);
}
layout();
titleScreen();
requestAnimationFrame(loop);

/* ---------- 给测试脚本用的入口 ---------- */
(window as any).__game = {
  G, META, TALENTS, MUSIC,
  get B() {
    return B;
  },
  endScreen, codexKill, markSeen, closeSheet, titleScreen, heroSelect, setDrawer, openTree, startBattle, acquire, toPrep, newGame,
  boardCards, newCard, afterChange, renderPreview, makeWave, enterEvent, finishStep, renderRelics, gainRelic, rollGear, withFit, rollTalents, stats, mastLv,
};
