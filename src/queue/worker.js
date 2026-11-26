/**
 * Worker loop (PA#3, criterion 2): claim one job at a time, hand the
 * submission to the judge (sandbox, then hard rules, then the model), and
 * store the result exactly once. The judge is injected so the queue can be
 * tested without Docker or a model.
 */

import {
  DEFAULT_LEASE_MS,
  DEFAULT_MAX_ATTEMPTS,
  claimJob,
  completeJob,
  extendLease,
  releaseJob,
} from './claim.js';

/**
 * @typedef {{
 *   id: number,
 *   labId: number,
 *   sourceCode: string,
 *   constraints: Array<{ id: number, text: string, kind: string, deduction: number }>,
 *   identities?: string[],
 *   studentName?: string,
 *   studentId?: number | string,
 * }} SubmissionToJudge
 *
 * @typedef {(submission: SubmissionToJudge) => Promise<import('./claim.js').JudgeResult>} Judge
 *
 * @typedef {{
 *   db: import('../repo/db.js').Db,
 *   workerId: string,
 *   judge: Judge,
 *   leaseMs?: number,
 *   maxAttempts?: number,
 * }} WorkerOptions
 */

/**
 * Claim and judge at most one job.
 *
 * - `idle`: nothing to claim;
 * - `done`: judged and stored;
 * - `lost`: judged, but another worker had taken the job, so nothing stored;
 * - `retry`: the judge failed, the job is queued again;
 * - `failed`: the judge failed on the last attempt.
 *
 * @param {WorkerOptions} options
 * @returns {Promise<'idle' | 'done' | 'lost' | 'retry' | 'failed'>}
 */
export async function processNextJob({
  db,
  workerId,
  judge,
  leaseMs = DEFAULT_LEASE_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}) {
  const job = await claimJob(db, workerId, { leaseMs, maxAttempts });
  if (!job) return 'idle';

  // Keep the lease while the judge runs (compile, tests and model calls can
  // outlast one lease).
  const heartbeat = setInterval(
    () => {
      extendLease(db, job, workerId, leaseMs).catch(() => {});
    },
    Math.max(10, Math.floor(leaseMs / 3)),
  );

  try {
    const submission = await loadSubmission(db, job.submissionId);
    const result = await judge(submission);
    clearInterval(heartbeat);
    return (await completeJob(db, job, workerId, result)) ? 'done' : 'lost';
  } catch (error) {
    clearInterval(heartbeat);
    const message = error instanceof Error ? error.message : String(error);
    const status = await releaseJob(db, job, workerId, message, { maxAttempts });
    if (status === 'failed') return 'failed';
    return status === 'queued' ? 'retry' : 'lost';
  }
}

/**
 * Poll until `signal` aborts. After each empty poll the wait doubles, up to
 * `maxIdleDelayMs`, so an idle worker stops querying the database every
 * second (Neon's free plan only scales to zero after 5 idle minutes).
 *
 * @param {WorkerOptions & {
 *   pollIntervalMs?: number,
 *   maxIdleDelayMs?: number,
 *   signal?: AbortSignal,
 *   log?: Pick<Console, 'error'>,
 * }} options
 * @returns {Promise<void>}
 */
export async function runWorker({
  pollIntervalMs = 1000,
  maxIdleDelayMs = 30_000,
  signal,
  log = console,
  ...options
}) {
  let idlePolls = 0;
  while (!signal?.aborted) {
    let outcome;
    try {
      outcome = await processNextJob(options);
    } catch (error) {
      // Database unreachable (e.g. a cold start): back off and try again.
      log.error(`worker ${options.workerId}: poll failed:`, error);
      outcome = 'idle';
    }
    if (outcome !== 'idle') {
      idlePolls = 0;
      continue;
    }
    await wait(idleDelay(idlePolls, { pollIntervalMs, maxIdleDelayMs }), signal);
    idlePolls += 1;
  }
}

/**
 * @param {number} idlePolls empty polls in a row so far
 * @param {{ pollIntervalMs: number, maxIdleDelayMs: number }} options
 * @returns {number}
 */
export function idleDelay(idlePolls, { pollIntervalMs, maxIdleDelayMs }) {
  return Math.min(maxIdleDelayMs, pollIntervalMs * 2 ** Math.min(idlePolls, 30));
}

/**
 * @param {import('../repo/db.js').Queryable} db
 * @param {number} submissionId
 * @returns {Promise<SubmissionToJudge>}
 */
async function loadSubmission(db, submissionId) {
  const { rows } = await db.query('SELECT id, lab_id, source_code FROM submissions WHERE id = $1', [
    submissionId,
  ]);
  const row = rows[0];
  if (!row) throw new Error(`submission ${submissionId} not found`);
  const constraints = await db.query(
    `SELECT id, text, kind, deduction FROM constraints WHERE lab_id = $1 ORDER BY position`,
    [row.lab_id],
  );
  return {
    id: Number(row.id),
    labId: Number(row.lab_id),
    sourceCode: row.source_code,
    constraints: constraints.rows.map((c) => ({
      id: Number(c.id),
      text: c.text,
      kind: c.kind,
      deduction: Number(c.deduction),
    })),
  };
}

/**
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function wait(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', done, { once: true });
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
  });
}
