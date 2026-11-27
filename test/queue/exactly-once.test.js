import test from 'node:test';
import assert from 'node:assert/strict';

import { claimJob, completeJob, enqueueJob } from '../../src/queue/claim.js';
import { idleDelay, processNextJob, runWorker } from '../../src/queue/worker.js';
import { migrate } from '../../src/repo/migrate.js';
import {
  countingJudge,
  createTestDb,
  insertSubmission,
  seedLab,
  sleep,
  verdictCount,
} from './helpers.js';

/** @param {import('../../src/repo/db.js').Db} db @param {number} id */
async function jobOf(db, id) {
  const { rows } = await db.query(
    `SELECT status, attempts, claimed_by FROM jobs WHERE submission_id = $1`,
    [id],
  );
  return rows;
}

/** @param {import('../../src/repo/db.js').Db} db @param {number} id */
async function submissionStatus(db, id) {
  const { rows } = await db.query(`SELECT status, judge_verdict FROM submissions WHERE id = $1`, [
    id,
  ]);
  return rows[0];
}

test('queue: a submission made while the worker is stopped is judged exactly once after it starts', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { judge, calls } = countingJudge(ids.constraints);

  // Worker stopped: the student submits, the job waits in the queue.
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);
  assert.deepEqual(await jobOf(db, submissionId), [
    { status: 'queued', attempts: 0, claimed_by: null },
  ]);
  assert.equal(await verdictCount(db, submissionId), 0);

  // Worker starts and judges it.
  assert.equal(await processNextJob({ db, workerId: 'w1', judge }), 'done');
  assert.equal(await verdictCount(db, submissionId), 2);
  assert.deepEqual(await submissionStatus(db, submissionId), {
    status: 'judged',
    judge_verdict: 'AC',
  });

  // Worker restarts: nothing left to do, no second set of verdicts.
  assert.equal(await processNextJob({ db, workerId: 'w1-restarted', judge }), 'idle');
  assert.equal(await verdictCount(db, submissionId), 2);
  assert.deepEqual(calls, [submissionId]);
  await db.close();
});

test('queue: enqueueing the same submission twice keeps one job', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const submissionId = await insertSubmission(db, ids);

  const first = await enqueueJob(db, submissionId);
  const second = await enqueueJob(db, submissionId);

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.id, first.id);
  assert.equal((await jobOf(db, submissionId)).length, 1);
  await db.close();
});

test('queue: two workers polling at the same time never claim the same job', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);

  const claims = await Promise.all([claimJob(db, 'w1'), claimJob(db, 'w2')]);

  assert.equal(claims.filter((job) => job !== null).length, 1);
  await db.close();
});

test('queue: a worker that dies mid-judgement loses its lease and the job is judged once by another', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { judge, calls } = countingJudge(ids.constraints);
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);

  // Worker A claims, then dies before writing verdicts.
  const claimedByA = await claimJob(db, 'wA', { leaseMs: 50 });
  assert.ok(claimedByA);

  // While A's lease is valid, B must not take the job.
  assert.equal(await processNextJob({ db, workerId: 'wB', judge, leaseMs: 50 }), 'idle');

  // After the lease expires, B judges it.
  await sleep(120);
  assert.equal(await processNextJob({ db, workerId: 'wB', judge, leaseMs: 50 }), 'done');
  assert.equal(await verdictCount(db, submissionId), 2);

  // A comes back late and tries to finish: refused, still one set of verdicts.
  const late = await completeJob(db, claimedByA, 'wA', {
    judgeVerdict: 'WA',
    testResults: [],
    verdicts: ids.constraints.map((constraintId) => ({
      constraintId,
      verdict: 'violation',
      evidence: [{ line: 1, text: 'int main() { return 0; }' }],
      decidedBy: 'hard_rule',
      unsureReason: null,
    })),
  });
  assert.equal(late, false);
  assert.equal(await verdictCount(db, submissionId), 2);
  assert.deepEqual(await submissionStatus(db, submissionId), {
    status: 'judged',
    judge_verdict: 'AC',
  });
  assert.deepEqual(calls, [submissionId]);
  await db.close();
});

test('queue: a judgement that keeps failing stops at the attempt limit instead of looping', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);
  /** @type {import('../../src/queue/worker.js').Judge} */
  const failingJudge = async () => {
    throw new Error('sandbox unavailable');
  };

  const options = { db, workerId: 'w1', judge: failingJudge, maxAttempts: 2 };
  assert.equal(await processNextJob(options), 'retry');
  assert.equal(await processNextJob(options), 'failed');
  assert.equal(await processNextJob(options), 'idle');

  assert.equal((await jobOf(db, submissionId))[0]?.status, 'failed');
  assert.equal((await submissionStatus(db, submissionId)).status, 'error');
  assert.equal(await verdictCount(db, submissionId), 0);
  await db.close();
});

test('queue: the worker loop drains the queue and stops when asked', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { judge, calls } = countingJudge(ids.constraints);
  const first = await insertSubmission(db, ids);
  const second = await insertSubmission(db, ids);
  await enqueueJob(db, first);
  await enqueueJob(db, second);

  const controller = new AbortController();
  const loop = runWorker({
    db,
    workerId: 'w1',
    judge,
    pollIntervalMs: 5,
    signal: controller.signal,
  });
  for (let i = 0; i < 100 && calls.length < 2; i += 1) await sleep(10);
  controller.abort();
  await loop;

  assert.deepEqual(calls, [first, second]);
  assert.equal(await verdictCount(db, first), 2);
  assert.equal(await verdictCount(db, second), 2);
  await db.close();
});

test('queue: an idle worker polls less often, up to a cap, so the database can sleep', () => {
  assert.equal(idleDelay(0, { pollIntervalMs: 1000, maxIdleDelayMs: 600_000 }), 1000);
  assert.equal(idleDelay(1, { pollIntervalMs: 1000, maxIdleDelayMs: 600_000 }), 2000);
  assert.equal(idleDelay(3, { pollIntervalMs: 1000, maxIdleDelayMs: 600_000 }), 8000);
  assert.equal(idleDelay(50, { pollIntervalMs: 1000, maxIdleDelayMs: 600_000 }), 600_000);
});

test('queue: a long judgement keeps its lease, so no second worker judges it meanwhile', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);
  const { judge: fastJudge, calls } = countingJudge(ids.constraints);
  /** @type {import('../../src/queue/worker.js').Judge} */
  const slowJudge = async (submission) => {
    await sleep(250); // five times the lease
    return fastJudge(submission);
  };

  const slow = processNextJob({ db, workerId: 'w1', judge: slowJudge, leaseMs: 50 });
  await sleep(150);
  const meanwhile = await processNextJob({ db, workerId: 'w2', judge: fastJudge, leaseMs: 50 });

  assert.equal(meanwhile, 'idle');
  assert.equal(await slow, 'done');
  assert.deepEqual(calls, [submissionId]);
  assert.equal(await verdictCount(db, submissionId), 2);
  await db.close();
});

test('queue: a worker that dies on the last attempt leaves a failed job, not a stuck one', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { judge, calls } = countingJudge(ids.constraints);
  const submissionId = await insertSubmission(db, ids);
  await enqueueJob(db, submissionId);

  assert.ok(await claimJob(db, 'wA', { leaseMs: 30, maxAttempts: 1 }));
  await sleep(80);

  assert.equal(await processNextJob({ db, workerId: 'wB', judge, maxAttempts: 1 }), 'idle');
  assert.equal((await jobOf(db, submissionId))[0]?.status, 'failed');
  assert.equal((await submissionStatus(db, submissionId)).status, 'error');
  assert.deepEqual(calls, []);
  await db.close();
});

test('queue: migrations apply once and are recorded', async () => {
  const db = await createTestDb();
  assert.deepEqual(await migrate(db), []);
  const { rows } = await db.query('SELECT name FROM schema_migrations ORDER BY name');
  assert.deepEqual(
    rows.map((row) => row.name),
    ['001_init.sql', '002_compile_error_reason.sql'],
  );
  await db.close();
});
