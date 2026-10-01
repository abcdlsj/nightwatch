/* 震动反馈。网页用 navigator.vibrate（iOS Safari 不支持，静默跳过）；
 * 原生壳里如果装了 @capacitor/haptics 插件，用它。 */
export function vibrate(pattern: number | number[]) {
  const cap = (globalThis as any).Capacitor;
  const H = cap?.Plugins?.Haptics;
  if (H) {
    const ms = Array.isArray(pattern) ? pattern.reduce((s, v, i) => (i % 2 ? s : s + v), 0) : pattern;
    H.impact?.({ style: ms > 40 ? 'HEAVY' : 'LIGHT' }).catch?.(() => {});
    return;
  }
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* 有的浏览器在没有用户手势时会抛错 */
    }
  }
}
