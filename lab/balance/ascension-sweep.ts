/**
 * Nightwatch Long Night Difficulty Curve Sweep (Heat 0..8 × 4 Personas × 5 Heroes)
 *
 * Calibrates the StS-inspired auto-battler ascension curve:
 *   - Heat 0: Novice ~15-35%, Reader ~65-85%, Skilled ~90-98%, Master ~95-100%
 *   - Heat 4: Reader ~20-40%, Skilled ~60-78%, Master ~80-92%
 *   - Heat 8: Reader <5%,     Skilled ~10-28%, Master ~35-55%
 *
 * Usage:
 *   SWEEP_RUNS=60 bun lab/balance/ascension-sweep.ts
 */
import fs from 'fs';
import path from 'path';
import { initHeadless, type Persona, type RunOpts, type RunResult } from './bots';
import { chunkArray, EvalWorkerPool } from './worker-pool';
import type { WorkerResult } from './eval-worker';
import { HEROES, HERO_ORDER } from '../../src/data/heroes';
import { HEAT_MAX } from '../../src/data/meta';
import { L } from '../../src/i18n';

initHeadless();

const SWEEP_RUNS = Number(process.env.SWEEP_RUNS ?? 50);
const REPORT_DIR = path.resolve(import.meta.dirname, 'reports');
const PREFIX = process.env.REPORT_PREFIX ?? 'ascension-sweep';
const HEATS = Array.from({ length: HEAT_MAX + 1 }, (_, i) => i);
const PERSONAS: Persona[] = ['novice_random', 'reader_basic', 'skilled_builder', 'master_optimizer'];
const PERSONA_NAMES: Record<Persona, string> = {
  novice_random: '乱点新手 (Novice)',
  reader_basic: '读文案新手 (Reader)',
  skilled_builder: '构筑熟手 (Skilled)',
  master_optimizer: '机制大师 (Master)',
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

async function main() {
  const t0 = performance.now();
  const pool = new EvalWorkerPool();
  const heroes = HERO_ORDER.filter((h) => HEROES[h]);

  console.log(
    `=== Nightwatch Heat 0..${HEAT_MAX} Difficulty Curve Sweep (${PERSONAS.length} personas × ${heroes.length} heroes × ${SWEEP_RUNS} runs/cell, workers=${pool.concurrency}) ===\n`
  );

  try {
    const tasks: Array<{ key: string; opts: RunOpts }> = [];
    for (const p of PERSONAS) {
      for (const h of heroes) {
        for (const heatLv of HEATS) {
          for (let i = 0; i < SWEEP_RUNS; i++) {
            tasks.push({
              key: `${p}|${h}|${heatLv}`,
              opts: {
                hero: h,
                persona: p,
                seed: 90000 + heatLv * 10000 + i * 79 + h.charCodeAt(0) * 17,
                heat: heatLv,
                full: false,
                mastLv: 0,
                unlockAll: true,
              },
            });
          }
        }
      }
    }

    // Also test Full 15-Night at Heat 0, 4, 8 for Skilled & Master
    const fullRuns = Math.max(2, Math.floor(SWEEP_RUNS * 0.4));
    for (const p of ['skilled_builder', 'master_optimizer'] as Persona[]) {
      for (const h of heroes) {
        for (const heatLv of [0, 4, 8]) {
          for (let i = 0; i < fullRuns; i++) {
            tasks.push({
              key: `full|${p}|${h}|${heatLv}`,
              opts: {
                hero: h,
                persona: p,
                seed: 200000 + heatLv * 10000 + i * 83 + h.charCodeAt(0) * 23,
                heat: heatLv,
                full: true,
                mastLv: 0,
                unlockAll: true,
              },
            });
          }
        }
      }
    }

    const chunks = chunkArray(tasks, Math.max(8, Math.ceil(tasks.length / (pool.concurrency * 6))));
    const res = await Promise.all(
      chunks.map((c) => pool.submit<Extract<WorkerResult, { kind: 'run_batch' }>>({ kind: 'run_batch', tasks: c }))
    );

    const grouped = new Map<string, RunResult[]>();
    for (const cr of res) {
      for (const item of cr.results) {
        let arr = grouped.get(item.key);
        if (!arr) {
          arr = [];
          grouped.set(item.key, arr);
        }
        arr.push(item.result);
      }
    }

    const winRate = (key: string) => {
      const arr = grouped.get(key) || [];
      return arr.filter((r) => r.win).length / Math.max(1, arr.length);
    };

    const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1);
    const md: string[] = [];
    md.push(`# Nightwatch 长夜进阶难度曲线测算报告（Heat 0 → Heat ${HEAT_MAX}）`);
    md.push('');
    md.push(`> 生成时间：\`${new Date().toISOString()}\` | 样本量：\`${SWEEP_RUNS}\` 局/档/英雄/水平（总计 \`${tasks.length.toLocaleString()}\` 局） | 耗时：\`${elapsedSec}s\``);
    md.push('');

    md.push(`## 一、长夜难度规则定义（累计叠加）`);
    md.push('');
    md.push(`| 档位 | 新增压迫规则 |`);
    md.push(`| :---: | :--- |`);
    const heatDescs = L.meta.heats as string[];
    for (const lv of HEATS) {
      md.push(`| **Heat ${lv}** | ${heatDescs[lv] || ''} |`);
    }
    md.push('');

    md.push(`## 二、4 档玩家水平 × Heat 0–8 总体通关率曲线（5 英雄均值，普通 9 夜）`);
    md.push('');
    md.push(`| 玩家水平 | ${HEATS.map((h) => `H${h}`).join(' | ')} |`);
    md.push(`| :--- | ${HEATS.map(() => ':---:').join(' | ')} |`);
    const summaryJson: Record<string, Record<number, number>> = {};
    for (const p of PERSONAS) {
      summaryJson[p] = {};
      const cells: string[] = [];
      for (const lv of HEATS) {
        const all = heroes.flatMap((h) => grouped.get(`${p}|${h}|${lv}`) || []);
        const w = all.filter((r) => r.win).length / Math.max(1, all.length);
        summaryJson[p][lv] = w;
        cells.push(lv === 0 || lv === 4 || lv === 8 ? `**${pct(w)}**` : pct(w));
      }
      console.log(`  ${PERSONA_NAMES[p].padEnd(26)} ${HEATS.map((lv) => `H${lv}:${pct(summaryJson[p][lv]).padStart(5)}`).join(' ')}`);
      md.push(`| **${PERSONA_NAMES[p]}** | ${cells.join(' | ')} |`);
    }
    md.push('');

    md.push(`## 三、分英雄 Heat 0–8 曲线（读文案新手 vs 构筑熟手 vs 机制大师）`);
    md.push('');
    const heroJson: Record<string, any> = {};
    for (const p of ['reader_basic', 'skilled_builder', 'master_optimizer'] as Persona[]) {
      md.push(`### ${PERSONA_NAMES[p]}`);
      md.push('');
      md.push(`| 守夜人 | ${HEATS.map((h) => `H${h}`).join(' | ')} |`);
      md.push(`| :--- | ${HEATS.map(() => ':---:').join(' | ')} |`);
      heroJson[p] = {};
      for (const h of heroes) {
        heroJson[p][h] = {};
        const cells = HEATS.map((lv) => {
          const w = winRate(`${p}|${h}|${lv}`);
          heroJson[p][h][lv] = w;
          return pct(w);
        });
        md.push(`| **${HEROES[h].n}** (\`${h}\`) | ${cells.join(' | ')} |`);
      }
      md.push('');
    }

    md.push(`## 四、完整 15 夜（隐藏首领）Heat 0 / 4 / 8 通关率`);
    md.push('');
    md.push(`| 玩家水平 | 守夜人 | Heat 0 | Heat 4 | Heat 8 |`);
    md.push(`| :--- | :--- | :---: | :---: | :---: |`);
    for (const p of ['skilled_builder', 'master_optimizer'] as Persona[]) {
      for (const h of heroes) {
        md.push(
          `| ${PERSONA_NAMES[p]} | **${HEROES[h].n}** | ${pct(winRate(`full|${p}|${h}|0`))} | ${pct(winRate(`full|${p}|${h}|4`))} | **${pct(winRate(`full|${p}|${h}|8`))}** |`
        );
      }
    }
    md.push('');

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const mdPath = path.join(REPORT_DIR, `${PREFIX}.md`);
    const jsonPath = path.join(REPORT_DIR, `${PREFIX}.json`);
    fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
    fs.writeFileSync(
      jsonPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), SWEEP_RUNS, summary: summaryJson, byHero: heroJson }, null, 2),
      'utf8'
    );
    console.log(`\n✅ Ascension Sweep finished in ${elapsedSec}s! -> ${mdPath}`);
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
