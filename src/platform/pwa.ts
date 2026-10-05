/* 网页版装到主屏（PWA）：注册离线缓存；判断是不是从主屏打开的；iOS Safari 里提示怎么安装 / Installing the web build to the home screen (PWA): register the offline cache, detect home-screen launches, and show install hints on iOS Safari */
import { isNative, isIOS } from './env';

/** 从主屏图标打开（全屏，没有浏览器地址栏和工具栏） / launched from the home-screen icon (fullscreen, no address bar or toolbar) */
export const standalone = () =>
  (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) || !!(navigator as any).standalone;

/** iOS 26 主屏模式下 100% 高度少了顶部安全区那一截，底部留空、状态栏被毛玻璃盖住：直接按屏幕高度撑满 / in iOS 26 home-screen mode, 100% height is short by the top safe area, leaving a bottom gap and a frosted status bar: size to the screen height directly */
export function fitStandalone() {
  if (!isIOS() || isNative() || !standalone()) return;
  const fit = () => {
    const portrait = innerHeight >= innerWidth;
    const h = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    document.documentElement.style.height = h > innerHeight ? h + 'px' : '';
  };
  fit();
  addEventListener('resize', fit);
}

/** 只在正式构建的网页版里注册（开发服务器和原生壳都不需要） / register only in production web builds (neither the dev server nor native needs it) */
export function registerSW(version: string) {
  if (isNative() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(version)).catch(() => {}));
}

/** iOS Safari 浏览器里（还没装到主屏）：提示「分享 → 添加到主屏幕」 / in the iOS Safari browser (not yet installed): hint 'Share → Add to Home Screen' */
export const canInstallIOS = () => isIOS() && !isNative() && !standalone();
