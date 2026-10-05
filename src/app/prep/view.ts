/* 备战界面：今晚预告、三站选门、各站内容、夜谈、准备好了、加码 / Prep screen: tonight's forecast, three door stops, each stop's content, night talks, ready, and modifiers */
import { ITEMS, ADJ, TIERS, GT, TAGC } from '../../data/cards';
import { EN } from '../../data/enemies';
import { EVENTS } from '../../data/events';
import { RELICS } from '../../data/relics';
import { TALENTS, TCAT } from '../../data/talents';
import { WAGERS, SYN, SYN2, OMENS } from '../../data/meta';
import { pathsOf } from '../../game/unlocks';
import { THREATS } from '../../data/threats';
import { nextSeg } from '../../game/threats';
import { L, t } from '../../i18n';
import { vr, rand } from '../../core/rng';
import type { Tag } from '../../data/types';
import { G, type Offer, type PrepStop } from '../../game/state';
import { boardCards, fits } from '../../game/cards';
import { synCount, synLevel, synPairs } from '../../game/synergy';
import { modText, plainMods, pickLine } from '../../game/text';
import { nightInfo } from '../../game/nights';
import { rollWagers, ambushGold, EVENT_FILTER } from '../../game/prep';
import { makeOffer, rollGear, gearPrice, withFit, isForeign } from '../../game/loot';
import { HEROES } from '../../data/heroes';
import { icon, spr } from '../../render/sprites';
import { FX } from '../../render/overlay';
import { SFX } from '../../audio/sfx';
import { $, $$, restart } from '../../ui/dom';
import { paintCard } from '../../ui/card-view';
import { updateHUD, toast, tipOnce } from '../../ui/hud';
import { voiceOf } from '../../ui/voice';
import { talentText } from '../../ui/sheets';
import { startDragOffer } from './drag';
import { startRule, enterEvent, finishStep, startTalk, answerTalk, endTalk, learnTalent, gainGold, buyGear, startGem, answerGem, endGem } from './actions';
import { startAmbush } from '../flow';
import { startJump, prepStops } from './jumps';

const fitTag = () => `<small class="gt fit">${L.ui.prep.fit}</small>`;

/* ---------------- 今晚预告 ---------------- / ---------------- Tonight's forecast ---------------- */
export function renderPreview() {
  const w = G.nextWave!;
  const cnt: Record<string, number> = {};
  w.forEach((s) => (cnt[s.type] = (cnt[s.type] || 0) + 1));
  $('#pvTitle').textContent = nightInfo(G.round).title;
  $('#pvList').innerHTML = Object.keys(cnt)
    .map((k) => {
      const d = EN[k];
      return `<span class="pv${d.elite || d.boss ? ' elite' : ''}"><img src="${spr(d.spr).url}" alt="">${d.elite || d.boss ? d.n : '×' + cnt[k]}</span>`;
    })
    .join('');
  const ds = Object.keys(cnt).map((k) => EN[k]);
  const boss = ds.find((d) => d.intents);
  const tough = ds.filter((d) => d.tip).sort((a, b) => b.hp * (1 + b.armor) - a.hp * (1 + a.armor))[0];
  /* 敌情：主力带说明，其余只写名字 / threats: the main one with its description, the rest by name only */
  const th = w.threats || [];
  const nx = nextSeg(G.round);
  const thLine =
    (th.length ? `<b>${t('prep.threats', { s: th.map((k, i) => (i ? THREATS[k].n : `${THREATS[k].n}（${THREATS[k].d}）`)).join(' · ') })}</b><br>` : '') +
    (nx ? `<b class="next">${t('prep.threatsNext', { a: nx.from, b: nx.to, s: nx.ids.map((k) => THREATS[k].n).join(' · ') })}</b><br>` : '');
  /* 异象和流派轮换一直挂在今晚情报里 / the omen and archetype rotation stay listed in tonight's intel */
  const pathN = (h: string, id: string) => pathsOf(h).find((p) => p.id === id)?.n || id;
  const R = G.rot;
  const varLine =
    (G.omen ? `<b class="omen">${t('prep.omenLine', { n: OMENS[G.omen].n, d: OMENS[G.omen].d })}</b><br>` : '') +
    (R && R.off
      ? `<b class="omen">${R.gh ? t('prep.rotLine', { off: pathN(G.hero, R.off), h: HEROES[R.gh].n, p: pathN(R.gh, R.gp) }) : t('prep.rotLineSolo', { off: pathN(G.hero, R.off) })}</b><br>`
      : '');
  $('#pvNote').innerHTML = varLine + thLine + (boss ? boss.intents!.map((it) => `【${it.n}】${it.d}`).join('<br>') : tough ? `${tough.n}${L.ui.common.colon}${tough.tip}` : '');
}

/* ---------------- 羁绊条：凑到新的一层时提示 ---------------- / ---------------- Synergy bar: announce each new tier reached ---------------- */
let synPrev: ReturnType<typeof synCount> | null = null;
const pairName = (k: string) => L.terms.syn2[k as keyof typeof L.terms.syn2];
export function renderSyn() {
  const el = $('#pvSyn');
  const n = synCount();
  const pairs = synPairs(n);
  if (G.phase === 'prep' && synPrev) {
    const old = synPairs(synPrev);
    const nw = pairs.find((k) => !old.includes(k));
    if (nw) {
      toast(t('prep.syn2Up', { n: pairName(nw), m: plainMods(SYN2[nw].m) }));
      SFX.play('merge');
    }
  }
  if (G.phase === 'prep' && synPrev) {
    for (const tg in n) {
      const a = synLevel(tg as Tag, n[tg as Tag]!),
        b = synLevel(tg as Tag, synPrev[tg as Tag] || 0);
      if (a > b) {
        const s = SYN[tg as Tag][a - 1];
        toast(t('prep.synUp', { t: L.terms.tags[tg as Tag], n: s[0], m: plainMods(s[1]) }));
        SFX.play('merge');
        break;
      }
    }
  }
  synPrev = n;
  if (!el) return;
  const ts = (Object.keys(n) as Tag[]).sort((a, b) => n[b]! - n[a]!);
  /* 风向一直挂着，提醒这局往哪边凑 / the wind chip stays up as a reminder of which way this run leans */
  const wind = G.wind
    ? `<span class="sy-l">${L.ui.prep.wind}</span>` + [G.wind, G.wind2].filter((w): w is Tag => !!w).map((w) => `<span class="sy on wind" style="--tagc:${TAGC[w]}">${L.terms.tags[w]}</span>`).join('')
    : '';
  el.innerHTML = wind + (ts.length
    ? `<span class="sy-l">${L.ui.prep.syn}</span>` +
      ts
        .map((tg) => {
          const lv = synLevel(tg, n[tg]!);
          const nx = SYN[tg][lv];
          return `<span class="sy${lv ? ' on' : ''}" style="--tagc:${TAGC[tg]}">${L.terms.tags[tg]}<b>${n[tg]}</b>${nx ? '<small>/' + nx[0] + '</small>' : ''}</span>`;
        })
        .join('') +
      pairs.map((k) => `<span class="sy on pair" style="--tagc:${TAGC[SYN2[k].a]};--tagc2:${TAGC[SYN2[k].b]}">${pairName(k)}</span>`).join('')
    : '');
}

/* ---------------- 各站 ---------------- / ---------------- The stops ---------------- */
function evHead(e: (typeof EVENTS)[string]) {
  return `<div class="ev-head cat-${e.cat}"><img src="${icon(e.ico).url}" alt=""><div><b>${e.n}</b><em>${e.f}</em></div></div>`;
}
function btnRow(defs: [string, string, () => void][]) {
  const row = document.createElement('div');
  row.className = 'ev-btns';
  defs.forEach(([txt, cls, fn]) => {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.innerHTML = txt;
    b.onclick = () => {
      SFX.ensure();
      fn();
    };
    row.appendChild(b);
  });
  return row;
}
const refreshBtn = (n: number) => t('prep.refresh', { n });
const coinImg = () => `<img class="ico" src="${spr('coin').url}" alt="">`;

export function gearLabel(k: string) {
  const g = RELICS[k];
  const n = G.relics.filter((x) => x === k).length;
  const c = GT[g.t].c;
  return `<span style="color:${c}">${g.n}</span><small class="gt" style="--gc:${c}">${GT[g.t].n}</small>${g.fit ? fitTag() : ''}${n ? `<small class="gt">${t('prep.owned', { n })}</small>` : ''}`;
}

export function renderPrep() {
  const P = G.prep,
    body = $('#pbody');
  const T = L.ui.prep;
  const stops = prepStops();
  $('#stepPips').innerHTML = [...Array(stops).keys()].map((i) => `<i class="${i < P.step ? 'done' : i === P.step ? 'now' : ''}"></i>`).join('');
  body.innerHTML = '';
  /* 跃迁夜：三站走完后多一站，定 C 位 / leap night: one extra stop after the usual three, which picks the carry */
  if (P.step === 3 && stops === 4 && !P.cur) P.cur = startJump();
  if (P.step >= stops) {
    body.innerHTML = readyHtml() + wagerHtml();
    bindWagers();
    updateHUD();
    return;
  }
  if (!P.cur && P.gem && !P.gemDone && P.step === 0) startGem();
  if (!P.cur && P.rule && !P.ruleDone && P.step === 0) startRule();
  if (!P.cur && P.talk && !P.talkDone && P.step < 3) startTalk();
  const cur = P.cur;
  $('#prep').classList.toggle('talking', !!cur && ['talk', 'talent', 'gem', 'gemDone'].includes(cur.mode));
  if (cur && (cur.mode === 'gem' || cur.mode === 'gemDone')) {
    renderGem(cur, body);
    updateHUD();
    return;
  }
  if (!cur) {
    body.insertAdjacentHTML('beforeend', `<div class="ptitle">${T.where}<span>${t('prep.stop', { n: P.step + 1, m: stops })}</span></div>`);
    const list = document.createElement('div');
    list.className = 'doors';
    P.doors.forEach((id) => {
      const e = EVENTS[id];
      const b = document.createElement('button');
      b.className = 'door cat-' + e.cat;
      b.innerHTML = `<img src="${icon(e.ico).url}" alt=""><div><b>${e.n}</b><span>${e.d}</span><em>${e.f}</em></div>`;
      b.onclick = () => {
        SFX.ensure();
        SFX.play('ui');
        enterEvent(id);
      };
      list.appendChild(b);
    });
    body.appendChild(list);
    if (P.next?.length)
      body.insertAdjacentHTML(
        'beforeend',
        `<div class="nextstop"><span>${T.nextStop}</span>${P.next.map((id) => `<i class="cat-${EVENTS[id].cat}"><img src="${icon(EVENTS[id].ico).url}" alt="">${EVENTS[id].n}</i>`).join('')}</div>`,
      );
    updateHUD();
    return;
  }
  if (cur.mode === 'talk' || cur.mode === 'talent') {
    renderTalk(cur, body);
    updateHUD();
    return;
  }
  body.insertAdjacentHTML('beforeend', evHead(cur.ev));
  if (cur.mode === 'shop' || cur.mode === 'pick' || cur.mode === 'gift') {
    if (cur.mode === 'pick' && !cur.taken) body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${T.pickOne}</div>`);
    const grid = document.createElement('div');
    grid.id = 'offers';
    grid.style.gridTemplateColumns = `repeat(${cur.offers.length},minmax(0,${cur.offers.length === 1 ? '140px' : '1fr'}))`;
    cur.offers.forEach((of: Offer) => grid.appendChild(offerEl(of)));
    body.appendChild(grid);
    if (cur.mode === 'shop')
      body.appendChild(
        btnRow([
          ...(cur.refresh > 0
            ? [[refreshBtn(cur.refresh), 'blue', () => {
                cur.refresh--;
                cur.offers = cur.offers.map((o: Offer) => (o.locked && !o.sold ? o : makeOffer(EVENT_FILTER[cur.id], { black: cur.ev.black })));
                SFX.play('buy');
                renderPrep();
                $$('#offers .card').forEach((el) => restart(el, 'land'));
              }] as [string, string, () => void]]
            : []),
          [T.leave, '', finishStep],
        ]),
      );
    else body.appendChild(btnRow([[cur.taken ? T.next : T.noThanks, cur.taken ? 'green' : '', finishStep]]));
  } else if (cur.mode === 'choice' || cur.mode === 'relic') {
    if (cur.hint) body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${cur.hint}</div>`);
    const list = document.createElement('div');
    list.className = 'opts';
    cur.opts.forEach((o: any, i: number) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.style.animationDelay = i * 0.06 + 's';
      if (o.card) {
        const h = document.createElement('div');
        h.className = 'oc';
        const ce = document.createElement('div');
        paintCard(ce, o.card, 'static');
        h.appendChild(ce);
        b.appendChild(h);
        b.insertAdjacentHTML('beforeend', `<div><b>${o.label}</b><span>${o.sub}</span></div>`);
      } else if (o.ico) {
        b.insertAdjacentHTML('beforeend', `<img class="ricon" src="${icon(o.ico).url}" alt="">`);
        b.insertAdjacentHTML('beforeend', `<div><b>${o.label}</b><span>${o.sub}</span></div>`);
      } else {
        const R0 = RELICS[o.relic];
        b.insertAdjacentHTML('beforeend', `<img class="ricon" src="${icon(R0.ico).url}" alt="" style="--gc:${GT[R0.t].c}">`);
        b.insertAdjacentHTML('beforeend', `<div><b>${gearLabel(o.relic)}</b><span>${modText(R0.m)}</span>${R0.f ? `<em>${R0.f}</em>` : ''}</div>`);
      }
      b.onclick = () => {
        SFX.ensure();
        o.act();
      };
      list.appendChild(b);
    });
    body.appendChild(list);
    body.appendChild(btnRow([[T.skip, '', finishStep]]));
  } else if (cur.mode === 'gshop') {
    body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${T.buyMany}</div>`);
    const list = document.createElement('div');
    list.className = 'opts';
    cur.goods.forEach((g: { k: string; price: number; sold: boolean }, i: number) => {
      const R0 = RELICS[g.k];
      const b = document.createElement('button');
      b.className = 'opt' + (g.sold ? ' sold' : '');
      b.style.animationDelay = i * 0.06 + 's';
      b.innerHTML = `<img class="ricon" src="${icon(R0.ico).url}" alt="" style="--gc:${GT[R0.t].c}"><div><b>${gearLabel(g.k)}</b><span>${modText(R0.m)}</span><em>${R0.f}</em></div><span class="price${g.sold ? '' : g.price > G.gold ? ' cant' : ''}" data-p="${g.price}">${g.sold ? T.bought : `${coinImg()}${g.price}`}</span>`;
      if (!g.sold)
        b.onclick = () => {
          SFX.ensure();
          buyGear(g);
        };
      list.appendChild(b);
    });
    body.appendChild(list);
    body.appendChild(
      btnRow([
        ...(cur.refresh > 0
          ? [[refreshBtn(cur.refresh), 'blue', () => {
              cur.refresh--;
              cur.goods = withFit(rollGear(3, 1)).map((k) => ({ k, price: gearPrice(k), sold: false }));
              SFX.play('buy');
              renderPrep();
            }] as [string, string, () => void]]
          : []),
        [T.leave, '', finishStep],
      ]),
    );
  } else if (cur.mode === 'gamble') {
    body.insertAdjacentHTML('beforeend', `<div class="big-res">${cur.result || T.gambleAsk}</div>`);
    body.appendChild(
      btnRow(
        cur.result
          ? [[T.next, 'green', finishStep]]
          : [
              [`${T.bet} ${coinImg()}<b>3</b>`, 'gold', () => {
                if (G.gold < 3) {
                  toast(T.noGold);
                  return;
                }
                G.gold -= 3;
                const win = gambleRoll();
                if (win) {
                  G.gold += 6;
                  SFX.play('coin');
                  const r = $('#pbody').getBoundingClientRect();
                  FX.coins(r.left + r.width / 2, r.top + r.height / 2, 6);
                  cur.result = T.gambleWin;
                } else {
                  SFX.play('bad');
                  cur.result = T.gambleLose;
                }
                updateHUD();
                renderPrep();
              }],
              [T.leave, '', finishStep],
            ],
      ),
    );
  } else if (cur.mode === 'ambush') {
    body.insertAdjacentHTML('beforeend', ambushHtml(cur));
    body.appendChild(
      btnRow([
        [T.fight, 'red', () => startAmbush(cur)],
        [T.avoid, '', () => {
          G.prep.doors = G.prep.doors.filter((i) => i !== 'ambush');
          G.prep.cur = null;
          renderPrep();
        }],
      ]),
    );
  } else if (cur.mode === 'reward') {
    body.insertAdjacentHTML('beforeend', `<div class="big-res">${cur.text}</div>`);
    body.appendChild(btnRow([[T.accept, 'green', () => {
      cur.apply();
      updateHUD();
      finishStep();
    }]]));
  }
  updateHUD();
}

/** 赌桌：一半一半 / gamble table: fifty-fifty */
const gambleRoll = () => rand() < 0.5;

function offerEl(of: Offer) {
  const c = of.card;
  const ad = c.adj ? ADJ[c.adj] : null;
  const it = ITEMS[c.key];
  const T = L.ui.prep;
  const o = document.createElement('div');
  o.className = 'offer' + (of.sold ? ' sold' : '');
  o.dataset.sold = T.soldOut;
  const cel = document.createElement('div');
  paintCard(cel, c, 'static');
  o.appendChild(cel);
  o.insertAdjacentHTML(
    'beforeend',
    `<div class="oname">${it.n}${isForeign(c.key) ? `<small class="fg">${t('prep.foreign', { h: HEROES[it.hero!].n })}</small>` : ''}</div><div class="oadj"><span style="color:${TIERS[c.tier].c}">${TIERS[c.tier].n}</span>${ad ? ` · <span style="color:${ad.c}">${ad.n}</span>` : ''}</div><div class="odesc">${ad ? ad.d : it.d}</div><div class="oflav">${it.f}</div><div class="price${of.price === 0 ? ' free' : of.price > G.gold ? ' cant' : ''}" data-p="${of.price}">${of.price === 0 ? T.free : `<img class="ico" src="${spr('coin').url}" alt="${T.gold}">${of.price}`}</div>`,
  );
  if (!of.sold) cel.addEventListener('pointerdown', (e) => startDragOffer(e, of, cel));
  lockBtn(o, of, G.prep && G.prep.cur);
  return o;
}

/** 商店锁卡：锁住的卡原价出现在下一家店，一次只锁一张 / shop card locking: a locked card reappears at the next shop at full price; only one lock at a time */
function lockBtn(o: HTMLElement, of: Offer, cur: PrepStop | null) {
  if (!cur || cur.mode !== 'shop' || of.sold) return;
  const T = L.ui.prep;
  const b = document.createElement('button');
  b.className = 'lockb' + (of.locked ? ' on' : '');
  b.textContent = of.locked ? T.locked : T.lock;
  b.title = T.lockTitle;
  b.onclick = (e) => {
    e.stopPropagation();
    SFX.ensure();
    SFX.play('ui');
    if (of.locked) {
      of.locked = false;
      G.lock = null;
    } else {
      for (const x of cur.offers) x.locked = false;
      of.locked = true;
      G.lock = { card: Object.assign({}, of.card), price: of.price, sold: false };
      tipOnce('lock', L.ui.tips.lock, 200);
    }
    renderPrep();
  };
  o.appendChild(b);
  if (of.locked) o.classList.add('locked');
}

function ambushHtml(cur: PrepStop) {
  const d = EN[cur.foe];
  return `<div class="amb"><img src="${spr(d.spr).url}" alt=""><div><b>${d.n}</b><p>${d.tip}</p><p>${d.intents!.map((it) => '【' + it.n + '】' + it.d).join('<br>')}</p></div></div>
  <div class="ev-hint">${t('prep.ambushHint', { n: ambushGold() })}</div>`;
}

/* ---------------- 夜谈 ---------------- / ---------------- Night talk ---------------- */
function tline(who: string, tx: any) {
  const v = voiceOf(who);
  return `<div class="tl${who === 'hero' ? ' me' : ''}" style="--vc:${v.c}"><img src="${v.img}" alt=""><p><b>${v.n}</b>${pickLine(tx)}</p></div>`;
}
function renderTalk(cur: PrepStop, body: HTMLElement) {
  const T = L.ui.prep;
  body.insertAdjacentHTML('beforeend', `<div class="ptitle">${cur.talk ? T.talkTitle + cur.title : cur.title}<span>${cur.talk ? T.talkEvery : T.rare}</span></div>`);
  const log = document.createElement('div');
  log.className = 'tlog';
  const lines = (cur.intro || []).slice(0, cur.mode === 'talk' ? cur.li : 99);
  if (!cur.said) cur.said = lines.map(([w, tx]: [string, any]) => [w, pickLine(tx)]);
  while (cur.said.length < lines.length) {
    const [w, tx] = lines[cur.said.length];
    cur.said.push([w, pickLine(tx)]);
  }
  log.innerHTML = cur.ans ? tline('hero', cur.ans) + tline(cur.who, cur.re) + (cur.gain ? `<div class="ev-hint gain">${cur.gain}</div>` : '') : cur.said.map(([w, tx]: [string, string]) => tline(w, tx)).join('');
  body.appendChild(log);
  const list = document.createElement('div');
  list.className = 'opts';
  if (cur.mode === 'talk') {
    if (cur.li < cur.sc.lines.length) {
      body.appendChild(btnRow([[T.listen, 'blue', () => {
        cur.li++;
        SFX.play('ui');
        renderPrep();
      }]]));
    } else {
      body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${cur.sc.q}</div>`);
      cur.sc.ans.forEach((a: any, i: number) => {
        const b = document.createElement('button');
        b.className = 'opt say';
        b.style.animationDelay = i * 0.06 + 's';
        b.innerHTML = `<div><b>“${pickLine(a.t)}”</b></div>`;
        b.onclick = () => {
          SFX.ensure();
          SFX.play('ui');
          answerTalk(cur, pickLine(a.t), a.re, a.cat);
        };
        list.appendChild(b);
      });
      body.appendChild(list);
    }
  } else {
    body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${cur.picks.length ? T.learnOne : T.learnedAll}</div>`);
    cur.picks.forEach((id: string, i: number) => {
      const Tl = TALENTS[id],
        C = TCAT[Tl.cat];
      const b = document.createElement('button');
      b.className = 'opt';
      b.style.animationDelay = i * 0.06 + 's';
      b.innerHTML = `<img class="ricon" src="${icon(C.ico).url}" alt="" style="--gc:${C.c}"><div><b style="color:${C.c}">${Tl.n}<small class="gt" style="--gc:${C.c}">${C.n}</small>${Tl.hero ? `<small class="gt">${T.exclusive}</small>` : ''}${Tl.fit ? fitTag() : ''}</b>${talentText(id)}${Tl.say ? `<em>“${Tl.say}”</em>` : ''}</div>`;
      b.onclick = () => {
        SFX.ensure();
        learnTalent(id);
        endTalk(cur);
      };
      list.appendChild(b);
    });
    body.appendChild(list);
    body.appendChild(
      btnRow(
        cur.picks.length
          ? [[T.skipTalent, '', () => {
              gainGold(3);
              endTalk(cur);
            }]]
          : [[T.take5, 'gold', () => {
              gainGold(5);
              endTalk(cur);
            }]],
      ),
    );
  }
}

/* ---------------- 宝石（完整游戏线）：先听完几句，再决定拿不拿 ---------------- / ---------------- Gems (full game line): hear a few lines first, then decide whether to take it ---------------- */
function renderGem(cur: PrepStop, body: HTMLElement) {
  const T = L.ui.prep;
  const color = { red: '#ff6b5b', blue: '#73c8ff', green: '#7ee8a2' }[cur.gem as string];
  body.insertAdjacentHTML('beforeend', `<div class="ptitle gemt" style="--gemc:${color}">${cur.title}<span>${T.gemTag}</span></div>`);
  const log = document.createElement('div');
  log.className = 'tlog';
  const lines = cur.mode === 'gem' ? cur.intro.slice(0, cur.li) : cur.intro;
  log.innerHTML =
    lines.map(([w, tx]: [string, any]) => tline(w, tx)).join('') +
    (cur.mode === 'gemDone' ? tline('hero', cur.ans) + cur.re.map(([w, tx]: [string, any]) => tline(w, tx)).join('') + `<div class="ev-hint gain">${cur.gain}</div>` : '');
  body.appendChild(log);
  if (cur.mode === 'gemDone') {
    body.appendChild(btnRow([[T.next, 'green', endGem]]));
    return;
  }
  if (cur.li < cur.intro.length) {
    body.appendChild(btnRow([[T.listen, 'blue', () => {
      cur.li++;
      SFX.play('ui');
      renderPrep();
    }]]));
    return;
  }
  body.insertAdjacentHTML('beforeend', `<div class="ev-hint">${cur.sc.q}</div>`);
  const list = document.createElement('div');
  list.className = 'opts';
  const R0 = RELICS['gem_' + cur.gem];
  ([[true, cur.sc.take.t, `<span>${modText(R0.m)}</span>`], [false, cur.sc.refuse.t, `<span>${(T.gemRefuse as Record<string, string>)[cur.gem]}</span>`]] as [boolean, any, string][]).forEach(([take, tx, sub], i) => {
    const b = document.createElement('button');
    b.className = 'opt say';
    b.style.animationDelay = i * 0.06 + 's';
    b.innerHTML = `<div><b>“${pickLine(tx)}”</b>${sub}</div>`;
    b.onclick = () => {
      SFX.ensure();
      answerGem(cur, take);
    };
    list.appendChild(b);
  });
  body.appendChild(list);
}

/* ---------------- 准备好了：今晚情报 + 加码 ---------------- / ---------------- Ready: tonight's intel + modifiers ---------------- */
function readyHtml() {
  const P = G.prep;
  const T = L.ui.prep;
  const cnt: Record<string, number> = {};
  G.nextWave!.forEach((s) => (cnt[s.type] = (cnt[s.type] || 0) + 1));
  const ks = Object.keys(cnt).sort((a, b) => (EN[b].boss || EN[b].elite ? 1 : 0) - (EN[a].boss || EN[a].elite ? 1 : 0) || cnt[b] - cnt[a]);
  const bc = boardCards();
  const used = bc.reduce((s, c) => s + c.size, 0);
  const bag = G.cards.filter((c) => c.loc === 'stash');
  const canUp = bag.filter((c) => {
    for (let i = 0; i + c.size <= 8; i++) if (fits('board', i, c.size)) return true;
    return false;
  }).length;
  const warn: string[] = [];
  if (canUp) warn.push(t('prep.warnBag', { n: canUp }));
  else if (used < 8) warn.push(t('prep.warnEmpty', { n: 8 - used }));
  if (G.wall < G.wallMax * 0.4) warn.push(t('prep.warnWall', { n: Math.ceil(G.wall) }));
  const tips = L.meta.readyTips as string[];
  if (P.tipI == null) P.tipI = Math.floor(vr() * tips.length);
  return `<div class="ready"><div class="rd-t">${T.ready}</div><p>${nightInfo(G.round).title}</p>
    <div class="intel"><div class="il-h">${T.coming}</div>${(G.nextWave!.threats || [])
      .map((k) => `<div class="ithreat"><b>${THREATS[k].n}</b><span>${THREATS[k].d}</span></div>`)
      .join('')}${nextLine()}${ks
      .map((k) => {
        const d = EN[k];
        return `<div class="ifoe${d.boss || d.elite ? ' elite' : ''}"><img src="${spr(d.spr).url}" alt=""><b>${d.n}</b><small>${d.boss ? T.boss : d.elite ? T.elite : '×' + cnt[k]}</small><span>${d.tip || T.minion}</span></div>`;
      })
      .join('')}</div>
    ${warn.length ? `<div class="iwarn">${warn.map((w) => `<span>${w}</span>`).join('')}</div>` : ''}
    <p class="muted">${T.tipPre}${tips[P.tipI]}</p></div>`;
}

/** 段末那夜：下一段的敌情 / on a segment's last night: the next segment's threats */
function nextLine() {
  const nx = nextSeg(G.round);
  return nx ? `<div class="ithreat next"><b>${t('prep.threatsNext', { a: nx.from, b: nx.to, s: '' })}</b><span>${nx.ids.map((k) => `${THREATS[k].n}（${THREATS[k].d}）`).join(' · ')}</span></div>` : '';
}

function wagerHtml() {
  const P = G.prep;
  if (G.round >= G.maxRound) return '';
  if (!P.wagers) P.wagers = rollWagers();
  return `<div class="wagers"><div class="wg-t">${L.ui.prep.wager}</div>${P.wagers
    .map((k) => {
      const W = WAGERS[k];
      return `<button class="wg${P.wager === k ? ' on' : ''}" data-w="${k}"><b>${W.n}</b><span>${W.d}</span><em>${W.r}</em></button>`;
    })
    .join('')}</div>`;
}
function bindWagers() {
  $$('.wg').forEach(
    (b) =>
      (b.onclick = () => {
        SFX.ensure();
        const k = b.dataset.w!;
        G.prep.wager = G.prep.wager === k ? null : k;
        SFX.play(G.prep.wager ? 'intent' : 'ui');
        $$('.wg').forEach((x) => x.classList.toggle('on', x.dataset.w === G.prep.wager));
      }),
  );
}
