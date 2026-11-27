/**
 * Semantic constraints for the checker command (PA#3, criterion 6).
 *
 * The checker runs the same `judgeConstraint` the worker uses, so the
 * committed dev run exercises the real prompt, schema check, timeout and
 * evidence mapping. It is a thin adapter: one call per (solution, semantic
 * constraint), and the call log entry is tagged with the dataset keys so the
 * run can be audited without the source code.
 */

import { judgeConstraint } from '../model/judge.js';

/**
 * @param {{
 *   apiKey: string,
 *   model: string,
 *   timeoutMs?: number,
 *   callLog?: { record: (entry: import('../model/calllog.js').CallLogEntry & {
 *     solution: string,
 *     constraint: string,
 *   }) => Promise<void> } | null,
 *   now?: () => Date,
 *   callModel?: import('../model/judge.js').CallModel,
 * }} options
 * @returns {import('./dataset.js').SemanticCheck}
 */
export function createModelSemantic({
  apiKey,
  model,
  timeoutMs = 20_000,
  callLog = null,
  now,
  callModel,
}) {
  let nextId = 0;

  return async function semantic({ statement, constraint, source, solution }) {
    nextId += 1;
    const id = nextId;
    const record =
      callLog === null
        ? null
        : {
            record: (/** @type {import('../model/calllog.js').CallLogEntry} */ entry) =>
              callLog.record({ ...entry, solution, constraint: constraint.id }),
          };

    const result = await judgeConstraint({
      submissionId: id,
      statement,
      constraint: { id, text: constraint.text },
      sourceCode: source,
      identities: [],
      apiKey,
      model,
      timeoutMs,
      callLog: record,
      // The dev set is a fixed batch, not a lab with a budget. The cap still
      // protects against a runaway if this adapter is reused elsewhere.
      costCapUsd: Number.POSITIVE_INFINITY,
      spentUsd: 0,
      now,
      callModel,
    });

    return { verdict: result.verdict, evidence: result.evidence };
  };
}
