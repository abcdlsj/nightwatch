/* 杀戮尖塔：照着原作做的同人模组。尼奥把你复活在塔底，你一层一层往上爬，打到腐化之心。
 * 两个原作人物：铁甲战士（力量、格挡、燃烧之血）和静默猎手（中毒、小刀、蛇之戒指）。
 * 卡牌、遗物、怪物、首领、事件都用原作的，按这边的自动战斗规则改了一下：
 * 【力量】让每张输出卡每一下都更疼；格挡就是城墙护盾；能量换成充能；诅咒卡放着就生效。
 * 剧情文字在 story.ts，像素图由 art.py 生成到 sprites.ts。
 * Slay the Spire: a fan mod that follows the original. Neow revives you at the foot of the Spire; you climb floor by floor up to the Corrupt Heart.
 * Two original characters: the Ironclad (strength, block, Burning Blood) and the Silent (poison, shivs, Ring of the Snake).
 * Cards, relics, monsters, bosses and events come from the original, adapted to this game's auto-battle rules:
 * Strength makes every hit of every attack card hurt more; Block is wall shield; energy becomes charge; curses work just by being held.
 * Story text is in story.ts; sprites are generated into sprites.ts by art.py.
 */
import type { ModPack, ModEvent } from '../../src/mod/types';
import type { Card } from '../../src/game/state';
import type { Enemy } from '../../src/sim/types';
import { G } from '../../src/game/state';
import { ITEMS } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { mv } from '../../src/game/mods';
import { boardCards, stepOf, stats } from '../../src/game/cards';
import { B, bt, later, front, near, targets } from '../../src/sim/battle';
import { hurt, chargeCard, addShield, reload } from '../../src/sim/combat';
import { damageWall, spawn, INTENTS } from '../../src/sim/enemies';
import { view } from '../../src/sim/view';
import { world, K, ex, ey } from '../../src/sim/world';
import { rand, pick, shuffled } from '../../src/core/rng';
import sprites from './sprites';
import { worldStory, ironcladStory, silentStory } from './story';
import { ws } from '../../src/game/world';

const W = 'spire';
const inBattle = () => !!B && !B.over && G.phase === 'battle';
const M = (e: Enemy) => (e.m ||= {});
/** 夜越深越值钱的单位：第 1~3 夜 1，每 4 夜 +1 / a unit that grows with the night: 1 on nights 1–3, +1 every 4 nights */
const unit = () => 1 + Math.floor(G.round / 4);
const curses = (k: string) => G.cards.filter((c) => c.key === k).length;
const has = (r: string) => G.relics.includes(r);
const onBoard = (k: string) => boardCards().filter((c) => c.key === k) as Card[];
/** 名字里带「打击」的卡（完美打击按它们算） / cards with "Strike" in the name (Perfect Strike counts them) */
const STRIKES = ['sts_strike_r', 'sts_strike_g', 'sts_twin', 'sts_perfect', 'sts_swift', 'sts_pstab'];

/* ---------------- 力量：这个世界里所有输出卡都吃 ---------------- / ---------------- Strength: every attack card in this world uses it ---------------- */
const str = () => (inBattle() ? bt().flags.str || 0 : mv('strStart'));
function addStr(n: number) {
  const b = bt();
  b.flags.str = (b.flags.str || 0) + n;
  view.num(world.W / 2, world.H - 18, `力量 ${b.flags.str}`, '#ff5a5a', 1);
}

/* ---------------- 小刀（静默猎手） ---------------- / ---------------- Shivs (the Silent) ---------------- */
function shiv(c: Card, base?: number) {
  const b = bt();
  const e = front();
  if (!e) return;
  /* 精准：小刀更疼 / Accuracy: shivs hurt more */
  const acc = onBoard('sts_accuracy').reduce((s, o) => s + 0.5 + 0.25 * stepOf(o), 0);
  const amt = (base ?? stats(c, b.t).total * 0.6) * (1 + acc) + str() * unit();
  b.flags.shivs = (b.flags.shivs || 0) + 1;
  view.bolt([[c.ox || world.W / 2, world.H - 4], [ex(e), ey(e) - 4]], '#e3e9f0', 0.12, true);
  const p = mv('knifePoison');
  later(0.08, () => hurt(e, amt, c, false, { k: 'fx', ...(p ? { poison: p * unit(), poisonDur: 3 } : {}) }));
}

/* ---------------- 事件里常用的几样 ---------------- / ---------------- Helpers used by events ---------------- */
type Api = Parameters<ModEvent['enter']>[1];
const heroCards = (t: number) => Object.keys(ITEMS).filter((k) => ITEMS[k].hero === G.hero && ITEMS[k].t === t && !ITEMS[k].noPool);
function giveCard(api: Api, k: string) {
  if (!api.addCard(k, 0)) api.toast(`没地方放【${ITEMS[k].n}】，它挤在门口走了`);
}
/** 最左边的一张卡（尼奥换起手用） / the leftmost card (for Neow's starter swap) */
const firstCard = () => [...G.cards].sort((a, b) => (a.loc === b.loc ? a.idx - b.idx : a.loc === 'board' ? -1 : 1))[0];
const ruleRelics = () => Object.keys(RELICS).filter((k) => RELICS[k].world === W && RELICS[k].rule && !has(k));

/* 卡牌的简写：原作卡名 + 改过的效果 / shorthand for cards */
const pack: ModPack = {
  id: 'spire',
  name: '杀戮尖塔',
  author: '守夜人工坊',
  version: '2.0.0',
  desc: '同人模组。铁甲战士和静默猎手，原作的卡牌、遗物、怪物和首领，尼奥陪你爬塔。',
  sprites,

  /* ---------------- 自己的修正项（天性、觉醒、遗物用） ---------------- / ---------------- Own modifier keys ---------------- */
  mods: {
    strWall: { n: '城墙每挨一下，力量 +1' },
    strMul: { n: '力量的效果', show: 1 },
    strStart: { n: '开战时力量', show: 0 },
    knifeEvery: { n: '小型输出卡每出手几次甩一把小刀', show: 0, inv: 1 },
    knifePoison: { n: '小刀附带中毒', show: 0 },
    sts_pen: { n: '每出手 10 次，伤害最高的卡下一下 +100%' },
    sts_kunai: { n: '输出卡每出手 3 次，城墙护盾 +2（夜越深越多）' },
    sts_shuriken: { n: '输出卡每出手 3 次，力量 +1（每场最多 +6）' },
    sts_spoon: { n: '弹药卡打空时，25% 装回一发' },
    sts_urn: { n: '每用一次辅助卡，城墙修 1（每场最多 4）' },
    sts_ink: { n: '每出手 10 次，随机一张卡充满能' },
    sts_marbles: { n: '开战头 5 秒，伤害 ×1.5' },
    sts_coffee: { n: '篝火不能休息' },
  },

  worlds: {
    spire: {
      n: '尖塔',
      d: '尼奥把你从死里拉回来，放在塔底。往上爬，一直爬到心脏。',
      foeSet: 'spire',
      noEvents: ['spring', 'job', 'bank', 'refugee', 'camp', 'pilgrim'],
      firstDoors: ['sts_neow', 'shop', 'field'],
      rename: {
        events: {
          shop: { n: '商人', f: '紫色兜帽，白面具，一卷地毯。他把货摊开，一句话也不多说。' },
          field: { n: '怪物房', f: '门后是一群怪物。打完了，地上会掉点东西。' },
          chest: { n: '宝箱' },
          altar: { n: '神龛' },
        },
        relics: {
          gem_red: { n: '红宝石钥匙', ico: 'gem:R' },
          gem_blue: { n: '蓝宝石钥匙', ico: 'gem:c' },
          gem_green: { n: '绿宝石钥匙', ico: 'gem:G' },
        },
      },
      story: worldStory,
      hooks: {
        start: () => {
          const b = bt();
          b.flags.str = 0;
          if (mv('strStart')) addStr(mv('strStart'));
          /* 燃烧：每张开战 +2 力量 / Inflame: +2 strength per copy at the start */
          for (const c of onBoard('sts_inflame')) {
            view.cardFx(c, 'pop');
            addStr(2 + stepOf(c));
          }
          /* 诅咒卡：在手里就生效，不用上棋盘 / curses take effect while held, on the board or not */
          for (let i = 0; i < curses('sts_doubt'); i++) {
            const c = pick(boardCards().filter((o) => o.frozen <= 0 && !ITEMS[o.key].noSell) as Card[]);
            if (!c) break;
            c.frozen = 3;
            view.cardFlag(c, 'frozen', true);
          }
          const reg = curses('sts_regret');
          if (reg) later(0.6, () => damageWall(reg, world.W / 2));
          /* 神化：所有卡立刻充满 / Apotheosis: every card fully charged */
          if (onBoard('sts_apotheosis').length) for (const c of boardCards()) chargeCard(c as Card, 1, null);
          /* 幻灵：开战一层厚护盾 / Apparition: a thick shield at the start */
          const ap = curses('sts_apparition');
          if (ap) addShield(12 * ap * unit());
        },
        use: (x) => {
          const c = x.c as Card;
          const it = ITEMS[c.key];
          const b = bt();
          /* 腐朽：每出手 12 次城墙 -1 / Decay: wall -1 every 12 card uses */
          const dec = curses('sts_decay');
          if (dec && (b.flags.useN = (b.flags.useN || 0) + 1) % 12 === 0) damageWall(dec, world.W / 2);
          if (it.dmg > 0) {
            b.flags.atkN = (b.flags.atkN || 0) + 1;
            if (b.flags.atkN % 3 === 0) {
              if (mv('sts_kunai')) addShield(2 * unit());
              if (mv('sts_shuriken') && (b.flags.shuN || 0) < 6) {
                b.flags.shuN = (b.flags.shuN || 0) + 1;
                addStr(1);
              }
            }
          } else if (mv('sts_urn') && (b.flags.urnN || 0) < 4 && !it.passive) {
            b.flags.urnN = (b.flags.urnN || 0) + 1;
            G.wall = Math.min(G.wallMax, G.wall + 1);
            view.hud();
          }
        },
        wall: (x) => {
          const b = bt();
          if (!mv('strWall') || !(x.d > 0) || (b.flags.strT ?? -9) > b.t - 0.5) return;
          b.flags.strT = b.t;
          addStr(mv('strWall'));
        },
      },
      stat: (c, it) => {
        if (!(it.dmg > 0)) return;
        let flat = str() * unit() * (1 + mv('strMul')) * (c.key === 'sts_heavy' ? 3 + stepOf(c as Card) : 1);
        const pct: [string, number][] = [];
        if (c.key === 'sts_perfect') {
          const n = G.cards.filter((o) => STRIKES.includes(o.key)).length;
          if (n) pct.push(['打击×' + n, 0.2 * n]);
        }
        const xs: [string, number][] = [];
        if (mv('sts_marbles') && inBattle() && bt().t < 5) xs.push(['弹珠袋', 1.5]);
        return { flat, pct, xs };
      },
      night: () => {
        /* 寄生虫：每夜吸走 1 金 / Parasite: drains 1 gold each night */
        const p = curses('sts_parasite');
        if (p && G.round > 1) G.gold = Math.max(0, G.gold - p);
      },
      note: () => {
        const n = G.cards.filter((c) => ITEMS[c.key].noSell && ITEMS[c.key].world === W).length;
        return n ? `<b>诅咒 ×${n}</b>：牧师和商人能帮你弄掉。` : '';
      },
    },
  },

  /* ---------------- 卡牌 ---------------- / ---------------- Cards ---------------- */
  cards: {
    /* 铁甲战士 · 力量 */
    sts_strike_r: { size: 1, tag: 'blade', t: 0, up: 'dmg', cd: 1.3, dmg: 6, fx: 'knife', kind: 'weapon', hero: 'ironclad',
      n: '打击', d: '造成伤害。吃【力量】。', f: '最普通的一张牌。爬到塔顶的人，手里也还留着它。' },
    sts_bash: { size: 2, tag: 'blade', t: 0, up: 'mix', cd: 2.6, dmg: 13, vuln: [3, 0.5], fx: 'axe', kind: 'weapon', hero: 'ironclad',
      n: '痛击', d: '重重一下，目标【易伤】3 秒（受到的伤害 +50%）。', f: '先让它疼，再让它更疼。' },
    sts_twin: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.5, dmg: 4, multi: 2, fx: 'knife', kind: 'weapon', hero: 'ironclad',
      n: '双重打击', d: '砍两下。每一下都吃【力量】。', f: '两下比一下多一下。力量也多算一次。' },
    sts_heavy: { size: 2, tag: 'blade', t: 1, up: 'mix', cd: 2.6, dmg: 12, fx: 'axe', kind: 'weapon', hero: 'ironclad', local: 1,
      n: '重刃', d: '【力量】对它算三倍（每升一品再多算一倍）。', f: '剑重到要两只手才拎得起来。' },
    sts_perfect: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.4, dmg: 12, fx: 'sweep', kind: 'weapon', hero: 'ironclad', local: 1,
      n: '完美打击', d: '你每有一张名字里带「打击」的卡，伤害 +20%（备战区的也算）。', f: '打击练到一万遍，就成了完美。' },
    sts_inflame: { size: 1, tag: 'fire', t: 1, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'ironclad', local: 1,
      n: '燃烧', d: '能力。开战时【力量】+2（每升一品再 +1）。', f: '火是从胸口烧起来的。' },
    sts_limit: { size: 1, tag: 'blade', t: 2, up: 'cd', cd: 7, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', local: 1,
      n: '突破极限', d: '【力量】翻一倍（一次最多加 8，夜越深越多）。', f: '极限是用来突破的。突破了，就是新的极限。' },
    sts_demon: { size: 2, tag: 'fire', t: 2, up: 'cd', cd: 6, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', local: 1,
      n: '恶魔形态', d: '能力。每 6 秒【力量】+2（每升一品再 +1）。', f: '角从额头里顶出来的时候，他一声都没吭。' },
    sts_bloodlet: { size: 1, tag: 'fire', t: 0, up: 'cd', cd: 3.5, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', local: 1,
      n: '放血', d: '城墙 -1，相邻的卡充能 50%（每升一品再 +15%）。城墙只剩 3 点时不放。', f: '血换能量。铁甲战士做这笔买卖从不犹豫。' },
    sts_whirl: { size: 2, tag: 'blade', t: 1, up: 'mix', cd: 2.8, dmg: 7, multi: 3, fx: 'sweep', kind: 'weapon', hero: 'ironclad',
      n: '旋风斩', d: '原地转三圈，横扫一排三次。', f: '剑舞成一团风。风里的东西，全碎了。' },
    sts_reaper: { size: 2, tag: 'blade', t: 2, up: 'mix', cd: 3.4, dmg: 14, aoe: 26, fx: 'axe', kind: 'weapon', hero: 'ironclad', local: 1,
      n: '收割', d: '砍一片。每砍死一个，城墙修 1（每场最多 4）。', f: '镰刀是从守护者的壳里拔出来的。' },
    /* 铁甲战士 · 格挡 */
    sts_defend_r: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 2.2, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', shieldGain: 4,
      n: '防御', d: '获得格挡：城墙护盾。', f: '盾牌上的划痕，比剑上的还多。' },
    sts_shrug: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 2.4, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', shieldGain: 3, charge: 0.25,
      n: '耸肩无视', d: '获得格挡，相邻的卡充能 25%。', f: '他耸了耸肩。那一下好像没打在他身上。' },
    sts_ironwave: { size: 1, tag: 'blade', t: 0, up: 'mix', cd: 1.8, dmg: 5, shieldGain: 2, fx: 'knife', kind: 'weapon', hero: 'ironclad',
      n: '铁斩波', d: '砍一下，同时获得格挡。', f: '剑和盾一起往前推。' },
    sts_bodyslam: { size: 2, tag: 'mech', t: 1, up: 'mix', cd: 2.6, dmg: 4, shieldDmg: 1, fx: 'rock', kind: 'weapon', hero: 'ironclad', local: 1,
      n: '全身撞击', d: '用全身撞过去。城墙护盾越厚，撞得越疼。', f: '格挡多少，伤害就是多少。' },
    sts_entrench: { size: 2, tag: 'mech', t: 1, up: 'cd', cd: 5, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', local: 1,
      n: '巩固', d: '城墙护盾翻一倍（一次最多加 30，每升一品再多 15）。', f: '一面墙后面再砌一面墙。' },
    sts_barricade: { size: 2, tag: 'mech', t: 2, up: 'cd', cd: 2, dmg: 0, fx: 'none', kind: 'gadget', hero: 'ironclad', local: 1,
      n: '壁垒', d: '能力。格挡不再散：每 2 秒护盾自己长 8%（每升一品再 +4%）。', f: '格挡不再在回合结束时消失。在这儿，它还会长。' },
    sts_feed: { size: 1, tag: 'blade', t: 2, up: 'dmg', cd: 3, dmg: 14, fx: 'slash', kind: 'weapon', hero: 'ironclad', local: 1,
      n: '狂宴', d: '用它杀死敌人，城墙上限 +1（每局最多 +8）。', f: '吃掉它。它的血就是你的血。' },

    /* 静默猎手 · 毒 */
    sts_strike_g: { size: 1, tag: 'blade', t: 0, up: 'dmg', cd: 1.2, dmg: 5, fx: 'knife', kind: 'weapon', hero: 'silent',
      n: '打击', d: '造成伤害。也算【蛇之戒指】的小型卡，攒小刀。', f: '刀很短，出手很快。' },
    sts_neutral: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 0.9, dmg: 4, slow: 0.35, fx: 'knife', kind: 'weapon', hero: 'silent',
      n: '中和', d: '一下很轻，目标【虚弱】：走得慢。', f: '先让它没力气，再慢慢收拾。' },
    sts_pstab: { size: 1, tag: 'poison', t: 0, up: 'dmg', cd: 1.3, dmg: 4, poison: 4, fx: 'sting', kind: 'weapon', hero: 'silent',
      n: '毒刺', d: '刺一下，目标中毒。', f: '刀刃上抹的是蛇牙里挤出来的。' },
    sts_deadly: { size: 1, tag: 'poison', t: 1, up: 'dmg', cd: 1.8, dmg: 1, poison: 7, fx: 'sting', kind: 'potion', hero: 'silent',
      n: '致命毒药', d: '几乎不疼，毒很重。', f: '一滴。只要一滴。' },
    sts_catalyst: { size: 1, tag: 'poison', t: 1, up: 'cd', cd: 3.6, dmg: 0, fx: 'none', kind: 'potion', hero: 'silent', local: 1,
      n: '催化剂', d: '射程内中毒的敌人，毒翻一倍（每个一次最多多加 12，夜越深越多）。', f: '毒在血里烧起来了。' },
    sts_fumes: { size: 2, tag: 'poison', t: 1, up: 'mix', cd: 3, dmg: 2, aoe: 40, poison: 3, fx: 'gas', kind: 'potion', hero: 'silent',
      n: '毒雾', d: '能力。一大片毒雾，范围里所有敌人中毒。', f: '雾从她脚下冒出来，往四面八方漫。' },
    sts_corpse: { size: 2, tag: 'poison', t: 2, up: 'mix', cd: 3.4, dmg: 4, poison: 10, fx: 'sting', kind: 'potion', hero: 'silent', local: 1,
      n: '尸爆术', d: '目标中毒。被它毒着的敌人死的时候炸开，身边的敌人挨它生命上限那么多（有上限）。', f: '死了也要拉几个垫背的。' },
    sts_flask: { size: 1, tag: 'poison', t: 0, up: 'dmg', cd: 1.6, dmg: 2, poison: 2, chain: 2, fx: 'sting', kind: 'potion', hero: 'silent',
      n: '弹跳药瓶', d: '药瓶弹三下，每一下都让目标中毒。', f: '砸到一个，弹到下一个。' },
    /* 静默猎手 · 小刀 */
    sts_defend_g: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 2.2, dmg: 0, fx: 'none', kind: 'gadget', hero: 'silent', shieldGain: 4,
      n: '防御', d: '获得格挡：城墙护盾。', f: '她更喜欢躲。躲不开的时候才挡。' },
    sts_bladedance: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.6, dmg: 3, multi: 3, fx: 'knife', kind: 'weapon', hero: 'silent',
      n: '刀刃之舞', d: '甩出三把小刀。出手勤，攒【蛇之戒指】的小刀最快。', f: '她转一圈，三把刀就飞出去了。' },
    sts_infinite: { size: 1, tag: 'blade', t: 1, up: 'cd', cd: 3, dmg: 0, fx: 'none', kind: 'gadget', hero: 'silent', local: 1,
      n: '无尽刀刃', d: '能力。每 3 秒甩一把小刀（夜越深越疼）。', f: '刀从哪儿来？别问。' },
    sts_accuracy: { size: 1, tag: 'blade', t: 1, up: 'dmg', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'silent', local: 1,
      n: '精准', d: '能力。小刀伤害 +50%（每升一品再 +25%）。', f: '每一把都扎在同一个地方。' },
    sts_afterimage: { size: 2, tag: 'mech', t: 1, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'silent', local: 1,
      n: '余像', d: '能力。别的卡每出手一次，城墙护盾 +1（每升一品再 +0.5，夜越深越多）。', f: '你打中的，只是她半秒前站的地方。' },
    sts_daggerspray: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.4, dmg: 6, multi: 2, fx: 'sweep', kind: 'weapon', hero: 'silent',
      n: '匕首雨', d: '一排匕首扫过去，扫两次。', f: '一把一把扔太慢了。' },
    sts_backstab: { size: 1, tag: 'blade', t: 1, up: 'dmg', cd: 0.4, dmg: 22, ammo: 1, fx: 'knife', kind: 'weapon', hero: 'silent',
      n: '背刺', d: '开战就出手，狠狠一下。每场一次。', f: '它还没回头，就已经倒了。' },
    sts_thousand: { size: 2, tag: 'blade', t: 2, up: 'mix', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'silent', local: 1,
      n: '千刀万剐', d: '能力。别的卡每出手一次，射程内所有敌人挨一刀（夜越深越疼）。', f: '一刀不疼。一千刀呢？' },

    /* 无色卡 / colorless */
    sts_swift: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1, dmg: 6, fx: 'knife', kind: 'weapon', world: W,
      n: '迅捷打击', d: '快。名字里也带「打击」。', f: '无色的牌，谁都能用。' },
    sts_flash: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 0.7, dmg: 3, fx: 'knife', kind: 'weapon', world: W,
      n: '钢铁闪光', d: '很快的一下。', f: '一闪。' },
    sts_bandage: { size: 1, tag: 'mech', t: 1, up: 'cd', cd: 7, dmg: 0, fx: 'none', kind: 'gadget', world: W, local: 1,
      n: '绷带包扎', d: '城墙修 1（每升一品再 +1）。', f: '缠紧一点，还能撑。' },
    sts_apotheosis: { size: 1, tag: 'volt', t: 2, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, world: W, local: 1,
      n: '神化', d: '开战时，你所有的卡立刻充满能。', f: '一瞬间，所有的牌都升了级。' },
    /* 事件给的卡 / event cards */
    sts_bite: { size: 1, tag: 'blade', t: 0, up: 'dmg', cd: 1.4, dmg: 7, fx: 'slash', kind: 'weapon', noPool: 1, world: W, local: 1,
      n: '咬', d: '咬一口。咬死敌人城墙修 1（每场最多 3）。吸血鬼送的。', f: '牙尖了。血的味道是甜的。' },
    sts_apparition: { size: 1, tag: 'ice', t: 1, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, world: W, local: 1,
      n: '幻灵', d: '虚无。开战时城墙一层厚护盾（每张 12，夜越深越多）。鬼魂议会送的。', f: '半透明的你，替你挨了那一下。' },
    /* 诅咒：不进卡池，卖不掉，只能找牧师或商人 / curses: not in the pool, can't be sold; only the cleric or the merchant can remove them */
    sts_doubt: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '疑虑', d: '诅咒。开战时随机冻住你一张卡 3 秒。卖不掉。', f: '这一下，该不该出手？' },
    sts_injury: { size: 2, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '受伤', d: '诅咒。什么也不做，就是占地方。卖不掉。', f: '它不疼了。可它一直在那儿。' },
    sts_regret: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '悔恨', d: '诅咒。开战时城墙 -1。卖不掉。', f: '你记得那个盒子。你不该打开的。' },
    sts_decay: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '腐朽', d: '诅咒。你每出手 12 次，城墙 -1。卖不掉。', f: '砖缝里长了东西。刮掉，第二天又长出来。' },
    sts_parasite: { size: 1, tag: 'poison', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '寄生虫', d: '诅咒。每到新的一夜吸走 1 金。弄掉它的时候城墙上限 -3。卖不掉。', f: '它在你身体里，饿了就动一下。' },
  },

  /* ---------------- 遗物 ---------------- / ---------------- Relics ---------------- */
  relics: {
    sts_vajra: { t: 0, ico: 'claw:y', world: W, m: { strStart: 1 }, n: '金刚杵', f: '握着它，手就重了一点。' },
    sts_anchor: { t: 0, ico: 'claw:g', world: W, m: { shieldStart: 10 }, n: '锚', f: '一只铁锚。塔里哪来的海？' },
    sts_lantern: { t: 0, ico: 'orb:Y', world: W, m: { startCharge: 0.12 }, n: '灯笼', f: '灯芯一直没灭过。' },
    sts_strawberry: { t: 0, ico: 'drop:R', world: W, m: { wall: 4 }, n: '草莓', f: '甜的。吃完了身子骨硬了一点。' },
    sts_pear: { t: 1, ico: 'drop:G', world: W, m: { wall: 7 }, n: '梨', f: '水很多。' },
    sts_mango: { t: 2, ico: 'drop:Y', world: W, m: { wall: 12 }, n: '芒果', f: '最大的那一个。' },
    sts_kunai: { t: 1, ico: 'claw:s', world: W, m: { sts_kunai: 1 }, n: '苦无', f: '每扔三把，身法就快一点。' },
    sts_shuriken: { t: 1, ico: 'badge:s', world: W, m: { sts_shuriken: 1 }, n: '手里剑', f: '每扔三把，手劲就大一点。' },
    sts_spoon: { t: 1, ico: 'claw:w', world: W, m: { sts_spoon: 1 }, n: '怪异勺子', f: '它是弯的。它一直是弯的。' },
    sts_urn: { t: 1, ico: 'potion:N', world: W, m: { sts_urn: 1 }, n: '鸟面瓮', f: '瓮口那张鸟脸，你一用能力它就张嘴。' },
    sts_ink: { t: 1, ico: 'potion:b', world: W, m: { sts_ink: 1 }, n: '墨水瓶', f: '每写满十页，就多一张牌。' },
    sts_marbles: { t: 1, ico: 'orb:c', world: W, m: { sts_marbles: 1 }, n: '弹珠袋', f: '开局一把弹珠撒出去，谁都站不稳。' },
    sts_pen: { t: 2, ico: 'wand', world: W, m: { sts_pen: 1 }, n: '笔尖', f: '每第十下，力透纸背。' },
    sts_idol: { t: 2, ico: 'badge:y', world: W, noPool: 1, m: { winGold: 3 }, n: '金色神像', f: '你把它拿起来的那一刻，身后有块石头动了。' },
    /* 首领遗物：第 2、6 夜后三选一，有好有坏 / boss relics: three to choose from after nights 2 and 6, with a catch */
    sts_crown: { t: 2, ico: 'badge:R', world: W, rule: 1, m: { spd: 0.2, winGold: -3 }, n: '破碎王冠', f: '多一点能量，少一点选择。' },
    sts_ecto: { t: 2, ico: 'orb:C', world: W, rule: 1, m: { xdmg: 0.15, winGold: -5 }, n: '灵质', f: '冰凉的一团。它不要钱，它要你别再碰钱。' },
    sts_coffee: { t: 2, ico: 'potion:n', world: W, rule: 1, m: { spd: 0.15, sts_coffee: 1 }, n: '咖啡滴滤器', f: '再也睡不着了。也不用睡了。' },
    sts_philo: { t: 2, ico: 'gem:R', world: W, rule: 1, m: { xdmg: 0.12, enemySpd: 0.08 }, n: '哲学家之石', f: '你更强，它们也更强。' },
  },

  talents: {
    sts_t_climb: { cat: 'atk', r: 0, world: W, m: { dmg: 0.06 }, n: '往上爬', say: '每一层都比上一层难一点。你也比上一层强一点。' },
    sts_t_rest: { cat: 'def', r: 0, world: W, m: { regen: 2 }, n: '篝火边', say: '睡一觉。醒了，伤就好一半。' },
    sts_t_map: { cat: 'tech', r: 1, world: W, m: { crit: 0.06 }, n: '看地图', say: '问号的地方，多半有好东西。也多半有坏东西。' },
    sts_t_purse: { cat: 'eco', r: 0, world: W, m: { killGold: 0.03 }, n: '摸金币', say: '怪物兜里也有钱。别问是谁的。' },
  },

  /* ---------------- 首领招式 ---------------- / ---------------- Boss moves ---------------- */
  intents: {
    /** 六火亡魂：点亮一团火；六团都亮了就是地狱火（掐灯 + 往墙上砸火球） / Hexaghost: light one flame; with all six lit, Inferno (snuff + fireballs) */
    sts_kindle: (e) => {
      const m = M(e);
      m.lit = (m.lit || 0) + 1;
      view.num(ex(e), ey(e) - 26, `${m.lit} / 6`, '#a7f070', 2);
      if (m.lit < 6) return;
      m.lit = 0;
      view.banner('地狱火', '#a7f070');
      INTENTS.snuff(e, undefined, undefined);
      INTENTS.barrage(e, 6, undefined);
    },
    /** 刺杀之书：一次比一次多刺一下 / Book of Stabbing: one more stab each time */
    sts_stab: (e) => {
      const m = M(e);
      m.stab = Math.min(7, (m.stab || 1) + 1);
      INTENTS.barrage(e, m.stab, undefined);
    },
    /** 腐化之心：心跳，往墙上砸，一次比一次多 / the Corrupt Heart: a beat on the wall, more each time */
    sts_beat: (e) => {
      const m = M(e);
      m.beat = Math.min(8, (m.beat || 1) + 1);
      INTENTS.barrage(e, m.beat, undefined);
    },
  },

  /* ---------------- 敌人 ---------------- / ---------------- Enemies ---------------- */
  enemies: {
    sts_acid_s: { hp: 9, spd: 0.055, armor: 0, wall: 1, spr: 'sts_acid_s', sc: 1, col: '#a7f070', faction: 'swamp', world: W, n: '酸液史莱姆（小）', tip: '一小坨酸。慢，但是一直来。' },
    sts_spike_s: { hp: 5, spd: 0.08, armor: 0, wall: 1, spr: 'sts_spike_s', sc: 1, small: 1, col: '#8e5ab0', faction: 'swamp', world: W, n: '尖刺史莱姆（小）' },
    sts_acid_m: { hp: 20, spd: 0.045, armor: 0, wall: 2, spr: 'sts_acid_m', sc: 1, split: 2, splitInto: 'sts_acid_s', col: '#a7f070', faction: 'swamp', world: W, n: '酸液史莱姆（中）', tip: '打死会裂成两小坨。' },
    sts_spike_m: { hp: 24, spd: 0.04, armor: 1, wall: 2, spr: 'sts_spike_m', sc: 1, split: 2, splitInto: 'sts_spike_s', col: '#8e5ab0', faction: 'swamp', world: W, n: '尖刺史莱姆（中）', tip: '打死会裂成两小坨。' },
    sts_acid_l: { hp: 60, spd: 0.03, armor: 0, wall: 4, spr: 'sts_acid_l', sc: 1, split: 2, splitInto: 'sts_acid_m', col: '#a7f070', faction: 'swamp', world: W, n: '酸液史莱姆（大）', tip: '打死裂成两个中的。' },
    sts_spike_l: { hp: 70, spd: 0.028, armor: 2, wall: 4, spr: 'sts_spike_l', sc: 1, split: 2, splitInto: 'sts_spike_m', col: '#8e5ab0', faction: 'swamp', world: W, n: '尖刺史莱姆（大）', tip: '打死裂成两个中的。' },
    sts_byrd: { hp: 6, spd: 0.1, armor: 0, wall: 1, spr: 'sts_byrd', sc: 1, zig: 1, col: '#e3e9f0', faction: 'wing', world: W, n: '球体鸟', tip: '歪歪扭扭地飞，快。嘎嘎。' },
    sts_cultist: { hp: 20, spd: 0.04, armor: 1, wall: 2, spr: 'sts_cultist', sc: 1, col: '#3b5dc9', faction: 'cult', world: W, n: '邪教徒', tip: '先站着念咒（仪式），念完了就冲得飞快。早点打。' },
    sts_jawworm: { hp: 70, spd: 0.03, armor: 3, wall: 4, spr: 'sts_jawworm', sc: 1, col: '#c28a4d', faction: 'war', world: W, n: '大颚虫', tip: '时不时吼一声，缩起来格挡。缩着的时候硬得很。' },
    sts_spheric: { hp: 44, spd: 0.035, armor: 4, wall: 2, spr: 'sts_spheric', sc: 1, guard: 3, aura: 30, col: '#94b0c2', faction: 'war', world: W, n: '球形守卫', tip: '给身边的敌人加护甲。' },
    sts_mystic: { hp: 26, spd: 0.04, armor: 0, wall: 2, spr: 'sts_mystic', sc: 1, heal: 0.12, aura: 34, col: '#3b5dc9', faction: 'cult', world: W, n: '神秘者', tip: '给身边的敌人回血。先打它。' },
    sts_gleader: { hp: 28, spd: 0.045, armor: 0, wall: 2, spr: 'sts_gleader', sc: 1, haste: 0.35, aura: 34, col: '#38b764', faction: 'war', world: W, n: '地精首领', tip: '一声令下，身边的地精都跑得快。' },
    sts_exploder: { hp: 12, spd: 0.07, armor: 0, wall: 3, spr: 'sts_exploder', sc: 1, bomb: 0.45, col: '#ef7d57', faction: 'swamp', world: W, n: '自爆者', tip: '死的时候炸开，连身边的同伴一起炸。' },
    sts_transient: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'sts_transient', sc: 1, phase: 1, col: '#73eff7', faction: 'dead', world: W, n: '过客', tip: '时隐时现，虚着的时候打不着。' },
    sts_reptomancer: { hp: 34, spd: 0.03, armor: 0, wall: 3, spr: 'sts_reptomancer', sc: 1, raise: 2, raiseAs: 'sts_dagger', col: '#38b764', faction: 'cult', world: W, n: '爬行法师', tip: '把倒下的召回来，变成匕首。' },
    sts_dagger: { hp: 8, spd: 0.09, armor: 0, wall: 2, spr: 'sts_dagger', sc: 1, small: 1, col: '#94b0c2', faction: 'cult', world: W, n: '匕首', tip: '一把会飞的刀，冲过来就是一下。' },
    sts_mass: { hp: 240, spd: 0.02, armor: 3, wall: 8, spr: 'sts_parasite', sc: 1, cargo: ['sts_louse', 6], col: '#a64ca6', faction: 'war', world: W, n: '扭动之块', tip: '一大团在扭的东西，里面全是虱子。打死了，一窝全掉出来。' },
    sts_louse: { hp: 6, spd: 0.08, armor: 0, wall: 1, spr: 'sts_louse', sc: 1, small: 1, col: '#e43b44', faction: 'swamp', world: W, n: '虱虫' },
    sts_madgremlin: { hp: 50, spd: 0.04, armor: 1, wall: 3, spr: 'sts_madgremlin', sc: 1, rage: 1.8, col: '#e43b44', faction: 'war', world: W, n: '愤怒地精', tip: '越疼跑得越快。' },
    sts_repulsor: { hp: 70, spd: 0.03, armor: 2, wall: 3, spr: 'sts_repulsor', sc: 1, stopAt: 0.3, lob: [4.5, 1], col: '#94b0c2', faction: 'war', world: W, n: '排斥者', tip: '站在远处往墙上扔东西。' },
    sts_looter: { hp: 60, spd: 0.028, armor: 1, wall: 3, spr: 'sts_looter', spr2: 'sts_looter2', sc: 1, mimic: 3, col: '#c28a4d', faction: 'swamp', world: W, n: '抢劫犯', tip: '挨了打就揣着钱往前跑——打死它，钱还你还多给。' },
    /* 精英 */
    sts_nob: { hp: 240, spd: 0.028, armor: 2, wall: 8, spr: 'sts_e_nob', sc: 1, elite: 1, rage: 0.6, col: '#e43b44', faction: 'war', world: W, n: '地精大块头',
      tip: '激怒：你每用一次技能卡（不打人的卡），它就更凶一点。',
      intents: [{ t: 6, a: 'roar', n: '咆哮', d: '身边的一起冲锋' }, { t: 10, a: 'dash', n: '冲撞', d: '2秒内三倍速' }] },
    sts_sentry: { hp: 280, spd: 0.022, armor: 6, wall: 10, spr: 'sts_e_sentry', sc: 1, elite: 1, col: '#ffcd75', faction: 'war', world: W, n: '哨卫',
      tip: '发射光束，被照到的卡头晕，动不了。',
      intents: [{ t: 7, a: 'harden', n: '缩壳', d: '4秒内护甲+10' }, { t: 8, a: 'gaze', v: 2, n: '光束', d: '冻住你2张卡（晕眩）' }] },
    sts_book: { hp: 170, spd: 0.025, armor: 1, wall: 8, spr: 'sts_e_book', sc: 1, elite: 1, col: '#e3e9f0', faction: 'cult', world: W, n: '刺杀之书',
      tip: '一本会走路的书，每次都比上次多刺一下。',
      intents: [{ t: 6, a: 'sts_stab', n: '多重刺击', d: '往墙上刺，一次比一次多' }, { t: 8, a: 'shield', n: '合书', d: '护盾' }] },
    /* 第 4 夜：乐加维林 / night 4: Lagavulin */
    sts_lagavulin: { hp: 900, spd: 0.022, armor: 3, wall: 12, spr: 'sts_b_laga', sc: 1, elite: 1, fixed: 1, col: '#566c86', faction: 'dead', world: W, n: '乐加维林',
      tip: '它在睡觉。睡着的时候很硬，也不动；打得够疼它就醒了——醒了会吸走你的力量。',
      intents: [{ t: 5, a: 'drain', v: 0.4, n: '灵魂虹吸', d: '吸走你的卡40%充能' }, { t: 7, a: 'shield', n: '铁壳', d: '护盾' }, { t: 8, a: 'dash', n: '重击', d: '三倍速' }] },
    /* 第 9 夜首领 */
    sts_hexaghost: { final: 1, boss: 1, fixed: 1, hp: 10000, spd: 0.012, armor: 2, wall: 99, spr: 'sts_b_hex', sc: 1, col: '#a7f070', faction: 'abyss', world: W, n: '六火亡魂',
      tip: '六团鬼火一团一团点亮，六团全亮就是一次地狱火：你的卡全熄火，火球砸墙。',
      intents: [{ t: 5, a: 'sts_kindle', n: '点火', d: '点亮一团火，六团全亮就地狱火' }, { t: 6, a: 'sts_kindle', n: '灼烧', d: '点亮一团火' }, { t: 7, a: 'barrage', v: 2, n: '分裂', d: '往墙上砸2下' }] },
    sts_guardian: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.01, armor: 3, wall: 99, spr: 'sts_b_guard', sc: 1, col: '#94b0c2', faction: 'war', world: W, n: '守护者',
      tip: '形态转换：每挨够一截血就切到防御形态，护甲大涨、长出尖刺，打它的卡会被扎掉充能。',
      intents: [{ t: 6, a: 'barrage', v: 3, n: '旋风', d: '往墙上砸3下' }, { t: 8, a: 'drain', v: 0.3, n: '充能', d: '吸走充能' }, { t: 10, a: 'ram', v: 2, n: '猛击', d: '往前冲' }] },
    sts_slimeboss: { final: 1, boss: 1, fixed: 1, hp: 10500, spd: 0.011, armor: 1, wall: 99, spr: 'sts_b_slime', sc: 1, col: '#a7f070', faction: 'swamp', world: W, n: '史莱姆老大',
      tip: '掉到一半血就分裂成一大坨酸液史莱姆和一大坨尖刺史莱姆；大的打死了又裂成中的，中的再裂成小的。',
      intents: [{ t: 6, a: 'brood', v: 4, k: 'sts_acid_s', n: '吐黏液', d: '吐出4坨小史莱姆' }, { t: 9, a: 'drain', v: 0.4, n: '黏住', d: '你的卡充能-40%' }] },
    sts_champ: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.011, armor: 2, wall: 99, spr: 'sts_b_champ', sc: 1, col: '#ffcd75', faction: 'war', world: W, n: '勇者',
      tip: '掉到一半血就「愤怒」：甩掉身上的毒和减速，护甲大涨，走得飞快。',
      intents: [{ t: 7, a: 'duel', n: '挑衅', d: '单挑' }, { t: 6, a: 'barrage', v: 3, n: '处刑', d: '往墙上砍3下' }, { t: 9, a: 'shield', n: '防御姿态', d: '护盾' }] },
    sts_awakened: { final: 1, boss: 1, fixed: 1, hp: 7000, spd: 0.011, armor: 2, wall: 99, spr: 'sts_b_awake', sc: 1, col: '#3b5dc9', faction: 'abyss', world: W, n: '觉醒者',
      tip: '好奇：你每用一次能力卡，它都更硬一点。打倒它，它会从灰里重生成第二形态。',
      intents: [{ t: 6, a: 'barrage', v: 3, n: '劈砍', d: '往墙上砸3下' }, { t: 8, a: 'summon', v: 3, k: 'sts_cultist', n: '召唤邪教徒', d: '招来邪教徒' }] },
    sts_awakened2: { boss: 1, fixed: 1, hp: 6000, spd: 0.013, armor: 3, wall: 99, spr: 'sts_b_awake2', sc: 1, col: '#3b5dc9', faction: 'abyss', world: W, n: '觉醒者·重生',
      tip: '第二形态。翅膀张开了。',
      intents: [{ t: 5, a: 'barrage', v: 4, n: '黑暗回响', d: '往墙上砸4下' }, { t: 9, a: 'drain', v: 0.4, n: '吞噬', d: '吸走充能' }] },
    sts_timeeater: { final: 1, boss: 1, fixed: 1, hp: 11500, spd: 0.011, armor: 2, wall: 99, spr: 'sts_b_clock', sc: 1, col: '#ffcd75', faction: 'abyss', world: W, n: '时间吞噬者',
      tip: '它数着你出了几次手。每数到 25，时间到：你的卡全熄火，它回一截血。',
      intents: [{ t: 8, a: 'wind', v: 4, n: '拨快', d: '小怪快一半' }, { t: 9, a: 'hush', v: 3, n: '涟漪', d: '3秒内卡牌不能互相带动' }] },
    /* 隐藏首领（完整游戏线第 15 夜，三把钥匙都拿到了才出来） */
    sts_heart: { hidden: 'ironclad', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'sts_b_heart', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '腐化之心',
      tip: '无敌：每秒最多掉 3% 的血。心跳一次比一次重。',
      intents: [{ t: 6, a: 'sts_beat', n: '血液射击', d: '往墙上砸，一次比一次多' }, { t: 9, a: 'invert', v: 5, n: '残虐', d: '你最多的元素伤害-30%' }, { t: 8, a: 'summon', v: 4, k: 'sts_byrd', n: '回响', d: '招来小怪' }] },
    sts_heart2: { hidden: 'silent', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'sts_b_heart', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '腐化之心',
      tip: '无敌：每秒最多掉 3% 的血。心跳一次比一次重。',
      intents: [{ t: 6, a: 'sts_beat', n: '血液射击', d: '往墙上砸，一次比一次多' }, { t: 9, a: 'invert', v: 5, n: '残虐', d: '你最多的元素伤害-30%' }, { t: 8, a: 'summon', v: 4, k: 'sts_byrd', n: '回响', d: '招来小怪' }] },
  },

  foesets: {
    spire: {
      n: '尖塔里的怪物', world: W,
      map: {
        slime: 'sts_acid_s', mini: 'sts_spike_s', bug: 'sts_acid_m', bat: 'sts_byrd', skel: 'sts_cultist', golem: 'sts_jawworm', shieldb: 'sts_spheric',
        shaman: 'sts_mystic', drummer: 'sts_gleader', bomber: 'sts_exploder', ghost: 'sts_transient', necro: 'sts_reptomancer', siege: 'sts_mass',
        berserker: 'sts_madgremlin', catapult: 'sts_repulsor', mimic: 'sts_looter', a_brute: 'sts_nob', a_golem: 'sts_sentry', a_lich: 'sts_book', knight: 'sts_lagavulin',
      },
    },
  },

  voices: {
    neow: { img: 'p_neow', c: '#41a6f6', n: '尼奥' },
    sts_merchant: { img: 'p_sts_merchant', c: '#a64ca6', n: '商人' },
  },

  /* ---------------- 备战事件 ---------------- / ---------------- Prep events ---------------- */
  events: {
    /* 尼奥的祝福：第一夜第一站，四行各挑一样（原作的四档） / Neow's blessing: night 1's first stop, four rows like the original */
    sts_neow: {
      ico: 'sts_ev_neow', cat: 'free', w: 0, rar: 0, world: W, n: '尼奥', f: '一头蓝色的大鲸鱼似的东西，闭着眼睛，额头上亮着一点光。它在笑。',
      enter: (cur, api) => {
        const s = api.ws();
        s.neowN = (s.neowN || 0) + 1;
        const up = G.cards.filter((c) => c.tier < 2);
        const small = shuffled([
          { ico: 'r_rampart', label: '最大生命 +6', sub: '城墙上限 +6', act: () => { api.maxWall(6); api.finishStep(); } },
          ...(G.cards.length > 1 ? [{ ico: 'furnace', label: '移除一张牌', sub: '丢掉最左边那张起手卡', act: () => { api.removeCard(firstCard()); api.renderOwned(); api.finishStep(); } }] : []),
          ...(up.length ? [{ ico: 'r_hammer', label: '升级一张牌', sub: '挑一张卡升一品', act: () => { api.choice(cur, '挑一张。', shuffled(up).slice(0, 3).map((c) => api.upOpt(c, api.finishStep))); api.renderPrep(); } }] : []),
        ])[0];
        const mid = shuffled([
          { ico: 'r_purse', label: '获得 12 金', sub: '一袋金币', act: () => { api.gainGold(12); api.finishStep(); } },
          { ico: 'scroll:P', label: '选一张牌', sub: '从 3 张专属卡里挑一张', act: () => { Object.assign(cur, { mode: 'pick', offers: [0, 1, 2].map(() => api.makeOffer((it) => it.hero === G.hero, { free: 1 })) }); api.renderPrep(); } },
          { ico: 'altar', label: '一件普通遗物', sub: '随机一件', act: () => { const r = api.rollGear(1, 0, 0)[0]; if (r) api.gainRelic(r); else api.finishStep(); } },
        ])[0];
        const silver = heroCards(2);
        const big = shuffled([
          { ico: 'altar', label: '一件稀有遗物', sub: '……城墙上限 -5', act: () => { api.maxWall(-5); const r = api.rollGear(1, 2, 2)[0]; if (r) api.gainRelic(r); else api.finishStep(); } },
          { ico: 'r_purse', label: '获得 30 金', sub: '……再带上一张【悔恨】', act: () => { api.gainGold(30); giveCard(api, 'sts_regret'); api.finishStep(); } },
          ...(silver.length ? [{ ico: 'scroll:Y', label: '一张稀有牌', sub: '……丢掉所有金币', act: () => { G.gold = 0; api.updateHUD(); api.addCard(pick(silver), 0); api.renderOwned(); api.finishStep(); } }] : []),
        ])[0];
        const boss = ruleRelics();
        api.choice(cur, s.neowN > 1 ? '“又见面了。”尼奥的声音像潮水，“再来一次吧。”' : '“……醒了？”尼奥的声音像潮水，“我把你从死里拉回来了。挑一样，然后往上爬。”', [
          small,
          mid,
          big,
          ...(boss.length && G.cards.length > 1
            ? [{ ico: 'badge:R', label: '交出起手的东西', sub: '丢掉最左边那张卡，换一件首领遗物', act: () => {
                api.removeCard(firstCard());
                api.renderOwned();
                api.relicChoice(cur, '“拿走吧。有得必有失。”', shuffled(boss).slice(0, 3));
              } }]
            : []),
        ]);
      },
    },
    /* 篝火：休息，或者锻造 / campfire: rest, or smith */
    sts_campfire: {
      ico: 'sts_ev_fire', cat: 'up', w: 4, rar: 0, world: W, n: '篝火', f: '一堆火。坐下来，你会想起很多事。',
      need: () => G.cards.some((c) => c.tier < 2) || (G.wall < G.wallMax && !mv('sts_coffee')),
      enter: (cur, api) => {
        const h = Math.max(1, Math.round(G.wallMax * 0.3));
        const up = shuffled(G.cards.filter((c) => c.tier < 2)).slice(0, 3);
        api.choice(cur, mv('sts_coffee') ? '咖啡的味道还在嘴里。你睡不着。' : '火堆噼啪响。你只有一晚上，干一件事。', [
          ...(mv('sts_coffee') ? [] : [{ ico: 'r_heart', label: '休息', sub: `城墙修 ${Math.min(h, G.wallMax - G.wall)}`, act: () => { api.heal(h); api.finishStep(); } }]),
          ...(up.length
            ? [{ ico: 'r_hammer', label: '锻造', sub: '挑一张卡升一品', act: () => {
                api.choice(cur, '挑一张。', up.map((c) => api.upOpt(c, api.finishStep)));
                api.renderPrep();
              } }]
            : []),
        ]);
      },
    },
    /* 金色神像：拿了就有大石球 / the Golden Idol: take it and the boulder comes */
    sts_goldidol: {
      ico: 'badge:y', cat: 'misc', w: 1.2, rar: 1, minR: 2, world: W, n: '金色神像', f: '一尊金像，搁在石台上，四周干净得不像话。',
      need: () => !has('sts_idol'),
      enter: (cur, api) => {
        api.choice(cur, '神像就在那儿。太容易了。', [
          { ico: 'badge:y', label: '拿走', sub: '得到【金色神像】：每胜一场 +3 金。然后……', act: () => {
            api.gainRelic('sts_idol', true);
            api.choice(cur, '石台陷下去了。身后滚来一颗大石球！', [
              { ico: 'boot:N', label: '冲出去', sub: '得到一张【受伤】', act: () => { giveCard(api, 'sts_injury'); api.finishStep(); } },
              { ico: 'r_hammer', label: '硬扛', sub: `城墙 -${Math.ceil(G.wallMax * 0.25)}`, act: () => { G.wall = Math.max(1, G.wall - Math.ceil(G.wallMax * 0.25)); api.updateHUD(); api.finishStep(); } },
              { ico: 'r_rampart', label: '躲进墙缝', sub: '城墙上限 -4', act: () => { api.maxWall(-4); api.finishStep(); } },
            ]);
            api.renderPrep();
          } },
          { ico: 'boot:g', label: '离开', sub: '转身走', act: () => api.finishStep() },
        ]);
      },
    },
    /* 大鱼：香蕉、甜甜圈、盒子 / Big Fish: banana, donut, box */
    sts_fish: {
      ico: 'sts_ev_fish', cat: 'free', w: 1.5, rar: 0, world: W, n: '大鱼', f: '一条大鱼挂在钩子上晃。旁边摆着三样东西。',
      enter: (cur, api) => {
        const h = Math.max(1, Math.round(G.wallMax / 3));
        api.choice(cur, '“挑一样，”一个声音说，“只能一样。”', [
          { ico: 'drop:Y', label: '香蕉', sub: `城墙修 ${Math.min(h, G.wallMax - G.wall)}`, act: () => { api.heal(h); api.finishStep(); } },
          { ico: 'r_rampart', label: '甜甜圈', sub: '城墙上限 +5', act: () => { api.maxWall(5); api.finishStep(); } },
          { ico: 'chest_m', label: '盒子', sub: '一件遗物……再带上一张【悔恨】', act: () => {
            giveCard(api, 'sts_regret');
            const r = api.rollGear(1, 1)[0];
            if (r) api.gainRelic(r);
            else api.finishStep();
          } },
        ]);
      },
    },
    /* 鬼魂议会：用一半的血换幻灵 / Council of Ghosts: half your HP for Apparitions */
    sts_ghosts: {
      ico: 'sts_ev_ghost', cat: 'misc', w: 1, rar: 1, minR: 3, world: W, n: '鬼魂议会', f: '几个半透明的影子围着你转。“加入我们吧。”',
      need: () => G.wallMax >= 16,
      enter: (cur, api) => {
        const lose = Math.round(G.wallMax * 0.3);
        api.choice(cur, '“只要一点点……你的血肉。”', [
          { ico: 'sts_apparition', label: '接受', sub: `城墙上限 -${lose}，得到 2 张【幻灵】`, act: () => {
            api.maxWall(-lose);
            giveCard(api, 'sts_apparition');
            giveCard(api, 'sts_apparition');
            api.renderOwned();
            api.finishStep();
          } },
          { ico: 'boot:g', label: '拒绝', sub: '影子散了', act: () => api.finishStep() },
        ]);
      },
    },
    /* 牧师：花钱治疗，或者净化一张牌 / the Cleric: pay to heal, or to purify a card */
    sts_cleric: {
      ico: 'sts_ev_cleric', cat: 'misc', w: 2, rar: 0, world: W, n: '牧师', f: '一个蓝色的小东西，戴着尖帽子，手里攥着一根比它还高的法杖。',
      need: () => G.gold >= 5 + 3 * (ws().purgeN || 0) && (G.cards.length > 1 || G.wall < G.wallMax),
      enter: (cur, api) => {
        const s = api.ws();
        const price = 5 + 3 * (s.purgeN || 0);
        const heal = 4;
        const list = [...G.cards].sort((a, b) => (ITEMS[b.key].noSell ? 1 : 0) - (ITEMS[a.key].noSell ? 1 : 0)).slice(0, 4);
        const purge = (c: Card) => ({
          card: c, label: `净化【${ITEMS[c.key].n}】`, sub: `${price} 金`,
          act: () => {
            if (G.gold < price) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= price;
            s.purgeN = (s.purgeN || 0) + 1;
            if (c.key === 'sts_parasite') api.maxWall(-3);
            api.removeCard(c);
            api.renderOwned();
            api.updateHUD();
            api.SFX.play('merge');
            api.finishStep();
          },
        });
        api.choice(cur, `“治疗 ${heal} 金。净化一张 ${price} 金，每回都比上回贵一点。”`, [
          ...(G.wall < G.wallMax && G.gold >= heal
            ? [{ ico: 'r_heart', label: '治疗', sub: `${heal} 金，城墙修满一半`, act: () => { G.gold -= heal; api.heal(Math.ceil(G.wallMax / 2)); api.updateHUD(); api.finishStep(); } }]
            : []),
          ...(G.cards.length > 1 ? list.map(purge) : []),
          { ico: 'boot:g', label: '离开', sub: '', act: () => api.finishStep() },
        ]);
      },
    },
    /* 吸血鬼：把打击都换成咬 / the Vampires: swap all your Strikes for Bites */
    sts_vampires: {
      ico: 'sts_ev_vamp', cat: 'misc', w: 1, rar: 1, minR: 3, world: W, n: '吸血鬼（们）', f: '几个穿斗篷的人朝你鞠躬。“加入我们。永远不用再怕死。”',
      need: () => G.cards.some((c) => c.key === 'sts_strike_r' || c.key === 'sts_strike_g') && G.wallMax >= 16,
      enter: (cur, api) => {
        const lose = Math.round(G.wallMax * 0.3);
        const st = G.cards.filter((c) => c.key === 'sts_strike_r' || c.key === 'sts_strike_g');
        api.choice(cur, '“只是一小口。”', [
          { ico: 'sts_bite', label: '接受', sub: `城墙上限 -${lose}，${st.length} 张【打击】全换成【咬】`, act: () => {
            api.maxWall(-lose);
            for (const c of st) {
              const t = c.tier;
              api.removeCard(c);
              api.addCard('sts_bite', t);
            }
            api.renderOwned();
            api.finishStep();
          } },
          { ico: 'boot:g', label: '拒绝', sub: '他们叹了口气，退回黑暗里', act: () => api.finishStep() },
        ]);
      },
    },
    /* 配对游戏：翻两张，一样就归你 / the Match and Keep game */
    sts_match: {
      ico: 'dice', cat: 'misc', w: 1.2, rar: 1, minR: 2, world: W, n: '配对游戏', f: '一个小桌，六张牌扣着。“翻两张。一样就拿走。只能翻四回。”',
      enter: (cur, api) => {
        const pool = [
          { n: '一袋金币', s: '+6 金', give: () => api.gainGold(6) },
          { n: '一颗草莓', s: '城墙上限 +3', give: () => api.maxWall(3) },
          { n: '一张专属卡', s: '随机一张铜卡', give: () => { const k = heroCards(0); if (k.length) api.addCard(pick(k), 0); } },
          { n: '一张【腐朽】', s: '诅咒', give: () => giveCard(api, 'sts_decay') },
        ];
        const deal = shuffled(shuffled(pool).slice(0, 3).flatMap((x) => [x, x]));
        const st = { open: [] as number[], got: [] as number[], left: 4, log: [] as string[] };
        /* 没配上的两张亮一会儿再扣回去 / an unmatched pair stays face-up for a moment */
        const after = (f: () => void, wait: boolean) => (wait ? setTimeout(f, 700) : f());
        const show = () => {
          const opts = deal
            .map((x, i) => ({ x, i }))
            .filter(({ i }) => !st.got.includes(i) && !st.open.includes(i))
            .map(({ i }) => ({
              ico: 'dice', label: `第 ${i + 1} 张`, sub: '扣着的',
              act: () => {
                if (st.open.length >= 2 || st.open.includes(i) || st.got.includes(i)) return;
                st.open.push(i);
                if (st.open.length === 2) {
                  const [a, b] = st.open;
                  const hit = deal[a] === deal[b];
                  st.left--;
                  if (hit) {
                    st.got.push(a, b);
                    deal[a].give();
                    st.log.push(deal[a].n);
                    api.SFX.play('merge');
                  } else api.SFX.play('bad');
                  api.choice(cur, `第 ${a + 1} 张是「${deal[a].n}」，第 ${b + 1} 张是「${deal[b].n}」。${hit ? '一对！' : '不一样。'}`, []);
                  after(() => {
                    st.open = [];
                    if (!st.left || st.got.length === deal.length)
                      api.reward(cur, st.log.length ? `你拿走了：${st.log.join('、')}。` : '一对都没翻着。小桌后面的人笑出了声。', () => {});
                    else show();
                    api.renderPrep();
                  }, !hit);
                } else show();
                api.renderPrep();
              },
            }));
          const o = st.open.length ? `第 ${st.open[0] + 1} 张是「${deal[st.open[0]].n}」（${deal[st.open[0]].s}）。再翻一张。` : '';
          api.choice(cur, `${o}还能翻 ${st.left} 回。`, opts);
        };
        show();
      },
    },
    /* 图书馆：读书挑卡，或者睡一觉 / the Library: read for a card, or sleep */
    sts_library: {
      ico: 'book:N', cat: 'free', w: 1.5, rar: 0, minR: 3, world: W, n: '图书馆', f: '一座安静的图书馆，书一直堆到看不见的地方。',
      enter: (cur, api) => {
        api.choice(cur, '这儿很安静。', [
          { ico: 'book:N', label: '读书', sub: '从 3 张专属卡里挑一张', act: () => {
            Object.assign(cur, { mode: 'pick', offers: [0, 1, 2].map(() => api.makeOffer((it) => it.hero === G.hero, { free: 1 })) });
            api.renderPrep();
          } },
          ...(mv('sts_coffee') ? [] : [{ ico: 'r_heart', label: '睡觉', sub: '城墙修满', act: () => { api.heal(G.wallMax); api.finishStep(); } }]),
        ]);
      },
    },
  },

  /* ---------------- 人物 ---------------- / ---------------- Heroes ---------------- */
  heroes: {
    ironclad: {
      def: {
        world: W, col: '#e43b44', portrait: 'p_ironclad', wall: 34, gold: 8, start: [],
        n: '铁甲战士', title: '铁卫的幸存者', tag: '擅长力量与格挡', desc: '铁卫军最后一个活下来的士兵。【力量】让每张输出卡的每一下都更疼；格挡让城墙多扛几下；打完一场，燃烧之血会把伤口烧合。',
        intro: '为了复仇，他卖掉了自己的灵魂。',
      },
      sig: { n: '燃烧之血', d: '每守住一夜，城墙修 4。', m: { regen: 4 } },
      awaken: [
        { id: 'ironclad_a', n: '撕裂', d: '城墙每挨一下（每半秒最多一次），【力量】+1', m: { strWall: 1 } },
        { id: 'ironclad_b', n: '黑暗之血', d: '燃烧之血变黑：每夜多修 4，开战就有 2 点力量', m: { regen: 4, strStart: 2 } },
      ],
      kits: [
        { cards: [['sts_strike_r', 0], ['sts_bash', 0]], path: 'str', n: '打击痛击', d: '原作的起手：先痛击，再打击。' },
        { cards: [['sts_ironwave', 0], ['sts_defend_r', 0]], path: 'block', n: '一攻一防', d: '先叠格挡，再拿格挡砸人。' },
      ],
      paths: [
        { id: 'str', mast: 0, cards: ['sts_strike_r', 'sts_bash', 'sts_twin', 'sts_heavy', 'sts_perfect', 'sts_inflame', 'sts_limit', 'sts_demon', 'sts_bloodlet', 'sts_whirl', 'sts_reaper', 'sts_feed'], n: '力量', d: '攒力量，每一下都更疼' },
        { id: 'block', mast: 1, cards: ['sts_defend_r', 'sts_shrug', 'sts_ironwave', 'sts_bodyslam', 'sts_entrench', 'sts_barricade'], n: '格挡', d: '叠格挡，用格挡砸人' },
      ],
      story: ironcladStory,
    },
    silent: {
      def: {
        world: W, col: '#38b764', portrait: 'p_silent', wall: 26, gold: 12, start: [],
        n: '静默猎手', title: '迷雾之地的猎人', tag: '擅长中毒与小刀', desc: '从迷雾之地来的猎手。小型卡出手越勤，【蛇之戒指】甩出的小刀越多；毒一层一层叠上去，再用催化剂翻倍。',
        intro: '她不说话。她的刀替她说。',
      },
      sig: { n: '蛇之戒指', d: '开战时所有卡充能 15%。小型输出卡每出手 4 次，朝最前面的敌人甩一把小刀（那张卡伤害的 60%，吃力量）。', m: { startCharge: 0.15, knifeEvery: 4 } },
      awaken: [
        { id: 'silent_a', n: '刀刃大师', d: '每 3 次就甩一把小刀', m: { knifeEvery: -1 } },
        { id: 'silent_b', n: '淬毒', d: '小刀附带 4 点中毒（夜越深越多）', m: { knifePoison: 4 } },
      ],
      kits: [
        { cards: [['sts_neutral', 0], ['sts_pstab', 0]], path: 'poison', n: '中和毒刺', d: '先削弱，再下毒。' },
        { cards: [['sts_strike_g', 0], ['sts_bladedance', 0]], path: 'shiv', n: '打击刀舞', d: '出手越勤，小刀越多。' },
      ],
      paths: [
        { id: 'poison', mast: 0, cards: ['sts_neutral', 'sts_pstab', 'sts_deadly', 'sts_catalyst', 'sts_fumes', 'sts_corpse', 'sts_flask'], n: '毒', d: '叠毒、翻倍、尸爆' },
        { id: 'shiv', mast: 1, cards: ['sts_strike_g', 'sts_defend_g', 'sts_bladedance', 'sts_infinite', 'sts_accuracy', 'sts_afterimage', 'sts_daggerspray', 'sts_backstab', 'sts_thousand'], n: '小刀', d: '出手越勤，小刀越多' },
      ],
      hooks: {
        use: (x) => {
          const c = x.c as Card;
          const it = ITEMS[c.key];
          if (c.size !== 1 || !(it.dmg > 0)) return;
          const b = bt();
          b.flags.kc = (b.flags.kc || 0) + 1;
          if (b.flags.kc % Math.max(2, mv('knifeEvery')) === 0) shiv(c);
        },
      },
      story: silentStory,
    },
  },

  story: {},

  /* ---------------- 写代码的效果 ---------------- / ---------------- Code-based effects ---------------- */
  hooks: {
    cards: {
      sts_limit: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            const s = bt().flags.str || 0;
            if (s > 0) addStr(Math.min(s, 8 * unit() * (1 + 0.5 * stepOf(c))));
          },
        },
      },
      sts_demon: { on: { use: (c, x) => { if (x.c === c) addStr(2 + stepOf(c)); } } },
      sts_bloodlet: {
        on: {
          use: (c, x) => {
            if (x.c !== c || G.wall <= 3) return;
            damageWall(1, c.ox || world.W / 2);
            if (bt().over) return;
            for (const n of c.nb || []) chargeCard(n, 0.5 + 0.15 * stepOf(c), c);
          },
        },
      },
      sts_reaper: {
        on: {
          kill: (c, x) => {
            if (x.src !== c || (bt().flags.reapN || 0) >= 4) return;
            bt().flags.reapN = (bt().flags.reapN || 0) + 1;
            G.wall = Math.min(G.wallMax, G.wall + 1);
            view.hud();
          },
          start: () => (bt().flags.reapN = 0),
        },
      },
      sts_feed: {
        on: {
          kill: (c, x) => {
            const s = ws();
            if (x.src !== c || (s.feedN || 0) >= 8) return;
            s.feedN = (s.feedN || 0) + 1;
            G.wallMax += 1;
            G.wall += 1;
            view.cardFx(c, 'pop');
            view.hud();
          },
        },
      },
      sts_bite: {
        on: {
          kill: (c, x) => {
            if (x.src !== c || (bt().flags.biteN || 0) >= 3) return;
            bt().flags.biteN = (bt().flags.biteN || 0) + 1;
            G.wall = Math.min(G.wallMax, G.wall + 1);
            view.hud();
          },
          start: () => (bt().flags.biteN = 0),
        },
      },
      sts_entrench: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            addShield(Math.min(bt().shield, 30 + 15 * stepOf(c)));
          },
        },
      },
      sts_barricade: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            const s = bt().shield;
            if (s > 0) addShield(s * (0.08 + 0.04 * stepOf(c)));
          },
        },
      },
      sts_bandage: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            G.wall = Math.min(G.wallMax, G.wall + 1 + stepOf(c));
            view.hud();
          },
        },
      },
      sts_catalyst: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            const cap = 12 * unit() * (1 + 0.5 * stepOf(c));
            for (const e of targets())
              if (e.poisonT > 0) {
                e.poisonD += Math.min(e.poisonD, cap);
                e.poisonT = Math.max(e.poisonT, 3);
                view.ring(ex(e), ey(e) - 6, 2, 10 * K(), '#a64ca6', 0.3);
              }
          },
        },
      },
      sts_corpse: {
        on: {
          kill: (c, x) => {
            const e = x.e as Enemy;
            if (!x.poisoned || e.poisonSrc !== c) return;
            const amt = Math.min(e.maxHp, 40 * unit() * (1 + 0.5 * stepOf(c)));
            const ns = near(e, 24 * K());
            view.ring(ex(e), ey(e) - 4, 2, 24 * K(), '#7ddc5f', 0.35);
            for (const o of ns) hurt(o, amt, c, false, { k: 'fx', splash: 1 });
          },
        },
      },
      sts_infinite: { on: { use: (c, x) => { if (x.c === c) shiv(c, (3 + 1.5 * G.round) * (1 + 0.5 * stepOf(c))); } } },
      sts_afterimage: {
        on: {
          use: (c, x) => {
            if (x.c === c || ITEMS[(x.c as Card).key].passive) return;
            addShield((1 + 0.5 * stepOf(c)) * unit());
          },
        },
      },
      sts_thousand: {
        on: {
          use: (c, x) => {
            if (x.c === c) return;
            const a = (1 + 0.6 * G.round) * (1 + 0.5 * stepOf(c));
            for (const e of targets()) hurt(e, a, c, false, { k: 'fx', splash: 1 });
          },
        },
      },
    },
    relics: {
      sts_spoon: {
        use: (_n, x) => {
          const c = x.c as Card;
          if (c.ammo === 0 && rand() < 0.25) later(0.3, () => reload(c, 1, null));
        },
      },
      sts_ink: {
        use: () => {
          const b = bt();
          b.flags.inkN = (b.flags.inkN || 0) + 1;
          if (b.flags.inkN % 10) return;
          const c = pick(boardCards().filter((o) => !ITEMS[o.key].passive) as Card[]);
          if (c) chargeCard(c, 1, null);
        },
      },
      sts_pen: {
        use: () => {
          const b = bt();
          b.flags.penN = (b.flags.penN || 0) + 1;
          if (b.flags.penN % 10) return;
          const c = boardCards()
            .filter((o) => ITEMS[o.key].dmg > 0)
            .sort((a, z) => stats(z, b.t).total - stats(a, b.t).total)[0];
          if (c) c.anvil = Math.max(c.anvil || 0, 1);
        },
      },
    },
    enemies: {
      /* 邪教徒念 4~7 秒咒（仪式），念完冲 / cultists chant for 4–7 s (Ritual), then rush */
      sts_cultist: {
        spawn: (e) => (M(e).chant = 4 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          if (m.chant == null) return;
          m.chant -= dt;
          if (m.chant > 0) return;
          m.chant = null;
          e.rushT = 6;
          view.num(ex(e), ey(e) - 12, '咔咔！', '#ffcd75', 1);
        },
      },
      /* 大颚虫：每 5 秒吼一声缩起来 / the Jaw Worm: Bellow every 5 s */
      sts_jawworm: {
        spawn: (e) => (M(e).t = 2 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          m.t -= dt;
          if (m.t > 0) return;
          m.t = 5;
          e.hardT = 2;
        },
      },
      /* 地精大块头：你每用一次技能卡，它就更凶 / Gremlin Nob: Enrage whenever you play a Skill */
      sts_nob: {
        on: {
          use: (e, x) => {
            const c = x.c as Card;
            if (!c || ITEMS[c.key].dmg > 0) return;
            const m = M(e);
            if ((m.n || 0) >= 12) return;
            m.n = (m.n || 0) + 1;
            e.armor += 0.5;
            e.dashT = Math.max(e.dashT, 0.4);
            if (m.n % 4 === 0) view.num(ex(e), ey(e) - 16, '激怒！', '#e43b44', 2);
          },
        },
      },
      /* 乐加维林：睡着不动、伤害减半，挨够一截血就醒 / Lagavulin: asleep, still and half damage; wakes after enough hurt */
      sts_lagavulin: {
        spawn: (e) => {
          const m = M(e);
          m.sleep = 1;
          m.hurt = 0;
          e.holdT = 999;
        },
        step: (e) => {
          const m = M(e);
          if (!m.sleep) return;
          e.it = Math.max(e.it, 1);
          if (bt().t - e.bornT > 14 || e.y > 0.4) wake(e);
        },
        hurt: (e, a) => {
          const m = M(e);
          if (!m.sleep) return a;
          m.hurt += a * 0.5;
          if (m.hurt > e.maxHp * 0.2) wake(e);
          return a * 0.5;
        },
      },
      /* 守护者：每挨 18% 的血切到防御形态 8 秒 / the Guardian: Mode Shift into Defensive Mode for 8 s every 18% of HP lost */
      sts_guardian: {
        hurt: (e, a, x) => {
          const m = M(e);
          const t = bt().t;
          if ((m.shellT || 0) > t) {
            /* 尖刺：打它的卡被扎掉一点充能 / Sharp Hide: the attacking card loses a little charge */
            if (x.src && !x.o?.burnTick && !x.o?.poisonTick) x.src.charge = Math.max(0, x.src.charge - 0.05);
            return Math.max(1, a - 12);
          }
          m.lost = (m.lost || 0) + a;
          if (m.lost >= e.maxHp * 0.18) {
            m.lost = 0;
            m.shellT = t + 8;
            view.banner('防御形态', '#94b0c2');
            view.ring(ex(e), ey(e) - 10, 4, 30 * K(), '#94b0c2', 0.5);
          }
          return a;
        },
      },
      /* 史莱姆老大：掉到一半血就分裂 / the Slime Boss: splits at half HP */
      sts_slimeboss: {
        hurt: (e, a) => {
          const m = M(e);
          if (m.rest || e.hp - a > e.maxHp / 2) return a;
          m.rest = Math.max(e.maxHp * 0.1, e.hp - a);
          view.banner('分裂', '#a7f070');
          return e.hp + e.shield + 1;
        },
        die: (e) => {
          const rest = M(e).rest;
          if (!rest) return;
          for (const [k, dx] of [['sts_acid_l', -0.12], ['sts_spike_l', 0.12]] as [string, number][]) {
            const s = spawn(k, Math.min(0.9, Math.max(0.1, e.x + dx)), e.y);
            s.x0 = s.x;
            s.hp = s.maxHp = rest / 2;
          }
        },
      },
      /* 勇者：一半血时愤怒，甩掉负面状态 / the Champ: Anger at half HP, shakes off debuffs */
      sts_champ: {
        hurt: (e, a) => {
          const m = M(e);
          if (m.mad || e.hp - a > e.maxHp / 2) return a;
          m.mad = 1;
          e.poisonT = e.burnT = e.slowT = e.frzT = e.vulnT = 0;
          e.armor += 4;
          e.rushT = 999;
          view.banner('勇者愤怒了', '#ffcd75');
          view.shake(4);
          return a;
        },
      },
      /* 觉醒者：好奇（你用能力卡它就更硬），死了重生 / the Awakened One: Curiosity, then rebirth */
      sts_awakened: {
        on: {
          use: (e, x) => {
            const c = x.c as Card;
            if (!c || ITEMS[c.key].dmg > 0) return;
            const m = M(e);
            if ((m.n || 0) >= 10) return;
            m.n = (m.n || 0) + 1;
            e.armor += 0.4;
          },
        },
        die: (e) => {
          view.banner('觉醒者重生了', '#3b5dc9');
          view.shake(5);
          const s = spawn('sts_awakened2', e.x, Math.max(0.05, e.y - 0.05));
          s.x0 = s.x;
        },
      },
      /* 时间吞噬者：数你出了几次手，每 25 次时间到 / the Time Eater: counts your card uses; every 25, time's up */
      sts_timeeater: {
        on: {
          use: (e) => {
            const m = M(e);
            m.n = (m.n || 0) + 1;
            if (m.n % 5 === 0 && m.n % 25) view.num(ex(e), ey(e) - 28, `${m.n % 25} / 25`, '#ffcd75', 1);
            if (m.n % 25) return;
            view.banner('时间到', '#ffcd75');
            INTENTS.snuff(e, undefined, undefined);
            INTENTS.rebuild(e, 0.04, undefined);
          },
        },
      },
      sts_heart: { hurt: (e, a) => capHurt(e, a) },
      sts_heart2: { hurt: (e, a) => capHurt(e, a) },
    },
  },
};

function wake(e: Enemy) {
  const m = M(e);
  if (!m.sleep) return;
  m.sleep = 0;
  e.holdT = 0;
  e.it = 1.5;
  view.banner('乐加维林醒了', '#566c86');
  view.shake(4);
}

/** 腐化之心：无敌，每秒最多掉 3% 的血 / the Corrupt Heart: Invincible, at most 3% HP lost per second */
function capHurt(e: Enemy, a: number) {
  const m = M(e);
  const t = bt().t;
  if (t - (m.w0 ?? -9) >= 1) {
    m.w0 = t;
    m.got = 0;
  }
  const left = e.maxHp * 0.03 - m.got;
  if (left <= 0) {
    if (rand() < 0.2) view.num(ex(e), ey(e) - 16, '无敌', '#e43b44', 1);
    return 0;
  }
  const d = Math.min(a, left);
  m.got += d;
  return d;
}

export default pack;
