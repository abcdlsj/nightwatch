/* 图鉴（卡牌 / 遗物 / 天赋 / 敌人）和过往守夜 */
import { ITEMS, ADJ, TIERS, GT } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS, TCAT } from '../data/talents';
import { EN, FOESETS } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { L, t } from '../i18n';
import { META, ACHM, bestiary, foeSeen, type HistEntry } from '../game/meta';
import { modText } from '../game/text';
import { icon, spr, hasSpr } from '../render/sprites';
import { SFX } from '../audio/sfx';
import { $ } from './dom';
import { paintCard } from './card-view';
import { sheetOpen, closeSheet, openSheet, talentText } from './sheets';

const hDate = (tm: number) => {
  const d = new Date(tm),
    p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const hResult = (h: HistEntry) => (h.en ? t('codex.resEndless', { n: h.en }) : h.w ? L.ui.codex.resDawn : t('codex.resLost', { r: h.r }));
const setName = (k: string) => (FOESETS[k] || FOESETS.dark).n;

function miniCard(el: HTMLElement, k: string, tier: number, adj?: string | 0 | null) {
  const ce = document.createElement('div');
  paintCard(ce, { key: k, tier, adj: adj || null, size: ITEMS[k].size, dl: 0, hoard: 0 }, 'static');
  el.appendChild(ce);
  return ce;
}

/* ---------------- 过往守夜 ---------------- */
export function openHistory() {
  SFX.play('ui');
  const H = META.hist;
  const T = L.ui.codex;
  const per = Object.keys(HEROES)
    .map((k) => {
      const hs = H.filter((h) => h.h === k);
      if (!hs.length) return '';
      const w = hs.filter((h) => h.w).length,
        top = hs.reduce((a, h) => (h.en > a.en || (h.en === a.en && h.r > a.r) ? h : a), hs[0]);
      const best = top.en ? t('codex.bestEndless', { n: top.en }) : top.w ? T.bestDawn : t('codex.bestNight', { r: top.r });
      return `<div><span>${HEROES[k].n}</span><i style="margin-left:auto">${t('codex.perHero', { n: hs.length, w, b: best })}</i></div>`;
    })
    .join('');
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${T.history}"><h3>${T.history} <small class="spn">${t('codex.runs', { n: H.length })}</small></h3>
    <p class="muted2">${t('codex.histSum', { r: META.runs || 0, w: META.wins || 0 })}${META.endBest ? t('codex.histEnd', { n: META.endBest }) : ''}${L.ui.common.period}</p>
    ${per ? `<div class="rules res hs-sum">${per}</div>` : ''}
    <div class="tlist hs-list">${
      H.length
        ? H.map((h, i) => {
            const He = HEROES[h.h] || { n: '?', col: '#888', portrait: '' };
            return `<button class="trow relrow hs-row${h.w ? ' win' : ''}" data-i="${i}" style="--gc:${h.w ? '#ffd166' : '#ff8a80'}">
        <img class="ricon" src="${HEROES[h.h] ? spr(He.portrait).url : ''}" alt=""><div><b>${hResult(h)}<small class="gt">${He.n}</small></b>
        <span class="hs-sub">${hDate(h.t)}${h.full ? ' · ' + T.fullTag : ''} · ${setName(h.set)}${h.heat ? ' · ' + t('heroes.heat', { h: h.heat }) : ''} · ${t('codex.kills', { n: h.k })}</span>
        <span class="hs-cards">${h.bd.map((c) => (ITEMS[c[0]] ? `<img src="${spr(c[0]).url}" alt="" style="--tc:${TIERS[c[1]].c}">` : '')).join('')}</span></div></button>`;
          }).join('')
        : `<p class="muted2">${T.noHistory}</p>`
    }</div>
    <div class="sh-btns"><button class="btn" id="hsClose">${L.ui.sheet.close}</button></div></div>`);
  $('#hsClose').onclick = closeSheet;
  sh.querySelectorAll<HTMLElement>('.hs-row').forEach((b) => (b.onclick = () => openRunDetail(+b.dataset.i!)));
}

function openRunDetail(i: number) {
  SFX.play('ui');
  const h = META.hist[i];
  if (!h) return openHistory();
  const T = L.ui.codex;
  const He = HEROES[h.h];
  const rows: [string, string | number][] = [[T.date, hDate(h.t)], [T.result, hResult(h)], [T.foes, setName(h.set) + (h.w && EN[h.boss] ? t('codex.boss', { n: EN[h.boss].n }) : '')]];
  if (h.heat) rows.push([T.heat, t('heroes.heat', { h: h.heat })]);
  rows.push([T.bestChain, '×' + h.ch], [T.kills, h.k + ' / ' + h.cb]);
  if (h.by && EN[h.by]) rows.push([T.leaked, EN[h.by].n]);
  if (h.best && ITEMS[h.best[0]]) rows.push([T.ace, (h.best[2] && ADJ[h.best[2]] ? t('sheet.adjOf', { a: ADJ[h.best[2]].n }) : '') + ITEMS[h.best[0]].n + ' · ' + TIERS[h.best[1]].n]);
  const rl: Record<string, number> = {};
  h.rl.forEach((r) => {
    if (RELICS[r]) rl[r] = (rl[r] || 0) + 1;
  });
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${T.thisRun}"><div class="sh-top">${He ? `<img class="ricon big" src="${spr(He.portrait).url}" alt="" style="--gc:${He.col}">` : ''}
    <div><h3 style="color:${h.w ? '#ffe79a' : '#ff8a80'}">${hResult(h)}</h3><div class="tags"><span class="tag">${He ? He.n + ' · ' + He.title : '?'}</span></div></div></div>
    <div class="rules res">${rows.map((r) => `<div><span>${r[0]}</span><i style="margin-left:auto">${r[1]}</i></div>`).join('')}</div>
    <div class="hs-h">${T.lastBoard}</div><div class="cdx hs-board"></div>
    <div class="hs-h">${t('codex.relicsN', { n: h.rl.length })}</div>${h.rl.length ? `<div class="hs-rel">${Object.keys(rl).map((r) => `<span style="--gc:${GT[RELICS[r].t].c}"><img src="${icon(RELICS[r].ico).url}" alt="">${RELICS[r].n}${rl[r] > 1 ? ' ×' + rl[r] : ''}</span>`).join('')}</div>` : `<p class="muted2">${T.noRelic}</p>`}
    <div class="hs-h">${t('codex.talentsN', { n: h.sk.length })}</div>${h.sk.length ? `<div class="hs-rel">${h.sk.filter((x) => TALENTS[x]).map((x) => `<span style="--gc:${TCAT[TALENTS[x].cat].c}">${TALENTS[x].n}</span>`).join('')}</div>` : `<p class="muted2">${T.noTalent}</p>`}
    ${h.ach.length ? `<div class="hs-h">${T.runAch}</div><div class="hs-rel">${h.ach.filter((a) => ACHM[a]).map((a) => `<span style="--gc:#ffd166">★ ${ACHM[a].n}</span>`).join('')}</div>` : ''}
    <div class="sh-btns"><button class="btn" id="hsBack">${L.ui.sheet.back}</button><button class="btn" id="hsClose">${L.ui.sheet.close}</button></div></div>`);
  const bd = sh.querySelector('.hs-board') as HTMLElement;
  for (const c of h.bd)
    if (ITEMS[c[0]]) {
      const b = document.createElement('div');
      b.className = 'cdx-i';
      miniCard(b, c[0], c[1], c[2]);
      b.insertAdjacentHTML('beforeend', `<span>${ITEMS[c[0]].n}</span>`);
      bd.appendChild(b);
    }
  if (!h.bd.length) bd.outerHTML = `<p class="muted2">${T.emptyBoard}</p>`;
  $('#hsBack').onclick = openHistory;
  $('#hsClose').onclick = closeSheet;
}

/* ---------------- 图鉴 ---------------- */
const TABS = ['card', 'relic', 'talent', 'foe'] as const;
function cxHead(tab: string, got: number, all: number) {
  const N = L.meta.codexTabs as Record<string, string>;
  return `<h3>${L.ui.codex.codex} <small class="spn">${got} / ${all}</small></h3>
  <div class="cdx-tabs cx-main">${TABS.map((k) => `<button class="btn sm${k === tab ? ' on' : ''}" data-m="${k}">${N[k]}</button>`).join('')}</div>`;
}
function cxBind(sh: HTMLElement) {
  sh.querySelectorAll<HTMLElement>('.cx-main .btn').forEach((b) => (b.onclick = () => openCodex(b.dataset.m)));
  $('#cdxClose').onclick = closeSheet;
}
const cxLock = () => `<b class="cx-q">${L.ui.codex.unknown3}</b>`;
const closeRow = () => `<div class="sh-btns"><button class="btn" id="cdxClose">${L.ui.sheet.close}</button></div>`;

/** openCodex() 卡牌通用页；openCodex(人物 key) 卡牌专属页；openCodex('relic'|'talent'|'foe') 其他页 */
export function openCodex(tab?: string, sub?: string) {
  if (tab && (HEROES[tab] || tab === 'all')) {
    sub = tab;
    tab = 'card';
  }
  tab = tab || 'card';
  ({ card: cxCards, relic: cxRelics, talent: cxTalents, foe: cxFoes } as Record<string, (s?: string) => void>)[tab](sub);
}

function cxCards(sub?: string) {
  SFX.play('ui');
  sub = sub || 'all';
  const T = L.ui.codex;
  const X = META.cx.c;
  const tabs: [string, string][] = [['all', T.common], ...Object.keys(HEROES).map((k) => [k, t('codex.heroOnly', { h: HEROES[k].n })] as [string, string])];
  const pool = Object.keys(ITEMS).filter((k) => !ITEMS[k].noPool);
  const keys = pool.filter((k) => (sub === 'all' ? !ITEMS[k].hero : ITEMS[k].hero === sub)).sort((a, b) => ITEMS[a].t - ITEMS[b].t || ITEMS[a].size - ITEMS[b].size);
  const got = keys.filter((k) => X[k] != null).length;
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${T.cardCodex}">${cxHead('card', pool.filter((k) => X[k] != null).length, pool.length)}
    <div class="cdx-tabs">${tabs.map(([k, n]) => `<button class="btn sm${k === sub ? ' on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>
    <p class="muted2">${sub === 'all' ? '' : t('codex.heroShop', { h: HEROES[sub].n })}${t('codex.cardsGot', { g: got, n: keys.length })}</p>
    <div class="cdx"></div>${closeRow()}</div>`);
  const grid = sh.querySelector('.cdx') as HTMLElement;
  for (const k of keys) {
    const b = document.createElement('button');
    b.className = 'cdx-i' + (X[k] == null ? ' lock' : '');
    const tier = X[k] == null ? ITEMS[k].t : X[k];
    miniCard(b, k, tier);
    b.insertAdjacentHTML('beforeend', `<span>${ITEMS[k].n}</span>`);
    b.onclick = () => {
      openSheet({ kind: 'codex', offer: { card: { key: k, tier, adj: null, size: ITEMS[k].size, dl: 0, hoard: 0 }, sold: true, price: 0 } });
      const bt = $('#shBtns');
      if (bt) {
        const r = document.createElement('button');
        r.className = 'btn';
        r.textContent = T.backCodex;
        r.onclick = () => cxCards(sub);
        bt.prepend(r);
      }
    };
    grid.appendChild(b);
  }
  sh.querySelectorAll<HTMLElement>('.cdx-tabs:not(.cx-main) .btn').forEach((b) => (b.onclick = () => cxCards(b.dataset.t)));
  cxBind(sh);
}

function cxGroups<T extends { hero?: string }>(obj: Record<string, T>, keys: string[]): [string, string[]][] {
  const g: [string, string[]][] = [['', keys.filter((k) => !obj[k].hero)]];
  for (const h in HEROES) g.push([t('codex.heroOnly', { h: HEROES[h].n }), keys.filter((k) => obj[k].hero === h)]);
  return g.filter((x) => x[1].length);
}

function cxRelics() {
  SFX.play('ui');
  const X = META.cx.r;
  const keys = Object.keys(RELICS)
    .filter((k) => RELICS[k].m && GT[RELICS[k].t])
    .sort((a, b) => RELICS[a].t - RELICS[b].t);
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${L.ui.codex.relicCodex}">${cxHead('relic', keys.filter((k) => X[k]).length, keys.length)}
    <div class="tlist">${cxGroups(RELICS, keys)
      .map(
        ([n, ks]) =>
          (n ? `<div class="hs-h">${n}</div>` : '') +
          ks
            .map((r) => {
              const R0 = RELICS[r],
                c = GT[R0.t].c,
                ok = X[r];
              return `<div class="trow${ok ? '' : ' cx-lock'}" style="--gc:${c}"><img class="ricon" src="${icon(R0.ico).url}" alt=""><div>${ok ? `<b>${R0.n}<small class="gt">${GT[R0.t].n}</small></b><div class="mods">${modText(R0.m)}</div>${R0.f ? `<em>${R0.f}</em>` : ''}` : `${cxLock()}<small class="gt">${GT[R0.t].n}</small>`}</div></div>`;
            })
            .join(''),
      )
      .join('')}</div>
    ${closeRow()}</div>`);
  cxBind(sh);
}

function cxTalents() {
  SFX.play('ui');
  const X = META.cx.t;
  const keys = Object.keys(TALENTS).sort((a, b) => TALENTS[a].r - TALENTS[b].r);
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${L.ui.codex.talentCodex}">${cxHead('talent', keys.filter((k) => X[k]).length, keys.length)}
    <p class="muted2">${L.ui.codex.talentHow}</p>
    <div class="tlist">${cxGroups(TALENTS, keys)
      .map(
        ([n, ks]) =>
          (n ? `<div class="hs-h">${n}</div>` : '') +
          ks
            .map((id) => {
              const Tl = TALENTS[id],
                C = TCAT[Tl.cat] || TCAT.atk,
                ok = X[id];
              return `<div class="trow${ok ? '' : ' cx-lock'}" style="--gc:${C.c}"><img class="ricon" src="${icon(C.ico).url}" alt=""><div>${ok ? `<b>${Tl.n}<small class="gt">${C.n}</small></b><div class="mods">${talentText(id)}</div>${Tl.say ? `<em>“${Tl.say}”</em>` : ''}` : `${cxLock()}<small class="gt">${C.n}</small>`}</div></div>`;
            })
            .join(''),
      )
      .join('')}</div>
    ${closeRow()}</div>`);
  cxBind(sh);
}

const foeGroup = (k: string) => {
  const d = EN[k];
  return d.boss ? 3 : d.elite ? 2 : d.faction === 'frost' ? 1 : 0;
};
function cxFoes() {
  SFX.play('ui');
  const G4 = L.meta.foeGroups as string[];
  const keys = Object.keys(EN).filter((k) => hasSpr(EN[k].spr));
  const got = keys.filter(foeSeen).length;
  const sh = sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="${L.ui.codex.foeCodex}">${cxHead('foe', got, keys.length)}
    <div class="cx-foes">${G4.map((n, g) => {
      const ks = keys.filter((k) => foeGroup(k) === g);
      return ks.length
        ? `<div class="hs-h">${n} <small>${ks.filter(foeSeen).length} / ${ks.length}</small></div><div class="cdx">${ks
            .map((k) => {
              const ok = foeSeen(k);
              return `<button class="cdx-i cx-foe${ok ? '' : ' lock'}" data-k="${k}"${ok ? '' : ' disabled'}><img src="${spr(EN[k].spr).url}" alt=""><span>${ok ? EN[k].n : L.ui.codex.unknown3}</span></button>`;
            })
            .join('')}</div>`
        : '';
    }).join('')}</div>
    ${closeRow()}</div>`);
  sh.querySelectorAll<HTMLElement>('.cx-foe:not(.lock)').forEach((b) => (b.onclick = () => cxFoe(b.dataset.k!)));
  cxBind(sh);
}

function cxFoe(k: string) {
  SFX.play('ui');
  const d = EN[k];
  const T = L.ui.codex;
  const seen = bestiary()[k] || 0,
    kl = META.cx.k[k] || 0;
  const rows: [string, string | number][] = [[T.hp, d.hp], [T.wallDmg, d.wall >= 99 ? T.breach : d.wall]];
  if (d.armor) rows.push([T.armor, d.armor]);
  rows.push([T.seenKilled, `${seen ? t('codex.seenRuns', { n: seen }) : '—'} / ${t('codex.killedN', { n: kl })}`]);
  const fac = (L.terms.factions as Record<string, string>)[d.faction];
  sheetOpen(`<div class="sh" role="dialog" aria-label="${d.n}"><div class="sh-top"><img class="ricon big cx-big" src="${spr(d.spr).url}" alt="" style="--gc:${d.col || '#888'}">
    <div><h3 style="color:${d.col || '#fff'}">${d.n}</h3><div class="tags"><span class="tag">${(L.meta.foeGroups as string[])[foeGroup(k)]}</span>${fac && foeGroup(k) > 1 ? `<span class="tag">${fac}</span>` : ''}</div></div></div>
    ${d.tip ? `<p>${d.tip}</p>` : `<p class="muted2">${d.small ? T.smallFoe : T.minion}</p>`}
    <div class="rules res">${rows.map((r) => `<div><span>${r[0]}</span><i style="margin-left:auto">${r[1]}</i></div>`).join('')}</div>
    ${d.intents ? `<div class="hs-h">${T.moves}</div><div class="tlist">${d.intents.map((it) => `<div class="trow" style="--gc:${d.col || '#888'}"><div><b>${it.n}</b><span>${it.d}</span></div></div>`).join('')}</div>` : ''}
    ${d.intro && typeof d.intro[1] === 'string' ? `<p class="flav"><em>“${d.intro[1]}”</em></p>` : ''}
    <div class="sh-btns"><button class="btn" id="cxBack">${T.backCodex}</button><button class="btn" id="cdxClose">${L.ui.sheet.close}</button></div></div>`);
  $('#cxBack').onclick = () => cxFoes();
  $('#cdxClose').onclick = closeSheet;
}
