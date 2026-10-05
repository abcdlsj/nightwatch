/* 工坊：说明怎么做自己的守夜人（fork → 在 mods/ 里加内容 → 部署），列出这个版本装了哪些模组、有没有出错 */
import { L, t } from '../i18n';
import { SFX } from '../audio/sfx';
import { MOD_REPORTS } from '../mod/load';
import { $ } from './dom';
import { sheetOpen, closeSheet } from './sheets';

export const REPO = 'https://github.com/abcdlsj/nightwatch';
export const DOC_URL = REPO + '/blob/main/docs/modding.md';
export const DEPLOY_URL = 'https://vercel.com/new/clone?repository-url=' + encodeURIComponent(REPO) + '&project-name=nightwatch&repository-name=nightwatch';

/** 原生壳里也用系统浏览器打开 */
const go = (url: string) => window.open(url, '_blank', 'noopener');

export function openWorkshop() {
  SFX.play('ui');
  const T = L.ui.workshop;
  const kinds = T.kinds as Record<string, string>;
  const list = MOD_REPORTS.length
    ? MOD_REPORTS.map((r) => {
        const added = Object.entries(r.added)
          .map(([k, n]) => `${kinds[k] || k} ${n}`)
          .join(' · ');
        return `<div class="trow mod${r.errors.length ? ' bad' : ''}"><div><b>${r.name}${r.author ? `<small class="gt">${r.author}</small>` : ''}</b>
          ${r.desc ? `<span>${r.desc}</span>` : ''}<span>${added || T.nothing}</span>
          ${r.errors.length ? `<ul class="moderr">${r.errors.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}</div></div>`;
      }).join('')
    : `<p class="muted2">${T.none}</p>`;
  sheetOpen(`<div class="sh" role="dialog" aria-label="${T.title}"><h3>${T.title}</h3>
    <div class="ws-steps">${(T.steps as string[]).map((s, i) => `<div><i>${i + 1}</i><span>${s}</span></div>`).join('')}</div>
    <div class="sh-btns ws-go"><button class="btn blue" id="wsDoc">${T.doc}</button><button class="btn gold" id="wsDeploy">${T.deploy}</button></div>
    <div class="hs-h">${t('workshop.loaded', { n: MOD_REPORTS.length })}</div>
    <div class="tlist">${list}</div>
    <div class="sh-btns"><button class="btn" id="wsClose">${L.ui.sheet.close}</button></div></div>`);
  $('#wsDoc').onclick = () => go(DOC_URL);
  $('#wsDeploy').onclick = () => go(DEPLOY_URL);
  $('#wsClose').onclick = closeSheet;
}
