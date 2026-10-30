/* 修正项说明：天性、觉醒这类没有通用说明的键要跳过，不能让遗物合计崩掉 / Modifier text: keys without a generic label (natures, awakenings) are skipped instead of crashing the relic totals */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { modText } from '../../src/game/text';
import { SIGS, AWAKEN } from '../../src/data/heroes';

beforeAll(() => initLocale());

describe('modText', () => {
  it('每个人物的天性和觉醒混进合计里都不报错', () => {
    for (const [h, m] of Object.entries(SIGS)) {
      expect(() => modText({ ...m, dmg: 0.1 })).not.toThrow();
      for (const a of AWAKEN[h] || []) expect(() => modText({ ...a.m, dmg: 0.1 })).not.toThrow();
    }
  });
  it('有说明的键照常显示', () => {
    expect(modText({ dmg: 0.1, vetCap: 3 })).toContain('+10%');
  });
});
