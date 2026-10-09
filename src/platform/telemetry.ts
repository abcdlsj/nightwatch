/* 匿名统计：攒一小批再发，切后台或关页面时用 sendBeacon 发掉。设置里能关；没配接口地址就什么都不做
 * Anonymous stats: buffer a small batch and send it, flushing with sendBeacon when backgrounded or closed. Can be turned off in settings; does nothing without an API base
 */
import { apiOn, apiUrl, uid, sid } from './api';
import { SETTINGS } from './settings';
import { platform, isNative } from './env';

interface Ev {
  n: string;
  t: number;
  p?: Record<string, unknown>;
}
const q: Ev[] = [];
const ctx = { lang: '', plat: '' };
let timer: ReturnType<typeof setTimeout> | null = null;

const on = () => apiOn() && SETTINGS.stats;

/** 语言和平台（网页 / 主屏 / iOS / Android），开机时填一次 / language and platform (web / home screen / iOS / Android), filled once at boot */
export function initTelemetry(lang: string, standalone: boolean) {
  ctx.lang = lang;
  ctx.plat = isNative() ? platform() : standalone ? 'pwa' : 'web';
  if (typeof addEventListener === 'undefined') return;
  addEventListener('pagehide', () => flush(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush(true);
  });
}

/** 记一个事件。n 只用小写字母、数字、下划线 / record an event. n uses only lowercase letters, digits and underscores */
export function track(n: string, p?: Record<string, unknown>) {
  if (!on()) return;
  q.push({ n, t: Date.now(), p });
  if (q.length >= 20) flush();
  else if (!timer) timer = setTimeout(() => flush(), 5000);
}

export function flush(beacon = false) {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!q.length || !on()) return;
  const body = JSON.stringify({ uid: uid(), sid, v: __APP_VERSION__, plat: ctx.plat, lang: ctx.lang, ev: q.splice(0, 50) });
  const url = apiUrl('/e');
  try {
    if (beacon && navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
    fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
  } catch {
    /* 统计失败不影响游戏 / a failed send never affects the game */
  }
  if (q.length) timer = setTimeout(() => flush(), 1000);
}
