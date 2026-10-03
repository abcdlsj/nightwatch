/* 出手、连锁、攻击方式、伤害结算、击杀 */
import { ITEMS, ADJ } from '../data/cards';
import { L } from '../i18n';
import { rand, rnd, vr, vrnd } from '../core/rng';
import { G, type Card } from '../game/state';
import { mv } from '../game/mods';
import { TUNE } from '../game/tuning';
import { boardCards, stepOf, dmgMul, chainOf, chargeAmt, buffAmt, maxAmmo, stats, comboMul, carryCard, type Stats } from '../game/cards';
import { unlock, codexKill } from '../game/meta';
import { world, K, ex, ey } from './world';
import { view } from './view';
import { B, bt, later, emit, front, phased, dist } from './battle';
import { spawn, comboKill } from './enemies';
import { react, was, streak } from './combo';
import type { Enemy, Projectile } from './types';

/* ---------------- 触发与连锁 ---------------- */
/** 这张卡现在能不能再触发（离上次触发够不够一个普朗克时间） */
export const canFire = (c: Card) => bt().t - c.lastFire >= TUNE.planck - 1e-9;

export function trigger(c: Card, depth: number, src?: string) {
  const b = bt();
  if (depth > 10 || b.over || c.ammo === 0 || !canFire(c)) return;
  c.lastFire = b.t;
  if (c.bSrc) {
    const k = src || L.ui.report.chained;
    c.bSrc[k] = (c.bSrc[k] || 0) + 1;
  }
  const times = c.adj === 'twin' ? 2 : 1;
  fire(c, depth);
  if (times > 1) later(0.08, () => fire(c, depth));
}

function fire(c: Card, depth: number) {
  const b = bt();
  if (b.over) return;
  const it = ITEMS[c.key];
  if (c.ammo === 0) return;
  c.bTrig++;
  view.cardFx(c, 'pop');
  view.sfx(it.snd || 'fire', it.tag);
  if (c.ammo! > 0) {
    c.ammo!--;
    view.cardAmmo(c);
    if (c.ammo === 0 && !b.flags.emptySaid) {
      b.flags.emptySaid = 1;
      view.say('hero', L.story.barks.empty, 1);
      view.tip('ammo', L.ui.tips.ammo);
    }
  }
  const st = stats(c, b.t);
  const nb = c.nb || [];
  streak(c, st);
  if (it.dmg > 0) {
    attack(c, st, depth);
    for (let i = 1; i < (it.multi || 1); i++)
      later(0.09 * i, () => {
        if (!B!.over) attack(c, st, depth);
      });
  }
  if (it.stack) c.stk += it.stack;
  if (it.charge) for (const n of nb) if (!it.chargeKind || ITEMS[n.key].kind === it.chargeKind) chargeCard(n, chargeAmt(c), c);
  if (it.reload) for (const n of nb) if (!reload(n, it.reload, c) && it.reloadElse) chargeCard(n, it.reloadElse * (1 + 0.25 * stepOf(c)), c);
  if (it.hasteNb) for (const n of nb) haste(n, it.hasteNb * (1 + 0.2 * stepOf(c)), c);
  if (it.hasteKind) for (const o of boardCards()) if (o !== c && ITEMS[o.key].kind === it.hasteKind.kind) haste(o, it.hasteKind.t * (1 + 0.2 * stepOf(c)), c);
  if (it.hasteSmall) for (const o of boardCards()) if (o !== c && o.size === 1) haste(o, it.hasteSmall, c);
  if (it.chargeAll)
    for (const o of boardCards())
      if (o !== c) {
        const a = it.chargeAll + 0.07 * stepOf(c);
        if (o.frozen <= 0) c.bCh += a;
        chargeCard(o, a, null);
      }
  if (it.chargeSmall) for (const o of boardCards()) if (o !== c && o.size === 1) chargeCard(o, it.chargeSmall * (1 + 0.25 * stepOf(c)) * (1 + mv('support')), c);
  if (it.buff) {
    const a = buffAmt(c);
    c.bBf += nb.length;
    for (const n of nb) {
      n.anvil = Math.max(n.anvil || 0, a);
      view.link(c, n, '#e3e9f0', 0.22);
    }
  }
  if (it.horn && depth < 10)
    for (const n of nb) {
      if (n.frozen > 0) continue;
      later(0.1, () => {
        if (B!.over) return;
        view.link(c, n, '#ffd166', 0.25);
        showChain(depth + 2);
        if (depth + 2 > B!.maxChain) B!.maxChain = depth + 2;
        c.bTr++;
        trigger(n, depth + 1, it.n);
      });
    }
  if (it.fuse) for (const o of boardCards()) if (o !== c && ITEMS[o.key].tag === it.fuse.tag) chargeCard(o, it.fuse.amt + 0.03 * stepOf(c), c);
  if (it.detonate) {
    let n = 0;
    for (const e of b.en) {
      if (e.dead || e.burnT <= 0) continue;
      n++;
      const amt = e.burnD * e.burnT;
      e.burnT = 0;
      e.burnD = 0;
      view.ring(ex(e), ey(e) - 8, 3, 34, '#ff7a2a', 0.45);
      hurt(e, amt, c, false, {});
    }
    if (n) {
      view.sfx('boom');
      view.shake(4);
    }
  }
  if (it.detonateP) {
    let n = 0;
    for (const e of b.en) {
      if (e.dead || e.poisonT <= 0) continue;
      n++;
      const amt = e.poisonD * e.poisonT;
      e.poisonT = 0;
      e.poisonD = 0;
      view.ring(ex(e), ey(e) - 8, 3, 34, '#7ddc5f', 0.45);
      hurt(e, amt, c, false, {});
    }
    if (n) {
      view.sfx('boom');
      view.shake(4);
    }
  }
  if (it.prism)
    for (const n of nb) {
      if (!['fire', 'ice', 'volt'].includes(ITEMS[n.key].tag)) continue;
      chargeCard(n, 0.25, c);
      n.anvil = Math.max(n.anvil || 0, 0.5);
      c.bBf++;
      view.link(c, n, '#73eff7', 0.25);
    }
  /* 为 C 位服务的辅助卡 */
  const cc = it.chargeCarry || it.buffCarry || it.hasteCarry || it.critCarry || it.freezeCarry ? carryCard() : null;
  if (cc && cc !== c) {
    if (it.chargeCarry) chargeCard(cc, it.chargeCarry * (1 + 0.2 * stepOf(c)), c);
    if (it.hasteCarry) haste(cc, it.hasteCarry * (1 + 0.2 * stepOf(c)), c);
    if (it.critCarry) {
      cc.sure = true;
      view.link(c, cc, '#fff4cf', 0.25);
    }
    if (it.freezeCarry) cc.frostNext = Math.max(cc.frostNext || 0, it.freezeCarry * (1 + 0.2 * stepOf(c)));
    if (it.buffCarry) {
      cc.anvil = Math.max(cc.anvil || 0, it.buffCarry * (1 + 0.2 * stepOf(c)));
      c.bBf++;
      view.link(c, cc, '#ffd166', 0.25);
    }
  }
  if (c.adj === 'ignite' && c.right) chargeCard(c.right, 0.1, c);
  if (it.shieldGain) {
    b.shield += it.shieldGain * (1 + 0.4 * stepOf(c));
    view.hud();
  }
  if (c.adj === 'sturdy') {
    b.shield += c.size * (c.tier + 1);
    view.hud();
  }
  if (c.adj === 'momentum') c.mom = Math.min(10, c.mom + 1);
  emit('use', { c, depth });
  for (const n of nb) {
    if (n.adj !== 'echo' || n.frozen > 0) continue;
    later(0.12, () => {
      const d = depth + 1;
      if (B!.over || d > 10) return;
      view.link(c, n, ADJ.echo.c);
      if (d + 1 > B!.maxChain) B!.maxChain = d + 1;
      showChain(d + 1);
      if (mv('shellChain') && (d + 1) % 5 === 0 && !(B!.flags.shellT > B!.t - 1)) {
        B!.flags.shellT = B!.t;
        B!.shield += 3;
        view.hud();
      }
      view.sfx('echo', d);
      trigger(n, d, ADJ.echo.n);
    });
  }
}

export function chargeCard(c: Card, amt: number, from?: Card | null) {
  if (c.frozen > 0) return;
  c.charge = Math.min(1.5, c.charge + amt);
  if (from && from !== c && from.bSrc) from.bCh += amt;
  if (from) view.link(from, c, '#ffa53b', 0.16);
  emit('charge', { c, from });
}

export function haste(c: Card, t: number, from?: Card | null) {
  if (c.frozen > 0) return;
  if (from && from !== c && from.bSrc) from.bHs += t;
  c.hasteT = Math.max(c.hasteT || 0, t);
  view.cardFlag(c, 'haste', true);
  if (from) view.link(from, c, '#8ff0c8', 0.2);
}

/** 装填：给弹药卡补 n 发。返回 false 表示这张不是弹药卡 */
export function reload(c: Card, n: number, from?: Card | null) {
  const m = maxAmmo(c);
  if (m == null) return false;
  if (c.ammo! >= m) return true;
  if (from && from.bSrc) from.bRl += Math.min(n, m - c.ammo!);
  c.ammo = Math.min(m, c.ammo! + n);
  view.cardAmmo(c);
  if (from) view.link(from, c, '#ffd166', 0.22);
  return true;
}

function showChain(n: number) {
  if (n < 2) return;
  if (n === 5 || n === 9) view.say('hero', L.story.barks.chain, 1);
  if (n >= 8) unlock('chain8');
  if (n >= 11) unlock('chain11');
  if (n % 5 === 0) emit('chain', { n });
  view.chain(n);
}

/* ---------------- 攻击方式 ---------------- */
type HitMods = { rx?: number; slow?: number; kb?: number; freeze?: number; vuln?: [number, number] | null; exec?: number; burnDur?: number; poisonDur?: number; burn?: number; poison?: number; pen?: number; splash?: number; burnTick?: number; poisonTick?: number };


function attack(c: Card, st: Stats, depth = 0) {
  const b = bt();
  const it = ITEMS[c.key];
  const t = front();
  if (!t) return;
  const crit = rand() < st.crit || !!c.sure;
  c.sure = false;
  const sh = it.shieldDmg ? Math.min(b.shield, TUNE.shieldDmgCap) * it.shieldDmg * dmgMul(c) * (st.total / Math.max(1, st.base + st.flat)) : 0;
  let dmg = (st.total + sh) * (crit ? 2 + mv('critDmg') : 1) * comboMul(depth);
  if (c.anvil) {
    dmg *= 1 + c.anvil;
    c.anvil = 0;
  }
  const mods: HitMods = { slow: c.adj === 'chill' ? 0.3 : 0, kb: c.adj === 'heavy' ? 0.035 : 0, freeze: Math.max(it.freeze || 0, c.frostNext || 0), vuln: it.vuln || null, exec: it.exec || 0, burnDur: it.burnDur || 0, poisonDur: it.poisonDur || 0 };
  c.frostNext = 0;
  const bm = crit && it.critBurn ? it.critBurn : 1;
  const W = world.W,
    H = world.H;
  const o = { x: c.ox, y: H + 3 };
  const A = (it.aoe || 0) * K() * (1 + mv('aoe'));
  const H_ = (e: Enemy, m?: number, extra?: HitMods | null) =>
    hurt(e, dmg * (m || 1) * (it.frozenMul && e.frzT > 0 ? it.frozenMul : 1) * (it.burnMul && e.burnT > 0 ? it.burnMul : 1), c, crit, Object.assign({}, mods, extra || {}));
  const burnAmt = () => it.burn! * dmgMul(c) * (1 + mv('burn'));
  const poisonAmt = () => it.poison! * dmgMul(c) * (1 + mv('poison'));
  const inR = (x: number, y: number, R: number, fn: (e: Enemy) => void) => {
    for (const en of b.en) if (!en.dead && Math.hypot(ex(en) - x, ey(en) - y) <= R) fn(en);
  };
  /** 斩击：目标和它身旁最近的一个 */
  const second = (x0: number, y0: number) => {
    let n2: Enemy | null = null,
      bd = 22 * K();
    for (const e of b.en)
      if (!e.dead && e !== t) {
        const d = Math.hypot(ex(e) - x0, ey(e) - y0);
        if (d < bd) {
          bd = d;
          n2 = e;
        }
      }
    return n2;
  };
  switch (it.fx) {
    case 'knife':
      proj(o, t, { spd: 320, kind: 'knife' }, (e) => H_(e!));
      break;
    case 'firefly': {
      const ts = b.en.filter((e) => !e.dead && e.y >= world.range && !phased(e)).sort((a, z) => z.y - a.y).slice(0, 3);
      ts.forEach((e, i) =>
        later(i * 0.06, () => {
          if (B!.over) return;
          proj({ x: o.x + (i - 1) * 4, y: o.y }, e.dead ? front() || e : e, { spd: 190, kind: 'fly' }, (x2) => H_(x2!));
        }),
      );
      break;
    }
    case 'sweep': {
      const y0 = ey(t),
        band = 10 * K();
      const swing = b.t % 2 < 1 ? 1 : -1;
      view.bolt([[swing > 0 ? 0 : W, y0 - 4], [W / 2, y0 + 2], [swing > 0 ? W : 0, y0 - 4]], '#ffd166', 0.2, false);
      view.ring(ex(t), y0 - 4, 2, 18 * K(), '#ffcd75', 0.3);
      view.sfx('boom');
      for (let i = 0; i < 14; i++) view.part(vrnd(0, W), y0 - 4 + vrnd(-2, 2), swing * vrnd(30, 80), vrnd(-10, 10), 0.3, '#ffe79a', 1);
      for (const en of b.en) if (!en.dead && en.y >= world.range - 0.05 && Math.abs(ey(en) - y0) <= band) H_(en, 1, it.slow ? { slow: it.slow } : null);
      break;
    }
    case 'slash': {
      const x0 = ex(t),
        y0 = ey(t);
      const n2 = second(x0, y0);
      view.bolt([[x0 - 8, y0 - 9], [x0 + 8, y0 - 1]], '#fff4cf', 0.14, true);
      H_(t);
      if (n2) {
        view.bolt([[ex(n2) - 7, ey(n2) - 8], [ex(n2) + 7, ey(n2) - 2]], '#ffe79a', 0.14, true);
        H_(n2, 0.8);
      }
      for (let i = 0; i < 6; i++) view.part(x0, y0 - 5, vrnd(-40, 40), vrnd(-30, 10), 0.25, '#fff4cf', 1);
      break;
    }
    case 'meteor': {
      const x0 = ex(t),
        y0 = ey(t);
      b.pr.push({
        x: x0 + 30, y: world.top - 6, sx: x0 + 30, sy: world.top - 6, tgt: t, tx: x0, ty: y0, spd: 0, kind: 'meteor', arc: 1, dur: 0.55, age: 0, done: false,
        onHit: () => {
          view.boom(x0, y0, A, '#ff5a2a');
          view.ring(x0, y0, 3, A * 1.2, '#fee761', 0.5);
          view.shake(5);
          inR(x0, y0, A, (en) => H_(en, 1, { burn: burnAmt() }));
        },
      });
      break;
    }
    case 'rock':
      proj(o, t, { spd: 240, kind: 'rock' }, (e) => H_(e!, 1, { kb: Math.max(mods.kb!, it.kb!) }));
      break;
    case 'axe':
      proj(o, t, { spd: 230, kind: 'axe' }, (e) => {
        H_(e!, 1, { pen: it.pen });
        for (let i = 0; i < 5; i++) view.part(ex(e!), ey(e!) - 5, vrnd(-30, 30), vrnd(-40, 0), 0.3, '#dfe6ee', 1);
      });
      break;
    case 'blizzard':
      view.ring(W / 2, H * 0.55, 4, W * 0.7, '#73eff7', 0.5);
      for (let i = 0; i < 40; i++) view.part(vrnd(0, W), vrnd(world.top, H * 0.9), vrnd(-50, -20), vrnd(10, 40), vrnd(0.4, 0.8), vr() < 0.5 ? '#f4f4f4' : '#73eff7', 1);
      for (const en of b.en) if (!en.dead && en.y >= world.range) H_(en, 1, { slow: it.slow });
      break;
    case 'spark':
      proj(o, t, { spd: 230, kind: 'spark' }, (e) => H_(e!, 1, { burn: burnAmt() * bm }));
      break;
    case 'sting':
      proj(o, t, { spd: 300, kind: 'knife' }, (e) => H_(e!, 1, { poison: poisonAmt() }));
      break;
    case 'gas':
      proj(o, t, { spd: 0, kind: 'shell', arc: 1, dur: 0.42 }, (e, x, y) => {
        view.boom(x!, y!, A, '#7ddc5f');
        view.ring(x!, y!, 2, A * 0.7, '#a7f070', 0.4);
        inR(x!, y!, A, (en) => H_(en, 1, it.poison ? { poison: poisonAmt() } : null));
      });
      break;
    case 'fslash': {
      const x0 = ex(t),
        y0 = ey(t);
      const n2 = second(x0, y0);
      for (let i = 0; i < 8; i++) view.part(x0 + vrnd(-8, 8), y0 - 5, vrnd(-40, 40), vrnd(-30, 10), 0.3, vr() < 0.5 ? '#ffcd75' : '#ef7d57', 1);
      view.bolt([[x0 - 8, y0 - 9], [x0 + 8, y0 - 1]], '#ffb37a', 0.14, true);
      H_(t, 1, { burn: burnAmt() });
      if (n2) {
        view.bolt([[ex(n2) - 7, ey(n2) - 8], [ex(n2) + 7, ey(n2) - 2]], '#ffb37a', 0.14, true);
        H_(n2, 0.8, { burn: burnAmt() });
      }
      break;
    }
    case 'ice':
      proj(o, t, { spd: 260, kind: 'ice' }, (e) => H_(e!, 1, { slow: Math.max(it.slow!, mods.slow!) }));
      break;
    case 'arrow':
      proj(o, t, { spd: 380, kind: 'arrow' }, (e0) => {
        const e = e0!;
        H_(e);
        const beh = b.en
          .filter((x) => !x.dead && x !== e && x.y < e.y && Math.abs(ex(x) - ex(e)) < 26 * K())
          .sort((a, z) => z.y - a.y)
          .slice(0, it.pierce);
        let prev = e;
        beh.forEach((x, i) => {
          const p0 = prev;
          later(0.03 * (i + 1), () => {
            if (x.dead) return;
            view.bolt([[ex(p0), ey(p0) - 5], [ex(x), ey(x) - 5]], '#e3e9f0', 0.12, true);
            H_(x, 0.7);
          });
          prev = x;
        });
      });
      break;
    case 'bolt': {
      const list = [t];
      while (list.length < 1 + chainOf(c)) {
        const last = list[list.length - 1];
        let best: Enemy | null = null,
          bd = 70 * K();
        for (const e of b.en)
          if (!e.dead && !list.includes(e)) {
            const d = dist(e, last);
            if (d < bd) {
              bd = d;
              best = e;
            }
          }
        if (!best) break;
        list.push(best);
      }
      const pts: [number, number][] = [[o.x, H]];
      list.forEach((e) => pts.push([ex(e), ey(e) - 5]));
      view.bolt(pts, it.tag === 'volt' ? '#fee761' : '#fff', 0.16);
      list.forEach((e, i) => {
        /* 第一跳 60%，之后每跳递减：叠再多弹跳次数，总收益也有上限 */
        H_(e, i ? TUNE.bounceFirst * Math.pow(TUNE.bounceDecay, i - 1) : 1);
        if (i) emit('bounce', { e, src: c });
      });
      break;
    }
    case 'shell':
      proj(o, t, { spd: 0, kind: 'shell', arc: 1, dur: 0.42 }, (e, x, y) => {
        view.boom(x!, y!, A, '#ef7d57');
        inR(x!, y!, A, (en) => H_(en, 1, it.burn ? { burn: burnAmt() } : null));
      });
      break;
    case 'quake': {
      const x = ex(t),
        y = ey(t);
      view.ring(x, y, 4, A, '#c28a4d', 0.4);
      view.ring(x, y, 2, A * 0.6, '#ffcd75', 0.3);
      view.shake(3);
      view.sfx('boom');
      for (let i = 0; i < 18; i++) view.part(x + vrnd(-A * 0.7, A * 0.7), y + vrnd(-6, 6), vrnd(-20, 20), -vrnd(20, 60), 0.6, vr() < 0.5 ? '#7a4a2a' : '#c28a4d', 2);
      inR(x, y, A, (en) => H_(en));
      break;
    }
    case 'flame': {
      const x = ex(t),
        y = ey(t);
      for (let i = 0; i < 22; i++) {
        const k = i / 22;
        view.part(o.x + (x - o.x) * k + vrnd(-3, 3), o.y + (y - o.y) * k + vrnd(-3, 3), vrnd(-15, 15), vrnd(-15, 15), 0.35 + k * 0.2, k < 0.5 ? '#ffcd75' : '#ef7d57', 2);
      }
      later(0.12, () => {
        view.boom(x, y, A, '#ef7d57');
        inR(x, y, A, (en) => H_(en, 1, { burn: burnAmt() }));
      });
      break;
    }
    case 'avalanche': {
      const ts = b.en.filter((e) => !e.dead && e.y >= world.range - 0.05 && (e.slowT > 0 || e.frzT > 0));
      if (!ts.length) ts.push(t);
      view.ring(W / 2, H * 0.5, 4, W * 0.6, '#c2f4ff', 0.45);
      for (let i = 0; i < 26; i++) view.part(vrnd(0, W), vrnd(world.top, H * 0.6), vrnd(-10, 10), vrnd(30, 70), vrnd(0.3, 0.6), vr() < 0.5 ? '#f4f4f4' : '#73eff7', 2);
      view.shake(3);
      view.sfx('boom');
      for (const en of ts) H_(en);
      break;
    }
    case 'discharge': {
      const ts = b.en.filter((e) => !e.dead && e.y >= world.range - 0.05 && (e.slowT > 0 || e.frzT > 0));
      if (!ts.length) ts.push(t);
      for (const en of ts) {
        view.bolt([[o.x, H], [ex(en), ey(en) - 5]], '#fee761', 0.14);
        H_(en);
      }
      break;
    }
    case 'bell':
      view.sfx('bell');
      view.ring(W / 2, H, 6, H * 1.2, '#ffcd75', 0.6);
      view.ring(W / 2, H, 4, H, '#fee761', 0.5);
      for (const en of b.en) if (!en.dead && en.y >= world.range) H_(en);
      break;
  }
}

function proj(o: { x: number; y: number }, t: Enemy, opt: { spd: number; kind: string; arc?: number; dur?: number }, onHit: Projectile['onHit']) {
  bt().pr.push({ x: o.x, y: o.y, sx: o.x, sy: o.y, tgt: t, tx: ex(t), ty: ey(t) - 5, spd: opt.spd * K(), kind: opt.kind, arc: opt.arc, dur: opt.dur, age: 0, onHit, done: false });
}

export function stepProj(p: Projectile, dt: number) {
  p.age += dt;
  if (p.arc) {
    const k = Math.min(1, p.age / p.dur!);
    p.x = p.sx + (p.tx - p.sx) * k;
    p.y = p.sy + (p.ty - p.sy) * k - (p.kind === 'meteor' ? 0 : Math.sin(k * Math.PI) * 28 * K());
    if (p.kind === 'meteor') for (let i = 0; i < 3; i++) view.part(p.x + vrnd(-2, 2), p.y + vrnd(-2, 2), vrnd(5, 20), -vrnd(10, 30), 0.35, vr() < 0.5 ? '#ff5a2a' : '#fee761', 2);
    if (vr() < 0.5) view.part(p.x, p.y, vrnd(-5, 5), vrnd(-5, 5), 0.25, '#94b0c2', 1);
    if (k >= 1) {
      p.done = true;
      p.onHit(null, p.tx, p.ty);
    }
    return;
  }
  if (!p.tgt) {
    p.done = true;
    return;
  }
  if (p.tgt.dead) {
    const n = front();
    if (n) p.tgt = n;
    else {
      p.done = true;
      return;
    }
  }
  p.tx = ex(p.tgt);
  p.ty = ey(p.tgt) - 5;
  const dx = p.tx - p.x,
    dy = p.ty - p.y,
    d = Math.hypot(dx, dy),
    s = p.spd * dt;
  if (p.kind === 'spark' && vr() < 0.6) view.part(p.x, p.y, vrnd(-6, 6), vrnd(-6, 6), 0.25, vr() < 0.5 ? '#ffcd75' : '#ef7d57', 1);
  if (p.kind === 'ice' && vr() < 0.4) view.part(p.x, p.y, vrnd(-4, 4), vrnd(-4, 4), 0.3, '#73eff7', 1);
  if (d <= s + 2) {
    p.done = true;
    p.onHit(p.tgt);
    return;
  }
  p.vx = dx / d;
  p.vy = dy / d;
  p.x += p.vx * s;
  p.y += p.vy * s;
}

/* ---------------- 伤害结算 ---------------- */
export function hurt(e: Enemy, amt: number, src: Card | null, crit: boolean, o: HitMods = {}) {
  const b = bt();
  if (!e || e.dead) return;
  if (phased(e)) {
    if (!o.burnTick && !o.poisonTick && vr() < 0.3) view.num(ex(e), ey(e) - 10, '0', '#73eff7', 1);
    return;
  }
  /* 冰壳蟹：前几下打在壳上（灼烧和中毒不吃壳） */
  if (e.d.shell && (e.shellN || 0) < e.d.shell && !o.burnTick && !o.poisonTick) {
    e.shellN = (e.shellN || 0) + 1;
    e.flash = 0.05;
    const broke = e.shellN >= e.d.shell;
    view.num(ex(e), ey(e) - 10, broke ? L.ui.battle.shellBreak : L.ui.battle.shell, broke ? '#ffffff' : '#73eff7', 1);
    if (broke) {
      view.ring(ex(e), ey(e) - 5, 2, 10 * K(), '#c2f4ff', 0.3);
      view.sfx('hit');
    }
    return;
  }
  if (e.d.mimic && !e.revealed) {
    e.revealed = true;
    e.sprK = e.d.spr2!;
    view.sfx('intent');
    view.ring(ex(e), ey(e) - 5, 2, 14 * K(), '#ffcd75', 0.3);
  }
  /* 元素反应的追加伤害按已经结算过的那一下算，不再吃易伤和护甲 */
  if (!o.rx) {
    if (e.slowT > 0 && mv('slowVuln')) amt *= 1 + mv('slowVuln');
    if (e.vulnT > 0) amt *= 1 + e.vulnA;
  }
  const w0 = was(e);
  let a = Math.max(1, amt - Math.max(0, e.armor + e.armorB + (e.hardT > 0 ? 10 : 0) - (o.pen || 0) - mv('pen')));
  if (o.burnTick || o.poisonTick || o.rx) a = Math.max(1, amt);
  if (e.shield > 0) {
    const s = Math.min(e.shield, a);
    e.shield -= s;
    a -= s;
    if (a <= 0) {
      view.num(ex(e), ey(e) - 12, '0', '#dfe6ee', 1);
      return;
    }
  }
  e.hp -= a;
  e.flash = 0.08;
  if (src) src.bDmg += a;
  if (a > b.maxHit) {
    b.maxHit = a;
    if (a >= 1000) unlock('hit1k');
    if (a >= 10000) unlock('hit10k');
  }
  view.dmgNum(e, a, crit, o.poisonTick ? 'poison' : o.burnTick ? 'burn' : null);
  if (!o.burnTick && !o.poisonTick) view.sfx(crit ? 'crit' : 'hit');
  if (crit) {
    view.shake(1.5);
    if (a >= e.maxHp * 0.6 && a >= 30) view.say('hero', L.story.barks.crit, 1);
  }
  const FOEB = L.story.foe as Record<string, any>;
  if (e === b.boss && !e.lowSaid && e.hp - a < e.maxHp * 0.3 && FOEB[e.type]) {
    e.lowSaid = true;
    view.say(e.type, FOEB[e.type].low, 3);
    view.say('hero', FOEB[e.type].heroLow, 3);
  }
  if (o.slow) {
    e.slowT = 2;
    e.slowA = Math.min(0.85, Math.max(e.slowA, o.slow * (1 + mv('slow')) * (e.d.boss ? 0.5 : 1)));
  }
  const tick = o.burnTick || o.poisonTick;
  if (o.burn) {
    e.burnT = Math.max(e.burnT, o.burnDur || 3);
    e.burnD = Math.max(e.burnD, o.burn);
    e.burnSrc = src;
    emit('burn', { e, src });
  }
  if (o.poison) {
    e.poisonT = Math.max(e.poisonT, o.poisonDur || 3);
    e.poisonD += o.poison;
    e.poisonSrc = src;
    emit('poison', { e, src });
  }
  if (o.freeze) freeze(e, o.freeze, src);
  if (o.vuln) vuln(e, o.vuln[0], o.vuln[1]);
  if (!tick && !o.rx) {
    emit('hit', { e, src, crit, a, splash: !!o.splash });
    if (crit) emit('crit', { e, src, a });
  }
  if (o.exec && !e.dead && e.hp > 0 && !e.d.boss && e.hp < e.maxHp * o.exec * (e.d.elite ? 0.5 : 1)) {
    view.num(ex(e), ey(e) - 16, L.ui.battle.exec, '#ff5a5a', 1);
    view.ring(ex(e), ey(e) - 6, 2, 12 * K(), '#ff5a5a', 0.3);
    e.hp = 0;
  }
  if (o.kb && !e.d.boss) e.y = Math.max(-0.03, e.y - o.kb * (e.d.elite ? 0.3 : 1));
  if (src && !tick && !o.rx && !e.dead && e.hp > 0) react(e, a, src, crit, w0, !!o.burn);
  view.hit(ex(e), ey(e) - 5, o.burnTick ? 'fire' : o.poisonTick ? 'poison' : src ? ITEMS[src.key].tag : null, crit, e.hp <= 0);
  if (e.hp <= 0) kill(e, src);
}

export function freeze(e: Enemy, t: number, src?: Card | null) {
  if (e.dead) return;
  let d = t * (e.d.boss || e.d.elite ? 0.5 : 1);
  if (e.d.boss) d /= 1 + e.frzN * 0.5;
  e.frzN++;
  if (d > e.frzT) {
    e.frzT = d;
    view.ring(ex(e), ey(e) - 5, 2, 10 * K(), '#c2f4ff', 0.3);
  }
  emit('freeze', { e, src });
}

export function vuln(e: Enemy, t: number, a: number) {
  e.vulnT = Math.max(e.vulnT, t);
  e.vulnA = Math.max(e.vulnA, a);
}

/* ---------------- 击杀 ---------------- */
export function kill(e: Enemy, src: Card | null) {
  const b = bt();
  const FOEB = L.story.foe as Record<string, any>;
  /* 隐藏剧情：艾拉用誓约长剑打出击倒卡尔的最后一下 */
  const karl = e.type === 'knight' && !e.dead && G.hero === 'ayla' && src && src.key === 'oathsword' && !b.ambush;
  if (karl) G.secret.karlKill = 1;
  e.dead = true;
  b.kills++;
  codexKill(e.type);
  view.sfx('kill');
  comboKill(e);
  if (e.type === 'eye' && b.t - e.bornT <= 25) unlock('quickeye');
  if (b.kills === 1) view.say('hero', L.story.barks.first, 1);
  b.kt = (b.kt || []).filter((t) => t > b.t - 2);
  b.kt.push(b.t);
  if (b.kt.length >= 8) {
    b.kt = [];
    view.say('hero', L.story.barks.streak, 1);
  }
  emit('kill', { e, src, burning: e.burnT > 0, poisoned: e.poisonT > 0, frozen: e.frzT > 0, elite: !!(e.d.elite || e.d.boss) });
  const n = e.d.boss ? 60 : e.d.elite ? 36 : 12;
  for (let i = 0; i < n; i++) view.part(ex(e), ey(e) - 5, vrnd(-50, 50), vrnd(-60, 20), vrnd(0.3, 0.7), vr() < 0.6 ? e.d.col : '#1a1c2c', vr() < 0.5 ? 2 : 1);
  view.part(ex(e), ey(e) - 6, vrnd(-4, 4), -35, 0.8, '#dfe6ee', 1);
  view.ring(ex(e), ey(e) - 5, 1, 6 * K() * e.d.sc, '#ffffff', 0.18);
  if (!e.d.fixed && !e.raised && !e.d.small) {
    b.graves.push({ x: e.x, y: e.y, t: b.t });
    if (b.graves.length > 24) b.graves.shift();
  }
  if (e.d.bomb) {
    const X = ex(e),
      Y = ey(e) - 4,
      R = 22 * K();
    view.boom(X, Y, R, '#ef7d57');
    view.shake(3);
    later(0.04, () => {
      for (const o of B!.en) if (!o.dead && o !== e && Math.hypot(ex(o) - X, ey(o) - Y) <= R) hurt(o, o.maxHp * e.d.bomb! + 4, null, false, {});
    });
  }
  if (e.d.cargo) {
    const [k, cn] = e.d.cargo;
    for (let i = 0; i < cn; i++) {
      const s = spawn(k, Math.min(0.95, Math.max(0.05, e.x + (i - (cn - 1) / 2) * 0.06)), Math.max(-0.02, e.y - 0.01 - rnd(0, 0.03)));
      s.x0 = s.x;
    }
    view.ring(ex(e), ey(e) - 6, 3, 26 * K(), '#c28a4d', 0.4);
    view.sfx('boom');
  }
  if (e.d.mimic) {
    G.gold += e.d.mimic;
    view.coins(ex(e), ey(e), e.d.mimic);
    view.sfx('coin');
    view.hud();
  }
  if (e.d.split) {
    for (let i = 0; i < e.d.split; i++) {
      const m = spawn(e.d.splitInto || 'mini', Math.min(0.96, Math.max(0.04, e.x + (i ? 0.05 : -0.05))), e.y - 0.01);
      m.x0 = m.x;
    }
  }
  if (src && src.adj === 'greedy' && rand() < 0.2) {
    G.gold++;
    b.greed++;
    view.coins(ex(e), ey(e), 1);
    view.sfx('coin');
    view.hud();
  }
  if (mv('killGold') && rand() < mv('killGold')) {
    G.gold++;
    b.greed++;
    view.coins(ex(e), ey(e), 1);
    view.hud();
  }
  if (e.d.boss || e.d.elite) {
    view.shake(6);
    b.slowT = 0.6;
    view.sfx('boom');
    if (FOEB[e.type]) view.say(e.type, karl ? L.story.secretKarl.die : FOEB[e.type].die, 3);
    if (!e.d.boss) view.say('hero', L.story.barks.killElite, 2);
    view.ring(ex(e), ey(e), 4, 60, '#fee761', 0.6);
    b.boss = null;
    view.boss(null);
  }
  if (karl) view.say('hero', L.story.secretKarl.hero, 3);
}
