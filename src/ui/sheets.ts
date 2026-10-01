/* 底部弹层：卡牌详情、遗物、天赋、羁绊、成就 */
import { ITEMS, ADJ, TIERS, TAGC, GT, UPS } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS, TCAT } from '../data/talents';
import { HEROES } from '../data/heroes';
import { ACH, SYN, SECRET_N } from '../data/meta';
import { L, t } from '../i18n';
import type { Tag } from '../data/types';
import { G, type Card, type Offer } from '../game/state';
import { M } from '../game/mods';
import { stats, chainOf, chargeAmt, buffAmt, maxAmmo, questN, sellValue } from '../game/cards';
import { META, achCount } from '../game/meta';
import { synCount } from '../game/synergy';
import { modText, plainMods } from '../game/text';
import { icon, spr } from '../render/sprites';
import { SFX } from '../audio/sfx';
import { $ } from './dom';
import { paintCard } from './card-view';
import { supOf } from './report';

export type SheetSrc = { kind: 'own'; card: Card; el?: HTMLElement } | { kind: 'shop' | 'codex'; offer: Offer; el?: HTMLElement };

/** 买 / 卖按钮的动作由备战流程注册 */
export const sheetActions = {
  buy: (_o: Offer) => false as boolean,
  sell: (_c: Card) => {},
};

export function closeSheet() {
  $('#sheet').hidden = true;
}

/** 打开一个盖在上层的弹层（图鉴、成就这类从标题页打开的） */
export function sheetOpen(html: string) {
  const sh = $('#sheet');
  sh.classList.add('top');
  sh.innerHTML = html;
  sh.hidden = false;
  sh.onclick = (e) => {
    if (e.target === sh) closeSheet();
  };
  return sh;
}
function show(html: string) {
  const sh = $('#sheet');
  sh.innerHTML = html;
  sh.hidden = false;
  sh.onclick = (e) => {
    if (e.target === sh) closeSheet();
  };
  return sh;
}

/** 描述里出现【关键词】时附上解释 */
export function kwBox(d: string) {
  const KW = L.terms.kw as Record<string, string>;
  const ks = Object.keys(KW).filter((k) => d.includes('【' + k));
  return ks.length ? `<div class="kwbox">${ks.map((k) => `<div><b>${k}</b><span>${KW[k]}</span></div>`).join('')}</div>` : '';
}

/* ---------------- 卡牌详情 ---------------- */
export function openSheet(src: SheetSrc) {
  const own = src.kind === 'own';
  const c = (own ? src.card : src.offer.card) as Card;
  const it = ITEMS[c.key];
  const ad = c.adj ? ADJ[c.adj] : null;
  const T = TIERS[c.tier];
  const st = stats(c, null);
  const S = L.ui.sheet;
  SFX.play('ui');
  let rows = '';
  const row = (a: string, b: string) => `<div><span>${a}</span><span>${b}</span></div>`;
  if (it.dmg > 0) {
    let f = '(' + st.base + (st.flat ? ' + ' + ADJ.sharp.n + st.flat : '') + ')';
    if (st.psum) f += ' × (1 + ' + st.pct.map((p) => p[0] + ' ' + Math.round(p[1] * 100) + '%').join(' + ') + ')';
    if (st.mult > 1) f += ' × ' + ADJ.deadly.n + '1.5';
    /* 没有加成时算式就是它自己，不单占一行 */
    rows += row(S.dmg, String(Math.round(st.total))) + (st.flat || st.psum || st.mult > 1 ? `<div><span></span><span class="f">${f}</span></div>` : '');
    rows += row(S.crit, t('sheet.critV', { n: Math.round(st.crit * 100) }));
    if (it.chain) rows += row(S.chain, String(chainOf(c)));
    if (it.multi) rows += row(S.multi, t('sheet.multiV', { n: it.multi }));
  } else if (it.charge) rows += row(S.chargeNb, '+' + Math.round(chargeAmt(c) * 100) + '%');
  else if (it.buff) rows += row(S.buffNb, t('sheet.buffV', { n: Math.round(buffAmt(c) * 100) }));
  if (it.ammo != null) rows += row(S.ammo, t('sheet.ammoV', { n: maxAmmo(c)! }));
  if (c.grow) rows += row(S.grow, t('sheet.growV', { n: Math.round(c.grow * 10) / 10 }));
  if (it.quest) rows += row(S.quest, `${it.questT} ${Math.min(c.qp || 0, questN(c))} / ${questN(c)}`);
  rows += it.passive
    ? row(S.cd, `${S.none} <small style="color:var(--muted)">${S.passiveNote}</small>`)
    : row(S.cd, `${st.cd.toFixed(2)}s${Math.abs(st.cd - st.cdRaw) > 0.01 ? ` <small style="color:var(--muted)">${t('sheet.cdRaw', { n: st.cdRaw.toFixed(1) })}</small>` : ''}`);
  if (c.tier < 3) {
    const nx = Object.assign({}, c, { tier: c.tier + 1 });
    const b = stats(nx, null);
    rows += row(t('sheet.upTo', { t: TIERS[c.tier + 1].n }), `${it.dmg ? t('sheet.dmgV', { n: Math.round(b.total) }) + ' · ' : ''}${t('sheet.cdV', { n: b.cd.toFixed(2) })}`);
  }
  if (own && c.bTrig) rows += row(S.lastNight, t('sheet.lastNightV', { d: Math.round(c.bDmg), n: c.bTrig }));
  if (own && c.bSrc && supOf(c)) rows += row(S.lastSupport, supOf(c));
  if (own) rows += row(S.sell, String(sellValue(c)));
  const sizeN = L.terms.sizes[c.size];
  show(`<div class="sh" role="dialog" aria-label="${it.n}"><div class="sh-top"><div id="shCard"></div><div><h3>${ad ? `<span style="color:${ad.c}">${t('sheet.adjOf', { a: ad.n })}</span>` : ''}${c.tier >= 3 && it.dn ? `<span class="dn">「${it.dn}」</span><small class="bn">${it.n}</small>` : it.n}</h3>
    <div class="tags"><span class="tag" style="background:${T.c}33;color:${T.c}">${t('sheet.tierTag', { t: T.n })}</span><span class="tag" style="background:${TAGC[it.tag]}33;color:${TAGC[it.tag]}">${L.terms.tags[it.tag]}</span>${it.kind ? `<span class="tag">${L.terms.kinds[it.kind]}</span>` : ''}<span class="tag">${t('sheet.sizeTag', { s: sizeN, n: c.size })}</span></div>
    <p>${it.d}<br><small style="color:var(--muted)">${UPS[it.up].t}</small></p></div></div>
    <p class="flav">“${it.f}”</p>
    ${it.lore ? (c.tier >= 2 ? `<div class="lore${c.tier >= 3 ? ' dia' : ''}"><small>${S.lore}</small><p>${it.lore}</p>${c.tier >= 3 ? `<p class="dl">—— ${it.dl}</p>` : ''}</div>` : `<div class="lore locked"><small>${S.lore}</small><p>${S.loreLocked}</p></div>`) : ''}
    ${ad ? `<div class="adjbox" style="--ac:${ad.c}"><b>${ad.n}</b><span>${ad.d}</span></div>` : ''}
    ${kwBox(it.d)}
    <div class="stat">${rows}</div>
    <div class="sh-btns" id="shBtns"></div></div>`);
  const ce = document.createElement('div');
  paintCard(ce, c, 'static');
  $('#shCard').appendChild(ce);
  const bt = $('#shBtns');
  const mk = (txt: string, cls: string, fn: () => void) => {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.innerHTML = txt;
    b.onclick = fn;
    bt.appendChild(b);
  };
  if (!own && src.kind === 'shop' && G.phase === 'prep' && !src.offer.sold)
    mk(src.offer.price ? `${S.buy} <img class="ico" src="${spr('coin').url}" alt=""><b>${src.offer.price}</b>` : S.takeFree, 'gold', () => {
      if (sheetActions.buy(src.offer)) closeSheet();
    });
  if (own && G.phase === 'prep')
    mk(t('sheet.sellBtn', { n: sellValue(c) }), 'red', () => {
      sheetActions.sell(c);
      closeSheet();
    });
  mk(S.close, '', closeSheet);
}

/* ---------------- 遗物 ---------------- */
export function openRelicSheet(r: string) {
  const R0 = RELICS[r];
  SFX.play('ui');
  const n = G.relics.filter((x) => x === r).length;
  const S = L.ui.sheet;
  const c = GT[R0.t].c;
  show(`<div class="sh" role="dialog" aria-label="${R0.n}"><div class="sh-top"><img class="ricon big" src="${icon(R0.ico).url}" alt="" style="--gc:${c}"><div><h3 style="color:${c}">${R0.n}${n > 1 ? ' ×' + n : ''}</h3><div class="tags"><span class="tag" style="background:${c}33;color:${c}">${t('sheet.relicGrade', { g: GT[R0.t].n })}</span><span class="tag">${R0.u ? S.unique : S.stackable}</span></div><p class="mods">${modText(R0.m)}</p></div></div><p class="flav">“${R0.f}”</p><div class="sh-btns"><button class="btn" id="rBack">${S.back}</button><button class="btn" id="rClose">${S.close}</button></div></div>`);
  $('#rClose').onclick = closeSheet;
  $('#rBack').onclick = openBag;
}

export function openBag() {
  SFX.play('ui');
  const S = L.ui.sheet;
  const cnt: Record<string, number> = {};
  G.relics.forEach((r) => (cnt[r] = (cnt[r] || 0) + 1));
  const ids = Object.keys(cnt).sort((a, b) => RELICS[b].t - RELICS[a].t);
  const sh = show(`<div class="sh" role="dialog" aria-label="${S.relics}"><h3>${S.relics} <small class="spn">${t('sheet.relicsN', { n: G.relics.length })}</small></h3>
    ${
      ids.length
        ? `<div class="tlist">${ids
            .map((r) => {
              const R0 = RELICS[r],
                c = GT[R0.t].c;
              return `<button class="trow relrow" data-r="${r}" style="--gc:${c}"><img class="ricon" src="${icon(R0.ico).url}" alt=""><div><b>${R0.n}${cnt[r] > 1 ? ' ×' + cnt[r] : ''}<small class="gt">${GT[R0.t].n}</small></b><span class="mods">${modText(R0.m)}</span></div></button>`;
            })
            .join('')}</div>
    <div class="stat"><div><span>${S.total}</span><span></span></div><div class="mods">${modText(M)}</div></div>`
        : `<p class="muted2">${S.noRelics}</p>`
    }
    <div class="sh-btns"><button class="btn" id="bClose">${S.close}</button></div></div>`);
  $('#bClose').onclick = closeSheet;
  sh.querySelectorAll<HTMLElement>('.relrow').forEach((el) => (el.onclick = () => openRelicSheet(el.dataset.r!)));
}

/* ---------------- 天赋 ---------------- */
export function talentText(id: string) {
  const T = TALENTS[id];
  return T.d || modText(T.m);
}
export function openTree() {
  const H = HEROES[G.hero];
  const S = L.ui.sheet;
  SFX.play('ui');
  show(`<div class="sh" role="dialog" aria-label="${S.talents}"><h3>${t('sheet.talentsOf', { h: H.n })} <small class="spn">${t('sheet.talentsN', { n: G.skills.length })}</small></h3>
   <p class="muted2">${S.talentsHow}</p>
   <div class="tlist">${
     G.skills.length
       ? G.skills
           .filter((id) => TALENTS[id])
           .map((id) => {
             const T = TALENTS[id],
               C = TCAT[T.cat];
             return `<div class="trow" style="--gc:${C.c}"><img class="ricon" src="${icon(C.ico).url}" alt=""><div><b>${T.n}<small class="gt">${C.n}</small></b>${talentText(id)}${T.say ? `<em>“${T.say}”</em>` : ''}</div></div>`;
           })
           .join('')
       : `<p class="muted2">${S.noTalents}</p>`
   }</div>
   <div class="sh-btns"><button class="btn" id="tClose">${S.close}</button></div></div>`);
  $('#tClose').onclick = closeSheet;
}

/* ---------------- 羁绊 ---------------- */
export function openSyn() {
  SFX.play('ui');
  const S = L.ui.sheet;
  const n = synCount();
  show(`<div class="sh" role="dialog" aria-label="${S.syn}"><h3>${S.syn}</h3><p class="muted2">${S.synHow}</p>
    <div class="tlist">${(Object.keys(SYN) as Tag[])
      .map(
        (tg) =>
          `<div class="trow" style="--gc:${TAGC[tg]}"><div><b>${t('sheet.synNow', { t: L.terms.tags[tg], n: n[tg] || 0 })}</b>${SYN[tg]
            .map(([k, m]) => `<span style="opacity:${(n[tg] || 0) >= k ? 1 : 0.45}">${t('sheet.synAt', { k })}${plainMods(m)}</span>`)
            .join('')}</div></div>`,
      )
      .join('')}</div>
    <div class="sh-btns"><button class="btn" id="yClose">${S.close}</button></div></div>`);
  $('#yClose').onclick = closeSheet;
}

/* ---------------- 成就 ---------------- */
export function openAch() {
  SFX.play('ui');
  const S = L.ui.sheet;
  sheetOpen(`<div class="sh" role="dialog" aria-label="${S.ach}"><h3>${S.ach} <small class="spn">${achCount()} / ${ACH.length}</small></h3>
    <p class="muted2">${t('sheet.achSum', { w: META.wins, h: META.heatMax })}</p>
    <p class="muted2">${t('sheet.secrets', { n: Object.keys(META.secrets).length, max: SECRET_N })}</p>
    <div class="tlist">${ACH.map((a) => {
      const got = META.ach[a.id];
      return `<div class="trow ach${got ? ' got' : ''}" style="--gc:${got ? '#ffd166' : '#56656b'}"><div><b>${got ? '★ ' : '☆ '}${a.n}</b><span>${a.d}</span></div></div>`;
    }).join('')}</div>
    <div class="sh-btns"><button class="btn" id="aClose">${S.close}</button></div></div>`);
  $('#aClose').onclick = closeSheet;
}

