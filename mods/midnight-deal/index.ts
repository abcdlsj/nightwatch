/* 小丑牌：照着原作做的同人模组。长夜里城外支起一张牌桌，吉姆博说：打过第八个底注，天就亮了。
 * 棋盘上的扑克牌凑【牌型】（对子、顺子、同花……），凑进牌型的牌每一下 =（牌的筹码 + 牌型筹码 + 小丑筹码）×（牌型倍率 + 小丑倍率）× 每个 ×倍率。
 * 小丑卡放在背包（或棋盘）里就生效，最多 5 张；星球升牌型等级，塔罗改牌（增强、换花色、加点数），幻灵牌加版本。
 * 数值膨胀：敌人血量跟着原作的底注分数曲线涨（第 1 夜 300 分、第 8 夜 5 万分……），打得过全靠一层层乘上去。
 * 人物是两副牌组：红色牌组（牌型、花色）和等离子牌组（筹码和倍率对半分再相乘）。剧情文字在 story.ts，像素图由 art.py 生成到 sprites.ts。
 * Balatro: a fan mod that follows the original. A card table goes up outside the wall in the long night; Jimbo says beat the eighth ante and the dawn is yours.
 * The board's playing cards form a 【poker hand】; each hit of a scoring card = (card chips + hand chips + joker chips) × (hand mult + joker mult) × every ×mult.
 * Jokers work from the bag (or the board), up to 5; planets level hands, tarots change cards (enhancements, suits, ranks), spectrals add editions.
 * Number inflation: enemy HP follows the original's ante score curve (300 on night 1, 50 000 on night 8…); you keep up only by stacking multipliers.
 * The heroes are two decks: the Red Deck (hands, suits) and the Plasma Deck (chips and mult balanced, then multiplied). Story text is in story.ts; sprites are generated into sprites.ts by art.py.
 */
import type { ModPack, ModEvent } from '../../src/mod/types';
import type { Enemy } from '../../src/sim/types';
import type { Card, CardSpec, Offer } from '../../src/game/state';
import type { ItemDef, Tag, Fx } from '../../src/data/types';
import { G } from '../../src/game/state';
import { ITEMS, UPS } from '../../src/data/cards';
import { mv } from '../../src/game/mods';
import { boardCards, stepOf, sellValue } from '../../src/game/cards';
import { B, bt, later } from '../../src/sim/battle';
import { damageWall } from '../../src/sim/enemies';
import { hpScale } from '../../src/sim/waves';
import { view } from '../../src/sim/view';
import { world, ex, ey } from '../../src/sim/world';
import { rand, pick, shuffled } from '../../src/core/rng';
import { fmt } from '../../src/core/util';
import { ws } from '../../src/game/world';
import sprites from './sprites';
import { worldStory, redStory, plasmaStory } from './story';

const W = 'deal';
const inBattle = () => !!B && !B.over && G.phase === 'battle';
const M = (e: Enemy) => (e.m ||= {});
type Api = Parameters<ModEvent['enter']>[1];
type Eff = { chips?: number; mult?: number; x?: number };

/* ================================================================ 扑克牌 / Playing cards */
type Suit = 's' | 'h' | 'c' | 'd';
const SUITS: Record<Suit, { n: string; ch: string; tag: Tag; fx: Fx }> = {
  s: { n: '黑桃', ch: '♠', tag: 'blade', fx: 'knife' },
  h: { n: '红桃', ch: '♥', tag: 'fire', fx: 'spark' },
  c: { n: '梅花', ch: '♣', tag: 'poison', fx: 'sting' },
  d: { n: '方片', ch: '♦', tag: 'volt', fx: 'bolt' },
};
/** 点数：id、大小（A 最大，也能当 1 凑顺子）、筹码、写法 / ranks: id, value (A is high, and low for straights), chips, label */
const RANKS: [string, number, number, string][] = [
  ['2', 2, 2, '2'], ['3', 3, 3, '3'], ['4', 4, 4, '4'], ['5', 5, 5, '5'], ['6', 6, 6, '6'], ['7', 7, 7, '7'], ['8', 8, 8, '8'], ['9', 9, 9, '9'],
  ['t', 10, 10, '10'], ['j', 11, 10, 'J'], ['q', 12, 10, 'Q'], ['k', 13, 10, 'K'], ['a', 14, 11, 'A'],
];
const RV: Record<string, number> = Object.fromEntries(RANKS.map((r) => [r[0], r[1]]));
const RID = (v: number) => RANKS.find((r) => r[1] === v)![0];
const isPC = (k: string) => k.startsWith('pc_');
const isJK = (k: string) => k.startsWith('jk_');
const suitOf = (c: { key: string }) => c.key[3] as Suit;
const rankOf = (c: { key: string }) => RV[c.key.slice(4)];
const pcKey = (s: Suit, v: number) => `pc_${s}${RID(v)}`;
const isFace = (c: { key: string }) => rankOf(c) >= 11 && rankOf(c) <= 13;
const SUITLINE: Record<Suit, string> = {
  s: '黑桃是刀。', h: '红桃是火。', c: '梅花是毒。', d: '方片是电。',
};

function playingCards() {
  const out: Record<string, ItemDef> = {};
  for (const s of ['s', 'h', 'c', 'd'] as Suit[])
    for (const [id, v, chips, l] of RANKS)
      out[`pc_${s}${id}`] = {
        size: 1, tag: SUITS[s].tag, t: 0, up: 'dmg', cd: 1.4, dmg: chips, fx: SUITS[s].fx, kind: 'weapon', world: W, poolW: 0.3,
        n: SUITS[s].n + l,
        d: `扑克牌。筹码 ${chips}。凑进【牌型】的牌才吃牌型和小丑的加成；没凑进去的只打自己的筹码。`,
        f: v >= 11 && v <= 13 ? `人头牌。${SUITLINE[s]}` : v === 14 ? `一张 A。${SUITLINE[s]}` : SUITLINE[s],
      };
  return out;
}

/* ================================================================ 牌型 / Poker hands */
/** 原作的数值：基础筹码、倍率，每升一级加多少（星球） / the original's numbers: base chips, mult, and per-level gains (planets) */
export const HANDS = [
  { id: 'high', n: '高牌', c: 5, m: 1, lc: 10, lm: 1, p: '冥王星', d: '一张最大的牌' },
  { id: 'pair', n: '对子', c: 10, m: 2, lc: 15, lm: 1, p: '水星', d: '两张同点数' },
  { id: 'two', n: '两对', c: 20, m: 2, lc: 20, lm: 1, p: '天王星', d: '两组对子' },
  { id: 'three', n: '三条', c: 30, m: 3, lc: 20, lm: 2, p: '金星', d: '三张同点数' },
  { id: 'straight', n: '顺子', c: 30, m: 4, lc: 30, lm: 3, p: '土星', d: '五张点数连着' },
  { id: 'flush', n: '同花', c: 35, m: 4, lc: 15, lm: 2, p: '木星', d: '五张同花色' },
  { id: 'full', n: '葫芦', c: 40, m: 4, lc: 25, lm: 2, p: '地球', d: '三条加一对' },
  { id: 'four', n: '四条', c: 60, m: 7, lc: 30, lm: 3, p: '火星', d: '四张同点数' },
  { id: 'sflush', n: '同花顺', c: 100, m: 8, lc: 40, lm: 4, p: '海王星', d: '同花色的顺子' },
  { id: 'five', n: '五条', c: 120, m: 12, lc: 35, lm: 3, p: '行星X', d: '五张同点数' },
  { id: 'fhouse', n: '同花葫芦', c: 140, m: 14, lc: 40, lm: 4, p: '谷神星', d: '同花色的葫芦' },
  { id: 'ffive', n: '同花五条', c: 160, m: 16, lc: 50, lm: 3, p: '阋神星', d: '同花色的五条' },
];
const HI: Record<string, number> = Object.fromEntries(HANDS.map((h, i) => [h.id, i]));
/** 「含有」：原作里对子小丑这类看的是牌型里有没有对子 / 'contains': in the original, pair jokers check whether the hand contains a pair */
const HAS: Record<string, string[]> = {
  pair: ['pair', 'two', 'three', 'full', 'four', 'five', 'fhouse', 'ffive'],
  two: ['two', 'full', 'fhouse'],
  three: ['three', 'full', 'four', 'five', 'fhouse', 'ffive'],
  four: ['four', 'five', 'ffive'],
  straight: ['straight', 'sflush'],
  flush: ['flush', 'sflush', 'fhouse', 'ffive'],
};
const has = (h: string, what: string) => HAS[what].includes(h);

export const lvOf = (id: string) => Math.max(1, ((ws().lv || {})[id] || 1) + mv('handLv'));
/** 牌型的筹码和倍率（看等级） / a hand's chips and mult at its level */
export function handVal(id: string) {
  const h = HANDS[HI[id]];
  const lv = lvOf(id);
  return { id, n: h.n, lv, chips: h.c + (lv - 1) * h.lc, mult: h.m + (lv - 1) * h.lm };
}
function lvUp(id: string, n = 1) {
  const lv = (ws().lv ||= {});
  lv[id] = (lv[id] || 1) + n;
  ws().lvV = (ws().lvV || 0) + 1;
}

/** 一组牌（全部都要算进去）是什么牌型 / what hand a set of cards forms, using all of them */
function classify(cs: Card[], four: boolean, smear: boolean): string | null {
  const k = cs.length;
  const rc: Record<number, number> = {};
  for (const c of cs) rc[rankOf(c)] = (rc[rankOf(c)] || 0) + 1;
  const counts = Object.values(rc).sort((a, b) => b - a);
  const sk = (c: Card) => (smear ? (suitOf(c) === 'h' || suitOf(c) === 'd' ? 'r' : 'b') : suitOf(c));
  const wild = (c: Card) => c.mk?.en === 'wild';
  const plain = cs.filter((c) => !wild(c));
  const flush = k >= (four ? 4 : 5) && plain.every((c) => sk(c) === sk(plain[0] || c));
  const vs = [...new Set(cs.map(rankOf))].sort((a, b) => a - b);
  const run = (arr: number[]) => arr.length === k && arr.every((v, i) => !i || v === arr[i - 1] + 1);
  const straight = k >= (four ? 4 : 5) && (run(vs) || (vs.includes(14) && run([1, ...vs.filter((v) => v !== 14)].sort((a, b) => a - b))));
  if (k === 5) {
    if (counts[0] === 5) return flush ? 'ffive' : 'five';
    if (counts[0] === 3 && counts[1] === 2) return flush ? 'fhouse' : 'full';
    if (straight && flush) return 'sflush';
    if (flush) return 'flush';
    if (straight) return 'straight';
    return null;
  }
  if (k === 4) {
    if (four && straight && flush) return 'sflush';
    if (counts[0] === 4) return 'four';
    if (four && flush) return 'flush';
    if (four && straight) return 'straight';
    if (counts[0] === 2 && counts[1] === 2) return 'two';
    return null;
  }
  if (k === 3) return counts[0] === 3 ? 'three' : null;
  if (k === 2) return counts[0] === 2 ? 'pair' : null;
  return k === 1 ? 'high' : null;
}
/** 这几张牌能凑出的最大牌型和计分的牌 / the best hand these cards make, and which cards score */
export function bestHand(cards: Card[], opt: { four?: boolean; smear?: boolean } = {}) {
  const n = cards.length;
  let best = { id: 'high', scoring: [] as Card[], v: -1 };
  const cur: Card[] = [];
  const go = (i: number) => {
    if (cur.length) {
      const id = classify(cur, !!opt.four, !!opt.smear);
      if (id) {
        const v = HI[id] * 1000 + cur.reduce((s, c) => s + rankOf(c), 0);
        if (v > best.v) best = { id, scoring: cur.slice(), v };
      }
    }
    if (cur.length === 5) return;
    for (let j = i; j < n; j++) {
      cur.push(cards[j]);
      go(j + 1);
      cur.pop();
    }
  };
  go(0);
  return { id: best.id, scoring: best.scoring };
}

/* ================================================================ 盲注和底注 / Blinds and antes */
/* from：最早第几夜才会抽到。照原作，狠的首领盲要等底注往后才出；第一个首领盲只抽不拆牌型的 / from: the earliest night a rule can be drawn. As in the original, the harsh boss blinds wait for a later ante; the first boss blind only draws rules that leave your hand intact */
const RULES: Record<string, { n: string; d: string; from?: number }> = {
  hook: { n: '钩子', d: '每 7 秒，随机两张卡的充能被钩走' },
  club: { n: '梅花', d: '梅花牌被削弱：不计分', from: 6 },
  goad: { n: '尖刺', d: '黑桃牌被削弱：不计分', from: 6 },
  head: { n: '头颅', d: '红桃牌被削弱：不计分', from: 6 },
  window: { n: '窗户', d: '方片牌被削弱：不计分', from: 6 },
  plant: { n: '植物', d: '人头牌被削弱：不计分', from: 6 },
  flint: { n: '燧石', d: '牌型的筹码和倍率减半', from: 6 },
  arm: { n: '手臂', d: '这一夜牌型降一级', from: 6 },
  psychic: { n: '灵媒', d: '计分的牌不到 5 张，伤害减半', from: 6 },
  wall: { n: '墙', d: '敌人血量 ×1.6', from: 6 },
  wheel: { n: '轮子', d: '每 6 秒，随机一张卡翻面 3 秒' },
  house: { n: '房子', d: '开战头 4 秒，所有卡都扣着' },
  manacle: { n: '手铐', d: '最右边那张卡，开战后 15 秒才能动' },
  needle: { n: '针', d: '开战时城墙 -3' },
};
function blind() {
  const r = G.round;
  const kind = r === 9 ? 'boss' : r % 3 === 0 ? 'boss' : r % 3 === 2 ? 'big' : 'small';
  const rule = kind === 'boss' && r !== 9 && !hasJoker('jk_chicot') ? (ws().rule as string) || 'hook' : '';
  return { kind, n: r === 9 ? '决胜首领盲' : { small: '小盲注', big: '大盲注', boss: '首领盲注' }[kind]!, pay: { small: 1, big: 2, boss: 3 }[kind]!, rule };
}
/** 底注分数曲线（第 1 夜 300 分的倍数），照原作：300、800、2000、5000、1.1 万、2 万、3.5 万、5 万…… / the ante score curve (multiples of night 1's 300), after the original */
const ANTE = [0, 1, 2.6, 6.5, 16, 34, 60, 100, 150, 260];
export const anteOf = (n: number) => (n <= 9 ? ANTE[n] : ANTE[9] * Math.pow(2.6, n - 9));
const baseHp = (n: number) => hpScale(n) * (n === 1 ? 0.5 : n === 2 ? 0.6 : 0.7);
/** 第 1 夜比原版多几倍 / how much more than the base game on night 1 */
const HPK = 2.4;
/** 这个世界的敌人血量比原版多几倍：照底注曲线算，扣掉原版自己的增长 / how much more enemy HP than the base game: the ante curve, minus the base game's own growth */
export const hpMul = (n = G.round) => (HPK * anteOf(n)) / (baseHp(n) / baseHp(1));

/* ================================================================ 小丑 / Jokers */
interface Ctx {
  hand: ReturnType<typeof handVal>;
  scoring: Set<Card>;
  off: Set<Card>;
  jokers: Card[];
  cap: number;
  pcs: Card[];
  held: Card[];
}
interface JDef {
  t: number;
  n: string;
  d: string;
  f: string;
  hero?: string;
  noPool?: number;
  /** 每一下都加（所有计分的牌） / added to every scoring hit */
  g?: (j: Card, x: Ctx, s: number) => Eff | void;
  /** 只看这张计分的牌 / for this scoring card only */
  p?: (j: Card, pc: Card, x: Ctx, s: number) => Eff | void;
  /** 守住一夜之后 / after a held night */
  end?: (j: Card, x: Ctx, s: number) => void;
  /** 卡面数字 / card face number */
  num?: (j: Card, x: Ctx, s: number) => string;
  mods?: Record<string, number>;
}
const SC = (j: Card) => 1 + 0.5 * stepOf(j);
const v = (j: Card) => (j.mk?.v as number) || 0;
const setV = (j: Card, n: number) => ((j.mk ||= {}).v = n);
const odd = (r: number) => r === 14 || r % 2 === 1;
const even = (r: number) => r <= 10 && r % 2 === 0;
const n1 = (x: number) => (Math.round(x * 10) / 10).toString();
/** 一个钱袋里的金子（欠着就是 0） / gold in the purse (0 when in debt) */
const purse = () => Math.max(0, G.gold);

const JK: Record<string, JDef> = {
  /* ---------- 通用 ---------- */
  jk_joker: { t: 0, n: '小丑', d: '倍率 +4。', f: '吉姆博本人。', g: (_j, _x, s) => ({ mult: 4 * s }), num: (_j, _x, s) => `+${4 * s}倍` },
  jk_half: { t: 0, n: '半张小丑', d: '计分的牌不超过 3 张时，倍率 +20。', f: '另一半去哪儿了？', g: (_j, x, s) => (x.scoring.size <= 3 ? { mult: 20 * s } : undefined), num: (_j, _x, s) => `+${20 * s}倍` },
  jk_abstract: { t: 0, n: '抽象小丑', d: '你每有一张小丑，倍率 +3。', f: '看不懂。但它很开心。', g: (_j, x, s) => ({ mult: 3 * s * jokersOwned().length }), num: (_j, _x, s) => `+${3 * s * jokersOwned().length}倍` },
  jk_misprint: { t: 0, n: '印错的小丑', d: '每一下倍率随机 +0 到 +23。', f: '#@%！', g: (_j, _x, s) => ({ mult: (inBattle() ? Math.floor(rand() * 24) : 11.5) * s }), num: () => '+?倍' },
  jk_even: { t: 0, n: '偶数史蒂文', d: '点数是 10、8、6、4、2 的牌计分时，倍率 +4。', f: '他只在双数的日子出门。', p: (_j, pc, _x, s) => (even(rankOf(pc)) ? { mult: 4 * s } : undefined), num: (_j, _x, s) => `偶+${4 * s}` },
  jk_odd: { t: 0, n: '奇数托德', hero: 'dk_plasma', d: '点数是 A、9、7、5、3 的牌计分时，筹码 +31。', f: '他只在单数的日子出门。', p: (_j, pc, _x, s) => (odd(rankOf(pc)) ? { chips: 31 * s } : undefined), num: (_j, _x, s) => `奇+${31 * s}` },
  jk_smiley: { t: 0, n: '笑脸', d: '人头牌计分时，倍率 +5。', f: '一直在笑。', p: (_j, pc, _x, s) => (isFace(pc) ? { mult: 5 * s } : undefined), num: (_j, _x, s) => `脸+${5 * s}` },
  jk_scholar: { t: 0, n: '学者', d: 'A 计分时，筹码 +20，倍率 +4。', f: '读了很多书，只记得 A。', p: (_j, pc, _x, s) => (rankOf(pc) === 14 ? { chips: 20 * s, mult: 4 * s } : undefined), num: () => 'A' },
  jk_fib: { t: 1, n: '斐波那契', d: 'A、2、3、5、8 计分时，倍率 +8。', f: '1，1，2，3，5，8……', p: (_j, pc, _x, s) => ([14, 2, 3, 5, 8].includes(rankOf(pc)) ? { mult: 8 * s } : undefined), num: (_j, _x, s) => `+${8 * s}倍` },
  jk_green: { t: 0, n: '绿色小丑', d: '每守住一夜，倍率永久 +1（越升品涨得越快）。', f: '吃得越多，越绿。', g: (j) => ({ mult: v(j) }), end: (j, _x, s) => setV(j, v(j) + s), num: (j) => `+${n1(v(j))}倍` },
  jk_bus: { t: 0, n: '乘公交', d: '连着几夜没有人头牌计分，每夜倍率 +1；有人头牌计分就清零。', f: '下一站，下一站。', g: (j) => ({ mult: v(j) }), end: (j, x, s) => setV(j, [...x.scoring].some(isFace) ? 0 : v(j) + s), num: (j) => `+${n1(v(j))}倍` },
  jk_supernova: { t: 0, n: '超新星', d: '这一局里，现在这个牌型每打过一夜，倍率 +1。', f: '它亮过一次，就会一直亮。', g: (_j, x, s) => ({ mult: (((ws().played || {})[x.hand.id] as number) || 0) * s }), num: (_j, x, s) => `+${(((ws().played || {})[x.hand.id] as number) || 0) * s}倍` },
  jk_egg: { t: 0, n: '蛋', d: '每守住一夜，卖价 +3。', f: '别急着孵。', end: (j, _x, s) => (j.hoard += Math.round(3 * s)), num: (j) => `卖${sellValue(j)}` },
  jk_golden: { t: 0, n: '黄金小丑', d: '每守住一夜，+3 金。', f: '金光闪闪。', end: (_j, _x, s) => gold(Math.round(3 * s)), num: (_j, _x, s) => `+${Math.round(3 * s)}金` },
  jk_rocket: { t: 1, n: '火箭', d: '每守住一夜给金子（从 1 金起）；每打过一个首领盲，再多给 2 金。', f: '十、九、八……', end: (j, _x, s) => { gold(Math.round((1 + v(j)) * s)); if (blind().kind === 'boss') setV(j, v(j) + 2); }, num: (j, _x, s) => `+${Math.round((1 + v(j)) * s)}金` },
  jk_bootstraps: { t: 1, n: '靴带', d: '身上每有 5 金，倍率 +2。', f: '自己把自己拎起来。', g: (_j, _x, s) => ({ mult: 2 * s * Math.floor(purse() / 5) }), num: (_j, _x, s) => `+${2 * s * Math.floor(purse() / 5)}倍` },
  jk_moon: { t: 1, n: '冲向月球', d: '每守住一夜，身上每有 5 金再多给 1 金利息（最多 +5）。', f: '到月球去！', end: () => gold(Math.min(5, Math.floor(purse() / 5))), num: () => `+${Math.min(5, Math.floor(purse() / 5))}息` },
  jk_credit: { t: 0, n: '信用卡', d: '钱不够也能买，最多欠 20 金。', f: '先花了再说。', mods: { debt: 20 }, num: () => '-20' },
  jk_splash: { t: 0, n: '飞溅', d: '棋盘上所有扑克牌都算计分。', f: '溅得到处都是。', num: () => '全计分' },
  jk_blueprint: { t: 2, n: '蓝图', d: '照抄右边那张小丑的效果。', f: '照着画就行。', num: () => '抄右' },
  jk_brainstorm: { t: 2, n: '头脑风暴', d: '照抄最左边那张小丑的效果。', f: '想到了！', num: () => '抄左' },
  jk_cavendish: { t: 2, n: '卡文迪什', d: '倍率 ×3。每守住一夜，有千分之一的机会烂掉。', f: '大麦克灭绝之后，大家只能吃这个了。', g: (_j, _x, s) => ({ x: 1 + 2 * s }), end: (j) => { if (rand() < 0.001) lose(j, '卡文迪什烂掉了'); }, num: (_j, _x, s) => `×${n1(1 + 2 * s)}` },
  /* 传说：只有幻灵牌「灵魂」给 / legendary: only from the Soul spectral */
  jk_triboulet: { t: 2, n: '特里布莱', noPool: 1, d: '传说。K 和 Q 计分时，倍率 ×2。', f: '国王的弄臣。', p: (_j, pc, _x, s) => (rankOf(pc) === 12 || rankOf(pc) === 13 ? { x: 1 + s } : undefined), num: (_j, _x, s) => `KQ×${1 + s}` },
  jk_chicot: { t: 2, n: '奇科', noPool: 1, d: '传说。首领盲注的怪规矩不生效。', f: '他笑着看你打首领。', num: () => '免规矩' },
  jk_canio: { t: 2, n: '卡尼奥', noPool: 1, d: '传说。这局每毁掉一张人头牌，倍率 ×1（最少 ×1）。', f: '他收藏人头。', g: (_j, _x, s) => ({ x: 1 + s * ((ws().faceGone as number) || 0) }), num: (_j, _x, s) => `×${n1(1 + s * ((ws().faceGone as number) || 0))}` },

  /* ---------- 红色牌组 · 牌型 ---------- */
  jk_jolly: { t: 0, hero: 'dk_red', n: '开心小丑', d: '牌型含有对子时，倍率 +8。', f: '哈哈！', g: (_j, x, s) => (has(x.hand.id, 'pair') ? { mult: 8 * s } : undefined), num: (_j, _x, s) => `+${8 * s}倍` },
  jk_zany: { t: 0, hero: 'dk_red', n: '古怪小丑', d: '牌型含有三条时，倍率 +12。', f: '嘻嘻嘻！', g: (_j, x, s) => (has(x.hand.id, 'three') ? { mult: 12 * s } : undefined), num: (_j, _x, s) => `+${12 * s}倍` },
  jk_mad: { t: 0, hero: 'dk_red', n: '疯狂小丑', d: '牌型含有两对时，倍率 +10。', f: '啊啊啊！', g: (_j, x, s) => (has(x.hand.id, 'two') ? { mult: 10 * s } : undefined), num: (_j, _x, s) => `+${10 * s}倍` },
  jk_crazy: { t: 0, hero: 'dk_red', n: '狂野小丑', d: '牌型含有顺子时，倍率 +12。', f: '咿呀！', g: (_j, x, s) => (has(x.hand.id, 'straight') ? { mult: 12 * s } : undefined), num: (_j, _x, s) => `+${12 * s}倍` },
  jk_droll: { t: 0, hero: 'dk_red', n: '滑稽小丑', d: '牌型含有同花时，倍率 +10。', f: '……噗。', g: (_j, x, s) => (has(x.hand.id, 'flush') ? { mult: 10 * s } : undefined), num: (_j, _x, s) => `+${10 * s}倍` },
  jk_duo: { t: 1, hero: 'dk_red', n: '二重奏', d: '牌型含有对子时，倍率 ×2。', f: '两个人一起唱。', g: (_j, x, s) => (has(x.hand.id, 'pair') ? { x: 1 + s } : undefined), num: (_j, _x, s) => `×${n1(1 + s)}` },
  jk_trio: { t: 1, hero: 'dk_red', n: '三重奏', d: '牌型含有三条时，倍率 ×3。', f: '三个人一起唱。', g: (_j, x, s) => (has(x.hand.id, 'three') ? { x: 1 + 2 * s } : undefined), num: (_j, _x, s) => `×${n1(1 + 2 * s)}` },
  jk_family: { t: 2, hero: 'dk_red', n: '一家人', d: '牌型含有四条时，倍率 ×4。', f: '一家四口。', g: (_j, x, s) => (has(x.hand.id, 'four') ? { x: 1 + 3 * s } : undefined), num: (_j, _x, s) => `×${n1(1 + 3 * s)}` },
  jk_order: { t: 1, hero: 'dk_red', n: '秩序', d: '牌型含有顺子时，倍率 ×3。', f: '一个接一个。', g: (_j, x, s) => (has(x.hand.id, 'straight') ? { x: 1 + 2 * s } : undefined), num: (_j, _x, s) => `×${n1(1 + 2 * s)}` },
  jk_tribe: { t: 1, hero: 'dk_red', n: '部落', d: '牌型含有同花时，倍率 ×2。', f: '一个颜色的人。', g: (_j, x, s) => (has(x.hand.id, 'flush') ? { x: 1 + s } : undefined), num: (_j, _x, s) => `×${n1(1 + s)}` },
  /* ---------- 红色牌组 · 花色 ---------- */
  jk_greedy: { t: 0, hero: 'dk_red', n: '贪婪小丑', d: '方片牌计分时，倍率 +3。', f: '还要。', p: (_j, pc, x, s) => (suitIs(pc, 'd', x) ? { mult: 3 * s } : undefined), num: (_j, _x, s) => `♦+${3 * s}` },
  jk_lusty: { t: 0, hero: 'dk_red', n: '色欲小丑', d: '红桃牌计分时，倍率 +3。', f: '心动了。', p: (_j, pc, x, s) => (suitIs(pc, 'h', x) ? { mult: 3 * s } : undefined), num: (_j, _x, s) => `♥+${3 * s}` },
  jk_wrath: { t: 0, hero: 'dk_red', n: '暴怒小丑', d: '黑桃牌计分时，倍率 +3。', f: '气死了。', p: (_j, pc, x, s) => (suitIs(pc, 's', x) ? { mult: 3 * s } : undefined), num: (_j, _x, s) => `♠+${3 * s}` },
  jk_glutton: { t: 0, hero: 'dk_red', n: '暴食小丑', d: '梅花牌计分时，倍率 +3。', f: '饿了。', p: (_j, pc, x, s) => (suitIs(pc, 'c', x) ? { mult: 3 * s } : undefined), num: (_j, _x, s) => `♣+${3 * s}` },
  jk_arrow: { t: 1, hero: 'dk_red', n: '箭头', d: '黑桃牌计分时，筹码 +50。', f: '尖朝上。', p: (_j, pc, x, s) => (suitIs(pc, 's', x) ? { chips: 50 * s } : undefined), num: (_j, _x, s) => `♠+${50 * s}` },
  jk_onyx: { t: 1, hero: 'dk_red', n: '缟玛瑙', d: '梅花牌计分时，倍率 +7。', f: '黑得发亮。', p: (_j, pc, x, s) => (suitIs(pc, 'c', x) ? { mult: 7 * s } : undefined), num: (_j, _x, s) => `♣+${7 * s}` },
  jk_blood: { t: 1, hero: 'dk_red', n: '血石', d: '红桃牌计分时，一半的机会倍率 ×1.5。', f: '里面有血在流。', p: (_j, pc, x, s) => (suitIs(pc, 'h', x) ? { x: inBattle() ? (rand() < 0.5 ? 1 + 0.5 * s : 1) : 1 + 0.25 * s } : undefined), num: (_j, _x, s) => `♥×${1 + 0.5 * s}` },
  jk_rough: { t: 1, hero: 'dk_red', n: '原石', d: '方片牌每打中一下，8% 的机会 +1 金（每场最多 5 金）。', f: '还没打磨。', num: () => '♦$' },
  jk_smeared: { t: 1, hero: 'dk_red', n: '涂抹小丑', d: '红桃和方片算同一种花色，黑桃和梅花也算同一种。', f: '颜色糊在一起了。', num: () => '糊' },
  jk_fourfinger: { t: 2, hero: 'dk_red', n: '四指', d: '同花和顺子只要 4 张。', f: '少了一根。', num: () => '四张' },

  /* ---------- 等离子牌组 · 筹码 ---------- */
  jk_sly: { t: 0, hero: 'dk_plasma', n: '狡猾小丑', d: '牌型含有对子时，筹码 +50。', f: '嘿嘿。', g: (_j, x, s) => (has(x.hand.id, 'pair') ? { chips: 50 * s } : undefined), num: (_j, _x, s) => `+${50 * s}` },
  jk_wily: { t: 0, hero: 'dk_plasma', n: '狡诈小丑', d: '牌型含有三条时，筹码 +100。', f: '嘿嘿嘿。', g: (_j, x, s) => (has(x.hand.id, 'three') ? { chips: 100 * s } : undefined), num: (_j, _x, s) => `+${100 * s}` },
  jk_clever: { t: 0, hero: 'dk_plasma', n: '聪明小丑', d: '牌型含有两对时，筹码 +80。', f: '我早就算到了。', g: (_j, x, s) => (has(x.hand.id, 'two') ? { chips: 80 * s } : undefined), num: (_j, _x, s) => `+${80 * s}` },
  jk_scary: { t: 0, hero: 'dk_plasma', n: '恐怖脸', d: '人头牌计分时，筹码 +30。', f: '别看它的眼睛。', p: (_j, pc, _x, s) => (isFace(pc) ? { chips: 30 * s } : undefined), num: (_j, _x, s) => `脸+${30 * s}` },
  jk_icecream: { t: 0, hero: 'dk_plasma', n: '冰淇淋', d: '筹码 +100；每守住一夜少 5，化完了就没了。', f: '快吃，要化了。', g: (j, _x, s) => ({ chips: (100 - v(j)) * s }), end: (j) => { setV(j, v(j) + 5); if (v(j) >= 100) lose(j, '冰淇淋化完了'); }, num: (j, _x, s) => `+${(100 - v(j)) * s}` },
  jk_blue: { t: 1, hero: 'dk_plasma', n: '蓝色小丑', d: '你每有一张卡（棋盘和背包），筹码 +8。', f: '牌堆越厚，它越蓝。', g: (_j, _x, s) => ({ chips: 8 * s * G.cards.length }), num: (_j, _x, s) => `+${8 * s * G.cards.length}` },
  jk_bull: { t: 1, hero: 'dk_plasma', n: '公牛', d: '身上每有 1 金，筹码 +2。', f: '牛市。', g: (_j, _x, s) => ({ chips: 2 * s * purse() }), num: (_j, _x, s) => `+${2 * s * purse()}` },
  jk_hiker: { t: 1, hero: 'dk_plasma', n: '徒步者', d: '每守住一夜，计分的牌永久 +3 筹码。', f: '走了很远的路。', end: (_j, x, s) => { for (const c of x.scoring) c.grow = (c.grow || 0) + 3 * s; }, num: (_j, _x, s) => `+${3 * s}/夜` },
  /* ---------- 等离子牌组 · 乘倍 ---------- */
  jk_gros: { t: 0, hero: 'dk_plasma', n: '大麦克香蕉', d: '倍率 +15。每守住一夜，有六分之一的机会灭绝。', f: '最好吃的香蕉。', g: (_j, _x, s) => ({ mult: 15 * s }), end: (j) => { if (rand() < 1 / 6) { ws().grosGone = 1; lose(j, '大麦克香蕉灭绝了'); } }, num: (_j, _x, s) => `+${15 * s}倍` },
  jk_hologram: { t: 1, hero: 'dk_plasma', n: '全息影像', d: '你每有一张扑克牌，倍率 ×0.1（从 ×1 起）。', f: '它是你牌堆的影子。', g: (_j, _x, s) => ({ x: 1 + 0.1 * s * G.cards.filter((c) => isPC(c.key)).length }), num: (_j, _x, s) => `×${n1(1 + 0.1 * s * G.cards.filter((c) => isPC(c.key)).length)}` },
  jk_constellation: { t: 1, hero: 'dk_plasma', n: '星座', d: '这局每用过一颗星球，倍率 ×0.1（从 ×1 起）。', f: '连起来是你的名字。', g: (_j, _x, s) => ({ x: 1 + 0.1 * s * ((ws().planets as number) || 0) }), num: (_j, _x, s) => `×${n1(1 + 0.1 * s * ((ws().planets as number) || 0))}` },
  jk_stencil: { t: 1, hero: 'dk_plasma', n: '小丑模板', d: '每有一个空着的小丑栏，倍率 ×1（它自己也算空的）。', f: '中间是空的。', g: (_j, x, s) => ({ x: 1 + s * emptySlots(x) }), num: (_j, x, s) => `×${n1(1 + s * emptySlots(x))}` },
  jk_photo: { t: 0, hero: 'dk_plasma', n: '照片', d: '计分的牌里第一张人头牌，倍率 ×2。', f: '咔嚓。', p: (_j, pc, x, s) => (pc === [...x.scoring].filter(isFace).sort((a, b) => a.idx - b.idx)[0] ? { x: 1 + s } : undefined), num: (_j, _x, s) => `×${1 + s}` },
  jk_baron: { t: 2, hero: 'dk_plasma', n: '男爵', d: '背包里每有一张 K，倍率 ×1.5。', f: '他从来不出手，只是坐着。', g: (_j, x, s) => ({ x: Math.pow(1 + 0.5 * s, x.held.filter((c) => rankOf(c) === 13).length) }), num: (_j, x, s) => `×${n1(Math.pow(1 + 0.5 * s, x.held.filter((c) => rankOf(c) === 13).length))}` },
  jk_blackboard: { t: 1, hero: 'dk_plasma', n: '黑板', d: '背包里的扑克牌全是黑桃或梅花时，倍率 ×3。', f: '粉笔写的字。', g: (_j, x, s) => (x.held.every((c) => suitOf(c) === 's' || suitOf(c) === 'c') ? { x: 1 + 2 * s } : undefined), num: (_j, _x, s) => `×${1 + 2 * s}` },
};
const suitIs = (pc: Card, s: Suit, x: Ctx) => {
  if (pc.mk?.en === 'wild') return true;
  const k = suitOf(pc);
  if (k === s) return true;
  if (!x.jokers.some((j) => j.key === 'jk_smeared')) return false;
  return (s === 'h' || s === 'd') === (k === 'h' || k === 'd');
};
const emptySlots = (x: Ctx) => Math.max(1, x.cap - x.jokers.filter((j) => j.mk?.ed !== 'neg' && j.key !== 'jk_stencil').length);

function jokerCards(): Record<string, ItemDef> {
  const out: Record<string, ItemDef> = {};
  for (const [k, d] of Object.entries(JK))
    out[k] = {
      size: 1, tag: 'mech', t: d.t, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, kind: 'gadget', ...(d.hero ? { hero: d.hero } : { world: W }), ...(d.noPool ? { noPool: 1 } : {}),
      n: d.n, d: `小丑：放在背包或棋盘上就生效（最多 5 张）。${d.d}`, f: d.f,
    };
  return out;
}

/* 拥有的小丑：背包是小丑栏，先算背包从左到右，再算棋盘从左到右 / jokers owned: the bag is the joker row, so the bag left to right first, then the board */
const jokersOwned = () => G.cards.filter((c) => isJK(c.key)).sort((a, b) => (a.loc === b.loc ? a.idx - b.idx : a.loc === 'stash' ? -1 : 1));
const hasJoker = (k: string) => activeJokers().some((j) => j.key === k);
const jokerCap = () => 5 + mv('dl_jslot');
function activeJokers() {
  const out: Card[] = [];
  let n = 0;
  for (const j of jokersOwned()) {
    if (j.mk?.ed === 'neg') out.push(j);
    else if (n < jokerCap()) {
      out.push(j);
      n++;
    }
  }
  return out;
}

/* ================================================================ 每一下的计分 / Scoring each hit */
let CK = '';
let CV: Ctx | null = null;
const sig = () =>
  G.cards.map((c) => `${c.key}${c.tier}${c.loc}${c.idx}${c.mk ? JSON.stringify(c.mk) : ''}`).join('|') + `#${ws().lvV || 0}#${G.round}#${ws().rule || ''}#${G.hero}`;
function debuffed(c: Card, rule: string) {
  if (rule === 'club') return suitOf(c) === 'c';
  if (rule === 'goad') return suitOf(c) === 's';
  if (rule === 'head') return suitOf(c) === 'h';
  if (rule === 'window') return suitOf(c) === 'd';
  if (rule === 'plant') return isFace(c);
  return false;
}
function build(): Ctx {
  const rule = blind().rule;
  const jokers = activeJokers();
  const pcs = (boardCards() as Card[]).filter((c) => isPC(c.key));
  const off = new Set(pcs.filter((c) => debuffed(c, rule)));
  const live = pcs.filter((c) => !off.has(c));
  const bh = bestHand(live, { four: jokers.some((j) => j.key === 'jk_fourfinger'), smear: jokers.some((j) => j.key === 'jk_smeared') });
  const hand = handVal(bh.id);
  if (rule === 'arm') {
    hand.lv = Math.max(1, hand.lv - 1);
    const h = HANDS[HI[bh.id]];
    hand.chips = h.c + (hand.lv - 1) * h.lc;
    hand.mult = h.m + (hand.lv - 1) * h.lm;
  }
  if (rule === 'flint') {
    hand.chips = Math.ceil(hand.chips / 2);
    hand.mult = Math.max(1, Math.ceil(hand.mult / 2));
  }
  const scoring = new Set(jokers.some((j) => j.key === 'jk_splash') ? live : bh.scoring);
  const held = G.cards.filter((c) => c.loc === 'stash' && isPC(c.key));
  return { hand, scoring, off, jokers, cap: jokerCap(), pcs, held };
}
export function ctx(): Ctx {
  if (inBattle() && bt().flags.dlCtx) return bt().flags.dlCtx as Ctx;
  const k = sig();
  if (k !== CK || !CV) {
    CV = build();
    CK = k;
  }
  if (inBattle()) bt().flags.dlCtx = CV;
  return CV;
}
/** 小丑实际照着谁的效果来（蓝图、头脑风暴） / whose effect a joker actually uses (Blueprint, Brainstorm) */
function effOf(j: Card, x: Ctx, depth = 0): JDef | null {
  if (depth > 4) return null;
  if (j.key === 'jk_blueprint' || j.key === 'jk_brainstorm') {
    const i = x.jokers.indexOf(j);
    const t = j.key === 'jk_blueprint' ? x.jokers[i + 1] : x.jokers[0];
    return t && t !== j ? effOf(t, x, depth + 1) : null;
  }
  return JK[j.key] || null;
}
const jkOff = (j: Card) => inBattle() && ((bt().flags.jkOff as Record<number, number>) || {})[j.id] > bt().t;
/** 一张计分的牌这一下：筹码、倍率、×倍率 / one scoring hit: chips, mult, ×mult */
function score(pc: Card, x: Ctx) {
  let chips = x.hand.chips;
  let mult = x.hand.mult + mv('dl_mult');
  let xm = 1 + mv('dl_obs');
  const add = (e: Eff | void) => {
    if (!e) return;
    chips += e.chips || 0;
    mult += e.mult || 0;
    if (e.x) xm *= e.x;
  };
  /* 牌自己的增强和版本 / the card's own enhancement and edition */
  const en = pc.mk?.en;
  if (en === 'bonus') chips += 30;
  if (en === 'mult') mult += 4;
  if (en === 'glass') xm *= 2;
  if (en === 'lucky') mult += inBattle() ? (rand() < 0.2 ? 20 : 0) : 4;
  const ed = pc.mk?.ed;
  if (ed === 'foil') chips += 50;
  if (ed === 'holo') mult += 10;
  if (ed === 'poly') xm *= 1.5;
  /* 背包里的钢铁牌 / steel cards held in the bag */
  for (const h of x.held) if (h.mk?.en === 'steel') xm *= 1.5;
  /* 小丑 / jokers */
  for (const j of x.jokers) {
    if (jkOff(j)) continue;
    const d = effOf(j, x);
    if (d) {
      const s = SC(j);
      add(d.g?.(j, x, s));
      add(d.p?.(j, pc, x, s));
    }
    if (j.mk?.ed === 'foil') chips += 50;
    if (j.mk?.ed === 'holo') mult += 10;
    if (j.mk?.ed === 'poly') xm *= 1.5;
  }
  if (blind().rule === 'psychic' && x.scoring.size < 5) xm *= 0.5;
  return { chips, mult: Math.max(1, mult), x: xm };
}

/* ================================================================ 杂项 / Misc */
function gold(n: number, x = world.W / 2, y = world.H - 20) {
  if (!n) return;
  G.gold += n;
  if (B) {
    view.coins(x, y, n);
    view.hud();
  }
}
function lose(j: Card, why: string) {
  const i = G.cards.indexOf(j);
  if (i >= 0) G.cards.splice(i, 1);
  if (B) view.toast(why);
}
const EN_N: Record<string, [string, string]> = {
  bonus: ['筹', '奖励牌：+30 筹码'], mult: ['倍', '倍率牌：+4 倍率'], glass: ['玻', '玻璃牌：倍率 ×2；每守住一夜有 1/4 的机会碎掉'],
  steel: ['钢', '钢铁牌：放在背包里，所有计分的牌倍率 ×1.5'], gold: ['金', '黄金牌：放在背包里，每守住一夜 +3 金'], lucky: ['运', '幸运牌：每一下 1/5 的机会倍率 +20'],
  wild: ['万', '万能牌：算任何花色'],
};
const ED_N: Record<string, [string, string]> = {
  foil: ['箔', '闪箔：+50 筹码'], holo: ['镭', '镭射：+10 倍率'], poly: ['彩', '多彩：倍率 ×1.5'], neg: ['负', '负片：不占小丑栏'],
};
function rollEd(joker: boolean) {
  const k = 1 + mv('dl_hone');
  const r = rand();
  if (r < 0.04 * k) return 'foil';
  if (r < 0.068 * k) return 'holo';
  if (r < 0.074 * k) return 'poly';
  if (joker && r < 0.077 * k) return 'neg';
  return '';
}
const ENS = ['bonus', 'mult', 'glass', 'steel', 'gold', 'lucky', 'wild'];
const ED_PRICE: Record<string, number> = { foil: 2, holo: 3, poly: 5, neg: 5 };

/* ================================================================ 事件里用到的 / Event helpers */
const pcsOwned = () => G.cards.filter((c) => isPC(c.key)).sort((a, b) => (a.loc === b.loc ? a.idx - b.idx : a.loc === 'board' ? -1 : 1));
const jkFilter = (it: ItemDef) => !!it.passive;
const pcFilter = (it: ItemDef) => it.kind === 'weapon' && !it.passive;
function pickCard(cur: any, api: Api, hint: string, list: Card[], sub: (c: Card) => string, apply: (c: Card) => void) {
  if (!list.length) {
    api.toast('没有能用的牌');
    api.finishStep();
    return;
  }
  api.choice(cur, hint, shuffled(list).slice(0, 4).map((c) => ({ card: c, label: ITEMS[c.key].n, sub: sub(c), act: () => { apply(c); api.repaint(c); api.afterMerge(); api.renderOwned(); api.finishStep(); } })));
  api.renderPrep();
}
/** 塔罗牌 / tarot cards */
const TAROTS: { id: string; n: string; d: string; ok?: () => boolean; go: (cur: any, api: Api) => void }[] = [
  { id: 'magician', n: '魔术师', d: '一张牌变成幸运牌', go: (cur, api) => pickCard(cur, api, '挑一张变成幸运牌。', pcsOwned(), () => '幸运牌：1/5 的机会倍率 +20', (c) => ((c.mk ||= {}).en = 'lucky')) },
  { id: 'empress', n: '女皇', d: '一张牌变成倍率牌', go: (cur, api) => pickCard(cur, api, '挑一张变成倍率牌。', pcsOwned(), () => '倍率牌：+4 倍率', (c) => ((c.mk ||= {}).en = 'mult')) },
  { id: 'hierophant', n: '教皇', d: '一张牌变成奖励牌', go: (cur, api) => pickCard(cur, api, '挑一张变成奖励牌。', pcsOwned(), () => '奖励牌：+30 筹码', (c) => ((c.mk ||= {}).en = 'bonus')) },
  { id: 'lovers', n: '恋人', d: '一张牌变成万能牌', go: (cur, api) => pickCard(cur, api, '挑一张变成万能牌。', pcsOwned(), () => '万能牌：算任何花色', (c) => ((c.mk ||= {}).en = 'wild')) },
  { id: 'chariot', n: '战车', d: '一张牌变成钢铁牌', go: (cur, api) => pickCard(cur, api, '挑一张变成钢铁牌（放背包里才生效）。', pcsOwned(), () => '钢铁牌：放背包里，计分的牌 ×1.5', (c) => ((c.mk ||= {}).en = 'steel')) },
  { id: 'justice', n: '正义', d: '一张牌变成玻璃牌', go: (cur, api) => pickCard(cur, api, '挑一张变成玻璃牌。', pcsOwned(), () => '玻璃牌：×2，可能碎', (c) => ((c.mk ||= {}).en = 'glass')) },
  { id: 'devil', n: '恶魔', d: '一张牌变成黄金牌', go: (cur, api) => pickCard(cur, api, '挑一张变成黄金牌（放背包里才生效）。', pcsOwned(), () => '黄金牌：放背包里，每夜 +3 金', (c) => ((c.mk ||= {}).en = 'gold')) },
  { id: 'strength', n: '力量', d: '一张牌点数 +1', go: (cur, api) => pickCard(cur, api, '挑一张，点数 +1。', pcsOwned(), (c) => `${ITEMS[c.key].n} → ${ITEMS[pcKey(suitOf(c), rankOf(c) === 14 ? 2 : rankOf(c) + 1)].n}`, (c) => (c.key = pcKey(suitOf(c), rankOf(c) === 14 ? 2 : rankOf(c) + 1))) },
  { id: 'star', n: '星星', d: '一张牌变成方片', go: (cur, api) => pickCard(cur, api, '挑一张变成方片。', pcsOwned().filter((c) => suitOf(c) !== 'd'), (c) => `→ ${ITEMS[pcKey('d', rankOf(c))].n}`, (c) => (c.key = pcKey('d', rankOf(c)))) },
  { id: 'moon', n: '月亮', d: '一张牌变成梅花', go: (cur, api) => pickCard(cur, api, '挑一张变成梅花。', pcsOwned().filter((c) => suitOf(c) !== 'c'), (c) => `→ ${ITEMS[pcKey('c', rankOf(c))].n}`, (c) => (c.key = pcKey('c', rankOf(c)))) },
  { id: 'sun', n: '太阳', d: '一张牌变成红桃', go: (cur, api) => pickCard(cur, api, '挑一张变成红桃。', pcsOwned().filter((c) => suitOf(c) !== 'h'), (c) => `→ ${ITEMS[pcKey('h', rankOf(c))].n}`, (c) => (c.key = pcKey('h', rankOf(c)))) },
  { id: 'world', n: '世界', d: '一张牌变成黑桃', go: (cur, api) => pickCard(cur, api, '挑一张变成黑桃。', pcsOwned().filter((c) => suitOf(c) !== 's'), (c) => `→ ${ITEMS[pcKey('s', rankOf(c))].n}`, (c) => (c.key = pcKey('s', rankOf(c)))) },
  { id: 'hanged', n: '倒吊人', d: '毁掉一张牌', ok: () => pcsOwned().length > 2, go: (cur, api) => {
    const list = pcsOwned();
    api.choice(cur, '挑一张毁掉。', shuffled(list).slice(0, 4).map((c) => ({ card: c, label: `毁掉${ITEMS[c.key].n}`, sub: isFace(c) ? '人头牌（卡尼奥会记住）' : '', act: () => {
      if (isFace(c)) ws().faceGone = ((ws().faceGone as number) || 0) + 1;
      api.removeCard(c);
      api.renderOwned();
      api.finishStep();
    } })));
    api.renderPrep();
  } },
  { id: 'priestess', n: '女祭司', d: '现在的牌型升 1 级，再随机升一个', go: (_cur, api) => {
    const h = ctx().hand.id;
    lvUp(h);
    const o = pick(HANDS.slice(0, 9).map((x) => x.id).filter((i) => i !== h));
    lvUp(o);
    ws().planets = ((ws().planets as number) || 0) + 2;
    api.toast(`${HANDS[HI[h]].n}、${HANDS[HI[o]].n} 各升 1 级`);
    api.finishStep();
  } },
  { id: 'hermit', n: '隐者', d: '金币翻倍（最多 +20）', ok: () => G.gold > 0, go: (_cur, api) => { api.gainGold(Math.min(20, purse())); api.finishStep(); } },
  { id: 'temperance', n: '节制', d: '拿到所有小丑的卖价（最多 20 金）', ok: () => jokersOwned().length > 0, go: (_cur, api) => { api.gainGold(Math.min(20, jokersOwned().reduce((s, j) => s + sellValue(j), 0))); api.finishStep(); } },
  { id: 'wheel', n: '命运之轮', d: '1/4 的机会：随机一张小丑加上闪箔、镭射或多彩', ok: () => jokersOwned().some((j) => !j.mk?.ed), go: (cur, api) => {
    const j = pick(jokersOwned().filter((x) => !x.mk?.ed));
    if (rand() < 0.25) {
      (j.mk ||= {}).ed = pick(['foil', 'holo', 'poly']);
      api.repaint(j);
      api.reward(cur, `【${ITEMS[j.key].n}】变成了${ED_N[j.mk.ed][1].split('：')[0]}！`, () => {});
    } else api.reward(cur, '不行！（Nope!）', () => {});
    api.renderPrep();
  } },
  { id: 'judgement', n: '审判', d: '随机得到一张小丑', go: (_cur, api) => { const of = api.makeOffer(jkFilter, { free: 1 }); if (!api.addCard(of.card.key, of.card.tier, null, of.card.mk)) api.toast('没地方放了'); api.finishStep(); } },
];

/* ================================================================ 模组 / The pack */
const pack: ModPack = {
  id: 'midnight-deal',
  name: '小丑牌',
  author: '守夜人工坊',
  version: '2.0.0',
  desc: '同人模组。扑克牌凑牌型，小丑放背包，筹码×倍率；敌人血量跟着底注分数一路涨上去。',
  sprites: {
    ...sprites,
    dl_guard: { from: 'skel', swap: { w: 'g', n: 'k', g: 'd' } },
  },

  mods: {
    handLv: { n: '所有牌型等级', show: 0 },
    debt: { n: '最多可以赊账（金）', show: 0 },
    dl_mult: { n: '计分的牌倍率', show: 0 },
    dl_jslot: { n: '小丑栏', show: 0 },
    dl_obs: { n: '计分的牌倍率 ×', show: 1 },
    dl_plasma: { n: '筹码和倍率对半分' },
    dl_plasmaX: { n: '等离子再乘', show: 1 },
    dl_hone: { n: '闪箔、镭射、多彩出现的机会', show: 1 },
    dl_hiero: { n: '敌人血量', show: 1, inv: 1 },
  },

  worlds: {
    deal: {
      n: '小丑牌',
      d: '城外支起一张牌桌。每一夜是一个盲注，打过第八个底注，天就亮了。',
      foeSet: 'deal',
      base: { cards: false },
      noEvents: ['spring', 'job', 'refugee', 'pilgrim', 'train', 'smith', 'forge', 'storm', 'frostshop', 'apothecary', 'armory'],
      firstDoors: ['dl_standard', 'shop', 'dl_buffoon'],
      rename: {
        events: {
          shop: { n: '商店', f: '一个小摊，小丑和扑克牌混着卖。' },
          field: { n: '弃牌堆', f: '桌底下扔着几张别人不要的牌。' },
          gamble: { n: '骰盅' },
          bank: { n: '兑换处' },
        },
        relics: {
          gem_red: { n: '红色蜡封', ico: 'gem:R' },
          gem_blue: { n: '蓝色蜡封', ico: 'gem:c' },
          gem_green: { n: '金色蜡封', ico: 'gem:Y' },
        },
      },
      story: worldStory,
      hp: (type) => {
        const bl = blind();
        let m = hpMul();
        if (bl.rule === 'wall') m *= 1.6;
        if (G.hero === 'dk_plasma') m *= 1.7;
        if (type === 'dl_vessel') m *= 1.8;
        return m * (1 - mv('dl_hiero'));
      },
      mods: () => {
        const out: Record<string, number> = {};
        for (const j of activeJokers()) for (const [k, n] of Object.entries(JK[j.key]?.mods || {})) out[k] = (out[k] || 0) + n;
        return out;
      },
      offer: (of: Offer) => {
        const k = of.card.key;
        if (isJK(k) || isPC(k)) {
          const ed = rollEd(isJK(k));
          if (ed) {
            of.card.mk = { ...(of.card.mk || {}), ed };
            if (of.price) of.price += ED_PRICE[ed];
          }
        }
        if (isPC(k) && rand() < 0.15) of.card.mk = { ...(of.card.mk || {}), en: pick(ENS) };
      },
      badge: (c: CardSpec | Card) => {
        let h = '';
        const ed = c.mk?.ed;
        if (ed) h += `<div class="ov ${ed}"></div><div class="mk ${ed}" title="${ED_N[ed][1]}">${ED_N[ed][0]}</div>`;
        const en = c.mk?.en;
        if (en) h += `<div class="mk en" title="${EN_N[en][1]}">${EN_N[en][0]}</div>`;
        if (!G.cards.includes(c as Card)) return h;
        const x = ctx();
        if (isPC(c.key) && (c as Card).loc === 'board') {
          if (x.off.has(c as Card)) h += '<div class="mk off" title="被首领盲削弱：不计分">削</div>';
          else if (x.scoring.has(c as Card)) h += `<div class="sc" title="计分：${x.hand.n}"></div>`;
        }
        if (isJK(c.key) && !x.jokers.includes(c as Card)) h += '<div class="mk off" title="小丑栏满了：这张不生效">满</div>';
        return h;
      },
      num: (c) => {
        if (!isJK(c.key)) return;
        const d = JK[c.key];
        const x = ctx();
        const e = effOf(c, x);
        if ((c.key === 'jk_blueprint' || c.key === 'jk_brainstorm') && e?.num) return '抄' + e.num(c, x, SC(c));
        return d?.num ? d.num(c, x, SC(c)) : '';
      },
      hooks: {
        start: () => {
          const b = bt();
          b.flags.dlCtx = null;
          CK = '';
          const x = ctx();
          const bl = blind();
          const pl = (ws().played ||= {});
          pl[x.hand.id] = (pl[x.hand.id] || 0) + 1;
          b.flags.jkOff = {};
          const tag = bl.rule ? ' · ' + RULES[bl.rule].n : '';
          later(1.2, () => view.banner(`底注 ${G.round} · ${bl.n}${tag} · ${x.hand.n} Lv${x.hand.lv}：${fmt(x.hand.chips)} 筹码 × ${fmt(x.hand.mult)} 倍率`, '#fee761'));
          if (bl.rule === 'hook') hookTick();
          if (bl.rule === 'wheel') wheelTick();
          if (bl.rule === 'needle') later(0.5, () => damageWall(3, world.W / 2));
          if (bl.rule === 'manacle') freeze(boardCards().at(-1) as Card | undefined, 15);
          if (bl.rule === 'house') for (const c of boardCards()) freeze(c as Card, 4);
        },
        /* 打中一下：原石 / a hit lands: Rough Gem */
        hit: (x) => {
          const c = x.src as Card | undefined;
          if (!c || !isPC(c.key) || !hasJoker('jk_rough') || suitOf(c) !== 'd') return;
          const b = bt();
          if ((b.flags.roughN || 0) >= 5 || rand() > 0.08) return;
          b.flags.roughN = (b.flags.roughN || 0) + 1;
          gold(1, c.ox || world.W / 2, world.H - 30);
        },
        /* 守住一夜：结盲注钱，小丑成长，玻璃碎，黄金牌给钱 / a held night: blind pay, joker growth, glass breaks, gold cards pay */
        end: (o) => {
          if (o.result !== 'win' || o.b.ambush) return;
          const bl = blind();
          G.gold += bl.pay;
          const x = ctx();
          for (const j of activeJokers()) {
            const d = effOf(j, x);
            d?.end?.(j, x, SC(j));
          }
          for (const c of x.held) if (c.mk?.en === 'gold') G.gold += 3;
          for (const c of [...x.scoring]) if (c.mk?.en === 'glass' && rand() < 0.25) lose(c, `【${ITEMS[c.key].n}】碎了`);
        },
      },
      stat: (c, it) => {
        if (!isPC(c.key) || !(it.dmg > 0) || !G.cards.includes(c as Card)) return;
        const x = ctx();
        if (!x.scoring.has(c as Card)) return;
        const base = it.dmg * UPS[it.up].d[stepOf(c as Card)] + ((c as Card).grow || 0);
        const r = score(c as Card, x);
        let chips = base + r.chips;
        let mult = r.mult;
        /* 等离子：筹码和倍率先加起来对半分 / Plasma: chips and mult are summed and split evenly */
        if (mv('dl_plasma')) {
          const a = (chips + mult) / 2;
          chips = a * (1 + mv('dl_plasmaX'));
          mult = a;
        }
        const xs: [string, number][] = [['倍率', mult]];
        if (r.x !== 1) xs.push(['×倍率', r.x]);
        return { flat: chips - base, xs };
      },
      night: () => {
        const bl = blind();
        if (bl.kind === 'boss' && G.round !== 9 && ws().ruleFor !== G.round) {
          ws().rule = pick(Object.keys(RULES).filter((k) => (RULES[k].from ?? 0) <= G.round));
          ws().ruleFor = G.round;
        }
      },
      note: () => {
        const bl = blind();
        const x = ctx();
        const top = [...x.scoring].map((c) => {
          const it = ITEMS[c.key];
          const r = score(c, x);
          const base = it.dmg * UPS[it.up].d[stepOf(c)] + (c.grow || 0);
          return mv('dl_plasma') ? Math.pow((base + r.chips + r.mult) / 2, 2) * (1 + mv('dl_plasmaX')) * r.x : (base + r.chips) * r.mult * r.x;
        });
        const best = top.length ? Math.max(...top) : 0;
        return `<b>底注 ${G.round} · ${bl.n}</b>（最低分数 ${fmt(300 * anteOf(G.round))}，赢了 +${bl.pay} 金）${bl.rule ? ` · <b>${RULES[bl.rule].n}</b>：${RULES[bl.rule].d}` : ''}<br>牌型：<b>${x.hand.n} Lv${x.hand.lv}</b> ${fmt(x.hand.chips)} 筹码 × ${fmt(x.hand.mult)} 倍率 · 计分 ${x.scoring.size} 张 · 一下最高 <b>${fmt(best)}</b> · 小丑 ${x.jokers.filter((j) => j.mk?.ed !== 'neg').length}/${x.cap}${G.gold < 0 ? ` · <b>欠着 ${-G.gold} 金</b>` : ''}`;
      },
    },
  },

  /* ---------------- 卡牌：52 张扑克牌和小丑 ---------------- / ---------------- Cards: 52 playing cards and jokers ---------------- */
  cards: { ...playingCards(), ...jokerCards() },

  /* ---------------- 遗物：优惠券和首领盲之后挑的规则 ---------------- / ---------------- Relics: vouchers and post-boss rules ---------------- */
  relics: {
    dl_v_clearance: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { tax: -1 }, n: '清仓大甩卖', f: '优惠券。店里每样东西便宜 1 金。' },
    dl_v_hone: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { dl_hone: 1 }, n: '磨砺', f: '优惠券。闪箔、镭射、多彩出现的机会翻倍。' },
    dl_v_seed: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { interest: 3 }, n: '种子基金', f: '优惠券。利息上限 +3。' },
    dl_v_grabber: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { wall: 8 }, n: '抓取器', f: '优惠券。多一手牌——城墙上限 +8。' },
    dl_v_telescope: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { handLv: 1 }, n: '望远镜', f: '优惠券。所有牌型 +1 级。' },
    dl_v_overstock: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { dl_mult: 3 }, n: '库存过剩', f: '优惠券。计分的牌倍率 +3。' },
    dl_sixes: { t: 0, ico: 'dice', world: W, m: { crit: 0.08 }, n: '五颗六', f: '五颗骰子，全是六点朝上。' },
    dl_cards: { t: 1, ico: 'book:R', world: W, m: { handLv: 1 }, n: '整副牌', f: '五十二张，一张不少。' },
    dl_chipstack: { t: 0, ico: 'r_purse', world: W, m: { winGold: 2 }, n: '一摞筹码', f: '每赢一局，它就高一截。' },
    /* 规则遗物：第 2、6 夜后三选一 / rule relics: a pick of three after nights 2 and 6 */
    dl_r_antimatter: { t: 2, ico: 'orb:p', world: W, rule: 1, m: { dl_jslot: 1, enemySpd: 0.08 }, n: '反物质', f: '多一个小丑栏。外面的东西也更急了。' },
    dl_r_hiero: { t: 2, ico: 'scroll:Y', world: W, rule: 1, m: { dl_hiero: 0.25, wall: -8 }, n: '象形文字', f: '底注往回退一格：敌人血量 -25%，可你的墙也薄了。' },
    dl_r_obs: { t: 2, ico: 'orb:c', world: W, rule: 1, m: { dl_obs: 0.5, winGold: -3 }, n: '天文台', f: '计分的牌倍率 ×1.5。星星很贵。' },
    dl_r_credit: { t: 2, ico: 'badge:c', world: W, rule: 1, m: { debt: 25, interest: -3 }, n: '透支', f: '能多欠 25 金。利息就别想了。' },
  },

  talents: {
    dl_t_bluff: { cat: 'atk', r: 0, world: W, m: { critDmg: 0.15 }, n: '诈唬', say: '手里没牌的时候，下注要更大。' },
    dl_t_fold: { cat: 'def', r: 0, world: W, m: { shieldStart: 6 }, n: '弃牌', say: '知道什么时候不跟，才活得长。' },
    dl_t_count: { cat: 'tech', r: 1, world: W, m: { handLv: 1 }, n: '记牌', say: '每一张出过的牌，都记着。' },
    dl_t_tip: { cat: 'eco', r: 0, world: W, m: { winGold: 1 }, n: '小费', say: '给吉姆博一点小费。他会记得你。' },
  },

  intents: {
    /** 琥珀橡果：把你的小丑全翻过去，5 秒不生效 / Amber Acorn: flips all your jokers face down for 5 s */
    dl_flip: () => {
      const b = bt();
      const off = (b.flags.jkOff ||= {}) as Record<number, number>;
      for (const j of jokersOwned()) off[j.id] = b.t + 5;
      view.banner('小丑全翻过去了', '#ef7d57');
    },
    /** 绯红之心：随机一张小丑 6 秒不生效 / Crimson Heart: a random joker is disabled for 6 s */
    dl_numb: () => {
      const b = bt();
      const j = pick(activeJokers());
      if (!j) return;
      ((b.flags.jkOff ||= {}) as Record<number, number>)[j.id] = b.t + 6;
      view.toast(`【${ITEMS[j.key].n}】不动了`);
    },
  },

  enemies: {
    dl_chip: { hp: 10, spd: 0.055, armor: 0, wall: 1, spr: 'dl_chip', sc: 1, col: '#e43b44', faction: 'swamp', world: W, n: '筹码', tip: '滚过来的筹码。一枚不值钱，一摞就值了。' },
    dl_card: { hp: 6, spd: 0.1, armor: 0, wall: 1, spr: 'dl_card', sc: 1, zig: 1, col: '#f4f4f4', faction: 'wing', world: W, n: '飞牌', tip: '长了翅膀的牌，飞得又快又歪。' },
    dl_spade: { hp: 20, spd: 0.045, armor: 2, wall: 2, spr: 'dl_spade', sc: 1, col: '#333c57', faction: 'dead', world: W, n: '黑桃兵', tip: '扛着矛的黑桃牌，一排一排地走。' },
    dl_dice: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'dl_dice', sc: 1, split: 2, splitInto: 'dl_pip', col: '#f4f4f4', faction: 'swamp', world: W, n: '骰子', tip: '出场掷一次：点数越大越肉。打碎了掉出点子。' },
    dl_pip: { hp: 5, spd: 0.08, armor: 0, wall: 1, spr: 'dl_pip', sc: 1, small: 1, col: '#f4f4f4', faction: 'swamp', world: W, n: '点子' },
    dl_steel: { hp: 110, spd: 0.028, armor: 4, wall: 5, spr: 'dl_steel', sc: 1, col: '#94b0c2', faction: 'war', world: W, n: '钢铁牌', tip: '每隔一会儿绷紧一下，绷紧的时候硬得很。' },
    dl_stone: { hp: 44, spd: 0.035, armor: 4, wall: 2, spr: 'dl_stone', sc: 1, guard: 3, aura: 30, col: '#c28a4d', faction: 'dead', world: W, n: '石头牌', tip: '没有点数也没有花色，就是硬。给身边的敌人加护甲。' },
    dl_lucky: { hp: 26, spd: 0.04, armor: 0, wall: 2, spr: 'dl_lucky', sc: 1, heal: 0.12, aura: 34, col: '#38b764', faction: 'cult', world: W, n: '幸运牌', tip: '运气好，给身边的敌人回血。先打它。' },
    dl_multc: { hp: 26, spd: 0.045, armor: 0, wall: 2, spr: 'dl_multc', sc: 1, haste: 0.35, aura: 34, col: '#e43b44', faction: 'war', world: W, n: '倍率牌', tip: '身边的都跑得更快。' },
    dl_bonusc: { hp: 14, spd: 0.06, armor: 0, wall: 1, spr: 'dl_bonusc', sc: 1, col: '#41a6f6', faction: 'swamp', world: W, n: '奖励牌', tip: '鱼带来的小东西。' },
    dl_glass: { hp: 10, spd: 0.085, armor: 0, wall: 3, spr: 'dl_glass', sc: 1, bomb: 0.45, col: '#73eff7', faction: 'war', world: W, n: '玻璃牌', tip: '碎的时候扎一片。' },
    dl_wildc: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'dl_wildc', sc: 1, phase: 1, col: '#fee761', faction: 'dead', world: W, n: '万能牌', tip: '什么花色都是，什么花色都不是。虚着的时候打不着。' },
    dl_death: { hp: 34, spd: 0.03, armor: 0, wall: 3, spr: 'dl_death', sc: 1, raise: 2, raiseAs: 'dl_spade', col: '#a64ca6', faction: 'cult', world: W, n: '死神', tip: '塔罗牌「死神」：把倒下的牌翻过来，变成黑桃兵。' },
    dl_pack: { hp: 240, spd: 0.02, armor: 3, wall: 8, spr: 'dl_pack', sc: 1, cargo: ['dl_card', 6], col: '#e43b44', faction: 'war', world: W, n: '小丑包', tip: '一大包牌。拆开了全飞出来。' },
    dl_misprintc: { hp: 50, spd: 0.04, armor: 1, wall: 3, spr: 'dl_misprintc', sc: 1, rage: 1.8, col: '#a64ca6', faction: 'war', world: W, n: '印错的牌', tip: '越疼跑得越快。' },
    dl_pluto: { hp: 70, spd: 0.03, armor: 2, wall: 3, spr: 'dl_pluto', sc: 1, stopAt: 0.3, lob: [4.5, 1], col: '#c28a4d', faction: 'war', world: W, n: '冥王星', tip: '站在远处往墙上砸陨石。' },
    dl_goldc: { hp: 60, spd: 0.028, armor: 1, wall: 3, spr: 'dl_goldc', spr2: 'dl_goldc2', sc: 1, mimic: 3, col: '#fee761', faction: 'swamp', world: W, n: '黄金牌', tip: '一张金牌。挨了打就张嘴跑——打死它有钱。' },
    /* 精英：首领盲注 / elites: boss blinds */
    dl_hook: { hp: 240, spd: 0.028, armor: 2, wall: 8, spr: 'dl_b_hook', sc: 1, elite: 1, col: '#e43b44', faction: 'war', world: W, n: '钩子',
      tip: '首领盲注。把你的卡钩住，充能一下子没了。',
      intents: [{ t: 6, a: 'drain', v: 0.5, n: '钩走', d: '你的卡充能-50%' }, { t: 8, a: 'summon', v: 4, k: 'dl_chip', n: '撒筹码', d: '招来筹码' }] },
    dl_wallb: { hp: 400, spd: 0.02, armor: 6, wall: 10, spr: 'dl_b_wall', sc: 1, elite: 1, col: '#a64ca6', faction: 'war', world: W, n: '墙',
      tip: '首领盲注。血特别厚。',
      intents: [{ t: 7, a: 'harden', n: '砌墙', d: '护甲+10' }, { t: 9, a: 'shield', n: '加厚', d: '护盾' }] },
    dl_fish: { hp: 170, spd: 0.025, armor: 0, wall: 8, spr: 'dl_b_fish', sc: 1, elite: 1, col: '#41a6f6', faction: 'swamp', world: W, n: '鱼',
      tip: '首领盲注。一群一群地往外吐小东西。',
      intents: [{ t: 7, a: 'skels', v: 4, k: 'dl_bonusc', n: '吐泡泡', d: '招来4张奖励牌' }, { t: 8, a: 'shield', n: '鳞片', d: '护盾' }] },
    /* 第 4 夜：牙齿 / night 4: the Tooth */
    dl_tooth: { hp: 900, spd: 0.022, armor: 3, wall: 12, spr: 'dl_b_tooth', sc: 1, elite: 1, fixed: 1, col: '#e43b44', faction: 'cult', world: W, n: '牙齿',
      tip: '首领盲注。每隔一会儿咬走你兜里的钱。',
      intents: [{ t: 5, a: 'pilfer', v: 2, n: '咬', d: '偷走2金' }, { t: 7, a: 'shield', n: '咬紧', d: '护盾' }, { t: 8, a: 'skels', v: 3, k: 'dl_spade', n: '发牌', d: '招来黑桃兵' }] },
    /* 决胜首领盲 / finisher boss blinds */
    dl_acorn: { final: 1, boss: 1, fixed: 1, hp: 10500, spd: 0.012, armor: 2, wall: 99, spr: 'dl_acorn', sc: 1, col: '#ef7d57', faction: 'abyss', world: W, n: '琥珀橡果',
      tip: '决胜首领盲。时不时把你的小丑全翻过去，几秒内一张都不生效。',
      intents: [{ t: 7, a: 'dl_flip', n: '翻面', d: '小丑 5 秒不生效' }, { t: 6, a: 'summon', v: 5, k: 'dl_chip', n: '撒筹码', d: '招来筹码' }] },
    dl_leaf: { final: 1, boss: 1, fixed: 1, hp: 10500, spd: 0.011, armor: 1, wall: 99, spr: 'dl_leaf', sc: 1, col: '#38b764', faction: 'abyss', world: W, n: '翠绿之叶',
      tip: '决胜首领盲。它掉血到四分之三之前，你所有的牌都被削弱：只打自己的筹码。',
      intents: [{ t: 7, a: 'brood', v: 4, k: 'dl_lucky', n: '长叶', d: '招来幸运牌' }, { t: 9, a: 'knell', v: 0.12, n: '叶脉', d: '所有敌人加护盾' }] },
    dl_vessel: { final: 1, boss: 1, fixed: 1, hp: 10000, spd: 0.009, armor: 1, wall: 99, spr: 'dl_vessel', sc: 1, col: '#a64ca6', faction: 'abyss', world: W, n: '紫罗兰之瓶',
      tip: '决胜首领盲。超级大的盲注：血特别特别厚。',
      intents: [{ t: 7, a: 'knell', v: 0.15, n: '釉光', d: '所有敌人加护盾' }, { t: 8, a: 'brood', v: 5, k: 'dl_chip', n: '倒出筹码', d: '倒出5枚筹码' }] },
    dl_crimson: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.011, armor: 2, wall: 99, spr: 'dl_crimson', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '绯红之心',
      tip: '决胜首领盲。每隔一会儿让你一张小丑不动了。',
      intents: [{ t: 6, a: 'dl_numb', n: '心跳', d: '一张小丑 6 秒不生效' }, { t: 8, a: 'invert', v: 5, n: '反转', d: '最多的元素伤害-30%' }, { t: 9, a: 'summon', v: 5, k: 'dl_card', n: '飞牌', d: '招来飞牌' }] },
    dl_bell: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.011, armor: 2, wall: 99, spr: 'dl_bell', sc: 1, col: '#41a6f6', faction: 'abyss', world: W, n: '蔚蓝之铃',
      tip: '决胜首领盲。铃一响，伤害最高的那张卡被钉住。',
      intents: [{ t: 7, a: 'duel', v: 5, n: '钉住', d: '伤害最高的卡5秒动不了' }, { t: 8, a: 'wind', v: 4, n: '摇铃', d: '小怪快一半' }] },
    /* 隐藏首领：底注 39 的 naneinf / hidden boss: naneinf at ante 39 */
    dl_naneinf: { hidden: 'dk_red', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'dl_naneinf', sc: 1, col: '#c58cff', faction: 'abyss', world: W, n: 'naneinf',
      tip: '底注第 39 关。分数大到算不过来，屏幕上只剩这一串字。每秒最多掉 3% 的血。',
      intents: [{ t: 6, a: 'dl_flip', n: '溢出', d: '小丑 5 秒不生效' }, { t: 8, a: 'barrage', v: 6, n: 'NaN', d: '往墙上砸6下' }, { t: 9, a: 'summon', v: 5, k: 'dl_wildc', n: 'inf', d: '招来万能牌' }] },
    dl_naneinf2: { hidden: 'dk_plasma', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'dl_naneinf', sc: 1, col: '#c58cff', faction: 'abyss', world: W, n: 'naneinf',
      tip: '底注第 39 关。分数大到算不过来，屏幕上只剩这一串字。每秒最多掉 3% 的血。',
      intents: [{ t: 6, a: 'dl_flip', n: '溢出', d: '小丑 5 秒不生效' }, { t: 8, a: 'barrage', v: 6, n: 'NaN', d: '往墙上砸6下' }, { t: 9, a: 'summon', v: 5, k: 'dl_wildc', n: 'inf', d: '招来万能牌' }] },
  },

  foesets: {
    deal: {
      n: '牌桌上的东西', world: W,
      map: {
        slime: 'dl_chip', bat: 'dl_card', skel: 'dl_spade', bug: 'dl_dice', mini: 'dl_pip', golem: 'dl_steel', shieldb: 'dl_stone',
        shaman: 'dl_lucky', drummer: 'dl_multc', bomber: 'dl_glass', ghost: 'dl_wildc', necro: 'dl_death', siege: 'dl_pack',
        berserker: 'dl_misprintc', catapult: 'dl_pluto', mimic: 'dl_goldc', a_brute: 'dl_hook', a_golem: 'dl_wallb', a_lich: 'dl_fish', knight: 'dl_tooth',
      },
    },
  },

  voices: {
    jimbo: { img: 'p_jimbo', c: '#e43b44', n: '吉姆博' },
  },

  events: {
    /* 天体包：三颗星球挑一颗，升牌型 / Celestial Pack: pick one of three planets to level a hand */
    dl_celestial: {
      ico: 'dl_ev_planet', cat: 'up', w: 3, rar: 0, world: W, n: '天体包', f: '一包星球牌。每颗星对着一种牌型。',
      enter: (cur, api) => {
        const now = ctx().hand.id;
        const seen = Object.keys(ws().played || {});
        const pool = HANDS.filter((h, i) => i < 9 || seen.includes(h.id)).map((h) => h.id).filter((i) => i !== now);
        const ids = [now, ...shuffled(pool).slice(0, 2)];
        api.choice(cur, '挑一颗星球。', ids.map((id) => {
          const a = handVal(id);
          const h = HANDS[HI[id]];
          return {
            ico: 'dl_ev_planet', label: `${h.p} · ${h.n}${id === now ? '（现在凑的）' : ''}`, sub: `Lv${a.lv} → Lv${a.lv + 1}：${a.chips} → ${a.chips + h.lc} 筹码，${a.mult} → ${a.mult + h.lm} 倍率`,
            act: () => {
              lvUp(id);
              ws().planets = ((ws().planets as number) || 0) + 1;
              api.toast(`${h.n} 升到 Lv${lvOf(id)}`);
              api.SFX.play('merge');
              api.finishStep();
            },
          };
        }));
      },
    },
    /* 秘术包：三张塔罗挑一张 / Arcana Pack: pick one of three tarots */
    dl_arcana: {
      ico: 'dl_ev_tarot', cat: 'misc', w: 2.5, rar: 0, world: W, n: '秘术包', f: '一包塔罗牌，牌面上的画都在动。',
      enter: (cur, api) => {
        const opts = shuffled(TAROTS.filter((t) => (t.ok ? t.ok() : pcsOwned().length > 0))).slice(0, 3);
        const last = TAROTS.find((t) => t.id === ws().lastTarot);
        const fool = last && (last.ok ? last.ok() : true) ? [{ ico: 'dl_ev_tarot', label: '愚者', sub: `再用一次上回那张：${last.n}`, act: () => last.go(cur, api) }] : [];
        api.choice(cur, '挑一张。', [
          ...opts.map((t) => ({ ico: 'dl_ev_tarot', label: t.n, sub: t.d, act: () => { ws().lastTarot = t.id; t.go(cur, api); } })),
          ...(rand() < 0.3 ? fool : []),
        ]);
      },
    },
    /* 幻灵包：两张幻灵牌挑一张，力量大，代价也大 / Spectral Pack: pick one of two spectrals — strong, with a price */
    dl_spectral: {
      ico: 'dl_ev_spectral', cat: 'rare', w: 0.9, rar: 1, minR: 3, world: W, n: '幻灵包', f: '一包发着蓝光的牌。摸上去是凉的。',
      enter: (cur, api) => {
        const all = [
          { ico: 'dl_ev_planet', label: '黑洞', sub: '所有牌型 +1 级', ok: true, act: () => { for (const h of HANDS) lvUp(h.id); ws().planets = ((ws().planets as number) || 0) + 1; api.finishStep(); } },
          { ico: 'jk_triboulet', label: '灵魂', sub: '一张传说小丑', ok: true, act: () => {
            const k = pick(['jk_triboulet', 'jk_chicot', 'jk_canio']);
            if (!api.addCard(k, 2)) api.toast('没地方放了');
            api.finishStep();
          } },
          { ico: 'dl_ev_spectral', label: '光环', sub: '一张扑克牌加上闪箔、镭射或多彩', ok: pcsOwned().some((c) => !c.mk?.ed), act: () => pickCard(cur, api, '挑一张。', pcsOwned().filter((c) => !c.mk?.ed), () => '随机一种版本', (c) => ((c.mk ||= {}).ed = pick(['foil', 'holo', 'poly']))) },
          { ico: 'dl_ev_spectral', label: '灵质', sub: '随机一张小丑变成负片（不占小丑栏），城墙上限 -4', ok: jokersOwned().some((j) => !j.mk?.ed), act: () => {
            const j = pick(jokersOwned().filter((x) => !x.mk?.ed));
            (j.mk ||= {}).ed = 'neg';
            api.maxWall(-4);
            api.repaint(j);
            api.renderOwned();
            api.finishStep();
          } },
          { ico: 'dl_ev_spectral', label: '咒语', sub: '随机一张小丑变多彩，其余小丑全毁掉', ok: jokersOwned().length >= 2, act: () => {
            const keep = pick(jokersOwned());
            (keep.mk ||= {}).ed = 'poly';
            for (const j of jokersOwned()) if (j !== keep) api.removeCard(j);
            api.repaint(keep);
            api.renderOwned();
            api.finishStep();
          } },
          { ico: 'dl_ev_spectral', label: '火祭', sub: '随机毁掉 3 张扑克牌，+20 金', ok: pcsOwned().length >= 5, act: () => {
            for (const c of shuffled(pcsOwned()).slice(0, 3)) {
              if (isFace(c)) ws().faceGone = ((ws().faceGone as number) || 0) + 1;
              api.removeCard(c);
            }
            api.gainGold(20);
            api.renderOwned();
            api.finishStep();
          } },
        ].filter((o) => o.ok);
        api.choice(cur, '“这些牌……别随便用。”吉姆博压低了声音。', shuffled(all).slice(0, 2));
      },
    },
    /* 小丑包：花 4 金，两张小丑挑一张 / Buffoon Pack: 4 gold, pick one of two jokers */
    dl_buffoon: {
      ico: 'dl_ev_buffoon', cat: 'shop', w: 2.5, rar: 0, world: W, n: '小丑包', f: '一包小丑牌，包装上印着吉姆博的脸。',
      enter: (cur, api) => {
        const price = G.round === 1 ? 0 : 4;
        const open = () => {
          Object.assign(cur, { mode: 'pick', offers: [0, 1].map(() => api.makeOffer(jkFilter, { free: 1 })) });
          api.renderPrep();
        };
        if (!price) return open();
        api.choice(cur, `“小丑包，${price} 金。”`, [
          { ico: 'dl_ev_buffoon', label: '买', sub: `${price} 金，两张小丑挑一张`, act: () => {
            if (G.gold + mv('debt') < price) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= price;
            api.updateHUD();
            open();
          } },
          { ico: 'boot:g', label: '不买', sub: '下回吧', act: () => api.finishStep() },
        ]);
      },
    },
    /* 标准包：三张扑克牌挑一张（有的带增强和版本） / Standard Pack: pick one of three playing cards (some enhanced) */
    dl_standard: {
      ico: 'dl_ev_standard', cat: 'free', w: 2.5, rar: 0, world: W, n: '标准包', f: '一包普通的扑克牌。普通吗？',
      enter: (cur, api) => {
        const offers = [0, 1, 2].map(() => {
          const of = api.makeOffer(pcFilter, { free: 1 });
          if (rand() < 0.3) of.card.mk = { ...(of.card.mk || {}), en: pick(ENS) };
          return of;
        });
        Object.assign(cur, { mode: 'pick', offers });
        api.renderPrep();
      },
    },
    /* 优惠券：两张挑一张买 / vouchers: buy one of two */
    dl_voucher: {
      ico: 'dl_ev_voucher', cat: 'shop', w: 1, rar: 1, minR: 2, world: W, n: '优惠券', f: '吉姆博从柜台底下摸出两张券，弹了弹上面的灰。',
      need: () => G.gold + mv('debt') >= 10 && VOUCHERS.some((k) => !G.relics.includes(k)),
      enter: (cur, api) => {
        const price = 10;
        const two = shuffled(VOUCHERS.filter((k) => !G.relics.includes(k))).slice(0, 2);
        api.choice(cur, `“一张 ${price} 金，永久有效。”`, [
          ...two.map((k) => ({ ico: 'dl_ev_voucher', label: pack.relics![k].n, sub: `${price} 金 · ${pack.relics![k].f}`, act: () => {
            if (G.gold + mv('debt') < price) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= price;
            api.gainRelic(k);
          } })),
          { ico: 'boot:g', label: '不买', sub: '下回吧', act: () => api.finishStep() },
        ]);
      },
    },
  },

  heroes: {
    dk_red: {
      def: {
        world: W, col: '#e43b44', portrait: 'p_deck_red', wall: 30, gold: 8, start: [],
        n: '红色牌组', title: '最普通的那副牌', tag: '擅长凑牌型和花色', desc: '原作的第一副牌。凑牌型、凑花色，小丑一张一张叠上去。计分的牌倍率一直多 +4。',
        intro: '一副红色背面的牌，从吉姆博袖子里滑了出来。',
      },
      sig: { n: '多一次弃牌', d: '计分的牌倍率 +4。', m: { dl_mult: 4 } },
      awaken: [
        { id: 'dk_red_a', n: '反物质', d: '小丑栏 +1', m: { dl_jslot: 1 } },
        { id: 'dk_red_b', n: '望远镜', d: '所有牌型 +2 级', m: { handLv: 2 } },
      ],
      kits: [
        { cards: [['pc_hk', 0], ['pc_sk', 0], ['pc_c7', 0], ['pc_d4', 0], ['jk_jolly', 0]], path: 'hand', n: '一对 K', d: '一对 K 和两张散牌，再加一张开心小丑。' },
        { cards: [['pc_hq', 0], ['pc_dq', 0], ['pc_h9', 0], ['pc_h5', 0], ['jk_lusty', 0]], path: 'suit', n: '红色的一对 Q', d: '一对 Q 和两张红桃，色欲小丑盯着红桃。' },
      ],
      paths: [
        { id: 'hand', mast: 0, cards: ['jk_jolly', 'jk_zany', 'jk_mad', 'jk_crazy', 'jk_droll', 'jk_duo', 'jk_trio', 'jk_order', 'jk_tribe', 'jk_family'], n: '牌型', d: '凑大牌型，乘上去' },
        { id: 'suit', mast: 1, cards: ['jk_greedy', 'jk_lusty', 'jk_wrath', 'jk_glutton', 'jk_arrow', 'jk_onyx', 'jk_blood', 'jk_rough', 'jk_smeared', 'jk_fourfinger'], n: '花色', d: '一个花色凑到底' },
      ],
      story: redStory,
    },
    dk_plasma: {
      def: {
        world: W, col: '#a64ca6', portrait: 'p_deck_plasma', wall: 30, gold: 10, start: [],
        n: '等离子牌组', title: '筹码和倍率搅在一起', tag: '擅长平衡筹码和倍率', desc: '原作的高难牌组。计分时筹码和倍率先加起来对半分，再相乘——两边差得越多，赚得越多。代价：敌人血量 ×1.5。',
        intro: '牌背上的紫色漩涡在转。筹码和倍率被搅成了一样多。',
      },
      sig: { n: '平衡', d: '计分时筹码和倍率先加起来对半分再相乘（比如 90 筹码 × 10 倍率 → 50 × 50）。敌人血量 ×1.5。', m: { dl_plasma: 1 } },
      awaken: [
        { id: 'dk_plasma_a', n: '完美平衡', d: '对半分之后再 ×1.25', m: { dl_plasmaX: 0.25 } },
        { id: 'dk_plasma_b', n: '反物质', d: '小丑栏 +1', m: { dl_jslot: 1 } },
      ],
      kits: [
        { cards: [['pc_sj', 0], ['pc_cj', 0], ['pc_s9', 0], ['pc_c3', 0], ['jk_scary', 0]], path: 'chips', n: '一对 J', d: '黑色的一对 J 和两张散牌，恐怖脸给人头牌加筹码。' },
        { cards: [['pc_d8', 0], ['pc_h8', 0], ['pc_c5', 0], ['pc_s2', 0], ['jk_gros', 0]], path: 'xmult', n: '一对 8 和香蕉', d: '一对 8 和两张散牌。大麦克香蕉：倍率 +15，不知道哪天就灭绝了。' },
      ],
      paths: [
        { id: 'chips', mast: 0, cards: ['jk_sly', 'jk_wily', 'jk_clever', 'jk_scary', 'jk_odd', 'jk_icecream', 'jk_blue', 'jk_bull', 'jk_hiker'], n: '筹码', d: '筹码堆高，对半分给倍率' },
        { id: 'xmult', mast: 1, cards: ['jk_gros', 'jk_photo', 'jk_hologram', 'jk_constellation', 'jk_stencil', 'jk_blackboard', 'jk_baron'], n: '乘倍', d: '×倍率一层层乘上去' },
      ],
      story: plasmaStory,
    },
  },

  hooks: {
    enemies: {
      /* 骰子：出场掷一次，点数越大越肉 / dice: roll on spawn; more pips, more HP */
      dl_dice: {
        spawn: (e) => {
          const n = 1 + Math.floor(rand() * 6);
          e.hp = e.maxHp = e.maxHp * (0.5 + n / 6);
        },
      },
      /* 钢铁牌：每 5 秒绷紧一次 / steel card: tenses up every 5 s */
      dl_steel: {
        spawn: (e) => (M(e).t = 2 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          m.t -= dt;
          if (m.t > 0) return;
          m.t = 5;
          e.hardT = 2;
        },
      },
      /* 黄金牌：打死了掉钱 / gold card: drops gold when killed */
      dl_goldc: { die: (e) => gold(2, ex(e), ey(e)) },
      /* 翠绿之叶：掉到 3/4 血之前，你的牌只打自己的筹码 / Verdant Leaf: until it drops to 3/4 HP, your cards hit with their own chips only */
      dl_leaf: {
        spawn: () => {
          const b = bt();
          b.flags.leaf = 1;
          later(1.5, () => view.banner('所有牌都被削弱了', '#38b764'));
        },
        hurt: (e, a) => {
          const b = bt();
          if (b.flags.leaf && e.hp - a < e.maxHp * 0.75) {
            b.flags.leaf = 0;
            b.flags.dlCtx = null;
            view.banner('叶子落了：牌恢复了', '#a7f070');
          }
          return a;
        },
      },
      dl_naneinf: { hurt: (e, a) => capHurt(e, a) },
      dl_naneinf2: { hurt: (e, a) => capHurt(e, a) },
    },
  },
};

const VOUCHERS = ['dl_v_clearance', 'dl_v_hone', 'dl_v_seed', 'dl_v_grabber', 'dl_v_telescope', 'dl_v_overstock'];

/* 翠绿之叶在场时，所有牌只打自己的筹码 / with the Verdant Leaf on the field, every card hits with its own chips only */
const baseStat = pack.worlds!.deal.stat!;
pack.worlds!.deal.stat = (c, it) => (inBattle() && bt().flags.leaf ? undefined : baseStat(c, it));

function freeze(c: Card | undefined, t: number) {
  if (!c) return;
  c.frozen = Math.max(c.frozen, t);
  view.cardFlag(c, 'frozen', true);
}
function hookTick() {
  later(7, () => {
    if (!B || B.over) return;
    for (const c of shuffled(boardCards().filter((o) => o.frozen <= 0)).slice(0, 2)) {
      c.charge = 0;
      view.cardFx(c, 'shake');
    }
    view.toast('钩子：充能被钩走了');
    hookTick();
  });
}
function wheelTick() {
  later(6, () => {
    if (!B || B.over) return;
    freeze(pick(boardCards() as Card[]), 3);
    wheelTick();
  });
}
/** naneinf：每秒最多掉 3% 的血 / naneinf: at most 3% HP lost per second */
function capHurt(e: Enemy, a: number) {
  const m = M(e);
  const t = bt().t;
  if (t - (m.w0 ?? -9) >= 1) {
    m.w0 = t;
    m.got = 0;
  }
  const left = e.maxHp * 0.03 - m.got;
  if (left <= 0) {
    if (rand() < 0.2) view.num(ex(e), ey(e) - 16, 'NaN', '#c58cff', 1);
    return 0;
  }
  const d = Math.min(a, left);
  m.got += d;
  return d;
}

export default pack;
