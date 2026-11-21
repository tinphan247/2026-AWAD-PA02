/**
 * TA review queue for LeeTKOB (PA#3).
 *
 * A review queue holds, for one lab: every `violation`, every `unsure`, and a
 * random 10% of the `pass` verdicts (rounded up). Verdicts never reach the
 * student without the TA (FAQ-08, FAQ-09, FAQ-10).
 */

/**
 * @typedef {'pass' | 'violation' | 'unsure'} VerdictValue
 *
 * @typedef {{
 *   id: number,
 *   submissionId: number,
 *   constraintId: number,
 *   verdict: VerdictValue,
 *   evidence: { line: number, text: string }[],
 *   decidedBy: 'hard_rule' | 'model' | 'fallback',
 *   unsureReason: string | null,
 *   reviewed: boolean,
 *   taDecision: 'pass' | 'violation' | null,
 * }} ReviewItem
 */

/**
 * List the review queue for a lab. Not implemented yet.
 *
 * @param {number} _labId
 * @param {number} _taUserId
 * @returns {Promise<ReviewItem[]>}
 */
export async function listReviewQueue(_labId, _taUserId) {
  void _labId;
  void _taUserId;
  throw new Error('listReviewQueue: not implemented');
}

/**
 * Record the TA's decision on a verdict. `violation` requires at least one
 * evidence line (FAQ-09).
 *
 * @param {number} _verdictId
 * @param {'pass' | 'violation'} _decision
 * @param {{ line: number, text: string }[]} [_evidence]
 * @returns {Promise<void>}
 */
export async function reviewVerdict(_verdictId, _decision, _evidence) {
  void _verdictId;
  void _decision;
  void _evidence;
  throw new Error('reviewVerdict: not implemented');
}
