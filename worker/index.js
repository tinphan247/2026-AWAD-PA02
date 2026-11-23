import { runWorker } from '../src/queue/worker.js';
import { createPostgresDb } from '../src/repo/postgres.js';

// The worker runs on its own machine (Oracle VM), apart from the web app. It
// holds the model key; the sandbox it starts never receives it.
const db = createPostgresDb(process.env.DATABASE_URL ?? '');
const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => controller.abort());
}

/** @type {import('../src/queue/worker.js').Judge} */
const judge = async () => {
  // Sandbox, hard rules and model are wired in by their own commits.
  throw new Error('judge pipeline not wired yet');
};

runWorker({
  db,
  judge,
  workerId: process.env.WORKER_ID ?? 'worker-1',
  pollIntervalMs: Number(process.env.WORKER_POLL_MS ?? 1000),
  maxIdleDelayMs: Number(process.env.WORKER_MAX_IDLE_MS ?? 30_000),
  signal: controller.signal,
})
  .then(() => db.close())
  .catch((error) => {
    console.error('worker failed:', error);
    process.exit(1);
  });
