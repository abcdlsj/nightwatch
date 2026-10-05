/* 整屏页面：标题、选人、起手三选一、结局 */
import { ITEMS, ADJ, TIERS } from '../data/cards';
import { HEROES, KITS } from '../data/heroes';
import { ACH } from '../data/meta';
import type { KitDef } from '../data/types';
import { L, t } from '../i18n';
import { shuffled } from '../core/rng';
import { clamp } from '../core/util';
import { G, freshRun } from '../game/state';
import { META, ACHM, saveMeta, achCount, mastLv, mastNext, mastGain, recordRun, endlessLost, endFrom } from '../game/meta';
import { lastNight, nightKind } from '../game/plan';
import { heroList, heroUnlocked, heroNeeds, heatOf, pathsOf, pathOpen, kitOpen, fullOpen, fullSelected, setFullSelected } from '../game/unlocks';
import { loadSave, clearSave } from '../game/save';
import { B } from '../sim/battle';
import { setScene } from '../render/background';
import { spr } from '../render/sprites';
import { SFX } from '../audio/sfx';
import { $ } from '../ui/dom';
import { openSettings } from '../ui/settings';
import { openAch } from '../ui/sheets';
import { loseNote } from '../ui/report';
import { openCodex, openHistory } from '../ui/codex';
import { canInstallIOS } from '../platform/pwa';
import { store, KEYS } from '../platform/storage';
import { newGame, resumeSave, continueEndless } from './flow';

/* ---------------- 标题 ---------------- */
export function titleScreen() {
  const sc = $('#screen');
  const T = L.ui.title;
  setScene('title');
  const sv = loadSave();
  sc.innerHTML = `<div class="scr"><div class="logo" aria-label="${T.logoAria}">${(T.logo as string[]).map((c) => `<span>${c}</span>`).join('')}</div><div class="logo-sub">NIGHT WATCH</div>
  <p class="tagline">${T.tagline}</p>
  <div class="rules">${(T.rules as string[]).map((r, i) => `<div><i>${i + 1}</i><span>${r}</span></div>`).join('')}</div>
  ${sv && HEROES[sv.hero] ? `<button class="btn gold big" id="contBtn">${t('title.cont', { h: HEROES[sv.hero].n, r: sv.round })}</button>` : ''}
  <button class="btn ${sv ? 'alt' : 'red'} big" id="startBtn">${sv ? T.newRun : T.start}</button>
  <div class="tbtns"><button class="btn alt" id="achBtn">${t('title.ach', { n: achCount(), max: ACH.length })}${META.heatMax ? t('title.heat', { h: META.heatMax }) : ''}</button><button class="btn alt" id="cdxBtn">${T.codex}</button><button class="btn alt" id="hisBtn">${T.history}</button><button class="btn alt" id="sndBtn" style="flex:none" aria-label="${L.ui.settings.title}">⚙</button></div></div>`;
  sc.hidden = false;
  $('#startBtn').onclick = () => {
    SFX.ensure();
    SFX.play('merge');
    heroSelect();
  };
  $('#achBtn').onclick = () => {
    SFX.ensure();
    openAch();
  };
  $('#cdxBtn').onclick = () => {
    SFX.ensure();
    openCodex();
  };
  $('#hisBtn').onclick = () => {
    SFX.ensure();
    openHistory();
  };
  $('#sndBtn').onclick = () => {
    SFX.ensure();
    openSettings(() => titleScreen());
  };
  if ($('#contBtn'))
    $('#contBtn').onclick = () => {
      SFX.ensure();
      SFX.play('merge');
      sc.hidden = true;
      resumeSave();
    };
  /* iOS Safari 里：提示装到主屏（全屏、离线）。点叉不再提示 */
  if (canInstallIOS() && !store.get(KEYS.iosHint)) {
    sc.querySelector('.scr')!.insertAdjacentHTML('beforeend', `<div class="ioshint"><span>${T.installIOS}</span><button class="btn sm" id="iosX" aria-label="${T.installClose}">×</button></div>`);
    $('#iosX').onclick = () => {
      store.set(KEYS.iosHint, '1');
      document.querySelector('.ioshint')?.remove();
    };
  }
  /* 借来的星还回去了：挂在标题页的天上 */
  if (META.secrets.star) sc.insertAdjacentHTML('beforeend', `<i class="nstar" title="${T.star}"></i>`);
}

/* ---------------- 选人 ---------------- */
/** 长夜难度：每个人物各自解锁，起手页里选 */
function heatHtml(h: number) {
  const H = L.meta.heats as string[];
  return h ? H.slice(1, h + 1).map((x, i) => `<i>${i + 1}</i> ${x}`).join('<br>') : H[0];
}
function heatBar(hero: string) {
  const Hh = heatOf(hero);
  if (!Hh.max) return '';
  const T = L.ui.heroes;
  return `<div class="heatsel"><button class="btn sm" id="hMinus" aria-label="${T.heatDown}">‹</button><div><b>${t('heroes.heat', { h: Hh.sel })}</b><small id="heatD">${heatHtml(Hh.sel)}</small></div><button class="btn sm" id="hPlus" aria-label="${T.heatUp}">›</button></div>`;
}
function bindHeat(hero: string) {
  const Hh = heatOf(hero);
  const f = (d: number) => {
    Hh.sel = clamp(Hh.sel + d, 0, Hh.max);
    saveMeta();
    SFX.play('ui');
    (document.querySelector('.heatsel b') as HTMLElement).textContent = t('heroes.heat', { h: Hh.sel });
    $('#heatD').innerHTML = heatHtml(Hh.sel);
  };
  if ($('#hMinus')) {
    $('#hMinus').onclick = (e) => {
      e.stopPropagation();
      f(-1);
    };
    $('#hPlus').onclick = (e) => {
      e.stopPropagation();
      f(1);
    };
  }
}
function mastHtml(h: string) {
  const lv = mastLv(h),
    nx = mastNext(h);
  return `<span class="hmast">${L.ui.heroes.mast} <b>${lv}</b>${nx ? `<small>${t('heroes.mastNext', { n: nx })}</small>` : ''}</span>`;
}
/** 流派一览：解锁了的亮着，没解锁的写要几级熟练 */
function pathsHtml(h: string) {
  return `<div class="hpaths">${pathsOf(h)
    .map((p) => (pathOpen(h, p) ? `<span class="on">${p.n}</span>` : `<span>${p.n}<small>${t('heroes.pathLock', { n: p.mast })}</small></span>`))
    .join('')}</div>`;
}

export function heroSelect() {
  const sc = $('#screen');
  const T = L.ui.heroes;
  setScene('title');
  sc.innerHTML = `<div class="scr"><h1 style="font-size:32px">${T.title}</h1><div class="heroes">${heroList()
    .map((k) => {
      const H = HEROES[k];
      if (!heroUnlocked(k))
        return `<button class="hero locked" data-h="${k}" style="--hc:#56656b" disabled><img class="por" src="${spr(H.portrait).url}" alt=""><div class="hn"><b>${H.n}</b><small>${H.title}</small></div>
    <div class="htag">${T.locked}</div><p>${t('heroes.unlockBy', { h: HEROES[heroNeeds(k)].n })}</p></button>`;
      const hh = heatOf(k).max;
      return `<button class="hero" data-h="${k}" style="--hc:${H.col}"><img class="por" src="${spr(H.portrait).url}" alt=""><div class="hn"><b>${H.n}</b><small>${H.title}</small></div>
    <div class="htag">${H.tag}</div><div class="hstat"><span>${T.wall} <b>${H.wall}</b></span><span>${T.gold} <b>${H.gold}</b></span>${mastHtml(k)}${hh ? `<span>${t('heroes.heat', { h: hh })}</span>` : ''}</div><p>${H.desc}</p>
    ${pathsHtml(k)}
    <em>“${H.intro}”</em></button>`;
    })
    .join('')}</div><p class="mastline">${T.mastLine}${(L.meta.mastShort as string[]).map((p, i) => t('heroes.mastLv', { n: i + 1, p })).join(' · ')}</p><button class="btn alt sm" id="cdxBtn2">${T.codex}</button></div>`;
  sc.hidden = false;
  $('#cdxBtn2').onclick = () => {
    SFX.ensure();
    openCodex(heroList()[0]);
  };
  sc.querySelectorAll<HTMLElement>('.hero:not(.locked)').forEach(
    (b) =>
      (b.onclick = () => {
        SFX.ensure();
        SFX.play('merge');
        sc.hidden = true;
        newGame(b.dataset.h!);
      }),
  );
}

/* ---------------- 起手三选一（第一套固定出现；没解锁流派的起手套不出现，在下面列出解锁条件） ---------------- */
/** 完整游戏线的勾选框：三个流派的起手各守到一次黎明后出现在起手页顶上 */
function fullBox(hero: string) {
  if (!fullOpen(hero)) return '';
  const T = L.ui.kits;
  return `<label class="fullbox${fullSelected(hero) ? ' on' : ''}"><input type="checkbox" id="fullChk"${fullSelected(hero) ? ' checked' : ''}><span><b>${T.full}</b><small>${T.fullD}</small></span></label>`;
}
function bindFull(hero: string) {
  const c = document.getElementById('fullChk') as HTMLInputElement | null;
  if (!c) return;
  c.onchange = () => {
    setFullSelected(hero, c.checked);
    c.parentElement!.classList.toggle('on', c.checked);
    SFX.play(c.checked ? 'intent' : 'ui');
  };
}

export function pickKit(done: (k: KitDef, heat: number, full: boolean) => void) {
  const H = HEROES[G.hero];
  const all = KITS[G.hero] || [{ n: '', d: '', path: '', cards: H.start.map((s) => [s[0], s[1]] as [string, number]) }];
  const open = all.filter((k) => kitOpen(G.hero, k));
  /* 每个解锁了的流派先出一套（第一个流派固定第一套），不够三套再从剩下的里随机补 */
  const byPath: KitDef[] = [];
  for (const k of [open[0], ...shuffled(open.slice(1))]) if (!byPath.some((x) => x.path === k.path)) byPath.push(k);
  const list = [...byPath, ...shuffled(open.filter((k) => !byPath.includes(k)))].slice(0, 3);
  const sc = $('#screen');
  const T = L.ui.kits;
  setScene('title');
  sc.innerHTML = `<div class="scr">${fullBox(G.hero)}<img class="por-big" src="${spr(H.portrait).url}" alt=""><h1 style="font-size:28px">${T.title}</h1><div class="logo-sub">${H.n} · ${H.title}</div>
  ${heatBar(G.hero)}
  <div class="kits">${list
    .map((k, i) => {
      const p = pathsOf(G.hero).find((x) => x.id === k.path);
      return `<button class="kit" data-i="${i}" style="--hc:${H.col}"><div class="kc">${k.cards.map((c) => `<img src="${spr(c[0]).url}" alt="${ITEMS[c[0]].n}">`).join('')}</div>
  <div><b>${k.n}${p ? `<small class="gt">${p.n}</small>` : ''}</b><span>${k.cards.map((c) => ITEMS[c[0]].n + (c[1] > ITEMS[c[0]].t ? '（' + TIERS[c[1]].n + '）' : '')).join(' · ')}${k.gold ? t('kits.gold', { g: (k.gold > 0 ? '+' : '') + k.gold }) : ''}</span><span>${k.d}</span></div></button>`;
    })
    .join('')}</div>
  ${pathsHtml(G.hero)}</div>`;
  sc.hidden = false;
  bindHeat(G.hero);
  bindFull(G.hero);
  sc.querySelectorAll<HTMLElement>('.kit').forEach(
    (b) =>
      (b.onclick = () => {
        SFX.ensure();
        SFX.play('merge');
        sc.hidden = true;
        done(list[+b.dataset.i!], heatOf(G.hero).sel, fullSelected(G.hero));
      }),
  );
}

/* ---------------- 结局 ---------------- */
/** 守到黎明的标题：完整线打倒隐藏首领是「真正的黎明」，宝石不全是「还缺一块」 */
function dawnTitle() {
  const T = L.ui.end;
  if (!G.full) return T.dawn;
  return nightKind(G.maxRound) === 'hidden' ? T.dawnTrue : T.dawnQuiet;
}
export function endScreen(win: boolean) {
  const sc = $('#screen');
  const T = L.ui.end;
  setScene(win ? 'shop' : 'over');
  recordRun(win, B && B.wallBy ? B.wallBy : null);
  const best = G.cards.slice().sort((a, b) => b.bDmg - a.bDmg)[0];
  const R = G.run || freshRun();
  const endl = !!G.endless;
  if (endl) endlessLost();
  else {
    META.runs++;
    saveMeta();
  }
  const mg = endl ? null : mastGain(win);
  const newPaths = mg && mg.up ? pathsOf(G.hero).filter((p) => p.mast === mg.lv) : [];
  const got = R.got.map((id) => ACHM[id]).filter(Boolean);
  const H = HEROES[G.hero];
  const row = (a: string, b: string | number) => `<div><span>${a}</span><i style="margin-left:auto">${b}</i></div>`;
  const endNote = endl ? `<div class="newheat">${t('end.endlessNote', { n: Math.max(0, G.round - endFrom()) })}${META.endBest ? t('end.endlessBest', { n: META.endBest }) : ''}</div>` : '';
  const mastNote = mg
    ? `<div class="newheat">${t('end.mast', { h: H.n, n: mg.add })}${mg.up ? t('end.mastUp', { lv: mg.lv, p: (L.meta.mastPerk as string[])[mg.lv - 1] }) : t('end.mastLv', { lv: mg.lv })}</div>`
    : '';
  sc.innerHTML = `<div class="scr"><img class="por-big" src="${spr(H.portrait).url}" alt=""><h1 style="color:${win || endl ? '#ffe79a' : '#ff8a80'}">${win ? dawnTitle() : endl ? T.endless : T.lost}</h1><div class="logo-sub">${H.n} · ${H.title}</div>
  <div class="rules res">${row(T.reached, endl ? t('end.reachedEndless', { r: G.round }) : t('end.reachedR', { r: Math.min(G.round, lastNight()), m: lastNight() }))}
  ${G.heat ? row(T.heat, t('heroes.heat', { h: G.heat })) : ''}
  ${row(T.relicsTalents, t('end.relicsTalentsV', { r: G.relics.length, t: G.skills.length }))}
  ${row(T.bestChain, '×' + (G.bestChain || 1))}
  ${row(T.kills, R.kills + ' / ' + R.maxCombo)}
  ${best ? row(T.ace, `${best.adj ? t('sheet.adjOf', { a: ADJ[best.adj].n }) : ''}${ITEMS[best.key].n} · ${TIERS[best.tier].n}`) : ''}</div>
  ${endNote}${win ? '' : loseNote(B)}
  ${mastNote}
  ${R.newHeat ? `<div class="newheat">${t('end.newHeat', { h: R.newHeat, d: (L.meta.heats as string[])[R.newHeat] })}</div>` : ''}
  ${newPaths.map((p) => `<div class="newheat">${t('end.newPath', { h: H.n, p: p.n })}</div>`).join('')}
  ${R.newHero ? `<div class="newheat">${t('end.newHero', { h: HEROES[R.newHero].n, t: HEROES[R.newHero].title })}</div>` : ''}
  ${R.newFull ? `<div class="newheat full">${t('end.newFull', { h: H.n })}</div>` : R.pathWin && R.pathWin[0] < R.pathWin[1] ? `<div class="newheat">${t('end.pathWin', { n: R.pathWin[0], m: R.pathWin[1] })}</div>` : ''}
  ${got.length ? `<div class="rules res achgot"><div><span>${T.gotAch}</span></div>${got.map((a) => `<div><i>★</i><span><b>${a.n}</b> ${a.d}</span></div>`).join('')}</div>` : ''}
  ${win ? `<button class="btn gold big" id="endlessBtn">${T.goOn}</button>` : ''}<button class="btn red big" id="againBtn">${T.again}</button><button class="btn alt sm" id="hisBtn2">${T.history}</button></div>`;
  clearSave();
  sc.hidden = false;
  $('#againBtn').onclick = () => {
    SFX.ensure();
    SFX.play('ui');
    sc.hidden = true;
    heroSelect();
  };
  $('#hisBtn2').onclick = () => {
    SFX.ensure();
    openHistory();
  };
  if ($('#endlessBtn'))
    $('#endlessBtn').onclick = () => {
      SFX.ensure();
      SFX.play('merge');
      continueEndless();
    };
}
