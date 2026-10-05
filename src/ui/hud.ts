/* 顶栏、底栏按钮、提示条、横幅、一次性新手提示 */
import { L, t } from '../i18n';
import { nightKind, lastNight, gemCount } from '../game/plan';
import { store, KEYS } from '../platform/storage';
import { G } from '../game/state';
import { mv } from '../game/mods';
import { unlock } from '../game/meta';
import { nightTitle } from '../game/nights';
import { B } from '../sim/battle';
import { SFX } from '../audio/sfx';
import { SETTINGS } from '../platform/settings';
import { $, $$, restart } from './dom';
import { UI } from './state';

let shownGold: number | null = null;
export const resetGoldBump = () => {
  shownGold = null;
};

/** 这一夜备战几站（跃迁夜 4 站），由备战流程注册 */
let prepTotal = () => 3;
export const setPrepTotal = (f: () => number) => {
  prepTotal = f;
};

export function updateHUD() {
  const T = L.ui.hud;
  $('#roundV').textContent = String(Math.min(G.round, G.maxRound));
  const rc = $('#roundChip');
  const nk = nightKind(G.round);
  const ek = G.round - lastNight();
  rc.classList.toggle('elite', nk === 'elite' || (nk === 'endless' && ek % 2 === 1));
  rc.classList.toggle('boss', nk === 'boss' || nk === 'hidden' || (nk === 'endless' && ek % 4 === 0));
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
    const s = G.prep.step,
      m = prepTotal();
    go.disabled = s < m;
    go.textContent = s < m ? t('hud.prepStep', { s, m }) : T.fight;
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
let tipSeen: Record<string, number> = store.json(KEYS.tips, {});
/** 设置里「重新显示新手提示」 */
export function resetTips() {
  tipSeen = {};
  store.setJson(KEYS.tips, tipSeen);
}

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
  /* 首领血条和「下一招」在顶上时，气泡挪到它下面，别挡住 */
  const bar = $('#bossbar');
  tipEl!.style.top = bar.hidden ? '' : `${bar.getBoundingClientRect().bottom + 6}px`;
  void tipEl!.offsetWidth;
  tipEl!.className = 'show';
  tipT = setTimeout(() => nextTip(), ms);
}
export function tipOnce(key: string, html: string, delay?: number) {
  if (tipSeen[key] || !SETTINGS.tips) return;
  tipSeen[key] = 1;
  store.setJson(KEYS.tips, tipSeen);
  setTimeout(() => {
    showTip(L.ui.tips.label, html);
    SFX.play('hint');
  }, delay || 0);
}

/** 顶栏三个数字点一下有说明 */
export function bindHudTips() {
  $('#roundChip').onclick = () => {
    SFX.ensure();
    SFX.play('ui');
    const R = Math.min(G.round, G.maxRound);
    showTip(
      L.ui.hud.tipNight,
      t('hud.tipNightBody', { r: R, max: G.maxRound, title: nightTitle(R) }) + (G.full ? t('hud.tipNightFull', { g: gemCount() }) : '') + (G.heat ? t('hud.tipNightHeat', { h: G.heat }) : ''),
      4200,
      true,
    );
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
