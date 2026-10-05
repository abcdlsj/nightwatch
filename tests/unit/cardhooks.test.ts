/* 防同质化：每张专属卡至少带一个构筑钩子，同一流派里两张卡的钩子组合不能一样
 * Anti-sameness: every exclusive card carries at least one build hook, and no two cards in one archetype share the same hook set */
import { describe, it, expect } from 'vitest';
import { ITEMS } from '../../src/data/cards';
import { PATHS } from '../../src/data/heroes';
import { CARD_HOOKS } from '../../src/sim/hooks';

/** 不算钩子的字段：基础数值、打法和最普通的附带效果 / fields that are not hooks: base stats, attack mode and the plainest riders */
const PLAIN = new Set(['size', 'tag', 't', 'up', 'cd', 'dmg', 'fx', 'kind', 'hero', 'noPool', 'local', 'snd', 'burn', 'poison', 'slow', 'chain', 'aoe', 'n', 'd', 'f', 'lore', 'dn', 'dl', 'questT']);
const hooksOf = (k: string) => {
  const h = Object.keys(ITEMS[k]).filter((f) => !PLAIN.has(f));
  if (CARD_HOOKS[k]) h.push('hook:' + k);
  return h.sort();
};

describe('卡牌钩子 / card hooks', () => {
  it('每张专属卡至少一个钩子 / every exclusive card has a hook', () => {
    const bare = Object.keys(ITEMS).filter((k) => ITEMS[k].hero && !hooksOf(k).length);
    expect(bare).toEqual([]);
  });
  it('同一流派钩子组合不重复 / no repeated hook sets within an archetype', () => {
    const dup: string[] = [];
    for (const h in PATHS)
      for (const p of PATHS[h]) {
        const seen = new Map<string, string>();
        for (const k of p.cards) {
          const s = hooksOf(k).join('+');
          if (seen.has(s)) dup.push(`${h}/${p.id}: ${seen.get(s)} = ${k} (${s})`);
          else seen.set(s, k);
        }
      }
    expect(dup).toEqual([]);
  });
});
