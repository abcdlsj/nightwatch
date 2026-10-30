export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** 大数字缩写：12345 → 12k / abbreviate big numbers: 12345 → 12k */
/** 数字简写：一万以上写 k，再往上 M、B、T，大到离谱就写科学计数（数值膨胀的世界用得上） / short numbers: k from ten thousand, then M, B, T, and scientific notation once absurd (for worlds with number inflation) */
export const fmt = (v: number) => {
  if (!isFinite(v)) return v > 0 ? 'naneinf' : '0';
  v = Math.round(v);
  const a = Math.abs(v);
  if (a < 10000) return String(v);
  if (a >= 1e15) return v.toExponential(2).replace('e+', 'e');
  const [d, u] = a >= 1e12 ? [1e12, 'T'] : a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : [1e3, 'k'];
  const n = v / (d as number);
  return (Math.abs(n) >= 100 || u === 'k' ? Math.round(n) : n.toFixed(1)) + u;
};

export const pct = (v: number) => '+' + Math.round(v * 100) + '%';
