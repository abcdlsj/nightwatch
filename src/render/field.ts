/* 战场画布：低分辨率（约 180 格宽）像素画布，CSS 放大显示。
 * 负责城墙、敌人、弹道、粒子、飘字；模拟层通过 SimView 往这里塞特效。
 * Battlefield canvas: a low-resolution (about 180 cells wide) pixel canvas scaled up with CSS. Handles the wall, enemies, projectiles, particles and floating text; the sim feeds effects in through SimView.
 */
import { DIG } from '../data/art/hand';
import { TUNE } from '../game/tuning';
import { vr, vrnd } from '../core/rng';
import { fmt } from '../core/util';
import { SETTINGS } from '../platform/settings';
import { G } from '../game/state';
import { nightKind } from '../game/plan';
import { B, phased, rising } from '../sim/battle';
import { world, K, ex, ey, WALLY } from '../sim/world';
import type { Enemy } from '../sim/types';
import { spr } from './sprites';
import { bayer, dotOn, ditherRect, drawDithered, crispText } from './dither';
import { $ } from '../ui/dom';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; sz: number }
interface Num { x: number; y: number; str: string; col: string; s: number; life: number; max?: number; e?: Enemy; v?: number; pop?: number; crit?: boolean }
/** 地上的焦痕：敌人碎掉的地方留一小块暗斑，慢慢褪掉 / scorch marks: a small dark blot where an enemy shattered, fading slowly */
interface Mark { x: number; y: number; w: number; life: number; max: number }
/** 只在画面上的受击反应：击退几格，慢慢回位（不改模拟里的位置） / render-only hit reaction: knocked back a few cells, easing back (the sim position never changes) */
const KB = new WeakMap<Enemy, number>();
/** 设置里开了「减少动态效果」 / 'Reduce motion' is on in settings */
const calm = () => SETTINGS.calm;
interface Ring { x: number; y: number; r0: number; r1: number; col: string; life: number; max: number }
interface Bolt { segs: number[][]; col: string; life: number; max: number }

export const F = {
  cv: null as unknown as HTMLCanvasElement,
  ctx: null as CanvasRenderingContext2D | null,
  /** CSS 放大倍数 / CSS scale factor */
  s: 2,
  shake: 0,
  wallFlash: 0,
  parts: [] as Part[],
  nums: [] as Num[],
  rings: [] as Ring[],
  bolts: [] as Bolt[],
  ground: null as HTMLCanvasElement | null,
  /** 这张地面是按哪一夜、哪个主题画的（换夜要重画） / which night and theme this ground was drawn for (redrawn when the night changes) */
  groundR: 0,
  themeK: '',
  marks: [] as Mark[],
  /** 开战的幕布（1→0）、天亮（0→1）、城破 / the opening curtain (1→0), dawn (0→1), the breach */
  curtain: 0,
  dawn: -1,
  broken: false,
};

/** 命中停顿：只把真实时间扣下来不喂给模拟，模拟仍按定步长走，结果和种子无关 / hit-stop: withholds wall-clock time from the sim; the sim still runs in fixed steps, so results never depend on it */
export const HS = { t: 0, last: 0 };
export function hitstop(sec: number) {
  if (calm() || !SETTINGS.shake || G.speed > 2) return;
  const now = performance.now();
  if (now - HS.last < 400) return;
  HS.last = now;
  HS.t = Math.max(HS.t, sec);
}

export function initField() {
  F.cv = $('#field') as HTMLCanvasElement;
}

/** 按舞台大小重排画布：手机上约 180 格宽，像素整数倍放大 / relayout the canvas to the stage size: about 180 cells wide on phones, scaled by an integer factor to keep pixels crisp */
export function resizeField() {
  const st = $('#stage').getBoundingClientRect();
  /* 倍数按物理像素取整：DPR 2.625、1.5 这类屏幕上，CSS 整数倍并不是物理整数倍，格子会一宽一窄
   * snap the scale to whole device pixels: on DPR 2.625 or 1.5 screens a whole CSS multiple is not a whole device multiple, and cells come out uneven */
  const dpr = window.devicePixelRatio || 1;
  const s = Math.max(1, Math.round(Math.max(2, Math.floor(st.width / 160)) * dpr)) / dpr;
  F.s = s;
  world.W = Math.floor(st.width / s);
  world.H = Math.floor(st.height / s);
  F.cv.width = world.W;
  F.cv.height = world.H;
  F.cv.style.width = (world.W * s * dpr) / dpr + 'px';
  F.cv.style.height = (world.H * s * dpr) / dpr + 'px';
  F.cv.style.left = Math.floor(((st.width - world.W * s) / 2) * dpr) / dpr + 'px';
  F.ctx = F.cv.getContext('2d');
  F.ctx!.imageSmoothingEnabled = false;
  buildGround();
}

export function clearFieldFx() {
  F.parts = [];
  F.nums = [];
  F.rings = [];
  F.bolts = [];
  F.marks = [];
  F.dawn = -1;
  F.broken = false;
}
/** 开战：黑幕从上往下揭开，敌人从北边的黑里露出来 / battle start: a black curtain lifts from the top down, enemies revealed out of the northern dark */
export function curtain() {
  F.curtain = calm() ? 0 : 1;
}
/** 守住：天边一点点亮起来 / held: the horizon slowly brightens */
export function dawn() {
  F.dawn = 0;
}
/** 城破：墙塌掉几段，砖块往外崩 / breach: sections of the wall collapse, bricks bursting outward */
export function breach() {
  F.broken = true;
  shake(6);
  const wy = WALLY();
  for (let i = 0; i < 90; i++) part(vr() * world.W, wy + vrnd(-2, 5), vrnd(-40, 40), -vrnd(30, 110), vrnd(0.5, 1.1), vr() < 0.5 ? '#7d6a5a' : vr() < 0.5 ? '#9c8670' : '#2a2130', vr() < 0.4 ? 2 : 1);
}

/** 战场坐标 → 页面坐标（金币飞向顶栏用） / battlefield coordinates → page coordinates (for gold flying to the top bar) */
export function toClient(x: number, y: number): [number, number] {
  const fr = F.cv.getBoundingClientRect();
  return [fr.left + x * F.s, fr.top + y * F.s];
}
/** 页面元素中心 → 战场 x（卡牌出手位置） / page element center → battlefield x (card firing positions) */
export function clientToFieldX(el: Element) {
  const fr = F.cv.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return (r.left + r.width / 2 - fr.left) / F.s;
}

/** 每夜的战场主题：地面色阶、远山、北边裂隙的光、空中飘的东西。前几夜萤火，中段落灰，后几夜和首领夜发红、飘火星，霜潮下雪
 * per-night battlefield theme: ground ramp, distant ridge, the rift glow in the north, what drifts in the air.
 * Early nights have fireflies, middle nights ash, late and boss nights turn red with embers, Frost Tide snows */
interface Theme { ramp: [number, number, number][]; tuft: string; ridge: string; ridgeHi: string; rift: string; amb: 'fly' | 'ash' | 'ember' | 'snow' }
const THEMES: Record<string, Theme> = {
  early: { ramp: [[10, 11, 22], [13, 14, 26], [16, 16, 29], [20, 19, 31], [24, 22, 33], [27, 24, 34]], tuft: '#2f5a48', ridge: '#07070f', ridgeHi: '#1c1c33', rift: '#5d275d', amb: 'fly' },
  mid: { ramp: [[9, 11, 24], [12, 14, 29], [15, 17, 33], [18, 20, 36], [22, 23, 38], [25, 26, 40]], tuft: '#2a4a4a', ridge: '#06070f', ridgeHi: '#1a1f38', rift: '#29366f', amb: 'ash' },
  late: { ramp: [[12, 8, 20], [16, 10, 24], [20, 12, 27], [25, 14, 30], [30, 16, 32], [34, 18, 34]], tuft: '#4a2a3a', ridge: '#0a0510', ridgeHi: '#2a1226', rift: '#b13e53', amb: 'ember' },
  boss: { ramp: [[16, 6, 16], [21, 8, 19], [26, 10, 22], [31, 12, 25], [36, 14, 27], [40, 16, 29]], tuft: '#5a2430', ridge: '#0c0408', ridgeHi: '#3a1020', rift: '#e43b44', amb: 'ember' },
  frost: { ramp: [[10, 14, 26], [13, 18, 32], [16, 22, 37], [20, 27, 42], [25, 32, 47], [30, 37, 52]], tuft: '#3a5a6a', ridge: '#070a14', ridgeHi: '#2a3a58', rift: '#41a6f6', amb: 'snow' },
};
function themeKey() {
  if (G.foeSet === 'frost') return 'frost';
  if (nightKind(G.round) === 'boss') return 'boss';
  return G.round >= 7 ? 'late' : G.round >= 4 ? 'mid' : 'early';
}
const theme = () => THEMES[F.themeK] || THEMES.early;
const toU32 = ([r, g, b]: [number, number, number]) => (255 << 24) | (b << 16) | (g << 8) | r;

/** 地面：一次画好缓存，按夜数换主题；固定种子保证同一夜每次一样 / ground: drawn once and cached, themed per night; a fixed seed keeps a given night identical every time */
function buildGround() {
  const W = world.W,
    H = world.H;
  F.themeK = themeKey();
  F.groundR = G.round;
  const T = theme();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  /* 夜色地面：几级相近的色阶加 Bayer 网点，不用平滑渐变；北边偏冷，靠城墙一侧偏暖
   * night ground: a few closely spaced tones with a Bayer screen instead of a smooth gradient; cooler to the north, warmer toward the wall */
  const id = x.createImageData(W, H),
    px32 = new Uint32Array(id.data.buffer);
  const tones = T.ramp.map(toU32);
  for (let iy = 0; iy < H; iy++) {
    const v = (iy / Math.max(1, H - 1)) * (tones.length - 1);
    for (let ix = 0; ix < W; ix++) px32[iy * W + ix] = tones[Math.min(tones.length - 1, Math.floor(v + bayer(ix, iy)))];
  }
  x.putImageData(id, 0, 0);
  let s = 7 + G.round * 97;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const px = (col: string, X: number, Y: number, w = 1, h = 1) => {
    x.fillStyle = col;
    x.fillRect(Math.round(X), Math.round(Y), w, h);
  };
  const wy = H - 7;
  /* 碎石：亮顶暗底，两三格大 / rocks: lit top, dark base, two or three cells */
  for (let i = 0; i < W / 10; i++) {
    const X = Math.floor(r() * W),
      Y = Math.floor(H * 0.12 + r() * (wy - H * 0.12 - 12)),
      w = 2 + Math.floor(r() * 2);
    px('#05060c', X + 1, Y + 1, w, 2);
    px('#2c2c40', X, Y, w, 2);
    px('#4a4c66', X, Y, w - 1, 1);
  }
  /* 草丛 / grass tufts */
  for (let i = 0; i < W / 5; i++) {
    const X = Math.floor(r() * W),
      Y = Math.floor(H * 0.25 + r() * (wy - H * 0.25 - 4));
    px(T.tuft, X, Y, 1, 2);
    px(T.tuft, X + 2, Y + 1);
    px(T.tuft, X - 1, Y + 1);
  }
  /* 零星白骨 / scattered bones */
  for (let i = 0; i < W / 30; i++) {
    const X = Math.floor(r() * W),
      Y = Math.floor(H * 0.3 + r() * (wy - H * 0.35));
    px('#94b0c2', X, Y, 2, 1);
    px('#566c86', X + 2, Y);
  }
  /* 两边的枯树：只放在边上，不挡战场中间 / dead trees: only along the edges, never in the middle of the fight */
  for (let i = 0; i < 4; i++) {
    const X = i % 2 ? W - 3 - Math.floor(r() * W * 0.1) : 2 + Math.floor(r() * W * 0.1),
      Y = Math.floor(H * 0.2 + r() * H * 0.55),
      h = 7 + Math.floor(r() * 6);
    px('#05060c', X + 1, Y + 1, 3, 1);
    px('#1a1420', X, Y - h, 1, h + 1);
    for (let b = 0; b < 3; b++) {
      const by = Y - h + 1 + b * 2 + Math.floor(r() * 2),
        d = b % 2 ? 1 : -1,
        l = 1 + Math.floor(r() * 3);
      for (let k = 1; k <= l; k++) px('#1a1420', X + d * k, by - Math.floor(k / 2));
    }
  }
  /* 北边远山和裂隙：天边一道锯齿剪影，正中透出一点裂隙的光 / the distant ridge and the rift: a jagged silhouette on the horizon, the rift's glow showing through in the middle */
  const ridgeH = Math.max(10, Math.round(H * 0.05));
  for (let gy = 0; gy < ridgeH + 6; gy += 2) ditherRect(x, 0, gy, W, 2, '#05060c', 0.85 * (1 - gy / (ridgeH + 6)));
  {
    const cx = W / 2,
      rw = W * 0.22;
    for (let k = 0; k < 6; k++) {
      const a = 0.5 * (1 - k / 6);
      ditherRect(x, Math.round(cx - rw * (1 - k / 7)), k * 2, Math.round(2 * rw * (1 - k / 7)), 2, T.rift, a);
    }
  }
  let h = ridgeH * 0.6;
  for (let X = 0; X < W; X++) {
    h += (r() - 0.5) * 2.2;
    h = Math.max(ridgeH * 0.25, Math.min(ridgeH, h));
    const top = Math.round(h * (0.75 + 0.25 * Math.abs(Math.sin(X * 0.07))));
    px(T.ridge, X, top, 1, ridgeH + 2 - top);
    if (r() < 0.5) px(T.ridgeHi, X, top);
  }
  /* 拒马：城墙前一排削尖的木桩，中间留出几个口子 / chevaux-de-frise: a row of sharpened stakes in front of the wall, with a few gaps */
  const sy = wy - 9;
  for (let X = 3; X < W - 3; X += 7) {
    if (r() < 0.22) continue;
    px('#05060c', X + 2, sy + 5, 4, 1);
    for (let k = 0; k < 5; k++) {
      px('#5a3a28', X + k, sy + 4 - k);
      px('#5a3a28', X + 4 - k, sy + 4 - k);
    }
    px('#c2a080', X, sy + 4);
    px('#c2a080', X + 4, sy);
    px('#8a5a40', X + 2, sy + 2);
  }
  F.ground = c;
}

/** 空中飘的：萤火、落灰、火星、雪，各自有自己的轨迹，不受重力 / things drifting in the air: fireflies, ash, embers, snow, each on its own path, no gravity */
interface Mote { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; ph: number }
const motes: Mote[] = [];
function drawAmbient(x: CanvasRenderingContext2D, dt: number) {
  const W = world.W,
    H = world.H,
    T = theme();
  const want = T.amb === 'snow' ? 70 : T.amb === 'ember' ? 30 : 18;
  if (!calm() && motes.length < want && vr() < (T.amb === 'snow' ? 0.9 : 0.35)) {
    if (T.amb === 'snow') motes.push({ x: vr() * W, y: -2, vx: vrnd(-3, 3), vy: vrnd(7, 14), life: 9, max: 9, col: vr() < 0.7 ? '#f4f4f4' : '#94b0c2', ph: vr() * 6 });
    else if (T.amb === 'ember') motes.push({ x: vr() * W, y: H - 8 - vr() * H * 0.3, vx: vrnd(-4, 4), vy: -vrnd(6, 14), life: vrnd(2, 4), max: 4, col: vr() < 0.5 ? '#ef7d57' : '#ffcd75', ph: vr() * 6 });
    else if (T.amb === 'ash') motes.push({ x: vr() * W, y: -2, vx: vrnd(2, 6), vy: vrnd(3, 7), life: 10, max: 10, col: vr() < 0.6 ? '#566c86' : '#94b0c2', ph: vr() * 6 });
    else motes.push({ x: vr() * W, y: H * 0.2 + vr() * H * 0.6, vx: vrnd(-3, 3), vy: vrnd(-3, 3), life: vrnd(3, 6), max: 6, col: vr() < 0.6 ? '#a7f070' : '#fee761', ph: vr() * 6 });
  }
  for (const m of motes) {
    m.life -= dt;
    m.ph += dt;
    m.x += (m.vx + Math.sin(m.ph * 1.7) * (T.amb === 'snow' ? 4 : 2)) * dt;
    m.y += m.vy * dt;
    const ix = Math.round(m.x),
      iy = Math.round(m.y);
    /* 萤火一明一暗；别的到了寿命末尾用网点稀疏掉 / fireflies pulse; the rest thin out with the dot screen near the end of their life */
    const a = T.amb === 'fly' ? 0.5 + 0.5 * Math.sin(m.ph * 3) : Math.min(1, m.life / 1.2);
    if (!dotOn(ix, iy, a)) continue;
    x.fillStyle = m.col;
    x.fillRect(ix, iy, 1, 1);
  }
  for (let i = motes.length - 1; i >= 0; i--) if (motes[i].life <= 0 || motes[i].y > H || motes[i].y < -4) motes.splice(i, 1);
}

/** 城墙上的火把：火苗跳动，墙前地上照出一小团暖光 / torches on the wall: flickering flames and a small warm pool of light on the ground in front */
function drawTorches(x: CanvasRenderingContext2D, now: number) {
  const W = world.W,
    wy = WALLY();
  for (let tx = 14, i = 0; tx < W - 6; tx += 30, i++) {
    const fl = 0.5 + 0.5 * Math.sin(now / 90 + i * 2.1) * Math.sin(now / 37 + i);
    for (let k = 0; k < 4; k++) {
      const rw = 22 - k * 5,
        rh = 5 - k;
      ditherRect(x, tx - rw / 2, wy - 3 - rh, rw, rh, k < 2 ? '#5a3a28' : '#8a5a40', (0.18 + 0.08 * fl) * (1 + k * 0.4));
    }
    x.fillStyle = '#3a2418';
    x.fillRect(tx, wy - 4, 1, 4);
    const h = 2 + Math.round(fl * 2);
    x.fillStyle = '#b13e53';
    x.fillRect(tx - 1, wy - 4 - h + 1, 3, h - 1);
    x.fillStyle = '#ef7d57';
    x.fillRect(tx, wy - 4 - h, 1, h);
    x.fillStyle = '#fee761';
    x.fillRect(tx, wy - 5, 1, 1);
  }
}

/* ---------------- 特效（给 SimView 用） ---------------- / ---------------- Effects (for SimView) ---------------- */
export function part(x: number, y: number, vx: number, vy: number, life: number, col: string, sz?: number) {
  if (F.parts.length > 600) F.parts.shift();
  F.parts.push({ x, y, vx, vy, life, max: life, col, sz: sz || 1 });
}
export function num(x: number, y: number, str: string, col: string, s: number) {
  if (F.nums.length > 70) F.nums.shift();
  F.nums.push({ x, y, str, col, s, life: 0.8 });
}
/** 伤害飘字。同一个敌人 0.25 秒内的同色伤害合成一个数往上加，不再叠成一团；
 * 普通命中小号、淡色、很快消失；暴击大号黄色、弹一下；同屏太多时普通命中直接不显示
 * damage numbers. Same-colored damage on one enemy within 0.25 s merges into one rising total instead of piling up;
 * normal hits are small, pale and short-lived; crits are big, yellow and pop; when the screen is busy, normal hits are skipped */
export function dmgNum(e: Enemy, a: number, crit: boolean, kind: 'burn' | 'poison' | null) {
  if (!SETTINGS.nums) return;
  const col = kind === 'poison' ? '#7ddc5f' : kind === 'burn' ? '#ef7d57' : crit ? '#fee761' : '#c7cfdd';
  const m = F.nums.find((n) => n.e === e && n.col === col && n.max! - n.life < 0.25);
  if (m) {
    m.v! += a;
    m.str = fmt(m.v!) + (m.crit ? '!' : '');
    if (m.v! >= 150) m.s = 2;
    m.pop = 0.1;
    m.life = m.max!;
    return;
  }
  if (!crit && F.nums.length >= 22) return;
  if (F.nums.length > 60) F.nums.shift();
  const life = crit ? 0.95 : kind ? 0.7 : 0.55;
  const str = fmt(a) + (crit ? '!' : ''),
    sz = crit || a >= 150 ? 2 : 1;
  /* 和已有的数字撞在一起就往上让一行，最多让三次 / if it collides with a number already up, step up a row, at most three times */
  const nx = ex(e) + vrnd(-5, 5);
  let ny = ey(e) - 12 - vrnd(0, 4);
  for (let k = 0; k < 3; k++) {
    const hitN = F.nums.find((n) => Math.abs(n.y - ny) < 7 * Math.max(n.s, sz) && Math.abs(n.x - nx) < ((n.str.length + str.length) * 5 * Math.max(n.s, sz)) / 2);
    if (!hitN) break;
    ny = hitN.y - 7 * Math.max(hitN.s, sz);
  }
  F.nums.push({ x: nx, y: ny, str, col, s: sz, life, max: life, e, v: a, pop: crit ? 0.16 : 0, crit });
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
/** 命中：按出手卡的元素出不同的迸溅；暴击加一圈亮环，击杀炸得更开 / hit: spark color follows the firing card's element; crits add a bright ring, kills burst wider */
const HITC: Record<string, [string, string]> = {
  blade: ['#ffffff', '#dfe6ee'], fire: ['#ffcd75', '#ef7d57'], ice: ['#c2f4ff', '#73eff7'],
  volt: ['#fee761', '#ffffff'], mech: ['#ffd166', '#c28a4d'], poison: ['#a7f070', '#7ddc5f'],
};
export function hit(x: number, y: number, tag: string | null, crit: boolean, kill: boolean, e?: Enemy) {
  const [c0, c1] = HITC[tag || ''] || ['#ffffff', '#ffffff'];
  if (e && !e.d.boss && !e.d.fixed) KB.set(e, Math.max(KB.get(e) || 0, crit ? 3 : 1.5));
  if (e && kill) shatter(e);
  if (e && kill && (e.d.boss || e.d.elite)) hitstop(0.12);
  else if (e && crit && kill) hitstop(0.05);
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
/** 敌人死亡：整张图碎成自己的像素块往外迸，地上留一块焦痕 / enemy death: the sprite breaks into its own pixels flying outward, leaving a scorch mark on the ground */
function shatter(e: Enemy) {
  const sp = spr(e.sprK || e.d.spr),
    sc = e.d.sc;
  const cx = ex(e),
    feet = ey(e);
  const left = cx - (sp.w * sc) / 2,
    top = feet - sp.h * sc;
  const px = sp.pix;
  /* 大图只取一部分像素，粒子总数压在 60 以内 / big sprites use a subset so particles stay under 60 */
  const step = Math.max(1, Math.ceil(px.length / 60));
  for (let i = 0; i < px.length; i += step) {
    const [ix, iy, col] = px[i];
    const x0 = left + ix * sc,
      y0 = top + iy * sc;
    const dx = x0 - cx,
      dy = y0 - (feet - (sp.h * sc) / 2);
    const d = Math.hypot(dx, dy) || 1;
    const sp2 = vrnd(25, 60);
    part(x0, y0, (dx / d) * sp2 + vrnd(-8, 8), (dy / d) * sp2 - vrnd(20, 45), vrnd(0.3, 0.55), col, Math.max(1, Math.round(sc * step > 1 ? sc * 1.5 : sc)));
  }
  if (F.marks.length > 30) F.marks.shift();
  F.marks.push({ x: cx, y: feet, w: Math.max(4, Math.round(sp.w * sc * 0.6)), life: 2.2, max: 2.2 });
}
/** 卡牌出手：城墙底边冒一下枪口火光，元素色的火星往上窜 / card fires: a muzzle flash at the bottom edge, element-colored sparks shooting upward */
export function muzzle(x0: number, tag: string | null) {
  const [c0, c1] = HITC[tag || ''] || ['#ffffff', '#dfe6ee'];
  const y0 = world.H - 2;
  ring(x0, y0, 1, 6, c0, 0.14);
  for (let i = 0; i < 5; i++) part(x0 + vrnd(-2, 2), y0, vrnd(-14, 14), -vrnd(50, 110), vrnd(0.12, 0.22), i % 2 ? c0 : c1, i === 0 ? 2 : 1);
}
export const shake = (n: number) => {
  F.shake = Math.max(F.shake, n);
};
export const wallFlash = () => {
  F.wallFlash = 0.4;
};

/* ---------------- 画 ---------------- / ---------------- Draw ---------------- */
/* 线和圈都按像素画；a < 1 时用网点稀疏掉，代替半透明 / lines and rings are drawn per pixel; with a < 1 a dot screen thins them out instead of alpha */
function pline(x: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, a = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  x.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    const ix = Math.round(x0 + (x1 - x0) * t),
      iy = Math.round(y0 + (y1 - y0) * t);
    if (a >= 1 || dotOn(ix, iy, a)) x.fillRect(ix, iy, 1, 1);
  }
}
function pcircle(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, a = 1) {
  x.fillStyle = col;
  const n = Math.max(12, Math.floor(r * 4));
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 6.283;
    const ix = Math.round(cx + Math.cos(t) * r),
      iy = Math.round(cy + Math.sin(t) * r * 0.6);
    if (a >= 1 || dotOn(ix, iy, a)) x.fillRect(ix, iy, 1, 1);
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
/** 非数字的飘字（「壳」「碎」「处决」）：用缝合像素字体，12px 是它的原生字号，加一圈深色描边 / non-numeric floating text ('shell', 'shatter', 'execute'): use the Fusion Pixel font at 12px (its native size) with a dark outline */
function drawWord(x: CanvasRenderingContext2D, str: string, cx: number, cy: number, col: string) {
  /* 画布字体自带灰阶抗锯齿，先二值化再贴，字边不会出现调色板外的灰 / canvas text is antialiased in gray, so binarize it first; no off-palette gray at the glyph edges */
  const img = crispText(str, "12px 'Fusion Pixel', sans-serif", col, '#1a1c2c');
  x.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy) - 5);
}
const isDigits = (s: string) => /^[0-9k!+\-x]+$/.test(s);

export function drawField(dt: number) {
  const x = F.ctx,
    W = world.W,
    H = world.H;
  if (!x) return;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, W, H);
  if (F.shake > 0 && !calm() && SETTINGS.shake) x.translate(Math.round(vrnd(-1, 1) * F.shake), Math.round(vrnd(-1, 1) * F.shake));
  F.shake = Math.max(0, F.shake - dt * 18);
  x.fillStyle = '#0a0c14';
  x.fillRect(-4, -4, W + 8, H + 8);
  if (!F.ground || F.groundR !== G.round || F.themeK !== themeKey()) buildGround();
  if (F.ground) x.drawImage(F.ground, 0, 0);
  for (const m of F.marks) {
    m.life -= dt;
    ditherRect(x, Math.round(m.x - m.w / 2), Math.round(m.y) - 1, m.w, 2, '#05060c', 0.7 * Math.min(1, m.life / m.max * 2));
  }
  F.marks = F.marks.filter((m) => m.life > 0);
  /* 危险区：敌人逼近城墙时泛红 / danger zone: tints red as enemies approach the wall */
  let danger = 0;
  if (B) for (const e of B.en) if (e.y > 0.72) danger = Math.max(danger, (e.y - 0.72) / 0.28);
  if (danger > 0)
    for (let i = 0; i < 12; i++) ditherRect(x, 0, WALLY() - i * 3 - 3, W, 3, '#e43b44', 0.26 * danger * (1 - i / 12));
  /* 城墙 / the wall */
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
  /* 垛口：受光一侧亮一格，背光一侧暗一格，脚下一道阴影 / merlons: one lit cell on the lit side, one dark cell on the shaded side, a shadow line at the foot */
  x.fillStyle = '#05060c';
  x.fillRect(0, wy - 1, W, 1);
  for (let bx = 1; bx < W; bx += 8) {
    x.fillStyle = '#7d6a5a';
    x.fillRect(bx, wy - 3, 5, 3);
    x.fillStyle = '#9c8670';
    x.fillRect(bx, wy - 3, 5, 1);
    x.fillRect(bx, wy - 3, 1, 3);
    x.fillStyle = '#4a3c3a';
    x.fillRect(bx + 4, wy - 2, 1, 2);
  }
  drawTorches(x, performance.now());
  if (F.broken)
    /* 塌掉的几段：垛口没了，墙身露出黑洞 / collapsed sections: merlons gone, black holes in the wall */
    for (let k = 0; k < 4; k++) {
      const gx = Math.round(((k + 0.5) / 4) * W + Math.sin(k * 7.3) * 12),
        gw = 9 + ((k * 5) % 7);
      x.fillStyle = '#05060c';
      x.fillRect(gx - gw / 2, wy - 3, gw, 6);
      x.fillStyle = '#2a2130';
      x.fillRect(gx - gw / 2 - 1, wy + 3, gw + 2, 2);
      x.fillStyle = '#7d6a5a';
      for (let j = 0; j < gw; j += 3) x.fillRect(gx - gw / 2 + j, wy + 2 - (j % 2), 2, 1);
    }
  if (F.wallFlash > 0) {
    ditherRect(x, 0, wy - 3, W, 10, '#e43b44', F.wallFlash * 1.4);
    F.wallFlash -= dt;
  }
  /* 射程线；雾母起雾时压低，线上面盖一层雾 / range line; fog from the Fog Mother lowers it and covers it with mist */
  {
    const veil = B && B.flags.veilT > B.t ? TUNE.veil : 0;
    const ry = Math.round(world.top + (world.range + veil) * (WALLY() - 2 - world.top));
    if (veil) {
      /* 雾：越靠近射程线越浓，按 4 行一档的网点堆出来 / fog: denser toward the range line, stacked as a dot screen in 4-row steps */
      const span = ry - world.top;
      for (let yy = 0; yy < span; yy += 4) ditherRect(x, 0, world.top + yy, W, Math.min(4, span - yy), '#9fd8d0', 0.3 * ((yy + 2) / span));
    }
    /* 原来是 22% / 50% 的半透明虚线，换成预先混好的调色板色 / was a 22% / 50% translucent dash; now a pre-mixed solid color */
    x.fillStyle = veil ? '#577a78' : '#4a3f2c';
    for (let xx = 0; xx < W; xx += 6) x.fillRect(xx, ry, 3, 1);
  }
  const now = performance.now();
  if (B && B.shield > 0) {
    const a = 0.5 + 0.25 * Math.sin(now / 150);
    ditherRect(x, 0, wy - 5, W, 1, '#8fe3ff', a);
    ditherRect(x, 0, wy - 7, W, 1, '#8fe3ff', a);
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
    pcircle(x, r.x, r.y, r.r0 + (r.r1 - r.r0) * k, r.col, Math.max(0, r.life / r.max) * 1.3);
  }
  F.rings = F.rings.filter((r) => r.life > 0);
  for (const b of F.bolts) {
    b.life -= dt;
    const col = Math.floor(b.life * 40) % 2 ? b.col : '#ffffff';
    for (const s of b.segs) pline(x, s[0], s[1], s[2], s[3], col);
  }
  F.bolts = F.bolts.filter((b) => b.life > 0);
  /* 粒子：不叠加发光（lighter 会混出调色板外的颜色），淡出改成网点稀疏 / particles: no additive glow ('lighter' mixes off-palette colors); the fade-out thins them with the dot screen */
  for (const p of F.parts) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    const ix = Math.round(p.x),
      iy = Math.round(p.y);
    if (!dotOn(ix, iy, Math.min(1, (p.life / p.max) * 1.8))) continue;
    x.fillStyle = p.col;
    x.fillRect(ix, iy, p.sz, p.sz);
  }
  F.parts = F.parts.filter((p) => p.life > 0);
  drawAmbient(x, dt);
  /* 天亮：北边天际先泛起暖色，慢慢往下铺 / dawn: warm light first rises on the northern horizon, then spreads downward */
  if (F.dawn >= 0) {
    F.dawn = Math.min(1, F.dawn + dt / 2.2);
    const reach = Math.round(H * 0.3 * F.dawn);
    for (let yy = 0; yy < reach; yy += 2) {
      const k = 1 - yy / Math.max(1, reach);
      ditherRect(x, 0, yy, W, 2, k > 0.7 ? '#ffcd75' : k > 0.35 ? '#ef7d57' : '#5d275d', 0.28 * k * F.dawn);
    }
  }
  /* 开战的幕布：先是一片黑，从城墙往北一点点看清，黑幕的下沿是一条网点过渡
   * the opening curtain: all dark at first, sight reaching from the wall northward; the curtain's lower edge is a dotted transition band */
  if (F.curtain > 0) {
    F.curtain = Math.max(0, F.curtain - dt / 1.1);
    const k = F.curtain * (2 - F.curtain);
    const cover = Math.round((H + 18) * k) - 18;
    if (cover > 0) {
      x.fillStyle = '#05060c';
      x.fillRect(0, 0, W, cover);
    }
    for (let i = 0; i < 6; i++) ditherRect(x, 0, cover + i * 3, W, 3, '#05060c', 1 - (i + 1) / 7);
  }
  for (const n of F.nums) {
    n.life -= dt;
    const age = (n.max || 0.8) - n.life;
    n.y -= (age < 0.25 ? 30 : 5) * dt;
    if (n.pop) n.pop = Math.max(0, n.pop - dt);
    /* 收尾用网点稀疏掉，不再一闪一闪 / fade out by thinning with the dot screen instead of blinking */
    if (n.life < 0.18 && !dotOn(Math.round(n.x), Math.round(n.y), n.life / 0.18)) continue;
    /* 暴击和合并刚涨的时候放大一档、抖一格 / crits and freshly merged totals draw one size up with a 1-cell jitter */
    const s = n.s + (n.pop && n.crit ? 1 : 0),
      jx = n.pop ? Math.round(vrnd(-1, 1)) : 0;
    if (isDigits(n.str)) drawNum(x, n.str, n.x + jx, n.y, n.col, s);
    else drawWord(x, n.str, n.x, n.y, n.col);
  }
  F.nums = F.nums.filter((n) => n.life > 0);
}

/* 硬投影：月光从左上来，影子是剪影压扁后往右下错开，一行一行贴；影子不跟着跳，怪物蹦起来时脚下会离地
 * hard cast shadow: moonlight from the upper left, so the shadow is the silhouette squashed and sheared to the lower right, pasted row by row;
 * it does not bob, so a hopping enemy visibly leaves the ground */
function castShadow(x: CanvasRenderingContext2D, sil: HTMLCanvasElement, sw: number, sh: number, sc: number, cx: number, feet: number) {
  const w = sw * sc,
    left = Math.round(cx - w / 2);
  for (let r = 0; r < sh; r += 2) {
    const dx = Math.round(r * 0.55 * sc),
      dy = Math.round(r * 0.22 * sc);
    x.drawImage(sil, 0, sh - 1 - r, sw, 1, left + dx, feet + dy, w, Math.max(1, Math.round(sc * 0.5)));
  }
}

function drawBattle(x: CanvasRenderingContext2D, W: number) {
  const b = B!;
  const now = b.t;
  /* 北边的火把 / torches to the north */
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
  /* 光环 / auras */
  for (const s of list) {
    if (!s.d.aura || s.y < -0.02) continue;
    const R2 = s.d.aura * K();
    const col = s.d.guard ? '#41a6f6' : s.d.haste ? '#e43b44' : '#7ee8a2';
    const pulse = 0.12 + 0.08 * Math.sin(now * 4 + s.ph);
    pcircle(x, ex(s), ey(s) - 5, R2 * (s.d.haste ? 0.85 + 0.15 * Math.sin(now * 6) : 1), col, pulse * 2.4);
    if (s.d.guard)
      for (const o of list)
        if (o !== s && o.armorB && Math.hypot(ex(o) - ex(s), ey(o) - ey(s)) <= R2 && vr() < 0.5) {
          pline(x, ex(s), ey(s) - 5, ex(o), ey(o) - 5, '#41a6f6', 0.5);
        }
  }
  /* 先画全部影子，再画敌人：影子只落在地上，不会盖住前面的怪 / all shadows first, then enemies: shadows land on the ground only, never over another enemy */
  for (const e of list) {
    if (rising(e) || phased(e) || now - (e.bornT || 0) < 0.4) continue;
    const sp = spr(e.sprK || e.d.spr);
    castShadow(x, sp.shadow, sp.w, sp.h, e.d.sc, ex(e), Math.round(ey(e)) - 1);
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
    let fade = 1;
    if (age < 0.4 && !e.d.fixed) fade = Math.max(0.15, age / 0.4);
    if (phased(e)) fade = 0.3 + 0.1 * Math.sin(now * 20);
    if (e.d.raise && e.y > 0) pcircle(x, ex(e), ey(e) - 5, 50 * K(), '#b77cff', (0.1 + 0.06 * Math.sin(now * 3 + e.ph)) * 2.4);
    if (e.d.rage && e.hp < e.maxHp * 0.5 && vr() < 0.3) part(ex(e) + vrnd(-4, 4), ey(e) - vrnd(4, 10), 0, -vrnd(10, 25), 0.3, '#e43b44', 1);
    if (e.d.bomb && vr() < 0.3) part(ex(e) + 3, ey(e) - 11, vrnd(-6, 6), -vrnd(5, 15), 0.25, vr() < 0.5 ? '#fee761' : '#ef7d57', 1);
    const kb = KB.get(e) || 0;
    if (kb > 0) KB.set(e, kb < 0.2 ? 0 : kb * 0.8);
    const px = Math.round(ex(e) - w / 2),
      py = Math.round(ey(e) - h + bob - kb);
    if (e.d.boss) {
      const a = 0.25 + 0.15 * Math.sin(now * 5);
      pcircle(x, px + w / 2, py + h / 2, w * 0.7, '#e43b44', a * 1.8);
    }
    if (rising(e)) {
      /* 从地里一点点钻出来 / emerging from the ground a little at a time */
      const k = Math.max(0.1, (now - e.bornT) / 0.5),
        hh = Math.max(1, Math.round(sp.h * k));
      x.drawImage(sp.cv, 0, 0, sp.w, hh, px, py + h - hh * sc, w, hh * sc);
    } else if (fade >= 1 && !e.d.fixed && !e.d.zig && e.type !== 'slime' && e.type !== 'mini' && sp.h >= 6) {
      /* 走路：脚下几行左右错一格，两帧交替，图不用重画 / walking: the bottom rows shift one cell left and right on alternate frames, no redrawn art needed */
      const legs = Math.max(2, Math.round(sp.h / 4)) + 1,
        rh = sp.h + 2,
        top = rh - legs,
        st = Math.floor(now * 6 + e.ph * 3) % 2 ? sc : -sc;
      x.drawImage(sp.rim, 0, 0, sp.w + 2, top, px - sc, py - sc, w + 2 * sc, top * sc);
      x.drawImage(sp.rim, 0, top, sp.w + 2, legs, px - sc + st, py - sc + top * sc, w + 2 * sc, legs * sc);
    } else drawDithered(x, sp.rim, px - sc, py - sc, w + 2 * sc, h + 2 * sc, fade);
    if (e.armorB) {
      x.fillStyle = '#41a6f6';
      x.fillRect(px - 1, py + 2, 2, 3);
    }
    if (e.hasteB && vr() < 0.2) part(ex(e) + vrnd(-3, 3), ey(e), 0, -vrnd(5, 15), 0.3, '#ef7d57', 1);
    if (e.slowT > 0 || e.frzT > 0) {
      drawDithered(x, sp.ice, px, py, w, h, e.frzT > 0 ? 0.8 : 0.4);
    }
    if (e.vulnT > 0) {
      x.fillStyle = '#ff5a8a';
      x.fillRect(Math.round(px + w / 2) - 1, Math.round(py) - 4, 3, 3);
      x.fillStyle = '#fff';
      x.fillRect(Math.round(px + w / 2), Math.round(py) - 3, 1, 1);
    }
    if (e.hardT > 0) {
      drawDithered(x, sp.white, px, py, w, h, 0.3 + 0.2 * Math.sin(now * 20));
    }
    if (e.flash > 0) {
      drawDithered(x, sp.white, px, py, w, h, Math.min(e.d.boss || e.d.elite ? 0.4 : 0.8, e.flash * 14));
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
  /* 投石 / rock throw */
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
  /* 弹道 / projectiles */
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

