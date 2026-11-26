import { createHardRules } from '../src/checker/hard-rules/index.js';
import { createJudge } from '../src/judge/pipeline.js';
import { createCallRecorder } from '../src/judge/recorder.js';
import { runWorker } from '../src/queue/worker.js';
import { createPostgresDb } from '../src/repo/postgres.js';

// The worker runs on its own machine (the worker VM), apart from the web app.
// It holds the model key; the sandbox it starts never receives it.
const databaseUrl = process.env.DATABASE_URL ?? '';
if (databaseUrl === '') {
  console.error('worker: DATABASE_URL is not set');
  process.exit(1);
}

const apiKey = process.env.MODEL_API_KEY ?? process.env.GEMINI_API_KEY ?? '';
if (apiKey === '') {
  console.warn('worker: no MODEL_API_KEY; semantic constraints will be unsure');
}

const db = createPostgresDb(databaseUrl);
const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => controller.abort());
}

const judge = createJudge({
  db,
  rules: await createHardRules(),
  apiKey,
  model: process.env.MODEL_NAME ?? 'gemini-2.5-flash',
  timeoutMs: Number(process.env.MODEL_TIMEOUT_MS ?? 20_000),
  recorder: createCallRecorder({ db, filePath: process.env.MODEL_CALL_LOG || null }),
});

runWorker({
  db,
  judge,
  workerId: process.env.WORKER_ID ?? 'worker-1',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 1000),
  maxIdleDelayMs: Number(process.env.WORKER_MAX_IDLE_MS ?? 30_000),
  signal: controller.signal,
})
  .then(() => db.close())
  .catch((error) => {
    console.error('worker failed:', error);
    process.exit(1);
  });
