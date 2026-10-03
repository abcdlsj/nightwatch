/* 生成原生壳的图标和启动图源文件（resources/），再用 @capacitor/assets 导出各尺寸：
 *   node tools/make-app-assets.mjs && npx @capacitor/assets generate --assetPath resources
 * 图标：八根柔软的彩色弧线从中心向外散开，圆头、渐变、带一点柔光。
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
        R = size * 0.42 * k;
      const COLS = ['#ff8a5b', '#ffd166', '#a7f070', '#73eff7', '#7aa8ff', '#c38cff', '#ff95dc', '#ff5a8a'];
      const N = COLS.length;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const len = R * (i % 2 ? 0.86 : 1);
        const r0 = R * 0.16;
        /* 每根往同一个方向轻轻弯：控制点比终点多转一点 */
        const p0 = [C + Math.cos(a) * r0, C + Math.sin(a) * r0];
        const p1 = [C + Math.cos(a + 0.42) * len * 0.6, C + Math.sin(a + 0.42) * len * 0.6];
        const p2 = [C + Math.cos(a + 0.18) * len, C + Math.sin(a + 0.18) * len];
        const gr = x.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        gr.addColorStop(0, COLS[i] + '33');
        gr.addColorStop(0.35, COLS[i]);
        gr.addColorStop(1, COLS[(i + 1) % N]);
        x.strokeStyle = gr;
        x.lineWidth = size * 0.05 * k;
        x.shadowColor = COLS[i];
        x.shadowBlur = size * 0.04 * k;
        x.beginPath();
        x.moveTo(p0[0], p0[1]);
        x.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
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
save('splash.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
save('splash-dark.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
await b.close();
console.log('resources/ 已生成');
