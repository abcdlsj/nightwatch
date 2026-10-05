/* 爽感三件套：元素反应、流派连招、连杀分级。
 *   元素反应：这一下的元素碰上敌人身上已有的状态（冻结 / 灼烧 / 中毒 / 减速），打出额外效果；同一个敌人有内置冷却
 *   流派连招：同元素的卡在短时间内连着出手，放一次这个元素的大招；每个元素各自冷却
 *   连杀分级：连杀到一定数量，全队加速几秒
 * The three feel-good systems: elemental reactions, archetype combos, kill-streak tiers. Elemental reactions: the hit's element meets a status already on the enemy (freeze / burn / poison / slow) to add an extra effect, with an internal cooldown per enemy. Archetype combos: cards of the same element firing in quick succession unleash that element's ultimate, each with its own cooldown. Kill-streak tiers: at certain streak counts the whole team speeds up for a few seconds.
 */
import { ITEMS } from '../data/cards';
import type { Tag } from '../data/types';
import { L } from '../i18n';
import { vr, vrnd, pick, vpick } from '../core/rng';
import type { Card } from '../game/state';
import { mv } from '../game/mods';
import { TUNE } from '../game/tuning';
import { boardCards, type Stats } from '../game/cards';
import { world, K, ex, ey } from './world';
import { view } from './view';
import { B, bt, later } from './battle';
import { hurt, freeze, vuln, chargeCard, haste } from './combat';
import type { Enemy } from './types';

/* ---------------- 元素反应 ---------------- / ---------------- Elemental reactions ---------------- */
export type Rx = 'melt' | 'shatter' | 'overload' | 'toxic' | 'super';
export const RXC: Record<Rx, string> = { melt: '#ff9a5a', shatter: '#c2f4ff', overload: '#fee761', toxic: '#b8f060', super: '#9ad8ff' };
/** 命中前敌人身上的状态 / statuses on the enemy before the hit */
export interface Was { frz: boolean; burn: boolean; poi: boolean; slow: boolean }
export const was = (e: Enemy): Was => ({ frz: e.frzT > 0, burn: e.burnT > 0, poi: e.poisonT > 0, slow: e.slowT > 0 });

const around = (e: Enemy, R: number, fn: (o: Enemy) => void) => {
  for (const o of bt().en) if (!o.dead && o !== e && Math.hypot(ex(o) - ex(e), ey(o) - ey(e)) <= R) fn(o);
};
/** 反应强度：基础 × 全局系数 × (1 + 通用加成 + 这种反应的加成) / reaction strength: base × global coefficient × (1 + general bonus + this reaction's bonus) */
const rxK = (k: Rx) => TUNE.rx * (1 + mv('rx') + mv('rx_' + k));

/** 命中结算完以后看要不要反应。a 是这一下实际打掉的血（已扣护甲） / after the hit resolves, check whether to react. a is the HP actually removed by this hit (armor already applied) */
export function react(e: Enemy, a: number, src: Card, crit: boolean, w: Was, burnHit: boolean) {
  const b = bt();
  if (e.rxT && e.rxT > b.t) return;
  const tag = ITEMS[src.key].tag;
  const fire = tag === 'fire' || burnHit,
    volt = tag === 'volt';
  const k: Rx | null =
    w.frz && crit && !fire ? 'shatter' : w.frz && fire ? 'melt' : volt && w.burn ? 'overload' : fire && w.poi ? 'toxic' : volt && (w.slow || w.frz) ? 'super' : null;
  if (!k) return;
  e.rxT = b.t + TUNE.rxCd;
  const m = rxK(k),
    X = ex(e),
    Y = ey(e) - 5;
  const col = RXC[k];
  view.num(X, Y - 12, L.ui.battle.rx[k], col, 1);
  view.sfx('react', k);
  b.rxN = (b.rxN || 0) + 1;
  if (!b.flags.rxTip) {
    b.flags.rxTip = 1;
    view.tip('rx', L.ui.tips.rx, 600);
  }
  const bonus = (f: number) => Math.max(1, a * f * m);
  switch (k) {
    case 'melt':
      e.frzT = 0;
      view.ring(X, Y, 2, 12 * K(), col, 0.3);
      for (let i = 0; i < 10; i++) view.part(X + vrnd(-4, 4), Y, vrnd(-25, 25), -vrnd(30, 70), vrnd(0.3, 0.5), vr() < 0.5 ? '#c2f4ff' : col, 2);
      hurt(e, bonus(0.6), src, false, { rx: 1 });
      break;
    case 'shatter': {
      e.frzT = 0;
      view.ring(X, Y, 2, 16 * K(), col, 0.35);
      view.shake(2);
      for (let i = 0; i < 14; i++) {
        const ang = vr() * 6.28,
          s = vrnd(40, 90);
        view.part(X, Y, Math.cos(ang) * s, Math.sin(ang) * s, vrnd(0.25, 0.45), vr() < 0.5 ? '#ffffff' : '#73eff7', 2);
      }
      hurt(e, bonus(0.8), src, false, { rx: 1 });
      const d = bonus(0.4);
      around(e, 16 * K(), (o) => hurt(o, d, src, false, { rx: 1 }));
      break;
    }
    case 'overload': {
      const R = 18 * K();
      view.boom(X, Y, R, col);
      view.ring(X, Y, 3, R * 1.1, '#ef7d57', 0.3);
      const d = bonus(0.5),
        bd = e.burnD * 0.6;
      around(e, R, (o) => hurt(o, d, src, false, { rx: 1, burn: bd, burnDur: 3 }));
      break;
    }
    case 'toxic': {
      const R = 20 * K();
      view.ring(X, Y, 2, R, col, 0.4);
      view.ring(X, Y, 1, R * 0.6, '#ef7d57', 0.3);
      for (let i = 0; i < 16; i++) {
        const ang = vr() * 6.28,
          s = vrnd(15, 45);
        view.part(X, Y, Math.cos(ang) * s, Math.sin(ang) * s - 10, vrnd(0.4, 0.7), vr() < 0.6 ? '#7ddc5f' : '#ef7d57', 2);
      }
      /* 毒往外传只拉平到源头的一部分，不叠加：互相传来传去也不会越滚越大 / poison spread only levels out toward a fraction of the source and does not stack, so back-and-forth spreading never snowballs */
      const d = bonus(0.3),
        pd = e.poisonD * Math.min(1, 0.5 * m);
      hurt(e, d, src, false, { rx: 1 });
      around(e, R, (o) => {
        hurt(o, d, src, false, { rx: 1 });
        if (o.dead || o.poisonD >= pd) return;
        o.poisonD = pd;
        o.poisonT = Math.max(o.poisonT, 3);
        o.poisonSrc = src;
      });
      break;
    }
    case 'super':
      vuln(e, 3, 0.2 * m);
      view.ring(X, Y, 2, 10 * K(), col, 0.3);
      for (let i = 0; i < 3; i++) {
        const ang = vr() * 6.28;
        view.bolt([[X, Y], [X + Math.cos(ang) * 9, Y + Math.sin(ang) * 9]], col, 0.12);
      }
      break;
  }
}

/* ---------------- 流派连招 ---------------- / ---------------- Archetype combos ---------------- */
type Hit = { t: number; c: Card; d: number };
const inRange = () => bt().en.filter((e) => !e.dead && e.y >= world.range - 0.05);

/** 每次出手记一笔；同元素在窗口内凑够次数（至少两张卡）就放大招 / record every hit; when the same element reaches enough hits within the window (at least two cards), unleash the ultimate */
export function streak(c: Card, st: Stats) {
  const b = bt();
  const tag = ITEMS[c.key].tag;
  const log: Record<string, Hit[]> = b.flags.stk || (b.flags.stk = {});
  const cd: Record<string, number> = b.flags.stkCd || (b.flags.stkCd = {});
  const l = (log[tag] = (log[tag] || []).filter((h) => h.t > b.t - TUNE.streakWin));
  l.push({ t: b.t, c, d: ITEMS[c.key].dmg > 0 ? st.total : 0 });
  if ((cd[tag] || -99) > b.t || l.length < TUNE.streakN || new Set(l.map((h) => h.c)).size < 2) return;
  cd[tag] = b.t + TUNE.streakCd;
  const ref = Math.max(...l.map((h) => h.d));
  log[tag] = [];
  b.stkN = (b.stkN || 0) + 1;
  for (const h of l) view.cardFx(h.c, 'pop');
  view.banner(L.ui.battle.streak[tag], RXC_TAG[tag]);
  view.sfx('streak', tag);
  view.buzz(30);
  /* 卡与卡之间亮一圈：连招是这几张一起打出来的 / draw a ring between the cards: the combo came from these together */
  const cs = [...new Set(l.map((h) => h.c))];
  cs.forEach((x, i) => i && view.link(cs[i - 1], x, RXC_TAG[tag], 0.45));
  later(0.15, () => {
    if (B!.over) return;
    STREAK[tag](c, ref);
  });
}
const RXC_TAG: Record<Tag, string> = { blade: '#fff4cf', fire: '#ff8a5b', ice: '#73eff7', volt: '#fee761', mech: '#ffd166', poison: '#a7f070' };

const STREAK: Record<Tag, (c: Card, ref: number) => void> = {
  /* 千刃：射程内最多 6 个敌人各挨一刀 / Thousand Blades: up to 6 enemies in range each take one hit */
  blade(c, ref) {
    const ts = inRange().sort((a, z) => z.y - a.y).slice(0, 6);
    ts.forEach((e, i) =>
      later(i * 0.05, () => {
        if (B!.over || e.dead) return;
        const X = ex(e),
          Y = ey(e) - 5,
          d = i % 2 ? 1 : -1;
        view.bolt([[X - 10 * d, Y - 8], [X + 10 * d, Y + 4]], '#ffffff', 0.16, true);
        view.bolt([[X + 8 * d, Y - 8], [X - 8 * d, Y + 4]], '#fff4cf', 0.16, true);
        hurt(e, ref * 0.7, c, false, { splash: 1 });
      }),
    );
    view.shake(3);
  },
  /* 燎原：射程内全部点着 / Wildfire: set everything in range alight */
  fire(c, ref) {
    const W = world.W;
    for (let i = 0; i < 30; i++) view.part(vrnd(0, W), world.top + vrnd(10, 60) * K(), vrnd(-10, 10), -vrnd(20, 60), vrnd(0.4, 0.8), vpick(['#ffcd75', '#ef7d57', '#ff5a2a']), 2);
    for (const e of inRange()) {
      view.ring(ex(e), ey(e) - 5, 2, 10 * K(), '#ef7d57', 0.3);
      hurt(e, ref * 0.3, c, false, { splash: 1, burn: ref * 0.2 * (1 + mv('burn')), burnDur: 4 });
    }
    view.shake(3);
  },
  /* 冰封：射程内全部冻住 / Icebound: freeze everything in range */
  ice(c, ref) {
    view.ring(world.W / 2, world.H * 0.5, 4, world.W * 0.7, '#c2f4ff', 0.5);
    for (let i = 0; i < 30; i++) view.part(vrnd(0, world.W), vrnd(world.top, world.H * 0.8), vrnd(-20, 20), vrnd(10, 40), vrnd(0.4, 0.8), vr() < 0.5 ? '#ffffff' : '#73eff7', 1);
    for (const e of inRange()) {
      hurt(e, ref * 0.4, c, false, { splash: 1 });
      if (!e.dead) freeze(e, 0.8, c);
    }
  },
  /* 雷暴：天上劈下 5 道雷 / Thunderstorm: 5 bolts strike from the sky */
  volt(c, ref) {
    const ts = inRange();
    for (let i = 0; i < 5 && ts.length; i++)
      later(i * 0.07, () => {
        if (B!.over) return;
        const e = pick(ts);
        if (e.dead) return;
        const X = ex(e),
          Y = ey(e) - 5;
        view.bolt([[X + vrnd(-12, 12), world.top], [X, Y]], '#fee761', 0.2);
        view.ring(X, Y, 2, 9 * K(), '#ffffff', 0.2);
        hurt(e, ref * 0.6, c, false, { splash: 1 });
      });
    view.shake(3);
  },
  /* 全速：全部【机】卡充能并加速 / Full Speed: charge and speed up all 【machine】 cards */
  mech(c) {
    for (const o of boardCards())
      if (ITEMS[o.key].tag === 'mech') {
        chargeCard(o, 0.25, c);
        haste(o, 1.2, c);
      }
  },
  /* 疫潮：射程内全部染毒 / Plague Tide: poison everything in range */
  poison(c, ref) {
    for (let i = 0; i < 24; i++) view.part(vrnd(0, world.W), vrnd(world.top, world.H * 0.7), vrnd(-15, 15), vrnd(-15, 5), vrnd(0.5, 0.9), vr() < 0.5 ? '#7ddc5f' : '#a7f070', 2);
    for (const e of inRange()) {
      view.ring(ex(e), ey(e) - 5, 2, 9 * K(), '#7ddc5f', 0.35);
      hurt(e, 1, c, false, { splash: 1, poison: ref * 0.2 * (1 + mv('poison')), poisonDur: 4 });
    }
  },
};

/* ---------------- 连杀分级 ---------------- / ---------------- Kill-streak tiers ---------------- */
/** 连杀到这些数时全队加速（秒） / at these streak counts the team speeds up (seconds) */
const FRENZY: [number, number][] = [[10, 0.6], [25, 1], [50, 1.5], [100, 2]];
export function frenzy(c: number) {
  const i = FRENZY.findIndex(([n]) => n === c);
  if (i < 0 || !TUNE.frenzy) return false;
  const t = FRENZY[i][1] * TUNE.frenzy;
  for (const o of boardCards()) haste(o, t);
  view.banner(L.ui.battle.frenzy[i], ['#ffe79a', '#ffb37a', '#ff7a5a', '#ff5a8a'][i]);
  view.sfx('streak', 'frenzy');
  view.ring(world.W / 2, world.H, 6, world.H * (0.6 + i * 0.2), '#ffb37a', 0.6);
  view.shake(2 + i);
  return true;
}
