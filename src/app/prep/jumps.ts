/* 跃迁事件：第 3、5、7 夜之前（敌人明显变强的几夜）备战多出一站，每个人物不同，
 * 用来定 C 位（这局的主力，独立乘区 ×1.25）和流派方向。选了就有实打实的收获，不是随便问问。
 * Leap events: an extra prep stop before nights 3, 5 and 7 (the nights enemies clearly spike). Each hero has their own; it sets the carry (this run's main damage card, an independent ×1.25 multiplier) and archetype direction. Choosing always pays off concretely — it is not just flavor.
 */
import { ITEMS, TIERS } from '../../data/cards';
import { L, t } from '../../i18n';
import { shuffled } from '../../core/rng';
import type { Tag } from '../../data/types';
import { G, type Card, type PrepStop } from '../../game/state';
import { stats, setCarry } from '../../game/cards';
import { makeOffer, freeCap } from '../../game/loot';
import { acquireState } from '../../game/prep';
import { pathsOf, pathOpen } from '../../game/unlocks';
import { jumpNights } from '../../game/plan';
import { HEROES } from '../../data/heroes';
import { SFX } from '../../audio/sfx';
import { FX } from '../../render/overlay';
import { restart } from '../../ui/dom';
import { elOf, renderOwned, repaint } from '../../ui/card-view';
import { toast } from '../../ui/hud';
import { afterChange, afterMerge, finishStep } from './actions';


type Opt = { card?: Card; ico?: string; label: string; sub: string; act: () => void };

const board = () => G.cards.filter((c) => c.loc === 'board');
const byDmg = (cs: Card[]) => cs.filter((c) => ITEMS[c.key].dmg > 0).sort((a, b) => stats(b, null).total / stats(b, null).cd - stats(a, null).total / stats(a, null).cd);

function crown(c: Card) {
  setCarry(c);
  for (const o of G.cards) repaint(o);
  renderOwned();
  SFX.play('merge');
  restart(elOf(c), 'merge');
  FX.burstAt(elOf(c), '#ffd166', 30);
}
/** 送一张卡；没地方放就折成金币 / grant a card; if there is no room, convert it to gold */
function gift(filter: (it: (typeof ITEMS)[string]) => boolean, up: number) {
  const of = makeOffer(filter, { free: 1 });
  /* 跃迁送的卡也守白送的品质上限 / leap gifts also obey the free-card tier cap */
  of.card.tier = Math.min(Math.max(freeCap(), ITEMS[of.card.key].t), of.card.tier + up);
  const r = acquireState(of, null);
  if (r.ok) {
    afterChange(r.card);
    toast(t('jump.got', { n: ITEMS[r.card.key].n, t: TIERS[r.card.tier].n }));
    return r.card;
  }
  G.gold += 5;
  toast(t('jump.noRoom'));
  return null;
}

/** 每个人物的跃迁事件：标题、开场白、提示、选项 / each hero's leap event: title, opening line, hint, options */
export const JUMPS: Record<string, () => { opts: Opt[] }> = {
  /* 艾拉「点将」：立一张输出卡为 C 位并加成长；或者要一张流派卡 / Ayla's 'Call the Roll': make one damage card the carry and give it growth; or take an archetype card */
  ayla: () => {
    const n = 4 + G.round;
    const opts: Opt[] = byDmg(board())
      .slice(0, 3)
      .map((c) => ({ card: c, label: t('jump.ayla.pick', { n: ITEMS[c.key].n }), sub: t('jump.ayla.pickSub', { n }), act: () => {
        crown(c);
        c.grow = (c.grow || 0) + n;
        repaint(c);
      } }));
    const open = pathsOf(G.hero).filter((p) => pathOpen(G.hero, p));
    for (const p of open.slice(-1))
      opts.push({ ico: 'oathsword', label: t('jump.ayla.path', { p: p.n }), sub: L.ui.jump.ayla.pathSub, act: () => {
        gift((it) => p.cards.some((k) => ITEMS[k] === it), 1);
      } });
    return { opts };
  },
  /* 墨「课题」：专攻一个元素——送一张这个元素的卡（高一档），棋盘上这个元素最强的卡立为 C 位 / Mo's 'Thesis': specialize in one element — grant a card of that element (one tier higher) and make the strongest card of that element on the board the carry */
  mo: () => {
    const tags: Tag[] = ['fire', 'ice', 'volt', 'poison'];
    const have = board().map((c) => ITEMS[c.key].tag);
    const main = tags.filter((x) => have.includes(x));
    const pickTags = [...main, ...shuffled(tags.filter((x) => !main.includes(x)))].slice(0, 3);
    return {
      opts: pickTags.map((tg) => ({ ico: { fire: 'spark', ice: 'frost', volt: 'bolt', poison: 'venom' }[tg]!, label: t('jump.mo.pick', { t: L.terms.tags[tg] }), sub: L.ui.jump.mo.pickSub, act: () => {
        const got = gift((it) => it.tag === tg && it.dmg > 0, 1);
        const best = byDmg(board().filter((c) => ITEMS[c.key].tag === tg))[0] || got;
        if (best) crown(best);
      } })),
    };
  },
  /* 萤「图纸」：改装一张小卡——升一档（最多到钻），再照着它做一张同流派的小卡。萤靠的是数量，不立 C 位 / Ying's 'Blueprints': refit a small card — upgrade it one tier (up to diamond), then make a copy of it in the same archetype. Ying relies on quantity, so she sets no carry */
  ying: () => {
    let cs = board().filter((c) => c.size === 1);
    if (!cs.length) cs = board();
    cs = cs.sort((a, b) => b.tier - a.tier || stats(b, null).total - stats(a, null).total);
    return {
      opts: cs.slice(0, 3).map((c) => ({ card: c, label: t('jump.ying.pick', { n: ITEMS[c.key].n }), sub: c.tier < 3 ? t('jump.ying.pickSub', { t: TIERS[c.tier + 1].n }) : L.ui.jump.ying.pickMax, act: () => {
        if (c.tier < 3) c.tier++;
        repaint(c);
        restart(elOf(c), 'merge');
        const p = pathsOf(G.hero).find((x) => x.cards.includes(c.key) && pathOpen(G.hero, x));
        gift((it) => it.size === 1 && it.hero === G.hero && (!p || p.cards.some((k) => ITEMS[k] === it)), 0);
        afterMerge();
      } })),
    };
  },
};

/** 这一夜备战一共几站：平时 3 站，跃迁夜多一站 / how many prep stops this night: 3 normally, one more on leap nights */
export const prepStops = () => (hasJump() ? 4 : 3);
/* 钧「布防图」：定一处主炮位（C 位 + 城墙上限）；或者领一张流派卡 / Jun's 'Defense Map': stake out a main gun position (carry + wall cap); or take an archetype card */
JUMPS.jun = () => {
  const n = 2 + G.round;
  const opts: Opt[] = byDmg(board())
    .slice(0, 2)
    .map((c) => ({ card: c, label: t('jump.jun.pick', { n: ITEMS[c.key].n }), sub: t('jump.jun.pickSub', { n }), act: () => {
      crown(c);
      G.wallMax += n;
      G.wall += n;
    } }));
  for (const p of pathsOf(G.hero).filter((x) => pathOpen(G.hero, x)).slice(-1))
    opts.push({ ico: 'cannon', label: t('jump.jun.path', { p: p.n }), sub: L.ui.jump.jun.pathSub, act: () => {
      gift((it) => p.cards.some((k) => ITEMS[k] === it), 1);
    } });
  return { opts };
};
/* 璃「星象」：已经有 C 位就再为它点一颗星（倍率一路往上叠）；也可以换一颗星 / Li's 'Astrology': if a carry already exists, light another star for it (the multiplier keeps stacking); or move the star */
JUMPS.li = () => {
  const cur = board().find((c) => c.carry);
  const opts: Opt[] = [];
  if (cur)
    opts.push({ card: cur, label: t('jump.li.star', { n: ITEMS[cur.key].n }), sub: t('jump.li.starSub', { s: cur.star || 0, t: (cur.star || 0) + 1 }), act: () => {
      cur.star = (cur.star || 0) + 1;
      crown(cur);
    } });
  for (const c of byDmg(board()).filter((x) => x !== cur).slice(0, cur ? 2 : 3))
    opts.push({ card: c, label: t('jump.li.pick', { n: ITEMS[c.key].n }), sub: L.ui.jump.li.pickSub, act: () => {
      c.star = Math.max(c.star || 0, 1);
      crown(c);
    } });
  return { opts };
};

/** 这个人物用哪一套跃迁（模组人物可以借用五个人物的玩法） / which leap set this hero uses (mod heroes may borrow one of the five) */
const jumpOf = () => HEROES[G.hero]?.jump || G.hero;
export const hasJump = () => jumpNights().includes(G.round) && !G.endless && !!JUMPS[jumpOf()];

export function startJump(): PrepStop {
  const J = (L.ui.jump as any)[jumpOf()];
  const { opts } = JUMPS[jumpOf()]();
  /* 选完算走完这一站 / choosing completes this stop */
  for (const o of opts) {
    const f = o.act;
    o.act = () => {
      f();
      finishStep();
    };
  }
  return { id: 'jump', mode: 'choice', jump: 1, ev: { n: J.title, f: J.flav, ico: J.ico, cat: 'fight' }, hint: J.hint, opts };
}
