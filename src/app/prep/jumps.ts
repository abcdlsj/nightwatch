/* 跃迁事件：第 3、5、7 夜之前（敌人明显变强的几夜）备战多出一站，每个人物不同，
 * 用来定 C 位（这局的主力，独立乘区 ×1.25）和流派方向。选了就有实打实的收获，不是随便问问。 */
import { ITEMS, TIERS } from '../../data/cards';
import { L, t } from '../../i18n';
import { shuffled } from '../../core/rng';
import type { Tag } from '../../data/types';
import { G, type Card, type PrepStop } from '../../game/state';
import { stats, setCarry } from '../../game/cards';
import { makeOffer } from '../../game/loot';
import { acquireState } from '../../game/prep';
import { pathsOf, pathOpen } from '../../game/unlocks';
import { SFX } from '../../audio/sfx';
import { FX } from '../../render/overlay';
import { restart } from '../../ui/dom';
import { elOf, renderOwned, repaint } from '../../ui/card-view';
import { toast } from '../../ui/hud';
import { afterChange, afterMerge, finishStep } from './actions';

/** 哪几夜之前有跃迁事件 */
export const JUMP_NIGHTS = [3, 5, 7];

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
/** 送一张卡；没地方放就折成金币 */
function gift(filter: (it: (typeof ITEMS)[string]) => boolean, up: number) {
  const of = makeOffer(filter, { free: 1 });
  of.card.tier = Math.min(2, of.card.tier + up);
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

/** 每个人物的跃迁事件：标题、开场白、提示、选项 */
const JUMPS: Record<string, () => { opts: Opt[] }> = {
  /* 艾拉「点将」：立一张输出卡为 C 位并加成长；或者要一张流派卡 */
  ayla: () => {
    const n = 4 + G.round;
    const opts: Opt[] = byDmg(board())
      .slice(0, 3)
      .map((c) => ({ card: c, label: t('jump.ayla.pick', { n: ITEMS[c.key].n }), sub: t('jump.ayla.pickSub', { n }), act: () => {
        crown(c);
        c.grow = (c.grow || 0) + n;
        repaint(c);
      } }));
    const open = pathsOf('ayla').filter((p) => pathOpen('ayla', p));
    for (const p of open.slice(-1))
      opts.push({ ico: 'oathsword', label: t('jump.ayla.path', { p: p.n }), sub: L.ui.jump.ayla.pathSub, act: () => {
        gift((it) => p.cards.some((k) => ITEMS[k] === it), 1);
      } });
    return { opts };
  },
  /* 墨「课题」：专攻一个元素——送一张这个元素的卡（高一档），棋盘上这个元素最强的卡立为 C 位 */
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
  /* 萤「图纸」：改装一张小卡——升一档（最多到钻），再照着它做一张同流派的小卡。萤靠的是数量，不立 C 位 */
  ying: () => {
    let cs = board().filter((c) => c.size === 1);
    if (!cs.length) cs = board();
    cs = cs.sort((a, b) => b.tier - a.tier || stats(b, null).total - stats(a, null).total);
    return {
      opts: cs.slice(0, 3).map((c) => ({ card: c, label: t('jump.ying.pick', { n: ITEMS[c.key].n }), sub: c.tier < 3 ? t('jump.ying.pickSub', { t: TIERS[c.tier + 1].n }) : L.ui.jump.ying.pickMax, act: () => {
        if (c.tier < 3) c.tier++;
        repaint(c);
        restart(elOf(c), 'merge');
        const p = pathsOf('ying').find((x) => x.cards.includes(c.key) && pathOpen('ying', x));
        gift((it) => it.size === 1 && it.hero === 'ying' && (!p || p.cards.some((k) => ITEMS[k] === it)), 0);
        afterMerge();
      } })),
    };
  },
};

/** 这一夜备战一共几站：平时 3 站，跃迁夜多一站 */
export const prepStops = () => (hasJump() ? 4 : 3);
/* 钧「布防图」：定一处主炮位（C 位 + 城墙上限）；或者领一张流派卡 */
JUMPS.jun = () => {
  const n = 2 + G.round;
  const opts: Opt[] = byDmg(board())
    .slice(0, 2)
    .map((c) => ({ card: c, label: t('jump.jun.pick', { n: ITEMS[c.key].n }), sub: t('jump.jun.pickSub', { n }), act: () => {
      crown(c);
      G.wallMax += n;
      G.wall += n;
    } }));
  for (const p of pathsOf('jun').filter((x) => pathOpen('jun', x)).slice(-1))
    opts.push({ ico: 'cannon', label: t('jump.jun.path', { p: p.n }), sub: L.ui.jump.jun.pathSub, act: () => {
      gift((it) => p.cards.some((k) => ITEMS[k] === it), 1);
    } });
  return { opts };
};
/* 璃「星象」：已经有 C 位就再为它点一颗星（倍率一路往上叠）；也可以换一颗星 */
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

export const hasJump = () => JUMP_NIGHTS.includes(G.round) && !G.endless && !!JUMPS[G.hero];

export function startJump(): PrepStop {
  const J = (L.ui.jump as any)[G.hero];
  const { opts } = JUMPS[G.hero]();
  /* 选完算走完这一站 */
  for (const o of opts) {
    const f = o.act;
    o.act = () => {
      f();
      finishStep();
    };
  }
  return { id: 'jump', mode: 'choice', jump: 1, ev: { n: J.title, f: J.flav, ico: J.ico, cat: 'fight' }, hint: J.hint, opts };
}
