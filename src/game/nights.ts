/* 每夜的标题和战斗中的剧情节拍 [秒, 说话人, 台词] / Each night's title and in-battle story beats [seconds, speaker, line] */
import { L, t } from '../i18n';
import { G } from './state';
import { nightBoss, nightKind, NIGHTS } from './plan';
import { heroBeats } from './story';

export interface NightInfo {
  title: string;
  beats: [number, string, any][];
}

/** 第几夜（汉字） / the night number (Chinese numerals) */
export const nightNum = (r: number) => (L.ui.night.num as string[])[r - 1] || String(r);

/** 公共剧情 + 这个人物自己的几句（人物写了，就不用公共剧情里给每个人物准备的那几句） / shared story + this hero's own lines (if the hero has them, skip the per-hero lines the shared story provides) */
function merge(base: NightInfo, own: [number, string, any][] | null): NightInfo {
  if (!own) return base;
  const beats = base.beats.filter((b) => b[1] !== 'hero').concat(own);
  return { title: base.title, beats: beats.sort((a, b) => a[0] - b[0]) };
}

export function nightInfo(r: number): NightInfo {
  const kind = nightKind(r);
  return kind === 'endless' ? baseInfo(r) : merge(baseInfo(r), heroBeats(r, nightBoss(r)));
}

function baseInfo(r: number): NightInfo {
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
