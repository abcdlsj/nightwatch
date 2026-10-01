/* 声音三档：0 全开 / 1 只留音效 / 2 全静音。存在 chain-audio */
import { store, KEYS } from '../platform/storage';
import { vibrate } from '../platform/haptics';
import { SFX } from './sfx';
import { MUSIC } from './music';

export let audioMode = +(store.get(KEYS.audio) || 0) || 0;

export function applyAudio() {
  SFX.setMuted(audioMode === 2);
  MUSIC.enable(audioMode === 0);
}
export function cycleAudio() {
  audioMode = (audioMode + 1) % 3;
  store.set(KEYS.audio, String(audioMode));
  applyAudio();
}
/** 震动跟着声音开关：全静音时也不震 */
export function buzz(p: number | number[]) {
  if (audioMode < 2) vibrate(p);
}
