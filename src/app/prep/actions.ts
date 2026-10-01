/* 备战的操作：进一站、拿卡、卖卡、拿遗物、学天赋、夜谈、离开。改完状态顺手刷新界面 */
import { ITEMS, ADJ, TIERS, UPS } from '../../data/cards';
import { EVENTS } from '../../data/events';
import { RELICS } from '../../data/relics';
import { TALENTS } from '../../data/talents';
import { L, t } from '../../i18n';
import { rand, pick, shuffled } from '../../core/rng';
import { clamp } from '../../core/util';
import { G, type Card, type Offer, type PrepStop } from '../../game/state';
import { stats, sellValue } from '../../game/cards';
import { unlock, foundSecret, mastLv } from '../../game/meta';
import { rollAdj, makeOffer, rollGear, gearPrice, withFit, rollTalents, lockedOffers } from '../../game/loot';
import { EVENT_FILTER, rollDoors, acquireState, checkMerges, removeCard, gainRelicState, learnTalentState, ambushFoe, type Dest } from '../../game/prep';
import { heat } from '../../game/state';
import { SFX } from '../../audio/sfx';
import { buzz } from '../../audio/settings';
import { FX } from '../../render/overlay';
import { $, restart } from '../../ui/dom';
import { elOf, renderOwned, repaint } from '../../ui/card-view';
import { updateHUD, renderRelics, toast, tipOnce } from '../../ui/hud';
import { renderPrep } from './view';

/* ---------------- 进一站 ---------------- */
export function enterEvent(id: string) {
  const T = L.ui.prep;
  if (EVENTS[id].cat === 'shop') tipOnce('shop', L.ui.tips.shop, 500);
  const ev = EVENTS[id];
  const cur: PrepStop = { id, ev, mode: '' };
  const P = G.prep;
  /* 隐藏事件：师父的信 / 卡尔的剑 */
  if (id === 's_letter') {
    Object.assign(cur, {
      mode: 'reward',
      text: `<div class="sletter">${L.story.secretLetter}</div><small>${T.gotLetter}</small>`,
      apply: () => {
        foundSecret('letter');
        gainRelic('mletter', true);
      },
    });
    P.cur = cur;
    renderPrep();
    return;
  }
  if (id === 's_karl') {
    const mine = G.cards.filter((c) => c.key === 'oathsword').map((c) => c.tier);
    const tier = Math.min(2, mine.length ? Math.max(...mine) : 1);
    Object.assign(cur, { mode: 'gift', offers: [{ card: { key: 'oathsword', tier, adj: null, size: ITEMS.oathsword.size, dl: 0, hoard: 0 }, price: 0, sold: false }] });
    foundSecret('karl');
    P.cur = cur;
    renderPrep();
    tipOnce('s_karl', L.ui.tips.s_karl, 300);
    return;
  }
  if (ev.cat === 'shop') {
    cur.mode = 'shop';
    cur.refresh = 1;
    cur.offers = lockedOffers([0, 1, 2].map(() => makeOffer(EVENT_FILTER[id], { black: ev.black })));
  } else if (id === 'ambush') Object.assign(cur, { mode: 'ambush', foe: ambushFoe() });
  else if (id === 'chest') {
    cur.mode = 'gift';
    cur.offers = [makeOffer(null, { free: 1 })];
  } else if (id === 'field') {
    cur.mode = 'pick';
    cur.offers = [0, 1, 2].map(() => makeOffer(null, { free: 1 }));
  } else if (id === 'altar') relicChoice(cur, T.altarHint, withFit(rollGear(3, 0, 2)));
  else if (id === 'parcel') relicChoice(cur, T.parcelHint, withFit(rollGear(1, 1, 2), 0.3));
  else if (id === 'grocer') {
    cur.mode = 'gshop';
    cur.refresh = 1;
    cur.goods = withFit(rollGear(3, 1)).map((k) => ({ k, price: gearPrice(k), sold: false }));
  } else if (id === 'enchant') {
    cur.mode = 'choice';
    cur.hint = T.enchantHint;
    cur.opts = shuffled(G.cards)
      .slice(0, 3)
      .map((c) => {
        const a = rollAdj(c.key, true, c.adj, 1)!;
        return {
          card: c, label: ITEMS[c.key].n + ' → 【' + ADJ[a].n + '】', sub: ADJ[a].d,
          act: () => {
            c.adj = a;
            repaint(c);
            renderOwned();
            SFX.play('merge');
            FX.burstAt(elOf(c), ADJ[a].c, 20);
            restart(elOf(c), 'merge');
            finishStep();
          },
        };
      });
  } else if (id === 'train') {
    cur.mode = 'choice';
    cur.hint = T.trainHint;
    cur.opts = shuffled(G.cards.filter((c) => c.tier < 2))
      .slice(0, 3)
      .map((c) => {
        const nx = Object.assign({}, c, { tier: c.tier + 1 });
        const a = stats(c, null),
          b = stats(nx, null);
        return {
          card: c, label: ITEMS[c.key].n + L.ui.common.colon + TIERS[c.tier].n + ' → ' + TIERS[c.tier + 1].n,
          sub: ITEMS[c.key].dmg ? t('prep.trainSub', { a: Math.round(a.total), b: Math.round(b.total), c: a.cd.toFixed(2), d: b.cd.toFixed(2) }) : UPS[ITEMS[c.key].up].t,
          act: () => {
            c.tier++;
            repaint(c);
            afterMerge();
            renderOwned();
            SFX.play('merge');
            if (elOf(c)) {
              FX.burstAt(elOf(c), TIERS[c.tier].c, 24);
              restart(elOf(c), 'merge');
            }
            finishStep();
          },
        };
      });
  } else if (id === 'furnace') {
    cur.mode = 'choice';
    cur.hint = T.furnaceHint;
    cur.opts = shuffled(G.cards)
      .slice(0, 4)
      .map((c) => ({
        card: c, label: t('prep.sacrifice', { n: ITEMS[c.key].n }), sub: t('prep.sacrificeSub', { v: sellValue(c) }),
        act: () => {
          FX.burstAt(elOf(c), '#ef7d57', 26);
          SFX.play('boom');
          removeCard(c);
          renderOwned();
          relicChoice(cur, '', withFit(rollGear(3, 3)));
          renderPrep();
        },
      }));
  } else if (id === 'gamble') cur.mode = 'gamble';
  else if (id === 'mentor' || (id === 'manual' && rand() < 0.5)) {
    const m = pick(L.story.meets as { who: string; n: string; say: string }[]);
    Object.assign(cur, { mode: 'talent', who: m.who, intro: [[m.who, m.say]], picks: rollTalents(2), title: m.n });
  } else if (id === 'manual') {
    cur.mode = 'pick';
    cur.offers = [0, 1].map(() => makeOffer((it) => it.hero === G.hero && it.t >= 1, { free: 1 }));
  } else if (id === 'spring') {
    const h = Math.min(8, G.wallMax - G.wall);
    Object.assign(cur, {
      mode: 'reward', text: t('prep.springText', { n: h }),
      apply: () => {
        G.wall += h;
        SFX.play('merge');
      },
    });
  } else if (id === 'job') Object.assign(cur, { mode: 'reward', text: L.ui.prep.jobText, apply: () => gainGold(3) });
  else if (id === 'bank') {
    const g = clamp(Math.round(G.gold * 0.3), 2, 10);
    Object.assign(cur, { mode: 'reward', text: t('prep.bankText', { n: g }), apply: () => gainGold(g) });
    /* 隐藏事件：兜里正好 7 金时进钱庄，账房先生会抬头 */
    if (G.gold === 7) {
      foundSecret('bank');
      cur.text = `<div class="sletter">${L.story.secretBank}</div>` + cur.text;
    }
  }
  P.cur = cur;
  renderPrep();
}

/* ---------------- 夜谈 / 学天赋 ---------------- */
export function startTalk() {
  const talks = L.story.talks as any[];
  const sc = talks[Math.floor((G.round - 1) / 2) % talks.length];
  G.prep.cur = { id: 'talk', talk: 1, mode: 'talk', who: sc.who, title: sc.title, sc, li: 1, intro: sc.lines };
}
/** 夜谈选了一个回答：按回答的倾向抽天赋 */
export function answerTalk(cur: PrepStop, ans: string, re: string, cat: string) {
  cur.ans = ans;
  cur.re = re;
  cur.mode = 'talent';
  cur.picks = rollTalents((heat(8) ? 2 : 3) + (mastLv() >= 2 ? 1 : 0), cat);
  renderPrep();
}
export function endTalk(cur: PrepStop) {
  if (cur.talk) {
    G.prep.talkDone = true;
    G.prep.cur = null;
    renderPrep();
    if (G.firstPrep) {
      G.firstPrep = false;
      setTimeout(() => toast(t('prep.foeSetToast', { n: (L.terms.foesets as Record<string, string>)[G.foeSet] })), 700);
    }
  } else finishStep();
}
export function learnTalent(id: string) {
  if (!learnTalentState(id)) return;
  renderOwned();
  updateHUD();
  SFX.play('merge');
  toast(t('prep.learned', { n: TALENTS[id].n }));
}

/* ---------------- 金币 / 遗物 ---------------- */
export function gainGold(n: number) {
  G.gold += n;
  SFX.play('coin');
  const r = $('#pbody').getBoundingClientRect();
  FX.coins(r.left + r.width / 2, r.top + r.height / 2, Math.min(n, 8));
}

export function relicChoice(cur: PrepStop, hint: string, list: string[]) {
  cur.mode = 'relic';
  cur.hint = hint;
  cur.opts = list.map((r) => ({ relic: r, act: () => gainRelic(r) }));
}

export function gainRelic(r: string, stay?: boolean) {
  gainRelicState(r);
  SFX.play('merge');
  renderRelics(r);
  renderOwned();
  updateHUD();
  toast(t('prep.gotRelic', { n: RELICS[r].n }));
  if (!stay) finishStep();
}

/** 杂货铺买一件 */
export function buyGear(g: { k: string; price: number; sold: boolean }) {
  if (G.gold < g.price) {
    toast(L.ui.prep.noGold);
    restart($('#goldChip'), 'shake');
    SFX.play('bad');
    return;
  }
  G.gold -= g.price;
  g.sold = true;
  gainRelic(g.k, true);
  renderPrep();
}

export function finishStep() {
  const P = G.prep;
  P.step++;
  P.cur = null;
  if (P.step < 3) rollDoors();
  renderPrep();
  SFX.play('ui');
  if (P.step >= 3) restart($('#goBtn'), 'bump');
}

/* ---------------- 拿卡 / 卖卡 / 合成 ---------------- */
export function acquire(of: Offer, dest: Dest): boolean {
  const r = acquireState(of, dest);
  if (!r.ok) {
    if (r.why === 'full') {
      toast(L.ui.prep.noRoom);
      SFX.play('bad');
    } else if (r.why === 'gold') {
      toast(L.ui.prep.noGold);
      restart($('#goldChip'), 'shake');
      SFX.play('bad');
    }
    return false;
  }
  SFX.play('buy');
  if (r.card.adj) tipOnce('adj', L.ui.tips.adj, 400);
  afterChange(r.card);
  return true;
}
/** 钱够不够（拖到棋盘上买之前先看一眼） */
export function canAfford(of: Offer) {
  if (G.gold < of.price) {
    toast(L.ui.prep.noGold);
    restart($('#goldChip'), 'shake');
    SFX.play('bad');
    return false;
  }
  return true;
}

export function sellCard(c: Card) {
  const v = sellValue(c);
  G.gold += v;
  SFX.play('sell');
  FX.coinsAt(elOf(c), Math.min(v, 6));
  removeCard(c);
  toast(t('prep.sold', { n: v }));
}

/** 合成后的表现：音效、震动、提示、钻卡成就 */
function afterMerge() {
  const merged = checkMerges();
  if (!merged.length) return;
  merged.forEach(repaint);
  const any = merged[merged.length - 1];
  SFX.play('merge');
  buzz([12, 40, 18]);
  tipOnce('merge', L.ui.tips.merge, 1400);
  if (any.tier >= 3) unlock('dia');
  setTimeout(() => {
    const el = elOf(any);
    if (!el || !G.cards.includes(any)) return;
    restart(el, 'merge');
    FX.burstAt(el, TIERS[any.tier].c, 30);
    toast(t('prep.mergedTo', { n: ITEMS[any.key].n, t: TIERS[any.tier].n }));
  }, 30);
}

export function afterChange(placed?: Card) {
  afterMerge();
  renderOwned();
  if (G.phase === 'prep') renderPrep();
  updateHUD();
  if (placed && elOf(placed) && G.cards.includes(placed)) restart(elOf(placed), 'land');
}
