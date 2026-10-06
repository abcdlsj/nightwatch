/* 卡牌 / 遗物 / 天赋的触发型效果。
 * 战斗引擎在对应时机 emit(事件)，这里按 id 找到钩子执行：
 *   start 开战 · use 任意卡触发 · hit 命中 · crit 暴击 · burn/poison/freeze 施加状态 · bounce 闪电弹跳
 *   kill 击杀 · wall 城墙受击 · charge 某卡被充能 · chain 连锁到 5 的倍数
 * 卡牌钩子收到 (这张卡, 上下文)；遗物钩子收到 (同名遗物件数, 上下文)；天赋钩子收到 (上下文)。
 * Triggered effects of cards / relics / talents. The battle engine emits events at the right moments and looks up hooks by id: start battle start · use any card triggers · hit on hit · crit on crit · burn/poison/freeze applying a status · bounce lightning bounce · kill on kill · wall wall hit · charge a card charged · chain chain reaches a multiple of 5. Card hooks receive (this card, context); relic hooks receive (count of same-name relics, context); talent hooks receive (context).
 */
import { ITEMS } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS } from '../data/talents';
import { L, t } from '../i18n';
import { pick } from '../core/rng';
import { G, type Card } from '../game/state';
import { mv } from '../game/mods';
import { boardCards, ends, stepOf, dmgMul, growCard, questAdd, countKind, kindOf, isGrow, stats } from '../game/cards';
import { K, ex, ey } from './world';
import { view } from './view';
import { B, bt, later, near } from './battle';
import { chargeCard, haste, reload, hurt, trigger, vuln, addShield } from './combat';

export type X = Record<string, any>;
export type CardHook = { on?: Record<string, (c: Card, x: X) => void>; onWin?: (c: Card) => void };

/** 在 (X,Y) 半径 R 内的活着的敌人上执行 / run on living enemies within radius R of (X,Y) */
const around = (X: number, Y: number, R: number, fn: (o: any) => void) => {
  for (const o of bt().en) if (!o.dead && Math.hypot(ex(o) - X, ey(o) - Y) <= R) fn(o);
};
const grow = (c: Card, v: number) => {
  growCard(c, v);
  view.cardNum(c);
};

export const CARD_HOOKS: Record<string, CardHook> = {
  oathsword: { on: { kill: (c, x) => { if (x.src === c) questAdd(c); } } },
  bloodrage: { on: { wall: (c) => { c.rage = Math.min(1, (c.rage || 0) + 0.1); } } },
  sparkwick: { on: { burn: (c, x) => { if (x.src !== c) chargeCard(c, 0.25); } } },
  netcoil: { on: { bounce: (c, x) => { if (x.src !== c) chargeCard(c, 0.12); } } },
  appwand: { on: { bounce: (c) => questAdd(c) } },
  honeblade: { on: { kill: (c, x) => { if (x.src === c) grow(c, x.elite ? 3 : 0.1); } } },
  alarmbell: {
    on: {
      wall: (c) => {
        const b = bt();
        if (c.lastT > b.t - 1) return;
        c.lastT = b.t;
        view.cardFx(c, 'pop');
        for (const o of boardCards()) if (o !== c) chargeCard(o, 0.05 * (1 + 0.4 * stepOf(c)), c);
      },
    },
  },
  vetblade: { on: { kill: (c, x) => { if (x.src === c && x.elite) grow(c, 10); } } },
  javelin: { on: { crit: (c, x) => { if (x.src && x.src !== c && c.nb && c.nb.includes(x.src)) reload(c, 1, x.src); } } },
  oiltrap: {
    on: {
      kill: (c, x) => {
        if (!x.burning) return;
        const e = x.e,
          X = ex(e),
          Y = ey(e) - 4,
          R = 18 * K();
        const amt = Math.max(4, e.burnD * Math.max(1, e.burnT) * 2) * dmgMul(c) * (1 + mv('burn'));
        view.boom(X, Y, R, '#ef7d57');
        view.cardFx(c, 'pop');
        later(0.04, () => around(X, Y, R, (o) => hurt(o, amt, c, false, { burn: 2, k: 'fx' })));
      },
    },
  },
  flagpole: {
    on: {
      use: (c, x) => {
        const [Lc, Rc] = ends();
        if (x.c !== Lc || Lc === c || !Rc || Rc === c) return;
        chargeCard(Rc, 0.15 + 0.05 * stepOf(c), c);
      },
    },
  },
  condenser: {
    on: {
      freeze: (c, x) => {
        if (x.src !== c) return;
        for (const n of c.nb || [])
          if (ITEMS[n.key].tag === 'fire') {
            n.anvil = Math.max(n.anvil || 0, 0.5);
            view.link(c, n, '#73eff7', 0.2);
          }
      },
    },
  },
  shockvenom: { on: { bounce: (c, x) => { if (x.src === c && x.e.poisonT > 0 && !x.e.dead) hurt(x.e, x.e.poisonD, c, false, { poisonTick: 1, k: 'fx' }); } } },
  midas: {
    on: {
      kill: (c, x) => {
        if (!x.poisoned || c.cnt >= 5) return;
        c.cnt++;
        G.gold++;
        bt().greed++;
        view.coins(ex(x.e), ey(x.e), 1);
        view.sfx('coin');
        view.hud();
      },
    },
  },
  supersat: { on: { poison: (c) => questAdd(c) } },
  marquee: { on: { charge: (c, x) => { if (x.c !== c && x.c.size === 1) c.charge = Math.min(1.5, c.charge + 0.04); } } },
  lamps: { onWin: (c) => grow(c, countKind('lamp')) },
  ffjar: { on: { use: (c, x) => { if (x.c.key === 'musicbox') reload(c, 2, x.c); } } },
  mason: {
    on: {
      wall: (c) => {
        const b = bt();
        if (c.lastT > b.t - 2) return;
        c.lastT = b.t;
        view.cardFx(c, 'pop');
        addShield(1 + 0.4 * stepOf(c));
      },
    },
  },
  beacontower: {
    on: {
      use: (c, x) => {
        const nb = c.nb || [];
        if (x.c === c || !nb.includes(x.c) || nb.length < 2) return;
        const o = nb.find((n) => n !== x.c)!;
        view.link(x.c, c, '#ff9a3b', 0.18);
        chargeCard(o, 0.15 + 0.05 * stepOf(c), c);
      },
    },
  },
  wishstar: {
    on: {
      kill: (c, x) => {
        const b = bt();
        if (!x.src || !x.src.carry || c.lastT > b.t - 0.33) return;
        c.lastT = b.t;
        view.cardFx(c, 'pop');
        for (const o of boardCards()) if (o !== c && !ITEMS[o.key].dmg) chargeCard(o, 0.06 + 0.02 * stepOf(c), c);
      },
    },
  },
  pocketwatch: { on: { start: (c) => { for (const o of boardCards()) if (o !== c && o.size === 1) haste(o, 3, c); } } },
  /* 凤凰羽：燃烧的敌人倒下，本卡充能 / Phoenix Feather: when a burning enemy dies, charge this card */
  phoenix: { on: { kill: (c, x) => { if (x.burning) chargeCard(c, 0.08 + 0.02 * stepOf(c)); } } },
  /* 瘟疫烧瓶：中毒的敌人倒下，把一半的毒传给身边最多 3 个 / Plague Flask: when a poisoned enemy dies, pass half its poison to up to 3 nearby */
  plague: {
    on: {
      kill: (c, x) => {
        if (!x.poisoned) return;
        const e = x.e;
        const ns = near(e, 20 * K()).slice(0, 3);
        if (!ns.length) return;
        view.ring(ex(e), ey(e) - 5, 2, 20 * K(), '#7ddc5f', 0.25);
        for (const o of ns) {
          o.poisonT = Math.max(o.poisonT, 3);
          o.poisonD += e.poisonD * (0.5 + 0.1 * stepOf(c));
          if (!o.poisonSrc) o.poisonSrc = c;
        }
      },
    },
  },
  /* 猎头弩：亲手击杀精英或首领时装满弹药 / Headhunter Crossbow: refill all ammo on personally killing an elite or boss */
  headxbow: { on: { kill: (c, x) => { if (x.src === c && x.elite) reload(c, 9, c); } } },
  /* 爆竹：亲手击杀时，相邻的火器充能 15% / Firecracker: on personally killing, charge adjacent firearms 15% */
  firecracker: { on: { kill: (c, x) => { if (x.src === c) for (const n of c.nb || []) if (kindOf(n) === 'firearm') chargeCard(n, 0.15 + 0.05 * stepOf(c), c); } } },
  /* 星种：当 C 位时每击杀 10 个敌人，基础伤害永久 +1 / Star Seed: as the carry, +1 permanent base damage per 10 kills */
  starseed: {
    on: {
      kill: (c, x) => {
        if (x.src !== c || !c.carry) return;
        c.cnt = (c.cnt || 0) + 1;
        if (c.cnt % 10 === 0) grow(c, 1);
      },
    },
  },
  /* 霜枪：亲手击杀被冻结的敌人时碎冰，伤到周围 / Rime Lance: personally killing a frozen enemy shatters it, hurting those around */
  rimelance: {
    on: {
      kill: (c, x) => {
        if (x.src !== c || !x.frozen) return;
        const X = ex(x.e),
          Y = ey(x.e) - 4,
          R = 18 * K();
        const amt = stats(c, bt().t).total * 0.5;
        view.ring(X, Y, 2, R, '#c2f4ff', 0.3);
        later(0.03, () => around(X, Y, R, (o) => hurt(o, amt, c, false, { splash: 1, k: 'fx' })));
      },
    },
  },
  /* 月晷：C 位暴击时，其他卡都充能一点 / Moondial: when the carry crits, charge all other cards a little */
  moondial: {
    on: {
      crit: (c, x) => {
        const b = bt();
        if (!x.src || !x.src.carry || c.lastT > b.t - 0.3) return;
        c.lastT = b.t;
        view.cardFx(c, 'pop');
        for (const o of boardCards()) if (o !== c && o !== x.src) chargeCard(o, 0.08 + 0.03 * stepOf(c), c);
      },
    },
  },
};

export const RELIC_HOOKS: Record<string, Record<string, (n: number, x: X) => void>> = {
  kindling: {
    burn: (n) => {
      const b = bt();
      if (b.flags.kindling) return;
      b.flags.kindling = 1;
      for (const o of boardCards()) if (ITEMS[o.key].tag === 'fire') chargeCard(o, 0.3 * n, null);
    },
  },
  icechain: {
    kill: (n, x) => {
      if (!x.frozen) return;
      const X = ex(x.e),
        Y = ey(x.e) - 4,
        R = 16 * K();
      view.ring(X, Y, 2, R, '#c2f4ff', 0.3);
      later(0.03, () => around(X, Y, R, (o) => hurt(o, 8 * n, null, false, { k: 'relic.icechain' })));
    },
  },
  chaingear: {
    chain: () => {
      const b = bt();
      if (b.flags.cgT > b.t - 0.5) return;
      b.flags.cgT = b.t;
      const [Lc] = ends();
      if (Lc)
        later(0.1, () => {
          if (!B!.over) trigger(Lc, 1, RELICS.chaingear.n);
        });
    },
  },
  lootbag: {
    kill: (n, x) => {
      if (!x.elite) return;
      G.gold += 3 * n;
      view.coins(ex(x.e), ey(x.e), 6);
      view.sfx('coin');
      view.hud();
    },
  },
  thunderdrum: {
    wall: () => {
      const b = bt();
      if (b.flags.drumT > b.t - 2) return;
      b.flags.drumT = b.t;
      const bc = boardCards().filter((o) => o.ammo !== 0 && o.frozen <= 0);
      if (bc.length) trigger(pick(bc), 1, RELICS.thunderdrum.n);
    },
  },
  tyrantnail: { crit: (n, x) => { if (x.e && !x.e.dead) vuln(x.e, 2, 0.2); } },
  scabbard: {
    hit: (n, x) => {
      if (x.splash || !x.src || kindOf(x.src) !== 'weapon' || !x.a) return;
      const R = 16 * K();
      const ns = near(x.e, R);
      if (!ns.length) return;
      view.ring(ex(x.e), ey(x.e) - 5, 2, R, '#e3e9f0', 0.2);
      for (const o of ns) hurt(o, x.a * 0.35 * n, x.src, false, { splash: 1, k: 'relic.scabbard' });
    },
  },
  groove: {
    kill: (n, x) => {
      const s = x.src;
      if (!s || !isGrow(s)) return;
      const X = ex(x.e),
        Y = ey(x.e) - 4,
        R = 18 * K();
      const amt = stats(s, bt().t).total * 0.6 * n;
      view.ring(X, Y, 2, R, '#ff5a5a', 0.25);
      later(0.03, () => around(X, Y, R, (o) => hurt(o, amt, s, false, { splash: 1, k: 'relic.groove' })));
    },
  },
  bellows: {
    kill: (n, x) => {
      if (!x.burning) return;
      const e = x.e;
      const ns = near(e, 18 * K());
      if (!ns.length) return;
      view.ring(ex(e), ey(e) - 5, 2, 18 * K(), '#ef7d57', 0.25);
      for (const o of ns) {
        o.burnT = Math.max(o.burnT, 3);
        o.burnD = Math.max(o.burnD, e.burnD * (0.6 + 0.2 * n));
        o.burnSrc = e.burnSrc;
      }
    },
  },
  rat: {
    kill: (n, x) => {
      if (!x.poisoned) return;
      const e = x.e;
      const ns = near(e, 18 * K());
      if (!ns.length) return;
      view.ring(ex(e), ey(e) - 5, 2, 18 * K(), '#7ddc5f', 0.25);
      for (const o of ns.slice(0, 4)) {
        o.poisonT = Math.max(o.poisonT, 3);
        o.poisonD += e.poisonD * 0.5 * n;
        if (!o.poisonSrc) o.poisonSrc = e.poisonSrc;
      }
    },
  },
  frostlens: {
    freeze: (n, x) => {
      const e = x.e;
      if (!e) return;
      for (const o of near(e, 20 * K())) {
        o.slowT = Math.max(o.slowT, 2);
        o.slowA = Math.min(0.85, Math.max(o.slowA, 0.4 * (o.d.boss ? 0.5 : 1)));
      }
    },
  },
};

export const TALENT_HOOKS: Record<string, Record<string, (x: X) => void>> = {
  opener: {
    start: () =>
      later(0.3, () => {
        const [Lc, Rc] = ends();
        if (Lc) trigger(Lc, 1, TALENTS.opener.n);
        if (Rc && Rc !== Lc)
          later(0.1, () => {
            if (!B!.over) trigger(Rc, 1, TALENTS.opener.n);
          });
      }),
  },
  bloodlust: {
    kill: () => {
      const b = bt();
      b.flags.kc = (b.flags.kc || 0) + 1;
      if (b.flags.kc % 12) return;
      for (const o of boardCards()) chargeCard(o, 0.15, null);
    },
  },
  revenge: {
    wall: () => {
      const b = bt();
      if (b.flags.revT > b.t - 1) return;
      b.flags.revT = b.t;
      const [, Rc] = ends();
      if (Rc) chargeCard(Rc, 0.4, null);
    },
  },
  echoer: {
    chain: () => {
      const b = bt();
      if (b.flags.echoT > b.t - 2) return;
      b.flags.echoT = b.t;
      G.wall = Math.min(G.wallMax, G.wall + 1);
      view.hud();
    },
  },
  f_sweep: {
    crit: (x) => {
      if (!x.src || kindOf(x.src) !== 'weapon' || !x.a || !x.e) return;
      for (const o of near(x.e, 16 * K())) hurt(o, x.a, x.src, false, { splash: 1, k: 't.f_sweep' });
    },
  },
};

/** 战报里「被谁触发」：没有冷却的卡写成「有卡点燃时」这类 / 'triggered by' in the report: cards without a cooldown read like 'when a card fires' */
export function passiveSrc(key: string) {
  const on = CARD_HOOKS[key]?.on;
  const evl = L.meta.evl as Record<string, string>;
  const k = on && Object.keys(on).find((k2) => evl[k2]);
  return k ? t('report.passiveOn', { ev: evl[k] }) : L.ui.report.passive;
}
