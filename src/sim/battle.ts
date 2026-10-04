/* 一场战斗：状态、开场、逐帧推进、事件分发、收尾。
 * 模拟按固定步长（1/60 秒）推进，规则随机只走 rng，给定种子和阵容结果完全一样。 */
import { ITEMS } from '../data/cards';
import { WAGERS } from '../data/meta';
import { TALENTS } from '../data/talents';
import { L } from '../i18n';
import { clamp } from '../core/util';
import { G, type Wave } from '../game/state';
import { mv, recalcMods } from '../game/mods';
import { boardCards, neighbors, rightOf, maxAmmo, stats, finishQuests } from '../game/cards';
import { unlock } from '../game/meta';
import { synCount } from '../game/synergy';
import { world, RANGE0, ex, ey } from './world';
import { TUNE } from '../game/tuning';
import { view } from './view';
import { CARD_HOOKS, RELIC_HOOKS, TALENT_HOOKS, passiveSrc } from './hooks';
import { trigger, stepProj, canFire } from './combat';
import { spawn, enemyStep, stepERocks, surge } from './enemies';
import type { Battle, Enemy } from './types';

export let B: Battle | null = null;
/** 战斗结束时调用（界面层接管后续流程：战报、拦路结算、城破……） */
let onEnd: (b: Battle) => void = () => {};
export const setOnEnd = (f: (b: Battle) => void) => {
  onEnd = f;
};
export const clearBattle = () => {
  B = null;
};

/** 战斗中的 B（调用方保证在战斗里） */
export const bt = () => B!;

export function later(dt: number, f: () => void) {
  B!.sched.push({ t: dt, f });
}

/* ---------------- 事件：卡牌 / 遗物 / 天赋声明的钩子在这里被调用 ----------------
 * 每张卡每种事件每秒最多响应 8 次，防止互相触发成死循环 */
function evOk(log: Record<string, number[]>, k: string, cap: number) {
  const a = (log[k] = (log[k] || []).filter((t) => t > B!.t - 1));
  if (a.length >= cap) return false;
  a.push(B!.t);
  return true;
}
export function emit(ev: string, x: Record<string, any> = {}) {
  if (!B || B.over || G.phase !== 'battle') return;
  for (const c of boardCards()) {
    const h = CARD_HOOKS[c.key]?.on?.[ev];
    if (!h || c.frozen > 0) continue;
    if (!evOk(c.evLog || (c.evLog = {}), ev, 8)) continue;
    h(c, x);
    if (B.over) return;
  }
  for (const r of new Set(G.relics)) {
    const h = RELIC_HOOKS[r]?.[ev];
    if (!h) continue;
    if (!evOk(B.rlog, r + ev, 8)) continue;
    h(G.relics.filter((y) => y === r).length, x);
    if (B.over) return;
  }
  for (const s of G.skills) {
    const h = TALENTS[s] && TALENT_HOOKS[s]?.[ev];
    if (!h) continue;
    if (!evOk(B.rlog, 'T' + s + ev, 8)) continue;
    h(x);
    if (B.over) return;
  }
}

/* ---------------- 开场 ---------------- */
export interface StartOpts {
  wave: Wave;
  ambush: boolean;
  wager: string | null;
  beats: any[];
}

/** 开战时记下这一夜的阵容（成就用） */
function noteLineup() {
  const R = G.run;
  if (!R) return;
  const bc = boardCards();
  R.maxBoard = Math.max(R.maxBoard, bc.length);
  const tags = new Set(bc.map((c) => ITEMS[c.key].tag));
  R.lastPure = bc.length >= 4 && tags.size === 1;
  R.lastSmall = bc.length >= 5 && bc.every((c) => c.size === 1);
  R.lastBig = bc.length >= 1 && bc.every((c) => c.size === 3);
  if (bc.filter((c) => c.tier >= 3).length >= 3) unlock('dia3');
  const n = synCount();
  for (const t in n) {
    if (n[t as keyof typeof n]! >= 4) unlock('syn4');
    if (n[t as keyof typeof n]! >= 6) unlock('syn6');
  }
}

export function startBattle(o: StartOpts): Battle {
  B = {
    t: 0, spawns: o.wave, si: 0, en: [], pr: [], epr: [], graves: [], sched: [], shield: 0, maxChain: 0, wallLost: 0, endT: 0, over: false,
    acc: 0, boss: null, greed: 0, kills: 0, flags: {}, rlog: {}, beats: o.beats, bi: 0, surges: (o.wave.surges || []).slice(),
    lowSaid: false, wager: o.wager, ambush: o.ambush, maxCombo: 0, combo: 0, maxHit: 0, slowT: 0,
  };
  for (const c of G.cards) {
    Object.assign(c, { charge: 0, mom: 0, bDmg: 0, bTrig: 0, bSrc: {}, bCh: 0, bHs: 0, bRl: 0, bBf: 0, bTr: 0, frozen: 0, echoLog: [], evLog: {}, hasteT: 0, stk: 0, lastT: -9, lastFire: -9, rage: 0, cnt: 0 });
    c.ammo = maxAmmo(c);
    view.cardFlag(c, 'frozen', false);
    view.cardFlag(c, 'haste', false);
    view.cardAmmo(c);
  }
  for (const c of boardCards()) {
    c.nb = neighbors(c);
    c.right = rightOf(c);
    c.anvil = 0;
    c.charge = mv('startCharge');
  }
  recalcMods();
  noteLineup();
  if (B.wager === 'dark')
    for (const c of boardCards()) {
      c.frozen = 2.5;
      view.cardFlag(c, 'frozen', true);
    }
  B.shield = mv('shieldStart');
  world.range = clamp(RANGE0 + mv('range'), 0.05, 0.35);
  for (const c of boardCards()) c.ox = world.originX(c);
  if (B.wager) later(0.6, () => view.banner(L.ui.battle.wager + WAGERS[B!.wager!].n, '#ff8a5b'));
  emit('start', {});
  return B;
}

/* ---------------- 逐帧 ---------------- */
export function simStep(dt: number) {
  const b = B!;
  b.t += dt;
  while (b.bi < b.beats.length && b.beats[b.bi][0] <= b.t) {
    const x = b.beats[b.bi++];
    view.say(x[1], x[2], 3);
  }
  if (b.surges.length && b.surges[0] <= b.t) {
    b.surges.shift();
    surge();
  }
  while (b.si < b.spawns.length && b.spawns[b.si].t <= b.t) {
    const s = b.spawns[b.si];
    spawn(s.type, s.x, s.y);
    b.si++;
  }
  for (let i = b.sched.length - 1; i >= 0; i--) {
    const s = b.sched[i];
    s.t -= dt;
    if (s.t <= 0) {
      b.sched.splice(i, 1);
      s.f();
      if (b.over) return;
    }
  }
  for (const c of boardCards()) {
    if (c.frozen > 0) {
      c.frozen -= dt;
      if (c.frozen <= 0) view.cardFlag(c, 'frozen', false);
      continue;
    }
    const it = ITEMS[c.key];
    if (c.ammo === 0) {
      c.charge = Math.min(c.charge, 1);
      continue;
    }
    if (c.hasteT > 0) {
      c.hasteT -= dt;
      if (c.hasteT <= 0) view.cardFlag(c, 'haste', false);
    }
    if (it.passive && !it.dmg) {
      c.charge = 1;
      continue;
    }
    if (!it.passive) {
      const st = stats(c, b.t);
      c.charge += (dt / st.cd) * (c.hasteT > 0 ? 2 : 1);
    }
    if (c.charge >= 1) {
      /* 离上次触发不到一个普朗克时间：先攒着，下一帧再说 */
      if (ITEMS[c.key].dmg > 0 && !hasTarget()) c.charge = 1;
      else if (!canFire(c)) c.charge = Math.min(c.charge, 1.5);
      else {
        c.charge -= 1;
        if (c.charge > 1) c.charge = 0.99;
        trigger(c, 0, it.passive ? passiveSrc(c.key) : L.ui.report.cooldown);
      }
    }
  }
  enemyStep(dt);
  if (b.over) return;
  b.en = b.en.filter((e) => !e.dead);
  stepERocks(dt);
  if (b.over) return;
  for (const p of b.pr) stepProj(p, dt);
  b.pr = b.pr.filter((p) => !p.done);
  if (!b.endT && b.si >= b.spawns.length && !b.en.length && !b.pr.length && !b.epr.length) b.endT = b.t + 0.9;
  if (b.endT && b.t >= b.endT) finish('win');
}

/* ---------------- 目标 ---------------- */
export const phased = (e: { d: { phase?: number }; ph: number }) => !!e.d.phase && (B!.t + e.ph) % 3.2 > 2.0;
export const rising = (e: { emerge?: boolean; bornT: number }) => !!e.emerge && B!.t - e.bornT < 0.5;
/** 卡牌的目标：最靠近城墙、能被打到的敌人。
 * 精英和首领算「更靠前」一截（TUNE.eliteFocus），不然它们跟在小怪后面，单体输出的卡永远打不到，直到撞墙 */
export function front() {
  let b: Enemy | null = null,
    bv = -1;
  /* 雾母的雾幕：射程线往下压 */
  const rg = world.range + (B!.flags.veilT > B!.t ? TUNE.veil : 0);
  for (const e of B!.en) {
    if (e.dead || e.y < rg || phased(e) || rising(e)) continue;
    const v = e.y + (e.d.elite || e.d.boss ? TUNE.eliteFocus : 0);
    if (v > bv) {
      bv = v;
      b = e;
    }
  }
  return b;
}
export const hasTarget = () => !!front();
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(ex(a) - ex(b), ey(a) - ey(b));
export const near = (e: { x: number; y: number }, R: number) => B!.en.filter((o) => !o.dead && o !== e && Math.hypot(ex(o) - ex(e), ey(o) - ey(e)) <= R);

/* ---------------- 收尾 ---------------- */
export function finish(result: 'win' | 'lose') {
  const b = B!;
  b.over = true;
  b.result = result;
  if (result === 'lose') G.wall = b.ambush ? Math.max(1, G.wall) : 0;
  onEnd(b);
}

/** 守住一夜后的结算（不含界面）：统计、珍藏、成长、任务、卡牌状态复位 */
export function settleWin() {
  const b = B!;
  G.bestChain = Math.max(G.bestChain, b.maxChain);
  if (G.run) {
    G.run.kills += b.kills;
    G.run.maxHit = Math.max(G.run.maxHit, b.maxHit);
    G.run.maxCombo = Math.max(G.run.maxCombo, b.maxCombo);
  }
  if (!b.ambush) {
    if (b.kills >= 150) unlock('kills150');
    for (const c of G.cards) if (c.adj === 'hoard') c.hoard++;
    for (const c of boardCards()) CARD_HOOKS[c.key]?.onWin?.(c);
  }
  const quests = b.ambush ? [] : finishQuests();
  resetCards();
  return quests;
}

/** 战斗结束后卡牌回到备战状态 */
export function resetCards() {
  for (const c of G.cards) {
    c.charge = 0;
    c.ammo = maxAmmo(c);
    view.cardFlag(c, 'frozen', false);
    view.cardFlag(c, 'haste', false);
    view.cardAmmo(c);
  }
}

