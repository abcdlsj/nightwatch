/* 声音和震动跟着玩家设置走 / Sound and haptics follow the player's settings */
import { vibrate } from '../platform/haptics';
import { SETTINGS, onSettings } from '../platform/settings';
import { SFX } from './sfx';
import { MUSIC } from './music';

export function applyAudio() {
  SFX.setMuted(!SETTINGS.sfx);
  MUSIC.enable(SETTINGS.music);
}
onSettings(applyAudio);

/** 震动：设置里关了就不震 / haptics: no vibration when disabled in settings */
export function buzz(p: number | number[]) {
  if (SETTINGS.haptics) vibrate(p);
}
