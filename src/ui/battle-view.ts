/* 战斗表现：把模拟层的「喊一声」落到画面上（SimView 的实现），以及首领血条、连锁、连杀 */
import { L, t } from '../i18n';
import { fmt } from '../core/util';
import { G, type Card } from '../game/state';
import { B } from '../sim/battle';
import type { SimView } from '../sim/view';
import type { Enemy } from '../sim/types';
import { SFX } from '../audio/sfx';
import { buzz } from '../audio/settings';
import * as field from '../render/field';
import { FX } from '../render/overlay';
import { $, restart } from './dom';
import { elOf, setAmmo, setNum } from './card-view';
import { updateHUD, toast, banner, tipOnce } from './hud';
import { say, foeCard } from './voice';

let chainT = 0;

export const domView: SimView = {
  part: field.part,
  num: field.num,
  dmgNum: field.dmgNum,
  ring: field.ring,
  bolt: field.bolt,
  boom(x, y, r, col) {
    field.boom(x, y, r, col);
    SFX.play('boom');
  },
  hit: field.hit,
  shake: field.shake,
  wallFlash() {
    field.wallFlash();
    restart($('#hpChip'), 'shake');
  },
  coins(x, y, n) {
    const [cx, cy] = field.toClient(x, y);
    FX.coins(cx, cy, n);
  },
  cardFx: (c, cls) => restart(elOf(c), cls),
  cardFlag: (c, flag, on) => elOf(c)?.classList.toggle(flag, on),
  cardAmmo: setAmmo,
  cardNum: (c: Card) => setNum(elOf(c), c),
  link: (a, b, col, life) => FX.link(elOf(a), elOf(b), col, life),
  sfx: SFX.play,
  say,
  toast,
  banner,
  tip: tipOnce,
  hud: updateHUD,
  boss(e) {
    const bb = $('#bossbar');
    if (!e) {
      bb.hidden = true;
      return;
    }
    bb.hidden = false;
    $('#bossName').textContent = e.d.n;
  },
  meetFoe: foeCard,
  chain(n) {
    const el = $('#chain');
    const cols = ['#c38cff', '#c38cff', '#ff95dc', '#ffd166', '#ff8a5b', '#ff5a5a'];
    el.style.setProperty('--cc', cols[Math.min(cols.length - 1, Math.floor(n / 2))]);
    el.innerHTML = t('battle.chain', { n });
    const now = performance.now();
    if (now - chainT > 90) {
      restart(el, 'show');
      chainT = now;
    }
  },
  combo(c) {
    const el = $('#combo');
    const cols = ['#ffffff', '#ffe79a', '#ffb37a', '#ff7a5a', '#ff5a8a'];
    el.style.setProperty('--kc', cols[Math.min(4, Math.floor(c / 15))]);
    el.innerHTML = t('battle.combo', { n: c });
    restart(el, 'show');
  },
  buzz,
};

/** 开战前把首领血条摆好（它的高度决定战场顶部留多少） */
export function prepBossbar(bd: { n: string; intents?: { n: string; d: string }[] } | undefined) {
  const bb = $('#bossbar');
  if (!bd) return 0;
  bb.hidden = false;
  $('#bossName').textContent = bd.n;
  $('#bossHp').style.width = '100%';
  $('#bossSh').style.width = '0%';
  $('#bossHpT').textContent = L.ui.battle.comingSoon;
  $('#intName').textContent = bd.intents![0].n + L.ui.common.colon + bd.intents![0].d;
  $('#intT').textContent = '';
  $('#intBar').style.width = '0%';
  return bb.offsetHeight + 14;
}

/** 每帧刷新首领血条和意图倒计时 */
export function paintBossbar() {
  if (!B || !B.boss) return;
  const e: Enemy = B.boss;
  $('#bossHp').style.width = ((Math.max(0, e.hp) / e.maxHp) * 100).toFixed(1) + '%';
  $('#bossSh').style.width = Math.min(100, (e.shield / e.maxHp) * 100).toFixed(1) + '%';
  const arm = e.armor + (e.hardT > 0 ? 10 : 0);
  $('#bossHpT').textContent = fmt(Math.max(0, e.hp)) + ' / ' + fmt(e.maxHp) + (arm ? '  ' + L.ui.battle.armor + arm : '');
  const it = e.d.intents![e.ii];
  $('#intName').textContent = it.n + L.ui.common.colon + it.d;
  $('#intT').textContent = Math.max(0, e.it).toFixed(1) + 's';
  $('#intBar').style.width = (100 - (Math.max(0, e.it) / it.t) * 100).toFixed(1) + '%';
  $('#intentBox').classList.toggle('hot', e.it < 1.2);
}

export const isBattle = () => G.phase === 'battle';
