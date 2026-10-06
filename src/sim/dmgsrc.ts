/* 伤害来源统计：每一下伤害记在「来源|卡牌」上，战报和结局按来源列出，玩家能看懂高伤害是哪个连招打出来的
 * Damage-source tally: every hit is booked under 'source|card', so the report and ending can list damage by source and players can see which combo did the big numbers
 *
 * 来源 / sources: hit 普通命中, crit 暴击, chain 连锁带动的出手, aoe 溅射/范围, burn 灼烧, poison 中毒, det 引爆, ovk 溢出, boomer 回旋, zone 地面,
 * fx 卡牌特效, foe 敌人自爆, rx.<反应>, ult.<元素连招>, adj.<词缀>, relic.<遗物>, t.<天赋> */
import { G, type Card } from '../game/state';
import type { Battle } from './types';

export function bookDmg(b: Battle, src: Card | null, k: string, a: number) {
  const key = k + '|' + (src ? src.key : '');
  b.dmgBy[key] = (b.dmgBy[key] || 0) + a;
  if (src) {
    const by = (src.bBy ||= {});
    by[k] = (by[k] || 0) + a;
  }
}

/** 一场打完（赢或输）把这场的来源并进整局，只并一次 / when a fight ends (win or lose) merge its sources into the run, once */
export function foldDmg(b: Battle | null) {
  if (!b || b.folded || !G.run) return;
  b.folded = true;
  const to = (G.run.dmgBy ||= {});
  for (const k in b.dmgBy) to[k] = Math.round((to[k] || 0) + b.dmgBy[k]);
}
