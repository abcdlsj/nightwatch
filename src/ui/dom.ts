/* DOM 小工具 / small DOM helpers */
import { L, lang } from '../i18n';

export const $ = (s: string) => document.querySelector(s) as HTMLElement;
export const $$ = (s: string, root: ParentNode = document) => [...root.querySelectorAll(s)] as HTMLElement[];

/** 重新播放一个 CSS 动画类 / replay a CSS animation class */
export function restart(el: Element | null | undefined, cls: string) {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

/** 静态 HTML 里标了 data-i18n / data-i18n-aria 的地方换成当前语言 / replace spots tagged data-i18n / data-i18n-aria in static HTML with the current language */
export function applyStaticText() {
  document.documentElement.lang = lang;
  const get = (k: string) => k.split('.').reduce((o: any, x) => (o == null ? o : o[x]), L.ui);
  for (const el of $$('[data-i18n]')) {
    const v = get(el.dataset.i18n!);
    if (typeof v === 'string') el.textContent = v;
  }
  for (const el of $$('[data-i18n-aria]')) {
    const v = get(el.dataset.i18nAria!);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  }
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
