/* 存档码：把所有进度打成一串文字，换设备、重装主屏应用（iOS 主屏应用删了存储就跟着清空）时贴回来。
 * 格式：NW1.<base64(gzip(JSON))>；浏览器不支持压缩时用 NW0.<base64(JSON)>。
 * Save code: pack all progress into one string to paste back after switching devices or reinstalling the home-screen app (deleting an iOS home-screen app wipes its storage).
 * Format: NW1.<base64(gzip(JSON))>; when the browser lacks CompressionStream, NW0.<base64(JSON)>.
 */
import { store, KEYS } from './storage';

/** 跟着存档码走的键（iOS 提示是这台设备自己的事，不带） / keys carried by the save code (the iOS install hint belongs to this device, so it stays out) */
const BACKUP_KEYS = [KEYS.meta, KEYS.save, KEYS.audio, KEYS.tips, KEYS.bestiary, KEYS.lang, KEYS.settings];

const b64 = (u: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pipe(u: Uint8Array, t: GenericTransformStream) {
  const out = new Response(new Blob([u as BlobPart]).stream().pipeThrough(t));
  return new Uint8Array(await out.arrayBuffer());
}

export async function exportCode(): Promise<string> {
  const data: Record<string, string> = {};
  for (const k of BACKUP_KEYS) {
    const v = store.get(k);
    if (v != null) data[k] = v;
  }
  const raw = new TextEncoder().encode(JSON.stringify({ v: 1, at: Date.now(), data }));
  if (typeof CompressionStream === 'function') {
    try {
      return 'NW1.' + b64(await pipe(raw, new CompressionStream('gzip')));
    } catch {
      /* 压缩失败就存不压缩的 / fall back to uncompressed */
    }
  }
  return 'NW0.' + b64(raw);
}

/** 解析存档码；坏码返回 null / parse a save code; returns null when it is invalid */
export async function parseCode(code: string): Promise<Record<string, string> | null> {
  const m = code.replace(/\s+/g, '').match(/^NW([01])\.([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  try {
    let u = unb64(m[2]);
    if (m[1] === '1') {
      if (typeof DecompressionStream !== 'function') return null;
      u = await pipe(u, new DecompressionStream('gzip'));
    }
    const obj = JSON.parse(new TextDecoder().decode(u));
    if (!obj || typeof obj.data !== 'object' || !obj.data) return null;
    const data: Record<string, string> = {};
    for (const k of BACKUP_KEYS) if (typeof obj.data[k] === 'string') data[k] = obj.data[k];
    return data[KEYS.meta] || data[KEYS.save] ? data : null;
  } catch {
    return null;
  }
}

/** 用存档码覆盖本机进度（码里没有的键会清掉）；成功返回 true / overwrite local progress with the save code (keys missing from the code are cleared); returns true on success */
export async function importCode(code: string): Promise<boolean> {
  const data = await parseCode(code);
  if (!data) return false;
  for (const k of BACKUP_KEYS) {
    if (data[k] != null) store.set(k, data[k]);
    else store.del(k);
  }
  return true;
}
