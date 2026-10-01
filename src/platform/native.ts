/* 原生壳（Capacitor）里的平台能力：持久存储、震动、返回键、前后台切换。
 * 网页里什么都不做；插件都按需加载，不进网页首屏的包。 */
import { isNative, platform } from './env';
import { setStorage, KEYS, type KV } from './storage';
import { setVibrate } from './haptics';

type Hook = () => void;
const hooks = { back: [] as (() => boolean)[], pause: [] as Hook[], resume: [] as Hook[] };

/** 返回键（Android）：处理了就返回 true，都不处理时退到后台 */
export const onBack = (f: () => boolean) => hooks.back.push(f);
export const onPause = (f: Hook) => hooks.pause.push(f);
export const onResume = (f: Hook) => hooks.resume.push(f);

export async function initPlatform() {
  if (!isNative()) return;
  const [{ Preferences }, { Haptics, ImpactStyle }, { App }] = await Promise.all([
    import('@capacitor/preferences'),
    import('@capacitor/haptics'),
    import('@capacitor/app'),
  ]);

  /* 存档：原生存储为准，内存里留一份同步读；第一次装原生版时把 WebView 里的旧数据搬过去 */
  const cache: Record<string, string> = {};
  for (const k of Object.values(KEYS)) {
    const { value } = await Preferences.get({ key: k });
    let v = value;
    if (v == null) {
      try {
        v = localStorage.getItem(k);
      } catch {
        v = null;
      }
      if (v != null) await Preferences.set({ key: k, value: v });
    }
    if (v != null) cache[k] = v;
  }
  const kv: KV = {
    get: (k) => cache[k] ?? null,
    set: (k, v) => {
      cache[k] = v;
      Preferences.set({ key: k, value: v }).catch(() => {});
    },
    del: (k) => {
      delete cache[k];
      Preferences.remove({ key: k }).catch(() => {});
    },
  };
  setStorage(kv);

  setVibrate((ms) => {
    Haptics.impact({ style: ms > 40 ? ImpactStyle.Heavy : ms > 15 ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
  });

  App.addListener('appStateChange', ({ isActive }) => {
    for (const f of isActive ? hooks.resume : hooks.pause) f();
  });
  if (platform() === 'android')
    App.addListener('backButton', () => {
      for (const f of hooks.back) if (f()) return;
      App.minimizeApp();
    });
}
