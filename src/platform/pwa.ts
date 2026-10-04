/* 网页版装到主屏（PWA）：注册离线缓存；判断是不是从主屏打开的；iOS Safari 里提示怎么安装 */
import { isNative, isIOS } from './env';

/** 从主屏图标打开（全屏，没有浏览器地址栏和工具栏） */
export const standalone = () =>
  (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) || !!(navigator as any).standalone;

/** 只在正式构建的网页版里注册（开发服务器和原生壳都不需要） */
export function registerSW(version: string) {
  if (isNative() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(version)).catch(() => {}));
}

/** iOS Safari 浏览器里（还没装到主屏）：提示「分享 → 添加到主屏幕」 */
export const canInstallIOS = () => isIOS() && !isNative() && !standalone();
