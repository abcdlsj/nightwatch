/* 键值存储。网页和 WebView 里都用 localStorage（Capacitor 的 WKWebView / Android WebView 会持久化它）；
 * 以后接 Steam 云存档或原生存储时，只换这里的实现。读写失败（隐私模式、配额满）一律静默。 */
export interface KV {
  get(k: string): string | null;
  set(k: string, v: string): void;
  del(k: string): void;
}

const mem: Record<string, string> = {};
const local: KV = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return mem[k] ?? null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      mem[k] = v;
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {
      delete mem[k];
    }
  },
};

let kv: KV = local;
export const setStorage = (impl: KV) => {
  kv = impl;
};

export const store = {
  get: (k: string) => kv.get(k),
  set: (k: string, v: string) => kv.set(k, v),
  del: (k: string) => kv.del(k),
  json<T>(k: string, fallback: T): T {
    try {
      const s = kv.get(k);
      return s ? (JSON.parse(s) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  setJson: (k: string, v: unknown) => kv.set(k, JSON.stringify(v)),
};

/* 各存档键（沿用旧版，老玩家的进度不丢） */
export const KEYS = {
  meta: 'chain-meta-v1',
  save: 'chain-demo-save-v4',
  audio: 'chain-audio',
  tips: 'chain-tips',
  bestiary: 'chain-bestiary',
  lang: 'chain-lang',
};
