/* 像素图：字母矩阵 → canvas。按需生成并缓存（启动时不再一次画完全部两百张） */
import { PAL, SHADE } from '../data/art/palette';
import { SPRITES as GEN, SHAPES } from '../data/art/generated';
import { HAND_SPRITES } from '../data/art/hand';

const ROWS: Record<string, string[]> = { ...HAND_SPRITES, ...GEN };

function mk(rows: string[], fill?: string) {
  const h = rows.length,
    w = Math.max(...rows.map((r) => r.length));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const x = cv.getContext('2d')!;
  for (let j = 0; j < h; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const c = r[i];
      if (c === '.') continue;
      x.fillStyle = fill || PAL[c] || '#f0f';
      x.fillRect(i, j, 1, 1);
    }
  }
  return cv;
}
/** 放大 s 倍导出成 data URL（给 <img> 用，像素不糊） */
function upURL(cv: HTMLCanvasElement, s: number) {
  const c2 = document.createElement('canvas');
  c2.width = cv.width * s;
  c2.height = cv.height * s;
  const x = c2.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.drawImage(cv, 0, 0, c2.width, c2.height);
  return c2.toDataURL();
}

export class Sprite {
  private _cv?: HTMLCanvasElement;
  private _white?: HTMLCanvasElement;
  private _ice?: HTMLCanvasElement;
  private _url?: string;
  constructor(private rows: string[]) {}
  get cv() {
    return (this._cv ||= mk(this.rows));
  }
  /** 受击闪白 */
  get white() {
    return (this._white ||= mk(this.rows, '#ffffff'));
  }
  /** 减速 / 冻结的冰蓝覆盖 */
  get ice() {
    return (this._ice ||= mk(this.rows, '#8fe3ff'));
  }
  get url() {
    return (this._url ||= upURL(this.cv, 4));
  }
  get w() {
    return Math.max(...this.rows.map((r) => r.length));
  }
  get h() {
    return this.rows.length;
  }
}

const cache: Record<string, Sprite> = {};

/** 取一张图；spec 也可以是遗物图标模板「形状:颜色」，如 'potion:R' */
export function spr(spec: string): Sprite {
  if (cache[spec]) return cache[spec];
  if (ROWS[spec]) return (cache[spec] = new Sprite(ROWS[spec]));
  const [sh, col] = spec.split(':');
  const rows = (SHAPES[sh] || SHAPES.orb).map((r) => r.replace(/X/g, col).replace(/Z/g, SHADE[col] || 'k'));
  return (cache[spec] = new Sprite(rows));
}
export const hasSpr = (k: string) => !!ROWS[k];
export const icon = spr;
