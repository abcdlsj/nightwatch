/* 网页版装到主屏（PWA）：注册离线缓存；判断是不是从主屏打开的；iOS Safari 里提示怎么安装 / Installing the web build to the home screen (PWA): register the offline cache, detect home-screen launches, and show install hints on iOS Safari */
import { isNative, isIOS } from './env';

/** 从主屏图标打开（全屏，没有浏览器地址栏和工具栏） / launched from the home-screen icon (fullscreen, no address bar or toolbar) */
export const standalone = () =>
  (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) || !!(navigator as any).standalone;

/** iOS 26 主屏模式下 100% 高度少了顶部安全区那一截，底部留空、状态栏被毛玻璃盖住：直接按屏幕高度撑满。
 * 切后台再回来时 iOS 会先报一次「对的」innerHeight 再缩回去，且不再发 resize，所以不能按 innerHeight 判断清掉，回前台后还要延时再撑一遍
 * in iOS 26 home-screen mode, 100% height is short by the top safe area, leaving a bottom gap and a frosted status bar: size to the screen height directly.
 * On returning from the background iOS briefly reports the "right" innerHeight, then shrinks back without another resize, so never clear based on innerHeight, and refit with delays after coming back */
export function fitStandalone() {
  if (!isIOS() || isNative() || !standalone()) return;
  /* 输入框聚焦时键盘弹起，iOS 会缩视口并把页面滚到输入框：这时不能撑高、不能滚回顶部，不然光标被挪到顶上 / while an input is focused the keyboard is up and iOS shrinks the viewport and scrolls to the field: don't resize or scroll back to the top then, or the caret jumps to the top */
  const typing = () => {
    const a = document.activeElement as HTMLElement | null;
    return !!a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT' || a.isContentEditable);
  };
  const fit = () => {
    if (typing()) return;
    const portrait = innerHeight >= innerWidth;
    const h = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    document.documentElement.style.height = Math.max(h, innerHeight) + 'px';
    if (scrollY || scrollX) scrollTo(0, 0);
  };
  const refit = () => {
    fit();
    requestAnimationFrame(fit);
    for (const ms of [120, 400, 1000]) setTimeout(fit, ms);
  };
  fit();
  addEventListener('resize', fit);
  addEventListener('orientationchange', refit);
  addEventListener('pageshow', refit);
  addEventListener('focus', refit);
  /* 键盘收起后再撑回去 / refit once the keyboard is dismissed */
  document.addEventListener('focusout', () => setTimeout(refit, 50));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refit();
  });
}

/** 只在正式构建的网页版里注册（开发服务器和原生壳都不需要） / register only in production web builds (neither the dev server nor native needs it) */
export function registerSW(version: string) {
  if (isNative() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(version)).catch(() => {}));
}

/** iOS Safari 浏览器里（还没装到主屏）：提示「分享 → 添加到主屏幕」 / in the iOS Safari browser (not yet installed): hint 'Share → Add to Home Screen' */
export const canInstallIOS = () => isIOS() && !isNative() && !standalone();
