/* 生成原生壳的图标和启动图源文件（resources/），再用 @capacitor/assets 导出各尺寸：
 *   node tools/make-app-assets.mjs && npx @capacitor/assets generate --assetPath resources
 * 图标：八根 S 形波浪线从中心向外飘开，像丝带；每根一种颜色，圆头、带一点柔光。
 * 启动图仍是三条从短到长的像素横线——黎明的光、守夜的火、城墙。按整数倍放大，像素不糊 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('src/data/art/generated.ts', 'utf8');
const json = (name) => JSON.parse(src.slice(src.indexOf(name) + name.length).split(';\n')[0]);
const EXTRA = json('export const EXTRA_PAL: Record<string, string> = ');
const palSrc = readFileSync('src/data/art/palette.ts', 'utf8');
const BASE = JSON.parse(palSrc.slice(palSrc.indexOf('{ ...') + 5, palSrc.indexOf(', ...EXTRA_PAL')));
const PAL = { ...BASE, ...EXTRA };
const BG = '#0f1c20';

mkdirSync('resources', { recursive: true });
const b = await chromium.launch();
const pg = await b.newPage();
const draw = (opt) =>
  pg.evaluate(
    ({ rows, PAL, size, scale, bg, glow, title }) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const x = cv.getContext('2d');
      if (bg) {
        x.fillStyle = bg;
        x.fillRect(0, 0, size, size);
      }
      if (glow) {
        const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.45);
        g.addColorStop(0, 'rgba(255,205,117,.35)');
        g.addColorStop(1, 'rgba(255,205,117,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, size, size);
      }
      const w = rows[0].length,
        h = rows.length;
      const ox = Math.round((size - w * scale) / 2),
        oy = Math.round((size - h * scale) / 2) - (title ? scale * 2 : 0);
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const c = rows[j][i];
          if (c === '.') continue;
          x.fillStyle = PAL[c];
          x.fillRect(ox + i * scale, oy + j * scale, scale, scale);
        }
      return cv.toDataURL('image/png');
    },
    { PAL, ...opt },
  );
/* 图标：k 是线条整体占画面的比例（安卓自适应图标的前景要缩进安全区） */
const rays = (opt) =>
  pg.evaluate(
    ({ size, bg, k }) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const x = cv.getContext('2d');
      if (bg) {
        x.fillStyle = bg;
        x.fillRect(0, 0, size, size);
        const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.5);
        g.addColorStop(0, 'rgba(255,240,220,.10)');
        g.addColorStop(1, 'rgba(255,240,220,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, size, size);
      }
      const C = size / 2,
        R = size * 0.39 * k;
      const COLS = ['#ff8a5b', '#ffd166', '#a7f070', '#73eff7', '#7aa8ff', '#c38cff', '#ff95dc', '#ff5a8a'];
      const N = COLS.length;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        /* 半径往外走，角度按正弦来回摆，越往外摆得越开 */
        const pt = (t) => {
          const r = R * (0.12 + 0.88 * t),
            th = a + Math.sin(t * Math.PI * 2) * 0.18 * t;
          return [C + Math.cos(th) * r, C + Math.sin(th) * r];
        };
        const p0 = pt(0),
          p2 = pt(1);
        const gr = x.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        gr.addColorStop(0, COLS[i] + '33');
        gr.addColorStop(0.35, COLS[i]);
        gr.addColorStop(1, COLS[i] + 'ee');
        x.strokeStyle = gr;
        x.lineWidth = size * 0.04 * k;
        x.shadowColor = COLS[i];
        x.shadowBlur = size * 0.045 * k;
        x.beginPath();
        for (let t = 0; t <= 1.001; t += 0.02) {
          const [px, py] = pt(t);
          t ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
      x.shadowBlur = 0;
      return cv.toDataURL('image/png');
    },
    opt,
  );
const save = (f, url) => writeFileSync('resources/' + f, Buffer.from(url.split(',')[1], 'base64'));
/* 32×32 网格：三条两格粗的横线，两端各收一格暗色，留出像素台阶 */
const line = (len, mid, edge) => {
  const pad = (32 - len) / 2;
  return '.'.repeat(pad) + edge + mid.repeat(len - 2) + edge + '.'.repeat(pad);
};
const blank = '.'.repeat(32);
const LINES = [
  ...Array(10).fill(blank),
  line(8, 'Y', 'y'), line(8, 'Y', 'y'),
  blank, blank, blank,
  line(14, 'o', 'R'), line(14, 'o', 'R'),
  blank, blank, blank,
  line(22, 'g', 's'), line(22, 'g', 's'),
  ...Array(10).fill(blank),
];
const lantern = LINES;
save('icon-only.png', await rays({ size: 1024, bg: BG, k: 1 }));
save('icon-foreground.png', await rays({ size: 1024, bg: null, k: 0.62 }));
save('icon-background.png', await draw({ rows: [''], size: 1024, scale: 1, bg: BG, glow: false }));
/* 网页版装到主屏用的图标（public/icons/，manifest 和 apple-touch-icon 引用）。
 * maskable：安卓会裁成圆形或圆角方形，内容缩进安全区 */
const pub = (f, url) => writeFileSync('public/icons/' + f, Buffer.from(url.split(',')[1], 'base64'));
mkdirSync('public/icons', { recursive: true });
pub('icon-192.png', await rays({ size: 192, bg: BG, k: 1 }));
pub('icon-512.png', await rays({ size: 512, bg: BG, k: 1 }));
pub('maskable-512.png', await rays({ size: 512, bg: BG, k: 0.8 }));
pub('apple-touch-icon.png', await rays({ size: 180, bg: BG, k: 1 }));
save('splash.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
save('splash-dark.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
await b.close();
console.log('resources/ 已生成');
