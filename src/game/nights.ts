/* 每夜的标题和战斗中的剧情节拍 [秒, 说话人, 台词] */
import { L, t } from '../i18n';
import { G } from './state';
import { bossNight } from './foes';

export interface NightInfo {
  title: string;
  beats: [number, string, any][];
}

export function nightInfo(r: number): NightInfo {
  const S = L.story as any;
  if (bossNight(r)) return S.night8Brood;
  const N: NightInfo = S.nights[r - 1] || { title: r > 8 ? t('night.endless', { r }) : t('night.plain', { r }), beats: [] };
  if (G.foeSet !== 'frost' || !S.nightsFrost[r - 1]) return N;
  const O = S.nightsFrost[r - 1];
  return { title: O.title || N.title, beats: N.beats.map((b, i) => O.beats[i] || b) };
}
export const nightTitle = (r: number) => nightInfo(r).title;
