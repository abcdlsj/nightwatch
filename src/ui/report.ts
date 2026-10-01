/* 战报：每张卡打了多少、被谁触发、帮队友干了什么；城破时谁漏过去最多 */
import { ITEMS, TAGC } from '../data/cards';
import { EN } from '../data/enemies';
import { L, t } from '../i18n';
import { fmt } from '../core/util';
import { G, type Card } from '../game/state';
import { pickLine } from '../game/text';
import { CARD_HOOKS, passiveSrc } from '../sim/hooks';
import type { Battle } from '../sim/types';
import { spr } from '../render/sprites';
import { FX } from '../render/overlay';
import { SFX } from '../audio/sfx';
import { $, $$ } from './dom';
import { tipOnce } from './hud';

/** 辅助卡这一场帮了多少忙 */
export function supOf(c: Card) {
  const T = L.ui.report;
  const s: string[] = [];
  if (c.bCh >= 1) s.push(t('report.supCharges', { n: Math.round(c.bCh) }));
  else if (c.bCh > 0.001) s.push(t('report.supCharge', { n: Math.round(c.bCh * 100) }));
  if (c.bHs > 0.05) s.push(t('report.supHaste', { n: c.bHs.toFixed(1) }));
  if (c.bRl) s.push(t('report.supReload', { n: c.bRl }));
  if (c.bBf) s.push(t('report.supBuff', { n: c.bBf }));
  if (c.bTr) s.push(t('report.supTrig', { n: c.bTr }));
  return s.join(T.sep);
}
function srcLine(c: Card) {
  const it = ITEMS[c.key];
  const T = L.ui.report;
  const src = c.bSrc || {};
  const ks = Object.keys(src).sort((a, b) => src[b] - src[a]);
  const out: string[] = [];
  if (ks.length && !(ks.length === 1 && ks[0] === T.cooldown)) out.push(T.trigBy + ks.map((k) => k + ' ' + src[k]).join(L.ui.common.comma));
  else if (it.passive && !ks.length) out.push(CARD_HOOKS[c.key]?.on ? t('report.passiveFires', { s: passiveSrc(c.key) }) : T.passiveAlways);
  const s = supOf(c);
  if (s) out.push(s);
  return out.length ? `<small class="rp-src">${out.join('　')}</small>` : '';
}

export type Row = [string, number, number?, string?];

/** 守住一夜的战报，点「收下」后回调 */
export function showReport(b: Battle, was: number, rows: Row[], total: number, onCash: () => void) {
  const T = L.ui.report;
  const rp = $('#report');
  const bc = G.cards
    .filter((c) => c.bTrig > 0 || c.bDmg > 0 || supOf(c) || (c.loc === 'board' && ITEMS[c.key].passive))
    .sort((a, z) => z.bDmg - a.bDmg);
  const mx = Math.max(1, ...bc.map((c) => c.bDmg));
  rp.innerHTML = `<div class="rp-title win">${t('report.title', { r: was, s: pickLine(L.story.report.win) })}</div>
  <div class="rp-list">${
    bc
      .map(
        (c, i) =>
          `<div class="rp-row" style="animation-delay:${i * 0.07}s;--tagc:${TAGC[ITEMS[c.key].tag]}"><img src="${spr(c.key).url}" alt=""><span>${ITEMS[c.key].n}</span><div class="bar"><i data-w="${((c.bDmg / mx) * 100).toFixed(1)}"></i></div><b>${c.bDmg ? fmt(c.bDmg) : supOf(c) ? `<em>${T.support}</em>` : ITEMS[c.key].passive ? `<em>${T.passive}</em>` : '0'}<small>×${c.bTrig}</small></b>${srcLine(c)}</div>`,
      )
      .join('') || `<div class="rp-meta">${T.nobody}</div>`
  }</div>
  <div class="rp-meta">${(was + 1) % 2 === 1 ? `<b style="color:#ffd166">${T.talkTomorrow}</b>　` : ''}${t('report.meta', { c: b.maxChain || 1, k: b.kills, cb: b.maxCombo, w: Math.ceil(b.wallLost) })}</div>
  <div class="rp-cash" id="cash"></div>
  <button class="btn gold big" id="cashBtn" style="flex:none">${T.take} <img class="ico" src="${spr('coin').url}" alt=""><b>${total}</b></button>`;
  rp.hidden = false;
  setTimeout(() => $$('.bar i', rp).forEach((i) => (i.style.width = i.dataset.w + '%')), 60);
  const cash = $('#cash');
  let i = 0;
  const next = () => {
    if (i < rows.length) {
      const r = rows[i];
      cash.insertAdjacentHTML('beforeend', `<div class="cash-row"><span>${r[0]}</span><b>${r[3] || (r[2] ? '+' + r[2] : '+' + r[1])}</b></div>`);
      SFX.play('coin');
      i++;
      setTimeout(next, 220);
    } else cash.insertAdjacentHTML('beforeend', `<div class="cash-row total"><span>${T.sum}</span><b>+${total}</b></div>`);
  };
  setTimeout(next, 400);
  tipOnce('report', L.ui.tips.report, 900);
  $('#cashBtn').onclick = () => {
    SFX.ensure();
    FX.coinsAt($('#cashBtn'), Math.min(total, 10), true);
    onCash();
  };
}

/** 输了：看看是谁漏过去的 */
export function loseNote(b: Battle | null) {
  if (!b || !b.wallBy) return '';
  const wb = b.wallBy;
  const ks = Object.keys(wb).sort((a, z) => wb[z] - wb[a]);
  if (!ks.length) return '';
  const d = EN[ks[0]];
  return `<div class="rules res lose-why"><div><span>${L.ui.report.leaked}</span><i style="margin-left:auto">${t('report.leakedV', { n: d.n, w: Math.ceil(wb[ks[0]]) })}</i></div>${d.tip ? `<div><span class="lw">${d.tip}</span></div>` : ''}</div>`;
}
