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

const VO = { q: [] as { who: string; t: string; pri: number }[], until: 0, last: 0, timer: 0 as any };

export function voiceOf(who: string) {
  if (who === 'hero') {
    const H = HEROES[G.hero];
    return { n: H.n, img: spr(H.portrait).url, c: H.col };
  }
  if (VOICES[who]) {
    const v = VOICES[who];
    return { n: v.n, img: spr(v.img).url, c: v.c };
  }
  if (EN[who]) {
    const d = EN[who];
    return { n: d.n, img: spr(d.spr).url, c: d.col || '#ff8a80' };
  }
  return { n: '', img: spr('lantern').url, c: '#fff' };
}

/** pri：3=剧情/首领（必播，可插队）2=新敌人/重要事件 1=随机反应（空闲时才播） / pri: 3 = story/boss (always plays, can cut in), 2 = new enemy/important event, 1 = random reaction (only when idle) */
export function say(who: string, text: Line, pri?: number) {
  const t = pickLine(text);
  if (!t) return;
  pri = pri || 1;
  const now = performance.now();
  if (pri === 1 && (now - VO.last < 5500 || VO.q.length || now < VO.until)) return;
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
  const it = VO.q.shift();
  if (!it) return;
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
}

/** 本局第一次遇到某种敌人：右上角弹出介绍卡 / first time meeting an enemy this run: pop up an intro card in the top-right */
export function foeCard(type: string, firstEver: boolean) {
  const d = EN[type];
  const el = $('#foeCard');
  el.style.setProperty('--fc', d.col || '#ff8a80');
  const bb = $('#bossbar');
  el.style.top = (bb && !bb.hidden ? bb.offsetHeight + 16 : 8) + 'px';
  const T = L.ui.battle;
  const fac = (L.terms.factions as Record<string, string>)[d.faction];
  el.innerHTML = `<img src="${spr(d.spr).url}" alt=""><div><small>${firstEver ? T.firstMeet : T.metAgain}${fac ? ' · ' + fac : ''}</small><b>${d.n}</b><p>${d.tip}</p></div>`;
  restart(el, 'show');
}
