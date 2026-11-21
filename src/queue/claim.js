/**
 * Job claim/lease helpers for the submission queue (PA#3, criterion 2).
 *
 * Exactly-once is enforced by a unique `submission_id` plus a transactional
 * claim (`UPDATE ... WHERE status = 'queued' ... RETURNING`) and a unique
 * `(submission_id, constraint_id)` on verdicts.
 */

/**
 * Claim the next queued job. Not implemented yet.
 *
 * @param {unknown} _repo
 * @param {string} _workerId
 * @returns {Promise<{ id: number, submissionId: number } | null>}
 */
export async function claimJob(_repo, _workerId) {
  void _repo;
  void _workerId;
  throw new Error('claimJob: not implemented');
}
