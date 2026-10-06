/* 设置页：声音、震动、震屏、伤害数字、新手提示、清除进度 / Settings page: sound, haptics, screen shake, damage numbers, tutorial hints, clear progress */
import { L, t, lang, languages, LANG_NAMES } from '../i18n';
import { SETTINGS, setSetting, type Settings } from '../platform/settings';
import { store, KEYS } from '../platform/storage';
import { SFX } from '../audio/sfx';
import { buzz } from '../audio/settings';
import { $ } from './dom';
import { sheetOpen, closeSheet } from './sheets';
import { resetTips, toast } from './hud';
import { exportCode, importCode } from '../platform/backup';

const VERSION = __APP_VERSION__;

/** onQuit：对局中打开时传入，多出「结算这局」 / onQuit: passed when opened mid-run, adds an "end this run" button */
export function openSettings(onReset?: () => void, onQuit?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  const rows: (keyof Settings)[] = ['music', 'sfx', 'haptics', 'shake', 'nums', 'tips'];
  const sh = sheetOpen(`<div class="sh" role="dialog" aria-label="${T.title}"><h3>${T.title}</h3>
    <div class="tlist set-list">${rows
      .map((k) => `<button class="trow set-row" data-k="${k}"><div><b>${(T as any)[k]}</b><span>${(T as any)[k + 'D']}</span></div><i class="tog${SETTINGS[k] ? ' on' : ''}" aria-hidden="true"></i></button>`)
      .join('')}</div>
    <p class="set-bk"><b>${T.language}</b>${T.languageD}</p>
    <div class="sh-btns set-lang">${languages()
      .map((c) => `<button class="btn${c === lang ? ' on' : ''}" data-lang="${c}">${LANG_NAMES[c] || c}</button>`)
      .join('')}</div>
    <p class="set-bk"><b>${T.backup}</b>${T.backupD}</p>
    <div class="sh-btns"><button class="btn" id="setExport">${T.exportBtn}</button><button class="btn" id="setImport">${T.importBtn}</button></div>
    <div class="sh-btns"><button class="btn" id="setTips">${T.resetTips}</button><button class="btn red" id="setWipe">${T.wipe}</button></div>
    ${onQuit ? `<div class="sh-btns"><button class="btn red" id="setQuit">${T.quit}</button></div>` : ''}
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
  sh.querySelectorAll<HTMLElement>('[data-lang]').forEach(
    (b) =>
      (b.onclick = () => {
        const c = b.dataset.lang!;
        if (c === lang) return;
        SFX.play('ui');
        store.set(KEYS.lang, c);
        /* 文字散落在各处，整页重载最稳；对局存档每进备战都会存，不会丢 / text is spread everywhere, so a full reload is safest; the run is saved on every prep, so nothing is lost */
        setTimeout(() => location.reload(), 150);
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
  let quitArmed = false;
  if (onQuit)
    $('#setQuit').onclick = () => {
      if (!quitArmed) {
        quitArmed = true;
        $('#setQuit').textContent = T.quitSure;
        return;
      }
      closeSheet();
      onQuit();
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
    <div class="sh-btns"><button class="btn" id="bkCopy" disabled>${T.copy}</button><button class="btn" id="bkFile" disabled>${T.saveFile}</button></div>
    <div class="sh-btns"><button class="btn" id="bkBack">${L.ui.sheet.close}</button></div></div>`);
  const ta = sh.querySelector<HTMLTextAreaElement>('#bkCode')!;
  exportCode().then((code) => {
    ta.value = code;
    ($('#bkCopy') as HTMLButtonElement).disabled = false;
    ($('#bkFile') as HTMLButtonElement).disabled = false;
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
  $('#bkFile').onclick = () => saveFile(ta.value);
  $('#bkBack').onclick = () => openSettings(onReset);
}

/** 存成文件：iOS 上走系统分享面板（可选「存储到文件」放进 iCloud 云盘），其他地方直接下载 / save as a file: on iOS via the system share sheet (pick "Save to Files" for iCloud Drive), elsewhere a plain download */
async function saveFile(code: string) {
  const name = `nightwatch-${new Date().toISOString().slice(0, 10)}.txt`;
  const file = new File([code], name, { type: 'text/plain' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      /* 用户关掉分享面板就算了 / the user dismissed the share sheet */
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function openImport(onReset?: () => void) {
  SFX.play('ui');
  const T = L.ui.settings;
  sheetOpen(`<div class="sh" role="dialog" aria-label="${T.importTitle}"><h3>${T.importTitle}</h3><p>${T.importD}</p>
    <textarea class="bk-code" id="bkIn" rows="6" placeholder="${T.importPh}" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
    <input type="file" id="bkPick" accept=".txt,text/plain" hidden>
    <div class="sh-btns"><button class="btn" id="bkOpen">${T.pickFile}</button><button class="btn red" id="bkGo">${T.importGo}</button></div>
    <div class="sh-btns"><button class="btn" id="bkBack">${L.ui.sheet.close}</button></div></div>`);
  const pick = $('#bkPick') as HTMLInputElement;
  $('#bkOpen').onclick = () => pick.click();
  pick.onchange = async () => {
    const f = pick.files?.[0];
    if (f) ($('#bkIn') as HTMLTextAreaElement).value = (await f.text()).trim();
    pick.value = '';
  };
  $('#bkGo').onclick = async () => {
    const ok = await importCode(($('#bkIn') as HTMLTextAreaElement).value);
    if (!ok) return toast(T.importBad);
    toast(T.imported);
    /* 进度在模块加载时读进内存，整页重载最稳；原生壳的写入是异步的，等一下再刷 / progress is read into memory at module load, so a full reload is safest; native writes are async, so wait a moment */
    setTimeout(() => location.reload(), 600);
  };
  $('#bkBack').onclick = () => openSettings(onReset);
}
