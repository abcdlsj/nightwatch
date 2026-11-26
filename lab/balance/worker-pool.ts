import os from 'os';
import { Worker } from 'worker_threads';
import { executeJobSync, type WorkerJob, type WorkerResult } from './eval-worker';

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type WorkerJobInput = DistributiveOmit<WorkerJob, 'jobId'>;

/**
 * Lightweight multi-core worker pool built on standard `worker_threads`.
 * Each worker runs an isolated instance of the REAL `src/sim/` + `src/game/` TS engine.
 */
export class EvalWorkerPool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{
    job: WorkerJob;
    resolve: (res: WorkerResult) => void;
    reject: (err: unknown) => void;
  }> = [];
  private inflight = new Map<
    number,
    { resolve: (res: WorkerResult) => void; reject: (err: unknown) => void }
  >();
  private nextJobId = 1;
  readonly concurrency: number;

  constructor(concurrency?: number) {
    const cpuCount = os.cpus().length;
    const envWorkers = process.env.WORKERS ? Number(process.env.WORKERS) : undefined;
    this.concurrency = Math.max(
      1,
      Math.min(16, concurrency ?? envWorkers ?? Math.max(1, cpuCount - 1))
    );

    if (this.concurrency > 1) {
      const workerUrl = new URL('./eval-worker.ts', import.meta.url);
      for (let i = 0; i < this.concurrency; i++) {
        const w = new Worker(workerUrl);
        w.on('message', (msg: WorkerResult) => {
          const pending = this.inflight.get(msg.jobId);
          if (pending) {
            this.inflight.delete(msg.jobId);
            pending.resolve(msg);
          }
          this.idle.push(w);
          this.pump();
        });
        w.on('error', (err) => {
          for (const [, p] of this.inflight) p.reject(err);
          this.inflight.clear();
        });
        this.workers.push(w);
        this.idle.push(w);
      }
    }
  }

  private pump(): void {
    while (this.idle.length > 0 && this.queue.length > 0) {
      const w = this.idle.pop()!;
      const item = this.queue.shift()!;
      this.inflight.set(item.job.jobId, { resolve: item.resolve, reject: item.reject });
      w.postMessage(item.job);
    }
  }

  submit<T extends WorkerResult>(jobWithoutId: WorkerJobInput): Promise<T> {
    const job = { ...jobWithoutId, jobId: this.nextJobId++ } as WorkerJob;
    if (this.concurrency <= 1) {
      return Promise.resolve(executeJobSync(job) as T);
    }
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        job,
        resolve: resolve as (res: WorkerResult) => void,
        reject,
      });
      this.pump();
    });
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.idle = [];
  }
}

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const out: T[][] = [];
  const size = Math.max(1, chunkSize);
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
