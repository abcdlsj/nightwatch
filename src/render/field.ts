/* 战场画布：低分辨率（约 180 格宽）像素画布，CSS 放大显示。
 * 负责城墙、敌人、弹道、粒子、飘字；模拟层通过 SimView 往这里塞特效。 */
import { DIG } from '../data/art/hand';
import { TUNE } from '../game/tuning';
import { vr, vrnd } from '../core/rng';
import { fmt } from '../core/util';
import { RM } from '../platform/env';
import { SETTINGS } from '../platform/settings';
import { G } from '../game/state';
import { B, phased, rising } from '../sim/battle';
import { world, K, ex, ey, WALLY } from '../sim/world';
import type { Enemy } from '../sim/types';
import { spr } from './sprites';
import { $ } from '../ui/dom';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; sz: number }
interface Num { x: number; y: number; str: string; col: string; s: number; life: number }
interface Ring { x: number; y: number; r0: number; r1: number; col: string; life: number; max: number }
interface Bolt { segs: number[][]; col: string; life: number; max: number }

export const F = {
  cv: null as unknown as HTMLCanvasElement,
  ctx: null as CanvasRenderingContext2D | null,
  /** CSS 放大倍数 */
  s: 2,
  shake: 0,
  wallFlash: 0,
  parts: [] as Part[],
  nums: [] as Num[],
  rings: [] as Ring[],
  bolts: [] as Bolt[],
  ground: null as HTMLCanvasElement | null,
};

export function initField() {
  F.cv = $('#field') as HTMLCanvasElement;
}

/** 按舞台大小重排画布：手机上约 180 格宽，像素整数倍放大 */
export function resizeField() {
  const st = $('#stage').getBoundingClientRect();
  const s = Math.max(2, Math.floor(st.width / 160));
  F.s = s;
  world.W = Math.floor(st.width / s);
  world.H = Math.floor(st.height / s);
  F.cv.width = world.W;
  F.cv.height = world.H;
  F.cv.style.width = world.W * s + 'px';
  F.cv.style.height = world.H * s + 'px';
  F.cv.style.left = Math.floor((st.width - world.W * s) / 2) + 'px';
  F.ctx = F.cv.getContext('2d');
  F.ctx!.imageSmoothingEnabled = false;
  buildGround();
}

export function clearFieldFx() {
  F.parts = [];
  F.nums = [];
  F.rings = [];
  F.bolts = [];
}

/** 战场坐标 → 页面坐标（金币飞向顶栏用） */
export function toClient(x: number, y: number): [number, number] {
  const fr = F.cv.getBoundingClientRect();
  return [fr.left + x * F.s, fr.top + y * F.s];
}
/** 页面元素中心 → 战场 x（卡牌出手位置） */
export function clientToFieldX(el: Element) {
  const fr = F.cv.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return (r.left + r.width / 2 - fr.left) / F.s;
}

/** 地面：一次画好缓存，固定种子保证每次一样 */
function buildGround() {
  const W = world.W,
    H = world.H;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0d18');
  g.addColorStop(1, '#1a1a22');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < (W * H) / 30; i++) {
    const px = Math.floor(r() * W),
      py = Math.floor(r() * H);
    const a = (0.03 + (py / H) * 0.07).toFixed(3);
    x.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(120,170,140,${a})`;
    x.fillRect(px, py, 1, 1);
  }
  for (let i = 0; i < W / 5; i++) {
    const px = Math.floor(r() * W),
      py = Math.floor(H * 0.3 + r() * H * 0.62);
    x.fillStyle = `rgba(70,120,90,${(0.15 + (py / H) * 0.25).toFixed(3)})`;
    x.fillRect(px, py, 1, 2);
    x.fillRect(px + 2, py + 1, 1, 1);
    x.fillRect(px - 1, py + 1, 1, 1);
  }
  for (let i = 0; i < W / 9; i++) {
    const px = Math.floor(r() * W),
      py = Math.floor(H * 0.2 + r() * H * 0.7);
    x.fillStyle = 'rgba(148,176,194,.16)';
    x.fillRect(px, py, 2, 1);
    x.fillStyle = 'rgba(0,0,0,.3)';
    x.fillRect(px, py + 1, 2, 1);
  }
  for (let i = 0; i < 8; i++) {
    x.fillStyle = `rgba(0,0,0,${(0.4 * (1 - i / 8)).toFixed(3)})`;
    x.fillRect(0, i * 2, W, 2);
  }
  F.ground = c;
}

/* ---------------- 特效（给 SimView 用） ---------------- */
export function part(x: number, y: number, vx: number, vy: number, life: number, col: string, sz?: number) {
  if (F.parts.length > 600) F.parts.shift();
  F.parts.push({ x, y, vx, vy, life, max: life, col, sz: sz || 1 });
}
export function num(x: number, y: number, str: string, col: string, s: number) {
  if (F.nums.length > 70) F.nums.shift();
  F.nums.push({ x, y, str, col, s, life: 0.8 });
}
/** 伤害飘字：暴击和持续伤害都显示；同屏多了以后普通伤害只抽一部分显示 */
export function dmgNum(e: Enemy, a: number, crit: boolean, kind: 'burn' | 'poison' | null) {
  if (!SETTINGS.nums) return;
  const big = crit || a >= 150;
  if (crit || kind || F.nums.length < 28 || (e.d.boss || e.d.elite ? vr() < 0.25 : vr() < 0.5))
    num(ex(e) + vrnd(-7, 7), ey(e) - 10 - vrnd(0, 5), fmt(a) + (crit ? '!' : ''), kind === 'poison' ? '#7ddc5f' : kind === 'burn' ? '#ef7d57' : crit ? '#fee761' : '#ffffff', big ? 2 : 1);
}
export function ring(x: number, y: number, r0: number, r1: number, col: string, life: number) {
  F.rings.push({ x, y, r0, r1, col, life, max: life });
}
export function bolt(pts: [number, number][], col: string, life: number, straight?: boolean) {
  const segs: number[][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const n = straight ? 1 : Math.max(2, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8));
    for (let k = 0; k < n; k++) {
      const t0 = k / n,
        t1 = (k + 1) / n;
      segs.push([a[0] + (b[0] - a[0]) * t0 + (k && !straight ? vrnd(-3, 3) : 0), a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]);
    }
  }
  for (let i = 1; i < segs.length; i++) {
    segs[i][0] = segs[i - 1][2];
    segs[i][1] = segs[i - 1][3];
  }
  F.bolts.push({ segs, col, life, max: life });
}
export function boom(x: number, y: number, r: number, col: string) {
  ring(x, y, 2, r, col, 0.3);
  ring(x, y, 1, r * 0.6, '#ffcd75', 0.25);
  shake(2);
  for (let i = 0; i < 16; i++) {
    const a = vr() * 6.28,
      s = vrnd(20, 70);
    part(x, y, Math.cos(a) * s, Math.sin(a) * s, vrnd(0.2, 0.5), vr() < 0.5 ? col : '#ffcd75', 2);
  }
}
/** 命中：按出手卡的元素出不同的迸溅；暴击加一圈亮环，击杀炸得更开 */
const HITC: Record<string, [string, string]> = {
  blade: ['#ffffff', '#dfe6ee'], fire: ['#ffcd75', '#ef7d57'], ice: ['#c2f4ff', '#73eff7'],
  volt: ['#fee761', '#ffffff'], mech: ['#ffd166', '#c28a4d'], poison: ['#a7f070', '#7ddc5f'],
};
export function hit(x: number, y: number, tag: string | null, crit: boolean, kill: boolean) {
  const [c0, c1] = HITC[tag || ''] || ['#ffffff', '#ffffff'];
  const k = (crit ? 1.6 : 1) * (kill ? 1.5 : 1);
  const n = Math.round(4 * k);
  switch (tag) {
    case 'blade': {
      const d = vr() < 0.5 ? 1 : -1;
      bolt([[x - 6 * d * k, y - 5 * k], [x + 6 * d * k, y + 3 * k]], c0, crit ? 0.12 : 0.07, true);
      for (let i = 0; i < n; i++) part(x, y, d * vrnd(20, 60), vrnd(-30, 10), 0.2, vr() < 0.5 ? c0 : c1, 1);
      break;
    }
    case 'fire':
      for (let i = 0; i < n + 2; i++) part(x + vrnd(-3, 3), y + vrnd(-2, 2), vrnd(-15, 15), -vrnd(30, 70), vrnd(0.3, 0.5), vr() < 0.5 ? c0 : c1, vr() < 0.3 ? 2 : 1);
      break;
    case 'ice':
      for (let i = 0; i < n; i++) {
        const a = vr() * 6.28,
          s = vrnd(25, 55);
        part(x, y, Math.cos(a) * s, Math.sin(a) * s - 20, 0.3, vr() < 0.5 ? c0 : c1, 2);
      }
      ring(x, y, 1, 5 * k, c1, 0.18);
      break;
    case 'volt':
      for (let i = 0; i < Math.ceil(n / 2); i++) {
        const a = vr() * 6.28,
          r = vrnd(5, 9) * k;
        bolt([[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]], c0, 0.08);
      }
      for (let i = 0; i < n; i++) part(x, y, vrnd(-50, 50), vrnd(-50, 20), 0.15, c1, 1);
      break;
    case 'mech':
      for (let i = 0; i < n + 1; i++) part(x, y, vrnd(-60, 60), vrnd(-60, 0), vrnd(0.2, 0.4), vr() < 0.6 ? c0 : c1, vr() < 0.4 ? 2 : 1);
      break;
    case 'poison':
      for (let i = 0; i < n; i++) part(x + vrnd(-3, 3), y, vrnd(-20, 20), vrnd(-40, -10), vrnd(0.35, 0.55), vr() < 0.5 ? c0 : c1, 2);
      break;
    default:
      for (let i = 0; i < 3; i++) part(x, y, vrnd(-30, 30), vrnd(-40, 5), 0.25, '#ffffff', 1);
  }
  if (crit) {
    ring(x, y, 2, 10, c0, 0.22);
    ring(x, y, 1, 6, '#ffffff', 0.12);
  }
  if (kill) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28;
    part(x, y, Math.cos(a) * 70, Math.sin(a) * 70, 0.22, c0, 1);
  }
}
export const shake = (n: number) => {
  F.shake = Math.max(F.shake, n);
};
export const wallFlash = () => {
  F.wallFlash = 0.4;
};

/* ---------------- 画 ---------------- */
function pline(x: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  x.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    x.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
  }
}
function pcircle(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
  x.fillStyle = col;
  const n = Math.max(12, Math.floor(r * 4));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283;
    x.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.6), 1, 1);
  }
}
function drawNum(x: CanvasRenderingContext2D, str: string, cx: number, cy: number, col: string, s: number) {
  const w = str.length * 5 * s - s;
  const px = Math.round(cx - w / 2);
  const py = Math.round(cy);
  const offs = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]];
  for (const pass of [0, 1]) {
    x.fillStyle = pass ? col : '#1a1c2c';
    const list = pass ? [[0, 0]] : offs;
    for (const [ox, oy] of list) {
      let qx = px;
      for (const chh of str) {
        const g = DIG[chh] || DIG['0'];
        for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) if (g[r * 4 + q] === '1') x.fillRect(qx + q * s + ox * s, py + r * s + oy * s, s, s);
        qx += 5 * s;
      }
    }
  }
}
/** 非数字的飘字（「壳」「碎」「处决」）：用缝合像素字体，12px 是它的原生字号，加一圈深色描边 */
function drawWord(x: CanvasRenderingContext2D, str: string, cx: number, cy: number, col: string) {
  x.font = "12px 'Fusion Pixel', sans-serif";
  x.textAlign = 'center';
  x.textBaseline = 'top';
  const px = Math.round(cx),
    py = Math.round(cy) - 3;
  x.fillStyle = '#1a1c2c';
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) x.fillText(str, px + ox, py + oy);
  x.fillStyle = col;
  x.fillText(str, px, py);
}
const isDigits = (s: string) => /^[0-9k!+\-x]+$/.test(s);

export function drawField(dt: number) {
  const x = F.ctx,
    W = world.W,
    H = world.H;
  if (!x) return;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, W, H);
  if (F.shake > 0 && !RM && SETTINGS.shake) x.translate(Math.round(vrnd(-1, 1) * F.shake), Math.round(vrnd(-1, 1) * F.shake));
  F.shake = Math.max(0, F.shake - dt * 18);
  x.fillStyle = '#0a0c14';
  x.fillRect(-4, -4, W + 8, H + 8);
  if (F.ground) x.drawImage(F.ground, 0, 0);
  /* 危险区：敌人逼近城墙时泛红 */
  let danger = 0;
  if (B) for (const e of B.en) if (e.y > 0.72) danger = Math.max(danger, (e.y - 0.72) / 0.28);
  if (danger > 0)
    for (let i = 0; i < 12; i++) {
      x.fillStyle = `rgba(228,59,68,${(0.18 * danger * (1 - i / 12)).toFixed(3)})`;
      x.fillRect(0, WALLY() - i * 3 - 3, W, 3);
    }
  /* 城墙 */
  const wy = WALLY();
  x.fillStyle = '#2a2130';
  x.fillRect(0, wy, W, 7);
  for (let r = 0; r < 2; r++)
    for (let bx = r ? -4 : 0; bx < W; bx += 8) {
      x.fillStyle = '#7d6a5a';
      x.fillRect(bx + 1, wy + 1 + r * 3, 7, 2);
      x.fillStyle = '#9c8670';
      x.fillRect(bx + 1, wy + 1 + r * 3, 7, 1);
    }
  for (let bx = 0; bx < W; bx += 6) {
    x.fillStyle = '#7d6a5a';
    x.fillRect(bx, wy - 2, 4, 2);
    x.fillStyle = '#2a2130';
    x.fillRect(bx, wy - 3, 4, 1);
  }
  if (F.wallFlash > 0) {
    x.fillStyle = `rgba(255,60,60,${(F.wallFlash * 1.4).toFixed(3)})`;
    x.fillRect(0, wy - 3, W, 10);
    F.wallFlash -= dt;
  }
  /* 射程线；雾母起雾时压低，线上面盖一层雾 */
  {
    const veil = B && B.flags.veilT > B.t ? TUNE.veil : 0;
    const ry = Math.round(world.top + (world.range + veil) * (WALLY() - 2 - world.top));
    if (veil) {
      const g = x.createLinearGradient(0, world.top, 0, ry);
      g.addColorStop(0, 'rgba(159,216,208,0)');
      g.addColorStop(1, 'rgba(159,216,208,.22)');
      x.fillStyle = g;
      x.fillRect(0, world.top, W, ry - world.top);
    }
    for (let xx = 0; xx < W; xx += 6) {
      x.fillStyle = veil ? 'rgba(159,216,208,.5)' : 'rgba(255,209,102,.22)';
      x.fillRect(xx, ry, 3, 1);
    }
  }
  const now = performance.now();
  if (B && B.shield > 0) {
    const a = 0.35 + 0.2 * Math.sin(now / 150);
    x.fillStyle = `rgba(143,227,255,${a.toFixed(3)})`;
    x.fillRect(0, wy - 5, W, 1);
    x.fillRect(0, wy - 7, W, 1);
  }
  if (B) {
    for (let xx = 0; xx < W; xx += 2) {
      const f = Math.sin(xx * 0.3 + now / 300) + Math.sin(xx * 0.11 - now / 500);
      if (f > 0.6) {
        x.fillStyle = f > 1.2 ? '#c38cff' : '#5d275d';
        x.fillRect(xx, world.top + (f > 1.2 ? 1 : 0), 2, 1);
      }
    }
    drawBattle(x, W);
  }
  for (const r of F.rings) {
    r.life -= dt;
    const k = 1 - r.life / r.max;
    x.globalAlpha = Math.max(0, r.life / r.max);
    pcircle(x, r.x, r.y, r.r0 + (r.r1 - r.r0) * k, r.col);
    x.globalAlpha = 1;
  }
  F.rings = F.rings.filter((r) => r.life > 0);
  for (const b of F.bolts) {
    b.life -= dt;
    const col = Math.floor(b.life * 40) % 2 ? b.col : '#ffffff';
    for (const s of b.segs) pline(x, s[0], s[1], s[2], s[3], col);
  }
  F.bolts = F.bolts.filter((b) => b.life > 0);
  x.globalCompositeOperation = 'lighter';
  for (const p of F.parts) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    x.fillStyle = p.col;
    x.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
    x.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz);
  }
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  F.parts = F.parts.filter((p) => p.life > 0);
  for (const n of F.nums) {
    n.life -= dt;
    n.y -= (n.life > 0.5 ? 28 : 6) * dt;
    if (n.life < 0.2 && Math.floor(n.life * 30) % 2) continue;
    if (isDigits(n.str)) drawNum(x, n.str, n.x, n.y, n.col, n.s);
    else drawWord(x, n.str, n.x, n.y, n.col);
  }
  F.nums = F.nums.filter((n) => n.life > 0);
}

function drawBattle(x: CanvasRenderingContext2D, W: number) {
  const b = B!;
  const now = b.t;
  /* 北边的火把 */
  {
    const fy = world.top + 2,
      n = Math.floor(W / 7),
      heat = 0.35 + G.round * 0.08;
    let sd = G.round * 131 + 7;
    const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const fx = Math.floor(i * 7 + rr() * 5);
      if (rr() > heat) continue;
      const fl = Math.floor(2 + rr() * 3 + Math.sin(now * 9 + i * 1.7) * 1.5);
      x.fillStyle = '#e43b44';
      x.fillRect(fx, fy - fl, 2, fl);
      x.fillStyle = '#ffcd75';
      x.fillRect(fx, fy - Math.max(1, fl - 1), 1, Math.max(1, fl - 2));
      if (vr() < 0.02 * heat) part(fx, fy - fl, vrnd(-3, 3), -vrnd(6, 16), 1.2, vr() < 0.5 ? '#ef7d57' : '#566c86', 1);
    }
  }
  const list = b.en.slice().sort((a, z) => a.y - z.y);
  /* 光环 */
  for (const s of list) {
    if (!s.d.aura || s.y < -0.02) continue;
    const R2 = s.d.aura * K();
    const col = s.d.guard ? 'rgba(65,166,246,' : s.d.haste ? 'rgba(228,59,68,' : 'rgba(126,232,162,';
    const pulse = 0.12 + 0.08 * Math.sin(now * 4 + s.ph);
    pcircle(x, ex(s), ey(s) - 5, R2 * (s.d.haste ? 0.85 + 0.15 * Math.sin(now * 6) : 1), col + pulse.toFixed(3) + ')');
    if (s.d.guard)
      for (const o of list)
        if (o !== s && o.armorB && Math.hypot(ex(o) - ex(s), ey(o) - ey(s)) <= R2 && vr() < 0.5) {
          x.globalAlpha = 0.35;
          pline(x, ex(s), ey(s) - 5, ex(o), ey(o) - 5, '#41a6f6');
          x.globalAlpha = 1;
        }
  }
  for (const e of list) {
    const sp = spr(e.sprK || e.d.spr),
      sc = e.d.sc,
      w = sp.w * sc,
      h = sp.h * sc;
    let bob = Math.round(Math.abs(Math.sin(now * 7 + e.ph)) * -1);
    if (e.type === 'slime' || e.type === 'mini') bob = Math.round(Math.abs(Math.sin(now * 6 + e.ph)) * -2);
    if (e.d.zig) bob = Math.round(Math.sin(now * 14 + e.ph));
    const age = now - (e.bornT || 0);
    if (age < 0.4 && !e.d.fixed) x.globalAlpha = Math.max(0.15, age / 0.4);
    if (phased(e)) x.globalAlpha = 0.22 + 0.08 * Math.sin(now * 20);
    if (e.d.raise && e.y > 0) pcircle(x, ex(e), ey(e) - 5, 50 * K(), `rgba(183,124,255,${(0.1 + 0.06 * Math.sin(now * 3 + e.ph)).toFixed(3)})`);
    if (e.d.rage && e.hp < e.maxHp * 0.5 && vr() < 0.3) part(ex(e) + vrnd(-4, 4), ey(e) - vrnd(4, 10), 0, -vrnd(10, 25), 0.3, '#e43b44', 1);
    if (e.d.bomb && vr() < 0.3) part(ex(e) + 3, ey(e) - 11, vrnd(-6, 6), -vrnd(5, 15), 0.25, vr() < 0.5 ? '#fee761' : '#ef7d57', 1);
    const px = Math.round(ex(e) - w / 2),
      py = Math.round(ey(e) - h + bob);
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.fillRect(px + 2, Math.round(ey(e)) - 1, w - 4, 2);
    if (e.d.boss) {
      const a = 0.25 + 0.15 * Math.sin(now * 5);
      pcircle(x, px + w / 2, py + h / 2, w * 0.7, `rgba(228,59,68,${a.toFixed(3)})`);
    }
    if (rising(e)) {
      /* 从地里一点点钻出来 */
      const k = Math.max(0.1, (now - e.bornT) / 0.5),
        hh = Math.max(1, Math.round(sp.h * k));
      x.globalAlpha = 1;
      x.drawImage(sp.cv, 0, 0, sp.w, hh, px, py + h - hh * sc, w, hh * sc);
    } else x.drawImage(sp.cv, px, py, w, h);
    x.globalAlpha = 1;
    if (e.armorB) {
      x.fillStyle = '#41a6f6';
      x.fillRect(px - 1, py + 2, 2, 3);
    }
    if (e.hasteB && vr() < 0.2) part(ex(e) + vrnd(-3, 3), ey(e), 0, -vrnd(5, 15), 0.3, '#ef7d57', 1);
    if (e.slowT > 0 || e.frzT > 0) {
      x.globalAlpha = e.frzT > 0 ? 0.8 : 0.35;
      x.drawImage(sp.ice, px, py, w, h);
      x.globalAlpha = 1;
    }
    if (e.vulnT > 0) {
      x.fillStyle = '#ff5a8a';
      x.fillRect(Math.round(px + w / 2) - 1, Math.round(py) - 4, 3, 3);
      x.fillStyle = '#fff';
      x.fillRect(Math.round(px + w / 2), Math.round(py) - 3, 1, 1);
    }
    if (e.hardT > 0) {
      x.globalAlpha = 0.3 + 0.2 * Math.sin(now * 20);
      x.drawImage(sp.white, px, py, w, h);
      x.globalAlpha = 1;
    }
    if (e.flash > 0) {
      x.globalAlpha = Math.min(e.d.boss || e.d.elite ? 0.35 : 0.8, e.flash * 14);
      x.drawImage(sp.white, px, py, w, h);
      x.globalAlpha = 1;
    }
    if (e.d.intents && e.it < 1.2 && Math.floor(now * 10) % 2) {
      x.strokeStyle = '#ff5a5a';
      x.lineWidth = 1;
      x.strokeRect(px - 2.5, py - 2.5, w + 5, h + 5);
    }
    if (!e.d.boss && (e.hp < e.maxHp || e.shield > 0)) {
      const bw = Math.max(8, w - 2);
      x.fillStyle = '#1a1c2c';
      x.fillRect(px + (w - bw) / 2 - 1, py - 4, bw + 2, 3);
      x.fillStyle = '#e43b44';
      x.fillRect(px + (w - bw) / 2, py - 3, Math.max(0, Math.round((bw * e.hp) / e.maxHp)), 1);
      if (e.shield > 0) {
        x.fillStyle = '#dfe6ee';
        x.fillRect(px + (w - bw) / 2, py - 4, Math.min(bw, Math.round((bw * e.shield) / e.maxHp)), 1);
      }
    }
    if (e.armor > 0 && !e.d.boss && !e.d.elite) {
      x.fillStyle = '#94b0c2';
      x.fillRect(px + w - 2, py + 1, 2, 2);
    }
  }
  /* 投石 */
  for (const r of b.epr) {
    const k = Math.min(1, r.t / r.dur);
    const px = Math.round(r.x0 + (r.x1 - r.x0) * k),
      py = Math.round(r.y0 + (r.y1 - r.y0) * k - Math.sin(k * Math.PI) * 30 * K());
    x.fillStyle = '#1a1c2c';
    x.fillRect(px - 2, py - 2, 4, 4);
    x.fillStyle = '#94b0c2';
    x.fillRect(px - 1, py - 1, 2, 2);
    if (vr() < 0.4) part(px, py, 0, 0, 0.3, '#566c86', 1);
  }
  /* 弹道 */
  for (const p of b.pr) {
    const px = Math.round(p.x),
      py = Math.round(p.y);
    if (p.kind === 'knife') {
      const vx = p.vx || 0,
        vy = p.vy || -1;
      pline(x, p.x - vx * 5, p.y - vy * 5, p.x, p.y, '#f4f4f4');
      x.fillStyle = '#94b0c2';
      x.fillRect(Math.round(p.x - vx * 6), Math.round(p.y - vy * 6), 1, 1);
    } else if (p.kind === 'arrow') {
      const vx = p.vx || 0,
        vy = p.vy || -1;
      pline(x, p.x - vx * 7, p.y - vy * 7, p.x, p.y, '#c28a4d');
      x.fillStyle = '#f4f4f4';
      x.fillRect(px, py, 1, 1);
    } else if (p.kind === 'spark') {
      x.fillStyle = '#ef7d57';
      x.fillRect(px - 1, py - 1, 3, 3);
      x.fillStyle = '#fee761';
      x.fillRect(px, py, 1, 1);
    } else if (p.kind === 'ice') {
      x.fillStyle = '#41a6f6';
      x.fillRect(px - 1, py - 1, 3, 3);
      x.fillStyle = '#f4f4f4';
      x.fillRect(px, py, 1, 1);
    } else if (p.kind === 'fly') {
      x.fillStyle = '#a7f070';
      x.fillRect(px - 1, py - 1, 3, 3);
      x.fillStyle = '#fee761';
      x.fillRect(px, py, 1, 1);
      if (vr() < 0.5) part(p.x, p.y, vrnd(-5, 5), vrnd(-5, 5), 0.3, '#a7f070', 1);
    } else if (p.kind === 'rock') {
      x.fillStyle = '#566c86';
      x.fillRect(px - 1, py - 1, 3, 3);
      x.fillStyle = '#94b0c2';
      x.fillRect(px - 1, py - 1, 1, 1);
    } else if (p.kind === 'axe') {
      const f = Math.floor(p.age * 24) % 4;
      x.fillStyle = '#1a1c2c';
      x.fillRect(px - 2, py - 2, 5, 5);
      x.fillStyle = '#dfe6ee';
      if (f % 2) {
        x.fillRect(px - 2, py, 5, 1);
        x.fillRect(px, py - 2, 1, 2);
      } else {
        x.fillRect(px, py - 2, 1, 5);
        x.fillRect(px + 1, py, 2, 1);
      }
      x.fillStyle = '#c28a4d';
      x.fillRect(px, py, 1, 1);
    } else if (p.kind === 'meteor') {
      x.fillStyle = '#ff5a2a';
      x.fillRect(px - 3, py - 3, 6, 6);
      x.fillStyle = '#fee761';
      x.fillRect(px - 2, py - 2, 4, 4);
      x.fillStyle = '#fff';
      x.fillRect(px - 1, py - 1, 2, 2);
    } else if (p.kind === 'shell') {
      x.fillStyle = '#1a1c2c';
      x.fillRect(px - 2, py - 2, 4, 4);
      x.fillStyle = '#566c86';
      x.fillRect(px - 1, py - 1, 2, 2);
    }
  }
}

