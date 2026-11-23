/**
 * Job queue on Postgres (PA#3, criterion 2).
 *
 * Exactly-once rests on three things:
 * - `jobs.submission_id` is unique, so a submission is queued once;
 * - a claim is one statement that locks the next claimable row with
 *   `FOR UPDATE SKIP LOCKED` and gives it a lease, so two workers never hold
 *   the same job, and a job whose worker died is claimable again once the
 *   lease runs out;
 * - finishing is guarded by `claimed_by`, and verdicts are unique per
 *   `(submission_id, constraint_id)`, so a worker that lost its lease cannot
 *   write a second set of verdicts.
 *
 * @typedef {{ id: number, submissionId: number, attempts: number }} ClaimedJob
 *
 * @typedef {{
 *   constraintId: number,
 *   verdict: 'pass' | 'violation' | 'unsure',
 *   evidence: Array<{ line: number, text: string }>,
 *   decidedBy: 'hard_rule' | 'model' | 'fallback',
 *   unsureReason: string | null,
 * }} VerdictRow
 *
 * @typedef {{
 *   judgeVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE',
 *   testResults: unknown[],
 *   verdicts: VerdictRow[],
 * }} JudgeResult
 */

export const DEFAULT_LEASE_MS = 120_000;
export const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Queue a submission for judging. Idempotent per submission.
 *
 * @param {import('../repo/db.js').Queryable} db
 * @param {number} submissionId
 * @returns {Promise<{ id: number, created: boolean }>}
 */
export async function enqueueJob(db, submissionId) {
  const inserted = await db.query(
    `INSERT INTO jobs (submission_id) VALUES ($1)
     ON CONFLICT (submission_id) DO NOTHING
     RETURNING id`,
    [submissionId],
  );
  if (inserted.rows.length > 0) return { id: Number(inserted.rows[0].id), created: true };
  const existing = await db.query('SELECT id FROM jobs WHERE submission_id = $1', [submissionId]);
  return { id: Number(existing.rows[0].id), created: false };
}

/**
 * Claim the oldest queued job, or a claimed job whose lease has run out.
 * Returns null when there is nothing to do.
 *
 * @param {import('../repo/db.js').Queryable} db
 * @param {string} workerId
 * @param {{ leaseMs?: number, maxAttempts?: number }} [options]
 * @returns {Promise<ClaimedJob | null>}
 */
export async function claimJob(
  db,
  workerId,
  { leaseMs = DEFAULT_LEASE_MS, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {},
) {
  // A worker that died on its last attempt leaves an expired claim nobody may
  // retry: mark it failed so it does not sit in the queue forever.
  await db.query(
    `WITH dead AS (
       UPDATE jobs SET status = 'failed', claimed_by = NULL, lease_until = NULL,
              last_error = coalesce(last_error, 'lease expired on the last attempt'),
              updated_at = now()
       WHERE status = 'claimed' AND lease_until < now() AND attempts >= $1
       RETURNING submission_id
     )
     UPDATE submissions SET status = 'error' FROM dead WHERE submissions.id = dead.submission_id`,
    [maxAttempts],
  );

  const { rows } = await db.query(
    `WITH next AS (
       SELECT id FROM jobs
       WHERE (status = 'queued' OR (status = 'claimed' AND lease_until < now()))
         AND attempts < $3
       ORDER BY id
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     ),
     claimed AS (
       UPDATE jobs SET status = 'claimed', claimed_by = $1,
              lease_until = now() + $2::int * interval '1 millisecond',
              attempts = jobs.attempts + 1, updated_at = now()
       FROM next WHERE jobs.id = next.id
       RETURNING jobs.id, jobs.submission_id, jobs.attempts
     ),
     marked AS (
       UPDATE submissions SET status = 'judging'
       FROM claimed WHERE submissions.id = claimed.submission_id
       RETURNING submissions.id
     )
     SELECT id, submission_id, attempts FROM claimed`,
    [workerId, leaseMs, maxAttempts],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    submissionId: Number(row.submission_id),
    attempts: Number(row.attempts),
  };
}

/**
 * Push the lease forward while a long judgement runs. Returns false when the
 * worker no longer holds the job.
 *
 * @param {import('../repo/db.js').Queryable} db
 * @param {ClaimedJob} job
 * @param {string} workerId
 * @param {number} leaseMs
 * @returns {Promise<boolean>}
 */
export async function extendLease(db, job, workerId, leaseMs) {
  const { rows } = await db.query(
    `UPDATE jobs SET lease_until = now() + $3::int * interval '1 millisecond', updated_at = now()
     WHERE id = $1 AND claimed_by = $2 AND status = 'claimed'
     RETURNING id`,
    [job.id, workerId, leaseMs],
  );
  return rows.length > 0;
}

/**
 * Store the judgement and mark the job done, in one transaction. Refused
 * (returns false, writes nothing) when another worker has taken the job.
 *
 * @param {import('../repo/db.js').Db} db
 * @param {ClaimedJob} job
 * @param {string} workerId
 * @param {JudgeResult} result
 * @returns {Promise<boolean>}
 */
export async function completeJob(db, job, workerId, result) {
  return db.transaction(async (tx) => {
    const owned = await tx.query(
      `UPDATE jobs SET status = 'done', lease_until = NULL, updated_at = now()
       WHERE id = $1 AND claimed_by = $2 AND status = 'claimed'
       RETURNING id`,
      [job.id, workerId],
    );
    if (owned.rows.length === 0) return false;

    for (const verdict of result.verdicts) {
      await tx.query(
        `INSERT INTO verdicts
           (submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (submission_id, constraint_id) DO NOTHING`,
        [
          job.submissionId,
          verdict.constraintId,
          verdict.verdict,
          JSON.stringify(verdict.evidence),
          verdict.decidedBy,
          verdict.unsureReason,
        ],
      );
    }
    await tx.query(
      `UPDATE submissions SET status = 'judged', judge_verdict = $2, test_results_json = $3
       WHERE id = $1`,
      [job.submissionId, result.judgeVerdict, JSON.stringify(result.testResults)],
    );
    return true;
  });
}

/**
 * Give the job back after a failed judgement: queued again, or failed once it
 * has used its attempts. Returns the new status, or null if the worker no
 * longer held the job.
 *
 * @param {import('../repo/db.js').Db} db
 * @param {ClaimedJob} job
 * @param {string} workerId
 * @param {string} error
 * @param {{ maxAttempts?: number }} [options]
 * @returns {Promise<'queued' | 'failed' | null>}
 */
export async function releaseJob(
  db,
  job,
  workerId,
  error,
  { maxAttempts = DEFAULT_MAX_ATTEMPTS } = {},
) {
  return db.transaction(async (tx) => {
    const { rows } = await tx.query(
      `UPDATE jobs SET status = CASE WHEN attempts >= $3 THEN 'failed' ELSE 'queued' END,
              claimed_by = NULL, lease_until = NULL, last_error = $4, updated_at = now()
       WHERE id = $1 AND claimed_by = $2 AND status = 'claimed'
       RETURNING status`,
      [job.id, workerId, maxAttempts, error.slice(0, 2000)],
    );
    const status = rows[0]?.status;
    if (!status) return null;
    await tx.query(`UPDATE submissions SET status = $2 WHERE id = $1`, [
      job.submissionId,
      status === 'failed' ? 'error' : 'queued',
    ]);
    return status;
  });
}
