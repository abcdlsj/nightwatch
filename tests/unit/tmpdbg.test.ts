import { it, beforeAll } from 'vitest';
import { initLocale } from '../../src/i18n';
import { reseed } from '../../src/core/rng';
import { G, freshRun } from '../../src/game/state';
import { recalcMods } from '../../src/game/mods';
import { newCard } from '../../src/game/cards';
import { B, startBattle, simStep, setOnEnd } from '../../src/sim/battle';
import { applyMod } from '../../src/mod/apply';
import { enterWorld } from '../../src/mod/enter';
import { setView, nullView } from '../../src/sim/view';
import spire from '../../mods/spire';
beforeAll(() => { initLocale(); setOnEnd(() => {}); applyMod(spire); });
it('dbg', () => {
  const banners: string[] = [];
  setView({ ...nullView, banner: (m: string) => banners.push(m), num: () => {} } as never);
  for (const [hero, boss, cards] of [['chishi', 'sp_slimeking', ['sp_allin', 'sp_ragewave', 'sp_bleed', 'sp_bloodoath', 'sp_brokenblade']], ['qingji', 'sp_clock', ['sp_fogpot', 'sp_fumes', 'sp_catalyst', 'sp_dart', 'sp_sleeve']], ['chishi', 'sp_guardian', ['sp_allin', 'sp_shieldbash', 'sp_buckler', 'sp_bulwark', 'sp_ironheart']], ['qingji', 'sp_hexflame', ['sp_thousand', 'sp_bladerain', 'sp_sleeve', 'sp_tailknife', 'sp_sleeve']], ['chishi', 'sp_rustknight', ['sp_allin', 'sp_ragewave', 'sp_demon', 'sp_brokenblade']], ['qingji', 'sp_heart2', ['sp_fogpot', 'sp_fumes', 'sp_venomsac', 'sp_dart']]] as const) {
    reseed(5); banners.length = 0;
    Object.assign(G, { hero, foeSet: 'spire', round: 9, maxRound: 9, heat: 0, run: freshRun(), cards: [], relics: [], skills: [], gold: 10, endless: false, full: false, secret: {}, seenFoes: {}, ws: {}, awaken: null });
    enterWorld();
    G.wall = G.wallMax = 60;
    let idx = 0;
    for (const k of cards) { const c = newCard(k, 3); c.loc = 'board'; c.idx = idx; idx += c.size; if (idx > 8) break; G.cards.push(c); }
    recalcMods();
    G.phase = 'battle';
    startBattle({ wave: [{ t: 1, type: boss, x: 0.5, y: 0 }] as never, ambush: false, wagers: [], beats: [] });
    const types = new Set<string>();
    for (let i = 0; i < 60 * 300 && !B!.over; i++) { simStep(1 / 60); for (const e of B!.en) types.add(e.type); }
    process.stderr.write([hero, boss, B!.result, Math.round(B!.t), 'wall', Math.round(G.wall), 'str', B!.flags.str, 'knives', B!.flags.knives, [...types].join(','), '|', [...new Set(banners)].join(",")].join(" ") + "\n");
  }
});
