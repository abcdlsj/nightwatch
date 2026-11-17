/* 字号：全游戏只用缝合像素（12px 像素字）一种字形，标题和正文都用它，拉丁字母的大字配 Pixelify Sans。
 * 像素字只有在每个字格正好占整数个物理像素时才不糊，所以字号不写死，按设备像素比取整：
 * 一档字号 = 12 × n / DPR，n 取最接近「目标字号 × DPR / 12」的整数（至少 1）。
 * DPR 3 的手机上是 12、16、20、24…，DPR 2 上是 12、18、24…，桌面 DPR 1 上是 12、24、36…
 * 每档写到 :root 的 --t-* 变量上，样式里只用这些变量；设置里的「大字」把正文那几档的目标调大。
 * Type sizes: the whole game uses one glyph style, Fusion Pixel (a 12px pixel font), for titles and body alike, with Pixelify Sans for Latin display text.
 * A pixel font is only crisp when each font pixel covers a whole number of device pixels, so sizes are not hard-coded but snapped to the device pixel ratio:
 * a step = 12 × n / DPR, with n the integer nearest to target × DPR / 12 (at least 1).
 * On a DPR 3 phone that gives 12, 16, 20, 24…; on DPR 2, 12, 18, 24…; on a DPR 1 desktop, 12, 24, 36…
 * Each step is written to a --t-* variable on :root and styles only use those; the Large text setting raises the body steps' targets. */
import { SETTINGS, onSettings } from '../platform/settings';

/** 每档的目标字号（CSS 像素）；第二个数是开了「大字」时的目标 / each step's target size in CSS px; the second number is the target with Large text on */
const STEPS: Record<string, [number, number]> = {
  s: [12, 15], // 小字：角标、标签 / small: badges, labels
  b: [15, 21], // 正文 / body
  m: [18, 22], // 按钮、卡名旁的说明 / buttons, captions
  l: [22, 25], // 小标题 / subheadings
  xl: [28, 30], // 页面标题 / page titles
  h1: [38, 38], // 横幅大字 / banner type
  h2: [46, 46], // 连招发现 / combo discovery
  h3: [60, 60], // 英文标志 / English logo
  h4: [84, 84], // 标题页标志 / title logo
};

export function snapFont(target: number, dpr = window.devicePixelRatio || 1) {
  const n = Math.max(1, Math.round((target * dpr) / 12));
  return (12 * n) / dpr;
}

function apply() {
  const dpr = window.devicePixelRatio || 1;
  const st = document.documentElement.style;
  for (const [k, [a, b]] of Object.entries(STEPS)) st.setProperty('--t-' + k, snapFont(SETTINGS.big ? b : a, dpr) + 'px');
}

export function initType() {
  apply();
  onSettings(apply);
  /* 窗口拖到另一块屏幕上，DPR 会变 / dragging the window to another screen changes the DPR */
  const watch = () => matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener('change', () => (apply(), watch()), { once: true });
  watch();
}
