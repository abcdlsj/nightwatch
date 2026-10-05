/* 设置页：声音、震动、震屏、伤害数字、新手提示、清除进度 / Settings page: sound, haptics, screen shake, damage numbers, tutorial hints, clear progress */
import { L, t } from '../i18n';
import { SETTINGS, setSetting, type Settings } from '../platform/settings';
import { store, KEYS } from '../platform/storage';
import { SFX } from '../audio/sfx';
import { buzz } from '../audio/settings';
import { $ } from './dom';
import { sheetOpen, closeSheet } from './sheets';
import { resetTips, toast } from './hud';

const VERSION = __APP_VERSION__;

export function openSettings(onReset?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  const rows: (keyof Settings)[] = ['music', 'sfx', 'haptics', 'shake', 'nums', 'tips'];
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.title}"><h3>${T.title}</h3>
    <div class="tlist set-list">${rows
      .map((k) => `<button class="trow set-row" data-k="${k}"><div><b>${(T as any)[k]}</b><span>${(T as any)[k + 'D']}</span></div><i class="tog${SETTINGS[k] ? ' on' : ''}" aria-hidden="true"></i></button>`)
      .join('')}</div>
    <div class="sh-btns"><button class="btn" id="setTips">${T.resetTips}</button><button class="btn red" id="setWipe">${T.wipe}</button></div>
    <p class="muted2">${t('settings.version', { v: VERSION })}</p>
    <div class="sh-btns"><button class="btn" id="setClose">${L.ui.sheet.close}</button></div></div>`);
  sh.querySelectorAll<HTMLElement>('.set-row').forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.k as keyof Settings;
        setSetting(k, !SETTINGS[k]);
        b.querySelector('.tog')!.classList.toggle('on', SETTINGS[k]);
        SFX.ensure();
        SFX.play('ui');
        if (k === 'haptics' && SETTINGS.haptics) buzz(20);
      }),
  );
  $('#setTips').onclick = () => {
    resetTips();
    toast(T.tipsDone);
  };
  let armed = false;
  $('#setWipe').onclick = () => {
    if (!armed) {
      armed = true;
      $('#setWipe').textContent = T.wipeSure;
      return;
    }
    for (const k of [KEYS.meta, KEYS.save, KEYS.tips, KEYS.bestiary]) store.del(k);
    toast(T.wiped);
    setTimeout(() => (onReset ? onReset() : location.reload()), 600);
  };
  $('#setClose').onclick = closeSheet;
}
