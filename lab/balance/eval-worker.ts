import { parentPort } from 'worker_threads';
import {
  playFullRun,
  evaluateFixedNight,
  type RunOpts,
  type RunResult,
  type FixedNightOpts,
  type FixedNightResult,
} from './bots';

export type WorkerJob =
  | {
      jobId: number;
      kind: 'run_batch';
      tasks: Array<{ key: string; opts: RunOpts }>;
    }
  | {
      jobId: number;
      kind: 'fixed_batch';
      tasks: Array<{ key: string; opts: FixedNightOpts }>;
    };

export type WorkerResult =
  | {
      jobId: number;
      kind: 'run_batch';
      results: Array<{ key: string; result: RunResult }>;
    }
  | {
      jobId: number;
      kind: 'fixed_batch';
      results: Array<{ key: string; result: FixedNightResult }>;
    };

export function executeJobSync(job: WorkerJob): WorkerResult {
  if (job.kind === 'run_batch') {
    const results = job.tasks.map((t) => ({
      key: t.key,
      result: playFullRun(t.opts),
    }));
    return { jobId: job.jobId, kind: 'run_batch', results };
  }

  const results = job.tasks.map((t) => ({
    key: t.key,
    result: evaluateFixedNight(t.opts),
  }));
  return { jobId: job.jobId, kind: 'fixed_batch', results };
}

if (parentPort) {
  parentPort.on('message', (job: WorkerJob) => {
    const out = executeJobSync(job);
    parentPort!.postMessage(out);
  });
}
