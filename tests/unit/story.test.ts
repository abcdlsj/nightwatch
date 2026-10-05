/* 人物剧情的结构：说话人都认识，夜谈的回答类别对，宝石两种选择都有，首领夜和完整线都写到了 */
import { describe, it, expect } from 'vitest';
import zh from '../../src/locales/zh-CN';
import { VOICES } from '../../src/data/voices';
import { EN } from '../../src/data/enemies';
import { HEROES } from '../../src/data/heroes';

const CATS = ['atk', 'def', 'tech', 'eco'];
const known = (w: string) => w === 'hero' || w === 'narr' || !!VOICES[w] || !!EN[w];

function checkTalk(where: string, sc: any, bad: string[]) {
  if (!sc.title || !sc.who || !sc.q || !Array.isArray(sc.lines) || !Array.isArray(sc.ans)) bad.push(`${where} 缺字段`);
  if (!known(sc.who)) bad.push(`${where} 说话人 ${sc.who}`);
  for (const [w] of sc.lines || []) if (!known(w)) bad.push(`${where} 说话人 ${w}`);
  for (const a of sc.ans || []) if (!CATS.includes(a.cat) || !a.t || !a.re) bad.push(`${where} 回答不全`);
}
function checkBeats(where: string, bs: any[], bad: string[]) {
  for (const b of bs || []) if (typeof b[0] !== 'number' || !known(b[1]) || !b[2]) bad.push(`${where} 节拍 ${JSON.stringify(b).slice(0, 40)}`);
}
function checkPages(where: string, ps: any[], bad: string[]) {
  for (const p of ps || []) if (!known(p.who) || !p.t) bad.push(`${where} 页 ${JSON.stringify(p).slice(0, 40)}`);
}

describe('人物剧情', () => {
  const S = (zh as any).heroStory as Record<string, any>;
  for (const h of Object.keys(S))
    it(`${h} 的剧情结构完整`, () => {
      expect(HEROES[h], h).toBeTruthy();
      const H = S[h];
      const bad: string[] = [];
      for (const [i, a] of (H.arcs || []).entries()) {
        for (const r in a.nights || {}) checkBeats(`${h}.arcs[${i}].nights.${r}`, a.nights[r], bad);
        for (const r in a.talks || {}) checkTalk(`${h}.arcs[${i}].talks.${r}`, a.talks[r], bad);
        checkPages(`${h}.arcs[${i}].intro`, a.intro, bad);
      }
      for (const r in H.talks || {}) checkTalk(`${h}.talks.${r}`, H.talks[r], bad);
      for (const k of ['eye', 'brood', 'mutebell', 'mistmother', 'siegelord']) {
        if (!H.bosses?.[k]) bad.push(`${h} 缺首领夜 ${k}`);
        checkBeats(`${h}.bosses.${k}`, H.bosses?.[k]?.beats, bad);
        checkPages(`${h}.bosses.${k}.win`, H.bosses?.[k]?.win, bad);
      }
      const F = H.full || {};
      for (const r of [10, 11, 13, 14, 15]) if (!F.nights?.[r]) bad.push(`${h} 完整线缺第 ${r} 夜`);
      for (const r in F.nights || {}) checkBeats(`${h}.full.nights.${r}`, F.nights[r], bad);
      for (const r in F.talks || {}) checkTalk(`${h}.full.talks.${r}`, F.talks[r], bad);
      for (const g of ['red', 'blue', 'green']) {
        const sc = F.gems?.[g];
        if (!sc?.take || !sc?.refuse) bad.push(`${h} 宝石 ${g} 不全`);
        else {
          for (const [w] of [...sc.lines, ...sc.take.re, ...sc.refuse.re]) if (!known(w)) bad.push(`${h}.gems.${g} 说话人 ${w}`);
        }
      }
      for (const k of ['noDawn', 'quiet', 'trueWin', 'hiddenPre']) {
        if (!F[k]) bad.push(`${h} 完整线缺 ${k}`);
        checkPages(`${h}.full.${k}`, F[k], bad);
      }
      expect(bad).toEqual([]);
    });
});
