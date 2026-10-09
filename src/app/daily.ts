/* 每日挑战的界面：标题页的说明弹层、结局页的成绩和提交、排行榜 / Daily challenge UI: the title-screen panel, the end-screen result and submit, and the leaderboard */
import { HEROES } from '../data/heroes';
import { L, t } from '../i18n';
import { G } from '../game/state';
import { dailySpec, dailyRec, dailyAvailable, dailyResult, markDailyDone, markDailySent, dayKey, type DailySpec, type DailyResult } from '../game/daily';
import { loadSave } from '../game/save';
import { apiOn, uid, postJson, getJson } from '../platform/api';
import { track } from '../platform/telemetry';
import { store, KEYS } from '../platform/storage';
import { SFX } from '../audio/sfx';
import { $ } from '../ui/dom';
import { sheetOpen, closeSheet } from '../ui/sheets';
import { toast } from '../ui/hud';

const q = (root: ParentNode, sel: string) => root.querySelector<HTMLElement>(sel)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const heatName = (h: number) => (h ? t('heroes.heat', { h }) : L.ui.daily.normal);
const specLine = (s: { day: string; hero: string; heat: number }) => t('daily.sub', { d: s.day, h: HEROES[s.hero]?.n || s.hero, heat: heatName(s.heat) });
const resLine = (r: DailyResult) => (r.won ? L.ui.daily.dawn + ' · ' : '') + t('daily.result', { n: r.nights, w: r.wall, k: r.kills });

/* ---------------- 标题页的弹层 ---------------- / ---------------- Title-screen panel ---------------- */
export function openDaily(start: (s: DailySpec) => void, resume: () => void) {
  SFX.play('ui');
  const T = L.ui.daily;
  const spec = dailySpec();
  const rec = dailyRec();
  const sv = loadSave();
  const today = rec?.day === spec.day ? rec : null;
  let body = '';
  let btns = '';
  if (dailyAvailable(spec.day)) {
    btns = `<button class="btn red" id="dStart">${sv ? T.startOver : T.start}</button>`;
  } else if (today?.state === 'on') {
    /* 存档还是今天这局：可以接着打；不是了就是作废了 / the save is still today's run: continue it; otherwise it was voided */
    if (sv?.daily === spec.day) btns = `<button class="btn gold" id="dCont">${T.cont}</button>`;
    else body = `<p>${T.voided}</p>`;
  } else if (today?.res) body = `<p><b>${T.played}</b> ${resLine(today.res)}</p>${today.sent ? '' : sendForm()}`;
  else body = `<p>${T.played}</p>`;
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.title}"><h3>${T.title}</h3><p class="set-bk"><b>${specLine(spec)}</b></p>
    <div class="rules daily-rules">${(T.rules as string[]).map((r, i) => `<div><i>${i + 1}</i><span>${r}</span></div>`).join('')}</div>
    ${body}
    <div class="sh-btns">${btns}<button class="btn" id="dBoard">${T.board}</button></div>
    <div class="sh-btns"><button class="btn" id="dClose">${L.ui.sheet.close}</button></div></div>`);
  if (sh.querySelector('#dStart'))
    q(sh, '#dStart').onclick = () => {
      closeSheet();
      start(spec);
    };
  if (sh.querySelector('#dCont'))
    q(sh, '#dCont').onclick = () => {
      closeSheet();
      resume();
    };
  if (today?.res && !today.sent) bindSend(sh, today.res);
  q(sh, '#dBoard').onclick = () => openBoard(spec.day);
  q(sh, '#dClose').onclick = closeSheet;
}

/* ---------------- 结局页 ---------------- / ---------------- End screen ---------------- */
/** 结局页里的每日挑战一段：记下成绩，给出提交表单 / the daily section on the end screen: record the result and offer the submit form */
export function dailyEndHtml(win: boolean) {
  const T = L.ui.daily;
  const rec = markDailyDone(dailyResult(win));
  const r = rec.res!;
  track('daily_end', { day: r.day, won: r.won, nights: r.nights });
  return `<div class="rules res daily-end"><div><span>${t('daily.endTitle', { d: r.day })}</span></div><div><span>${resLine(r)}</span></div><div><small>${T.noMeta}</small></div>
  ${rec.sent ? `<div><small>${T.already}</small></div>` : sendForm()}<div class="sh-btns"><button class="btn sm" id="dBoard">${T.board}</button></div></div>`;
}
export function bindDailyEnd() {
  const rec = dailyRec();
  const sc = $('#screen');
  if (rec?.res && !rec.sent) bindSend(sc, rec.res);
  const b = sc.querySelector<HTMLElement>('#dBoard');
  if (b) b.onclick = () => openBoard(rec?.day || G.daily || dayKey());
}

/* ---------------- 提交 ---------------- / ---------------- Submit ---------------- */
function sendForm() {
  const T = L.ui.daily;
  if (!apiOn()) return `<div><small>${T.off}</small></div>`;
  const nick = esc(store.get(KEYS.nick) || '');
  return `<div class="daily-send"><input id="dName" maxlength="12" placeholder="${T.namePh}" aria-label="${T.name}" value="${nick}" autocomplete="nickname"><button class="btn gold sm" id="dSend">${T.submit}</button></div>`;
}

interface ScoreRes {
  ok: boolean;
  first?: boolean;
  me?: { rank: number } | null;
}
function bindSend(root: HTMLElement, res: DailyResult) {
  const btn = root.querySelector<HTMLButtonElement>('#dSend');
  const inp = root.querySelector<HTMLInputElement>('#dName');
  if (!btn || !inp) return;
  const T = L.ui.daily;
  btn.onclick = async () => {
    SFX.ensure();
    const name = inp.value.trim().slice(0, 12);
    store.set(KEYS.nick, name);
    btn.disabled = true;
    btn.textContent = T.sending;
    const r = await postJson<ScoreRes>('/score', { ...res, uid: uid(), name });
    if (!r || !r.ok) {
      btn.disabled = false;
      btn.textContent = T.submit;
      toast(T.sendFail);
      return;
    }
    markDailySent();
    track('daily_submit', { day: res.day, first: !!r.first });
    SFX.play('merge');
    const form = btn.parentElement!;
    form.outerHTML = `<div><small>${r.first && r.me ? t('daily.sent', { r: r.me.rank }) : T.already}</small></div>`;
    openBoard(res.day);
  };
}

/* ---------------- 排行榜 ---------------- / ---------------- Leaderboard ---------------- */
interface Row {
  rank: number; name: string; hero: string; heat: number; nights: number; wall: number; kills: number; won: number; me?: boolean;
}
interface Board {
  ok: boolean; day: string; total: number; top: Row[]; me: Row | null;
}

export function openBoard(day = dayKey()) {
  SFX.play('ui');
  track('board_view', { day });
  const T = L.ui.daily;
  const td = dayKey(),
    yd = dayKey(Date.now() - 86400000);
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.board}"><h3>${t('daily.boardTitle', { d: day })}</h3>
    <div class="sh-btns"><button class="btn sm${day === td ? ' on' : ''}" data-day="${td}">${T.today}</button><button class="btn sm${day === yd ? ' on' : ''}" data-day="${yd}">${T.yesterday}</button></div>
    <div id="dList"><p class="muted2">${apiOn() ? T.loading : T.off}</p></div>
    <div class="sh-btns"><button class="btn" id="dClose">${L.ui.sheet.close}</button></div></div>`);
  sh.querySelectorAll<HTMLElement>('[data-day]').forEach((b) => (b.onclick = () => openBoard(b.dataset.day!)));
  q(sh, '#dClose').onclick = closeSheet;
  if (!apiOn()) return;
  getJson<Board>(`/board?day=${day}&uid=${encodeURIComponent(uid())}`).then((B) => {
    const box = sh.querySelector('#dList');
    if (!box || !box.isConnected) return;
    if (!B || !B.ok) {
      box.innerHTML = `<p class="muted2">${T.offline}</p>`;
      return;
    }
    if (!B.top.length) {
      box.innerHTML = `<p class="muted2">${T.empty}</p>`;
      return;
    }
    const C = T.cols as string[];
    const row = (r: Row) =>
      `<tr class="${r.me ? 'me' : ''}${r.won ? ' won' : ''}"><td>${r.rank}</td><td>${esc(r.name)}</td><td>${esc(HEROES[r.hero]?.n || r.hero)}</td><td>${r.nights}</td><td>${r.wall}</td><td>${r.kills}</td></tr>`;
    const meOut = B.me && !B.top.some((r) => r.me);
    box.innerHTML = `<p class="muted2">${t('daily.total', { n: B.total })}${B.me ? ' · ' + t('daily.me', { r: B.me.rank }) : ''}</p>
      <div class="dboard"><table><thead><tr>${C.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${B.top.map(row).join('')}${meOut ? row({ ...B.me!, me: true }) : ''}</tbody></table></div>`;
  });
}
