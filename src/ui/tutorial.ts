/* 新手教学：第一局第一夜的夜谈结束后，按顺序圈出几个地方，各配一句话。只放一次，可以跳过 / First-run tutorial: after the first night talk of the first run, spotlight a few spots in order, one line each. Shown once, skippable */
import { L, t } from '../i18n';
import { SFX } from '../audio/sfx';

const STEPS: [string, keyof typeof L.ui.tut.steps][] = [
  ['#pbody', 'doors'],
  ['#boardRow', 'board'],
  ['#bagBtn', 'bag'],
  ['#hpChip', 'wall'],
  ['#goBtn', 'fight'],
];

let ov: HTMLElement | null = null;

export function playTutorial() {
  if (ov) return;
  const T = L.ui.tut;
  let i = 0;
  ov = document.createElement('div');
  ov.id = 'tut';
  ov.innerHTML = `<div class="tut-hole"></div><div class="tut-bub"><small></small><p></p><div class="tut-btns"><button class="btn sm" id="tutSkip">${T.skip}</button><button class="btn sm green" id="tutNext"></button></div></div>`;
  document.body.appendChild(ov);
  const hole = ov.querySelector<HTMLElement>('.tut-hole')!,
    bub = ov.querySelector<HTMLElement>('.tut-bub')!;
  const place = () => {
    const el = document.querySelector<HTMLElement>(STEPS[i][0]);
    const r = el?.getBoundingClientRect();
    const vh = window.innerHeight;
    if (!r || !r.width) {
      hole.hidden = true;
      bub.style.top = `${vh / 2 - bub.offsetHeight / 2}px`;
      return;
    }
    hole.hidden = false;
    const pad = 4;
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    /* 气泡放在目标下面，放不下就放上面 / put the bubble below the target, or above when it does not fit */
    const h = bub.offsetHeight;
    const below = r.bottom + pad + 10;
    bub.style.top = `${below + h < vh - 8 ? below : Math.max(8, r.top - pad - 10 - h)}px`;
  };
  const show = () => {
    const [, k] = STEPS[i];
    bub.querySelector('small')!.textContent = t('tut.label', { n: i + 1, m: STEPS.length });
    bub.querySelector('p')!.innerHTML = T.steps[k];
    bub.querySelector('#tutNext')!.textContent = i === STEPS.length - 1 ? T.done : T.next;
    place();
  };
  const end = () => {
    window.removeEventListener('resize', place);
    ov?.remove();
    ov = null;
  };
  ov.querySelector<HTMLElement>('#tutNext')!.onclick = (e) => {
    e.stopPropagation();
    SFX.play('ui');
    if (++i >= STEPS.length) end();
    else show();
  };
  ov.querySelector<HTMLElement>('#tutSkip')!.onclick = (e) => {
    e.stopPropagation();
    SFX.play('ui');
    end();
  };
  window.addEventListener('resize', place);
  show();
  SFX.play('hint');
}
