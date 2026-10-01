/* 极简事件总线：规则层通知表现层（成就解锁等），规则层不需要知道谁在听 */
type Fn = (...a: any[]) => void;
const subs: Record<string, Fn[]> = {};
export const on = (ev: string, fn: Fn) => {
  (subs[ev] ||= []).push(fn);
};
export const emitEv = (ev: string, ...a: any[]) => {
  for (const f of subs[ev] || []) f(...a);
};
