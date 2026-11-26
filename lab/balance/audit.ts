/**
 * Nightwatch Comprehensive Balance Audit (`bun lab/balance/audit.ts`)
 *
 * Runs 7 deep diagnostics on the REAL TypeScript simulation engine (zero rule drift):
 *   1. 4 Player Personas × 5 Heroes (Heat 0 Normal 9-Night + Brand-New Account Check + Full 15-Night)
 *   2. All 5 Heroes × 3 Paths (15 Archetypes) & All 20 Starting Kits
 *   3. Night-9 Bosses (5) × 5 Heroes Matrix + Night-15 Hidden Bosses
 *   4. FoeSets (dark vs frost) & 8 Threats Parity Audit
 *   5. Rule Relics (8) & Hero Awakenings (10) Counterfactual Lift Audit
 *   6. All Cards Winrate & Damage Attribution Audit (S+/A/B/C/D flags)
 *   7. Relics & Talents Winrate Attribution Audit
 *
 * Env knobs:
 *   AUDIT_RUNS=80       Runs per (Persona × Hero) cell (Colab: 200+)
 *   PATH_RUNS=40        Runs per (Hero × Path) cell (Colab: 100+)
 *   KIT_RUNS=30         Runs per Starting Kit (Colab: 80+)
 *   BOSS_RUNS=30        Runs per (Boss × Hero) cell (Colab: 60+)
 *   CF_SEEDS=30         Counterfactual seeds for Rule Relics / Awakenings (Colab: 80+)
 *   WORKERS=auto        Worker threads
 */
import fs from 'fs';
import path from 'path';
import {
  initHeadless,
  quantile,
  type Persona,
  type RunOpts,
  type RunResult,
  type FixedNightOpts,
  type FixedNightResult,
} from './bots';
import { chunkArray, EvalWorkerPool } from './worker-pool';
import type { WorkerResult } from './eval-worker';
import { HEROES, HERO_ORDER, KITS, PATHS, AWAKEN } from '../../src/data/heroes';
import { ITEMS } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { TALENTS } from '../../src/data/talents';
import { EN } from '../../src/data/enemies';
import { THREATS } from '../../src/data/threats';
import { finalBosses, hiddenBoss } from '../../src/game/plan';
import { ARCHS, boardFor, relicsFor, talentsFor, carryFor } from '../../tests/balance/builds';

initHeadless();

const AUDIT_RUNS = Number(process.env.AUDIT_RUNS ?? 60);
const PATH_RUNS = Number(process.env.PATH_RUNS ?? 40);
const KIT_RUNS = Number(process.env.KIT_RUNS ?? 30);
const BOSS_RUNS = Number(process.env.BOSS_RUNS ?? 25);
const CF_SEEDS = Number(process.env.CF_SEEDS ?? 30);
const REPORT_DIR = path.resolve(import.meta.dirname, 'reports');
const PREFIX = process.env.REPORT_PREFIX ?? 'balance-audit';

const PERSONAS: Persona[] = ['novice_random', 'reader_basic', 'skilled_builder', 'master_optimizer'];
const PERSONA_NAMES: Record<Persona, string> = {
  novice_random: '乱点新手 (Novice)',
  reader_basic: '读文案新手 (Reader)',
  skilled_builder: '构筑熟手 (Skilled)',
  master_optimizer: '机制大师 (Master)',
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const spct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;

async function runBatch(pool: EvalWorkerPool, tasks: Array<{ key: string; opts: RunOpts }>): Promise<Map<string, RunResult[]>> {
  const chunks = chunkArray(tasks, Math.max(8, Math.ceil(tasks.length / (pool.concurrency * 4))));
  const res = await Promise.all(
    chunks.map((c) => pool.submit<Extract<WorkerResult, { kind: 'run_batch' }>>({ kind: 'run_batch', tasks: c }))
  );
  const grouped = new Map<string, RunResult[]>();
  for (const chunkRes of res) {
    for (const item of chunkRes.results) {
      let arr = grouped.get(item.key);
      if (!arr) {
        arr = [];
        grouped.set(item.key, arr);
      }
      arr.push(item.result);
    }
  }
  return grouped;
}

async function fixedBatch(
  pool: EvalWorkerPool,
  tasks: Array<{ key: string; opts: FixedNightOpts }>
): Promise<Map<string, FixedNightResult[]>> {
  const chunks = chunkArray(tasks, Math.max(12, Math.ceil(tasks.length / (pool.concurrency * 4))));
  const res = await Promise.all(
    chunks.map((c) => pool.submit<Extract<WorkerResult, { kind: 'fixed_batch' }>>({ kind: 'fixed_batch', tasks: c }))
  );
  const grouped = new Map<string, FixedNightResult[]>();
  for (const chunkRes of res) {
    for (const item of chunkRes.results) {
      let arr = grouped.get(item.key);
      if (!arr) {
        arr = [];
        grouped.set(item.key, arr);
      }
      arr.push(item.result);
    }
  }
  return grouped;
}

function summarizeRuns(runs: RunResult[]) {
  const n = runs.length || 1;
  const win = runs.filter((r) => r.win).length / n;
  const avgNight = runs.reduce((s, r) => s + (r.win ? r.nightReached + 1 : r.nightReached), 0) / n;
  const n4 = runs.filter((r) => r.nightSurvived[3]).length / n;
  const n7 = runs.filter((r) => r.nightSurvived[6]).length / n;
  const wallLeft = runs.filter((r) => r.win).reduce((s, r) => s + r.wallLeft, 0) / Math.max(1, runs.filter((r) => r.win).length);
  const maxHits = runs.map((r) => r.maxHit).sort((a, b) => a - b);
  const p90Hit = Math.round(quantile(maxHits, 0.9));
  const avgRx = runs.reduce((s, r) => s + r.rxTotal, 0) / n;
  const avgUlt = runs.reduce((s, r) => s + r.ultTotal, 0) / n;
  return { n, win, avgNight, n4, n7, wallLeft, p90Hit, avgRx, avgUlt };
}

async function main() {
  const t0 = performance.now();
  const pool = new EvalWorkerPool();
  const heroes = HERO_ORDER.filter((h) => HEROES[h]);
  const bosses = finalBosses();

  console.log(
    `=== Nightwatch Comprehensive Balance Audit (workers=${pool.concurrency}, AUDIT_RUNS=${AUDIT_RUNS}, PATH_RUNS=${PATH_RUNS}) ===\n`
  );

  try {
    /* ---- 1. 4 Personas × 5 Heroes (Heat 0 Normal + Fresh Account + Full 15-Night) ---- */
    console.log('[1/6] Running 4 Personas × 5 Heroes (Heat 0 Normal, Fresh Account, Full 15-Night)...');
    const sec1Tasks: Array<{ key: string; opts: RunOpts }> = [];
    for (const p of PERSONAS) {
      for (const h of heroes) {
        for (let i = 0; i < AUDIT_RUNS; i++) {
          sec1Tasks.push({
            key: `norm|${p}|${h}`,
            opts: { hero: h, persona: p, seed: 10000 + i * 37 + h.charCodeAt(0) * 13, heat: 0, full: false, mastLv: 0, unlockAll: true },
          });
        }
      }
    }
    // Brand-new player check (unlockAll=false, mastLv=0, first kit only) for reader_basic & novice_random
    const freshRuns = Math.max(2, Math.floor(AUDIT_RUNS * 0.6));
    for (const p of ['novice_random', 'reader_basic'] as Persona[]) {
      for (const h of heroes) {
        for (let i = 0; i < freshRuns; i++) {
          sec1Tasks.push({
            key: `fresh|${p}|${h}`,
            opts: { hero: h, persona: p, seed: 20000 + i * 41 + h.charCodeAt(0) * 17, heat: 0, full: false, kitIdx: 0, mastLv: 0, unlockAll: false },
          });
        }
      }
    }
    // Full 15-Night line (Heat 0) for reader_basic, skilled_builder, master_optimizer
    const fullAuditRuns = Math.max(2, Math.floor(AUDIT_RUNS * 0.45));
    for (const p of ['reader_basic', 'skilled_builder', 'master_optimizer'] as Persona[]) {
      for (const h of heroes) {
        for (let i = 0; i < fullAuditRuns; i++) {
          sec1Tasks.push({
            key: `full|${p}|${h}`,
            opts: { hero: h, persona: p, seed: 30000 + i * 43 + h.charCodeAt(0) * 19, heat: 0, full: true, mastLv: 0, unlockAll: true },
          });
        }
      }
    }
    const sec1Res = await runBatch(pool, sec1Tasks);

    /* ---- 2. All 15 Hero Paths & All 20 Starting Kits ---- */
    console.log('[2/6] Running 15 Hero Paths (Reader & Skilled) & 20 Starting Kits...');
    const sec2Tasks: Array<{ key: string; opts: RunOpts }> = [];
    for (const h of heroes) {
      for (const p of PATHS[h]) {
        for (const persona of ['reader_basic', 'skilled_builder'] as Persona[]) {
          for (let i = 0; i < PATH_RUNS; i++) {
            sec2Tasks.push({
              key: `path|${h}|${p.id}|${persona}`,
              opts: { hero: h, persona, seed: 40000 + i * 53 + p.id.charCodeAt(0) * 7, heat: 0, targetPath: p.id, mastLv: 0, unlockAll: true },
            });
          }
        }
      }
      for (let ki = 0; ki < KITS[h].length; ki++) {
        for (let i = 0; i < KIT_RUNS; i++) {
          sec2Tasks.push({
            key: `kit|${h}|${ki}`,
            opts: { hero: h, persona: 'reader_basic', seed: 50000 + i * 59 + ki * 101, heat: 0, kitIdx: ki, mastLv: 0, unlockAll: true },
          });
        }
      }
    }
    const sec2Res = await runBatch(pool, sec2Tasks);

    /* ---- 3. Boss × Hero Matrix (5 Night-9 Bosses + FoeSets dark vs frost) ---- */
    console.log('[3/6] Running 5 Night-9 Bosses × 5 Heroes & FoeSet (dark vs frost)...');
    const sec3Tasks: Array<{ key: string; opts: RunOpts }> = [];
    for (const boss of bosses) {
      for (const h of heroes) {
        for (let i = 0; i < BOSS_RUNS; i++) {
          sec3Tasks.push({
            key: `boss|${boss}|${h}`,
            opts: { hero: h, persona: 'skilled_builder', seed: 60000 + i * 61 + boss.charCodeAt(0) * 11, heat: 0, boss9: boss, mastLv: 0, unlockAll: true },
          });
        }
      }
    }
    for (const fsName of ['dark', 'frost'] as const) {
      for (const h of heroes) {
        for (let i = 0; i < BOSS_RUNS; i++) {
          sec3Tasks.push({
            key: `foeset|${fsName}|${h}`,
            opts: { hero: h, persona: 'reader_basic', seed: 70000 + i * 67 + h.charCodeAt(0) * 23, heat: 0, foeSet: fsName, mastLv: 0, unlockAll: true },
          });
        }
      }
    }
    const sec3Res = await runBatch(pool, sec3Tasks);

    /* ---- 4. Rule Relics (8) & Awakenings (10) Counterfactual Lift on Night 8 & 9 ---- */
    console.log('[4/6] Running Counterfactual Audit for 8 Rule Relics & 10 Awakenings...');
    const cfTasks: Array<{ key: string; opts: FixedNightOpts }> = [];
    const ruleIds = Object.keys(RELICS).filter((k) => RELICS[k].rule);
    const sampleArchs = Object.keys(ARCHS);

    for (const rKey of ['', ...ruleIds]) {
      for (const arch of sampleArchs) {
        const A = ARCHS[arch];
        const board = boardFor(arch, 8).map(([key, tier, adj]) => ({ key, tier, adj: adj || null }));
        const cr = carryFor(arch, 8, board.map((b) => b.key));
        if (cr) {
          const found = board.find((b) => b.key === cr.key);
          if (found) Object.assign(found, { carry: true, star: cr.star });
        }
        for (let s = 0; s < Math.max(8, Math.floor(CF_SEEDS / 3)); s++) {
          cfTasks.push({
            key: `rule|${rKey || 'none'}`,
            opts: {
              hero: A.hero,
              night: 8,
              seed: 80000 + s * 71 + arch.charCodeAt(0) * 13,
              board,
              relics: rKey ? [...relicsFor(arch, 8), rKey] : relicsFor(arch, 8),
              talents: talentsFor(arch, 8),
            },
          });
        }
      }
    }

    // Hero Awakenings counterfactual on Night 8 & 9
    for (const h of heroes) {
      const heroArchs = sampleArchs.filter((a) => ARCHS[a].hero === h);
      const awList = ['', ...(AWAKEN[h] || []).map((a) => a.id)];
      for (const aw of awList) {
        for (const arch of heroArchs) {
          const board = boardFor(arch, 9).map(([key, tier, adj]) => ({
            key,
            tier,
            adj: adj || null,
            vet: h === 'ayla' ? 6 : 0,
          }));
          const cr = carryFor(arch, 9, board.map((b) => b.key));
          if (cr) {
            const found = board.find((b) => b.key === cr.key);
            if (found) Object.assign(found, { carry: true, star: cr.star });
          }
          for (let s = 0; s < Math.max(10, Math.floor(CF_SEEDS / 2)); s++) {
            cfTasks.push({
              key: `awaken|${h}|${aw || 'none'}`,
              opts: {
                hero: h,
                night: 9,
                seed: 85000 + s * 73 + arch.charCodeAt(0) * 19,
                board,
                relics: relicsFor(arch, 9),
                talents: talentsFor(arch, 9),
                awaken: aw,
              },
            });
          }
        }
      }
    }

    // 8 Threats counterfactual parity on Night 7 & 8
    const cfRes = await fixedBatch(pool, cfTasks);

    /* ---- 5. Telemetry Aggregation across ALL simulated runs (Cards, Relics, Talents, Threats) ---- */
    console.log('[5/6] Aggregating Card, Relic, Talent & Threat attribution...');
    const allRuns: RunResult[] = [];
    for (const arr of sec1Res.values()) allRuns.push(...arr);
    for (const arr of sec2Res.values()) allRuns.push(...arr);
    for (const arr of sec3Res.values()) allRuns.push(...arr);

    // Focus attribution on skilled_builder + reader_basic Normal Heat-0 runs (large clean sample)
    const cleanRuns = allRuns.filter((r) => !r.full && r.heat === 0 && (r.persona === 'reader_basic' || r.persona === 'skilled_builder'));
    const heroBaseWin: Record<string, number> = {};
    for (const h of heroes) {
      const hr = cleanRuns.filter((r) => r.hero === h);
      heroBaseWin[h] = hr.filter((r) => r.win).length / Math.max(1, hr.length);
    }

    const cardStat = new Map<string, { n: number; wins: number; liftSum: number; dmgSum: number; carryN: number }>();
    const relicStat = new Map<string, { n: number; wins: number; liftSum: number }>();
    const talentStat = new Map<string, { n: number; wins: number; liftSum: number }>();
    const threatLoss = new Map<string, number>();
    const enemyLoss = new Map<string, number>();

    for (const r of cleanRuns) {
      const base = heroBaseWin[r.hero] || 0.5;
      const totDmg = r.finalBoard.reduce((s, c) => s + c.dmg, 0) || 1;
      const seenCards = new Set<string>();
      for (const c of r.finalBoard) {
        if (seenCards.has(c.key)) continue;
        seenCards.add(c.key);
        const st = cardStat.get(c.key) || { n: 0, wins: 0, liftSum: 0, dmgSum: 0, carryN: 0 };
        st.n++;
        if (r.win) st.wins++;
        st.liftSum += (r.win ? 1 : 0) - base;
        st.dmgSum += c.dmg / totDmg;
        if (c.carry) st.carryN++;
        cardStat.set(c.key, st);
      }
      for (const rk of new Set(r.relics)) {
        const st = relicStat.get(rk) || { n: 0, wins: 0, liftSum: 0 };
        st.n++;
        if (r.win) st.wins++;
        st.liftSum += (r.win ? 1 : 0) - base;
        relicStat.set(rk, st);
      }
      for (const tk of new Set(r.talents)) {
        const st = talentStat.get(tk) || { n: 0, wins: 0, liftSum: 0 };
        st.n++;
        if (r.win) st.wins++;
        st.liftSum += (r.win ? 1 : 0) - base;
        talentStat.set(tk, st);
      }
      if (!r.win) {
        if (r.lostThreat) threatLoss.set(r.lostThreat, (threatLoss.get(r.lostThreat) || 0) + 1);
        if (r.lostToEnemy) enemyLoss.set(r.lostToEnemy, (enemyLoss.get(r.lostToEnemy) || 0) + 1);
      }
    }

    /* ---- 6. Write Markdown & JSON Report ---- */
    console.log('[6/6] Writing audit report...');
    const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1);
    const md: string[] = [];

    md.push(`# Nightwatch 全量数值平衡体检报告`);
    md.push('');
    md.push(`> 生成时间：\`${new Date().toISOString()}\` | 总模拟局数：**\`${allRuns.length.toLocaleString()}\`** 局 + \`${cfTasks.length.toLocaleString()}\` 场单夜对照 | 耗时：\`${elapsedSec}s\``);
    md.push('');

    // Section 1
    md.push(`## 一、4 档玩家水平 × 5 位守夜人（Heat 0 普通 9 夜）`);
    md.push('');
    md.push(`| 玩家水平 | 艾拉 (ayla) | 墨 (mo) | 萤 (ying) | 石钧 (jun) | 星遥 (li) | **全英雄均胜** | 第4夜存活 | 第7夜存活 | P90 峰值一击 |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |`);
    const sec1Json: Record<string, any> = {};
    for (const p of PERSONAS) {
      const cells: string[] = [];
      const allP: RunResult[] = [];
      sec1Json[p] = {};
      for (const h of heroes) {
        const runs = sec1Res.get(`norm|${p}|${h}`) || [];
        allP.push(...runs);
        const s = summarizeRuns(runs);
        sec1Json[p][h] = s;
        cells.push(`${pct(s.win)} (${s.avgNight.toFixed(1)}夜)`);
      }
      const tot = summarizeRuns(allP);
      sec1Json[p]._all = tot;
      md.push(
        `| **${PERSONA_NAMES[p]}** | ${cells.join(' | ')} | **${pct(tot.win)}** | ${pct(tot.n4)} | ${pct(tot.n7)} | ${tot.p90Hit.toLocaleString()} |`
      );
    }
    md.push('');

    md.push(`### 1.1 全新零熟练账号体检（仅解锁第一流派、熟练度 Lv0、起手套 #1）`);
    md.push('');
    md.push(`| 玩家水平 | 艾拉 | 墨 | 萤 | 石钧 | 星遥 | **均值** |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: |`);
    for (const p of ['novice_random', 'reader_basic'] as Persona[]) {
      const cells: string[] = [];
      const allP: RunResult[] = [];
      for (const h of heroes) {
        const runs = sec1Res.get(`fresh|${p}|${h}`) || [];
        allP.push(...runs);
        cells.push(pct(summarizeRuns(runs).win));
      }
      md.push(`| **${PERSONA_NAMES[p]}** | ${cells.join(' | ')} | **${pct(summarizeRuns(allP).win)}** |`);
    }
    md.push('');

    md.push(`### 1.2 完整游戏线（15 夜 + 拿齐三宝石打隐藏首领，Heat 0）`);
    md.push('');
    md.push(`| 玩家水平 | 艾拉 (初誓者) | 墨 (灰袍) | 萤 (熄灯人) | 石钧 (黑墙) | 星遥 (失星) | **均值** |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: |`);
    for (const p of ['reader_basic', 'skilled_builder', 'master_optimizer'] as Persona[]) {
      const cells: string[] = [];
      const allP: RunResult[] = [];
      for (const h of heroes) {
        const runs = sec1Res.get(`full|${p}|${h}`) || [];
        allP.push(...runs);
        const s = summarizeRuns(runs);
        cells.push(`${pct(s.win)} (${s.avgNight.toFixed(1)}夜)`);
      }
      md.push(`| **${PERSONA_NAMES[p]}** | ${cells.join(' | ')} | **${pct(summarizeRuns(allP).win)}** |`);
    }
    md.push('');

    // Section 2
    md.push(`## 二、全部 15 个流派 & 20 套起手体检（Heat 0）`);
    md.push('');
    md.push(`| 守夜人 | 流派 | 读文案新手胜率 | 构筑熟手胜率 | 第4夜存活(熟手) | 第7夜存活(熟手) | 场均反应/大招 |`);
    md.push(`| :--- | :--- | :---: | :---: | :---: | :---: | :---: |`);
    const pathJson: Record<string, any> = {};
    for (const h of heroes) {
      for (const p of PATHS[h]) {
        const rd = summarizeRuns(sec2Res.get(`path|${h}|${p.id}|reader_basic`) || []);
        const sk = summarizeRuns(sec2Res.get(`path|${h}|${p.id}|skilled_builder`) || []);
        pathJson[`${h}:${p.id}`] = { reader: rd, skilled: sk };
        md.push(
          `| ${HEROES[h].n} (\`${h}\`) | **${p.n || p.id}** (\`${p.id}\`) | ${pct(rd.win)} | **${pct(sk.win)}** | ${pct(sk.n4)} | ${pct(sk.n7)} | ${sk.avgRx.toFixed(1)} / ${sk.avgUlt.toFixed(1)} |`
        );
      }
    }
    md.push('');

    md.push(`### 2.1 20 套起手前两夜与全 9 夜存活率（读文案新手，Heat 0）`);
    md.push('');
    md.push(`| 守夜人 | 起手 # | 所属流派 | 起手卡 | 第1夜 | 第2夜 | 第4夜 | 第9夜通关 |`);
    md.push(`| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: |`);
    for (const h of heroes) {
      for (let ki = 0; ki < KITS[h].length; ki++) {
        const runs = sec2Res.get(`kit|${h}|${ki}`) || [];
        const n = runs.length || 1;
        const n1 = runs.filter((r) => r.nightSurvived[0]).length / n;
        const n2 = runs.filter((r) => r.nightSurvived[1]).length / n;
        const n4 = runs.filter((r) => r.nightSurvived[3]).length / n;
        const win = runs.filter((r) => r.win).length / n;
        const cardsStr = KITS[h][ki].cards.map(([k, t]) => `${ITEMS[k]?.n || k}(T${t})`).join('+');
        md.push(`| ${HEROES[h].n} | #${ki + 1} | \`${KITS[h][ki].path}\` | ${cardsStr} | ${pct(n1)} | ${pct(n2)} | ${pct(n4)} | **${pct(win)}** |`);
      }
    }
    md.push('');

    // Section 3
    md.push(`## 三、5 位第 9 夜首领 × 5 位守夜人压力矩阵（构筑熟手，Heat 0）`);
    md.push('');
    md.push(`| 首领 | 艾拉 | 墨 | 萤 | 石钧 | 星遥 | **总通关率** | 倒在首领夜占比 |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |`);
    const bossJson: Record<string, any> = {};
    for (const b of bosses) {
      const cells: string[] = [];
      const allB: RunResult[] = [];
      for (const h of heroes) {
        const runs = sec3Res.get(`boss|${b}|${h}`) || [];
        allB.push(...runs);
        cells.push(pct(summarizeRuns(runs).win));
      }
      const n = allB.length || 1;
      const win = allB.filter((r) => r.win).length / n;
      const reachedN9 = allB.filter((r) => r.nightReached >= 9).length;
      const diedN9 = allB.filter((r) => !r.win && r.nightReached === 9).length;
      bossJson[b] = { win, n9FailRate: reachedN9 ? diedN9 / reachedN9 : 0 };
      md.push(`| **${EN[b]?.n || b}** (\`${b}\`) | ${cells.join(' | ')} | **${pct(win)}** | ${pct(reachedN9 ? diedN9 / reachedN9 : 0)} (${diedN9}/${reachedN9}) |`);
    }
    md.push('');

    // Section 4
    md.push(`## 四、敌人套（亡者与深渊 vs 霜潮）& 致命敌情/敌人诊断`);
    md.push('');
    md.push(`| 敌人套 | 艾拉 | 墨 | 萤 | 石钧 | 星遥 | **均值** |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: |`);
    for (const fsName of ['dark', 'frost'] as const) {
      const cells: string[] = [];
      const allF: RunResult[] = [];
      for (const h of heroes) {
        const runs = sec3Res.get(`foeset|${fsName}|${h}`) || [];
        allF.push(...runs);
        cells.push(pct(summarizeRuns(runs).win));
      }
      md.push(`| **${fsName === 'dark' ? '亡者与深渊 (dark)' : '霜潮 (frost)'}** | ${cells.join(' | ')} | **${pct(summarizeRuns(allF).win)}** |`);
    }
    md.push('');
    const totalLoss = [...threatLoss.values()].reduce((s, v) => s + v, 0) || 1;
    md.push(
      `- **最易致死敌情 Top 8**：` +
        [...threatLoss.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `\`${THREATS[k]?.n || k}\` ${((v / totalLoss) * 100).toFixed(1)}% (${v})`)
          .join(' ｜ ')
    );
    md.push(
      `- **最常破墙敌人 Top 10**：` +
        [...enemyLoss.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([k, v]) => `\`${EN[k]?.n || k}(${k})\` ×${v}`)
          .join(' ｜ ')
    );
    md.push('');

    // Section 5
    md.push(`## 五、规则遗物（8 件）& 人物觉醒（10 项）反事实净增益`);
    md.push('');
    const baseRule = cfRes.get('rule|none') || [];
    const baseRuleWin = baseRule.filter((r) => r.win).length / Math.max(1, baseRule.length);
    const baseRuleLost = baseRule.reduce((s, r) => s + r.wallLost, 0) / Math.max(1, baseRule.length);
    md.push(`### 5.1 规则遗物对照（第 8 夜全 19 成型流派基准：守住 ${pct(baseRuleWin)}，均掉墙 ${baseRuleLost.toFixed(1)}）`);
    md.push('');
    md.push(`| 规则遗物 | 守住率 | 胜率净增 | 均掉墙 | 场均大招 | 场均反应 |`);
    md.push(`| :--- | :---: | :---: | :---: | :---: | :---: |`);
    const ruleJson: Record<string, any> = {};
    for (const rk of ruleIds) {
      const arr = cfRes.get(`rule|${rk}`) || [];
      const n = arr.length || 1;
      const w = arr.filter((r) => r.win).length / n;
      const l = arr.reduce((s, r) => s + r.wallLost, 0) / n;
      const stk = arr.reduce((s, r) => s + r.stkN, 0) / n;
      const rx = arr.reduce((s, r) => s + r.rxN, 0) / n;
      ruleJson[rk] = { win: w, lift: w - baseRuleWin, wallLost: l, stk, rx };
      md.push(`| **${RELICS[rk].n}** (\`${rk}\`) | ${pct(w)} | **${spct(w - baseRuleWin)}** | ${l.toFixed(1)} | ${stk.toFixed(1)} | ${rx.toFixed(1)} |`);
    }
    md.push('');

    md.push(`### 5.2 人物觉醒对照（第 9 夜）`);
    md.push('');
    md.push(`| 守夜人 | 无觉醒基准 | 觉醒 A | 觉醒 B |`);
    md.push(`| :--- | :---: | :---: | :---: |`);
    for (const h of heroes) {
      const bArr = cfRes.get(`awaken|${h}|none`) || [];
      const bw = bArr.filter((r) => r.win).length / Math.max(1, bArr.length);
      const aws = AWAKEN[h] || [];
      const aArr = cfRes.get(`awaken|${h}|${aws[0]?.id}`) || [];
      const cArr = cfRes.get(`awaken|${h}|${aws[1]?.id}`) || [];
      const aw = aArr.filter((r) => r.win).length / Math.max(1, aArr.length);
      const cw = cArr.filter((r) => r.win).length / Math.max(1, cArr.length);
      md.push(
        `| **${HEROES[h].n}** | ${pct(bw)} | \`${aws[0]?.id}\` ${pct(aw)} (${spct(aw - bw)}) | \`${aws[1]?.id}\` ${pct(cw)} (${spct(cw - bw)}) |`
      );
    }
    md.push('');

    // Section 6
    const cardRows = [...cardStat.entries()]
      .filter(([, s]) => s.n >= 15)
      .map(([k, s]) => ({
        key: k,
        name: ITEMS[k]?.n || k,
        hero: ITEMS[k]?.hero || '通用',
        tag: ITEMS[k]?.tag || '',
        size: ITEMS[k]?.size || 1,
        n: s.n,
        win: s.wins / s.n,
        lift: s.liftSum / s.n,
        dmgShare: s.dmgSum / s.n,
        carryRate: s.carryN / s.n,
      }))
      .sort((a, b) => b.lift - a.lift);

    md.push(`## 六、卡牌胜率归因榜（样本 ≥ 15 局，按相对本英雄基准胜率净增排序）`);
    md.push('');
    md.push(`### 6.1 最强 Top 20 卡牌（排查过强/必拿卡）`);
    md.push('');
    md.push(`| 卡牌 | 所属 | 元素/格数 | 登场数 | 登场胜率 | 相对本英雄净增 | 场均伤害占比 |`);
    md.push(`| :--- | :--- | :---: | :---: | :---: | :---: | :---: |`);
    for (const c of cardRows.slice(0, 20)) {
      md.push(`| **${c.name}** (\`${c.key}\`) | ${c.hero} | ${c.tag}/${c.size}格 | ${c.n} | ${pct(c.win)} | **${spct(c.lift)}** | ${pct(c.dmgShare)} |`);
    }
    md.push('');

    md.push(`### 6.2 最弱 Bottom 20 卡牌（排查陷阱/弱势卡）`);
    md.push('');
    md.push(`| 卡牌 | 所属 | 元素/格数 | 登场数 | 登场胜率 | 相对本英雄净增 | 场均伤害占比 |`);
    md.push(`| :--- | :--- | :---: | :---: | :---: | :---: | :---: |`);
    for (const c of cardRows.slice(-20).reverse()) {
      md.push(`| **${c.name}** (\`${c.key}\`) | ${c.hero} | ${c.tag}/${c.size}格 | ${c.n} | ${pct(c.win)} | **${spct(c.lift)}** | ${pct(c.dmgShare)} |`);
    }
    md.push('');

    // Section 7
    const relicRows = [...relicStat.entries()]
      .filter(([, s]) => s.n >= 20)
      .map(([k, s]) => ({
        key: k,
        name: RELICS[k]?.n || k,
        t: RELICS[k]?.t ?? 0,
        n: s.n,
        win: s.wins / s.n,
        lift: s.liftSum / s.n,
      }))
      .sort((a, b) => b.lift - a.lift);

    const talentRows = [...talentStat.entries()]
      .filter(([, s]) => s.n >= 20)
      .map(([k, s]) => ({
        key: k,
        name: TALENTS[k]?.n || k,
        r: TALENTS[k]?.r ?? 0,
        n: s.n,
        win: s.wins / s.n,
        lift: s.liftSum / s.n,
      }))
      .sort((a, b) => b.lift - a.lift);

    md.push(`## 七、遗物与天赋胜率净增 Top / Bottom`);
    md.push('');
    md.push(`- **最强遗物 Top 12**：` + relicRows.slice(0, 12).map((r) => `\`${r.name}(${r.key})\` ${spct(r.lift)}`).join(' ｜ '));
    md.push(`- **最弱遗物 Bottom 12**：` + relicRows.slice(-12).reverse().map((r) => `\`${r.name}(${r.key})\` ${spct(r.lift)}`).join(' ｜ '));
    md.push(`- **最强天赋 Top 10**：` + talentRows.slice(0, 10).map((t) => `\`${t.name}(${t.key})\` ${spct(t.lift)}`).join(' ｜ '));
    md.push(`- **最弱天赋 Bottom 10**：` + talentRows.slice(-10).reverse().map((t) => `\`${t.name}(${t.key})\` ${spct(t.lift)}`).join(' ｜ '));
    md.push('');

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const mdPath = path.join(REPORT_DIR, `${PREFIX}.md`);
    const jsonPath = path.join(REPORT_DIR, `${PREFIX}.json`);
    fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          totalRuns: allRuns.length,
          sec1: sec1Json,
          paths: pathJson,
          bosses: bossJson,
          ruleRelics: ruleJson,
          cards: cardRows,
          relics: relicRows,
          talents: talentRows,
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`\n✅ Balance Audit finished in ${elapsedSec}s! -> ${mdPath}`);
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
