/* 运行环境：网页 / Capacitor 原生壳 / 以后的桌面壳 / runtime: web / Capacitor native / a future desktop shell */
export const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isNative = () => !!(globalThis as any).Capacitor?.isNativePlatform?.();

export const platform = (): 'web' | 'ios' | 'android' => (globalThis as any).Capacitor?.getPlatform?.() ?? 'web';

/** iOS（含 iPadOS 伪装成 Mac 的情况）：音频需要额外解锁 / iOS (including iPadOS masquerading as Mac): audio needs an extra unlock */
export const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
