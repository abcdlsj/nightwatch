/* 装配各层，绑定底栏按钮，跑主循环（由 src/main.ts 在平台层就绪后加载） / wire up the layers, bind bottom-bar buttons and run the main loop (loaded by src/main.ts after the platform layer is ready) */
import { initLocale, L, lang } from '../i18n';
import { loadMods } from '../mod/load';
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
import { updateHUD, toast, bindHudTips, renderRelics } from '../ui/hud';
import { openSettings } from '../ui/settings';
import { domView, paintBossbar } from '../ui/battle-view';
import { openTree, openBag, openSyn, closeSheet } from '../ui/sheets';
import { UI } from '../ui/state';
import { initFlow, startBattle, toPrep, newGame, fitField } from './flow';
import { titleScreen, heroSelect, endScreen } from './screens';
import { renderPreview, renderSyn, renderPrep } from './prep/view';
import { enterEvent, finishStep, acquire, afterChange, gainRelic, sellCard, startRule } from './prep/actions';
import { sheetActions } from '../ui/sheets';
import { initDrag } from './prep/drag';
import { setDrawer } from './prep/drawer';
import { prepStops } from './prep/jumps';
import { setPrepTotal } from '../ui/hud';
setPrepTotal(prepStops);
import { codexKill, markSeen, unlock } from '../game/meta';
import { onBack, onPause, onResume } from '../platform/native';
import { initTelemetry, track, flush } from '../platform/telemetry';
import { standalone } from '../platform/pwa';

/* ---------- 装配 ---------- / ---------- Wiring ---------- */
initLocale();
/* 模组：在语言包填好之后合并进各张表 / mods: merged into the tables after the locale packs are filled in */
loadMods();
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
$('#muteBtn').textContent = '⚙';
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

/* 原生壳：切后台时静音，回来再响；Android 返回键先关弹层和背包 / native: mute when backgrounded and resume on return; Android's back button closes sheets and the bag first */
onPause(() => SFX.ctx()?.suspend().catch(() => {}));
onResume(() => SFX.ctx()?.resume().catch(() => {}));
onBack(() => {
  if (!$('#sheet').hidden) return closeSheet(), true;
  if (UI.drawer) return setDrawer(false), true;
  return false;
});

/* 成就解锁：右上角弹一下 / achievement unlocked: pop in the top-right */
on('ach', (a: { n: string; d: string }) => {
  const n = $$('.achpop').length;
  const el = document.createElement('div');
  el.className = 'achpop';
  el.style.top = `calc(var(--sat) + ${10 + n * 54}px)`;
  el.innerHTML = `<small>${L.ui.ach.unlocked}</small><b>${a.n}</b><span>${a.d}</span>`;
  document.body.appendChild(el);
  SFX.play('merge');
  setTimeout(() => el.remove(), 3200);
});

/* ---------- 布局：卡宽跟屏幕走 ---------- / ---------- Layout: card width follows the screen ---------- */
/* 电脑宽屏：左栏放备战（商店、事件、夜谈），右栏是原来那一列，随屏幕高度放宽；手机（竖屏、横屏）都进不了这个模式
 * desktop wide screens: prep (shop, events, talks) moves to a left column and the original column sits on the right, widening with the screen height; phones (portrait or landscape) never enter this mode */
const WIDE = matchMedia('(min-width: 960px) and (min-height: 600px) and (min-aspect-ratio: 5/4)');
/** 切换宽屏布局，返回右栏宽度（不是宽屏返回 0） / toggle the wide layout and return the core column width (0 when not wide) */
function applyWide() {
  const root = document.documentElement;
  const prep = $('#prep');
  root.classList.toggle('wide', WIDE.matches);
  if (!WIDE.matches) {
    if (prep.parentElement !== $('#stage')) $('#stage').insertBefore(prep, $('#report'));
    return 0;
  }
  const core = Math.round(clamp(innerHeight * 0.5, 440, 560));
  root.style.setProperty('--core', core + 'px');
  root.style.setProperty('--side', Math.round(clamp(innerWidth - core - 60, 360, 480)) + 'px');
  if (prep.parentElement !== $('#app')) $('#app').prepend(prep);
  return core;
}

function layout() {
  const core = applyWide();
  const avail = core ? core - 8 : Math.min(440, innerWidth) - 16 - 8;
  LAYOUT.cw = Math.floor(avail / 8);
  /* 用 #app 实际可用高度（已扣掉刘海和底部横条），不用 innerHeight / use #app's actual usable height (already excluding the notch and home bar), not innerHeight */
  const vh = $('#app').clientHeight || innerHeight;
  LAYOUT.ch = Math.round(clamp(Math.min(LAYOUT.cw * 2, (vh - 330) / 2.6), 70, 104));
  document.documentElement.style.setProperty('--cw', LAYOUT.cw + 'px');
  document.documentElement.style.setProperty('--ch', LAYOUT.ch + 'px');
  buildCells();
  renderOwned();
  requestAnimationFrame(fitField);
}
addEventListener('resize', layout);
/* iOS WebView 刚启动时安全区还是 0，稍后才生效：#app 尺寸一变就重新排 / the iOS WebView reports a zero safe area at startup and only later fixes it: relayout whenever #app changes size */
let lastAppH = 0;
new ResizeObserver(() => {
  const h = $('#app').clientHeight;
  if (h !== lastAppH) {
    lastAppH = h;
    layout();
  }
}).observe($('#app'));

/* ---------- 底栏 ---------- / ---------- Bottom bar ---------- */
$('#goBtn').onclick = () => {
  SFX.ensure();
  if (G.phase === 'prep' && G.prep.step >= prepStops()) startBattle();
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
  openSettings(undefined, G.phase === 'title' || G.phase === 'over' ? undefined : quitRun);
};
/** 结算这局：打到一半也算，直接进结局页（整局伤害来源照常列出） / end this run: counts even mid-fight, straight to the ending screen (run damage sources listed as usual) */
function quitRun() {
  if (B && G.phase === 'battle' && !B.over) {
    B.over = true;
    if (G.run) G.run.kills += B.kills;
    G.bestChain = Math.max(G.bestChain, B.maxChain);
  }
  G.phase = 'over';
  endScreen(false, true);
}

/* ---------- 主循环：模拟按 1/60 秒定步长推进，画面每帧画一次 ---------- / ---------- Main loop: the sim advances in fixed 1/60s steps, rendering once per frame ---------- */
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
  /* 宽屏备战时商店在左栏，右边照样画着城墙 / in wide prep the shop sits in the left column, so keep drawing the wall on the right */
  if (G.phase === 'battle' || G.phase === 'report' || G.phase === 'over' || (G.phase === 'prep' && WIDE.matches)) drawField(dtR * (G.phase === 'battle' ? G.speed : 1));
  FX.draw(dtR);
  requestAnimationFrame(loop);
}
layout();
titleScreen();
requestAnimationFrame(loop);
/* 匿名统计：开机记一次（没配接口地址或在设置里关了就不发） / anonymous stats: one event at launch (nothing is sent without an API base or when turned off in settings) */
initTelemetry(lang, standalone());
track('open', { runs: META.runs, w: innerWidth, h: innerHeight });
onPause(() => flush(true));

/* ---------- 给测试脚本用的入口 ---------- / ---------- Hooks for test scripts ---------- */
(window as any).__game = {
  G, META, TALENTS, MUSIC,
  get B() {
    return B;
  },
  endScreen, codexKill, markSeen, closeSheet, titleScreen, heroSelect, setDrawer, openTree, startBattle, acquire, toPrep, newGame,
  unlockTest: unlock, boardCards, newCard, afterChange, renderPreview, makeWave, enterEvent, finishStep, renderRelics, gainRelic, rollGear, withFit, rollTalents, stats, mastLv, startRule, renderPrep,
};

if (import.meta.env.VITE_LAYOUT_DEMO) import('./dev-demo').then((m) => m.runDemo());
