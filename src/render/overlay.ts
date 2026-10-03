/* 界面层特效：盖在整页上的画布，画卡与卡之间的连线、合成时的迸溅、飞向顶栏的金币 */
import { vr, vrnd } from '../core/rng';
import { $ } from '../ui/dom';
import { spr } from './sprites';

type Item =
  | { k: 'link'; pts: number[][]; col: string; life: number; max: number; hit?: boolean }
  | { k: 'p'; x: number; y: number; vx: number; vy: number; col: string; life: number; max: number }
  | { k: 'coin'; x0: number; y0: number; x1: number; y1: number; t: number; dur: number; life?: number };

let cv: HTMLCanvasElement, x: CanvasRenderingContext2D;
let items: Item[] = [];
const hits: [number, number, string][] = [];

export function initOverlay() {
  cv = $('#fx') as HTMLCanvasElement;
  x = cv.getContext('2d')!;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.imageSmoothingEnabled = false;
  };
  size();
  addEventListener('resize', size);
}

const ctr = (el: Element) => {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + 14];
};

export const FX = {
  link(a: Element | null | undefined, b: Element | null | undefined, col: string, life?: number) {
    if (!a || !b) return;
    const [x0, y0] = ctr(a),
      [x1, y1] = ctr(b);
    const pts: number[][] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 16 + (i && i < n ? vrnd(-4, 4) : 0)]);
    }
    items.push({ k: 'link', pts, col, life: life || 0.3, max: life || 0.3 });
  },
  burst(cx: number, cy: number, col: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = vr() * 6.28,
        s = vrnd(60, 200);
      items.push({ k: 'p', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, col: vr() < 0.3 ? '#ffffff' : col, life: vrnd(0.35, 0.7), max: 0.7 });
    }
  },
  /** 从元素中心迸溅 */
  burstAt(el: Element | null | undefined, col: string, n: number) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.burst(r.left + r.width / 2, r.top + r.height / 2, col, n);
  },
  coins(cx: number, cy: number, n: number) {
    const t = $('#goldChip').getBoundingClientRect();
    for (let i = 0; i < n; i++) items.push({ k: 'coin', x0: cx + vrnd(-10, 10), y0: cy + vrnd(-10, 10), x1: t.left + 18, y1: t.top + t.height / 2, t: -i * 0.06, dur: 0.55 });
  },
  coinsAt(el: Element | null | undefined, n: number, top?: boolean) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.coins(r.left + r.width / 2, top ? r.top : r.top + r.height / 2, n);
  },
  draw(dt: number) {
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const it of items) {
      if (it.k === 'p') {
        it.life -= dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += 400 * dt;
        x.globalAlpha = Math.max(0, it.life / it.max);
        x.fillStyle = it.col;
        x.fillRect(Math.round(it.x), Math.round(it.y), 4, 4);
      } else if (it.k === 'link') {
        it.life -= dt;
        x.globalAlpha = Math.max(0, it.life / it.max);
        x.strokeStyle = it.col;
        x.lineWidth = 3;
        x.lineJoin = 'miter';
        x.beginPath();
        it.pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
        x.stroke();
        x.strokeStyle = '#fff';
        x.lineWidth = 1;
        x.stroke();
        /* 光点沿线跑到接收的卡，在前 60% 的时间里跑完，到了迸一下 */
        const k = Math.min(1, (1 - it.life / it.max) / 0.6);
        const f = k * (it.pts.length - 1),
          i0 = Math.min(it.pts.length - 2, Math.floor(f)),
          r = f - i0;
        const [ax, ay] = it.pts[i0],
          [bx, by] = it.pts[i0 + 1];
        const hx = ax + (bx - ax) * r,
          hy = ay + (by - ay) * r;
        if (k < 1) {
          x.globalAlpha = 1;
          x.fillStyle = it.col;
          x.fillRect(Math.round(hx) - 4, Math.round(hy) - 4, 8, 8);
          x.fillStyle = '#fff';
          x.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
        } else if (!it.hit) {
          it.hit = true;
          hits.push([hx, hy, it.col]);
        }
      } else {
        it.t += dt;
        if (it.t < 0) continue;
        const k = Math.min(1, it.t / it.dur),
          e = k * k * (3 - 2 * k);
        const px = it.x0 + (it.x1 - it.x0) * e,
          py = it.y0 + (it.y1 - it.y0) * e - Math.sin(k * Math.PI) * 40;
        x.globalAlpha = 1;
        x.drawImage(spr('coin').cv, Math.round(px - 8), Math.round(py - 8), 16, 16);
        it.life = k >= 1 ? -1 : 1;
      }
    }
    x.globalAlpha = 1;
    for (const [hx, hy, col] of hits.splice(0)) this.burst(hx, hy, col, 6);
    items = items.filter((it) => (it.k === 'coin' ? it.t < 0 || (it.life ?? 1) > 0 : it.life > 0));
  },
};
