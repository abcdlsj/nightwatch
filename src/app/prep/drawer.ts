/* 背包抽屉：拖卡时自动拉开，放下后收回 / Bag drawer: slides open while dragging a card and closes after the drop */
import { L } from '../../i18n';
import { G } from '../../game/state';
import { resizeField } from '../../render/field';
import { $ } from '../../ui/dom';
import { updateHUD, tipOnce } from '../../ui/hud';
import { UI } from '../../ui/state';

export const UI_drawer = () => UI.drawer;

export function setDrawer(o: boolean) {
  UI.drawer = o;
  if (o && G.phase === 'prep') tipOnce('sell', L.ui.tips.sell, 300);
  $('#stashRow').classList.toggle('closed', !o);
  updateHUD();
  setTimeout(() => {
    if (G.phase === 'battle') resizeField();
  }, 300);
}
