/* 整屏页面：标题、选人、起手三选一、结局 */
import { ITEMS, ADJ, TIERS } from '../data/cards';
import { HEROES, KITS } from '../data/heroes';
import { ACH } from '../data/meta';
import type { KitDef } from '../data/types';
import { L, t } from '../i18n';
import { shuffled } from '../core/rng';
import { clamp } from '../core/util';
import { G, freshRun } from '../game/state';
import { META, ACHM, saveMeta, achCount, mastLv, mastNext, mastGain, recordRun, endlessLost } from '../game/meta';
import { loadSave, clearSave } from '../game/save';
import { B } from '../sim/battle';
import { setScene } from '../render/background';
import { spr } from '../render/sprites';
import { SFX } from '../audio/sfx';
import { $ } from '../ui/dom';
import { audioLabel, toggleAudio } from '../ui/hud';
import { openAch } from '../ui/sheets';
import { loseNote } from '../ui/report';
import { openCodex, openHistory } from '../ui/codex';
import { newGame, resumeSave, continueEndless } from './flow';

/* ---------------- 标题 ---------------- */
export function titleScreen() {
  const sc = $('#screen');
  const T = L.ui.title;
  setScene('title');
  const sv = loadSave();
  sc.innerHTML = `<div class="scr"><div class="logo" aria-label="${T.logoAria}"><span>${T.logo[0]}</span><span>${T.logo[1]}</span></div><div class="logo-sub">PROJECT CHAIN</div>
  <p class="tagline">${T.tagline}</p>
  <div class="rules">${(T.rules as string[]).map((r, i) => `<div><i>${i + 1}</i><span>${r}</span></div>`).join('')}</div>
  ${sv && HEROES[sv.hero] ? `<button class="btn gold big" id="contBtn">${t('title.cont', { h: HEROES[sv.hero].n, r: sv.round })}</button>` : ''}
  <button class="btn ${sv ? 'alt' : 'red'} big" id="startBtn">${sv ? T.newRun : T.start}</button>
  <div class="tbtns"><button class="btn alt" id="achBtn">${t('title.ach', { n: achCount(), max: ACH.length })}${META.heatMax ? t('title.heat', { h: META.heatMax }) : ''}</button><button class="btn alt" id="cdxBtn">${T.codex}</button><button class="btn alt" id="hisBtn">${T.history}</button><button class="btn alt" id="sndBtn" style="flex:none">${audioLabel()}</button></div></div>`;
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
    toggleAudio();
    $('#sndBtn').textContent = audioLabel();
  };
  if ($('#contBtn'))
    $('#contBtn').onclick = () => {
      SFX.ensure();
      SFX.play('merge');
      sc.hidden = true;
      resumeSave();
    };
  /* 借来的星还回去了：挂在标题页的天上 */
  if (META.secrets.star) sc.insertAdjacentHTML('beforeend', `<i class="nstar" title="${T.star}"></i>`);
}

/* ---------------- 选人 ---------------- */
function heatHtml() {
  const h = META.heatSel;
  const H = L.meta.heats as string[];
  return h ? H.slice(1, h + 1).map((x, i) => `<i>${i + 1}</i> ${x}`).join('<br>') : H[0];
}
function heatBar() {
  if (!META.heatMax) return '';
  const T = L.ui.heroes;
  return `<div class="heatsel"><button class="btn sm" id="hMinus" aria-label="${T.heatDown}">‹</button><div><b>${t('heroes.heat', { h: META.heatSel })}</b><small id="heatD">${heatHtml()}</small></div><button class="btn sm" id="hPlus" aria-label="${T.heatUp}">›</button></div>`;
}
function bindHeat() {
  const f = (d: number) => {
    META.heatSel = clamp(META.heatSel + d, 0, META.heatMax);
    saveMeta();
    SFX.play('ui');
    (document.querySelector('.heatsel b') as HTMLElement).textContent = t('heroes.heat', { h: META.heatSel });
    $('#heatD').innerHTML = heatHtml();
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

export function heroSelect() {
  const sc = $('#screen');
  const T = L.ui.heroes;
  setScene('title');
  sc.innerHTML = `<div class="scr"><h1 style="font-size:32px">${T.title}</h1>${heatBar()}<div class="heroes">${Object.keys(HEROES)
    .map((k) => {
      const H = HEROES[k];
      return `<button class="hero" data-h="${k}" style="--hc:${H.col}"><img class="por" src="${spr(H.portrait).url}" alt=""><div class="hn"><b>${H.n}</b><small>${H.title}</small></div>
    <div class="htag">${H.tag}</div><div class="hstat"><span>${T.wall} <b>${H.wall}</b></span><span>${T.gold} <b>${H.gold}</b></span>${mastHtml(k)}</div><p>${H.desc}</p>
    <div class="hmeta"><div class="hcards">${H.start.map((s) => `<img src="${spr(s[0]).url}" alt="${ITEMS[s[0]].n}">`).join('')}</div></div>
    <em>“${H.intro}”</em></button>`;
    })
    .join('')}</div><p class="mastline">${T.mastLine}${(L.meta.mastShort as string[]).map((p, i) => t('heroes.mastLv', { n: i + 1, p })).join(' · ')}</p><button class="btn alt sm" id="cdxBtn2">${T.codex}</button></div>`;
  sc.hidden = false;
  bindHeat();
  $('#cdxBtn2').onclick = () => {
    SFX.ensure();
    openCodex(Object.keys(HEROES)[0]);
  };
  sc.querySelectorAll<HTMLElement>('.hero').forEach(
    (b) =>
      (b.onclick = () => {
        SFX.ensure();
        SFX.play('merge');
        sc.hidden = true;
        newGame(b.dataset.h!);
      }),
  );
}

/* ---------------- 起手三选一（每人四套，第一套固定出现） ---------------- */
export function pickKit(done: (k: KitDef) => void) {
  const H = HEROES[G.hero];
  const all = KITS[G.hero] || [{ n: '', d: '', cards: H.start.map((s) => [s[0], s[1]] as [string, number]) }];
  const list = [all[0], ...shuffled(all.slice(1))].slice(0, 3);
  const sc = $('#screen');
  const T = L.ui.kits;
  setScene('title');
  sc.innerHTML = `<div class="scr"><img class="por-big" src="${spr(H.portrait).url}" alt=""><h1 style="font-size:28px">${T.title}</h1><div class="logo-sub">${H.n} · ${H.title}</div>
  <div class="kits">${list
    .map(
      (k, i) => `<button class="kit" data-i="${i}" style="--hc:${H.col}"><div class="kc">${k.cards.map((c) => `<img src="${spr(c[0]).url}" alt="${ITEMS[c[0]].n}">`).join('')}</div>
  <div><b>${k.n}</b><span>${k.cards.map((c) => ITEMS[c[0]].n + (c[1] > ITEMS[c[0]].t ? '（' + TIERS[c[1]].n + '）' : '')).join(' · ')}${k.gold ? t('kits.gold', { g: (k.gold > 0 ? '+' : '') + k.gold }) : ''}</span><span>${k.d}</span></div></button>`,
    )
    .join('')}</div></div>`;
  sc.hidden = false;
  sc.querySelectorAll<HTMLElement>('.kit').forEach(
    (b) =>
      (b.onclick = () => {
        SFX.ensure();
        SFX.play('merge');
        sc.hidden = true;
        done(list[+b.dataset.i!]);
      }),
  );
}

/* ---------------- 结局 ---------------- */
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
  const got = R.got.map((id) => ACHM[id]).filter(Boolean);
  const H = HEROES[G.hero];
  const row = (a: string, b: string | number) => `<div><span>${a}</span><i style="margin-left:auto">${b}</i></div>`;
  const endNote = endl ? `<div class="newheat">${t('end.endlessNote', { n: Math.max(0, G.round - 9) })}${META.endBest ? t('end.endlessBest', { n: META.endBest }) : ''}</div>` : '';
  const mastNote = mg
    ? `<div class="newheat">${t('end.mast', { h: H.n, n: mg.add })}${mg.up ? t('end.mastUp', { lv: mg.lv, p: (L.meta.mastPerk as string[])[mg.lv - 1] }) : t('end.mastLv', { lv: mg.lv })}</div>`
    : '';
  sc.innerHTML = `<div class="scr"><img class="por-big" src="${spr(H.portrait).url}" alt=""><h1 style="color:${win || endl ? '#ffe79a' : '#ff8a80'}">${win ? T.dawn : endl ? T.endless : T.lost}</h1><div class="logo-sub">${H.n} · ${H.title}</div>
  <div class="rules res">${row(T.reached, endl ? t('end.reachedEndless', { r: G.round }) : t('end.reachedR', { r: Math.min(G.round, 8) }))}
  ${G.heat ? row(T.heat, t('heroes.heat', { h: G.heat })) : ''}
  ${row(T.relicsTalents, t('end.relicsTalentsV', { r: G.relics.length, t: G.skills.length }))}
  ${row(T.bestChain, '×' + (G.bestChain || 1))}
  ${row(T.kills, R.kills + ' / ' + R.maxCombo)}
  ${best ? row(T.ace, `${best.adj ? t('sheet.adjOf', { a: ADJ[best.adj].n }) : ''}${ITEMS[best.key].n} · ${TIERS[best.tier].n}`) : ''}</div>
  ${endNote}${win ? '' : loseNote(B)}
  ${mastNote}
  ${R.newHeat ? `<div class="newheat">${t('end.newHeat', { h: R.newHeat, d: (L.meta.heats as string[])[R.newHeat] })}</div>` : ''}
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
