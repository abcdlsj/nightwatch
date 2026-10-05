/* 把模组包检查一遍，再合并进游戏的各张表（卡牌、遗物、天赋、敌人、人物、说话人、像素图、剧情、触发钩子）。
 * 有问题的条目跳过，不影响别的；问题记在报告里，工坊页能看到，控制台也会打出来。 */
import { ITEMS, UPS, TAGS } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS, TCAT } from '../data/talents';
import { EN, FACTIONS } from '../data/enemies';
import { HEROES, KITS, PATHS, HERO_ORDER } from '../data/heroes';
import { VOICES } from '../data/voices';
import { MODL } from '../data/mods';
import { PAL } from '../data/art/palette';
import { L } from '../i18n';
import { CARD_HOOKS, RELIC_HOOKS, TALENT_HOOKS } from '../sim/hooks';
import { INTENTS } from '../sim/enemies';
import { addSprites, hasSpr } from '../render/sprites';
import type { ModPack, ModReport } from './types';

const FX = ['knife', 'spark', 'ice', 'bolt', 'rock', 'none', 'arrow', 'axe', 'shell', 'quake', 'flame', 'bell', 'blizzard', 'sting', 'gas', 'meteor', 'slash', 'fslash', 'firefly', 'sweep', 'avalanche', 'discharge'];
const KINDS = ['weapon', 'firearm', 'potion', 'gadget', 'lamp', 'sky'];
const SHAPE = /^[a-z]+:[A-Za-z]$/;
/** 跃迁事件可以借用的玩法（见 src/app/prep/jumps.ts） */
const JUMP_STYLES = ['ayla', 'mo', 'ying', 'jun', 'li'];

/** 深合并（剧情这种嵌套对象用） */
function deepMerge(into: any, from: any) {
  for (const k in from) {
    if (from[k] && typeof from[k] === 'object' && !Array.isArray(from[k]) && into[k] && typeof into[k] === 'object' && !Array.isArray(into[k])) deepMerge(into[k], from[k]);
    else into[k] = from[k];
  }
}

export function applyMod(pack: ModPack): ModReport {
  const R: ModReport = { id: pack.id, name: pack.name || pack.id, author: pack.author, desc: pack.desc, added: {}, errors: [] };
  const err = (s: string) => R.errors.push(s);
  const count = (k: string) => (R.added[k] = (R.added[k] || 0) + 1);
  if (!pack.id || !/^[a-z0-9-]+$/.test(pack.id)) err('模组的 id 只能用小写英文、数字和短横线');
  /** 重名检查：原版或别的模组已经有了，又没写 override */
  const clash = (reg: Record<string, unknown>, k: string, what: string) => {
    if (reg[k] && !pack.override) {
      err(`${what}「${k}」和已有的重名了（要覆盖原版，在模组里写 override: true）`);
      return true;
    }
    return false;
  };
  const sprOk = (k: string) => hasSpr(k) || !!pack.sprites?.[k] || SHAPE.test(k);

  /* ---- 像素图：先加，后面的检查要用 ---- */
  const goodSpr: Record<string, string[]> = {};
  for (const [k, rows] of Object.entries(pack.sprites || {})) {
    if (!Array.isArray(rows) || !rows.length) {
      err(`像素图「${k}」是空的`);
      continue;
    }
    const w = rows[0].length;
    const badRow = rows.findIndex((r) => r.length !== w);
    const badCh = [...rows.join('')].find((ch) => ch !== '.' && !PAL[ch]);
    if (badRow >= 0) err(`像素图「${k}」第 ${badRow + 1} 行长度和第一行不一样`);
    else if (badCh) err(`像素图「${k}」用了调色板里没有的字母「${badCh}」`);
    else {
      goodSpr[k] = rows;
      count('sprites');
    }
  }
  addSprites(goodSpr);

  /* ---- 卡牌 ---- */
  for (const [k, c] of Object.entries(pack.cards || {})) {
    if (clash(ITEMS, k, '卡牌')) continue;
    const bad: string[] = [];
    if (![1, 2, 3].includes(c.size)) bad.push('size 只能是 1、2、3');
    if (!TAGS.includes(c.tag)) bad.push(`tag 只能是 ${TAGS.join(' / ')}`);
    if (c.kind && !KINDS.includes(c.kind)) bad.push(`kind 只能是 ${KINDS.join(' / ')}`);
    if (!FX.includes(c.fx)) bad.push(`fx 只能是 ${FX.join(' / ')}`);
    if (!UPS[c.up]) bad.push('up 只能是 dmg / cd / mix');
    if (![0, 1, 2].includes(c.t)) bad.push('t（初始品质）只能是 0、1、2');
    if (!(c.cd >= 0) || !(c.dmg >= 0)) bad.push('cd 和 dmg 要是不小于 0 的数');
    if (!c.n || !c.d) bad.push('缺名字 n 或说明 d');
    if (!sprOk(k)) bad.push(`没有同名的像素图「${k}」`);
    if (c.quest && !(pack.cards?.[c.quest.into] || ITEMS[c.quest.into])) bad.push(`任务要变成的卡「${c.quest.into}」不存在`);
    if (bad.length) {
      err(`卡牌「${k}」：${bad.join('；')}`);
      continue;
    }
    ITEMS[k] = Object.assign({ f: '' }, c);
    count('cards');
  }

  /* ---- 遗物 ---- */
  for (const [k, r] of Object.entries(pack.relics || {})) {
    if (clash(RELICS, k, '遗物')) continue;
    const badM = Object.keys(r.m || {}).filter((m) => !MODL[m]);
    if (![0, 1, 2, 3].includes(r.t) || !r.n || !sprOk(r.ico) || badM.length) {
      err(`遗物「${k}」：品阶 t 是 0~3、要有名字 n、图标 ico 要存在${badM.length ? `；不认识的修正项 ${badM.join('、')}` : ''}`);
      continue;
    }
    RELICS[k] = Object.assign({ f: '' }, r);
    count('relics');
  }

  /* ---- 天赋 ---- */
  for (const [k, tl] of Object.entries(pack.talents || {})) {
    if (clash(TALENTS, k, '天赋')) continue;
    const badM = Object.keys(tl.m || {}).filter((m) => !MODL[m]);
    if (!TCAT[tl.cat] || ![0, 1, 2].includes(tl.r) || !tl.n || badM.length) {
      err(`天赋「${k}」：cat 是 atk/def/tech/eco、r 是 0~2、要有名字 n${badM.length ? `；不认识的修正项 ${badM.join('、')}` : ''}`);
      continue;
    }
    TALENTS[k] = Object.assign({ say: '' }, tl);
    count('talents');
  }

  /* ---- 敌人、首领 ---- */
  for (const [k, e] of Object.entries(pack.enemies || {})) {
    if (clash(EN, k, '敌人')) continue;
    const bad: string[] = [];
    for (const f of ['hp', 'spd', 'armor', 'wall', 'sc'] as const) if (typeof e[f] !== 'number') bad.push(`缺数字 ${f}`);
    if (!FACTIONS.includes(e.faction as never)) bad.push(`faction 只能是 ${FACTIONS.join(' / ')}`);
    if (!sprOk(e.spr)) bad.push(`像素图「${e.spr}」不存在`);
    if (!e.n) bad.push('缺名字 n');
    for (const it of e.intents || []) if (!INTENTS[it.a]) bad.push(`不认识的招式「${it.a}」（可用：${Object.keys(INTENTS).join('、')}）`);
    if (bad.length) {
      err(`敌人「${k}」：${bad.join('；')}`);
      continue;
    }
    EN[k] = { tip: '', intro: null, ...e };
    count(e.boss ? 'bosses' : 'enemies');
  }

  /* ---- 说话人 ---- */
  for (const [k, v] of Object.entries(pack.voices || {})) {
    if (clash(VOICES, k, '说话人')) continue;
    if (!v.n || !sprOk(v.img)) {
      err(`说话人「${k}」：要有名字 n 和头像 img`);
      continue;
    }
    VOICES[k] = { ...v };
    count('voices');
  }

  /* ---- 人物 ---- */
  for (const [k, h] of Object.entries(pack.heroes || {})) {
    if (clash(HEROES, k, '人物')) continue;
    const d = h.def;
    const bad: string[] = [];
    if (!d || !d.n || !d.title || !d.col || !(d.wall > 0) || !(d.gold >= 0)) bad.push('def 里要有 n、title、col、wall、gold');
    else if (!sprOk(d.portrait)) bad.push(`立绘「${d.portrait}」不存在`);
    if (d?.jump && !JUMP_STYLES.includes(d.jump)) bad.push(`jump 只能是 ${JUMP_STYLES.join(' / ')}`);
    if (!h.kits?.length) bad.push('至少要一套起手 kits');
    for (const kit of h.kits || []) for (const [c] of kit.cards || []) if (!ITEMS[c]) bad.push(`起手卡「${c}」不存在`);
    for (const p of h.paths || []) for (const c of p.cards) if (ITEMS[c]?.hero !== k) bad.push(`流派「${p.id}」里的「${c}」要是这个人物的专属卡（hero: '${k}'）`);
    if (bad.length) {
      err(`人物「${k}」：${bad.join('；')}`);
      continue;
    }
    HEROES[k] = Object.assign({ free: 1, start: h.kits[0].cards.map(([c, t], i) => [c, t, 3 + i] as [string, number, number]), tag: '', desc: '', intro: '' }, d);
    KITS[k] = h.kits;
    PATHS[k] = h.paths || [];
    if (!HERO_ORDER.includes(k)) HERO_ORDER.push(k);
    if (h.story) ((L as any).heroStory ||= {})[k] = h.story;
    count('heroes');
  }

  /* ---- 公共剧情的补充 ---- */
  if (pack.story) deepMerge(L.story, pack.story);

  /* ---- 触发钩子（写代码的效果） ---- */
  Object.assign(CARD_HOOKS, pack.hooks?.cards || {});
  Object.assign(RELIC_HOOKS, pack.hooks?.relics || {});
  Object.assign(TALENT_HOOKS, pack.hooks?.talents || {});
  return R;
}
