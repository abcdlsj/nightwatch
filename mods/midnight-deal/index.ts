/* 子夜牌局：长夜里，城外支起一张牌桌。坐庄的那位说，赢够了，天就还给你们。
 * 这个世界每一夜是一局盲注（小盲、大盲、首领盲轮着来，首领盲带一条怪规矩）；
 * 棋盘上的卡按元素凑【牌型】（对子、顺子、同花……），牌型给所有输出卡加筹码和倍率，星宿能把牌型升级。
 * 两个新人物：丑角（凑牌型、鬼牌、杂耍连击）和账房（赊账、金币越多打得越疼、复利成长）。
 * 剧情文字在 story.ts，像素图由 art.py 生成到 sprites.ts。
 * Midnight Deal: in the long night a card table goes up outside the wall. The one dealing says: win enough, and the dawn is yours.
 * Every night here is a blind (small, big and boss blinds in turn; a boss blind brings an odd rule). The board's cards form a 【poker hand】 by element
 * (pair, straight, flush…), which gives every damage card chips and mult; planets level hands up.
 * Two new heroes: the Jester (hands, wild cards, juggling multi-hits) and the Bookkeeper (credit, gold-scaled damage, compound growth).
 * Story text is in story.ts; sprites are generated into sprites.ts by art.py.
 */
import type { ModPack, ModEvent } from '../../src/mod/types';
import type { Enemy } from '../../src/sim/types';
import type { Tag } from '../../src/data/types';
import { G } from '../../src/game/state';
import { ITEMS, UPS } from '../../src/data/cards';
import { mv } from '../../src/game/mods';
import { boardCards, stepOf, growCard } from '../../src/game/cards';
import { B, bt, later } from '../../src/sim/battle';
import { chargeCard } from '../../src/sim/combat';
import { damageWall, INTENTS } from '../../src/sim/enemies';
import { view } from '../../src/sim/view';
import { world, ex, ey } from '../../src/sim/world';
import { rand, pick, shuffled } from '../../src/core/rng';
import { ws } from '../../src/game/world';
import sprites from './sprites';
import { worldStory, jesterStory, clerkStory } from './story';

const W = 'deal';
const inBattle = () => !!B && !B.over && G.phase === 'battle';
const M = (e: Enemy) => (e.m ||= {});
const unit = () => 1 + Math.floor(G.round / 4);
type Api = Parameters<ModEvent['enter']>[1];

/* ---------------- 牌型 ---------------- / ---------------- Poker hands ---------------- */
/** c 筹码（给每张输出卡加的固定伤害，夜越深越多），x 倍率（独立乘区多出来的那截） / c chips (flat damage per damage card, growing with the night), x mult (the extra part of an independent multiplier) */
export const HANDS = [
  { id: 'high', n: '高牌', c: 0, x: 0, d: '什么都没凑成' },
  { id: 'pair', n: '对子', c: 2, x: 0.05, d: '两张同元素的卡' },
  { id: 'two', n: '两对', c: 3, x: 0.1, d: '两种元素各两张' },
  { id: 'three', n: '三条', c: 4, x: 0.15, d: '三张同元素' },
  { id: 'straight', n: '顺子', c: 5, x: 0.2, d: '四种不同的元素' },
  { id: 'full', n: '葫芦', c: 6, x: 0.25, d: '三张同元素，再加另一种两张' },
  { id: 'four', n: '四条', c: 7, x: 0.3, d: '四张同元素' },
  { id: 'flush', n: '同花', c: 8, x: 0.4, d: '五张同元素' },
  { id: 'sflush', n: '同花顺', c: 12, x: 0.6, d: '五张同元素，而且小、中、大三种尺寸都有' },
];
const HI = Object.fromEntries(HANDS.map((h, i) => [h.id, i]));
/** 鬼牌：算牌型时可以当任何元素 / wild cards: count as any element for hands */
const WILD = ['dl_grin', 'dl_wild'];
const TAGS: Tag[] = ['blade', 'fire', 'ice', 'volt', 'mech', 'poison'];

function handOf(counts: Record<string, number>, sizes: Set<number>) {
  const v = Object.values(counts).filter((n) => n > 0).sort((a, b) => b - a);
  const [a = 0, b = 0] = v;
  const need = 5 - mv('flushEase');
  if (a >= need && sizes.has(1) && sizes.has(2) && sizes.has(3)) return 'sflush';
  if (a >= need) return 'flush';
  if (a >= 4) return 'four';
  if (a >= 3 && b >= 2) return 'full';
  if (v.length >= 4) return 'straight';
  if (a >= 3) return 'three';
  if (a >= 2 && b >= 2) return 'two';
  if (a >= 2) return 'pair';
  return 'high';
}
/** 这块棋盘凑成的最大牌型（鬼牌试遍所有元素） / the best hand this board makes (wild cards try every element) */
export function bestHand(cards = boardCards()) {
  const counts: Record<string, number> = {};
  const sizes = new Set<number>();
  let wild = 0;
  for (const c of cards) {
    if (ITEMS[c.key].noPool && ITEMS[c.key].noSell) continue;
    sizes.add(c.size);
    if (WILD.includes(c.key)) wild++;
    else counts[ITEMS[c.key].tag] = (counts[ITEMS[c.key].tag] || 0) + 1;
  }
  let best = 'high';
  const go = (left: number) => {
    if (!left) {
      const h = handOf(counts, sizes);
      if (HI[h] > HI[best]) best = h;
      return;
    }
    for (const t of TAGS) {
      counts[t] = (counts[t] || 0) + 1;
      go(left - 1);
      counts[t]--;
    }
  };
  go(Math.min(3, wild));
  return best;
}
const lvOf = (id: string) => ((ws().lv || {})[id] || 1) + mv('handLv');
/** 牌型的数值：筹码、倍率 / a hand's numbers: chips and mult */
export function handVal(id: string) {
  const h = HANDS[HI[id]];
  const lv = lvOf(id);
  return { id, n: h.n, lv, chips: Math.round((h.c + (lv - 1) * 1.5) * unit()), x: 1 + (h.x + (lv - 1) * 0.05) * (1 + mv('handMul')) };
}
/** 现在生效的牌型（战斗里开战时定下来；首领盲「闭眼」时不生效） / the hand in effect (fixed at battle start; off under the boss blind 'Blindfold') */
function curHand() {
  if (blind().rule === 'eye') return handVal('high');
  if (inBattle() && bt().flags.hand) return bt().flags.hand as ReturnType<typeof handVal>;
  return handVal(bestHand());
}

/* ---------------- 盲注 ---------------- / ---------------- Blinds ---------------- */
const RULES: Record<string, { n: string; d: string }> = {
  hook: { n: '钩子', d: '每 7 秒，随机两张卡的充能被钩走' },
  wall: { n: '大墙', d: '所有伤害 -20%' },
  eye: { n: '闭眼', d: '这一夜牌型不算' },
  mouth: { n: '挑嘴', d: '只认一种元素：棋盘上最多那种以外的卡，伤害 -40%' },
  manacle: { n: '手铐', d: '最右边那张卡，开战后 15 秒才能动' },
  needle: { n: '针', d: '开战时城墙 -3' },
};
function blind() {
  const r = ((G.round - 1) % 3) + 1;
  const kind = r === 3 ? 'boss' : r === 2 ? 'big' : 'small';
  return { kind, n: { small: '小盲', big: '大盲', boss: '首领盲' }[kind], pay: { small: 1, big: 2, boss: 4 }[kind], rule: kind === 'boss' ? (ws().rule as string) || 'hook' : '' };
}
function mainTag() {
  const n: Record<string, number> = {};
  for (const c of boardCards()) if (ITEMS[c.key].dmg > 0) n[ITEMS[c.key].tag] = (n[ITEMS[c.key].tag] || 0) + 1;
  return Object.keys(n).sort((a, z) => n[z] - n[a])[0];
}
function hookTick() {
  later(7, () => {
    if (!B || B.over) return;
    const bc = shuffled(boardCards().filter((c) => c.frozen <= 0)).slice(0, 2);
    for (const c of bc) {
      c.charge = 0;
      view.cardFx(c, 'shake');
    }
    view.toast('钩子：充能被钩走了');
    hookTick();
  });
}

/* ---------------- 金币 ---------------- / ---------------- Gold ---------------- */
function coin(n: number, x = world.W / 2, y = world.H - 20) {
  G.gold += n;
  view.coins(x, y, n);
  view.hud();
}

/* ---------------- 事件里用到的 ---------------- / ---------------- Event helpers ---------------- */
const heroCards = (t: number) => Object.keys(ITEMS).filter((k) => ITEMS[k].hero === G.hero && ITEMS[k].t === t && !ITEMS[k].noPool);
function lvUp(id: string, api: Api, n = 1) {
  const lv = (ws().lv ||= {});
  lv[id] = (lv[id] || 1) + n;
  api.toast(`${HANDS[HI[id]].n} 升到 Lv${lvOf(id)}`);
  api.SFX.play('merge');
}

const pack: ModPack = {
  id: 'midnight-deal',
  name: '子夜牌局',
  author: '守夜人工坊',
  version: '1.0.0',
  desc: '城外支起一张牌桌，每一夜都是一局盲注。凑牌型、升星宿、赊账、翻倍——赢够了，天就还给你。',
  sprites: {
    ...sprites,
    dl_guard: { from: 'skel', swap: { w: 'g', n: 'k', g: 'd' } },
    dl_bouncer: { from: 'shieldb', swap: { c: 'd', Y: 'R' } },
    dl_waiter: { from: 'shaman', swap: { t: 'w', G: 'g', l: 'R' } },
    dl_band: { from: 'drummer', swap: { G: 'P', R: 'Y' } },
    dl_cigar: { from: 'bomber', swap: { g: 'n', n: 'R' } },
    dl_bluff: { from: 'ghost', swap: { C: 'P', b: 'p' } },
    dl_croupier: { from: 'necro', swap: { p: 'G', P: 'l' } },
    dl_cart: { from: 'siege', swap: { n: 'R', N: 'o', x: 'r' } },
    dl_loser: { from: 'berserker', swap: { R: 'y', r: 'N' } },
    dl_thrower: { from: 'catapult', swap: { n: 'G', x: 't' } },
    dl_jackchest: { from: 'chest_m', swap: { n: 'G', N: 'l' } },
    dl_jackpot: { from: 'mimic', swap: { n: 'G', N: 'l', R: 'Y' } },
    dl_e_bully: { from: 'e_brute', swap: { R: 'd', r: 'k' } },
    dl_e_vault: { from: 'e_golem', swap: { N: 'Y', n: 'y' } },
    dl_e_magic: { from: 'e_lich', swap: { P: 'R', p: 'r' } },
    dl_b_dealer: { from: 'b_knight', swap: { P: 'G', p: 't' } },
  },

  mods: {
    handMul: { n: '牌型的倍率', show: 1 },
    handLv: { n: '所有牌型等级', show: 0 },
    flushEase: { n: '同花、同花顺少要一张' },
    debt: { n: '最多可以赊账（金）', show: 0 },
  },

  worlds: {
    deal: {
      n: '子夜牌局',
      d: '城外支起一张牌桌，每一夜都是一局盲注。',
      foeSet: 'deal',
      noEvents: ['spring', 'job', 'refugee', 'pilgrim'],
      firstDoors: ['dl_planet', 'shop', 'field'],
      rename: {
        events: {
          shop: { n: '牌桌小卖部', f: '老荷官兼着卖东西。他说，赢的钱要在这儿花掉才算数。' },
          field: { n: '没人要的牌', f: '桌底下扔着几张别人不要的牌。' },
          gamble: { n: '骰盅' },
          bank: { n: '兑换处' },
        },
        relics: {
          gem_red: { n: '红封印', ico: 'gem:R' },
          gem_blue: { n: '蓝封印', ico: 'gem:c' },
          gem_green: { n: '金封印', ico: 'gem:Y' },
        },
      },
      story: worldStory,
      hooks: {
        start: () => {
          const b = bt();
          const bl = blind();
          const h = bl.rule === 'eye' ? handVal('high') : handVal(bestHand());
          b.flags.hand = h;
          later(1.2, () => view.banner(`${bl.n}${bl.rule ? ' · ' + RULES[bl.rule].n : ''} · ${h.n} Lv${h.lv}  筹码+${h.chips} ×${h.x.toFixed(2)}`, '#fee761'));
          if (bl.rule === 'hook') hookTick();
          if (bl.rule === 'needle') later(0.5, () => damageWall(3, world.W / 2));
          if (bl.rule === 'manacle') {
            const c = boardCards().at(-1);
            if (c) {
              c.frozen = 15;
              view.cardFlag(c, 'frozen', true);
            }
          }
          if (bl.rule === 'mouth') b.flags.mouth = mainTag();
          /* 砸钱：开战时花 3 金 / Big Spender: spends 3 gold at battle start */
          if (boardCards().some((c) => c.key === 'dl_bigspender') && G.gold >= 3) {
            G.gold -= 3;
            b.flags.spent = 1;
            view.hud();
          }
        },
        /* 赢下一局盲注：结一笔盲注钱 / winning a blind pays out */
        end: (x) => {
          if (x.result !== 'win' || x.b.ambush) return;
          const bl = blind();
          G.gold += bl.pay;
          ws().cash = (ws().cash || 0) + bl.pay;
        },
      },
      stat: (c, it) => {
        if (!(it.dmg > 0)) return;
        const h = curHand();
        const xs: [string, number][] = [];
        if (h.x > 1) xs.push([`牌型·${h.n}`, h.x]);
        const bl = blind();
        if (bl.rule === 'wall') xs.push(['盲注·大墙', 0.8]);
        if (bl.rule === 'mouth' && inBattle() && bt().flags.mouth && it.tag !== bt().flags.mouth) xs.push(['盲注·挑嘴', 0.6]);
        return { flat: h.chips, xs };
      },
      night: () => {
        const bl = blind();
        if (bl.kind === 'boss' && ws().ruleFor !== G.round) {
          ws().rule = pick(Object.keys(RULES));
          ws().ruleFor = G.round;
        }
        /* 高利贷：每到新的一夜给钱，城墙上限 -1 / Loan Shark: gold each new night, wall max -1 */
        if (G.round > 1)
          for (const c of G.cards.filter((o) => o.key === 'dl_usury')) {
            G.gold += 4 + 2 * stepOf(c);
            G.wallMax = Math.max(5, G.wallMax - 1);
            G.wall = Math.min(G.wall, G.wallMax);
          }
      },
      note: () => {
        const bl = blind();
        const h = handVal(bestHand());
        return `<b>${bl.n}</b>（赢了 +${bl.pay} 金）${bl.rule ? ` · <b>${RULES[bl.rule].n}</b>：${RULES[bl.rule].d}` : ''}<br>牌型：<b>${h.n} Lv${h.lv}</b> 筹码+${h.chips} ×${h.x.toFixed(2)}${G.gold < 0 ? ` · <b>欠着 ${-G.gold} 金</b>` : ''}`;
      },
    },
  },

  /* ---------------- 卡牌 ---------------- / ---------------- Cards ---------------- */
  cards: {
    /* 丑角 · 同花 */
    dl_juggle: { size: 1, tag: 'fire', t: 0, up: 'dmg', cd: 1.3, dmg: 5, fx: 'spark', burn: 2, kind: 'lamp', hero: 'choujue',
      n: '抛火球', d: '把一颗火球抛过去，点燃目标。', f: '三颗球，两只手。总有一颗在天上。' },
    dl_grin: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 2.5, dmg: 0, fx: 'none', charge: 0.25, kind: 'gadget', hero: 'choujue', local: 1,
      n: '鬼脸', d: '【鬼牌】：算牌型时当任何元素。触发时相邻的卡充能。', f: '它笑起来的时候，你分不清它是哪一边的。' },
    dl_flushjoker: { size: 2, tag: 'fire', t: 1, up: 'mix', cd: 2.4, dmg: 14, fx: 'fslash', burn: 4, kind: 'weapon', hero: 'choujue', local: 1,
      n: '同花小丑', d: '牌型是同花或同花顺时，伤害 ×1.5。', f: '一手红桃。他说，红色最好看。' },
    dl_whip: { size: 2, tag: 'fire', t: 1, up: 'dmg', cd: 2.6, dmg: 16, fx: 'flame', aoe: 18, burn: 3, per: { tag: 'fire', pct: 0.1 }, kind: 'firearm', hero: 'choujue',
      n: '火圈鞭', d: '甩出一道火圈。棋盘上每有一张别的【火】卡，伤害 +10%。', f: '狮子不来，老虎不来。来的是塔……不，是牌桌上的东西。' },
    dl_finale: { size: 3, tag: 'fire', t: 2, up: 'mix', cd: 4.4, dmg: 40, fx: 'meteor', aoe: 30, burn: 6, kind: 'sky', hero: 'choujue', local: 1,
      n: '压轴', d: '牌型每高一档，伤害 +15%。', f: '最后一个节目。演完了，灯就灭。' },
    /* 丑角 · 杂耍 */
    dl_pins: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.1, dmg: 4, fx: 'knife', boomer: 0.5, kind: 'weapon', hero: 'choujue',
      n: '杂耍棒', d: '扔出去会飞回来，再打一个。', f: '扔出去三根，接回来四根。多的那根是谁的？' },
    dl_twitch: { size: 1, tag: 'volt', t: 0, up: 'mix', cd: 1.6, dmg: 5, fx: 'bolt', chain: 2, onChain: 0.5, kind: 'sky', hero: 'choujue',
      n: '抽搐小丑', d: '闪电弹两下。被别的卡带动出手时，伤害 +50%。', f: '他一紧张就抽。他一直很紧张。' },
    dl_mirror: { size: 1, tag: 'mech', t: 1, up: 'cd', cd: 3, dmg: 0, fx: 'none', horn: 1, kind: 'gadget', hero: 'choujue',
      n: '镜子戏法', d: '让左右相邻的卡立刻再出手一次。', f: '镜子里那个，比你快半拍。' },
    dl_double: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.6, dmg: 10, multi: 2, lastCrit: 1, fx: 'slash', kind: 'weapon', hero: 'choujue',
      n: '翻倍小丑', d: '砍两下，第二下必定暴击。', f: '赢了翻倍，输了也翻倍。' },
    dl_curtain: { size: 2, tag: 'volt', t: 2, up: 'mix', cd: 3.6, dmg: 24, fx: 'discharge', chain: 4, per: { elem: 1, pct: 0.12 }, kind: 'sky', hero: 'choujue',
      n: '谢幕', d: '一道大闪电。棋盘上每有一种元素，伤害 +12%。', f: '鞠躬，再鞠躬。台下没有人，只有牌。' },
    /* 账房 · 金钱 */
    dl_abacus: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 1.2, dmg: 5, fx: 'rock', kind: 'gadget', hero: 'zhangfang', local: 1,
      n: '算盘珠', d: '弹一颗算盘珠。身上每有 10 金，伤害 +1（最多 +10，夜越深越多）。', f: '一颗珠子一个数。数错了，就弹出去。' },
    dl_piggy: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, kind: 'gadget', hero: 'zhangfang', local: 1,
      n: '存钱罐', d: '每守住一夜，往里存 1 金（品质越高存得越多）。卖掉时连本带利拿出来。', f: '摇一摇，听得见响。' },
    dl_goldabacus: { size: 2, tag: 'volt', t: 1, up: 'mix', cd: 2.6, dmg: 16, fx: 'bolt', chain: 2, kind: 'sky', hero: 'zhangfang', local: 1,
      n: '金算盘', d: '身上每有 1 金，伤害 +1%（最多 +60%）。', f: '金子做的珠子，拨起来叮当响，像下雨。' },
    dl_moneyhammer: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.8, dmg: 22, fx: 'axe', kind: 'weapon', hero: 'zhangfang', local: 1,
      n: '钱袋锤', d: '用它打死的敌人，25% 掉 1 金。', f: '一袋铜钱，抡圆了，比锤子还沉。' },
    dl_bigspender: { size: 3, tag: 'fire', t: 2, up: 'dmg', cd: 4, dmg: 46, fx: 'meteor', aoe: 30, burn: 5, kind: 'sky', hero: 'zhangfang', local: 1,
      n: '砸钱', d: '开战时花 3 金（不够就不花）；花了，本场伤害 ×1.6。', f: '钱砸下去，响声是一样的。' },
    /* 账房 · 复利 */
    dl_compound: { size: 1, tag: 'blade', t: 1, up: 'dmg', cd: 1.4, dmg: 5, fx: 'knife', grow: 1, kind: 'weapon', hero: 'zhangfang', local: 1,
      n: '复利', d: '【成长】每守住一夜，基础伤害再涨 10%（利滚利）。', f: '本金不动，利息生利息。' },
    dl_iou: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 3, dmg: 0, fx: 'none', kind: 'gadget', hero: 'zhangfang', local: 1,
      n: '欠条', d: '相邻的卡充能 20%；身上欠着钱的时候，充能 40%。', f: '欠条压在算盘底下。压得越久，越沉。' },
    dl_collector: { size: 2, tag: 'poison', t: 1, up: 'dmg', cd: 2.4, dmg: 8, fx: 'sting', poison: 6, perPoisoned: 0.05, kind: 'potion', hero: 'zhangfang',
      n: '讨债人', d: '让目标中毒。射程内每有一个中毒的敌人，伤害 +5%。', f: '他不急。他知道你跑不掉。' },
    dl_usury: { size: 2, tag: 'mech', t: 2, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, kind: 'gadget', hero: 'zhangfang', local: 1,
      n: '高利贷', d: '每到新的一夜，给你 4 金（品质越高越多），城墙上限 -1。', f: '借的时候是钱，还的时候是砖。' },
    dl_mint: { size: 3, tag: 'mech', t: 2, up: 'cd', cd: 5, dmg: 0, fx: 'none', kind: 'gadget', hero: 'zhangfang', local: 1, chargeAll: 0.12,
      n: '印钞机', d: '所有卡充能 12%，再印 1 金（每场最多 6 金）。', f: '咔哒，咔哒。印出来的钱上，印着庄的脸。' },
    /* 通用 */
    dl_wild: { size: 1, tag: 'mech', t: 1, up: 'cd', cd: 2.2, dmg: 0, fx: 'none', buff: 0.3, kind: 'gadget', world: W,
      n: '百搭', d: '【鬼牌】：算牌型时当任何元素。相邻的卡下一下伤害 +30%。', f: '一张空白的牌。你说它是什么，它就是什么。' },
    dl_luckydie: { size: 1, tag: 'mech', t: 0, up: 'mix', cd: 1.4, dmg: 6, fx: 'rock', kind: 'gadget', world: W,
      n: '幸运骰', d: '每扔一次，下一次的伤害随机 +0%~150%。', f: '六面都是六。你不信？扔扔看。' },
  },

  relics: {
    dl_sixes: { t: 0, ico: 'dice', world: W, m: { crit: 0.08 }, n: '五颗六', f: '五颗骰子，全是六点朝上。谁也不知道它们是怎么停成这样的。' },
    dl_deck: { t: 1, ico: 'book:R', world: W, m: { handLv: 1 }, n: '整副牌', f: '五十四张，一张不少。连鬼牌都在。' },
    dl_rocket: { t: 0, ico: 'r_flag', world: W, m: { winGold: 2 }, n: '火箭', f: '每赢一局，它就往上蹿一截。' },
    dl_credit: { t: 1, ico: 'badge:c', world: W, m: { debt: 15 }, n: '信用卡', f: '一张薄薄的卡片，背面写着：先花，以后再说。' },
    dl_ace: { t: 2, ico: 'badge:R', world: W, m: { handMul: 0.3 }, n: '缺角的王牌', f: '角被谁咬掉了一块。牙印还在。' },
    dl_oldpoker: { t: 1, ico: 'book:g', world: W, m: { flushEase: 1 }, n: '老扑克', f: '旧得发软，花色都磨淡了。凑同花反倒容易。' },
    dl_coupon: { t: 1, ico: 'dl_ev_voucher', world: W, noPool: 1, m: { tax: -1 }, n: '优惠券', f: '永久有效。最下面一行小字：庄保留最终解释权。' },
    dl_cuff: { t: 0, ico: 'ring:y', hero: 'choujue', m: { handMul: 0.15 }, n: '铃铛袖口', f: '他一抬手就响。响的时候，牌就换了。' },
    dl_ledger: { t: 0, ico: 'book:N', hero: 'zhangfang', m: { interest: 2 }, n: '旧账本', f: '前一任账房记的，最后一页写着一个数字，后面跟了很多个零。' },
    /* 规则遗物 */
    dl_r_high: { t: 2, ico: 'dice', world: W, rule: 1, m: { xdmg: 0.2, enemySpd: 0.1 }, n: '豪赌', f: '押上去。全押。' },
    dl_r_cheap: { t: 2, ico: 'r_purse', world: W, rule: 1, m: { tax: -1, winGold: -2 }, n: '打折卡', f: '买得便宜，赢得也少。' },
    dl_r_blank: { t: 2, ico: 'scroll:w', world: W, rule: 1, m: { interest: 4, regen: -2 }, n: '空白券', f: '什么都没写。所以什么都能兑。' },
    dl_r_mirror: { t: 2, ico: 'orb:C', world: W, rule: 1, m: { handMul: 0.6, wall: -6 }, n: '照妖镜', f: '照出你的牌，也照出你的墙有多薄。' },
  },

  talents: {
    dl_t_bluff: { cat: 'atk', r: 0, world: W, m: { critDmg: 0.15 }, n: '诈唬', say: '手里没牌的时候，下注要更大。' },
    dl_t_fold: { cat: 'def', r: 0, world: W, m: { shieldStart: 6 }, n: '弃牌', say: '知道什么时候不跟，才活得长。' },
    dl_t_count: { cat: 'tech', r: 1, world: W, m: { handLv: 1 }, n: '记牌', say: '每一张出过的牌，都记着。' },
    dl_t_tip: { cat: 'eco', r: 0, world: W, m: { winGold: 1 }, n: '小费', say: '给荷官一点小费。他会记得你。' },
  },

  intents: {
    /** 琥珀骰：掷一次，点数决定招式 / the Amber Die: roll once; the pips pick the move */
    dl_roll: (e) => {
      const n = 1 + Math.floor(rand() * 6);
      view.num(ex(e), ey(e) - 26, `${n} 点`, '#ffcd75', 2);
      const k = 'dl_chip';
      const moves: Record<number, () => void> = {
        1: () => INTENTS.summon(e, 6, k),
        2: () => INTENTS.gaze(e, 2, undefined),
        3: () => INTENTS.shield(e, 0.12, undefined),
        4: () => INTENTS.drain(e, 0.5, undefined),
        5: () => INTENTS.wind(e, 4, undefined),
        6: () => {
          view.banner('六六大顺', '#ffcd75');
          INTENTS.barrage(e, 6, undefined);
        },
      };
      moves[n]();
    },
    /** 庄：亮牌，护盾一次比一次厚 / the House: shows a hand; the shield grows each time */
    dl_show: (e) => {
      const m = M(e);
      m.n = Math.min(8, (m.n || 0) + 1);
      e.shield += e.maxHp * 0.03 * m.n;
      view.banner(`庄亮牌：${HANDS[Math.min(HANDS.length - 1, m.n)].n}`, '#e43b44');
    },
  },

  enemies: {
    dl_chip: { hp: 10, spd: 0.055, armor: 0, wall: 1, spr: 'dl_chip', sc: 1, col: '#e43b44', faction: 'swamp', world: W, n: '筹码', tip: '滚过来的筹码。一枚不值钱，一摞就值了。' },
    dl_card: { hp: 6, spd: 0.1, armor: 0, wall: 1, spr: 'dl_card', sc: 1, zig: 1, col: '#f4f4f4', faction: 'wing', world: W, n: '飞牌', tip: '长了翅膀的牌，飞得又快又歪。' },
    dl_guard: { hp: 20, spd: 0.045, armor: 2, wall: 2, spr: 'dl_guard', sc: 1, col: '#333c57', faction: 'dead', world: W, n: '黑桃兵', tip: '牌桌上的小兵，一排一排地走。' },
    dl_dice: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'dl_dice', sc: 1, split: 2, splitInto: 'dl_pip', col: '#f4f4f4', faction: 'swamp', world: W, n: '骰子', tip: '出场掷一次：点数越大越肉。打碎了掉出点子。' },
    dl_pip: { hp: 5, spd: 0.08, armor: 0, wall: 1, spr: 'dl_pip', sc: 1, small: 1, col: '#f4f4f4', faction: 'swamp', world: W, n: '点子' },
    dl_slot: { hp: 110, spd: 0.028, armor: 4, wall: 5, spr: 'dl_slot', sc: 1, col: '#e43b44', faction: 'war', world: W, n: '老虎机', tip: '每隔一会儿转一次；转出三个一样的，就给自己加一层护盾。' },
    dl_bouncer: { hp: 44, spd: 0.035, armor: 4, wall: 2, spr: 'dl_bouncer', sc: 1, guard: 3, aura: 30, col: '#333c57', faction: 'dead', world: W, n: '保镖', tip: '给身边的敌人加护甲。' },
    dl_waiter: { hp: 26, spd: 0.04, armor: 0, wall: 2, spr: 'dl_waiter', sc: 1, heal: 0.12, aura: 34, col: '#f4f4f4', faction: 'cult', world: W, n: '侍应', tip: '端着酒，给身边的敌人回血。' },
    dl_band: { hp: 26, spd: 0.045, armor: 0, wall: 2, spr: 'dl_band', sc: 1, haste: 0.35, aura: 34, col: '#a64ca6', faction: 'war', world: W, n: '乐手', tip: '一奏乐，身边的都走得快。' },
    dl_cigar: { hp: 10, spd: 0.085, armor: 0, wall: 3, spr: 'dl_cigar', sc: 1, bomb: 0.45, col: '#b13e53', faction: 'war', world: W, n: '雪茄', tip: '烧到头就炸。' },
    dl_bluff: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'dl_bluff', sc: 1, phase: 1, col: '#a64ca6', faction: 'dead', world: W, n: '诈唬', tip: '虚虚实实，虚着的时候打不着。' },
    dl_croupier: { hp: 34, spd: 0.03, armor: 0, wall: 3, spr: 'dl_croupier', sc: 1, raise: 2, raiseAs: 'dl_guard', col: '#38b764', faction: 'cult', world: W, n: '收牌手', tip: '把倒下的牌收回去，重新发出来。' },
    dl_cart: { hp: 240, spd: 0.02, armor: 3, wall: 8, spr: 'dl_cart', sc: 1, cargo: ['dl_chip', 6], col: '#e43b44', faction: 'war', world: W, n: '筹码车', tip: '一车筹码。打翻了撒一地。' },
    dl_loser: { hp: 50, spd: 0.04, armor: 1, wall: 3, spr: 'dl_loser', sc: 1, rage: 1.8, col: '#ffcd75', faction: 'war', world: W, n: '输红眼的', tip: '越输越疯，越疼跑得越快。' },
    dl_thrower: { hp: 70, spd: 0.03, armor: 2, wall: 3, spr: 'dl_thrower', sc: 1, stopAt: 0.3, lob: [4.5, 1], col: '#38b764', faction: 'war', world: W, n: '掷骰手', tip: '站在远处往墙上扔骰子。' },
    dl_jackpot: { hp: 60, spd: 0.028, armor: 1, wall: 3, spr: 'dl_jackchest', spr2: 'dl_jackpot', sc: 1, mimic: 3, col: '#38b764', faction: 'swamp', world: W, n: '奖池', tip: '一个钱箱。挨了打就张嘴跑——打死它有钱。' },
    dl_bully: { hp: 240, spd: 0.028, armor: 2, wall: 8, spr: 'dl_e_bully', sc: 1, elite: 1, rage: 0.8, col: '#333c57', faction: 'war', world: W, n: '打手',
      tip: '赌场养的打手。吼一声，身边的都往前冲。',
      intents: [{ t: 6, a: 'roar', n: '吼', d: '身边的一起冲锋' }, { t: 11, a: 'dash', n: '冲撞', d: '三倍速' }] },
    dl_vault: { hp: 280, spd: 0.022, armor: 6, wall: 10, spr: 'dl_e_vault', sc: 1, elite: 1, col: '#fee761', faction: 'war', world: W, n: '金库',
      tip: '硬得很，打开了里头全是钱。',
      intents: [{ t: 7, a: 'harden', n: '上锁', d: '护甲+10' }, { t: 9, a: 'quake', n: '震', d: '冻住你一张卡' }] },
    dl_magician: { hp: 150, spd: 0.025, armor: 0, wall: 8, spr: 'dl_e_magic', sc: 1, elite: 1, raise: 2, raiseAs: 'dl_guard', col: '#e43b44', faction: 'cult', world: W, n: '魔术师',
      tip: '从帽子里变出黑桃兵。',
      intents: [{ t: 9, a: 'skels', v: 3, k: 'dl_guard', n: '变', d: '变出3个黑桃兵' }, { t: 8, a: 'shield', n: '障眼法', d: '护盾' }] },
    /* 第 4 夜：抽成的荷官 / night 4: the dealer who takes a cut */
    dl_dealer: { hp: 900, spd: 0.022, armor: 3, wall: 12, spr: 'dl_b_dealer', sc: 1, elite: 1, fixed: 1, col: '#38b764', faction: 'cult', world: W, n: '抽成的荷官',
      tip: '每隔一会儿从你兜里抽成；打倒他，抽走的连本带利还回来。',
      intents: [{ t: 5, a: 'pilfer', v: 3, n: '抽成', d: '偷走3金' }, { t: 7, a: 'shield', n: '洗牌', d: '护盾' }, { t: 8, a: 'skels', v: 3, k: 'dl_guard', n: '发牌', d: '招来黑桃兵' }] },
    /* 首领 */
    dl_amber: { final: 1, boss: 1, fixed: 1, hp: 10500, spd: 0.012, armor: 2, wall: 99, spr: 'dl_b_amber', sc: 1, col: '#ffcd75', faction: 'abyss', world: W, n: '琥珀骰',
      tip: '每次出招先掷一次：一点招筹码，六点往墙上砸六下。',
      intents: [{ t: 6, a: 'dl_roll', n: '掷骰', d: '点数决定招式' }, { t: 7, a: 'dl_roll', n: '掷骰', d: '点数决定招式' }] },
    dl_crimson: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.011, armor: 2, wall: 99, spr: 'dl_b_crimson', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '绯红之心',
      tip: '盯住你伤害最高的那张卡，让它动不了；还会把你最多的元素倒过来。',
      intents: [{ t: 7, a: 'duel', v: 5, n: '盯牌', d: '伤害最高的卡5秒动不了' }, { t: 8, a: 'invert', v: 5, n: '反转', d: '最多的元素伤害-30%' }, { t: 9, a: 'summon', v: 5, k: 'dl_card', n: '飞牌', d: '招来飞牌' }] },
    dl_violet: { final: 1, boss: 1, fixed: 1, hp: 11500, spd: 0.011, armor: 1, wall: 99, spr: 'dl_b_violet', sc: 1, col: '#a64ca6', faction: 'abyss', world: W, n: '紫釉瓶',
      tip: '你的牌型越大，它越硬；还会给场上所有敌人套一层护盾。',
      intents: [{ t: 7, a: 'knell', v: 0.15, n: '釉光', d: '所有敌人加护盾' }, { t: 8, a: 'brood', v: 5, k: 'dl_chip', n: '倒出筹码', d: '倒出5枚筹码' }, { t: 9, a: 'molt', v: 0.12, n: '上釉', d: '自己加护盾' }] },
    /* 隐藏首领：庄 / hidden boss: the House */
    dl_house: { hidden: 'choujue', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'dl_b_house', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '庄',
      tip: '每亮一次牌，护盾就厚一层；还会从你兜里抽钱。欠着钱的人，打它更疼不起来。',
      intents: [{ t: 6, a: 'dl_show', n: '亮牌', d: '护盾一次比一次厚' }, { t: 8, a: 'pilfer', v: 5, n: '抽水', d: '偷走5金' }, { t: 9, a: 'hush', v: 4, n: '封牌', d: '4秒内卡牌不能互相带动' }] },
    dl_house2: { hidden: 'zhangfang', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'dl_b_house', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '庄',
      tip: '每亮一次牌，护盾就厚一层；还会从你兜里抽钱。欠着钱的人，打它更疼不起来。',
      intents: [{ t: 6, a: 'dl_show', n: '亮牌', d: '护盾一次比一次厚' }, { t: 8, a: 'pilfer', v: 5, n: '抽水', d: '偷走5金' }, { t: 9, a: 'hush', v: 4, n: '封牌', d: '4秒内卡牌不能互相带动' }] },
  },

  foesets: {
    deal: {
      n: '牌桌上的东西', world: W,
      map: {
        slime: 'dl_chip', bat: 'dl_card', skel: 'dl_guard', bug: 'dl_dice', mini: 'dl_pip', golem: 'dl_slot', shieldb: 'dl_bouncer',
        shaman: 'dl_waiter', drummer: 'dl_band', bomber: 'dl_cigar', ghost: 'dl_bluff', necro: 'dl_croupier', siege: 'dl_cart',
        berserker: 'dl_loser', catapult: 'dl_thrower', mimic: 'dl_jackpot', a_brute: 'dl_bully', a_golem: 'dl_vault', a_lich: 'dl_magician', knight: 'dl_dealer',
      },
    },
  },

  voices: {
    dl_house: { img: 'p_dl_house', c: '#e43b44', n: '庄' },
    dl_dealer: { img: 'p_dl_dealer', c: '#38b764', n: '老荷官' },
    dl_tarot: { img: 'p_dl_tarot', c: '#a64ca6', n: '塔罗婆' },
  },

  events: {
    /* 星宿：给一种牌型升级 / planets: level up a hand */
    dl_planet: {
      ico: 'dl_ev_planet', cat: 'up', w: 3, rar: 0, world: W, n: '星宿', f: '牌桌上方的天幕裂开一道缝，露出几颗星。每颗星对着一种牌型。',
      enter: (cur, api) => {
        const now = bestHand();
        const ids = shuffled(HANDS.slice(1).map((h) => h.id).filter((i) => i !== now)).slice(0, 2);
        if (now !== 'high') ids.unshift(now);
        else ids.push(shuffled(HANDS.slice(1).map((h) => h.id).filter((i) => !ids.includes(i)))[0]);
        api.choice(cur, '挑一颗星。', ids.map((id) => {
          const a = handVal(id);
          const lv = (ws().lv ||= {});
          lv[id] = (lv[id] || 1) + 1;
          const b = handVal(id);
          lv[id]--;
          return {
            ico: 'dl_ev_planet', label: `${a.n}${id === now ? '（现在凑的）' : ''}：Lv${a.lv} → Lv${b.lv}`, sub: `${HANDS[HI[id]].d}。筹码 +${a.chips} → +${b.chips}，倍率 ×${a.x.toFixed(2)} → ×${b.x.toFixed(2)}`,
            act: () => {
              lvUp(id, api);
              api.finishStep();
            },
          };
        }));
      },
    },
    /* 塔罗摊：两张牌二选一 / the tarot stall: pick one of two cards */
    dl_tarot: {
      ico: 'dl_ev_tarot', cat: 'misc', w: 2, rar: 0, world: W, n: '塔罗摊', f: '一个蒙着头巾的老太太，面前摆着两张扣着的牌。',
      enter: (cur, api) => {
        const up = G.cards.filter((c) => c.tier < 2);
        const all = [
          { ico: 'r_hammer', label: '魔术师', sub: '挑一张卡升一品', ok: up.length > 0, act: () => {
            api.choice(cur, '挑一张。', shuffled(up).slice(0, 3).map((c) => api.upOpt(c, api.finishStep)));
            api.renderPrep();
          } },
          { ico: 'r_purse', label: '隐者', sub: `金币翻倍（最多 +15）`, ok: G.gold > 0, act: () => { api.gainGold(Math.min(15, Math.max(0, G.gold))); api.finishStep(); } },
          { ico: 'r_heart', label: '太阳', sub: '城墙修满', ok: G.wall < G.wallMax, act: () => { api.heal(G.wallMax); api.finishStep(); } },
          { ico: 'r_rampart', label: '高塔', sub: '城墙上限 +5，丢 4 金', ok: true, act: () => { api.maxWall(5); G.gold -= 4; api.updateHUD(); api.finishStep(); } },
          { ico: 'dl_ev_planet', label: '世界', sub: '现在凑的牌型升 1 级', ok: bestHand() !== 'high', act: () => { lvUp(bestHand(), api); api.finishStep(); } },
          { ico: 'scroll:P', label: '命运之轮', sub: '随机得一张银卡', ok: heroCards(1).length > 0, act: () => { api.addCard(pick(heroCards(1)), 1); api.finishStep(); } },
        ].filter((o) => o.ok);
        api.choice(cur, '“翻一张吧。另一张，就让它扣着。”', shuffled(all).slice(0, 2));
      },
    },
    /* 优惠券：买一张永久打折 / the voucher: buy a permanent discount */
    dl_voucher: {
      ico: 'dl_ev_voucher', cat: 'shop', w: 0.8, rar: 1, minR: 3, world: W, n: '优惠券', f: '老荷官从柜台底下摸出一张券，弹了弹上面的灰。',
      need: () => !G.relics.includes('dl_coupon') && G.gold + mv('debt') >= 10,
      enter: (cur, api) => {
        const price = 10;
        api.choice(cur, `“${price} 金。以后店里每样东西便宜 1 金。”`, [
          { ico: 'dl_ev_voucher', label: '买', sub: `${price} 金`, act: () => {
            if (G.gold + mv('debt') < price) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= price;
            api.gainRelic('dl_coupon');
          } },
          { ico: 'boot:g', label: '不买', sub: '下回吧', act: () => api.finishStep() },
        ]);
      },
    },
    /* 幸运转盘：四分之一的机会 / the wheel: a one-in-four shot */
    dl_wheel: {
      ico: 'dl_ev_wheel', cat: 'misc', w: 1.5, rar: 0, minR: 2, world: W, n: '幸运转盘', f: '一个转盘，四格里三格写着“没有”。',
      need: () => G.gold + mv('debt') >= 4,
      enter: (cur, api) => {
        const up = G.cards.filter((c) => c.tier < 2);
        api.choice(cur, '“转一次 4 金。”', [
          { ico: 'dl_ev_wheel', label: '转', sub: '1/4 的机会：随机一张卡升一品', act: () => {
            if (G.gold + mv('debt') < 4) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= 4;
            api.updateHUD();
            if (up.length && rand() < 0.25) {
              const c = pick(up);
              c.tier++;
              api.repaint(c);
              api.afterMerge();
              api.renderOwned();
              api.reward(cur, `转中了！【${ITEMS[c.key].n}】升了一品。`, () => {});
            } else api.reward(cur, '“没有！”转盘后面的丑角做了个鬼脸。', () => {});
            api.renderPrep();
          } },
          { ico: 'boot:g', label: '不转', sub: '走了', act: () => api.finishStep() },
        ]);
      },
    },
    /* 筹码兑换：砖换钱，钱换砖 / the chip exchange: bricks for gold, gold for bricks */
    dl_exchange: {
      ico: 'r_purse', cat: 'misc', w: 1.5, rar: 0, world: W, n: '筹码兑换', f: '“砖也收。墙上抠下来的，一块算一个子儿。”',
      enter: (cur, api) => {
        api.choice(cur, '兑换处的窗口开着。', [
          { ico: 'r_purse', label: '拿砖换钱', sub: '城墙上限 -5，+12 金', act: () => { api.maxWall(-5); api.gainGold(12); api.finishStep(); } },
          ...(G.gold >= 10 ? [{ ico: 'r_rampart', label: '拿钱换砖', sub: '-10 金，城墙上限 +4', act: () => { G.gold -= 10; api.maxWall(4); api.finishStep(); } }] : []),
          { ico: 'boot:g', label: '不换', sub: '走了', act: () => api.finishStep() },
        ]);
      },
    },
  },

  heroes: {
    choujue: {
      def: {
        world: W, col: '#a64ca6', portrait: 'p_choujue', wall: 28, gold: 10, start: [],
        n: '丑角', title: '跑出牌盒的小丑', tag: '擅长凑牌型和连击', desc: '本来是一副牌里的鬼牌。棋盘上的卡凑成【牌型】，他让牌型的倍率再翻一截。',
        intro: '我是那张多出来的牌。庄洗牌的时候，我从牌盒里溜了出来。',
      },
      sig: { n: '满堂彩', d: '【牌型】的倍率多算 35%（比如 ×1.4 变成 ×1.54）。', m: { handMul: 0.35 } },
      awaken: [
        { id: 'choujue_a', n: '一手好牌', d: '同花、同花顺少要一张', m: { flushEase: 1 } },
        { id: 'choujue_b', n: '记得每一张', d: '所有牌型等级 +2', m: { handLv: 2 } },
      ],
      kits: [
        { cards: [['dl_juggle', 0], ['dl_whip', 1]], path: 'flush', n: '火球火圈', d: '两张【火】，先凑一对。' },
        { cards: [['dl_pins', 0], ['dl_twitch', 0], ['dl_grin', 0]], path: 'juggle', n: '棒子、闪电和鬼脸', d: '扔出去，弹回来；鬼脸凑个对子。' },
      ],
      paths: [
        { id: 'flush', mast: 0, cards: ['dl_juggle', 'dl_grin', 'dl_flushjoker', 'dl_whip', 'dl_finale'], n: '同花', d: '一种元素凑到底' },
        { id: 'juggle', mast: 1, cards: ['dl_pins', 'dl_twitch', 'dl_mirror', 'dl_double', 'dl_curtain'], n: '杂耍', d: '元素凑杂，连击带动' },
      ],
      story: jesterStory,
    },
    zhangfang: {
      def: {
        world: W, col: '#257179', portrait: 'p_zhangfang', wall: 32, gold: 16, start: [],
        n: '账房', title: '欠了庄一笔的人', tag: '擅长赊账和攒钱', desc: '城里的账房先生，替全城欠了庄一大笔。钱不够也能先买（【赊账】），兜里的钱越多，他的卡越疼。',
        intro: '全城的账，都在我这本子上。最大的一笔，是欠庄的。',
      },
      sig: { n: '赊账', d: '钱不够也能买，最多欠 10 金。欠着钱的时候没有利息。', m: { debt: 10 } },
      awaken: [
        { id: 'zhangfang_a', n: '老主顾', d: '能多欠 10 金', m: { debt: 10 } },
        { id: 'zhangfang_b', n: '利滚利', d: '利息上限 +3', m: { interest: 3 } },
      ],
      kits: [
        { cards: [['dl_abacus', 0], ['dl_moneyhammer', 1], ['dl_piggy', 0]], path: 'money', n: '算盘、钱袋和存钱罐', d: '先把钱攒起来。' },
        { cards: [['dl_compound', 1], ['dl_iou', 0], ['dl_collector', 1]], path: 'interest', n: '复利、欠条和讨债人', d: '借来的钱，也是钱。' },
      ],
      paths: [
        { id: 'money', mast: 0, cards: ['dl_abacus', 'dl_piggy', 'dl_goldabacus', 'dl_moneyhammer', 'dl_bigspender'], n: '金钱', d: '兜里越鼓，打得越疼' },
        { id: 'interest', mast: 1, cards: ['dl_compound', 'dl_iou', 'dl_collector', 'dl_usury', 'dl_mint'], n: '复利', d: '一夜比一夜多' },
      ],
      stat: (c) => {
        if (c.key === 'dl_abacus') return { flat: Math.min(10, Math.floor(Math.max(0, G.gold) / 10)) * unit() };
        if (c.key === 'dl_goldabacus') return { pct: [['金币', Math.min(0.6, Math.max(0, G.gold) * 0.01)]] };
      },
      story: clerkStory,
    },
  },

  hooks: {
    cards: {
      dl_piggy: { onWin: (c) => (c.hoard += 1 + stepOf(c)) },
      dl_compound: {
        onWin: (c) => {
          const it = ITEMS[c.key];
          growCard(c, Math.max(0.5, (it.dmg * UPS[it.up].d[stepOf(c)] + (c.grow || 0)) * 0.1));
        },
      },
      dl_moneyhammer: {
        on: {
          kill: (c, x) => {
            if (x.src === c && rand() < 0.25) coin(1, ex(x.e), ey(x.e));
          },
        },
      },
      dl_iou: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            for (const n of c.nb || []) chargeCard(n, (G.gold < 0 ? 0.4 : 0.2) * (1 + 0.25 * stepOf(c)), c);
          },
        },
      },
      dl_mint: {
        on: {
          use: (c, x) => {
            const b = bt();
            if (x.c !== c || (b.flags.mintN || 0) >= 6) return;
            b.flags.mintN = (b.flags.mintN || 0) + 1;
            coin(1, c.ox || world.W / 2, world.H - 10);
          },
        },
      },
      dl_luckydie: {
        on: {
          use: (c, x) => {
            if (x.c === c) c.anvil = rand() * 1.5;
          },
        },
      },
    },
    enemies: {
      /* 骰子：出场掷一次，点数越大越肉 / dice: roll on spawn; more pips, more HP */
      dl_dice: {
        spawn: (e) => {
          const n = 1 + Math.floor(rand() * 6);
          e.hp = e.maxHp = e.maxHp * (0.5 + n / 6);
        },
      },
      /* 老虎机：每 6 秒转一次，三个一样就加护盾 / slot machine: spins every 6 s; three of a kind shields it */
      dl_slot: {
        spawn: (e) => (M(e).t = 3 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          m.t -= dt;
          if (m.t > 0) return;
          m.t = 6;
          if (rand() < 1 / 3) {
            e.shield += e.maxHp * 0.25;
            view.num(ex(e), ey(e) - 14, '777', '#fee761', 1);
          }
        },
      },
      /* 金库：打开了全是钱 / the vault: full of gold once cracked */
      dl_vault: { die: (e) => coin(3, ex(e), ey(e)) },
      /* 紫釉瓶：你的牌型越大，它越硬 / the Violet Vessel: the bigger your hand, the harder it gets */
      dl_violet: {
        spawn: (e) => {
          const h = bt().flags.hand as { id: string } | undefined;
          e.armor += HI[h?.id || 'high'] * 1.5;
        },
      },
      /* 庄：对欠钱的人，伤害 -30% / the House: -30% damage taken from those in debt */
      dl_house: { hurt: (_e, a) => (G.gold < 0 ? a * 0.7 : a) },
      dl_house2: { hurt: (_e, a) => (G.gold < 0 ? a * 0.7 : a) },
    },
  },
};

/* 同花小丑、压轴、砸钱：看牌型 / 花没花钱 / Flush Joker, Finale, Big Spender: read the hand or whether gold was spent */
const baseStat = pack.worlds!.deal.stat!;
pack.worlds!.deal.stat = (c, it) => {
  const r = baseStat(c, it);
  if (!r) return r;
  const h = curHand();
  if (c.key === 'dl_flushjoker' && (h.id === 'flush' || h.id === 'sflush')) r.xs!.push(['同花', 1.5]);
  if (c.key === 'dl_finale' && HI[h.id] > 0) r.pct = [['牌型', 0.15 * HI[h.id]]];
  if (c.key === 'dl_bigspender' && inBattle() && bt().flags.spent) r.xs!.push(['砸钱', 1.6]);
  return r;
};

export default pack;
