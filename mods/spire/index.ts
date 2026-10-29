/* 倒悬塔：长夜里从云里倒长下来一座塔，塔尖戳在城外的荒地上。每晚塔里的东西顺着塔身爬下来。
 * 两个新人物各带一个世界：血誓武者赤誓（力量、护盾）和猎手青棘（中毒、飞刀）。
 * 这个世界有自己的敌人套、四个第九夜首领、两个隐藏首领、诅咒卡、塔脚下的石脸、篝火、金色神像、配对游戏……
 * 剧情文字在 story.ts，像素图由 art.py 生成到 sprites.ts。
 * The Inverted Spire: in the long night a tower grew down out of the clouds, its tip stabbing the wasteland beyond the wall. Every night what lives in it climbs down.
 * Two new heroes, each playing in this world: the blood-oathed Chishi (strength, shields) and the hunter Qingji (poison, knives).
 * The world has its own enemy set, four night-9 bosses, two hidden bosses, curse cards, the Stone Face at the tower's foot, campfires, a golden idol, a match game…
 * Story text is in story.ts; sprites are generated into sprites.ts by art.py.
 */
import type { ModPack, ModEvent } from '../../src/mod/types';
import type { Card } from '../../src/game/state';
import type { Enemy } from '../../src/sim/types';
import { G } from '../../src/game/state';
import { ITEMS } from '../../src/data/cards';
import { mv } from '../../src/game/mods';
import { boardCards, stepOf, stats } from '../../src/game/cards';
import { B, bt, later, front, near, targets } from '../../src/sim/battle';
import { hurt, chargeCard, addShield, reload } from '../../src/sim/combat';
import { damageWall, spawn, INTENTS } from '../../src/sim/enemies';
import { view } from '../../src/sim/view';
import { world, K, ex, ey } from '../../src/sim/world';
import { rand, pick, shuffled } from '../../src/core/rng';
import sprites from './sprites';
import { worldStory, chishiStory, qingjiStory } from './story';
import { ws } from '../../src/game/world';

const W = 'spire';
const inBattle = () => !!B && !B.over && G.phase === 'battle';
const M = (e: Enemy) => (e.m ||= {});
/** 夜越深越值钱的单位：第 1~3 夜 1，每 4 夜 +1 / a unit that grows with the night: 1 on nights 1–3, +1 every 4 nights */
const unit = () => 1 + Math.floor(G.round / 4);
const curses = (k: string) => G.cards.filter((c) => c.key === k).length;

/* ---------------- 力量（赤誓） ---------------- / ---------------- Strength (Chishi) ---------------- */
const str = () => (inBattle() ? bt().flags.str || 0 : mv('strStart'));
function addStr(n: number) {
  const b = bt();
  b.flags.str = (b.flags.str || 0) + n;
  b.flags.strGot = (b.flags.strGot || 0) + n;
  view.num(world.W / 2, world.H - 18, `力量 ${b.flags.str}`, '#ff5a5a', 1);
  /* 鸟面瓮：每攒 3 点力量修 1 点墙 / Bird-faced Urn: every 3 strength gained mends 1 wall */
  if (G.relics.includes('sp_urn') && Math.floor(b.flags.strGot / 3) > (b.flags.urnN || 0)) {
    b.flags.urnN = Math.floor(b.flags.strGot / 3);
    G.wall = Math.min(G.wallMax, G.wall + 1);
    view.hud();
  }
}

/* ---------------- 飞刀（青棘） ---------------- / ---------------- Knives (Qingji) ---------------- */
function knife(c: Card) {
  const b = bt();
  const e = front();
  if (!e) return;
  const amt = stats(c, b.t).total * 0.6;
  b.flags.knives = (b.flags.knives || 0) + 1;
  view.bolt([[c.ox || world.W / 2, world.H - 4], [ex(e), ey(e) - 4]], '#e3e9f0', 0.12, true);
  const p = mv('knifePoison');
  later(0.08, () => hurt(e, amt, c, false, { k: 'fx', ...(p ? { poison: p * unit(), poisonDur: 3 } : {}) }));
}

/* ---------------- 事件里常用的几样 ---------------- / ---------------- Helpers used by events ---------------- */
type Api = Parameters<ModEvent['enter']>[1];
const heroCards = (t: number) => Object.keys(ITEMS).filter((k) => ITEMS[k].hero === G.hero && ITEMS[k].t === t && !ITEMS[k].noPool);
function giveCurse(api: Api, k: string) {
  if (!api.addCard(k, 0)) api.toast(`没地方放【${ITEMS[k].n}】，它挤在门口走了`);
}

const pack: ModPack = {
  id: 'spire',
  name: '倒悬塔',
  author: '守夜人工坊',
  version: '1.0.0',
  desc: '一座塔从云里倒着长下来。两个新守夜人、整套新的敌人和首领、诅咒卡、石脸和篝火。',
  sprites: {
    ...sprites,
    /* 换色：拿原版的图改颜色 / recolors of base sprites */
    sp_acid: { from: 'slime', swap: { l: 'Y', G: 'N' } },
    sp_crow: { from: 'bat', swap: { p: 'd', P: 's', Y: 'R' } },
    sp_acidmini: { from: 'mini', swap: { l: 'Y', G: 'N' } },
    sp_sentinel: { from: 'golem', swap: { g: 'c', s: 'b', G: 'C' } },
    sp_crab: { from: 'shieldb', swap: { c: 'R', Y: 'w' } },
    sp_weaver: { from: 'shaman', swap: { t: 'p', G: 'P', l: 'C' } },
    sp_hornrat: { from: 'drummer', swap: { G: 'N', R: 'p' } },
    sp_faceless: { from: 'ghost', swap: { C: 'w', b: 'd' } },
    sp_gatherer: { from: 'necro', swap: { p: 'e', P: 'r', l: 'Y' } },
    sp_madman: { from: 'berserker', swap: { R: 'P', r: 'p' }, flip: 1 },
    sp_spear: { from: 'catapult', swap: { n: 's', x: 'd', N: 'g' } },
    sp_chest: { from: 'chest_m', swap: { n: 'p', N: 'P' } },
    sp_chestling: { from: 'mimic', swap: { n: 'p', N: 'P', R: 'l' } },
    sp_e_nob: { from: 'e_brute', swap: { R: 'G', r: 't' }, flip: 1 },
    sp_e_sentry: { from: 'e_golem', swap: { N: 'c', n: 'b', y: 'C' } },
    sp_e_book: { from: 'e_lich', swap: { P: 'N', p: 'n' } },
    sp_b_rust: { from: 'b_knight', swap: { P: 'N', p: 'n', s: 'n', g: 'N' } },
  },

  /* ---------------- 自己的修正项（天性、觉醒、遗物用） ---------------- / ---------------- Own modifier keys ---------------- */
  mods: {
    strWall: { n: '城墙每挨一下，力量 +1' },
    strMul: { n: '力量的效果', show: 1 },
    strStart: { n: '开战时力量', show: 0 },
    knifeEvery: { n: '小型输出卡每出手几次甩一把飞刀', show: 0, inv: 1 },
    knifePoison: { n: '飞刀附带中毒', show: 0 },
    sp_bell: { n: '每出手 10 次，随机一张输出卡下一下必定暴击' },
    sp_spoon: { n: '弹药卡打空时，25% 装回一发' },
    sp_urn: { n: '每攒 3 点力量，城墙修 1 点' },
    sp_kunai: { n: '每击杀 10 个敌人，所有小型卡充能 30%' },
    sp_pen: { n: '每出手 10 次，伤害最高的卡下一下 +100%' },
  },

  worlds: {
    spire: {
      n: '倒悬塔',
      d: '塔从云里倒着长下来，塔尖戳在城外。塔里的东西每晚往下爬。',
      foeSet: 'spire',
      noEvents: ['spring', 'job', 'bank', 'refugee', 'camp', 'pilgrim'],
      firstDoors: ['sp_face', 'shop', 'field'],
      rename: {
        events: {
          shop: { n: '斗篷商人', f: '兜帽底下一片黑，只有两点眼睛在亮。他不讲价。' },
          field: { n: '攀塔者的遗骸', f: '上一个爬塔的人留下的东西，还能用。' },
          chest: { n: '塔缝里的箱子' },
          altar: { n: '无名祭坛' },
        },
        relics: {
          gem_red: { n: '红钥匙', ico: 'gem:R' },
          gem_blue: { n: '蓝钥匙', ico: 'gem:c' },
          gem_green: { n: '绿钥匙', ico: 'gem:G' },
        },
      },
      story: worldStory,
      hooks: {
        /* 诅咒卡：在手里就生效，不用上棋盘 / curses take effect while held, on the board or not */
        start: () => {
          for (let i = 0; i < curses('sp_doubt'); i++) {
            const c = pick(boardCards().filter((o) => o.frozen <= 0 && o.key !== 'sp_doubt') as Card[]);
            if (!c) break;
            c.frozen = 3;
            view.cardFlag(c, 'frozen', true);
          }
          const rot = curses('sp_rot');
          if (rot) later(0.6, () => damageWall(rot, world.W / 2));
        },
      },
      night: () => {
        const g = curses('sp_greed');
        if (g && G.round > 1) G.gold = Math.max(0, G.gold - 2 * g);
      },
      note: () => {
        const n = G.cards.filter((c) => ITEMS[c.key].noSell && ITEMS[c.key].world === W).length;
        return n ? `<b>诅咒 ×${n}</b>：清卡人能帮你弄掉。` : '';
      },
    },
  },

  /* ---------------- 卡牌 ---------------- / ---------------- Cards ---------------- */
  cards: {
    /* 赤誓 · 血 */
    sp_brokenblade: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.2, dmg: 3.5, multi: 2, fx: 'knife', kind: 'weapon', hero: 'chishi',
      n: '断刃', d: '连砍两下。每一下都吃【力量】，所以它最吃力量。', f: '剑断在塔里第三层。剩下这半截，他用了七年。' },
    sp_bleed: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 3.2, dmg: 0, fx: 'none', kind: 'gadget', hero: 'chishi', local: 1,
      n: '放血', d: '城墙 -1，【力量】+2（每升一品再 +1）。城墙只剩 2 点时不放。', f: '血誓的规矩：先流自己的。' },
    sp_ragewave: { size: 2, tag: 'blade', t: 1, up: 'mix', cd: 2.4, dmg: 14, fx: 'sweep', kind: 'weapon', hero: 'chishi', local: 1,
      n: '怒涛', d: '横扫一排。【力量】对它算两倍。', f: '血往头上涌的时候，手就不听使唤了。他也不想让它听。' },
    sp_bloodoath: { size: 1, tag: 'blade', t: 1, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'chishi', local: 1,
      n: '血誓书', d: '城墙每挨一下，【力量】+1（每秒最多两次）。', f: '一页纸，按满了指印。全是他自己的。' },
    sp_allin: { size: 3, tag: 'blade', t: 2, up: 'dmg', cd: 3.6, dmg: 30, fx: 'axe', kind: 'weapon', hero: 'chishi', ammo: 1, bossMul: 0.3,
      n: '孤注一掷', d: '每场只砍一下。城墙每少 1 点，伤害 +3（夜越深越多）。对精英首领 +30%。', f: '墙快塌的时候，他反而笑了。' },
    /* 赤誓 · 铁 */
    sp_buckler: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 2.2, dmg: 0, fx: 'none', kind: 'gadget', hero: 'chishi', shieldGain: 3,
      n: '圆盾', d: '给城墙加护盾。', f: '盾面上的凹坑，一个一个都数得出来是哪晚留的。' },
    sp_shieldbash: { size: 2, tag: 'blade', t: 1, up: 'mix', cd: 2.6, dmg: 12, fx: 'rock', kind: 'weapon', hero: 'chishi', shieldDmg: 0.6,
      n: '盾击', d: '拿盾砸过去。城墙护盾越厚砸得越疼。', f: '盾也是兵器。谁说盾只能挡？' },
    sp_bulwark: { size: 2, tag: 'mech', t: 1, up: 'cd', cd: 5, dmg: 0, fx: 'none', kind: 'gadget', hero: 'chishi', local: 1,
      n: '坚壁', d: '城墙护盾翻一倍（一次最多加 30，每升一品再多 15）。', f: '一面墙后面再砌一面墙。' },
    sp_ironheart: { size: 1, tag: 'blade', t: 0, up: 'dmg', cd: 0, dmg: 9, fx: 'knife', kind: 'weapon', passive: 1, hero: 'chishi', local: 1,
      n: '铁心', d: '不会自己出手。每有一张卡给城墙加护盾，它充能 50%。', f: '心跳得很慢，很稳，像打铁。' },
    sp_demon: { size: 2, tag: 'blade', t: 2, up: 'cd', cd: 6, dmg: 0, fx: 'none', hero: 'chishi', local: 1,
      n: '恶魔形态', d: '开战时城墙 -3。之后每 6 秒【力量】+2（每升一品再 +1）。', f: '他第一次这样做的时候，石脸笑出了声。' },

    /* 青棘 · 毒 */
    sp_dart: { size: 1, tag: 'poison', t: 0, up: 'dmg', cd: 1.4, dmg: 3, fx: 'sting', poison: 3, kind: 'weapon', hero: 'qingji',
      n: '毒镖', d: '一镖下去，目标中毒。', f: '镖尖上的毒，是塔下第一层的蘑菇熬的。' },
    sp_fumes: { size: 2, tag: 'poison', t: 1, up: 'dmg', cd: 3, dmg: 5, fx: 'rain', poison: 3, perPoisoned: 0.06, kind: 'potion', hero: 'qingji',
      n: '毒雨', d: '毒雨落一片。射程内每有一个中毒的敌人，伤害 +6%。', f: '她把瓶子往上一扔，自己先退了三步。' },
    sp_catalyst: { size: 1, tag: 'poison', t: 1, up: 'cd', cd: 3.6, dmg: 0, fx: 'none', kind: 'potion', hero: 'qingji', local: 1,
      n: '催化剂', d: '射程内中毒的敌人，毒翻一倍（每个一次最多多加 12，夜越深越多）。', f: '一滴就够。两滴，连瓶子都化了。' },
    sp_venomsac: { size: 2, tag: 'poison', t: 1, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'qingji', local: 1,
      n: '毒囊', d: '中毒的敌人倒下时，身上一半的毒溅给旁边的敌人。', f: '割下来要小心。破了，就是一片。' },
    sp_fogpot: { size: 3, tag: 'poison', t: 2, up: 'mix', cd: 4.6, dmg: 14, fx: 'gas', aoe: 40, poison: 26, kind: 'potion', hero: 'qingji',
      n: '瘴气坛', d: '砸开一大片瘴气，范围里的敌人重度中毒。', f: '坛口封了三层蜡。开的时候她屏住了气，数到二十。' },
    /* 青棘 · 刃 */
    sp_sleeve: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 0.9, dmg: 3.5, multi: 2, fx: 'knife', kind: 'weapon', hero: 'qingji',
      n: '袖箭', d: '一抬手两支。出手快，最好攒【猎手】的飞刀。', f: '袖子里还有。永远还有。' },
    sp_bladerain: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.4, dmg: 7, multi: 4, target: 'rand', fx: 'knife', kind: 'weapon', hero: 'qingji',
      n: '刀雨', d: '朝随机目标扔四把。', f: '数不过来的时候，就别数了。' },
    sp_whetstone: { size: 1, tag: 'blade', t: 1, up: 'cd', cd: 2.8, dmg: 0, fx: 'none', buff: 0.5, kind: 'gadget', hero: 'qingji',
      n: '随身磨石', d: '相邻的卡下一下伤害 +50%。', f: '巴掌大，磨得发亮。她坐下来就磨，站起来就走。' },
    sp_tailknife: { size: 2, tag: 'blade', t: 1, up: 'dmg', cd: 2.2, dmg: 12, fx: 'knife', kind: 'weapon', hero: 'qingji', local: 1,
      n: '尾刃', d: '本场每甩出一把【猎手】飞刀，伤害 +1（夜越深越多）。', f: '最后一把，留给最后一个。' },
    sp_thousand: { size: 2, tag: 'blade', t: 2, up: 'mix', cd: 0, dmg: 0, fx: 'none', passive: 1, hero: 'qingji', local: 1,
      n: '千刃', d: '别的卡每出手一次，射程内所有敌人挨一刀（夜越深越疼）。', f: '一刀不疼。一千刀呢？' },

    /* 通用 */
    sp_spikes: { size: 1, tag: 'blade', t: 0, up: 'dmg', cd: 0, dmg: 0, fx: 'none', passive: 1, world: W,
      n: '荆棘甲', d: '城墙挨打时，墙根附近的敌人都挨扎（夜越深越疼）。', f: '谁撞上来，谁就疼。' },
    sp_potion: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 4, dmg: 0, fx: 'none', kind: 'gadget', world: W,
      n: '药水袋', d: '每次随便摸一瓶：相邻的卡充能 35%，或城墙护盾 +6，或射程内的敌人中毒。', f: '标签早就磨掉了。喝了才知道。' },
    sp_bomb: { size: 2, tag: 'fire', t: 1, up: 'dmg', cd: 3, dmg: 40, fx: 'shell', aoe: 30, burn: 3, ammo: 1, kind: 'firearm', world: W,
      n: '定时炸弹', d: '开战 3 秒后炸一大片。每场一颗。', f: '滴答，滴答。' },
    /* 诅咒：不进卡池，卖不掉，只能找清卡人 */
    sp_doubt: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '疑虑', d: '诅咒。开战时，随机冻住你一张卡 3 秒。卖不掉。', f: '这一下，该不该出手？' },
    sp_wound: { size: 2, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '伤口', d: '诅咒。什么也不做，就是占地方。卖不掉。', f: '它不疼了。可它一直在那儿。' },
    sp_greed: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '贪念', d: '诅咒。每到新的一夜，丢 2 金。卖不掉。', f: '钱袋底下有个洞，你缝了三回。' },
    sp_rot: { size: 1, tag: 'mech', t: 0, up: 'cd', cd: 0, dmg: 0, fx: 'none', passive: 1, noPool: 1, noSell: 1, world: W,
      n: '腐朽', d: '诅咒。开战时城墙 -1。卖不掉。', f: '砖缝里长了东西。刮掉，第二天又长出来。' },
  },

  /* ---------------- 遗物 ---------------- / ---------------- Relics ---------------- */
  relics: {
    sp_bloodvial: { t: 0, ico: 'potion:R', hero: 'chishi', m: { regen: 3 }, n: '燃血瓶', f: '瓶底那点红，摇一摇就热了。' },
    sp_snakering: { t: 0, ico: 'ring:l', hero: 'qingji', m: { poison: 0.15, s1: 0.05 }, n: '蛇戒', f: '戒指上的蛇咬着自己的尾巴，毒牙朝外。' },
    sp_anchor: { t: 0, ico: 'claw:g', world: W, m: { shieldStart: 10 }, n: '锚', f: '一只铁锚，从塔顶掉下来的。塔顶有海？' },
    sp_eye: { t: 0, ico: 'orb:P', world: W, m: { crit: 0.08 }, n: '第三只眼', f: '闭着的时候比睁着的时候看得清。' },
    sp_bell: { t: 1, ico: 'badge:Y', world: W, m: { sp_bell: 1 }, n: '六角铃', f: '铃舌是一颗牙。' },
    sp_spoon: { t: 1, ico: 'claw:w', world: W, m: { sp_spoon: 1 }, n: '怪勺子', f: '它是弯的。它一直是弯的。' },
    sp_urn: { t: 1, ico: 'potion:N', world: W, m: { sp_urn: 1 }, n: '鸟面瓮', f: '瓮口那张鸟脸，一到你发狠就张嘴。' },
    sp_kunai: { t: 1, ico: 'claw:s', world: W, m: { sp_kunai: 1 }, n: '苦无', f: '一把苦无，系着一截褪了色的红绳。' },
    sp_pen: { t: 2, ico: 'wand', world: W, m: { sp_pen: 1 }, n: '笔尖', f: '写什么，什么就成真。只能写一个字：死。' },
    sp_goldidol: { t: 2, ico: 'badge:y', world: W, noPool: 1, m: { winGold: 3 }, n: '金色神像', f: '你把它拿起来的那一刻，塔里有块石头动了。' },
    /* 规则遗物：第 2、6 夜后三选一，有好有坏 / rule relics: three to choose from after nights 2 and 6, with a catch */
    sp_crown: { t: 2, ico: 'badge:R', world: W, rule: 1, m: { spd: 0.2, winGold: -3 }, n: '空心王冠', f: '戴上它，手快了。可钱总是不知道去了哪儿。' },
    sp_map: { t: 2, ico: 'scroll:N', world: W, rule: 1, m: { interest: 3, tax: 1 }, n: '藏宝图', f: '图上画的宝藏，全在别人的店里。' },
    sp_ecto: { t: 2, ico: 'orb:C', world: W, rule: 1, m: { xdmg: 0.15, winGold: -5 }, n: '灵质', f: '冰凉的一团。它不要钱，它要你别再碰钱。' },
    sp_ward: { t: 2, ico: 'orb:b', world: W, rule: 1, m: { shieldStart: 20, enemySpd: 0.08 }, n: '黑星', f: '它让你的墙更硬，也让外面的东西更急。' },
  },

  talents: {
    sp_t_climb: { cat: 'atk', r: 0, world: W, m: { dmg: 0.06 }, n: '往上爬', say: '塔是倒着的。往上爬，就是往下走。' },
    sp_t_rest: { cat: 'def', r: 0, world: W, m: { regen: 2 }, n: '烤火', say: '睡一觉。醒了，伤就好一半。' },
    sp_t_map: { cat: 'tech', r: 1, world: W, m: { crit: 0.06 }, n: '看路', say: '问号的地方，多半有好东西。也多半有坏东西。' },
    sp_t_purse: { cat: 'eco', r: 0, world: W, m: { killGold: 0.03 }, n: '摸尸', say: '它们兜里也有钱。别问是谁的。' },
  },

  /* ---------------- 首领招式 ---------------- / ---------------- Boss moves ---------------- */
  intents: {
    /** 六焰魂：点亮一团火；六团都亮了就是一次焚烧（掐灯 + 往墙上砸火球） / Hexflame: light one flame; with all six lit, an inferno (snuff + fireballs on the wall) */
    sp_kindle: (e) => {
      const m = M(e);
      m.lit = (m.lit || 0) + 1;
      view.num(ex(e), ey(e) - 26, `${m.lit} / 6`, '#a7f070', 2);
      if (m.lit < 6) return;
      m.lit = 0;
      view.banner('焚烧', '#a7f070');
      INTENTS.snuff(e, undefined, undefined);
      INTENTS.barrage(e, 6, undefined);
    },
    /** 塔心：心跳，往墙上砸石头，一次比一次多 / the Heart: a beat, rocks on the wall, more each time */
    sp_beat: (e) => {
      const m = M(e);
      m.beat = Math.min(8, (m.beat || 1) + 1);
      INTENTS.barrage(e, m.beat, undefined);
    },
  },

  /* ---------------- 敌人 ---------------- / ---------------- Enemies ---------------- */
  enemies: {
    sp_acid: { hp: 10, spd: 0.055, armor: 0, wall: 1, spr: 'sp_acid', sc: 1, col: '#ffcd75', faction: 'swamp', world: W, n: '酸泥', tip: '一小坨酸。慢，但是一直来。' },
    sp_crow: { hp: 6, spd: 0.1, armor: 0, wall: 1, spr: 'sp_crow', sc: 1, zig: 1, col: '#566c86', faction: 'wing', world: W, n: '塔鸦', tip: '歪歪扭扭地飞，快。' },
    sp_cultist: { hp: 20, spd: 0.04, armor: 1, wall: 2, spr: 'sp_cultist', sc: 1, col: '#3b5dc9', faction: 'cult', world: W, n: '鸦面教徒', tip: '先站着念咒，念完了就冲得飞快。早点打。' },
    sp_splitooze: { hp: 18, spd: 0.045, armor: 0, wall: 2, spr: 'sp_splitooze', sc: 1, split: 2, splitInto: 'sp_acidmini', col: '#a7f070', faction: 'swamp', world: W, n: '大酸泥', tip: '打死会裂成两小坨。' },
    sp_acidmini: { hp: 5, spd: 0.08, armor: 0, wall: 1, spr: 'sp_acidmini', sc: 1, small: 1, col: '#ffcd75', faction: 'swamp', world: W, n: '酸泥点子' },
    sp_sentinel: { hp: 110, spd: 0.028, armor: 4, wall: 5, spr: 'sp_sentinel', sc: 1, col: '#41a6f6', faction: 'war', world: W, n: '塔哨', tip: '每隔几秒缩一下，缩着的时候硬得很。' },
    sp_crab: { hp: 44, spd: 0.035, armor: 4, wall: 2, spr: 'sp_crab', sc: 1, guard: 3, aura: 30, col: '#e43b44', faction: 'dead', world: W, n: '刺壳蟹', tip: '给身边的敌人加护甲。' },
    sp_weaver: { hp: 26, spd: 0.04, armor: 0, wall: 2, spr: 'sp_weaver', sc: 1, heal: 0.12, aura: 34, col: '#a64ca6', faction: 'cult', world: W, n: '织网者', tip: '给身边的敌人回血。先打它。' },
    sp_hornrat: { hp: 26, spd: 0.045, armor: 0, wall: 2, spr: 'sp_hornrat', sc: 1, haste: 0.35, aura: 34, col: '#c28a4d', faction: 'war', world: W, n: '吹角鼠', tip: '号角一响，身边的都跑得快。' },
    sp_fungus: { hp: 12, spd: 0.07, armor: 0, wall: 3, spr: 'sp_fungus', sc: 1, bomb: 0.45, col: '#b13e53', faction: 'swamp', world: W, n: '爆菇', tip: '死的时候炸开一团孢子，连身边的同伴一起炸。' },
    sp_faceless: { hp: 16, spd: 0.05, armor: 0, wall: 1, spr: 'sp_faceless', sc: 1, phase: 1, col: '#f4f4f4', faction: 'dead', world: W, n: '无面者', tip: '时隐时现，虚着的时候打不着。' },
    sp_gatherer: { hp: 34, spd: 0.03, armor: 0, wall: 3, spr: 'sp_gatherer', sc: 1, raise: 2, raiseAs: 'sp_cultist', col: '#e43b44', faction: 'cult', world: W, n: '收尸人', tip: '把倒下的拉起来，变成教徒。' },
    sp_beetle: { hp: 240, spd: 0.02, armor: 3, wall: 8, spr: 'sp_beetle', sc: 1, cargo: ['sp_acidmini', 6], col: '#a64ca6', faction: 'war', world: W, n: '驮虫', tip: '背上驮着一窝。打死了，一窝全掉下来。' },
    sp_madman: { hp: 50, spd: 0.04, armor: 1, wall: 3, spr: 'sp_madman', sc: 1, rage: 1.8, col: '#a64ca6', faction: 'war', world: W, n: '疯子', tip: '越疼跑得越快。' },
    sp_spear: { hp: 70, spd: 0.03, armor: 2, wall: 3, spr: 'sp_spear', sc: 1, stopAt: 0.3, lob: [4.5, 1], col: '#94b0c2', faction: 'war', world: W, n: '投矛手', tip: '站在远处往墙上扔矛。' },
    sp_chestling: { hp: 60, spd: 0.028, armor: 1, wall: 3, spr: 'sp_chest', spr2: 'sp_chestling', sc: 1, mimic: 3, col: '#a64ca6', faction: 'swamp', world: W, n: '箱怪', tip: '一个箱子。挨了打就张嘴往前跑——打死它有钱。' },
    /* 精英 */
    sp_nob: { hp: 240, spd: 0.028, armor: 2, wall: 8, spr: 'sp_e_nob', sc: 1, elite: 1, rage: 0.6, col: '#38b764', faction: 'war', world: W, n: '大块头',
      tip: '讨厌花招：你每用一次辅助卡，它就更凶一点。',
      intents: [{ t: 6, a: 'roar', n: '咆哮', d: '身边的一起冲锋' }, { t: 10, a: 'dash', n: '冲撞', d: '2秒内三倍速' }] },
    sp_sentries: { hp: 280, spd: 0.022, armor: 6, wall: 10, spr: 'sp_e_sentry', sc: 1, elite: 1, col: '#41a6f6', faction: 'war', world: W, n: '三哨兵',
      tip: '会盯住你的卡，盯住的动不了。',
      intents: [{ t: 7, a: 'harden', n: '缩壳', d: '4秒内护甲+10' }, { t: 8, a: 'gaze', v: 2, n: '光束', d: '冻住你2张卡' }] },
    sp_bookling: { hp: 150, spd: 0.025, armor: 0, wall: 8, spr: 'sp_e_book', sc: 1, elite: 1, raise: 2, raiseAs: 'sp_cultist', col: '#c28a4d', faction: 'cult', world: W, n: '书灵',
      tip: '一本会走路的书。念一页，地上就爬起一个教徒。',
      intents: [{ t: 9, a: 'skels', v: 3, k: 'sp_cultist', n: '诵读', d: '招来3个教徒' }, { t: 8, a: 'shield', n: '合书', d: '护盾' }] },
    /* 第 4 夜：睡着的锈甲骑士 / night 4: the sleeping rust knight */
    sp_rustknight: { hp: 900, spd: 0.022, armor: 3, wall: 12, spr: 'sp_b_rust', sc: 1, elite: 1, fixed: 1, col: '#c28a4d', faction: 'dead', world: W, n: '锈甲骑士',
      tip: '它在睡觉。睡着的时候很硬，也不动；打得够疼它就醒了——醒了更麻烦。',
      intents: [{ t: 5, a: 'drain', v: 0.4, n: '锈蚀', d: '吸走你的卡40%充能' }, { t: 7, a: 'shield', n: '铁壁', d: '护盾' }, { t: 8, a: 'dash', n: '冲锋', d: '三倍速' }] },
    /* 第 9 夜首领 */
    sp_hexflame: { final: 1, boss: 1, fixed: 1, hp: 10000, spd: 0.012, armor: 2, wall: 99, spr: 'sp_b_hex', sc: 1, col: '#a7f070', faction: 'abyss', world: W, n: '六焰魂',
      tip: '六团鬼火一团一团点亮，六团全亮就是一次焚烧：你的卡全熄火，火球砸墙。',
      intents: [{ t: 5, a: 'sp_kindle', n: '点火', d: '点亮一团火，六团全亮就焚烧' }, { t: 6, a: 'sp_kindle', n: '点火', d: '点亮一团火' }, { t: 7, a: 'summon', v: 4, k: 'sp_crow', n: '鸦群', d: '招来塔鸦' }] },
    sp_guardian: { final: 1, boss: 1, fixed: 1, hp: 11000, spd: 0.01, armor: 3, wall: 99, spr: 'sp_b_guard', sc: 1, col: '#c28a4d', faction: 'war', world: W, n: '铜衣守护者',
      tip: '每挨够一截血就合上铜壳：一阵子护甲大涨，打它的卡还会被抽走充能。',
      intents: [{ t: 6, a: 'barrage', v: 3, n: '旋风斩', d: '往墙上砸3下' }, { t: 8, a: 'drain', v: 0.3, n: '铜吼', d: '吸走充能' }, { t: 10, a: 'ram', v: 2, n: '冲撞', d: '往前冲' }] },
    sp_slimeking: { final: 1, boss: 1, fixed: 1, hp: 10500, spd: 0.011, armor: 1, wall: 99, spr: 'sp_b_slime', sc: 1, col: '#a7f070', faction: 'swamp', world: W, n: '泥王',
      tip: '掉到一半血就裂成两半；每一半再打死，又会散成一地大酸泥。',
      intents: [{ t: 6, a: 'brood', v: 4, k: 'sp_acid', n: '吐泥', d: '吐出4坨酸泥' }, { t: 9, a: 'drain', v: 0.4, n: '黏住', d: '你的卡充能-40%' }] },
    sp_slimehalf: { boss: 1, fixed: 1, hp: 2500, spd: 0.016, armor: 1, wall: 40, spr: 'sp_e_slimehalf', sc: 1, col: '#a7f070', faction: 'swamp', world: W, n: '半个泥王',
      intents: [{ t: 5, a: 'brood', v: 2, k: 'sp_acid', n: '吐泥', d: '吐出2坨酸泥' }] },
    sp_clock: { final: 1, boss: 1, fixed: 1, hp: 11500, spd: 0.011, armor: 2, wall: 99, spr: 'sp_b_clock', sc: 1, col: '#ffcd75', faction: 'abyss', world: W, n: '时噬',
      tip: '它数着你出了几次手。每数到 25，时间到：你的卡全熄火，它回一截血。',
      intents: [{ t: 8, a: 'wind', v: 4, n: '拨快', d: '小怪快一半' }, { t: 9, a: 'hush', v: 3, n: '停摆', d: '3秒内卡牌不能互相带动' }] },
    /* 隐藏首领（完整游戏线第 15 夜，三把钥匙都拿到了才出来） */
    sp_heart: { hidden: 'chishi', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'sp_b_heart', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '塔心',
      tip: '不死之躯：每秒最多掉 3% 的血。心跳一次比一次重。',
      intents: [{ t: 6, a: 'sp_beat', n: '心跳', d: '往墙上砸石头，一次比一次多' }, { t: 9, a: 'invert', v: 5, n: '倒转', d: '你最多的元素伤害-30%' }, { t: 8, a: 'summon', v: 4, k: 'sp_crow', n: '血鸦', d: '招来塔鸦' }] },
    sp_heart2: { hidden: 'qingji', boss: 1, fixed: 1, hp: 10000, spd: 0.008, armor: 2, wall: 99, spr: 'sp_b_heart', sc: 1, col: '#e43b44', faction: 'abyss', world: W, n: '塔心',
      tip: '不死之躯：每秒最多掉 3% 的血。心跳一次比一次重。',
      intents: [{ t: 6, a: 'sp_beat', n: '心跳', d: '往墙上砸石头，一次比一次多' }, { t: 9, a: 'invert', v: 5, n: '倒转', d: '你最多的元素伤害-30%' }, { t: 8, a: 'summon', v: 4, k: 'sp_crow', n: '血鸦', d: '招来塔鸦' }] },
  },

  foesets: {
    spire: {
      n: '塔里的东西', world: W,
      map: {
        slime: 'sp_acid', bat: 'sp_crow', skel: 'sp_cultist', bug: 'sp_splitooze', mini: 'sp_acidmini', golem: 'sp_sentinel', shieldb: 'sp_crab',
        shaman: 'sp_weaver', drummer: 'sp_hornrat', bomber: 'sp_fungus', ghost: 'sp_faceless', necro: 'sp_gatherer', siege: 'sp_beetle',
        berserker: 'sp_madman', catapult: 'sp_spear', mimic: 'sp_chestling', a_brute: 'sp_nob', a_golem: 'sp_sentries', a_lich: 'sp_bookling', knight: 'sp_rustknight',
      },
    },
  },

  voices: {
    sp_face: { img: 'p_sp_face', c: '#94b0c2', n: '石脸' },
    sp_merchant: { img: 'p_sp_merchant', c: '#a64ca6', n: '斗篷商人' },
    sp_revenant: { img: 'p_sp_revenant', c: '#73eff7', n: '回头客' },
  },

  /* ---------------- 备战事件 ---------------- / ---------------- Prep events ---------------- */
  events: {
    /* 塔脚下的石脸：第一夜第一站，四选一的开局恩赐 / the Stone Face at the tower's foot: night 1's first stop, a pick of four boons */
    sp_face: {
      ico: 'sp_ev_face', cat: 'free', w: 0, rar: 0, world: W, n: '石脸', f: '塔脚下的一张石头脸。它每次都记得你，你每次都不记得它。',
      enter: (cur, api) => {
        const ws = api.ws();
        ws.faceN = (ws.faceN || 0) + 1;
        const silver = heroCards(1);
        api.choice(cur, '“又来了？”石脸说，“这回想要点什么。”', [
          { ico: 'r_purse', label: '一袋金子', sub: '+12 金', act: () => { api.gainGold(12); api.finishStep(); } },
          { ico: 'r_rampart', label: '一副好骨头', sub: '城墙上限 +6', act: () => { api.maxWall(6); api.finishStep(); } },
          { ico: 'altar', label: '一件稀有遗物', sub: '……再带上一张【伤口】', act: () => {
            giveCurse(api, 'sp_wound');
            const r = api.rollGear(1, 2, 2)[0];
            if (r) api.gainRelic(r);
            else api.finishStep();
          } },
          ...(silver.length && G.cards.length
            ? [{ ico: 'scroll:P', label: '换一张起手', sub: '丢掉最左边的卡，换一张随机的银卡', act: () => {
                const c = [...G.cards].sort((a, b) => (a.loc === b.loc ? a.idx - b.idx : a.loc === 'board' ? -1 : 1))[0];
                api.removeCard(c);
                api.addCard(pick(silver), 1);
                api.renderOwned();
                api.finishStep();
              } }]
            : []),
        ]);
      },
    },
    /* 篝火：歇一歇，或者打一打 / campfire: rest, or smith */
    sp_campfire: {
      ico: 'sp_ev_fire', cat: 'up', w: 4, rar: 0, world: W, n: '篝火', f: '塔身的凹处有一堆火。谁点的？不知道。一直没灭。',
      need: () => G.cards.length > 0 || G.wall < G.wallMax,
      enter: (cur, api) => {
        const h = Math.max(1, Math.round(G.wallMax * 0.3));
        const up = shuffled(G.cards.filter((c) => c.tier < 2)).slice(0, 3);
        api.choice(cur, '火堆噼啪响。你只有一晚上，干一件事。', [
          { ico: 'r_heart', label: '歇一宿', sub: `城墙修 ${Math.min(h, G.wallMax - G.wall)}`, act: () => { api.heal(h); api.finishStep(); } },
          ...(up.length
            ? [{ ico: 'r_hammer', label: '磨一磨家伙', sub: '挑一张卡升一品', act: () => {
                api.choice(cur, '挑一张。', up.map((c) => api.upOpt(c, api.finishStep)));
                api.renderPrep();
              } }]
            : []),
        ]);
      },
    },
    /* 金色神像：拿了就有石球追 / the golden idol: take it and the boulder comes */
    sp_idol: {
      ico: 'badge:y', cat: 'misc', w: 1.2, rar: 1, minR: 2, world: W, n: '金色神像', f: '一尊金像，搁在一个石台上，四周干净得不像话。',
      need: () => !G.relics.includes('sp_goldidol'),
      enter: (cur, api) => {
        api.choice(cur, '神像就在那儿。太容易了。', [
          { ico: 'badge:y', label: '拿走', sub: '得到【金色神像】：每胜一场 +3 金。然后……', act: () => {
            api.gainRelic('sp_goldidol', true);
            api.choice(cur, '石台陷下去了。身后滚来一颗大石球！', [
              { ico: 'boot:N', label: '跑', sub: '得到一张【伤口】', act: () => { giveCurse(api, 'sp_wound'); api.finishStep(); } },
              { ico: 'r_hammer', label: '硬顶', sub: `城墙 -${Math.ceil(G.wallMax * 0.25)}`, act: () => { G.wall = Math.max(1, G.wall - Math.ceil(G.wallMax * 0.25)); api.finishStep(); } },
              { ico: 'r_rampart', label: '躲进墙缝', sub: '城墙上限 -4', act: () => { api.maxWall(-4); api.finishStep(); } },
            ]);
            api.renderPrep();
          } },
          { ico: 'boot:g', label: '别碰', sub: '转身走', act: () => api.finishStep() },
        ]);
      },
    },
    /* 契约：钱和疑虑 / the contract: gold and doubt */
    sp_contract: {
      ico: 'scroll:R', cat: 'misc', w: 1.5, rar: 0, world: W, n: '一纸契约', f: '斗篷商人把一张纸推过来。纸是热的。',
      enter: (cur, api) => {
        const g = 16 + 2 * G.round;
        api.choice(cur, '“签个名就行，”他说，“名字而已。”', [
          { ico: 'r_purse', label: '签', sub: `+${g} 金，得到一张【疑虑】`, act: () => { api.gainGold(g); giveCurse(api, 'sp_doubt'); api.finishStep(); } },
          { ico: 'scroll:R', label: '按个血手印', sub: `+${Math.round(g * 1.5)} 金，得到一张【贪念】`, act: () => { api.gainGold(Math.round(g * 1.5)); giveCurse(api, 'sp_greed'); api.finishStep(); } },
          { ico: 'boot:g', label: '不签', sub: '他把纸收回去，叹了口气', act: () => api.finishStep() },
        ]);
      },
    },
    /* 配对游戏：六张翻着的牌，翻两张，一样就归你 / the match game: six face-down cards; flip two, keep pairs */
    sp_match: {
      ico: 'dice', cat: 'misc', w: 1.2, rar: 1, minR: 2, world: W, n: '配对游戏', f: '一个小桌，六张牌扣着。“翻两张。一样就拿走。只能翻四回。”',
      enter: (cur, api) => {
        const pool = [
          { n: '一袋金子', s: '+6 金', ico: 'r_purse', give: () => api.gainGold(6) },
          { n: '一块好砖', s: '城墙上限 +3', ico: 'r_rampart', give: () => api.maxWall(3) },
          { n: '一张专属卡', s: '随机一张铜卡', ico: 'scroll:P', give: () => { const k = heroCards(0); if (k.length) api.addCard(pick(k), 0); } },
          { n: '一张【腐朽】', s: '诅咒', ico: 'drop', give: () => giveCurse(api, 'sp_rot') },
        ];
        const deal = shuffled(shuffled(pool).slice(0, 3).flatMap((x) => [x, x]));
        const st = { open: [] as number[], got: [] as number[], left: 4, log: [] as string[] };
        const show = () => {
          /* 只列还扣着的牌；翻开的那张写在提示里 / list only face-down cards; the one turned up is named in the hint */
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
                  later2(() => {
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
        /* 没配上的两张亮一会儿再扣回去 / an unmatched pair stays face-up for a moment */
        const later2 = (f: () => void, wait: boolean) => (wait ? setTimeout(f, 700) : f());
        show();
      },
    },
    /* 清卡人：花钱弄掉一张卡（诅咒也行） / the purger: pay to remove a card (curses too) */
    sp_purge: {
      ico: 'furnace', cat: 'misc', w: 2, rar: 0, world: W, n: '清卡人', f: '一个戴手套的人。他从不问你为什么想忘掉一样东西。',
      need: () => G.cards.length > 1 && G.gold >= 5 + 3 * (ws().purgeN || 0),
      enter: (cur, api) => {
        const ws = api.ws();
        const price = 5 + 3 * (ws.purgeN || 0);
        const list = [...G.cards].sort((a, b) => (ITEMS[b.key].noSell ? 1 : 0) - (ITEMS[a.key].noSell ? 1 : 0)).slice(0, 5);
        api.choice(cur, `“一张 ${price} 金，”他说，“每回都比上回贵一点。”`, list.map((c) => ({
          card: c, label: `忘掉【${ITEMS[c.key].n}】`, sub: `${price} 金`,
          act: () => {
            if (G.gold < price) {
              api.toast('钱不够');
              api.SFX.play('bad');
              return;
            }
            G.gold -= price;
            ws.purgeN = (ws.purgeN || 0) + 1;
            api.removeCard(c);
            api.renderOwned();
            api.updateHUD();
            api.SFX.play('merge');
            api.finishStep();
          },
        })));
      },
    },
    /* 图书馆：读书挑卡，或者睡一觉 / the library: read for a card, or sleep */
    sp_library: {
      ico: 'book:N', cat: 'free', w: 1.5, rar: 0, world: W, n: '倒着的图书馆', f: '书架从天花板上往下长，书脊上的字全是反的。',
      enter: (cur, api) => {
        api.choice(cur, '这儿很安静。', [
          { ico: 'book:N', label: '读书', sub: '从 3 张专属卡里挑一张', act: () => {
            Object.assign(cur, { mode: 'pick', offers: [0, 1, 2].map(() => api.makeOffer((it) => it.hero === G.hero, { free: 1 })) });
            api.renderPrep();
          } },
          { ico: 'r_heart', label: '睡觉', sub: '城墙修满', act: () => { api.heal(G.wallMax); api.finishStep(); } },
        ]);
      },
    },
    /* 回头客：上一个爬塔的人，又回来了 / the Revenant: the last climber, back again */
    sp_revenant: {
      ico: 'p_sp_revenant', cat: 'rare', w: 1, rar: 2, minR: 3, world: W, n: '回头客', f: '一个穿旧甲的人坐在路边，跟你打招呼，像认识你很多年。',
      enter: (cur, api) => {
        const lines: Record<string, string> = {
          chishi: '“血誓的？我也发过。发得太狠，后来连自己叫什么都忘了。挑一样吧，我用不着了。”',
          qingji: '“又是你。上回你也问我塔底下有什么。我上回也没告诉你。挑一样吧。”',
        };
        api.relicChoice(cur, lines[G.hero] || '“挑一样吧，我用不着了。”', api.withFit(api.rollGear(3, 1)));
      },
    },
  },

  /* ---------------- 人物 ---------------- / ---------------- Heroes ---------------- */
  heroes: {
    chishi: {
      def: {
        world: W, col: '#e43b44', portrait: 'p_chishi', wall: 34, gold: 8, start: [],
        n: '赤誓', title: '血誓武者', tag: '擅长力量与护盾', desc: '城墙挨得越多，他砍得越狠。【力量】让刃卡每一下都更疼，护盾让墙多扛几下。',
        intro: '这是我第九次爬这座塔。前八次，我都死在了上面。',
      },
      sig: { n: '血契', d: '城墙每挨一下（每半秒最多一次），【力量】+1。每点力量让【刃】卡每一下 +1 伤害，夜越深越值钱（每 4 夜 +1）。每场重新算。', m: { strWall: 1 } },
      awaken: [
        { id: 'chishi_a', n: '狂怒', d: '力量的效果 ×1.5', m: { strMul: 0.5 } },
        { id: 'chishi_b', n: '铁誓', d: '每场开战就有 4 点力量', m: { strStart: 4 } },
      ],
      kits: [
        { cards: [['sp_brokenblade', 0], ['sp_bleed', 0]], path: 'blood', n: '断刃放血', d: '先流自己的血，再砍别人。' },
        { cards: [['sp_buckler', 0], ['sp_shieldbash', 1]], path: 'iron', n: '一盾一击', d: '墙后面再竖一面盾。' },
      ],
      paths: [
        { id: 'blood', mast: 0, cards: ['sp_brokenblade', 'sp_bleed', 'sp_ragewave', 'sp_bloodoath', 'sp_allin', 'sp_demon'], n: '血', d: '攒力量，城墙越伤越狠' },
        { id: 'iron', mast: 1, cards: ['sp_buckler', 'sp_shieldbash', 'sp_bulwark', 'sp_ironheart'], n: '铁', d: '叠护盾，用护盾砸人' },
      ],
      hooks: {
        start: () => {
          const b = bt();
          b.flags.str = 0;
          if (mv('strStart')) addStr(mv('strStart'));
          const d = boardCards().filter((c) => c.key === 'sp_demon').length;
          if (d) later(0.4, () => damageWall(3 * d, world.W / 2));
        },
        wall: (x) => {
          const b = bt();
          if (!(x.d > 0) || (b.flags.strT ?? -9) > b.t - 0.5) return;
          b.flags.strT = b.t;
          addStr(mv('strWall'));
        },
      },
      stat: (c, it) => {
        let flat = 0;
        if (it.tag === 'blade' && it.dmg > 0) flat += str() * unit() * (1 + mv('strMul')) * (c.key === 'sp_ragewave' ? 2 : 1);
        if (c.key === 'sp_allin') flat += Math.max(0, G.wallMax - G.wall) * 3 * (1 + G.round / 4);
        return flat ? { flat } : undefined;
      },
      story: chishiStory,
    },
    qingji: {
      def: {
        world: W, col: '#38b764', portrait: 'p_qingji', wall: 26, gold: 12, start: [],
        n: '青棘', title: '塔下猎手', tag: '擅长中毒与飞刀', desc: '小型卡出手越勤，【猎手】甩出的飞刀越多；毒一层一层叠上去，再翻倍。',
        intro: '塔是倒着长的。所以爬到底，就是爬到顶。',
      },
      sig: { n: '猎手', d: '小型输出卡每出手 4 次，朝最前面的敌人甩一把飞刀（那张卡伤害的 60%）。', m: { knifeEvery: 4 } },
      awaken: [
        { id: 'qingji_a', n: '快手', d: '每 3 次就甩一把', m: { knifeEvery: -1 } },
        { id: 'qingji_b', n: '淬毒', d: '飞刀附带 4 点中毒（夜越深越多）', m: { knifePoison: 4 } },
      ],
      kits: [
        { cards: [['sp_dart', 0], ['sp_sleeve', 0]], path: 'venom', n: '一镖一箭', d: '毒先上，刀跟着。' },
        { cards: [['sp_sleeve', 0], ['sp_tailknife', 1]], path: 'blades', n: '袖箭尾刃', d: '飞刀甩得越多，尾刃越狠。' },
      ],
      paths: [
        { id: 'venom', mast: 0, cards: ['sp_dart', 'sp_fumes', 'sp_catalyst', 'sp_venomsac', 'sp_fogpot'], n: '毒', d: '叠毒、翻倍、溅开' },
        { id: 'blades', mast: 1, cards: ['sp_sleeve', 'sp_bladerain', 'sp_whetstone', 'sp_tailknife', 'sp_thousand'], n: '刃', d: '出手越勤，飞刀越多' },
      ],
      hooks: {
        use: (x) => {
          const c = x.c as Card;
          const it = ITEMS[c.key];
          if (c.size !== 1 || !(it.dmg > 0)) return;
          const b = bt();
          b.flags.kc = (b.flags.kc || 0) + 1;
          if (b.flags.kc % Math.max(2, mv('knifeEvery')) === 0) knife(c);
        },
      },
      stat: (c) => {
        if (c.key === 'sp_tailknife' && inBattle()) return { flat: (bt().flags.knives || 0) * unit() };
      },
      story: qingjiStory,
    },
  },

  story: {},

  /* ---------------- 写代码的效果 ---------------- / ---------------- Code-based effects ---------------- */
  hooks: {
    cards: {
      sp_bleed: {
        on: {
          use: (c, x) => {
            if (x.c !== c || G.wall <= 2) return;
            damageWall(1, c.ox || world.W / 2);
            if (!bt().over) addStr(2 + stepOf(c));
          },
        },
      },
      sp_bloodoath: {
        on: {
          wall: (c, x) => {
            const b = bt();
            if (!(x.d > 0) || (c.lastT ?? -9) > b.t - 0.5) return;
            c.lastT = b.t;
            view.cardFx(c, 'pop');
            addStr(1);
          },
        },
      },
      sp_bulwark: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            addShield(Math.min(bt().shield, 30 + 15 * stepOf(c)));
          },
        },
      },
      sp_ironheart: {
        on: {
          use: (c, x) => {
            const o = x.c as Card;
            if (o !== c && (ITEMS[o.key].shieldGain || o.key === 'sp_bulwark' || o.adj === 'sturdy')) chargeCard(c, 0.5, o);
          },
        },
      },
      sp_demon: { on: { use: (c, x) => { if (x.c === c) addStr(2 + stepOf(c)); } } },
      sp_catalyst: {
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
      sp_venomsac: {
        on: {
          kill: (c, x) => {
            const e = x.e as Enemy;
            if (!x.poisoned || !(e.poisonD > 0)) return;
            const amt = e.poisonD * 0.5 * (1 + 0.25 * stepOf(c));
            const ns = near(e, 22 * K());
            if (!ns.length) return;
            view.ring(ex(e), ey(e) - 4, 2, 22 * K(), '#7ddc5f', 0.35);
            for (const o of ns) {
              o.poisonD += amt;
              o.poisonT = Math.max(o.poisonT, 3);
              o.poisonSrc = c;
            }
          },
        },
      },
      sp_thousand: {
        on: {
          use: (c, x) => {
            if (x.c === c) return;
            const a = (1 + 0.6 * G.round) * (1 + 0.5 * stepOf(c));
            for (const e of targets()) hurt(e, a, c, false, { k: 'fx', splash: 1 });
          },
        },
      },
      sp_spikes: {
        on: {
          wall: (c) => {
            const b = bt();
            if ((c.lastT ?? -9) > b.t - 0.5) return;
            c.lastT = b.t;
            view.cardFx(c, 'pop');
            const a = (6 + 2 * G.round) * (1 + 0.5 * stepOf(c));
            for (const e of b.en) if (!e.dead && e.y > 0.75) hurt(e, a, c, false, { k: 'fx', splash: 1 });
          },
        },
      },
      sp_potion: {
        on: {
          use: (c, x) => {
            if (x.c !== c) return;
            const r = rand();
            if (r < 0.34) for (const n of c.nb || []) chargeCard(n, 0.35 * (1 + 0.25 * stepOf(c)), c);
            else if (r < 0.67) addShield(6 * (1 + 0.4 * stepOf(c)));
            else for (const e of targets()) hurt(e, 1, c, false, { poison: 3 * unit(), poisonDur: 4, k: 'fx', splash: 1 });
          },
        },
      },
      sp_bomb: {
        on: {
          start: (c) => {
            c.charge = 0;
            c.frozen = 3;
            view.cardFlag(c, 'frozen', true);
            later(3, () => {
              c.frozen = 0;
              c.charge = 1;
              view.cardFlag(c, 'frozen', false);
            });
          },
        },
      },
    },
    relics: {
      sp_bell: {
        use: () => {
          const b = bt();
          b.flags.bellN = (b.flags.bellN || 0) + 1;
          if (b.flags.bellN % 10) return;
          const c = pick(boardCards().filter((o) => ITEMS[o.key].dmg > 0) as Card[]);
          if (c) c.sure = true;
        },
      },
      sp_spoon: {
        use: (_n, x) => {
          const c = x.c as Card;
          if (c.ammo === 0 && rand() < 0.25) later(0.3, () => reload(c, 1, null));
        },
      },
      sp_kunai: {
        kill: () => {
          const b = bt();
          if (b.kills % 10) return;
          for (const c of boardCards()) if (c.size === 1) chargeCard(c, 0.3, null);
        },
      },
      sp_pen: {
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
      /* 教徒念 4~7 秒咒，念完冲 / cultists chant for 4–7 s, then rush */
      sp_cultist: {
        spawn: (e) => (M(e).chant = 4 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          if (m.chant == null) return;
          m.chant -= dt;
          if (m.chant > 0) return;
          m.chant = null;
          e.rushT = 6;
          view.num(ex(e), ey(e) - 12, '嘎！', '#ffcd75', 1);
        },
      },
      /* 塔哨：每 5 秒缩一次壳 / the sentinel: hunkers down every 5 s */
      sp_sentinel: {
        spawn: (e) => (M(e).t = 2 + rand() * 3),
        step: (e, dt) => {
          const m = M(e);
          m.t -= dt;
          if (m.t > 0) return;
          m.t = 5;
          e.hardT = 2;
        },
      },
      /* 大块头：你每用一次辅助卡，它就更凶 / the brute: angrier every time you use a support card */
      sp_nob: {
        on: {
          use: (e, x) => {
            const c = x.c as Card;
            if (!c || ITEMS[c.key].dmg > 0) return;
            const m = M(e);
            if ((m.n || 0) >= 12) return;
            m.n = (m.n || 0) + 1;
            e.armor += 0.5;
            e.dashT = Math.max(e.dashT, 0.4);
            if (m.n % 4 === 0) view.num(ex(e), ey(e) - 16, '怒！', '#e43b44', 2);
          },
        },
      },
      /* 锈甲骑士：睡着不动、伤害减半，挨够一截血就醒 / the rust knight: asleep, still and half damage; wakes after enough hurt */
      sp_rustknight: {
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
      /* 铜衣守护者：每挨 18% 的血合上铜壳 8 秒 / the guardian: closes its shell for 8 s every 18% of HP lost */
      sp_guardian: {
        hurt: (e, a, x) => {
          const m = M(e);
          const t = bt().t;
          if ((m.shellT || 0) > t) {
            if (x.src && !x.o?.burnTick && !x.o?.poisonTick) x.src.charge = Math.max(0, x.src.charge - 0.05);
            return Math.max(1, a - 12);
          }
          m.lost = (m.lost || 0) + a;
          if (m.lost >= e.maxHp * 0.18) {
            m.lost = 0;
            m.shellT = t + 8;
            view.banner('铜壳合上了', '#c28a4d');
            view.ring(ex(e), ey(e) - 10, 4, 30 * K(), '#c28a4d', 0.5);
          }
          return a;
        },
      },
      /* 泥王：掉到一半血就裂成两半 / the Slime King: splits in two at half HP */
      sp_slimeking: {
        hurt: (e, a) => {
          const m = M(e);
          if (m.rest || e.hp - a > e.maxHp / 2) return a;
          m.rest = Math.max(e.maxHp * 0.1, e.hp - a);
          view.banner('泥王裂开了', '#a7f070');
          return e.hp + e.shield + 1;
        },
        die: (e) => {
          const rest = M(e).rest;
          if (!rest) return;
          for (const dx of [-0.12, 0.12]) {
            const s = spawn('sp_slimehalf', Math.min(0.9, Math.max(0.1, e.x + dx)), e.y);
            s.x0 = s.x;
            s.hp = s.maxHp = rest / 2;
          }
        },
      },
      sp_slimehalf: {
        die: (e) => {
          for (const dx of [-0.08, 0, 0.08]) {
            const s = spawn('sp_splitooze', Math.min(0.95, Math.max(0.05, e.x + dx)), e.y);
            s.x0 = s.x;
          }
        },
      },
      /* 时噬：数你出了几次手，每 25 次时间到 / the Time Eater: counts your card uses; every 25, time's up */
      sp_clock: {
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
      sp_heart: { hurt: (e, a) => capHurt(e, a) },
      sp_heart2: { hurt: (e, a) => capHurt(e, a) },
    },
  },
};

function wake(e: Enemy) {
  const m = M(e);
  if (!m.sleep) return;
  m.sleep = 0;
  e.holdT = 0;
  e.it = 1.5;
  view.banner('锈甲骑士醒了', '#c28a4d');
  view.shake(4);
}

/** 塔心：每秒最多掉 3% 的血 / the Heart: at most 3% HP lost per second */
function capHurt(e: Enemy, a: number) {
  const m = M(e);
  const t = bt().t;
  if (t - (m.w0 ?? -9) >= 1) {
    m.w0 = t;
    m.got = 0;
  }
  const left = e.maxHp * 0.03 - m.got;
  if (left <= 0) {
    if (rand() < 0.2) view.num(ex(e), ey(e) - 16, '不死', '#e43b44', 1);
    return 0;
  }
  const d = Math.min(a, left);
  m.got += d;
  return d;
}

export default pack;
