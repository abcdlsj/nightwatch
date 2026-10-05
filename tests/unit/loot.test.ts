/* 风向与外乡卡：风向只挑买得到的元素，第一次挑遗物有顺风的；外乡卡要那个人物解锁了才来，加价，不卖剧情卡；敌情读档不变
 * Wind and foreign cards: the wind only picks buyable elements and the first relic pick includes a wind relic; foreign cards need their hero unlocked, cost more, and never include story cards; threats survive a reload
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
import { nightThreats } from '../../src/game/threats';

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
  it('同种子同夜结果一样，主力不和上一夜重样', () => {
    G.seed = 12345;
    for (let r = 2; r <= 15; r++) {
      const a = nightThreats(r, 3);
      expect(nightThreats(r, 3)).toEqual(a);
      if (r > 2) expect(a[0]).not.toBe(nightThreats(r - 1, 1)[0]);
    }
  });
});
