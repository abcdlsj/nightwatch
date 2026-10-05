/* 每夜的标题和战斗中的剧情节拍 [秒, 说话人, 台词] */
import { L, t } from '../i18n';
import { G } from './state';
import { nightBoss, nightKind, NIGHTS } from './plan';

export interface NightInfo {
  title: string;
  beats: [number, string, any][];
}

/** 第几夜（汉字） */
export const nightNum = (r: number) => (L.ui.night.num as string[])[r - 1] || String(r);

export function nightInfo(r: number): NightInfo {
  const S = L.story as any;
  const kind = nightKind(r);
  if (kind === 'endless') return { title: t('night.endless', { r }), beats: [] };
  const boss = nightBoss(r);
  if (boss && kind === 'boss' && S.bossNights[boss]) {
    const B = S.bossNights[boss];
    return { title: t('night.boss', { n: nightNum(r), s: B.title }), beats: B.beats };
  }
  if (r > NIGHTS) return S.nightsFull[r] || { title: t('night.plain', { r }), beats: [] };
  const N: NightInfo = S.nights[r - 1] || { title: t('night.plain', { r }), beats: [] };
  if (G.foeSet !== 'frost' || !S.nightsFrost[r - 1]) return N;
  const O = S.nightsFrost[r - 1];
  return { title: O.title || N.title, beats: N.beats.map((b, i) => O.beats[i] || b) };
}
export const nightTitle = (r: number) => nightInfo(r).title;
