/* 和规则相关的文字拼装（不碰 DOM，界面层直接用） / Rule-related text assembly (no DOM; the UI layer uses it directly) */
import { ITEMS } from '../data/cards';
import { MODL } from '../data/mods';
import { L } from '../i18n';
import type { Mods, Line } from '../data/types';
import { vpick } from '../core/rng';
import { G } from './state';

/** 卡面显示名：钻品质用专属名 / card display name: diamond tier uses its own name */
export const cardName = (c: { key: string; tier: number }) => {
  const it = ITEMS[c.key];
  return c.tier >= 3 && it.dn ? it.dn : it.n;
};

/** 修正项列表 → 带颜色的说明（好的绿、坏的红） / modifier list → colored descriptions (green for good, red for bad) */
export function modText(m: Mods) {
  const ML = L.terms.mods as Record<string, string>;
  /* 天性、觉醒这类专属修正项没有通用说明（在选人页和天赋页另有文字），合计里跳过 / hero-specific keys such as natures and awakenings have no generic label (they are described on the hero and talent pages), so skip them in totals */
  return Object.keys(m)
    .filter((k) => MODL[k])
    .map((k) => {
      const [p, inv] = MODL[k];
      const l = ML[k];
      if (p === 2) return `<i class="mg">${l}</i>`;
      const v = m[k];
      if (p === 3) return `<i class="mg mx">${l} ×${+(1 + v).toFixed(2)}</i>`;
      const good = inv ? v < 0 : v > 0;
      const sv = k === 'range' ? -v : v;
      return `<i class="${good ? 'mg' : 'mb'}">${l} ${sv > 0 ? '+' : ''}${p ? Math.round(sv * 100) + '%' : sv}</i>`;
    })
    .join('');
}
/** 修正项 → 纯文字（提示气泡用） / modifiers → plain text (for tooltips) */
export function plainMods(m: Mods) {
  const ML = L.terms.mods as Record<string, string>;
  return Object.keys(m)
    .map((k) => {
      const [p] = MODL[k];
      if (p === 3) return ML[k] + ' ×' + +(1 + m[k]).toFixed(2);
      return ML[k] + ' +' + (p ? Math.round(m[k] * 100) + '%' : m[k]);
    })
    .join(L.ui.common.comma);
}

/** 按人物取台词：字符串、随机一句、或 {ayla:'',mo:''} / look up a line by hero: a string, a random pick, or {ayla:'',mo:''} */
export function pickLine(t: Line): string {
  if (t == null) return '';
  if (Array.isArray(t)) return vpick(t);
  if (typeof t === 'object') return pickLine(t[G.hero]);
  return t;
}

/** 商店窄栏用的简短说明：只取第一句核心效果，避免四行长文被截断 / concise first-clause summary for narrow shop slots so cards stay scannable */
export function shortDesc(d: string): string {
  if (!d) return '';
  const cut = d.search(/[。；;]|(?<=\D)\.(?:\s|$)/);
  const first = cut > 0 ? d.slice(0, cut + (d[cut] === '。' || d[cut] === '.' ? 1 : 0)) : d;
  return first.trim();
}

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 正文语义高亮：独立乘区、数值、关键词、元素状态着不同色，便于小屏扫读 / inline semantic highlighting for multipliers, numbers, keywords and statuses */
export function richText(raw: string): string {
  if (!raw) return '';
  const s = escHtml(raw);
  return s.replace(
    /(×\d+(?:\.\d+)?|【[^】]+】|[+-]?\d+(?:\.\d+)?(?:%|秒|s\b|层|格|发|只|个|次|金)?|灼烧|点燃|燃烧|冻结|减速|中毒|易伤|暴击|充能|加速|\b(?:Burn|Freeze|Frozen|Slow|Slowed|Poison|Poisoned|Crit|Charge|Haste)\b)/g,
    (m) => {
      if (m.startsWith('×')) return `<span class="rt-x">${m}</span>`;
      if (m.startsWith('【')) return `<span class="rt-kw">${m}</span>`;
      if (/^(?:灼烧|点燃|燃烧|Burn)$/.test(m)) return `<span class="rt-el-fire">${m}</span>`;
      if (/^(?:冻结|减速|Freeze|Frozen|Slow|Slowed)$/.test(m)) return `<span class="rt-el-ice">${m}</span>`;
      if (/^(?:中毒|Poison|Poisoned)$/.test(m)) return `<span class="rt-el-poison">${m}</span>`;
      if (/^(?:暴击|充能|加速|易伤|Crit|Charge|Haste)$/.test(m)) return `<span class="rt-el-volt">${m}</span>`;
      return `<span class="rt-n">${m}</span>`;
    },
  );
}
