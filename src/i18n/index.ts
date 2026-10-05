/* 多语言。
 * - 界面文字：t('键', {参数})，键对应 locales/<语言>/ui.ts 里的嵌套对象，参数写成 {名字}。
 * - 内容文字（卡牌、遗物、敌人……）：切换语言时由 apply.ts 填进各数据表的 n/d/f 等字段，代码里照常读 ITEMS[k].n。
 * - 剧情、台词、术语：直接读 L.story / L.terms / L.meta。
 * Internationalization. - UI strings: t(key, { params }), where the key maps to the nested object in locales/<lang>/ui.ts and params are written as {name}. - Content text (cards, relics, enemies…): on language switch apply.ts fills n/d/f fields in the data tables, and code reads ITEMS[k].n as usual. - Story, barks and terms: read L.story / L.terms / L.meta directly.
 */
import zhCN from '../locales/zh-CN';
import { applyLocale } from './apply';

export type LocalePack = typeof zhCN;

const PACKS: Record<string, () => Promise<LocalePack> | LocalePack> = {
  'zh-CN': () => zhCN,
};

export let L: LocalePack = zhCN;
export let lang = 'zh-CN';

export const languages = () => Object.keys(PACKS);

export async function setLocale(code: string) {
  const load = PACKS[code] || PACKS['zh-CN'];
  L = await load();
  lang = PACKS[code] ? code : 'zh-CN';
  applyLocale(L);
}

/** 同步初始化（默认语言已经打进包里） / synchronous init (the default language is already in the bundle) */
export function initLocale() {
  applyLocale(L);
}

const get = (o: any, path: string) => {
  for (const k of path.split('.')) {
    if (o == null) return undefined;
    o = o[k];
  }
  return o;
};

export function t(key: string, p?: Record<string, string | number>): string {
  let s = get(L.ui, key);
  if (typeof s !== 'string') {
    if (import.meta.env?.DEV) console.warn('i18n 缺键', key);
    return key;
  }
  if (p) s = s.replace(/\{(\w+)\}/g, (m: string, k: string) => (p[k] != null ? String(p[k]) : m));
  return s;
}

/** 取一个数组/对象形式的界面文案（如按钮组、提示列表） / fetch an array/object UI string (like a button group or hint list) */
export const tv = <T = any>(key: string): T => get(L.ui, key);
