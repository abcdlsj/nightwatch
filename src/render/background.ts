/* 背景：静态像素夜景，按场景换色（标题 / 备战 / 战斗 / 首领 / 结局） / Background: a static pixel night scene, recolored per scene (title / prep / battle / boss / ending) */
import { $ } from '../ui/dom';

type Pal = number[][];
const PALS: Record<string, Pal> = {
  title: [[0.78, 0.22, 0.2], [0.05, 0.38, 0.62], [0.05, 0.08, 0.1]],
  shop: [[0.12, 0.5, 0.38], [0.85, 0.6, 0.2], [0.03, 0.1, 0.09]],
  battle: [[0.4, 0.15, 0.4], [0.12, 0.32, 0.58], [0.04, 0.03, 0.08]],
  dread: [[0.42, 0.1, 0.22], [0.1, 0.16, 0.4], [0.03, 0.02, 0.05]],
  boss: [[0.78, 0.12, 0.14], [0.32, 0.04, 0.2], [0.05, 0.01, 0.03]],
  over: [[0.3, 0.3, 0.36], [0.5, 0.14, 0.14], [0.05, 0.05, 0.07]],
};
export type Scene = keyof typeof PALS;

/* 背景：一张静态的像素夜景，按场景换色——上面是网点过渡的夜空和几颗星，底下是远处城墙和屋顶的剪影。
 * 以前是一直转的漩涡着色器，在面板后面晃，像网页特效；换成不动的画，界面看起来是同一个世界里的东西，也省电
 * background: a static pixel night scene recolored per scene: a dithered night sky with a few stars on top, the silhouette of a distant wall and rooftops at the bottom.
 * It used to be an ever-turning vortex shader wobbling behind the panels, like a web effect; a still picture makes the UI feel part of the same world, and saves battery */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`;

let setPal: (n: Scene) => void = () => {};
const listeners: ((n: Scene) => void)[] = [];

export function initBackground() {
  const cv = $('#bg') as HTMLCanvasElement;
  const x = cv.getContext('2d');
  if (!x) {
    cv.style.background = '#0f1c20';
    return;
  }
  let pal = PALS.title;
  /* 每格约 4 个 CSS 像素，取整到物理像素，格子大小一致 / each cell is about 4 CSS px, snapped to whole device pixels so every cell is the same size */
  const draw = () => {
    const dpr = devicePixelRatio || 1,
      k = Math.max(1, Math.round(4 * dpr)) / dpr;
    const W = Math.max(40, Math.ceil(innerWidth / k)),
      H = Math.max(40, Math.ceil(innerHeight / k));
    cv.width = W;
    cv.height = H;
    cv.style.width = W * k + 'px';
    cv.style.height = H * k + 'px';
    const [A, B, C] = pal;
    /* 夜空五档：顶上最暗，往下慢慢透出场景色 / five sky tones: darkest at the top, the scene color seeping in lower down */
    const tones = [mix(C, [0, 0, 0], 0.35), C, mix(C, B, 0.18), mix(C, B, 0.32), mix(C, A, 0.3)].map(css);
    const id = x.createImageData(W, H),
      d = id.data;
    const rgb = tones.map((t) => t.slice(4, -1).split(',').map(Number));
    for (let yy = 0; yy < H; yy++) {
      const v = Math.pow(yy / (H - 1), 1.4) * (tones.length - 1);
      for (let xx = 0; xx < W; xx++) {
        const c = rgb[Math.min(tones.length - 1, Math.floor(v + bay(xx, yy)))],
          o = (yy * W + xx) * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0);
    let sd = 11;
    const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < (W * H) / 140; i++) {
      const sx = Math.floor(r() * W),
        sy = Math.floor(r() * H * 0.6);
      x.fillStyle = r() < 0.15 ? '#f4f4f4' : r() < 0.5 ? '#94b0c2' : '#566c86';
      x.fillRect(sx, sy, 1, 1);
    }
    /* 远处的屋顶和城墙剪影 / distant rooftops and the wall's silhouette */
    const base = Math.round(H * 0.9),
      sil = css(mix(C, [0, 0, 0], 0.6)),
      win = css(mix(A, [1, 0.85, 0.5], 0.5));
    x.fillStyle = sil;
    for (let hx = 0; hx < W; ) {
      const w = 4 + Math.floor(r() * 7),
        h = 3 + Math.floor(r() * 9);
      x.fillRect(hx, base - h, w, H - base + h);
      if (r() < 0.4) for (let k2 = 0; k2 < Math.ceil(w / 2); k2++) x.fillRect(hx + k2, base - h - k2, w - 2 * k2, 1);
      if (r() < 0.35) {
        x.fillStyle = win;
        x.fillRect(hx + 1 + Math.floor(r() * (w - 2)), base - h + 2, 1, 1);
        x.fillStyle = sil;
      }
      hx += w;
    }
    x.fillStyle = css(mix(C, [0, 0, 0], 0.75));
    x.fillRect(0, base + 2, W, H - base);
    for (let bx = 0; bx < W; bx += 4) x.fillRect(bx, base, 2, 2);
  };
  draw();
  addEventListener('resize', draw);
  setPal = (n) => {
    if (PALS[n] && PALS[n] !== pal) {
      pal = PALS[n];
      draw();
    }
  };
}

/** 换场景：背景换色，背景音乐跟着换曲 / scene change: recolor the background and switch the background music */
export function setScene(n: Scene) {
  setPal(n);
  for (const f of listeners) f(n);
}
export const onScene = (f: (n: Scene) => void) => listeners.push(f);
