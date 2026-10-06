/* 战报：每张卡打了多少、被谁触发、帮队友干了什么；城破时谁漏过去最多 / Battle report: damage per card, what triggered it, how it helped allies; on breach, who leaked through most */
import { ITEMS, TAGC, ADJ } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import { EN } from '../data/enemies';
import { L, t } from '../i18n';
import { fmt } from '../core/util';
import { G, type Card, type RepSnap } from '../game/state';
import { pickLine } from '../game/text';
import { CARD_HOOKS, passiveSrc } from '../sim/hooks';
import { RXC } from '../sim/combo';
import type { Battle } from '../sim/types';
import { spr } from '../render/sprites';
import { FX } from '../render/overlay';
import { SFX } from '../audio/sfx';
import { $, $$ } from './dom';
import { tipOnce } from './hud';

/** 辅助卡这一场帮了多少忙 / how much a support card helped in this fight */
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
  const sp = splitLine(c);
  if (sp) out.push(sp);
  return out.length ? `<small class="rp-src">${out.join('　')}</small>` : '';
}


/* ---------------- 伤害来源 ---------------- / ---------------- Damage by source ---------------- */
const KC: Record<string, string> = { hit: '#ffd166', crit: '#ff5a5a', chain: '#e0c8ff', aoe: '#dfe6ee', rx: '#9ad8ff', burn: '#ef7d57', poison: '#7ddc5f', det: '#ff7a2a', ovk: '#ff8a7a', boomer: '#dfe6ee', zone: '#73eff7', fx: '#8ff0c8', foe: '#9fb3ba' };
const cut = (k: string) => {
  const i = k.indexOf('.');
  return i < 0 ? [k, ''] : [k.slice(0, i), k.slice(i + 1)];
};
function srcColor(k: string) {
  const [p, x] = cut(k);
  if (p === 'rx') return (RXC as Record<string, string>)[x] || KC.rx;
  if (p === 'ult') return (TAGC as Record<string, string>)[x] || KC.hit;
  if (p === 'adj') return (ADJ[x]?.tag && (TAGC as Record<string, string>)[ADJ[x].tag!]) || KC.hit;
  if (p === 'relic' || p === 't') return '#c9a0ff';
  return KC[k] || '#9fb3ba';
}
/** 来源的名字 / a source's display name */
export function srcName(k: string) {
  const [p, x] = cut(k);
  if (p === 'rx' && x) return t('report.srcRx', { n: (L.ui.battle.rx as Record<string, string>)[x] || x });
  if (p === 'ult') return ((L.ui.battle.streak as Record<string, string>)[x] || x).replace(/\s*·\s*/, '·');
  if (p === 'adj') return t('report.srcAdj', { n: ADJ[x]?.n || x });
  if (p === 'relic') return t('report.srcRelic', { n: RELICS[x]?.n || x });
  if (p === 't') return t('report.srcTalent', { n: TALENTS[x]?.n || x });
  return L.ui.report.src[k] || k;
}
type SrcRow = { k: string; n: number; cards: [string, number][] };
/** 「来源|卡牌」→ 按来源合并、从大到小，每个来源下列出出力的卡 / 'source|card' → merged by source, largest first, each with the cards that dealt it */
export function groupSrc(by: Record<string, number> | undefined) {
  const m = new Map<string, SrcRow>();
  let total = 0;
  for (const key in by || {}) {
    const v = by![key];
    if (!(v > 0)) continue;
    const i = key.lastIndexOf('|');
    const k = key.slice(0, i),
      card = key.slice(i + 1);
    let r = m.get(k);
    if (!r) m.set(k, (r = { k, n: 0, cards: [] }));
    r.n += v;
    total += v;
    if (card && ITEMS[card]) r.cards.push([card, v]);
  }
  const rows = [...m.values()].sort((a, z) => z.n - a.n);
  for (const r of rows) r.cards.sort((a, z) => z[1] - a[1]);
  return { rows, total };
}
const pct = (v: number, of: number) => {
  const p = (v / Math.max(1, of)) * 100;
  return p >= 10 ? Math.round(p) + '%' : p >= 1 ? p.toFixed(1) + '%' : '&lt;1%';
};
/** 战报里的来源面板 / the by-source panel in the report */
function srcList(by: Record<string, number> | undefined) {
  const T = L.ui.report;
  const { rows, total } = groupSrc(by);
  if (!rows.length) return `<div class="rp-meta">${T.srcNone}</div>`;
  const mx = rows[0].n;
  return (
    `<div class="rs-total">${t('report.srcTotal', { n: fmt(Math.round(total)) })}</div>` +
    rows
      .map(
        (r, i) =>
          `<div class="rs-row" style="animation-delay:${i * 0.05}s;--tagc:${srcColor(r.k)}"><span>${srcName(r.k)}</span><div class="bar"><i data-w="${((r.n / mx) * 100).toFixed(1)}"></i></div><b>${fmt(Math.round(r.n))}<small>${pct(r.n, total)}</small></b>${
            r.cards.length
              ? `<small class="rs-cards">${r.cards
                  .slice(0, 4)
                  .map(([k, v]) => `<span><img src="${spr(k).url}" alt="">${ITEMS[k].n} ${fmt(Math.round(v))}</span>`)
                  .join('')}</small>`
              : ''
          }</div>`,
      )
      .join('')
  );
}
/** 一张卡的伤害由哪些来源组成（只有一种普通命中就不写） / which sources a card's damage came from (omitted when it is all normal hits) */
function splitLine(c: Card) {
  const by = c.bBy || {};
  const tot = Object.keys(by).reduce((s, k) => s + (by[k] > 0 ? by[k] : 0), 0);
  const ks = Object.keys(by).filter((k) => by[k] >= tot * 0.01 && by[k] > 0).sort((a, z) => by[z] - by[a]);
  if (!ks.length || (ks.length === 1 && ks[0] === 'hit')) return '';
  return L.ui.report.split + ks.slice(0, 4).map((k) => `<span style="color:${srcColor(k)}">${srcName(k)}</span> ${pct(by[k], tot)}`).join(L.ui.report.sep);
}
/** 结局页的整局来源 / the whole-run sources on the ending screen */
export function runSrcBlock() {
  const { rows, total } = groupSrc(G.run?.dmgBy);
  if (!rows.length) return '';
  return `<div class="rules res dmgsrc"><div><span>${L.ui.end.dmgSrc}</span><i style="margin-left:auto">${fmt(Math.round(total))}</i></div>${rows
    .slice(0, 8)
    .map(
      (r) =>
        `<div><span style="color:${srcColor(r.k)}">${srcName(r.k)}</span>${r.cards[0] ? `<small>${ITEMS[r.cards[0][0]].n}</small>` : ''}<i style="margin-left:auto">${fmt(Math.round(r.n))} · ${pct(r.n, total)}</i></div>`,
    )
    .join('')}</div>`;
}
let tab = 'card';

export type Row = [string, number, number?, string?];

/** 和上一夜对照：同名卡按伤害高低一一配对（合成、升档也算同一张），配不上的是新上场的；上夜有、这夜没出手的另列一行
 * compare with last night: same-name cards pair up by damage rank (merges and upgrades count as the same card); unpaired ones are new; cards that played last night but not tonight get their own line */
function pairPrev(bc: Card[], prev: RepSnap | undefined) {
  /* 认不出的卡（老存档里改名或删掉的）不参与对照，不然战报报错、整局卡住 / unknown cards (renamed or removed in old saves) are left out, or the report throws and the run freezes */
  const left = prev ? prev.cards.filter((p) => ITEMS[p.key]).sort((a, z) => z.dmg - a.dmg) : [];
  const got = new Map<Card, RepSnap['cards'][number] | null>();
  for (const c of bc) {
    const i = left.findIndex((p) => p.key === c.key);
    got.set(c, i >= 0 ? left.splice(i, 1)[0] : null);
  }
  return { got, gone: left.filter((p) => p.dmg > 0 || p.trig > 0) };
}
function deltaCell(now: number, was: number | undefined, isNew: boolean) {
  const T = L.ui.report;
  if (isNew) return `<i class="rp-dl new">${T.isNew}</i>`;
  if (was === undefined) return '<i class="rp-dl"></i>';
  if (!was && !now) return '<i class="rp-dl"></i>';
  const d = was ? (now - was) / was : 1;
  const cls = d > 0.05 ? 'up' : d < -0.05 ? 'down' : '';
  const v = !was ? '' : Math.abs(d) < 0.05 ? '≈' : (d > 0 ? '▲' : '▼') + Math.min(999, Math.round(Math.abs(d) * 100)) + '%';
  return `<i class="rp-dl ${cls}"><small>${fmt(was)}</small>${v}</i>`;
}
const vsMeta = (now: number, was: number | undefined) => (was === undefined ? '' : `<small>${now > was ? '▲' : now < was ? '▼' : ''}${fmt(was)}</small>`);

/** 守住一夜的战报，点「收下」后回调 / the report after holding a night; the callback runs when 'Collect' is tapped */
export function showReport(b: Battle, was: number, rows: Row[], total: number, onCash: () => void) {
  const T = L.ui.report;
  const rp = $('#report');
  const bc = G.cards
    .filter((c) => c.bTrig > 0 || c.bDmg > 0 || supOf(c) || (c.loc === 'board' && ITEMS[c.key].passive))
    .sort((a, z) => z.bDmg - a.bDmg);
  const mx = Math.max(1, ...bc.map((c) => c.bDmg));
  const prev = G.run?.prevRep && G.run.prevRep.r === was - 1 ? G.run.prevRep : undefined;
  const { got, gone } = pairPrev(bc, prev);
  rp.innerHTML = `<div class="rp-title win">${t('report.title', { r: was, s: pickLine(L.story.report.win) })}</div>
  <div class="rp-tabs">${(['card', 'night', 'run'] as const).map((k) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${k === 'card' ? T.tabCards : k === 'night' ? T.tabNight : T.tabRun}</button>`).join('')}</div>
  ${prev ? `<div class="rp-legend" data-for="card">${t('report.vs', { r: prev.r })}</div>` : ''}
  <div class="rp-list rs-list" data-for="night">${srcList(b.dmgBy)}</div>
  <div class="rp-list rs-list" data-for="run">${srcList(G.run?.dmgBy)}</div>
  <div class="rp-list" data-for="card">${
    bc
      .map(
        (c, i) =>
          `<div class="rp-row" style="animation-delay:${i * 0.07}s;--tagc:${TAGC[ITEMS[c.key].tag]}"><img src="${spr(c.key).url}" alt=""><span>${ITEMS[c.key].n}</span><div class="bar"><i data-w="${((c.bDmg / mx) * 100).toFixed(1)}"></i></div><b>${c.bDmg ? fmt(c.bDmg) : supOf(c) ? `<em>${T.support}</em>` : ITEMS[c.key].passive ? `<em>${T.passive}</em>` : '0'}<small>×${c.bTrig}</small></b>${prev ? deltaCell(c.bDmg, got.get(c)?.dmg, !got.get(c)) : ''}${srcLine(c)}</div>`,
      )
      .join('') || `<div class="rp-meta">${T.nobody}</div>`
  }${
    gone.length
      ? `<div class="rp-gone">${T.gone}${gone.map((p) => `<span><img src="${spr(p.key).url}" alt="">${ITEMS[p.key].n} ${fmt(p.dmg)}</span>`).join('')}</div>`
      : ''
  }</div>
  <div class="rp-meta">${(was + 1) % 2 === 1 ? `<b style="color:#ffd166">${T.talkTomorrow}</b>　` : ''}${t('report.meta', {
    c: (b.maxChain || 1) + vsMeta(b.maxChain || 1, prev?.chain),
    k: b.kills + vsMeta(b.kills, prev?.kills),
    cb: b.maxCombo + vsMeta(b.maxCombo, prev?.combo),
    w: Math.ceil(b.wallLost) + vsMeta(Math.ceil(b.wallLost), prev?.wall),
  })}</div>
  <div class="rp-cash" id="cash"></div>
  <button class="btn gold big" id="cashBtn" style="flex:none">${T.take} <img class="ico" src="${spr('coin').url}" alt=""><b>${total}</b></button>`;
  rp.hidden = false;
  rp.classList.toggle('vs', !!prev);
  if (G.run)
    G.run.prevRep = {
      r: was,
      cards: bc.map((c) => ({ key: c.key, tier: c.tier, dmg: Math.round(c.bDmg), trig: c.bTrig })),
      kills: b.kills,
      chain: b.maxChain || 1,
      combo: b.maxCombo,
      wall: Math.ceil(b.wallLost),
    };
  const show = (k: string) => {
    tab = k;
    $$('[data-for]', rp).forEach((x) => (x.hidden = x.dataset.for !== k));
    $$('.rp-tabs button', rp).forEach((x) => x.classList.toggle('on', x.dataset.tab === k));
  };
  show(tab);
  $$('.rp-tabs button', rp).forEach((x) => (x.onclick = () => (SFX.play('ui'), show(x.dataset.tab!))));
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

/** 输了：看看是谁漏过去的 / lost: see who leaked through */
export function loseNote(b: Battle | null) {
  if (!b || !b.wallBy) return '';
  const wb = b.wallBy;
  const ks = Object.keys(wb).sort((a, z) => wb[z] - wb[a]);
  if (!ks.length) return '';
  const d = EN[ks[0]];
  return `<div class="rules res lose-why"><div><span>${L.ui.report.leaked}</span><i style="margin-left:auto">${t('report.leakedV', { n: d.n, w: Math.ceil(wb[ks[0]]) })}</i></div>${d.tip ? `<div><span class="lw">${d.tip}</span></div>` : ''}</div>`;
}
