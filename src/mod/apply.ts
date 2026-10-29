/* 把模组包检查一遍，再合并进游戏的各张表（卡牌、遗物、天赋、敌人、人物、说话人、像素图、剧情、触发钩子）。
 * 有问题的条目跳过，不影响别的；问题记在报告里，工坊页能看到，控制台也会打出来。
 * Validate a mod pack, then merge it into the game's tables (cards, relics, talents, enemies, heroes, speakers, sprites, story, trigger hooks). Invalid entries are skipped without affecting the rest; problems are recorded in a report shown on the Workshop page and printed to the console.
 */
import { ITEMS, UPS, TAGS } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS, TCAT } from '../data/talents';
import { EN, FACTIONS, FOESETS } from '../data/enemies';
import { HEROES, KITS, PATHS, HERO_ORDER, SIGS, AWAKEN } from '../data/heroes';
import { EVENTS } from '../data/events';
import { VOICES } from '../data/voices';
import { MODL } from '../data/mods';
import { PAL } from '../data/art/palette';
import { L } from '../i18n';
import { CARD_HOOKS, RELIC_HOOKS, TALENT_HOOKS } from '../sim/hooks';
import { INTENTS } from '../sim/enemies';
import { addSprites, hasSpr, rowsOf } from '../render/sprites';
import { WORLDS, HERO_HOOKS, HERO_STATS, ENEMY_HOOKS, EVENT_CODE } from '../game/world';
import { deepMerge, baseStory } from './enter';
import type { ModPack, ModReport } from './types';

const FX = ['knife', 'spark', 'ice', 'bolt', 'rock', 'none', 'arrow', 'axe', 'shell', 'quake', 'flame', 'bell', 'blizzard', 'sting', 'gas', 'meteor', 'slash', 'fslash', 'firefly', 'sweep', 'avalanche', 'discharge', 'rain'];
const KINDS = ['weapon', 'firearm', 'potion', 'gadget', 'lamp', 'sky'];
const SHAPE = /^[a-z]+:[A-Za-z]$/;
/** 跃迁事件可以借用的玩法（见 src/app/prep/jumps.ts） / leap gameplay a mod may borrow (see src/app/prep/jumps.ts) */
const JUMP_STYLES = ['ayla', 'mo', 'ying', 'jun', 'li'];

const EV_CATS = ['shop', 'free', 'relic', 'up', 'misc', 'rare', 'fight'];

/** 模组的文字（剧情、觉醒名、敌人套名）挂在语言包上；换语言之后要重新挂一遍 / mod text (story, awakening names, enemy-set names) hangs on the locale pack; it has to be re-attached after a language switch */
const TEXT: (() => void)[] = [];
export const reapplyModText = () => TEXT.forEach((f) => f());

export function applyMod(pack: ModPack): ModReport {
  const R: ModReport = { id: pack.id, name: pack.name || pack.id, author: pack.author, desc: pack.desc, added: {}, errors: [] };
  const err = (s: string) => R.errors.push(s);
  const count = (k: string) => (R.added[k] = (R.added[k] || 0) + 1);
  if (!pack.id || !/^[a-z0-9-]+$/.test(pack.id)) err('模组的 id 只能用小写英文、数字和短横线');
  /** 重名检查：原版或别的模组已经有了，又没写 override / name-collision check: already present in the base game or another mod and override was not set */
  const clash = (reg: Record<string, unknown>, k: string, what: string) => {
    if (reg[k] && !pack.override) {
      err(`${what}「${k}」和已有的重名了（要覆盖原版，在模组里写 override: true）`);
      return true;
    }
    return false;
  };
  const sprOk = (k: string) => hasSpr(k) || !!pack.sprites?.[k] || SHAPE.test(k);

  /* ---- 像素图：先加，后面的检查要用 ---- / ---- Sprites: add first, later checks need them ---- */
  const goodSpr: Record<string, string[]> = {};
  for (const [k, spec] of Object.entries(pack.sprites || {})) {
    let rows = spec as string[];
    /* 换色 / 镜像：{ from: '已有的图', swap: { 原字母: 新字母 }, flip: 1 } / recolor / mirror: { from: 'existing', swap: { old: new }, flip: 1 } */
    if (!Array.isArray(spec)) {
      const src = rowsOf(spec.from) || (Array.isArray(pack.sprites?.[spec.from]) ? (pack.sprites![spec.from] as string[]) : goodSpr[spec.from]);
      if (!src) {
        err(`像素图「${k}」要换色的原图「${spec.from}」不存在`);
        continue;
      }
      rows = src.map((r) => [...r].map((ch) => spec.swap?.[ch] || ch).join(''));
      if (spec.flip) rows = rows.map((r) => [...r].reverse().join(''));
    }
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

  /* ---- 首领招式：先加，后面检查敌人要用 ---- / ---- Boss moves: add first, the enemy check needs them ---- */
  for (const [k, f] of Object.entries(pack.intents || {})) {
    if (clash(INTENTS, k, '招式')) continue;
    if (typeof f !== 'function') {
      err(`招式「${k}」要是一个函数 (e, v, k) => {}`);
      continue;
    }
    INTENTS[k] = f;
    count('intents');
  }

  /* ---- 自己的修正项：遗物、天赋、天性里用，钩子里 mv('键') 读 ---- / ---- Own modifier keys: used by relics, talents and natures, read with mv('key') in hooks ---- */
  for (const [k, md] of Object.entries(pack.mods || {})) {
    if (clash(MODL, k, '修正项')) continue;
    if (!md.n) {
      err(`修正项「${k}」：缺说明 n`);
      continue;
    }
    MODL[k] = md.inv ? [md.show ?? 2, 1] : [md.show ?? 2];
    TEXT.push(() => ((L.terms.mods as Record<string, string>)[k] = md.n));
    count('mods');
  }

  /* ---- 世界 ---- / ---- Worlds ---- */
  for (const [k, w] of Object.entries(pack.worlds || {})) {
    if (clash(WORLDS, k, '世界')) continue;
    if (!w.n) {
      err(`世界「${k}」：缺名字 n`);
      continue;
    }
    WORLDS[k] = { ...w, id: k };
    count('worlds');
  }

  /* ---- 卡牌 ---- / ---- Cards ---- */
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

  /* ---- 遗物 ---- / ---- Relics ---- */
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

  /* ---- 天赋 ---- / ---- Talents ---- */
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

  /* ---- 备战事件 ---- / ---- Prep events ---- */
  for (const [k, ev] of Object.entries(pack.events || {})) {
    if (clash(EVENTS, k, '事件')) continue;
    const bad: string[] = [];
    if (!ev.n) bad.push('缺名字 n');
    if (!EV_CATS.includes(ev.cat)) bad.push(`cat 只能是 ${EV_CATS.join(' / ')}`);
    if (!(ev.w >= 0)) bad.push('w（权重）要是不小于 0 的数');
    if (!sprOk(ev.ico)) bad.push(`图标「${ev.ico}」不存在`);
    if (typeof ev.enter !== 'function') bad.push('缺 enter(cur, api)');
    if (ev.world && !WORLDS[ev.world]) bad.push(`世界「${ev.world}」不存在`);
    if (bad.length) {
      err(`事件「${k}」：${bad.join('；')}`);
      continue;
    }
    const { need, enter, ...data } = ev;
    EVENTS[k] = { ...data, d: data.d || '', f: data.f || '', rar: data.rar ?? 0 };
    EVENT_CODE[k] = { need, enter };
    count('events');
  }

  /* ---- 敌人、首领 ---- / ---- Enemies, bosses ---- */
  for (const [k, e] of Object.entries(pack.enemies || {})) {
    if (clash(EN, k, '敌人')) continue;
    const bad: string[] = [];
    for (const f of ['hp', 'spd', 'armor', 'wall', 'sc'] as const) if (typeof e[f] !== 'number') bad.push(`缺数字 ${f}`);
    if (!FACTIONS.includes(e.faction as never)) bad.push(`faction 只能是 ${FACTIONS.join(' / ')}`);
    if (!sprOk(e.spr)) bad.push(`像素图「${e.spr}」不存在`);
    if (!e.n) bad.push('缺名字 n');
    if (e.world && !WORLDS[e.world]) bad.push(`世界「${e.world}」不存在`);
    for (const it of e.intents || []) if (!INTENTS[it.a]) bad.push(`不认识的招式「${it.a}」（可用：${Object.keys(INTENTS).join('、')}）`);
    if (bad.length) {
      err(`敌人「${k}」：${bad.join('；')}`);
      continue;
    }
    EN[k] = { tip: '', intro: null, ...e };
    count(e.boss ? 'bosses' : 'enemies');
  }

  /* ---- 敌人套 ---- / ---- Enemy sets ---- */
  for (const [k, fs] of Object.entries(pack.foesets || {})) {
    if (clash(FOESETS, k, '敌人套')) continue;
    const miss = Object.entries(fs.map || {}).filter(([a, b]) => !EN[a] || !EN[b]).map(([a, b]) => `${a}→${b}`);
    if (!fs.n || miss.length) {
      err(`敌人套「${k}」：${!fs.n ? '缺名字 n；' : ''}${miss.length ? `这些替换里有不存在的敌人：${miss.join('、')}` : ''}`);
      continue;
    }
    FOESETS[k] = { n: fs.n, map: { ...fs.map }, world: fs.world } as never;
    TEXT.push(() => (((L.terms as any).foesets ||= {})[k] = fs.n));
    count('foesets');
  }

  /* ---- 说话人 ---- / ---- Speakers ---- */
  for (const [k, v] of Object.entries(pack.voices || {})) {
    if (clash(VOICES, k, '说话人')) continue;
    if (!v.n || !sprOk(v.img)) {
      err(`说话人「${k}」：要有名字 n 和头像 img`);
      continue;
    }
    VOICES[k] = { ...v };
    count('voices');
  }

  /* ---- 人物 ---- / ---- Heroes ---- */
  for (const [k, h] of Object.entries(pack.heroes || {})) {
    if (clash(HEROES, k, '人物')) continue;
    const d = h.def;
    const bad: string[] = [];
    if (!d || !d.n || !d.title || !d.col || !(d.wall > 0) || !(d.gold >= 0)) bad.push('def 里要有 n、title、col、wall、gold');
    else if (!sprOk(d.portrait)) bad.push(`立绘「${d.portrait}」不存在`);
    if (d?.jump && !JUMP_STYLES.includes(d.jump)) bad.push(`jump 只能是 ${JUMP_STYLES.join(' / ')}`);
    if (d?.world && !WORLDS[d.world]) bad.push(`世界「${d.world}」不存在（先在 worlds 里写）`);
    if (h.awaken && (h.awaken.length !== 2 || h.awaken.some((a) => !a.id || !a.n || !a.d))) bad.push('awaken 要正好两个，每个有 id、n、d');
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
    if (h.sig) {
      SIGS[k] = { ...h.sig.m };
      Object.assign(HEROES[k], { sig: h.sig.n, sigD: h.sig.d });
    }
    if (h.awaken) AWAKEN[k] = h.awaken.map((a) => ({ id: a.id, m: { ...a.m } }));
    if (h.hooks) HERO_HOOKS[k] = h.hooks;
    if (h.stat) HERO_STATS[k] = h.stat;
    TEXT.push(() => {
      if (h.story) ((L as any).heroStory ||= {})[k] = h.story;
      for (const a of h.awaken || []) ((L.heroes as any).awaken ||= {})[a.id] = { n: a.n, d: a.d };
    });
    count('heroes');
  }

  /* ---- 公共剧情的补充 ---- / ---- Additions to the shared story ---- */
  if (pack.story) TEXT.push(() => deepMerge(baseStory(), pack.story));

  /* ---- 触发钩子（写代码的效果） ---- / ---- Trigger hooks (code-based effects) ---- */
  Object.assign(CARD_HOOKS, pack.hooks?.cards || {});
  Object.assign(RELIC_HOOKS, pack.hooks?.relics || {});
  Object.assign(TALENT_HOOKS, pack.hooks?.talents || {});
  Object.assign(ENEMY_HOOKS, pack.hooks?.enemies || {});
  reapplyModText();
  return R;
}
