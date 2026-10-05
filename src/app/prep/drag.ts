/* 拖拽：把卡拖上棋盘（买）、在棋盘和背包之间挪、拖去卖、拖到同名卡上合成。
 * 同一时间只允许一次拖拽；抬手、取消、切后台、失焦都会收尾，保证幽灵卡一定被清掉。
 * 按下不动直接抬手 = 点击，打开详情。
 * Dragging: drag a card onto the board to buy it, move it between board and bag, drag it out to sell, or drop it on a same-name card to merge. Only one drag at a time; pointer up, cancel, backgrounding or blur all finish it so the ghost card is always cleaned up. Press and release without moving = a tap, which opens details.
 */
import { ITEMS } from '../../data/cards';
import { L, t } from '../../i18n';
import { clamp } from '../../core/util';
import { G, type Card, type CardSpec, type Offer, type Zone } from '../../game/state';
import { fits, occ, zoneN, sellValue } from '../../game/cards';
import { insertPlan } from '../../game/prep';
import { FX } from '../../render/overlay';
import { SFX } from '../../audio/sfx';
import { $, $$ } from '../../ui/dom';
import { LAYOUT, paintCard, cells, elOf, resetSlots, moveEl, renderOwned, setCardBinder } from '../../ui/card-view';
import { toast } from '../../ui/hud';
import { openSheet, type SheetSrc } from '../../ui/sheets';
import { setDrawer, UI_drawer } from './drawer';
import { acquire, canAfford, sellCard, afterChange } from './actions';

type Target =
  | { z: 'sell' }
  | { z: 'bag'; i: number; ok: boolean }
  | { z: 'merge'; card: Card }
  | { z: Zone; i: number; ok: boolean; moves?: [Card, number][] };

interface Drag {
  src: SheetSrc & { el: HTMLElement };
  pid: number;
  x0: number;
  y0: number;
  lx: number;
  tilt: number;
  started: boolean;
  tgt: Target | null;
  g?: HTMLElement;
  c?: CardSpec;
  own?: boolean;
  ox?: number;
  oy?: number;
  autoDrawer?: boolean;
}
let D: Drag | null = null;

function onDown(e: PointerEvent, src: Drag['src']) {
  if (e.button > 0) return;
  if (D) cancelDrag();
  SFX.ensure();
  e.preventDefault();
  D = { src, pid: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, tilt: 0, started: false, tgt: null };
  try {
    src.el.setPointerCapture(e.pointerId);
  } catch {
    /* 有的浏览器在合成事件上不给捕获 / some browsers do not give capture on composed events */
  }
}
export const startDragOffer = (e: PointerEvent, offer: Offer, el: HTMLElement) => onDown(e, { kind: 'shop', offer, el });

export function initDrag() {
  setCardBinder((c, el) => el.addEventListener('pointerdown', (e) => onDown(e, { kind: 'own', card: c, el })));
  addEventListener('pointermove', (e) => {
    if (!D || e.pointerId !== D.pid) return;
    if (!D.started) {
      if (G.phase === 'prep' && Math.hypot(e.clientX - D.x0, e.clientY - D.y0) > 7) startDrag();
      else return;
    }
    moveDrag(e);
  });
  addEventListener('pointerup', (e) => {
    if (!D || e.pointerId !== D.pid) return;
    const d = D;
    D = null;
    if (!d.started) {
      openSheet(d.src);
      return;
    }
    endDrag(d);
  });
  addEventListener('pointercancel', (e) => {
    if (D && e.pointerId === D.pid) cancelDrag();
  });
  addEventListener('blur', () => cancelDrag());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelDrag();
  });
}

export function cancelDrag() {
  const d = D;
  D = null;
  if (d && d.started) {
    d.tgt = null;
    endDrag(d);
  }
  sweepGhosts();
}
function sweepGhosts(keep?: HTMLElement) {
  $$('.card.ghost').forEach((g) => {
    if (g !== keep) g.remove();
  });
  $$('.card.lifted').forEach((el) => {
    if (!D || el !== D.src.el) el.classList.remove('lifted');
  });
}

function startDrag() {
  const d = D!;
  const src = d.src,
    el = src.el,
    own = src.kind === 'own';
  const c = own ? src.card : (src as any).offer.card;
  const r = el.getBoundingClientRect();
  sweepGhosts();
  const g = document.createElement('div');
  paintCard(g, c, 'ghost');
  g.style.width = c.size * LAYOUT.cw - 4 + 'px';
  g.style.height = LAYOUT.ch + 'px';
  d.ox = ((d.x0 - r.left) / r.width) * (c.size * LAYOUT.cw - 4);
  d.oy = ((d.y0 - r.top) / r.height) * LAYOUT.ch;
  document.body.appendChild(g);
  d.g = g;
  d.c = c;
  d.own = own;
  d.started = true;
  el.classList.add('lifted');
  if (own) {
    $('#sell').classList.add('armed');
    $('#sellTxt').innerHTML = t('prep.sellFor', { n: sellValue(c) });
  }
  markSyn(c, own ? c : null);
  SFX.play('pick');
  if (!UI_drawer()) {
    d.autoDrawer = true;
    setDrawer(true);
  }
}

function moveDrag(e: PointerEvent) {
  const d = D!;
  const x = e.clientX - d.ox!,
    y = e.clientY - d.oy!;
  const vx = e.clientX - d.lx;
  d.lx = e.clientX;
  d.tilt = d.tilt * 0.8 + clamp(vx * 1.4, -16, 16) * 0.2;
  d.g!.style.transform = `translate(${x}px,${y}px) rotate(${d.tilt.toFixed(1)}deg) scale(1.07)`;
  d.tgt = hitTest(e.clientX, e.clientY, x);
  showTgt(d.tgt);
}

const inside = (r: DOMRect, x: number, y: number, m = 0) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;

function hitTest(px: number, py: number, gx: number): Target | null {
  const d = D!;
  const c = d.c!,
    ig = d.own ? (c as Card) : null;
  const cw = LAYOUT.cw;
  if (d.own && inside($('#sell').getBoundingClientRect(), px, py, 6)) return { z: 'sell' };
  if (inside($('#bagBtn').getBoundingClientRect(), px, py, 6)) {
    let i = -1;
    for (let k = 0; k + c.size <= 4; k++)
      if (fits('stash', k, c.size, ig)) {
        i = k;
        break;
      }
    return { z: 'bag', i, ok: i >= 0 };
  }
  for (const z of ['board', 'stash'] as Zone[]) {
    const r = $('#' + z).getBoundingClientRect();
    if (!inside(r, px, py, 22)) continue;
    if (!d.own && c.tier < 3) {
      const o = occ(z);
      const under = o[clamp(Math.floor((px - r.left - 4) / cw), 0, zoneN(z) - 1)];
      if (under && under.key === c.key && under.tier === c.tier) return { z: 'merge', card: under };
    }
    const i = clamp(Math.round((gx - (r.left + 4)) / cw), 0, zoneN(z) - c.size);
    if (fits(z, i, c.size, ig)) return { z, i, ok: true, moves: [] };
    const pl = insertPlan(z, i, c.size, ig);
    return pl ? { z, i: pl.i, ok: true, moves: pl.moves } : { z, i, ok: false };
  }
  return null;
}

function clearTgt() {
  $$('.cell.ok,.cell.bad').forEach((x) => x.classList.remove('ok', 'bad'));
  $$('.card.mergeT,.card.nudge').forEach((x) => x.classList.remove('mergeT', 'nudge'));
  $('#sell').classList.remove('hot');
  $('#bagBtn').classList.remove('hot', 'bad');
  resetSlots();
}
function showTgt(tg: Target | null) {
  clearTgt();
  if (!tg) return;
  if (tg.z === 'sell') {
    $('#sell').classList.add('hot');
    return;
  }
  if (tg.z === 'bag') {
    $('#bagBtn').classList.add((tg as any).ok ? 'hot' : 'bad');
    return;
  }
  if (tg.z === 'merge') {
    elOf((tg as any).card)?.classList.add('mergeT');
    return;
  }
  const t2 = tg as { z: Zone; i: number; ok: boolean; moves?: [Card, number][] };
  if (t2.moves)
    for (const [o, p] of t2.moves) {
      moveEl(o, p);
      elOf(o)?.classList.add('nudge');
    }
  const cs = cells(t2.z);
  for (let i = t2.i; i < t2.i + D!.c!.size; i++) if (cs[i]) cs[i].classList.add(t2.ok ? 'ok' : 'bad');
}

/** 拖起来时，棋盘上放下去有协同的格子发光 / while dragging, glow the board slots that would gain synergy if dropped there */
function synergyAt(c: CardSpec, i: number, ignore: Card | null) {
  const o = occ('board').map((x) => (x === ignore ? null : x));
  const L0 = o[i - 1],
    R = o[i + c.size];
  const tag = ITEMS[c.key].tag;
  const good = (n: Card | null | undefined) => n && (ITEMS[n.key].tag === tag || n.adj === 'echo' || ITEMS[n.key].charge || ITEMS[n.key].buff);
  return good(L0) || good(R) || (L0 && L0.adj === 'ignite') || ((L0 || R) && (c.adj === 'echo' || ITEMS[c.key].charge || ITEMS[c.key].buff)) || (R && c.adj === 'ignite');
}
function markSyn(c: CardSpec, ignore: Card | null) {
  const cs = cells('board');
  for (let i = 0; i + c.size <= 8; i++) if (fits('board', i, c.size, ignore) && synergyAt(c, i, ignore)) cs[i].classList.add('syn');
}
const applyMoves = (tg: any) => {
  if (tg && tg.moves) for (const [o, p] of tg.moves) o.idx = p;
};

function endDrag(d: Drag) {
  let ok = false;
  try {
    clearTgt();
    $$('.cell.syn').forEach((x) => x.classList.remove('syn'));
    $('#sell').classList.remove('armed');
    $('#sellTxt').innerHTML = L.ui.prep.sellHere;
    const tg = d.tgt as any;
    const src = d.src as any;
    if (tg && G.phase === 'prep') {
      if (tg.z === 'sell' && d.own) {
        sellCard(src.card);
        afterChange();
        ok = true;
      } else if (tg.z === 'merge' && !d.own) ok = acquire(src.offer, 'merge');
      else if (tg.z === 'bag') {
        if (!tg.ok) {
          toast(L.ui.prep.bagFull);
          SFX.play('bad');
        } else if (d.own) {
          src.card.loc = 'stash';
          src.card.idx = tg.i;
          SFX.play('place');
          afterChange(src.card);
          ok = true;
        } else ok = acquire(src.offer, { z: 'stash', i: tg.i });
      } else if (tg.ok) {
        if (d.own) {
          applyMoves(tg);
          src.card.loc = tg.z;
          src.card.idx = tg.i;
          SFX.play('place');
          afterChange(src.card);
          ok = true;
        } else if (!src.offer.sold && canAfford(src.offer)) {
          const r = d.g!.getBoundingClientRect();
          applyMoves(tg);
          ok = acquire(src.offer, { z: tg.z, i: tg.i });
          if (ok) FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#ffd166', 14);
          else renderOwned();
        }
      } else if (tg.z === 'board' || tg.z === 'stash') {
        SFX.play('bad');
        toast(L.ui.prep.noFit);
      }
    }
  } finally {
    if (d.src.el) d.src.el.classList.remove('lifted');
    if (d.autoDrawer) setTimeout(() => setDrawer(false), ok ? 350 : 0);
    const g = d.g;
    if (g) {
      if (ok || !d.src.el || !d.src.el.isConnected) g.remove();
      else {
        const r = d.src.el.getBoundingClientRect();
        g.classList.add('back');
        g.style.transform = `translate(${r.left}px,${r.top}px) rotate(0deg) scale(1)`;
        setTimeout(() => g.remove(), 230);
      }
    }
  }
}
