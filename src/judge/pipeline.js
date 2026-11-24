/**
 * The judge a worker runs for one submission (PA#3, criteria 2, 3 and 4).
 *
 * The queue hands over `{ id, labId, sourceCode, constraints }`; the lab row
 * supplies the statement, the tests and the cost cap. The order is the one
 * `src/queue/worker.js` documents:
 *
 *   1. sandbox  — compile and run every test, never on the host;
 *   2. hard rules — a ban list is decided by tree-sitter and never reaches
 *      the model (criterion 3);
 *   3. model    — every semantic constraint, one call per pair, with the code
 *      anonymised and the evidence checked against the original lines
 *      (criterion 4).
 *
 * Nothing here changes a mark: a pair the model cannot decide is `unsure` with
 * a reason, and a TA decides (FAQ-08, FAQ-09).
 */

import { parseBanList } from '../checker/hard-rules/ban-list.js';
import { judgeConstraint } from '../model/judge.js';
import { runInSandbox } from '../sandbox/run.js';

/**
 * @typedef {import('../queue/worker.js').SubmissionToJudge} SubmissionToJudge
 * @typedef {import('../queue/claim.js').JudgeResult} JudgeResult
 * @typedef {import('../queue/claim.js').VerdictRow} VerdictRow
 */

/**
 * One constraint's outcome, whatever decided it. Both `HardRuleResult` and the
 * model's `JudgeResult` fit this shape.
 *
 * @typedef {{
 *   verdict: 'pass' | 'violation' | 'unsure',
 *   evidence: Array<{ line: number, text: string }>,
 *   decidedBy: 'hard_rule' | 'model' | 'fallback',
 *   unsureReason: string | null,
 * }} ConstraintVerdict
 */

/**
 * The values `verdicts.unsure_reason` accepts (`db/migrations/001_init.sql`).
 * A reason outside this set would abort the transaction that stores the job,
 * so an unexpected one is stored as `model_unsure` instead of losing the whole
 * submission and re-billing the model on the retry.
 *
 * @type {ReadonlySet<string>}
 */
const STORABLE_UNSURE_REASONS = new Set([
  'model_unsure',
  'schema_invalid',
  'evidence_mismatch',
  'timeout',
  'cost_cap',
  'hard_rule_unsure',
]);

/**
 * Turn a decision into the row `completeJob()` inserts.
 *
 * @param {number} constraintId
 * @param {ConstraintVerdict} result
 * @returns {VerdictRow}
 */
function toRow(constraintId, result) {
  const reason = result.unsureReason;
  return {
    constraintId,
    verdict: result.verdict,
    evidence: result.evidence,
    decidedBy: result.decidedBy,
    unsureReason: reason === null || STORABLE_UNSURE_REASONS.has(reason) ? reason : 'model_unsure',
  };
}

/**
 * The statement, tests and cost cap the judge needs; the queue's
 * `loadSubmission()` deliberately returns none of them.
 *
 * @param {import('../repo/db.js').Db} db
 * @param {number} labId
 * @returns {Promise<{
 *   statement: string,
 *   tests: Array<{ name: string, input: string, output: string }>,
 *   costCapUsd: number,
 * }>}
 */
async function loadLab(db, labId) {
  const { rows } = await db.query(
    'SELECT statement, tests_json, cost_cap_usd FROM labs WHERE id = $1',
    [labId],
  );
  const row = rows[0];
  if (!row) throw new Error(`lab ${labId} not found`);
  return {
    statement: String(row.statement),
    tests: /** @type {Array<{ name: string, input: string, output: string }>} */ (
      row.tests_json ?? []
    ),
    // numeric arrives as a string from pg.
    costCapUsd: Number(row.cost_cap_usd),
  };
}

/**
 * What the lab has spent on model calls so far, across all its submissions.
 *
 * @param {import('../repo/db.js').Db} db
 * @param {number} labId
 * @returns {Promise<number>}
 */
async function labSpentUsd(db, labId) {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(calls.cost_usd), 0)::float8 AS spent
       FROM model_calls calls
       JOIN submissions submissions ON submissions.id = calls.submission_id
      WHERE submissions.lab_id = $1`,
    [labId],
  );
  return Number(rows[0]?.spent ?? 0);
}

/**
 * Build the `judge` the worker loop calls. Every collaborator is injectable so
 * `npm test` runs without Docker, a network or a real model.
 *
 * With no `apiKey` the hard rules still decide ban lists and every semantic
 * pair is `unsure` without a network attempt — the same contract as the
 * checker's `MODEL_OFF=1`.
 *
 * @param {{
 *   db: import('../repo/db.js').Db,
 *   rules: import('../checker/hard-rules/index.js').HardRules,
 *   apiKey?: string,
 *   model: string,
 *   timeoutMs?: number,
 *   sandbox?: typeof runInSandbox,
 *   modelJudge?: typeof judgeConstraint,
 *   recorder?: { record: (entry: import('../model/calllog.js').CallLogEntry) => Promise<void> } | null,
 *   now?: () => Date,
 * }} options
 * @returns {(submission: SubmissionToJudge) => Promise<JudgeResult>}
 */
export function createJudge({
  db,
  rules,
  apiKey = '',
  model,
  timeoutMs = 20_000,
  sandbox = runInSandbox,
  modelJudge = judgeConstraint,
  recorder = null,
  now = () => new Date(),
}) {
  const ask = apiKey.length > 0 ? modelJudge : null;

  /** @type {import('../model/judge.js').JudgeResult} */
  const modelOff = {
    verdict: 'unsure',
    evidence: [],
    decidedBy: 'fallback',
    unsureReason: 'model_unsure',
    call: null,
  };

  return async function judge(submission) {
    const lab = await loadLab(db, submission.labId);
    const run = await sandbox({ sourceCode: submission.sourceCode, tests: lab.tests });
    let spentUsd = await labSpentUsd(db, submission.labId);

    /** @type {VerdictRow[]} */
    const verdicts = [];
    for (const constraint of submission.constraints) {
      const banList = parseBanList(constraint.text);
      if (banList !== null) {
        verdicts.push(toRow(constraint.id, rules.check(submission.sourceCode, banList)));
        continue;
      }

      const result =
        ask === null
          ? modelOff
          : await ask({
              submissionId: submission.id,
              statement: lab.statement,
              constraint,
              sourceCode: submission.sourceCode,
              apiKey,
              model,
              timeoutMs,
              callLog: recorder,
              costCapUsd: lab.costCapUsd,
              spentUsd,
              now,
            });

      // Later pairs in the same submission see the money the earlier ones spent.
      if (result.call !== null) spentUsd += result.call.costUsd;
      verdicts.push(toRow(constraint.id, result));
    }

    return { judgeVerdict: run.verdict, testResults: run.tests, verdicts };
  };
}
