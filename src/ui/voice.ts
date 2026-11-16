/* 战斗内叙事：台词气泡 / 战报字幕 / 新敌人卡片。
 * 纯表现层：不读写战斗数值，不暂停模拟，不接收点击（pointer-events:none）
 * In-battle narrative: bark bubbles / report subtitles / new-enemy cards. Presentation only: reads or writes no combat values, never pauses the sim, receives no clicks (pointer-events:none)
 */
import { EN } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { VOICES } from '../data/voices';
import { L } from '../i18n';
import type { Line } from '../data/types';
import { G } from '../game/state';
import { pickLine } from '../game/text';
import { spr } from '../render/sprites';
import { $, restart } from './dom';
import { LANE, laneWait, laneTake } from './lane';

const VO = { q: [] as { who: string; t: string; pri: number }[], until: 0, last: 0, timer: 0 as any };

/** box：头像框的 CSS 边长，敌人图按它取整数倍 / box: the portrait slot's CSS size; enemy sprites take an integer scale from it */
export function voiceOf(who: string, box = 32) {
  if (who === 'hero') {
    const H = HEROES[G.hero];
    return { n: H.n, img: spr(H.portrait).fit(box), c: H.col };
  }
  if (VOICES[who]) {
    const v = VOICES[who];
    return { n: v.n, img: spr(v.img).fit(box), c: v.c };
  }
  if (EN[who]) {
    const d = EN[who];
    return { n: d.n, img: spr(d.spr).fit(box), c: d.col || '#ff8a80' };
  }
  return { n: '', img: spr('lantern').fit(box), c: '#fff' };
}

/** pri：3=剧情/首领（必播，可插队）2=新敌人/重要事件 1=随机反应（空闲时才播） / pri: 3 = story/boss (always plays, can cut in), 2 = new enemy/important event, 1 = random reaction (only when idle) */
export function say(who: string, text: Line, pri?: number) {
  const t = pickLine(text);
  if (!t) return;
  pri = pri || 1;
  const now = performance.now();
  if (pri === 1 && (now - VO.last < 5500 || VO.q.length || now < VO.until || laneWait(LANE.bark) > 0)) return;
  VO.q.push({ who, t, pri });
  VO.q.sort((a, b) => b.pri - a.pri);
  if (VO.q.length > 5) VO.q.length = 5;
  pump();
}
function pump() {
  const now = performance.now();
  if (now < VO.until) {
    clearTimeout(VO.timer);
    VO.timer = setTimeout(pump, VO.until - now + 40);
    return;
  }
  const it = VO.q[0];
  if (!it) return;
  /* 喊话排在连招发现、横幅、敌人介绍卡后面；旁白是下沿的字幕，不用等 / shouts wait behind combo discoveries, banners and enemy cards; narration is a bottom subtitle and never waits */
  const wait = it.who === 'narr' ? 0 : laneWait(LANE.bark);
  if (wait > 0) {
    clearTimeout(VO.timer);
    VO.timer = setTimeout(pump, wait + 40);
    return;
  }
  VO.q.shift();
  const dur = Math.min(5200, Math.max(2000, 900 + it.t.length * 85));
  const el = $('#bark');
  if (it.who === 'narr') {
    el.className = 'bark sub';
    el.innerHTML = `<p>${it.t}</p>`;
  } else {
    const w = voiceOf(it.who);
    el.className = 'bark';
    el.style.setProperty('--vc', w.c);
    el.innerHTML = `<img src="${w.img}" alt=""><div><b>${w.n}</b><p>${it.t}</p></div>`;
    if (it.who !== 'hero' && EN[it.who]) el.classList.add('foe');
    /* 被更重要的消息打断：剧情、首领台词没讲到一半就放回队首，等会儿重讲 / cut off by something more important: story and boss lines cut before halfway go back to the front of the queue */
    laneTake(LANE.bark, dur, () => {
      if (it.pri >= 2 && performance.now() - now < dur / 2) VO.q.unshift(it);
      el.className = 'bark';
      VO.until = 0;
      clearTimeout(VO.timer);
      VO.timer = setTimeout(pump, 60);
    });
  }
  el.style.setProperty('--dur', dur + 'ms');
  restart(el, 'show');
  VO.until = now + dur + 250;
  VO.last = now;
  clearTimeout(VO.timer);
  VO.timer = setTimeout(pump, dur + 290);
}
export function clearVO() {
  VO.q.length = 0;
  VO.until = 0;
  clearTimeout(VO.timer);
  $('#bark').className = 'bark';
  clearFoe();
}

/** 本局第一次遇到某种敌人：右上角弹出介绍卡。几种敌人一起出来时一张一张轮流出 / first time meeting an enemy this run: pop up an intro card in the top-right; when several arrive together they take turns */
const FQ: [string, boolean][] = [];
let fqT: ReturnType<typeof setTimeout> | null = null;
export function foeCard(type: string, firstEver: boolean) {
  if (FQ.length < 3) FQ.push([type, firstEver]);
  pumpFoe();
}
function pumpFoe() {
  if (fqT) return;
  const wait = laneWait(LANE.foe);
  if (wait > 0) {
    fqT = setTimeout(() => {
      fqT = null;
      pumpFoe();
    }, wait + 40);
    return;
  }
  const nx = FQ.shift();
  if (!nx) return;
  const [type, firstEver] = nx;
  const d = EN[type];
  const el = $('#foeCard');
  el.style.setProperty('--fc', d.col || '#ff8a80');
  const bb = $('#bossbar');
  el.style.top = (bb && !bb.hidden ? bb.offsetHeight + 16 : 8) + 'px';
  const T = L.ui.battle;
  const fac = (L.terms.factions as Record<string, string>)[d.faction];
  el.innerHTML = `<img src="${spr(d.spr).fit(48)}" alt=""><div><small>${firstEver ? T.firstMeet : T.metAgain}${fac ? ' · ' + fac : ''}</small><b>${d.n}</b><p>${d.tip}</p></div>`;
  restart(el, 'show');
  laneTake(LANE.foe, 3600, () => el.classList.remove('show'));
  if (FQ.length) pumpFoe();
}
function clearFoe() {
  FQ.length = 0;
  if (fqT) clearTimeout(fqT);
  fqT = null;
  $('#foeCard').classList.remove('show');
}
