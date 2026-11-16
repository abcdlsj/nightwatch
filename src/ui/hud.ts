/* 顶栏、底栏按钮、提示条、横幅、一次性新手提示 / top bar, bottom-bar buttons, toasts, banners, one-off tutorial hints */
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
import { LANE, laneWait, laneTake, laneClear } from './lane';
import { $, $$, restart } from './dom';
import { UI } from './state';

let shownGold: number | null = null;
export const resetGoldBump = () => {
  shownGold = null;
};

/** 这一夜备战几站（跃迁夜 4 站），由备战流程注册 / how many prep stops this night (4 on leap nights); registered by the prep flow */
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
  /* 备战时顶上是今晚的标题，提示条改到下沿 / during prep the night's title sits at the top, so the toast moves to the bottom edge */
  el.classList.toggle('low', G.phase !== 'battle');
  restart(el, 'show');
}
/* 横幅排队：和连招发现、敌人介绍卡、喊话共用一条道（见 lane.ts），不叠在一起
 * banners queue up, sharing one lane with combo discoveries, enemy intro cards and shouts (see lane.ts), so they never stack */
const BQ: [string, string | undefined][] = [];
let bqT: ReturnType<typeof setTimeout> | null = null;
export function banner(msg: string, col?: string) {
  if (BQ.length < 2) BQ.push([msg, col]);
  pumpBanner();
}
function pumpBanner() {
  if (bqT) return;
  const wait = laneWait(LANE.banner);
  if (wait > 0) {
    bqT = setTimeout(() => {
      bqT = null;
      pumpBanner();
    }, wait + 30);
    return;
  }
  const it = BQ.shift();
  if (!it) return;
  const b = $('#banner');
  b.textContent = it[0];
  b.style.color = it[1] || '#fff';
  restart(b, 'show');
  laneTake(LANE.banner, 1100, () => b.classList.remove('show'));
  if (BQ.length) pumpBanner();
}
/** 换场景时清掉还没出的横幅 / drop queued banners when the scene changes */
export function clearCenter() {
  BQ.length = 0;
  laneClear();
  if (bqT) clearTimeout(bqT);
  bqT = null;
}

/* ---------- 提示气泡：一次性的新手提示 + 点顶栏看说明 ---------- / ---------- Tooltips: one-off tutorial hints + tap the top bar for help ---------- */
const TIPQ: [string, string, number][] = [];
let tipEl: HTMLElement | null = null,
  tipT: ReturnType<typeof setTimeout> | null = null;
let tipSeen: Record<string, number> = store.json(KEYS.tips, {});
/** 设置里「重新显示新手提示」 / 'Show tutorial hints again' in settings */
export function resetTips() {
  tipSeen = { tutorial: 0 };
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
/** 回标题页时把没看完的提示收掉，不留在别的界面上 / on returning to the title screen, put away unfinished tips so they never linger on another screen */
export function hideTips() {
  TIPQ.length = 0;
  if (tipT) clearTimeout(tipT);
  tipT = null;
  if (tipEl) tipEl.className = '';
}
function nextTip(first?: boolean) {
  if (tipT) clearTimeout(tipT);
  tipT = null;
  if (!first) TIPQ.shift();
  if (!TIPQ.length) {
    tipEl!.className = '';
    return;
  }
  /* 战报、结局页上不弹提示（会盖住标题或「收下」），等回到备战再说 / no tips over the report or ending (they would cover the title or the collect button); wait until prep */
  /* 成就弹窗也在顶上：等它收走再出提示 / the achievement popup also sits at the top: wait until it is gone */
  if (G.phase === 'report' || G.phase === 'over' || document.querySelector('.achpop')) {
    tipEl!.className = '';
    tipT = setTimeout(() => nextTip(true), 800);
    return;
  }
  /* 战斗中：提示和喊话共用战场下沿那一格，排在敌人介绍卡一档，喊话等它讲完 / in battle: tips share the bottom slot with shouts, ranked with enemy cards; shouts wait for it */
  const fight = G.phase === 'battle';
  if (fight && laneWait(LANE.foe) > 0) {
    tipEl!.className = '';
    tipT = setTimeout(() => nextTip(true), laneWait(LANE.foe) + 40);
    return;
  }
  const [l, h, ms] = TIPQ[0];
  tipEl!.innerHTML = `<small>${l}</small><p>${h}</p>`;
  tipEl!.className = '';
  if (fight) {
    /* 北边是敌人进场的地方，提示不放顶上，压在卡牌上方 / the north is where enemies come in, so the tip sits just above the cards instead of at the top */
    const st = $('#stage').getBoundingClientRect();
    tipEl!.style.top = `${Math.max(60, st.bottom - 52 - tipEl!.offsetHeight)}px`;
    laneTake(LANE.foe, ms);
  } else if (G.phase === 'prep') {
    /* 备战：顶上是今晚标题和敌情，气泡放到下沿提示条上方 / prep: the night title and threats sit at the top, so the bubble goes above the bottom toast */
    const st = $('#stage').getBoundingClientRect();
    tipEl!.style.top = `${Math.max(60, st.bottom - 76 - tipEl!.offsetHeight)}px`;
  } else {
    /* 首领血条和「下一招」在顶上时，气泡挪到它下面，别挡住 / when the boss bar and 'next move' sit up top, move tooltips below them so they are not covered */
    const bar = $('#bossbar');
    tipEl!.style.top = bar.hidden ? '' : `${bar.getBoundingClientRect().bottom + 6}px`;
  }
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

/** 新手教学该不该放：放过就不再放；打完过一局的老玩家默认算看过，设置里「重新显示提示」会重新打开 / whether the tutorial should play: never twice; players who have finished a run count as having seen it, and 'Show tutorial hints again' in settings re-enables it */
export function takeTutorial(veteran: boolean) {
  const s = tipSeen.tutorial;
  if (!SETTINGS.tips || s === 1 || (s == null && veteran)) return false;
  tipSeen.tutorial = 1;
  store.setJson(KEYS.tips, tipSeen);
  return true;
}

/** 顶栏三个数字点一下有说明 / each of the three top-bar numbers shows help when tapped */
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
