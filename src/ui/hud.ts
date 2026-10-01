/* 顶栏、底栏按钮、提示条、横幅、一次性新手提示 */
import { L, t } from '../i18n';
import { store, KEYS } from '../platform/storage';
import { G } from '../game/state';
import { mv } from '../game/mods';
import { unlock } from '../game/meta';
import { nightTitle } from '../game/nights';
import { B } from '../sim/battle';
import { SFX } from '../audio/sfx';
import { audioMode, cycleAudio } from '../audio/settings';
import { $, $$, restart } from './dom';
import { UI } from './state';

let shownGold: number | null = null;
export const resetGoldBump = () => {
  shownGold = null;
};

export function updateHUD() {
  const T = L.ui.hud;
  $('#roundV').textContent = String(Math.min(G.round, G.maxRound));
  const rc = $('#roundChip');
  rc.classList.toggle('elite', G.round === 4 || (G.round > 8 && (G.round - 8) % 2 === 1));
  rc.classList.toggle('boss', G.round === 8 || (G.round > 8 && (G.round - 8) % 4 === 0));
  if (shownGold !== G.gold) {
    if (shownGold !== null) restart($('#goldChip'), 'bump');
    shownGold = G.gold;
  }
  $('#goldV').textContent = String(G.gold);
  if (G.gold >= 50 && G.phase !== 'title') unlock('rich');
  $('#hpV').textContent = String(Math.max(0, Math.ceil(G.wall)));
  $('#hpChip').classList.toggle('low', G.phase !== 'title' && G.wall > 0 && G.wall < G.wallMax * 0.35);
  $('#shV').textContent = B && B.shield > 0 && G.phase === 'battle' ? '+' + Math.ceil(B.shield) : '';
  $('#speedBtn').textContent = G.speed + '×';
  const sc = G.cards.filter((c) => c.loc === 'stash').length;
  $('#bagN').textContent = sc ? String(sc) : '';
  $('#bagBtn').classList.toggle('on', UI.drawer);
  $('#treeN').textContent = '';
  const go = $('#goBtn') as HTMLButtonElement;
  if (G.phase === 'prep') {
    const s = G.prep.step;
    go.disabled = s < 3;
    go.textContent = s < 3 ? t('hud.prepStep', { s }) : T.fight;
  } else if (G.phase === 'battle') {
    go.disabled = true;
    go.textContent = T.inBattle;
  } else if (G.phase === 'report') {
    go.disabled = true;
    go.textContent = T.settling;
  } else {
    go.disabled = true;
    go.textContent = T.start;
  }
  $$('.offer').forEach((o) => {
    const p = o.querySelector('.price') as HTMLElement | null;
    if (p && +p.dataset.p! > 0) p.classList.toggle('cant', +p.dataset.p! > G.gold);
  });
}

export function renderRelics(fresh?: unknown) {
  $('#relicN').textContent = G.relics.length ? String(G.relics.length) : '';
  if (fresh) restart($('#relicBtn'), 'bump');
}

export function toast(msg: string) {
  const el = $('#toast');
  el.textContent = msg;
  restart(el, 'show');
}
export function banner(msg: string, col?: string) {
  const b = $('#banner');
  b.textContent = msg;
  b.style.color = col || '#fff';
  restart(b, 'show');
}

/* ---------- 提示气泡：一次性的新手提示 + 点顶栏看说明 ---------- */
const TIPQ: [string, string, number][] = [];
let tipEl: HTMLElement | null = null,
  tipT: ReturnType<typeof setTimeout> | null = null;
const tipSeen: Record<string, number> = store.json(KEYS.tips, {});

export function showTip(label: string, html: string, ms?: number, now?: boolean) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = 'tipBub';
    tipEl.onclick = () => nextTip();
    document.body.appendChild(tipEl);
  }
  if (now) {
    TIPQ.length = 0;
    if (tipT) clearTimeout(tipT);
    tipT = null;
  }
  TIPQ.push([label, html, ms || 5200]);
  if (!tipT) nextTip(true);
}
function nextTip(first?: boolean) {
  if (tipT) clearTimeout(tipT);
  tipT = null;
  if (!first) TIPQ.shift();
  if (!TIPQ.length) {
    tipEl!.className = '';
    return;
  }
  const [l, h, ms] = TIPQ[0];
  tipEl!.innerHTML = `<small>${l}</small><p>${h}</p>`;
  tipEl!.className = '';
  void tipEl!.offsetWidth;
  tipEl!.className = 'show';
  tipT = setTimeout(() => nextTip(), ms);
}
export function tipOnce(key: string, html: string, delay?: number) {
  if (tipSeen[key]) return;
  tipSeen[key] = 1;
  store.setJson(KEYS.tips, tipSeen);
  setTimeout(() => {
    showTip(L.ui.tips.label, html);
    SFX.play('hint');
  }, delay || 0);
}

/** 声音按钮显示当前档 */
export function audioLabel() {
  return (L.meta.audio as string[][])[audioMode][0];
}
export function toggleAudio() {
  cycleAudio();
  $('#muteBtn').textContent = audioLabel();
  toast((L.meta.audio as string[][])[audioMode][1]);
  if (audioMode < 2) SFX.play('ui');
}

/** 顶栏三个数字点一下有说明 */
export function bindHudTips() {
  $('#roundChip').onclick = () => {
    SFX.ensure();
    SFX.play('ui');
    const R = Math.min(G.round, G.maxRound);
    showTip(L.ui.hud.tipNight, t('hud.tipNightBody', { r: R, max: G.maxRound, title: nightTitle(R) }) + (G.heat ? t('hud.tipNightHeat', { h: G.heat }) : ''), 4200, true);
  };
  $('#goldChip').onclick = () => {
    SFX.ensure();
    SFX.play('coin');
    showTip(L.ui.hud.tipGold, t('hud.tipGoldBody', { cap: 3 + mv('interest') }), 4800, true);
  };
  $('#hpChip').onclick = () => {
    SFX.ensure();
    SFX.play('ui');
    showTip(L.ui.hud.tipWall, L.ui.hud.tipWallBody + (B && B.shield > 0 ? L.ui.hud.tipWallShield : '') + (mv('regen') ? t('hud.tipWallRegen', { n: mv('regen') }) : ''), 4800, true);
  };
}
