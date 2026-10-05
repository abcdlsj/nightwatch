/* 拖动换位：目标区满了也要能和压着的卡对调，只要两个区里有地方放 / Drag swapping: even with the target zone full, trade places with the cards sitting there as long as either zone has room */
import { describe, it, expect, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { G, type Card, type Zone } from '../../src/game/state';
import { newCard, occ } from '../../src/game/cards';
import { insertPlan, swapPlan, type Move } from '../../src/game/prep';

beforeAll(() => initLocale());

function put(key: string, loc: Zone, idx: number) {
  const c = newCard(key, 0);
  c.loc = loc;
  c.idx = idx;
  G.cards.push(c);
  return c;
}
const apply = (me: Card, z: 'board' | 'stash', i: number, moves: Move[]) => {
  for (const [o, p, mz] of moves) Object.assign(o, { loc: mz, idx: p });
  Object.assign(me, { loc: z, idx: i });
};
const valid = () => {
  for (const z of ['board', 'stash'] as const) {
    const cnt = occ(z).filter(Boolean).length;
    const want = G.cards.filter((c) => c.loc === z).reduce((s, c) => s + c.size, 0);
    expect(cnt).toBe(want);
  }
};

describe('拖动换位', () => {
  it('满棋盘的卡拖到背包里的卡上：对调', () => {
    G.cards = [];
    const b = [put('dagger', 'board', 0), put('dagger', 'board', 1), put('axe', 'board', 2), put('axe', 'board', 4), put('axe', 'board', 6)];
    const s = put('spark', 'stash', 0);
    put('icicle', 'stash', 1);
    put('bolt', 'stash', 2);
    put('anvil', 'stash', 3);
    expect(insertPlan('stash', 0, 1, b[0])).toBeNull();
    const pl = swapPlan('stash', 0, 1, b[0])!;
    expect(pl).not.toBeNull();
    apply(b[0], 'stash', 0, pl.moves);
    expect(s.loc).toBe('board');
    expect(s.idx).toBe(0);
    valid();
  });
  it('背包的小卡拖到满棋盘的大卡上：大卡换回背包空出来的两格', () => {
    G.cards = [];
    const big = [put('axe', 'board', 0), put('axe', 'board', 2), put('axe', 'board', 4), put('axe', 'board', 6)];
    const a = put('dagger', 'stash', 0);
    put('spark', 'stash', 2);
    const pl = swapPlan('board', 2, 1, a)!;
    expect(pl).not.toBeNull();
    apply(a, 'board', 2, pl.moves);
    expect(big[1].loc).toBe('stash');
    valid();
  });
  it('两个区都没地方放：不能换', () => {
    G.cards = [];
    for (let i = 0; i < 8; i += 2) put('axe', 'board', i);
    const a = put('dagger', 'stash', 0);
    put('spark', 'stash', 1);
    put('icicle', 'stash', 2);
    put('bolt', 'stash', 3);
    expect(swapPlan('board', 0, 1, a)).toBeNull();
  });
});
