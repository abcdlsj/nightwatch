/* 生成原生壳的图标和启动图源文件（resources/），再用 @capacitor/assets 导出各尺寸：
 *   node tools/make-app-assets.mjs && npx @capacitor/assets generate --assetPath resources
 * 图标只用线条：三条从短到长的像素横线——黎明的光、守夜的火、城墙。按整数倍放大，像素不糊 */
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
save('icon-only.png', await draw({ rows: lantern, size: 1024, scale: 32, bg: BG, glow: false }));
save('icon-foreground.png', await draw({ rows: lantern, size: 1024, scale: 20, bg: null, glow: false }));
save('icon-background.png', await draw({ rows: [''], size: 1024, scale: 1, bg: BG, glow: false }));
save('splash.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
save('splash-dark.png', await draw({ rows: lantern, size: 2732, scale: 12, bg: BG, glow: false }));
await b.close();
console.log('resources/ 已生成');
