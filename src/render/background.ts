/* 背景：静态像素夜景，按场景换色（标题 / 备战 / 战斗 / 首领 / 结局） / Background: a static pixel night scene, recolored per scene (title / prep / battle / boss / ending) */
import { $ } from '../ui/dom';

type RGB = [number, number, number];
interface ScenePal {
  /** 夜空顶部（天顶） / zenith sky */
  top: RGB;
  /** 夜空中段 / mid sky */
  mid: RGB;
  /** 地平线冷暖过渡 / horizon glow */
  hor: RGB;
  /** 冷月与月晕色 / cold moon and lunar halo */
  moon: RGB;
  /** 云层暗面与受光边 / cloud body and moonlit rim */
  cloud: RGB;
  /** 晨钟城窗火与钟楼暖光 / Morningbell City window and belfry light */
  win: RGB;
  /** 是否血月蚀相（首领夜） / crimson eclipse tint for boss scenes */
  eclipse?: boolean;
}

const PALS: Record<string, ScenePal> = {
  title: {
    top: [0.028, 0.04, 0.082],
    mid: [0.055, 0.095, 0.17],
    hor: [0.12, 0.165, 0.255],
    moon: [0.84, 0.91, 0.97],
    cloud: [0.09, 0.145, 0.235],
    win: [0.96, 0.76, 0.4],
  },
  shop: {
    top: [0.025, 0.055, 0.068],
    mid: [0.048, 0.105, 0.12],
    hor: [0.125, 0.18, 0.17],
    moon: [0.92, 0.88, 0.74],
    cloud: [0.08, 0.145, 0.15],
    win: [0.98, 0.8, 0.42],
  },
  battle: {
    top: [0.025, 0.032, 0.072],
    mid: [0.055, 0.07, 0.145],
    hor: [0.12, 0.11, 0.215],
    moon: [0.8, 0.86, 0.96],
    cloud: [0.085, 0.1, 0.185],
    win: [0.94, 0.72, 0.38],
  },
  dread: {
    top: [0.032, 0.022, 0.058],
    mid: [0.072, 0.042, 0.105],
    hor: [0.17, 0.075, 0.14],
    moon: [0.88, 0.76, 0.82],
    cloud: [0.11, 0.06, 0.13],
    win: [0.95, 0.62, 0.34],
  },
  boss: {
    top: [0.038, 0.015, 0.032],
    mid: [0.095, 0.028, 0.052],
    hor: [0.24, 0.062, 0.085],
    moon: [0.92, 0.34, 0.32],
    cloud: [0.145, 0.042, 0.068],
    win: [0.98, 0.56, 0.28],
    eclipse: true,
  },
  over: {
    top: [0.038, 0.042, 0.062],
    mid: [0.078, 0.082, 0.115],
    hor: [0.165, 0.135, 0.165],
    moon: [0.84, 0.85, 0.9],
    cloud: [0.115, 0.115, 0.15],
    win: [0.9, 0.68, 0.42],
  },
};
export type Scene = keyof typeof PALS;

/* 背景：一张克制而有纵深感的静态像素夜景——柔和网点夜空、冷月与薄云、双层远山、晨钟城塔楼与点点灯火、近景城墙垛口。
 * 整体降低高频噪点，让前景 UI 清晰跳出。
 * Background: a restrained, layered static pixel nightscape — smooth dithered night sky, cold moon and drifting clouds,
 * twin distant mountain ridges, Morningbell City skyline with its bell tower and warm windows, and a foreground parapet.
 * Low visual noise keeps foreground UI crisp and legible. */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const to255 = (c: RGB): [number, number, number] => [
  Math.round(Math.max(0, Math.min(1, c[0])) * 255),
  Math.round(Math.max(0, Math.min(1, c[1])) * 255),
  Math.round(Math.max(0, Math.min(1, c[2])) * 255),
];
const css = (c: RGB) => `rgb(${to255(c).join(',')})`;

let setPal: (n: Scene) => void = () => {};
const listeners: ((n: Scene) => void)[] = [];

export function initBackground() {
  const cv = $('#bg') as HTMLCanvasElement;
  const x = cv.getContext('2d');
  if (!x) {
    cv.style.background = '#0a101d';
    return;
  }
  let pal: ScenePal = PALS.title;
  /* 每格约 4 个 CSS 像素，取整到物理像素，格子大小一致 / each cell is about 4 CSS px, snapped to whole device pixels so every cell is the same size */
  const draw = () => {
    const dpr = devicePixelRatio || 1,
      k = Math.max(1, Math.round(4 * dpr)) / dpr;
    const W = Math.max(48, Math.ceil(innerWidth / k)),
      H = Math.max(60, Math.ceil(innerHeight / k));
    cv.width = W;
    cv.height = H;
    cv.style.width = W * k + 'px';
    cv.style.height = H * k + 'px';

    /* 1. 八档克制夜空：细密平滑过渡，减少大面积噪点对前景文字的干扰 / 8-step restrained night sky with gentle dithering so UI text stays legible */
    const skyColors: RGB[] = [
      mix(pal.top, [0, 0, 0], 0.25),
      pal.top,
      mix(pal.top, pal.mid, 0.42),
      mix(pal.top, pal.mid, 0.8),
      pal.mid,
      mix(pal.mid, pal.hor, 0.38),
      mix(pal.mid, pal.hor, 0.72),
      pal.hor,
    ];
    const rgb = skyColors.map(to255);
    const id = x.createImageData(W, H),
      d = id.data;

    /* 冷月坐标：右上空域，避开居中标题字形，与左下晨钟楼形成对角构图 / cold moon in upper-right clear sky, diagonally balancing the bell tower */
    const portrait = H > W * 1.2;
    const mx = Math.round(W * (portrait ? 0.84 : 0.79));
    const my = Math.round(H * (portrait ? 0.115 : 0.145));
    const mr = Math.max(5, Math.min(9, Math.round(Math.min(W, H) * 0.05)));
    const haloOuter = mr * 3.1;
    const haloCol = to255(mix(pal.mid, pal.moon, 0.22));
    const haloMid = to255(mix(pal.mid, pal.moon, 0.42));

    for (let yy = 0; yy < H; yy++) {
      const ny = Math.min(1, yy / Math.max(1, H * 0.88));
      const v = Math.pow(ny, 1.32) * (skyColors.length - 1);
      for (let xx = 0; xx < W; xx++) {
        const b = bay(xx, yy);
        let c = rgb[Math.min(skyColors.length - 1, Math.floor(v + b))];
        /* 柔和冷月光晕（仅用有序抖动，保留纯像素质感） / soft ordered-dither lunar halo */
        const dx = xx - mx,
          dy = yy - my;
        const dist = Math.hypot(dx, dy);
        if (dist < haloOuter && dist >= mr - 0.5) {
          const t = 1 - (dist - mr) / (haloOuter - mr);
          if (t > 0.55 && (t - 0.4) * 1.4 > b) c = haloMid;
          else if (t * 0.78 > b) c = haloCol;
        }
        const o = (yy * W + xx) * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0);

    let sd = 29;
    const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const px = (col: string, X: number, Y: number, w = 1, h = 1) => {
      x.fillStyle = col;
      x.fillRect(Math.round(X), Math.round(Y), w, h);
    };

    /* 2. 克制星野：集中在上半空，以低明度蓝灰为主，只点缀少数清晰亮星与微星芒 / restrained starfield in the upper sky */
    const starCount = Math.max(14, Math.floor((W * H) / 360));
    const starDim = css(mix(pal.mid, pal.moon, 0.34));
    const starMid = css(mix(pal.mid, pal.moon, 0.58));
    const starHi = css(mix(pal.moon, [1, 1, 1], 0.35));
    for (let i = 0; i < starCount; i++) {
      const sx = Math.floor(r() * W);
      const sy = Math.floor(Math.pow(r(), 1.35) * H * 0.46);
      if (Math.hypot(sx - mx, sy - my) < mr + 4) continue;
      const roll = r();
      if (roll < 0.08 && (sx < W * 0.25 || sx > W * 0.75 || sy < H * 0.14)) {
        px(starDim, sx - 1, sy);
        px(starDim, sx + 1, sy);
        px(starDim, sx, sy - 1);
        px(starDim, sx, sy + 1);
        px(starHi, sx, sy);
      } else {
        px(roll < 0.24 ? starMid : starDim, sx, sy);
      }
    }

    /* 3. 精致冷月：受光银面、微暗月海纹、柔和弦影（首领夜为暗红月蚀） / crisp cold moon with subtle maria shading */
    const moonLit = css(mix(pal.moon, [1, 1, 1], 0.25));
    const moonMid = css(pal.moon);
    const moonShade = css(mix(pal.mid, pal.moon, 0.45));
    const moonDark = css(mix(pal.top, pal.mid, 0.45));
    for (let dy = -mr; dy <= mr; dy++) {
      for (let dx = -mr; dx <= mr; dx++) {
        const rr = Math.hypot(dx, dy);
        if (rr > mr + 0.15) continue;
        if (pal.eclipse) {
          const inner = Math.hypot(dx - mr * 0.12, dy + mr * 0.06);
          if (inner < mr * 0.78) px(moonDark, mx + dx, my + dy);
          else px(rr > mr * 0.9 ? moonLit : moonMid, mx + dx, my + dy);
        } else {
          /* 微缺冷月（右上亮，左下微暗，带极淡月海） / subtly waning cold moon with faint maria */
          const cres = Math.hypot(dx + mr * 0.62, dy - mr * 0.22);
          if (cres < mr * 0.76) {
            if (bay(mx + dx, my + dy) < 0.35) px(moonDark, mx + dx, my + dy);
            continue;
          }
          const maria = Math.sin(dx * 0.9 + dy * 0.5) * Math.cos(dy * 0.7 - dx * 0.3);
          const col = dx > mr * 0.15 || dy < -mr * 0.2 ? (maria > 0.45 ? moonMid : moonLit) : maria > 0.2 ? moonShade : moonMid;
          px(col, mx + dx, my + dy);
        }
      }
    }

    /* 4. 薄夜云层：2~3 条水平层次云带，靠近月亮一侧泛起 1px 银白受光边 / layered drifting pixel cloud bands with moonlit rims */
    const cloudBody = css(pal.cloud);
    const cloudDeep = css(mix(pal.cloud, pal.top, 0.45));
    const cloudRim = css(mix(pal.cloud, pal.moon, 0.32));
    const drawCloud = (cx: number, cy: number, halfW: number, maxH: number) => {
      for (let ox = -halfW; ox <= halfW; ox++) {
        const nx = ox / halfW;
        const env = Math.max(0, 1 - nx * nx);
        const puff = 0.65 + 0.35 * Math.sin(ox * 0.38 + cy * 0.7);
        const ch = Math.max(1, Math.round(env * puff * maxH));
        const xx = Math.round(cx + ox);
        if (xx < 0 || xx >= W) continue;
        const nearMoon = Math.hypot(xx - mx, cy - my) < haloOuter * 1.45;
        px(nearMoon ? cloudRim : cloudBody, xx, cy - ch, 1, 1);
        if (ch > 1) px(cloudBody, xx, cy - ch + 1, 1, ch - 1);
        px(cloudDeep, xx, cy, 1, 1);
      }
    };
    drawCloud(Math.round(W * 0.24), Math.round(H * 0.22), Math.max(12, Math.round(W * 0.2)), 3);
    drawCloud(Math.round(W * 0.74), Math.round(H * 0.25), Math.max(14, Math.round(W * 0.23)), 4);
    drawCloud(Math.round(W * 0.48), Math.round(H * 0.36), Math.max(16, Math.round(W * 0.26)), 3);

    /* 5. 双层远山剪影：远山偏淡蓝雾，近山偏深，拉开纵深 / two distant mountain ridges in atmospheric perspective */
    const horY = Math.round(H * 0.68);
    const farMtn = css(mix(pal.hor, pal.top, 0.48));
    const farMtnHi = css(mix(pal.hor, pal.moon, 0.16));
    const nearMtn = css(mix(pal.hor, pal.top, 0.72));
    const drawRidge = (baseY: number, amp: number, freq: number, phase: number, col: string, rimCol?: string) => {
      for (let xx = 0; xx < W; xx++) {
        const wave =
          Math.sin(xx * freq + phase) * 0.55 +
          Math.sin(xx * freq * 2.3 + phase * 1.7) * 0.28 +
          Math.cos(xx * freq * 0.45 - phase) * 0.17;
        const yTop = Math.round(baseY - Math.max(0, (wave + 0.65) * 0.6) * amp);
        px(col, xx, yTop, 1, H - yTop);
        if (rimCol && Math.abs(xx - mx) < W * 0.32 && (xx & 1) === 0) px(rimCol, xx, yTop);
      }
    };
    drawRidge(horY - Math.round(H * 0.04), Math.max(8, Math.round(H * 0.1)), 0.055, 1.2, farMtn, farMtnHi);
    drawRidge(horY + Math.round(H * 0.01), Math.max(6, Math.round(H * 0.075)), 0.085, 3.6, nearMtn);

    /* 6. 晨钟城天际线：中景错落屋顶 + 左侧晨钟主塔楼 + 右侧远眺哨塔 + 温润灯火 / Morningbell City skyline, main bell tower, watchtower, and warm lights */
    const cityBase = Math.round(H * 0.87);
    const cityFar = css(mix(pal.top, [0, 0, 0], 0.38));
    const citySil = css(mix(pal.top, [0, 0, 0], 0.62));
    const cityRim = css(mix(pal.hor, pal.moon, 0.22));
    const winWarm = css(pal.win);
    const winSoft = css(mix(pal.win, pal.hor, 0.48));

    /* 主钟楼坐标（偏左 0.17W，与右上冷月对角呼应；窄屏也在侧边清晰露出） / main bell tower at 0.17W balancing the upper-right moon */
    const towerX = Math.round(W * 0.17);
    const towerW = Math.max(7, Math.min(11, Math.round(W * 0.075))) | 1; // 奇数宽方便尖顶居中 / odd width for centered spire
    const towerHalf = (towerW - 1) >> 1;
    const towerTop = Math.round(cityBase - Math.max(22, H * 0.23));
    /* 右侧次哨塔 / secondary eastern watchtower */
    const spireX = Math.round(W * 0.85);
    const spireTop = Math.round(cityBase - Math.max(15, H * 0.15));

    /* 远排建筑剪影（稍淡，增加城廓层次） / back row of distant roofs */
    for (let hx = 0; hx < W; ) {
      const w = 5 + Math.floor(r() * 8);
      const h = 7 + Math.floor(r() * 11);
      px(cityFar, hx, cityBase - h - 2, w, H - (cityBase - h - 2));
      if (r() < 0.5) {
        const roofH = Math.min(5, Math.ceil(w / 2));
        for (let rk = 0; rk < roofH; rk++) px(cityFar, hx + rk, cityBase - h - 2 - rk, w - 2 * rk, 1);
      }
      hx += w + (r() < 0.3 ? 1 : 0);
    }

    /* 前排晨钟城屋群与稀疏暖窗 / foreground Morningbell rooftops and sparse warm windows */
    for (let hx = 0; hx < W; ) {
      const w = 5 + Math.floor(r() * 8);
      const h = 4 + Math.floor(r() * 10);
      if (Math.abs(hx + w / 2 - towerX) < towerHalf + 4) {
        hx += w;
        continue;
      }
      const top = cityBase - h;
      px(citySil, hx, top, w, H - top);
      if (r() < 0.52) {
        const roofH = Math.min(5, Math.ceil(w / 2));
        for (let rk = 0; rk < roofH; rk++) px(citySil, hx + rk, top - rk, w - 2 * rk, 1);
      } else if (r() < 0.35) {
        px(citySil, hx + 1, top - 3, 1, 3); // 烟囱 / chimney
      }
      /* 稀疏灯火：控制数量，保留静谧氛围 / sparse cozy lit windows */
      if (r() < 0.42 && w >= 5) {
        const wx = hx + 1 + Math.floor(r() * (w - 3));
        const wy = top + 2 + Math.floor(r() * Math.max(1, h - 4));
        px(winWarm, wx, wy, 1, 2);
        if (r() < 0.45 && wx + 2 < hx + w - 1) px(winSoft, wx + 2, wy, 1, 1);
      }
      hx += w;
    }

    /* 右侧次哨塔 / eastern watchtower */
    px(citySil, spireX - 2, spireTop + 5, 5, H - spireTop);
    for (let sk = 0; sk < 4; sk++) px(citySil, spireX - 3 + sk, spireTop + 5 - sk, 7 - 2 * sk, 1);
    px(citySil, spireX, spireTop - 1, 1, 3);
    px(winWarm, spireX, spireTop + 8, 1, 2);
    px(winSoft, spireX, spireTop + 13, 1, 1);

    /* 晨钟主塔楼：阶梯扶壁、尖顶钟楼、亮灯拱窗与古钟剪影 / Morningbell Bell Tower with buttresses, spire, lit belfry arch, and bell silhouette */
    px(citySil, towerX - towerHalf, towerTop + 6, towerW, H - towerTop);
    px(citySil, towerX - towerHalf - 1, towerTop + 14, towerW + 2, H - towerTop);
    /* 塔楼微弱月光侧边 / faint moonlight edge on tower's moon-facing side */
    px(cityRim, towerX + towerHalf, towerTop + 6, 1, Math.max(6, cityBase - towerTop - 10));
    /* 哥特尖顶 / gothic spire */
    for (let tk = 0; tk <= towerHalf + 2; tk++) {
      const sw = Math.max(1, towerW + 2 - tk * 2);
      px(citySil, towerX - ((sw - 1) >> 1), towerTop + 6 - tk, sw, 1);
    }
    px(citySil, towerX, towerTop - 3, 1, 5);
    /* 拱形钟室暖光 + 钟影 / warm lit belfry arch + bell silhouette */
    const bx0 = towerX - 2,
      by0 = towerTop + 9;
    px(winSoft, bx0 - 1, by0, 7, 5);
    px(winWarm, bx0, by0 - 1, 5, 6);
    px(citySil, towerX - 1, by0 + 1, 3, 3); // 钟身 / bell body
    px(winWarm, towerX, by0 + 4, 1, 1); // 钟底漏光 / glow under bell
    /* 塔身竖窗 / vertical tower slits */
    for (let wy = by0 + 8; wy < cityBase - 2; wy += 4) {
      px(wy % 8 === 0 ? winWarm : winSoft, towerX, wy, 1, 2);
    }

    /* 7. 近景城墙垛口剪影 + 稀疏远火盆 / foreground battlements silhouette + distant warm brazier points */
    const wallY = Math.round(H * 0.91);
    const wallDark = css(mix(pal.top, [0, 0, 0], 0.8));
    const wallEdge = css(mix(pal.top, pal.hor, 0.25));
    px(wallDark, 0, wallY + 2, W, H - wallY);
    px(wallEdge, 0, wallY + 2, W, 1);
    for (let bx = 0; bx < W; bx += 5) {
      px(wallDark, bx, wallY, 3, 2);
      px(wallEdge, bx, wallY, 3, 1);
    }
    for (const frac of [0.12, 0.5, 0.88]) {
      const fx = Math.round(W * frac);
      px(winSoft, fx - 1, wallY - 1, 3, 1);
      px(winWarm, fx, wallY - 2, 1, 2);
    }
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
