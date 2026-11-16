/* 界面层特效：盖在整页上的画布，画卡与卡之间的连线、合成时的迸溅、飞向顶栏的金币 / Overlay effects: a full-page canvas drawing links between cards, merge bursts, and gold flying to the top bar */
import { vr, vrnd } from '../core/rng';
import { $ } from '../ui/dom';
import { spr } from './sprites';
import { dotOn } from './dither';

/** 界面层也按像素格画：一格约 3 个 CSS 像素（取整到物理像素），淡出用网点稀疏，不用半透明 / the overlay draws on a pixel grid too: about 3 CSS px per cell (rounded to device pixels), fading by thinning with the dot screen instead of alpha */
let PX = 3;
/** 在像素格 (gx, gy) 上点一格；a < 1 时按网点决定点不点 / plot one cell at grid (gx, gy); with a < 1 the dot screen decides */
function cell(gx: number, gy: number, col: string, a = 1) {
  if (a < 1 && !dotOn(gx, gy, a)) return;
  x.fillStyle = col;
  x.fillRect(gx * PX, gy * PX, PX, PX);
}
/** 两点之间按像素格连一条线 / a line between two points, stepped on the pixel grid */
function gline(x0: number, y0: number, x1: number, y1: number, col: string, a: number) {
  const g0 = Math.round(x0 / PX), h0 = Math.round(y0 / PX), g1 = Math.round(x1 / PX), h1 = Math.round(y1 / PX);
  const n = Math.max(Math.abs(g1 - g0), Math.abs(h1 - h0), 1);
  for (let i = 0; i <= n; i++) cell(Math.round(g0 + ((g1 - g0) * i) / n), Math.round(h0 + ((h1 - h0) * i) / n), col, a);
}

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
    /* 按真实的设备像素比开画布，一格取整到整数个物理像素（DPR 2.625 这类屏上格子不会一宽一窄）
     * size the canvas at the real device pixel ratio and round a cell to whole device pixels (cells stay even on DPR 2.625 screens) */
    const dpr = devicePixelRatio || 1;
    PX = Math.max(1, Math.round(3 * dpr)) / dpr;
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
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
      items.push({ k: 'p', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, col: vr() < 0.3 ? '#f4f4f4' : col, life: vrnd(0.35, 0.7), max: 0.7 });
    }
  },
  /** 从元素中心迸溅 / burst from the element's center */
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
        cell(Math.round(it.x / PX), Math.round(it.y / PX), it.col, Math.max(0, (it.life / it.max) * 1.6));
      } else if (it.k === 'link') {
        it.life -= dt;
        /* 线：元素色一格宽，前半段亮成白色再退回元素色，最后用网点稀疏掉 / the line: one cell of element color, white for the first moment, then thinned out by the dot screen */
        const a = Math.min(1, (it.life / it.max) * 1.8),
          col = 1 - it.life / it.max < 0.15 ? '#f4f4f4' : it.col;
        for (let i = 1; i < it.pts.length; i++) gline(it.pts[i - 1][0], it.pts[i - 1][1], it.pts[i][0], it.pts[i][1], col, a);
        /* 光点沿线跑到接收的卡，在前 60% 的时间里跑完，到了迸一下 / a spark runs along the line to the receiving card, covering the first 60% of the time, then bursts on arrival */
        const k = Math.min(1, (1 - it.life / it.max) / 0.6);
        const f = k * (it.pts.length - 1),
          i0 = Math.min(it.pts.length - 2, Math.floor(f)),
          r = f - i0;
        const [ax, ay] = it.pts[i0],
          [bx, by] = it.pts[i0 + 1];
        const hx = ax + (bx - ax) * r,
          hy = ay + (by - ay) * r;
        if (k < 1) {
          const gx = Math.round(hx / PX),
            gy = Math.round(hy / PX);
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) cell(gx + dx, gy + dy, it.col);
          cell(gx, gy, '#f4f4f4');
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
        x.drawImage(spr('coin').cv, Math.round(px - 8), Math.round(py - 8), 16, 16);
        it.life = k >= 1 ? -1 : 1;
      }
    }
    for (const [hx, hy, col] of hits.splice(0)) this.burst(hx, hy, col, 6);
    items = items.filter((it) => (it.k === 'coin' ? it.t < 0 || (it.life ?? 1) > 0 : it.life > 0));
  },
};
