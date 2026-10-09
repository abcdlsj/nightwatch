/* 接口地址和匿名 ID。地址在构建时用 VITE_API_BASE 注入（见 worker/README.md）；没配就什么都不发
 * API base and anonymous id. The base is injected at build time via VITE_API_BASE (see worker/README.md); without it nothing is sent
 */
import { store, KEYS } from './storage';

const BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');
export const apiOn = () => !!BASE;
export const apiUrl = (path: string) => BASE + path;

function rid() {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* 老浏览器或非安全上下文 / older browsers or insecure contexts */
  }
  return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}
/** 本机的匿名 ID：第一次用时随机生成，不和任何个人信息挂钩 / this device's anonymous id: random on first use, tied to no personal information */
export function uid() {
  let u = store.get(KEYS.uid);
  if (!u || !/^[A-Za-z0-9-]{8,40}$/.test(u)) {
    u = rid();
    store.set(KEYS.uid, u);
  }
  return u;
}
/** 这次打开游戏的会话 ID / the session id for this launch */
export const sid = rid();

/** 用 text/plain 发 JSON：浏览器不发预检 / send JSON as text/plain so browsers skip the preflight */
export async function postJson<T>(path: string, data: unknown): Promise<T | null> {
  if (!BASE) return null;
  try {
    const r = await fetch(apiUrl(path), { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'text/plain' } });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
export async function getJson<T>(path: string): Promise<T | null> {
  if (!BASE) return null;
  try {
    const r = await fetch(apiUrl(path));
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
