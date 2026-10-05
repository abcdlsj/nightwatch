/* 极简事件总线：规则层通知表现层（成就解锁等），规则层不需要知道谁在听 / A minimal event bus: the rules layer notifies presentation (achievement unlocks and so on) without knowing who is listening */
type Fn = (...a: any[]) => void;
const subs: Record<string, Fn[]> = {};
export const on = (ev: string, fn: Fn) => {
  (subs[ev] ||= []).push(fn);
};
export const emitEv = (ev: string, ...a: any[]) => {
  for (const f of subs[ev] || []) f(...a);
};
