/* 震动反馈。网页用 navigator.vibrate（iOS Safari 不支持，静默跳过）；原生壳里由 native.ts 换成系统震感 / Haptics. Web uses navigator.vibrate (unsupported on iOS Safari, silently skipped); on native, native.ts swaps in the system engine */
let impl: ((ms: number) => void) | null = null;
export const setVibrate = (f: (ms: number) => void) => {
  impl = f;
};

export function vibrate(pattern: number | number[]) {
  if (impl) {
    impl(Array.isArray(pattern) ? pattern.reduce((s, v, i) => (i % 2 ? s : s + v), 0) : pattern);
    return;
  }
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* 有的浏览器在没有用户手势时会抛错 / some browsers throw without a user gesture */
    }
  }
}
