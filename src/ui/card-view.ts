/* 卡牌的 DOM：卡面、棋盘/背包里的位置、卡面数字 / card DOM: the face, its board/bag position, the face numbers */
import { ITEMS, ADJ, TIERS, TAGC } from '../data/cards';
import { t } from '../i18n';
import { pct } from '../core/util';
import { G, type Card, type CardSpec, type Zone } from '../game/state';
import { recalcMods } from '../game/mods';
import { cardName } from '../game/text';
import { stepOf, chargeAmt, buffAmt, maxAmmo, stats, zoneN } from '../game/cards';
import { B } from '../sim/battle';
import { spr } from '../render/sprites';
import { $, $$ } from './dom';

/** 卡宽（每格）和卡高，随屏幕算 / card width (per slot) and height, computed from the screen */
export const LAYOUT = { cw: 46, ch: 90 };

const els = new Map<Card, HTMLElement>();
export const elOf = (c: Card | null | undefined) => (c ? els.get(c) : undefined);

/** 卡面右下的小数字：伤害，或者辅助卡的效果 / the small number at the card's bottom-right: damage, or a support card's effect */
const NUM_TEXT: Record<string, (c: Card) => string> = {
  anvil: (c) => pct(buffAmt(c)),
  bloodrage: (c) => pct(buffAmt(c)),
  toolbox: (c) => pct(buffAmt(c)),
  windup: () => t('card.haste'),
  wardrum: () => t('card.haste'),
  wickcut: () => t('card.haste'),
  pocketwatch: () => t('card.haste'),
  oilpot: () => t('card.reload'),
  armorer: () => t('card.reload'),
  alarmbell: () => '+5%',
  oiltrap: () => t('card.detonate'),
  flagpole: (c) => pct(0.15 + 0.05 * stepOf(c)),
  jars: () => '-6%',
};

export function numText(c: Card) {
  const it = ITEMS[c.key];
  if (NUM_TEXT[c.key]) return NUM_TEXT[c.key](c);
  if (it.charge) return '+' + Math.round(chargeAmt(c) * 100) + '%';
  if (it.buff) return '+50%';
  if (it.prism) return '+25%';
  if (it.chargeSmall) return '+' + Math.round(it.chargeSmall * (1 + 0.25 * stepOf(c)) * 100) + '%';
  if (it.horn) return t('card.horn');
  if (it.chargeCarry) return '+' + Math.round(it.chargeCarry * (1 + 0.2 * stepOf(c)) * 100) + '%';
  if (it.buffCarry) return '+' + Math.round(it.buffCarry * (1 + 0.2 * stepOf(c)) * 100) + '%';
  if (it.auraNb) return '+' + Math.round(it.auraNb * 100) + '%';
  if (it.shieldGain) return t('card.shield', { n: Math.round(it.shieldGain * (1 + 0.4 * stepOf(c))) });
  const v = Math.round(stats(c, null).total);
  return v >= 10000 ? (v / 1000).toFixed(1) + 'k' : String(v);
}

function cardHTML(c: CardSpec) {
  const it = ITEMS[c.key];
  const ad = c.adj ? ADJ[c.adj] : null;
  const nm = cardName(c);
  return `<div class="inner" style="--dl:${c.dl || 0}s"><div class="face"><div class="band"></div><div class="nm${nm.length > (c.size > 1 ? 5 : 3) ? ' long' : ''}">${nm}</div><img class="spr" src="${spr(c.key).url}" alt="${it.n}" draggable="false"><div class="num"></div>${it.ammo != null ? '<div class="am"></div>' : ''}<div class="cdv"></div><div class="holo"></div><div class="flash"></div></div><div class="tb">${TIERS[c.tier].n}</div>${ad ? `<div class="adj">${ad.ch}</div>` : ''}${(c as Card).carry ? `<div class="cw" title="${t('card.carry')}">C</div>` : ''}</div>`;
}

export function paintCard(el: HTMLElement, c: CardSpec | Card, extra?: string) {
  const it = ITEMS[c.key];
  const ad = c.adj ? ADJ[c.adj] : null;
  const T = TIERS[c.tier];
  el.className = 'card s' + c.size + ' t' + c.tier + (ad && ad.r === 2 ? ' rare' : '') + ((c as Card).carry ? ' carry' : '') + (extra ? ' ' + extra : '');
  el.style.setProperty('--sz', String(c.size));
  el.style.setProperty('--tagc', TAGC[it.tag]);
  el.style.setProperty('--ac', ad ? ad.c : 'transparent');
  el.style.setProperty('--tc', T.c);
  el.style.setProperty('--tbg', T.bg);
  el.innerHTML = cardHTML(c);
  setNum(el, c as Card);
  if (it.ammo != null) {
    const a = el.querySelector('.am');
    if (a) a.textContent = t('card.ammo', { n: (c as Card).ammo != null && G.phase === 'battle' ? (c as Card).ammo! : maxAmmo(c)! });
  }
}

export function setNum(el: HTMLElement | undefined, c: Card) {
  const n = el?.querySelector('.num');
  if (!n) return;
  const s = numText(c);
  n.textContent = s;
  n.classList.toggle('txt', /[^\x00-\x7f]/.test(s));
}

/** 弹药数显示；打空了卡面变灰 / ammo counter; the face greys out when empty */
export function setAmmo(c: Card) {
  const el = elOf(c);
  if (!el) return;
  const a = el.querySelector('.am');
  if (!a) return;
  const v = B && G.phase === 'battle' ? c.ammo : maxAmmo(c);
  a.textContent = t('card.ammo', { n: v! });
  el.classList.toggle('empty', v === 0);
}

let bind: (c: Card, el: HTMLElement) => void = () => {};
/** 由拖拽模块注册：卡牌元素按下时开始拖 / registered by the drag module: start dragging on pointer down */
export const setCardBinder = (f: (c: Card, el: HTMLElement) => void) => {
  bind = f;
};

const slotX = (i: number) => 4 + i * LAYOUT.cw + 2 + 'px';

/** 把 G.cards 同步到棋盘和背包 / sync G.cards to the board and bag */
export function renderOwned() {
  recalcMods();
  for (const [c, el] of els)
    if (!G.cards.includes(c)) {
      el.remove();
      els.delete(c);
    }
  for (const c of G.cards) {
    let el = els.get(c);
    if (!el) {
      el = document.createElement('div');
      paintCard(el, c);
      els.set(c, el);
      bind(c, el);
    }
    const parent = c.loc === 'board' ? $('#board') : $('#stash');
    if (el.parentNode !== parent) parent.appendChild(el);
    el.style.left = slotX(c.idx);
  }
  for (const c of G.cards) setNum(els.get(c), c);
  afterRender();
}
let afterRender = () => {};
export const setAfterRender = (f: () => void) => {
  afterRender = f;
};

export function repaint(c: Card) {
  const el = els.get(c);
  if (el) paintCard(el, c, el.classList.contains('frozen') ? 'frozen' : '');
}

/** 换局时清掉所有卡牌元素 / clear all card elements between runs */
export function clearCardEls() {
  for (const el of els.values()) el.remove();
  els.clear();
}

export function resetSlots() {
  for (const c of G.cards) {
    const el = els.get(c);
    if (el && (c.loc === 'board' || c.loc === 'stash')) el.style.left = slotX(c.idx);
  }
}
export const moveEl = (c: Card, i: number) => {
  const el = els.get(c);
  if (el) el.style.left = slotX(i);
};

export function buildCells() {
  for (const z of ['board', 'stash'] as Zone[]) {
    const el = $('#' + z);
    $$('.cell', el).forEach((x) => x.remove());
    for (let i = 0; i < zoneN(z); i++) {
      const d = document.createElement('div');
      d.className = 'cell';
      d.dataset.i = String(i);
      d.style.left = slotX(i);
      el.insertBefore(d, el.firstChild);
    }
  }
}
export const cells = (z: Zone) => $$('.cell', $('#' + z)).sort((a, b) => +a.dataset.i! - +b.dataset.i!);

/** 战斗中卡面的冷却遮罩 / the cooldown overlay on card faces during battle */
export function paintCharges() {
  for (const c of G.cards) {
    if (c.loc !== 'board') continue;
    const el = els.get(c);
    if (el) el.style.setProperty('--s', (1 - Math.min(1, c.charge)).toFixed(3));
  }
}
export function clearCharges() {
  for (const el of els.values()) el.style.setProperty('--s', '0');
}
