/* 守住一夜的收入：工钱、精英、遗物/天赋加的钱、利息、墙没掉砖。补墙也在这里结算 */
import { G, heat } from './state';
import { mv } from './mods';

export type RewardKey = 'wage' | 'eliteDown' | 'relicGold' | 'interest' | 'noBrick';

export function nightRewards(was: number, wallLost: number): [RewardKey, number][] {
  const rows: [RewardKey, number][] = [['wage', 3 + Math.floor(Math.min(was, 8) / 2) - (heat(6) ? 1 : 0)]];
  if (was === 4) rows.push(['eliteDown', 4]);
  const interest = Math.min(3 + mv('interest'), Math.floor(G.gold / 6));
  if (mv('winGold')) rows.push(['relicGold', mv('winGold')]);
  if (mv('regen')) G.wall = Math.min(G.wallMax, G.wall + mv('regen'));
  if (interest) rows.push(['interest', interest]);
  if (wallLost === 0) rows.push(['noBrick', 1]);
  return rows;
}
