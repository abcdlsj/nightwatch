/* 玩家设置（存在 chain-settings）。旧版只有声音三档（chain-audio），第一次读时迁移过来 */
import { store, KEYS } from './storage';

export interface Settings {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  /** 震屏 */
  shake: boolean;
  /** 伤害数字 */
  nums: boolean;
  /** 新手提示 */
  tips: boolean;
}

function load(): Settings {
  const old = +(store.get(KEYS.audio) || 0) || 0;
  const d: Settings = { music: old === 0, sfx: old < 2, haptics: true, shake: true, nums: true, tips: true };
  return Object.assign(d, store.json<Partial<Settings>>(KEYS.settings, {}));
}
export const SETTINGS: Settings = load();

const subs: ((s: Settings) => void)[] = [];
export const onSettings = (f: (s: Settings) => void) => subs.push(f);
export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]) {
  SETTINGS[k] = v;
  store.setJson(KEYS.settings, SETTINGS);
  for (const f of subs) f(SETTINGS);
}
