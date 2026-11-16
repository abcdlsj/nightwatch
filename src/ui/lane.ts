/* 战场上同一时刻只放一条大消息。按优先级排：连招发现 > 横幅（首领意图、连招报名、夜名）> 敌人介绍卡 > 喊话。
 * 高的来了把低的收掉；低的来了等高的讲完。旁白字幕压在下沿，不占这条道。
 * Only one big message on the battlefield at a time. Priority: combo discovery > banner (boss intent, streak call-outs, night title) > enemy intro card > shouts.
 * A higher one arriving puts away the lower one; a lower one waits until the higher one is done. Narration subtitles sit on the bottom edge and stay out of this lane. */

export const LANE = { bark: 1, foe: 2, banner: 3, discover: 4 } as const;

let cur: { pri: number; until: number; hide?: () => void } = { pri: 0, until: 0 };

/** 这个优先级的消息还要等几毫秒（0 = 现在就能出） / how many ms a message of this priority must wait (0 = may show now) */
export function laneWait(pri: number) {
  const left = cur.until - performance.now();
  return left > 0 && pri <= cur.pri ? left : 0;
}

/** 占住这条道 ms 毫秒；比当前的高就先把当前的收掉 / hold the lane for ms; if higher than the current one, put the current one away first */
export function laneTake(pri: number, ms: number, hide?: () => void) {
  const now = performance.now();
  if (cur.until > now && pri > cur.pri) cur.hide?.();
  cur = { pri, until: now + ms, hide };
}

export function laneClear() {
  cur = { pri: 0, until: 0 };
}
