/* 有序抖动：战场上的「半透明」一律用 4×4 Bayer 网点表达，不混色，画面里只出现调色板里的颜色。
 * 网点贴在战场坐标上（不跟着精灵走），静止的东西不闪，移动时网点也不会跟着滑。
 * Ordered dither: every "translucent" thing on the battlefield is drawn as a 4×4 Bayer screen instead of
 * alpha blending, so only palette colors ever reach the screen. The screen is anchored to battlefield
 * coordinates (not to the sprite), so still things never shimmer and moving things don't drag the pattern. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 网点阈值 0..1 / threshold in 0..1 */
export const bayer = (ix: number, iy: number) => (BAYER[(iy & 3) * 4 + (ix & 3)] + 0.5) / 16;
/** 这个像素在覆盖率 a 下要不要画 / whether this pixel is drawn at coverage a */
export const dotOn = (ix: number, iy: number, a: number) => a > bayer(ix, iy);
/** 覆盖率量化成 0..16 档 / coverage quantized to 0..16 steps */
export const level = (a: number) => Math.max(0, Math.min(16, Math.round(a * 16)));

const pats = new Map<string, CanvasPattern>();
/** color 在第 lv 档覆盖率下的 4×4 网点图案（其余像素透明） / 4×4 screen of color at step lv (other pixels transparent) */
export function dotPattern(x: CanvasRenderingContext2D, color: string, lv: number): CanvasPattern | null {
  const key = color + '@' + lv;
  let p = pats.get(key);
  if (p) return p;
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  for (let k = 0; k < 16; k++) if (BAYER[k] < lv) g.fillRect(k & 3, k >> 2, 1, 1);
  p = x.createPattern(c, 'repeat') || undefined;
  if (p) pats.set(key, p);
  return p || null;
}
/** 用网点铺一个矩形：覆盖率 a 的「半透明」纯色 / fill a rect with a dot screen: a palette-only "translucent" fill at coverage a */
export function ditherRect(x: CanvasRenderingContext2D, rx: number, ry: number, w: number, h: number, color: string, a: number) {
  const lv = level(a);
  if (!lv || w <= 0 || h <= 0) return;
  if (lv >= 16) {
    x.fillStyle = color;
    x.fillRect(rx, ry, w, h);
    return;
  }
  const p = dotPattern(x, color, lv);
  if (!p) return;
  x.fillStyle = p;
  x.fillRect(rx, ry, w, h);
}

/* 精灵的抖动淡入淡出：先在小画布上画好，再用网点 destination-in 抠掉一部分像素 / dithered sprite fade: draw onto a scratch canvas, then knock pixels out with a dot screen via destination-in */
let scratch: HTMLCanvasElement | null = null;
let sx: CanvasRenderingContext2D | null = null;
export function drawDithered(x: CanvasRenderingContext2D, img: CanvasImageSource, px: number, py: number, w: number, h: number, a: number) {
  const lv = level(a);
  if (!lv) return;
  if (lv >= 16) {
    x.drawImage(img, px, py, w, h);
    return;
  }
  if (!scratch) {
    scratch = document.createElement('canvas');
    sx = scratch.getContext('2d')!;
  }
  const g = sx!;
  if (scratch.width < w || scratch.height < h) {
    scratch.width = Math.max(scratch.width, w);
    scratch.height = Math.max(scratch.height, h);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  /* 网点对齐到战场坐标：把图案原点挪到 (-px, -py) / align the screen to battlefield coordinates: shift the pattern origin to (-px, -py) */
  g.translate(-(((px % 4) + 4) % 4), -(((py % 4) + 4) % 4));
  g.fillStyle = dotPattern(g, '#000', lv)!;
  g.fillRect(0, 0, w + 4, h + 4);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  x.drawImage(scratch, 0, 0, w, h, px, py, w, h);
}

/* 文字阈值化：画布字体总带灰阶抗锯齿，渲染一次后按 alpha 二值化缓存 / text thresholding: canvas text always carries grayscale antialiasing, so render once and cache it binarized by alpha */
const words = new Map<string, HTMLCanvasElement>();
export function crispText(str: string, font: string, col: string, outline: string): HTMLCanvasElement {
  const key = font + '|' + col + '|' + outline + '|' + str;
  let c = words.get(key);
  if (c) return c;
  const m = document.createElement('canvas').getContext('2d')!;
  m.font = font;
  const tw = Math.ceil(m.measureText(str).width) + 4,
    th = parseInt(font, 10) + 6;
  c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const g = c.getContext('2d')!;
  g.font = font;
  g.textBaseline = 'top';
  g.fillStyle = '#000';
  g.fillText(str, 2, 2);
  const id = g.getImageData(0, 0, tw, th);
  const on = new Uint8Array(tw * th);
  for (let i = 0; i < on.length; i++) on[i] = id.data[i * 4 + 3] >= 128 ? 1 : 0;
  g.clearRect(0, 0, tw, th);
  /* 先描边再填字，描边只落在字外 / outline first, then the glyphs; the outline only lands outside the glyphs */
  g.fillStyle = outline;
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      if (on[y * tw + x]) continue;
      const n = (dx: number, dy: number) => {
        const xx = x + dx,
          yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < tw && yy < th && on[yy * tw + xx];
      };
      if (n(-1, 0) || n(1, 0) || n(0, -1) || n(0, 1) || n(-1, -1)) g.fillRect(x, y, 1, 1);
    }
  g.fillStyle = col;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (on[y * tw + x]) g.fillRect(x, y, 1, 1);
  if (words.size > 200) words.clear();
  words.set(key, c);
  return c;
}
