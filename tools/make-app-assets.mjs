/* 生成原生壳的图标和启动图源文件（resources/），再用 @capacitor/assets 导出各尺寸：
 *   node tools/make-app-assets.mjs && npx @capacitor/assets generate --assetPath resources
 * 图标和启动图是同一幅 32×32 像素画：远处一轮月，近处的地，最前面一线暗红的城墙，墙头一个提灯的人。
 * 大半画面是天，留白给故事。按整数倍放大，像素不糊；安卓自适应图标和 PWA 的 maskable 会被裁成圆，
 * 月亮和人都放在中间 80% 的圆里
 * Generate the native shell's icon and splash sources (resources/), then export each size with @capacitor/assets: node tools/make-app-assets.mjs && npx @capacitor/assets generate --assetPath resources. The icon and splash are the same 32×32 pixel artwork: a moon in the distance, ground in the foreground, a dark-red wall at the very front, and a lantern-bearing figure on top. Most of the frame is sky, leaving space for the story. Scaled by integer factors to keep pixels crisp; Android adaptive icons and PWA maskable icons get cropped to a circle, so the moon and figure sit within the central 80% circle.
 */
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
/* 32×32 像素：天空由深到浅、远处一轮月、地平线上的远山、近处的地、最前面一线暗红的城墙和墙头一个提灯的人 / 32×32 pixels: sky fading from dark to light, a moon in the distance, far hills on the horizon, ground close up, and a dark-red wall at the very front with a lantern-bearing figure on top */
function grid() {
  const N = 32, g = [...Array(N)].map(() => Array(N).fill(null));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
  // 天空：四段，交界处一行棋盘格过渡
  // sky: four bands with a checkerboard transition row at each seam
  const sky = ['#0b1519', '#0e1b20', '#112227', '#15292f', '#193036'];
  const bandH = [0, 6, 11, 15, 19];
  for (let y = 0; y < N; y++) {
    let i = 0; for (let k = 0; k < bandH.length; k++) if (y >= bandH[k]) i = k;
    for (let x = 0; x < N; x++) {
      let c = sky[i];
      if (i > 0 && y === bandH[i] && (x + y) % 2 === 0) c = sky[i - 1];
      set(x, y, c);
    }
  }
  // 星：很少几颗
  // stars: only a few
  set(5, 4, '#6f858c'); set(13, 2, '#4a5e65'); set(27, 13, '#4a5e65'); set(9, 10, '#3d5057');
  // 月：直径 7，右上；左上亮、右下一弯暗面
  // moon: diameter 7, upper right; bright on the upper left with a dark crescent lower right
  const mx = 21.5, my = 8.5, R = 3.6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my);
    if (d <= R) {
      const shade = (x + 0.5 - mx) + (y + 0.5 - my) > 2.6;
      set(x, y, shade ? '#cbc1a0' : '#f1e9cb');
    } else if (d <= R + 1.1) set(x, y, '#1a2c32');
  }
  set(20, 7, '#e2d8b8'); // 月面一处淡斑
  // one faint patch on the moon's face
  // 远山：一条起伏的线，比天空亮一点点（被月光照着的雾）
  // far hills: an undulating line a touch brighter than the sky (moonlit mist)
  const far = (x) => Math.round(21 - 1.6 * Math.sin(x * 0.33 + 1.2) - 1.1 * Math.sin(x * 0.71 + 0.4));
  for (let x = 0; x < N; x++) for (let y = far(x); y < N; y++) set(x, y, y === far(x) ? '#24393f' : '#1c2e34');
  // 近地：更暗，缓坡
  // foreground ground: darker, a gentle slope
  const near = (x) => Math.round(25 - 1.2 * Math.sin(x * 0.18 + 2.4));
  for (let x = 0; x < N; x++) for (let y = near(x); y < N; y++) set(x, y, y === near(x) ? '#18272c' : '#111d21');
  // 前景：城墙，带垛口，暗红
  // foreground: the wall, with battlements, dark red
  const wy = 28;
  for (let x = 0; x < N; x++) {
    for (let y = wy; y < N; y++) set(x, y, y === wy ? '#4a1d22' : y === N - 1 ? '#22100f' : '#36161a');
    if (x % 4 < 2) set(x, wy - 1, '#3e191d');
  }
  // 墙头的人：在左三分之一，面朝月亮；手里一盏灯，灯光把墙头照红一点
  // the figure on the wall: at the left third, facing the moon; a lantern in hand reddens the wall top a little
  const px = 9, K = '#070b0d';
  set(px + 1, wy - 6, K);
  for (const [dy, x0, x1] of [[5, 0, 2], [4, 0, 2], [3, 0, 2], [2, -1, 2], [1, -1, 2]]) for (let x = x0; x <= x1; x++) set(px + x, wy - dy, K);
  set(px + 3, wy - 4, K); // 伸出去的手
  // the outstretched hand
  set(px + 4, wy - 4, '#3a2a20');
  set(px + 4, wy - 3, '#f2b24b'); // 灯
  // the lantern
  set(px + 4, wy - 2, '#5a2a1e');
  set(px + 3, wy, '#5e2626'); set(px + 4, wy, '#73302a'); set(px + 5, wy, '#5e2626');
  return g;
}

/* 把 32×32 的画按整数倍画到 size×size（cover：铺满）或居中放在 bg 底色上（scale 指定倍数时） / draw the 32×32 art into size×size at an integer factor (cover: fill) or centered on the bg color (when scale is given) */
const SCENE = grid();
const scene = (opt) =>
  pg.evaluate(
    ({ g, size, scale, bg }) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const x = cv.getContext('2d');
      if (bg) {
        x.fillStyle = bg;
        x.fillRect(0, 0, size, size);
      }
      const k = scale || size / 32;
      const o = (size - 32 * k) / 2;
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          x.fillStyle = g[j][i];
          x.fillRect(Math.floor(o + i * k), Math.floor(o + j * k), Math.ceil(k), Math.ceil(k));
        }
      return cv.toDataURL('image/png');
    },
    { g: SCENE, ...opt },
  );
const save = (f, url) => writeFileSync('resources/' + f, Buffer.from(url.split(',')[1], 'base64'));
save('icon-only.png', await scene({ size: 1024 }));
/* 安卓自适应图标：整幅画放在背景层，前景层留空（画面本身就是一整块，裁成圆也完整） / Android adaptive icon: the whole artwork on the background layer with an empty foreground (the art is one block, so a circular crop stays intact) */
save('icon-foreground.png', await draw({ rows: [''], size: 1024, scale: 1, bg: null, glow: false }));
save('icon-background.png', await scene({ size: 1024 }));
/* 网页版装到主屏用的图标（public/icons/，manifest 和 apple-touch-icon 引用）。
 * maskable：安卓会裁成圆形或圆角方形，内容缩进安全区
 * web home-screen icons (public/icons/, referenced by the manifest and apple-touch-icon). maskable: Android crops to a circle or rounded square, so pull the content into the safe area
 */
const pub = (f, url) => writeFileSync('public/icons/' + f, Buffer.from(url.split(',')[1], 'base64'));
mkdirSync('public/icons', { recursive: true });
pub('icon-192.png', await scene({ size: 192 }));
pub('icon-512.png', await scene({ size: 512 }));
pub('maskable-512.png', await scene({ size: 512 }));
pub('apple-touch-icon.png', await scene({ size: 180 }));
pub('favicon-64.png', await scene({ size: 64 }));
save('splash.png', await scene({ size: 2732, scale: 24, bg: '#0b1519' }));
save('splash-dark.png', await scene({ size: 2732, scale: 24, bg: '#0b1519' }));
await b.close();
console.log('resources/ 已生成');
