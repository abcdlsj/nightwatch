/* 出怪表：每夜一张固定的编排，数量和血量随夜数、难度涨 */
import { EN, ELITES } from '../data/enemies';
import { rand, rnd, pick } from '../core/rng';
import { clamp } from '../core/util';
import { G, heat, type Wave } from '../game/state';
import { foeKey } from '../game/foes';
import { noScale } from '../game/prep';
import { TUNE } from '../game/tuning';
import { NIGHTS, nightBoss, finalBosses, lastNight } from '../game/plan';

type Pack = (comp: Record<string, number>, n: number, t0: number, t1: number) => void;
type Boss = (k: string, t: number) => void;

/** 敌人血量倍率（首领和固定数值的除外）：每夜成长，第 6 夜起再加一截；
 * 第 8、9 夜按第 7 夜的倍数单独定（多出来的一夜让玩家多一轮备战，怪不必再翻一倍）；之后（完整线、无尽）每夜一个慢一点的倍率 */
export const hpScale = (r: number) => {
  const at = (n: number) => Math.pow(TUNE.hpGrowth, n - 1) * Math.pow(TUNE.lateHp, Math.max(0, n - 5));
  if (r <= 7) return at(r);
  if (r === 8) return at(7) * TUNE.hp8;
  return at(7) * TUNE.hp9 * Math.pow(TUNE.afterHp, r - NIGHTS);
};
/** 首领和固定数值的敌人：第 9 夜以前不变，之后每夜涨 */
export const fixedScale = (r: number) => (r > NIGHTS ? Math.pow(TUNE.bossAfter, r - NIGHTS) : 1);

export function makeWave(r: number): Wave {
  const S: Wave = [];
  const pack: Pack = (comp, n, t0, t1) => {
    /* 数量随夜数涨，第 11 夜封顶（再多手机上跑不动，后面靠血量涨） */
    const DN = (1.15 + 0.1 * Math.min(r, 11)) * (heat(5) ? 1.15 : 1);
    n = Math.round(n * DN);
    comp = Object.fromEntries(
      Object.entries(comp).map(([k, v]) => [k, EN[k].aura || noScale(k) ? v : Math.round(v * (r >= 5 ? 1.45 : r >= 3 ? 1.3 : 1.1))]),
    );
    for (let g = 0; g < n; g++) {
      const t = Math.max(0, t0 + (t1 - t0) * (n <= 1 ? 0 : g / (n - 1)) + rnd(-0.6, 0.6));
      const cx = rnd(0.2, 0.8);
      const mem: string[] = [];
      for (const k in comp) for (let i = 0; i < comp[k]; i++) mem.push(k);
      const sup = mem.filter((k) => EN[k].aura),
        rest = mem.filter((k) => !EN[k].aura);
      const cols = Math.min(5, Math.max(1, rest.length));
      /* 游魂有一半时候不从北边来，直接在半路的雾里冒出来 */
      const mid = comp.ghost && rand() < 0.5 ? rnd(0.3, 0.44) : null;
      rest.forEach((k, i) => {
        const row = Math.floor(i / cols),
          col = i % cols;
        S.push({
          type: k,
          t: t + row * 0.35 + rnd(0, 0.1),
          x: clamp(cx + (col - (cols - 1) / 2) * 0.085 + rnd(-0.015, 0.015), 0.05, 0.95),
          y: mid != null && k === 'ghost' ? mid + row * 0.05 : -0.04 - rnd(0, 0.02),
        });
      });
      sup.forEach((k, i) => S.push({ type: k, t: t + 0.7 + i * 0.2, x: clamp(cx + (i - (sup.length - 1) / 2) * 0.1, 0.06, 0.94), y: -0.05 }));
    }
  };
  const boss: Boss = (k, t) => S.push({ type: k, t, x: 0.5, y: -0.04 });
  /** 大军压境的时间点 */
  const SG: Record<number, number[]> = { 1: [15], 2: [17], 3: [18], 4: [16], 5: [17], 6: [19], 7: [12, 26], 8: [14, 28], 9: [22], 10: [16], 11: [12, 26], 12: [24], 13: [14, 28], 14: [10, 22, 34], 15: [26] };
  const bk = nightBoss(r);
  switch (G.endless ? 0 : r) {
    case 1: pack({ slime: 5 }, 5, 0.5, 22); pack({ slime: 3 }, 3, 6, 20); pack({ slime: 6 }, 1, 15, 15); break;
    case 2: pack({ slime: 5 }, 4, 0, 22); pack({ bat: 4 }, 4, 4, 24); pack({ bomber: 2 }, 2, 10, 20); pack({ bat: 4, slime: 3 }, 1, 17, 17); break;
    case 3: pack({ slime: 5 }, 2, 0, 22); pack({ bug: 2 }, 2, 8, 20); pack({ bat: 4 }, 3, 3, 22); pack({ skel: 3, shieldb: 1 }, 2, 6, 24); pack({ ghost: 2 }, 2, 6, 20); pack({ skel: 3, bomber: 1 }, 1, 18, 18); break;
    case 4: boss('knight', 2); pack({ skel: 2, shieldb: 1 }, 2, 4, 18); pack({ bat: 4 }, 3, 6, 24); pack({ slime: 5 }, 3, 0, 22); pack({ mimic: 1 }, 1, 12, 12); pack({ bomber: 3, ghost: 2 }, 1, 16, 16); break;
    case 5: pack({ skel: 3, necro: 1 }, 2, 0, 20); pack({ skel: 3, shaman: 1 }, 2, 4, 22); pack({ bat: 4 }, 3, 2, 24); pack({ berserker: 2, drummer: 1 }, 2, 8, 24); pack({ bug: 3 }, 2, 1, 20); pack({ ghost: 3, berserker: 1 }, 1, 17, 17); break;
    case 6: pack({ catapult: 2 }, 1, 2, 2); pack({ siege: 1 }, 1, 8, 8); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 4, 20); pack({ skel: 3, shieldb: 1 }, 3, 0, 24); pack({ bug: 3, drummer: 1 }, 2, 2, 24); pack({ bat: 5, bomber: 2 }, 2, 4, 26); pack({ berserker: 3, drummer: 1 }, 1, 19, 19); break;
    case 7:
      pack({ siege: 1 }, 2, 4, 20); pack({ catapult: 2 }, 1, 3, 3); pack({ skel: 3, necro: 1 }, 2, 0, 22); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 6, 24); pack({ berserker: 2, drummer: 1 }, 3, 2, 26);
      pack({ ghost: 3 }, 2, 8, 24); pack({ bat: 5, bomber: 2 }, 3, 4, 28); pack({ slime: 6, mimic: 1 }, 2, 0, 20); pack({ skel: 4, berserker: 2, shieldb: 1 }, 1, 26, 26);
      break;
    /* 第 8 夜：首领来之前的一夜，一个精英压阵，三面一起上 */
    case 8:
      boss(pick(ELITES), 9); pack({ siege: 1 }, 1, 6, 6); pack({ catapult: 2 }, 1, 2, 2); pack({ skel: 3, necro: 1 }, 2, 0, 24); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 4, 26);
      pack({ berserker: 2, drummer: 1 }, 2, 6, 28); pack({ ghost: 3, bomber: 1 }, 2, 10, 26); pack({ bat: 5, bomber: 2 }, 3, 2, 30); pack({ bug: 3, slime: 4 }, 2, 0, 22); pack({ skel: 4, berserker: 2, shieldb: 1 }, 1, 28, 28);
      break;
    case 9:
      boss(bk || 'eye', 1); pack({ siege: 1 }, 1, 10, 10); pack({ catapult: 1 }, 1, 6, 6); pack({ skel: 3, necro: 1 }, 2, 4, 30); pack({ bat: 5, drummer: 1 }, 3, 8, 36);
      pack({ ghost: 3 }, 2, 14, 32); pack({ slime: 6, shaman: 1 }, 2, 12, 30); pack({ berserker: 3, bomber: 2 }, 1, 22, 22);
      break;
    /* ---- 完整游戏线：天没亮，接着守 ---- */
    case 10:
      boss(foeKey('a_lich'), 8); pack({ skel: 3, necro: 1 }, 3, 0, 26); pack({ ghost: 3 }, 3, 4, 28); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 6, 24);
      pack({ bat: 5, bomber: 2 }, 3, 2, 28); pack({ berserker: 2, drummer: 1 }, 2, 10, 26); pack({ skel: 4, shieldb: 2 }, 1, 24, 24);
      break;
    case 11:
      pack({ siege: 1 }, 2, 4, 24); pack({ catapult: 2 }, 1, 2, 2); pack({ golem: 1, shieldb: 1, drummer: 1 }, 2, 4, 28); pack({ skel: 3, necro: 1 }, 2, 0, 24);
      pack({ bug: 3, mimic: 1 }, 2, 6, 22); pack({ bat: 5, bomber: 2 }, 3, 4, 30); pack({ berserker: 3, drummer: 1 }, 1, 26, 26);
      break;
    case 12:
      boss(bk || 'brood', 1); pack({ siege: 1 }, 2, 8, 24); pack({ catapult: 2 }, 1, 4, 4); pack({ skel: 3, necro: 1 }, 2, 4, 30); pack({ ghost: 3, shaman: 1 }, 2, 12, 32);
      pack({ bat: 5, drummer: 1 }, 3, 8, 36); pack({ berserker: 3, bomber: 2 }, 2, 18, 30);
      break;
    case 13:
      boss(foeKey('a_brute'), 6); boss(foeKey('a_golem'), 18); pack({ berserker: 2, drummer: 1 }, 3, 0, 28); pack({ skel: 3, shieldb: 1 }, 3, 2, 26); pack({ ghost: 3 }, 2, 6, 24);
      pack({ siege: 1 }, 1, 10, 10); pack({ bat: 5, bomber: 2 }, 3, 2, 30); pack({ slime: 6, mimic: 1 }, 2, 0, 22);
      break;
    /* 第 14 夜：最长的一夜，所有东西一起来 */
    case 14:
      boss(pick(ELITES), 4); boss(pick(ELITES), 24); pack({ siege: 1 }, 1, 10, 10); pack({ catapult: 2 }, 1, 2, 2); pack({ skel: 3, necro: 1 }, 3, 0, 32); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 4, 34);
      pack({ berserker: 2, drummer: 1 }, 3, 2, 34); pack({ ghost: 3 }, 3, 8, 32); pack({ bat: 5, bomber: 2 }, 3, 2, 36); pack({ bug: 3, slime: 4 }, 3, 0, 30); pack({ skel: 4, berserker: 2, shieldb: 1 }, 1, 36, 36);
      break;
    case 15:
      if (bk) boss(bk, 1);
      pack({ skel: 3, necro: 1 }, 2, 6, 34); pack({ ghost: 3 }, 2, 12, 36); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 10, 32); pack({ bat: 5, drummer: 1 }, 3, 8, 38); pack({ berserker: 3, bomber: 2 }, 2, 20, 32);
      break;
    default:
      endlessWave(r, pack, boss);
  }
  frostExtra(r, pack);
  /* 宝箱怪本来就躺在半路上装宝箱 */
  for (const s of S) if (s.type === 'mimic') s.y = rnd(0.3, 0.4);
  for (const s of S) s.type = foeKey(s.type);
  const out = S.sort((a, b) => a.t - b.t) as Wave;
  out.surges = (!G.endless && SG[r]) || [14, 28];
  return out;
}

/** 霜潮专属：冰鸦、冰壳蟹、冰晶法师 */
function frostExtra(r: number, pack: Pack) {
  if (G.foeSet !== 'frost') return;
  if (r >= 3) pack({ f_crow: 2 }, 1, 6, 18);
  if (r >= 5) pack({ f_shell: 1 }, 1, 8, 20);
  if (r >= 6) pack({ f_mage: 1 }, 1, 6, 20);
}

/** 无尽长夜：单数夜带一个精英，每四夜一个首领 */
function endlessWave(r: number, pack: Pack, boss: Boss) {
  const k = r - lastNight();
  pack({ skel: 3, necro: 1 }, 2, 0, 22); pack({ golem: 1, shaman: 1, shieldb: 1 }, 2, 6, 24); pack({ berserker: 2, drummer: 1 }, 3, 2, 26);
  pack({ ghost: 3 }, 2, 8, 24); pack({ bat: 5, bomber: 2 }, 3, 4, 28); pack({ slime: 6, mimic: 1 }, 2, 0, 20); pack({ siege: 1 }, 1 + Math.floor(k / 2), 6, 20); pack({ catapult: 2 }, 1, 3, 3);
  if (k % 4 === 0) boss(pick(finalBosses()), 1);
  else if (k % 2 === 1) boss(pick(ELITES), 10);
  pack({ skel: 4, berserker: 2, shieldb: 1 }, 1, 26, 26);
}
