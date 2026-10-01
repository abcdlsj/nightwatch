/* 和规则相关的文字拼装（不碰 DOM，界面层直接用） */
import { ITEMS } from '../data/cards';
import { MODL } from '../data/mods';
import { L } from '../i18n';
import type { Mods, Line } from '../data/types';
import { vpick } from '../core/rng';
import { G } from './state';

/** 卡面显示名：钻品质用专属名 */
export const cardName = (c: { key: string; tier: number }) => {
  const it = ITEMS[c.key];
  return c.tier >= 3 && it.dn ? it.dn : it.n;
};

/** 修正项列表 → 带颜色的说明（好的绿、坏的红） */
export function modText(m: Mods) {
  const ML = L.terms.mods as Record<string, string>;
  return Object.keys(m)
    .map((k) => {
      const [p, inv] = MODL[k];
      const l = ML[k];
      if (p === 2) return `<i class="mg">${l}</i>`;
      const v = m[k];
      const good = inv ? v < 0 : v > 0;
      const sv = k === 'range' ? -v : v;
      return `<i class="${good ? 'mg' : 'mb'}">${l} ${sv > 0 ? '+' : ''}${p ? Math.round(sv * 100) + '%' : sv}</i>`;
    })
    .join('');
}
/** 修正项 → 纯文字（提示气泡用） */
export function plainMods(m: Mods) {
  const ML = L.terms.mods as Record<string, string>;
  return Object.keys(m)
    .map((k) => {
      const [p] = MODL[k];
      return ML[k] + ' +' + (p ? Math.round(m[k] * 100) + '%' : m[k]);
    })
    .join(L.ui.common.comma);
}

/** 按人物取台词：字符串、随机一句、或 {ayla:'',mo:''} */
export function pickLine(t: Line): string {
  if (t == null) return '';
  if (Array.isArray(t)) return vpick(t);
  if (typeof t === 'object') return pickLine(t[G.hero]);
  return t;
}
