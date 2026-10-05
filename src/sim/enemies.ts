/* 敌人：出场、移动、光环、意图（首领招式）、撞墙、远程、复活 */
import { EN } from '../data/enemies';
import { ITEMS } from '../data/cards';
import { L, t } from '../i18n';
import { rand, rnd, pick, vr, vrnd } from '../core/rng';
import { clamp, fmt } from '../core/util';
import { G, heat } from '../game/state';
import { mv } from '../game/mods';
import { boardCards } from '../game/cards';
import { meetFoe, unlock } from '../game/meta';
import { foeKey } from '../game/foes';
import { world, K, ex, ey, WALLY } from './world';
import { view } from './view';
import { B, bt, later, emit, finish } from './battle';
import { hpScale, fixedScale } from './waves';
import { TUNE } from '../game/tuning';
import { hurt } from './combat';
import { frenzy } from './combo';
import type { Enemy } from './types';
import type { Card } from '../game/state';

const wg = (k: string) => !!B && B.wager === k;

export function spawn(type: string, x?: number | null, y?: number | null): Enemy {
  const b = bt();
  const d = EN[type];
  const sc = d.fixed
    ? fixedScale(G.round) * (d.boss ? TUNE.bossHp : 1)
    : hpScale(G.round) * (G.round === 1 ? 0.5 : G.round === 2 ? 0.6 : 0.7) * (heat(1) ? 1.15 : 1) * (heat(2) && (d.boss || d.elite) ? 1.25 : 1) * (wg('iron') ? 1.3 : 1);
  const e: Enemy = {
    d, type, x: x != null ? x : rnd(0.08, 0.92), y: y != null ? y : -0.04, x0: 0, hp: d.hp * sc, maxHp: d.hp * sc, armor: d.armor, shield: 0,
    slowT: 0, slowA: 0, burnT: 0, burnD: 0, burnSrc: null, burnTick: 0, poisonT: 0, poisonD: 0, poisonSrc: null, poisonTick: 0, frzT: 0, frzN: 0, vulnT: 0, vulnA: 0,
    flash: 0, ph: rand() * 6.28, armorB: 0, hasteB: 0, healT: rnd(1.5, 3), bornT: b.t, raiseT: rnd(3, 5),
    lobT: d.lob ? d.lob[0] * 0.6 : d.fbolt ? d.fbolt * 0.6 : 0, sprK: null, revealed: false, dashT: 0, hardT: 0, ii: 0, it: d.intents ? d.intents[0].t : 0, dead: false,
  };
  e.x0 = e.x;
  b.en.push(e);
  if ((d.boss || d.elite || d.big) && !b.flags['met' + type]) {
    b.flags['met' + type] = 1;
    later(1.2, () => view.say('hero', L.story.barks.elite, 2));
  }
  if (!d.fixed && e.y < 0) for (let i = 0; i < 4; i++) view.part(ex(e) + vrnd(-4, 4), world.top + vrnd(0, 3), vrnd(-8, 8), vrnd(5, 20), 0.5, vr() < 0.5 ? '#a64ca6' : '#5d275d', 1);
  if (!d.fixed && e.y > 0.1) {
    /* 从半路的雾里冒出来 */
    e.emerge = !d.mimic;
    const c = d.col || '#94b0c2';
    view.ring(ex(e), ey(e) - 2, 2, 10 * K(), c, 0.45);
    for (let i = 0; i < 10; i++) view.part(ex(e) + vrnd(-5, 5), ey(e) - vrnd(0, 2), vrnd(-18, 18), -vrnd(15, 40), 0.5, vr() < 0.5 ? c : '#4a3326', 1);
  }
  if (d.boss || d.elite) {
    b.boss = e;
    view.boss(e);
    const FOEB = L.story.foe as Record<string, any>;
    if (FOEB[type]) view.say(type, FOEB[type].spawn, 3);
  }
  if (!d.fixed) {
    if (d.tip) {
      const m = meetFoe(type);
      if (m) {
        view.meetFoe(type, m.firstEver);
        if (d.intro) view.say(d.intro[0], d.intro[1], 2);
      }
    }
  } else meetFoe(type);
  return e;
}

/** 光环（护甲 / 加速 / 治疗）和每个敌人的移动、状态、招式 */
export function enemyStep(dt: number) {
  const b = bt();
  for (const e of b.en) {
    e.armorB = 0;
    e.hasteB = 0;
  }
  for (const s of b.en) {
    if (s.dead || !s.d.aura || s.y < -0.02) continue;
    const R2 = s.d.aura * K();
    for (const o of b.en) {
      if (o === s || o.dead || o.d.aura) continue;
      if (Math.hypot(ex(o) - ex(s), ey(o) - ey(s)) > R2) continue;
      if (s.d.guard) o.armorB = Math.max(o.armorB, s.d.guard);
      if (s.d.haste) o.hasteB = Math.max(o.hasteB, s.d.haste);
    }
    if (s.d.heal) {
      s.healT -= dt;
      if (s.healT <= 0) {
        s.healT = 3;
        let any = false;
        for (const o of b.en) {
          if (o.dead || o.hp >= o.maxHp || Math.hypot(ex(o) - ex(s), ey(o) - ey(s)) > R2) continue;
          const h = o.maxHp * s.d.heal;
          o.hp = Math.min(o.maxHp, o.hp + h);
          any = true;
          view.num(ex(o), ey(o) - 12, '+' + fmt(h), '#7ee8a2', 1);
          for (let i = 0; i < 3; i++) view.part(ex(o) + vrnd(-3, 3), ey(o) - vrnd(2, 8), 0, -vrnd(10, 20), 0.5, '#a7f070', 1);
        }
        if (any) view.ring(ex(s), ey(s) - 5, 3, R2, '#7ee8a2', 0.5);
      }
    }
  }
  for (const e of b.en) {
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.slowT > 0) {
      e.slowT -= dt;
      if (e.slowT <= 0) e.slowA = 0;
    }
    if (e.hardT > 0) e.hardT -= dt;
    if (e.vulnT > 0) {
      e.vulnT -= dt;
      if (e.vulnT <= 0) e.vulnA = 0;
    }
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnTick += dt;
      if (e.burnTick >= 0.5) {
        e.burnTick -= 0.5;
        hurt(e, e.burnD * 0.5, e.burnSrc, false, { burnTick: 1 });
        if (e.dead) continue;
      }
      if (vr() < 0.25) view.part(ex(e) + vrnd(-4, 4), ey(e) - vrnd(2, 8), vrnd(-5, 5), -vrnd(10, 25), 0.4, vr() < 0.5 ? '#ef7d57' : '#ffcd75', 1);
    }
    if (e.poisonT > 0) {
      e.poisonT -= dt;
      e.poisonTick += dt;
      if (e.poisonTick >= 0.5) {
        e.poisonTick -= 0.5;
        hurt(e, e.poisonD * 0.5, e.poisonSrc, false, { poisonTick: 1 });
        if (vr() < 0.35) view.part(ex(e), ey(e) - 8, vrnd(-12, 12), vrnd(-24, -4), 0.45, '#7ddc5f', 1);
        if (e.dead) continue;
      }
    }
    if (e.d.intents) {
      e.it -= dt;
      if (e.it <= 0) {
        doIntent(e);
        if (b.over) return;
      }
    }
    let sp = e.d.spd * (1 - e.slowA) * (1 + mv('enemySpd') + (heat(7) ? 0.1 : 0) + (wg('rush') ? 0.2 : 0)) * (1 + e.hasteB);
    if (e.dashT > 0) {
      e.dashT -= dt;
      sp *= 3;
    }
    if (e.rushT) {
      e.rushT = Math.max(0, e.rushT - dt);
      if (e.rushT > 0) sp *= 1.5;
    }
    if (e.d.rage) sp *= 1 + e.d.rage * (1 - e.hp / e.maxHp);
    if (e.d.dive && e.y > 0.45) sp *= e.d.dive;
    if (e.revealed) sp *= 2.4;
    if (e.d.stopAt && e.y >= e.d.stopAt && e.dashT <= 0) sp = 0;
    if (e.frzT > 0) {
      e.frzT -= dt;
      sp = 0;
    }
    if (e.d.lob && e.y >= e.d.stopAt! - 0.02) {
      e.lobT -= dt;
      if (e.lobT <= 0) {
        e.lobT = e.d.lob[0];
        lobRock(e);
      }
    }
    if (e.d.fbolt && e.y >= e.d.stopAt! - 0.02) {
      e.lobT -= dt;
      if (e.lobT <= 0) {
        e.lobT = e.d.fbolt;
        frostBolt(e);
      }
    }
    if (e.d.raise && e.y > 0) {
      e.raiseT -= dt;
      if (e.raiseT <= 0) {
        e.raiseT = 5;
        raiseDead(e);
      }
    }
    e.y += sp * dt;
    if (e.d.zig) e.x = clamp(e.x0 + Math.sin(b.t * 3 + e.ph) * 0.07, 0.04, 0.96);
    if (e.y >= 1) {
      wallHit(e);
      if (b.over) return;
    }
  }
}


/* ---------------- 撞墙 ---------------- */
function wallHit(e: Enemy) {
  const b = bt();
  e.dead = true;
  if (!b.wallBy) b.wallBy = {};
  b.wallBy[e.type] = (b.wallBy[e.type] || 0) + e.d.wall;
  damageWall(e.d.wall, ex(e), e.d.bomb ? 'boom' : null);
  if (!b.over && e.d.chill) chillCard(e.d.chill);
  if (b.ambush && e.d.elite) b.fled = 1;
}

/** 霜潮的大家伙撞墙：冻住你一张卡 */
function chillCard(t: number) {
  const bc = boardCards().filter((c) => c.frozen <= 0);
  if (!bc.length) return;
  const c = pick(bc);
  c.frozen = t;
  view.cardFlag(c, 'frozen', true);
  if (vr() < 0.5) view.say('hero', L.story.barks.freeze, 1);
}

export function damageWall(d: number, xx: number, kind?: 'boom' | null) {
  const b = bt();
  const e = { x: xx / world.W, y: 1 };
  if (wg('brittle')) d *= 1.5;
  if (b.ambush) d *= 0.5;
  const ab = Math.min(b.shield, d);
  b.shield -= ab;
  d -= ab;
  if (G.run) G.run.wallLost += d;
  if (kind === 'boom') view.boom(xx, WALLY() - 2, 16 * K(), '#ef7d57');
  G.wall -= d;
  b.wallLost += d;
  view.wallFlash();
  view.shake(d > 0 ? 4 : 1.5);
  view.sfx('hurt');
  for (let i = 0; i < 10; i++) view.part(ex(e) + vrnd(-6, 6), WALLY(), vrnd(-30, 30), -vrnd(20, 50), 0.5, '#e43b44', 2);
  if (d > 0) view.num(ex(e), WALLY() - 6, '-' + Math.ceil(d), '#ff5a5a', 2);
  view.hud();
  if (d > 0) {
    view.buzz(d >= 5 ? 60 : 25);
    view.tip('wall', L.ui.tips.wall, 300);
  }
  emit('wall', { d });
  if (b.over) return;
  if (d > 0) {
    if (!b.lowSaid && G.wall < G.wallMax * 0.35 && G.wall > 0) {
      b.lowSaid = true;
      view.say('hero', L.story.barks.low, 2);
      view.tip('low', L.ui.tips.low, 1500);
    } else if (vr() < 0.5) view.say('hero', L.story.barks.hurt, 1);
    else view.say('soldier', L.story.barks.soldierHurt, 1);
  }
  if (G.wall <= 0) finish('lose');
}

/* ---------------- 意图（首领、精英的招式） ----------------
 * 招式表：每招一个函数，收到放招的敌人和招式参数 v（数量 / 秒数 / 比例，不填用默认）、k（招来的小怪）。
 * 数据里的首领（含模组加的）只能从这张表里挑招式组合。 */
type IntentFn = (e: Enemy, v: number | undefined, k: string | undefined) => void;
/** 在首领身边招一批小怪 */
function summonAt(e: Enemy, k: string, n: number, spread: number, dy = 0) {
  for (let i = 0; i < n; i++) {
    const s = spawn(foeKey(k), clamp(e.x + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * spread) + rnd(-0.03, 0.03), 0.05, 0.95), Math.max(-0.02, e.y + dy));
    s.x0 = s.x;
  }
}
const randomCards = (n: number) => {
  const bc = boardCards().filter((c) => c.frozen <= 0);
  const out: Card[] = [];
  for (let i = 0; i < n && bc.length; i++) out.push(bc.splice(Math.floor(rand() * bc.length), 1)[0]);
  return out;
};
export const INTENTS: Record<string, IntentFn> = {
  /** 护盾：最大血量的 v（默认 15%） */
  shield: (e, v) => {
    e.shield += e.maxHp * (v ?? 0.15);
  },
  /** 冲锋：v 秒内三倍速 */
  dash: (e, v) => {
    e.dashT = v ?? 2;
  },
  /** 硬化：v 秒内护甲 +10 */
  harden: (e, v) => {
    e.hardT = v ?? 4;
  },
  /** 召唤蝙蝠（k 可换） */
  summon: (e, v, k) => summonAt(e, k || 'bat', v ?? 6, 0.25, -0.02),
  /** 凝视：随机冻住你 v 张卡 3 秒 */
  gaze: (_e, v) => {
    for (const c of randomCards(v ?? 2)) {
      c.frozen = 3;
      view.cardFlag(c, 'frozen', true);
    }
    view.toast(L.ui.battle.gazed);
    view.say('hero', L.story.barks.freeze, 2);
  },
  /** 怒吼：身边的敌人一起冲锋 3 秒 */
  roar: (e) => {
    const R = 40 * K();
    for (const o of bt().en) if (!o.dead && o !== e && Math.hypot(ex(o) - ex(e), ey(o) - ey(e)) <= R) o.dashT = Math.max(o.dashT || 0, 3);
    view.ring(ex(e), ey(e) - 6, 4, R, '#e43b44', 0.5);
  },
  /** 震地：冻住你一张卡 2 秒 */
  quake: () => {
    for (const c of randomCards(1)) {
      c.frozen = 2;
      view.cardFlag(c, 'frozen', true);
    }
    view.shake(6);
  },
  /** 招骷髅（k 可换） */
  skels: (e, v, k) => summonAt(e, k || 'skel', v ?? 3, 0.08, -0.03),
  /** 产卵：招虫子 */
  brood: (e, v, k) => summonAt(e, k || 'bug', v ?? 4, 0.22, 0.02),
  /** 吸走你所有卡的充能（剩 1-v） */
  drain: (_e, v) => {
    for (const c of boardCards()) {
      c.charge *= 1 - (v ?? 0.5);
      view.cardFx(c, 'shake');
    }
    view.toast(L.ui.battle.drained);
  },
  /** 蜕壳：护盾 v */
  molt: (e, v) => {
    e.shield += e.maxHp * (v ?? 0.12);
  },
  /* ---- 哑钟 ---- */
  /** 敲丧钟：最近倒下的 v 个敌人变成游魂站起来；坟不够就在钟边上冒出来 */
  toll: (e, v) => {
    const b = bt();
    const n = v ?? 4;
    const gs = b.graves.splice(-n);
    for (const g of gs) {
      const s = spawn(foeKey('ghost'), g.x, g.y);
      s.raised = true;
      s.x0 = s.x;
      view.ring(ex(s), ey(s) - 4, 1, 10 * K(), '#c9b37a', 0.35);
    }
    if (gs.length < n) summonAt(e, 'ghost', n - gs.length, 0.18, 0.03);
    view.ring(ex(e), ey(e), 4, 80 * K(), '#c9b37a', 0.4);
  },
  /** 噤声：v 秒内卡牌之间不再互相带动（回响、齐鸣、遗物带出的出手都不算） */
  hush: (_e, v) => {
    const b = bt();
    b.flags.hushT = b.t + (v ?? 4);
    view.toast(L.ui.battle.hushed);
  },
  /** 余音：场上每个敌人得到最大血量 v 的护盾 */
  knell: (e, v) => {
    for (const o of bt().en) if (!o.dead && o !== e) o.shield += o.maxHp * (v ?? 0.15);
    view.ring(ex(e), ey(e), 4, 120 * K(), '#fff1b0', 0.35);
  },
  /* ---- 雾母 ---- */
  /** 雾幕：v 秒内射程线往下压，敌人要走得更近才打得到 */
  veil: (_e, v) => {
    const b = bt();
    b.flags.veilT = b.t + (v ?? 5);
    view.toast(L.ui.battle.veiled);
  },
  /** 引魂：所有小怪冲锋 v 秒 */
  lure: (e, v) => {
    for (const o of bt().en) if (!o.dead && o !== e && !o.d.boss) o.dashT = Math.max(o.dashT || 0, v ?? 2);
  },
  /** 摸金：偷走 v 金（打倒她连本带利还回来） */
  pilfer: (e, v) => {
    const b = bt();
    const n = Math.min(G.gold, v ?? 2);
    if (!n) return;
    G.gold -= n;
    b.flags.stolen = (b.flags.stolen || 0) + n;
    view.coins(ex(e), ey(e), n);
    view.hud();
    view.toast(t('battle.pilfered', { n }));
  },
  /* ---- 攻城王 ---- */
  /** 放兵：v 个骷髅加一个盾卫 */
  deploy: (e, v, k) => {
    summonAt(e, k || 'skel', v ?? 4, 0.14, 0.04);
    summonAt(e, 'shieldb', 1, 0, 0.05);
  },
  /** 齐射：2 秒内往城墙上砸 v 块石头 */
  barrage: (e, v) => {
    const n = v ?? 4;
    for (let i = 0; i < n; i++) later(0.45 * i, () => !bt().over && !e.dead && lobRock(e, 1.5));
  },
  /** 撞城：v 秒三倍速往前冲 */
  ram: (e, v) => {
    e.dashT = v ?? 2.5;
    view.shake(5);
  },
  /* ---- 隐藏首领 ---- */
  /** 决斗：你伤害最高的那张卡被挑住，v 秒动不了 */
  duel: (_e, v) => {
    const c = boardCards()
      .filter((x) => ITEMS[x.key].dmg > 0 && x.frozen <= 0)
      .sort((a, b) => b.bDmg - a.bDmg)[0];
    if (!c) return;
    c.frozen = v ?? 4;
    view.cardFlag(c, 'frozen', true);
    view.toast(t('battle.dueled', { n: ITEMS[c.key].n }));
  },
  /** 点兵：v 个倒下的守夜人（盾卫带骷髅）站起来 */
  muster: (e, v) => {
    summonAt(e, 'shieldb', v ?? 3, 0.2, 0.03);
    summonAt(e, 'skel', (v ?? 3) * 2, 0.26, 0.02);
  },
  /** 倒转：你棋盘上最多的那种元素，v 秒内伤害 -40% */
  invert: (_e, v) => {
    const b = bt();
    const n: Record<string, number> = {};
    for (const c of boardCards()) if (ITEMS[c.key].dmg > 0) n[ITEMS[c.key].tag] = (n[ITEMS[c.key].tag] || 0) + 1;
    const tag = Object.keys(n).sort((a, z) => n[z] - n[a])[0];
    if (!tag) return;
    b.flags.invTag = tag;
    b.flags.invT = b.t + (v ?? 5);
    view.toast(t('battle.inverted', { t: (L.terms.tags as Record<string, string>)[tag] }));
  },
  /** 掐灯：你所有卡的充能清零 */
  snuff: () => {
    for (const c of boardCards()) {
      c.charge = 0;
      c.hasteT = 0;
      view.cardFlag(c, 'haste', false);
      view.cardFx(c, 'shake');
    }
    view.toast(L.ui.battle.snuffed);
  },
  /** 上弦：所有小怪 v 秒内快一半 */
  wind: (e, v) => {
    for (const o of bt().en) if (!o.dead && o !== e) o.rushT = Math.max(o.rushT || 0, v ?? 4);
  },
  /** 补墙：回 v 的最大血量 */
  rebuild: (e, v) => {
    const h = e.maxHp * (v ?? 0.06);
    e.hp = Math.min(e.maxHp, e.hp + h);
    view.num(ex(e), ey(e) - 16, '+' + fmt(h), '#7ee8a2', 2);
  },
  /** 星蚀：v 秒内你打不出暴击，C 位冻住 2 秒 */
  eclipse: (_e, v) => {
    const b = bt();
    b.flags.eclipseT = b.t + (v ?? 5);
    const c = boardCards().find((x) => x.carry);
    if (c) {
      c.frozen = Math.max(c.frozen, 2);
      view.cardFlag(c, 'frozen', true);
    }
    view.toast(L.ui.battle.eclipsed);
  },
  /** 坠星：v 颗星砸在墙上，每颗冻住你一张卡 2 秒、城墙 -1 */
  starfall: (e, v) => {
    const cs = randomCards(v ?? 3);
    cs.forEach((c, i) =>
      later(0.25 * i, () => {
        if (bt().over) return;
        view.bolt([[ex(e), ey(e)], [c.ox, world.H]], '#fff1b0', 0.25, true);
        c.frozen = Math.max(c.frozen, 2);
        view.cardFlag(c, 'frozen', true);
        damageWall(1, c.ox);
      }),
    );
  },
  /** 引力：所有敌人往城墙挪 v（0~1 的路程） */
  gravity: (e, v) => {
    for (const o of bt().en) if (!o.dead && o !== e && !o.d.boss) o.y = Math.min(0.95, o.y + (v ?? 0.06));
    view.ring(ex(e), ey(e), 4, 120 * K(), '#fff1b0', 0.3);
  },
};

function doIntent(e: Enemy) {
  const it = e.d.intents![e.ii];
  view.sfx('intent');
  view.shake(3);
  view.ring(ex(e), ey(e) - 8, 4, 40, '#ff5a5a', 0.45);
  INTENTS[it.a]?.(e, it.v, it.k);
  view.banner(it.n, '#ff8a70');
  const FOEB = L.story.foe as Record<string, any>;
  if (FOEB[e.type] && FOEB[e.type].intent?.[it.a] && vr() < 0.7) view.say(e.type, FOEB[e.type].intent[it.a], 2);
  e.ii = (e.ii + 1) % e.d.intents!.length;
  e.it = e.d.intents![e.ii].t;
}

/* ---------------- 远程：投石车 / 冰晶法师 ---------------- */
function lobRock(e: Enemy, d?: number) {
  bt().epr.push({ x0: ex(e), y0: ey(e) - 6, x1: ex(e) + vrnd(-8, 8), y1: WALLY() - 1, t: 0, dur: 1.1, d });
  view.sfx('fire', 'mech');
}
export function stepERocks(dt: number) {
  const b = bt();
  for (const r of b.epr) {
    r.t += dt;
    if (r.t >= r.dur && !r.done) {
      r.done = true;
      for (let i = 0; i < 8; i++) view.part(r.x1, r.y1, vrnd(-30, 30), -vrnd(10, 40), 0.4, '#566c86', 2);
      damageWall(r.d ?? (b.en.length ? EN.catapult.lob![1] : 1), r.x1);
      if (b.over) return;
    }
  }
  b.epr = b.epr.filter((r) => !r.done);
}

/** 冰晶法师：每隔几秒冻住你一张卡 */
function frostBolt(e: Enemy) {
  const bc = boardCards().filter((c) => c.frozen <= 0);
  if (!bc.length) return;
  const c = pick(bc);
  view.bolt([[ex(e), ey(e) - 6], [c.ox, world.H]], '#c2f4ff', 0.25, true);
  view.sfx('intent');
  c.frozen = 1.5;
  view.cardFlag(c, 'frozen', true);
}

/* ---------------- 死灵法师：让附近倒下的敌人站起来 ---------------- */
function raiseDead(e: Enemy) {
  const b = bt();
  const R = 50 * K();
  const gs = b.graves.filter((g) => Math.hypot(g.x * world.W - ex(e), world.top + g.y * (WALLY() - 2 - world.top) - ey(e)) <= R).slice(-e.d.raise!);
  for (const g of gs) {
    b.graves.splice(b.graves.indexOf(g), 1);
    const s = spawn(e.d.raiseAs || 'skel', g.x, g.y);
    s.raised = true;
    s.x0 = s.x;
    view.bolt([[ex(e), ey(e) - 8], [ex(s), ey(s) - 5]], '#b77cff', 0.25, true);
    view.ring(ex(s), ey(s) - 4, 1, 10 * K(), '#b77cff', 0.35);
  }
  if (gs.length) {
    view.sfx('intent');
    if (vr() < 0.35) view.say('soldier', L.story.barks.raised, 1);
  }
}

/** 大军压境 */
export function surge() {
  view.banner(L.ui.battle.surge, '#ff8a5b');
  view.sfx('intent');
  view.sfx('boom');
  view.shake(5);
  view.say('soldier', L.story.barks.soldierSurge, 2);
  view.say('hero', L.story.barks.surge, 2);
}

/* ---------------- 连杀：1 秒内接着杀就续上，每 25 连杀掉 1 金 ---------------- */
export function comboKill(e: Enemy) {
  const b = bt();
  const c = (b.combo = b.t - (b.lastKill == null ? -9 : b.lastKill) < 1 ? (b.combo || 0) + 1 : 1);
  b.lastKill = b.t;
  if (c > b.maxCombo) b.maxCombo = c;
  if (c >= 50) unlock('combo50');
  if (c >= 120) unlock('combo120');
  if (c >= 5) view.combo(c);
  const fz = frenzy(c);
  if (c % 25 === 0) {
    G.gold++;
    view.coins(ex(e), ey(e), 1);
    view.sfx('coin');
    view.hud();
    const T = L.ui.battle.comboBanner;
    if (!fz) view.banner(c >= 75 ? T[2] : c >= 50 ? T[1] : T[0], '#ffb37a');
  }
}
