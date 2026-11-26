/**
 * Bun Multi-Core Evaluation Bridge for Nightwatch GPU Order-Aware Active Search (`surrogate_search.py`).
 *
 * Evaluates ordered 8-slot board builds (variable card sizes 1/2/3 + affixes + carry + rule relic + awakening)
 * on the 100% REAL TypeScript `src/sim/` engine across all CPU cores.
 *
 * Usage:
 *   bun lab/balance/eval-bridge.ts --dump-meta --hero ayla
 *   bun lab/balance/eval-bridge.ts --in /tmp/in.json --out /tmp/out.json --hero ayla --night 9 --heat 8 --tier 2 --seeds 12
 */
import fs from 'fs';
import {
  initHeadless,
  quantile,
  getHeroCardPool,
  getCardPath,
  type FixedBoardCard,
  type FixedNightOpts,
} from './bots';
import { chunkArray, EvalWorkerPool } from './worker-pool';
import type { WorkerResult } from './eval-worker';
import { ITEMS, ADJ, ADJ_NODMG } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { HEROES, AWAKEN } from '../../src/data/heroes';
import { ARCHS, relicsFor, talentsFor } from '../../tests/balance/builds';

initHeadless();

interface BridgeCandidate {
  cards: Array<{ key: string; adj: string | null }>;
  carryIdx: number;
  ruleRelic: string;
  awaken: string;
}

function parseArg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

/** Standard representative mid/late relic + talent kit for a hero so GPU search isolates board/affix/rule/awaken power */
function defaultKitForHero(hero: string, night: number): { relics: string[]; talents: string[] } {
  const archKey = Object.keys(ARCHS).find((k) => ARCHS[k].hero === hero) || 'blade';
  return {
    relics: relicsFor(archKey, night),
    talents: talentsFor(archKey, night),
  };
}

async function main() {
  const hero = parseArg('--hero', 'ayla');
  if (!HEROES[hero]) throw new Error(`Unknown hero: ${hero}`);

  if (process.argv.includes('--dump-meta')) {
    const cardIds = getHeroCardPool(hero, true);
    const cards = cardIds.map((id) => ({
      id,
      name: ITEMS[id].n || id,
      size: ITEMS[id].size,
      tag: ITEMS[id].tag,
      dmg: ITEMS[id].dmg,
      t: ITEMS[id].t,
      path: getCardPath(id),
    }));
    const affixes = [null, ...Object.keys(ADJ)];
    const nodmgAffixes = [null, ...ADJ_NODMG];
    const ruleRelics = ['none', ...Object.keys(RELICS).filter((k) => RELICS[k].rule)];
    const awakens = (AWAKEN[hero] || []).map((a) => a.id);
    console.log(
      JSON.stringify({
        hero,
        heroName: HEROES[hero].n,
        cards,
        affixes,
        nodmgAffixes,
        ruleRelics,
        awakens,
      })
    );
    return;
  }

  const inPath = parseArg('--in', '');
  const outPath = parseArg('--out', '');
  const night = Number(parseArg('--night', '9'));
  const heatLv = Number(parseArg('--heat', '0'));
  const full = night > 9;
  const baseTier = Math.min(3, Math.max(0, Number(parseArg('--tier', '2'))));
  const carryDiamond = process.argv.includes('--carry-diamond');
  const numSeeds = Number(parseArg('--seeds', '10'));
  const seedBase = Number(parseArg('--seed-base', '1000'));

  if (!inPath || !outPath) {
    throw new Error('Required args: --in <path> --out <path>');
  }

  const candidates: BridgeCandidate[] = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const pool = new EvalWorkerPool();
  const baseKit = defaultKitForHero(hero, night);

  try {
    const tasks: Array<{ key: string; opts: FixedNightOpts }> = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const board: FixedBoardCard[] = c.cards.map((card, idx) => {
        const isCarry = idx === c.carryIdx;
        const tier = isCarry && carryDiamond ? 3 : Math.max(ITEMS[card.key].t, baseTier);
        return {
          key: card.key,
          tier,
          adj: card.adj,
          carry: isCarry,
          star: isCarry && hero === 'li' ? (night >= 11 ? 4 : night >= 7 ? 3 : 2) : 0,
          grow: isCarry && hero === 'ayla' ? 18 : 0,
          vet: hero === 'ayla' ? Math.min(6, night - 1) : 0,
        };
      });
      const relics = c.ruleRelic && c.ruleRelic !== 'none' ? [...baseKit.relics, c.ruleRelic] : baseKit.relics;
      for (let s = 0; s < numSeeds; s++) {
        tasks.push({
          key: String(i),
          opts: {
            hero,
            night,
            heat: heatLv,
            full,
            seed: seedBase + s * 7919 + night * 31,
            foeSet: s % 2 === 0 ? 'dark' : 'frost',
            board,
            relics,
            talents: baseKit.talents,
            awaken: c.awaken,
          },
        });
      }
    }

    const chunks = chunkArray(tasks, Math.max(16, Math.ceil(tasks.length / (pool.concurrency * 4))));
    const batchRes = await Promise.all(
      chunks.map((chunk) =>
        pool.submit<Extract<WorkerResult, { kind: 'fixed_batch' }>>({
          kind: 'fixed_batch',
          tasks: chunk,
        })
      )
    );

    const buckets = candidates.map(() => ({
      scores: [] as number[],
      dps: [] as number[],
      wins: 0,
      wallLost: 0,
      chains: 0,
      rx: 0,
      ult: 0,
    }));

    for (const br of batchRes) {
      for (const item of br.results) {
        const b = buckets[Number(item.key)];
        const r = item.result;
        b.scores.push(r.score);
        b.dps.push(r.dps);
        if (r.win) b.wins++;
        b.wallLost += r.wallLost;
        b.chains = Math.max(b.chains, r.maxChain);
        b.rx += r.rxN;
        b.ult += r.stkN;
      }
    }

    const results = buckets.map((b) => {
      const n = Math.max(1, b.scores.length);
      const sortedScore = [...b.scores].sort((x, y) => x - y);
      const sortedDps = [...b.dps].sort((x, y) => x - y);
      return {
        winRate: b.wins / n,
        avgScore: Math.round(b.scores.reduce((s, v) => s + v, 0) / n),
        p50Score: Math.round(quantile(sortedScore, 0.5)),
        p90Score: Math.round(quantile(sortedScore, 0.9)),
        avgDps: Math.round(b.dps.reduce((s, v) => s + v, 0) / n),
        p90Dps: Math.round(quantile(sortedDps, 0.9)),
        avgWallLost: Math.round((b.wallLost / n) * 10) / 10,
        maxChain: b.chains,
        avgRx: Math.round((b.rx / n) * 10) / 10,
        avgUlt: Math.round((b.ult / n) * 10) / 10,
      };
    });

    fs.writeFileSync(outPath, JSON.stringify(results), 'utf8');
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
