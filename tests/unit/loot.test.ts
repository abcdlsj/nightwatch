/* 风向与外乡卡：风向只挑买得到的元素，第一次挑遗物有顺风的；外乡卡要那个人物解锁了才来，加价，不卖剧情卡；敌情四夜一段
 * Wind and foreign cards: the wind only picks buyable elements and the first relic pick includes a wind relic; foreign cards need their hero unlocked, cost more, and never include story cards; threats come in four-night segments
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G } from '../../src/game/state';
import { META } from '../../src/game/meta';
import { ITEMS } from '../../src/data/cards';
import { HERO_ORDER } from '../../src/data/heroes';
import { rollItem, rollWind, rollGear, windRelic, makeOffer, isForeign, FOREIGN_TAX } from '../../src/game/loot';
import { basePrice } from '../../src/game/cards';
import { nightThreats, nextSeg } from '../../src/game/threats';

beforeAll(() => initLocale());

const setup = (hero: string, unlocked: string[]) => {
  reseed(11);
  Object.assign(G, { hero, round: 3, relics: [], skills: [], cards: [], heat: 0, wind: '', windRelic: false });
  META.heroes = Object.fromEntries(unlocked.map((h) => [h, 1]));
};

describe('风向', () => {
  it('只挑这个人物买得到至少 4 张的元素', () => {
    for (const h of HERO_ORDER) {
      setup(h, HERO_ORDER);
      for (let i = 0; i < 20; i++) {
        const w = rollWind();
        expect(w).not.toBe('');
        const n = Object.keys(ITEMS).filter((k) => !ITEMS[k].noPool && ITEMS[k].tag === w && (!ITEMS[k].hero || ITEMS[k].hero === h)).length;
        expect(n, `${h} ${w}`).toBeGreaterThanOrEqual(4);
      }
    }
  });
  it('第一次挑遗物至少有一件顺风的，之后不再保底', () => {
    setup('mo', ['ayla']);
    G.wind = 'fire';
    expect(rollGear(3).some((k) => windRelic(k))).toBe(true);
    expect(G.windRelic).toBe(true);
  });
});

describe('外乡卡', () => {
  it('人物没解锁就不出；解锁了偶尔出，且不出剧情卡', () => {
    setup('ayla', ['ayla']);
    for (let i = 0; i < 400; i++) expect(isForeign(rollItem())).toBe(false);
    setup('ayla', HERO_ORDER);
    const got = Array.from({ length: 2000 }, () => rollItem()).filter(isForeign);
    expect(got.length).toBeGreaterThan(0);
    expect(got.length).toBeLessThan(2000 * 0.15);
    expect(got.some((k) => ITEMS[k].local)).toBe(false);
  });
  it('外乡卡加价', () => {
    setup('ayla', HERO_ORDER);
    for (let i = 0; i < 400; i++) {
      const of = makeOffer();
      if (!isForeign(of.card.key)) continue;
      expect(of.price).toBe(basePrice(of.card.key, of.card.adj, of.card.tier) + FOREIGN_TAX);
      return;
    }
    throw new Error('400 次都没出外乡卡');
  });
});

describe('敌情', () => {
  it('四夜一段：段内不变，同种子复现，主力不和上一段重样', () => {
    G.seed = 12345;
    Object.assign(G, { full: true, endless: false });
    expect(nightThreats(1, 3)).toEqual([]);
    for (const [a, b] of [[2, 5], [6, 9], [10, 13], [14, 15]]) {
      for (let r = a; r <= b; r++) expect(nightThreats(r, 3)).toEqual(nightThreats(a, 3));
      if (a > 2) expect(nightThreats(a, 1)[0]).not.toBe(nightThreats(a - 1, 1)[0]);
    }
  });
  it('段末那夜预告下一段，普通流程第 9 夜不预告', () => {
    G.seed = 7;
    Object.assign(G, { full: false, endless: false });
    expect(nextSeg(4)).toBeNull();
    expect(nextSeg(5)).toEqual({ from: 6, to: 9, ids: nightThreats(6, 3) });
    expect(nextSeg(9)).toBeNull();
    G.full = true;
    expect(nextSeg(9)?.from).toBe(10);
    expect(nextSeg(13)).toEqual({ from: 14, to: 15, ids: nightThreats(14, 3) });
    G.full = false;
  });
});
