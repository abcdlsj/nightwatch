/* 读档：老存档里改了名的卡（包括上一夜战报快照里的）换成新卡，删掉的丢弃 / Loading: renamed cards in old saves (including last night's report snapshot) map to their new cards, removed ones are dropped */
import { it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { G, freshRun } from '../../src/game/state';
import { restoreSave } from '../../src/game/save';

beforeAll(() => initLocale());

it('老存档的上一夜战报快照会迁移卡名', () => {
  const run = freshRun();
  run.prevRep = { r: 2, cards: [{ key: 'paperlamp', tier: 0, dmg: 50, trig: 5 }, { key: 'no_such_card', tier: 0, dmg: 9, trig: 1 }], kills: 1, chain: 1, combo: 0, wall: 0 };
  const ok = restoreSave({ hero: 'ying', round: 3, gold: 5, wall: 26, wallMax: 26, relics: [], skills: [], cards: [{ key: 'paperlamp', tier: 0, adj: null, loc: 'board', idx: 0 }], run } as never);
  expect(ok).toBe(true);
  expect(G.cards.map((c) => c.key)).toEqual(['oilspill']);
  expect(G.run!.prevRep!.cards.map((c) => c.key)).toEqual(['oilspill']);
});
