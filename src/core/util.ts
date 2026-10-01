export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** 大数字缩写：12345 → 12k */
export const fmt = (v: number) => {
  v = Math.round(v);
  return v >= 10000 ? Math.round(v / 1000) + 'k' : String(v);
};

export const pct = (v: number) => '+' + Math.round(v * 100) + '%';
