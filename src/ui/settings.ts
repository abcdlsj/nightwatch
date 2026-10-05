/* 设置页：声音、震动、震屏、伤害数字、新手提示、清除进度 / Settings page: sound, haptics, screen shake, damage numbers, tutorial hints, clear progress */
import { L, t } from '../i18n';
import { SETTINGS, setSetting, type Settings } from '../platform/settings';
import { store, KEYS } from '../platform/storage';
import { SFX } from '../audio/sfx';
import { buzz } from '../audio/settings';
import { $ } from './dom';
import { sheetOpen, closeSheet } from './sheets';
import { resetTips, toast } from './hud';
import { exportCode, importCode } from '../platform/backup';

const VERSION = __APP_VERSION__;

export function openSettings(onReset?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  const rows: (keyof Settings)[] = ['music', 'sfx', 'haptics', 'shake', 'nums', 'tips'];
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.title}"><h3>${T.title}</h3>
    <div class="tlist set-list">${rows
      .map((k) => `<button class="trow set-row" data-k="${k}"><div><b>${(T as any)[k]}</b><span>${(T as any)[k + 'D']}</span></div><i class="tog${SETTINGS[k] ? ' on' : ''}" aria-hidden="true"></i></button>`)
      .join('')}</div>
    <p class="set-bk"><b>${T.backup}</b>${T.backupD}</p>
    <div class="sh-btns"><button class="btn" id="setExport">${T.exportBtn}</button><button class="btn" id="setImport">${T.importBtn}</button></div>
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
  $('#setExport').onclick = () => openExport(onReset);
  $('#setImport').onclick = () => openImport(onReset);
}

function openExport(onReset?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.exportTitle}"><h3>${T.exportTitle}</h3><p>${T.exportD}</p>
    <textarea class="bk-code" id="bkCode" readonly rows="6">…</textarea>
    <div class="sh-btns"><button class="btn" id="bkCopy" disabled>${T.copy}</button><button class="btn" id="bkBack">${L.ui.sheet.close}</button></div></div>`);
  const ta = sh.querySelector<HTMLTextAreaElement>('#bkCode')!;
  exportCode().then((code) => {
    ta.value = code;
    ($('#bkCopy') as HTMLButtonElement).disabled = false;
  });
  ta.onfocus = () => ta.select();
  $('#bkCopy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(ta.value);
      toast(T.copied);
    } catch {
      ta.focus();
      ta.setSelectionRange(0, ta.value.length);
      toast(T.copyFail);
    }
  };
  $('#bkBack').onclick = () => openSettings(onReset);
}

function openImport(onReset?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  sheetOpen(`<div class="sh" role="dialog" aria-label="${T.importTitle}"><h3>${T.importTitle}</h3><p>${T.importD}</p>
    <textarea class="bk-code" id="bkIn" rows="6" placeholder="${T.importPh}" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
    <div class="sh-btns"><button class="btn red" id="bkGo">${T.importGo}</button><button class="btn" id="bkBack">${L.ui.sheet.close}</button></div></div>`);
  $('#bkGo').onclick = async () => {
    const ok = await importCode(($('#bkIn') as HTMLTextAreaElement).value);
    if (!ok) return toast(T.importBad);
    toast(T.imported);
    /* 进度在模块加载时读进内存，整页重载最稳；原生壳的写入是异步的，等一下再刷 / progress is read into memory at module load, so a full reload is safest; native writes are async, so wait a moment */
    setTimeout(() => location.reload(), 600);
  };
  $('#bkBack').onclick = () => openSettings(onReset);
}
