/**
 * Semantic constraints for the checker command (PA#3, criterion 6).
 *
 * The checker runs the same `judgeConstraint` the worker uses, so the
 * committed dev run exercises the real prompt, schema check, timeout and
 * evidence mapping. It is a thin adapter: one call per (solution, semantic
 * constraint), and the call log entry is tagged with the dataset keys so the
 * run can be audited without the source code.
 */

import { callGemini } from '../model/gemini.js';
import { judgeConstraint } from '../model/judge.js';

/** @param {number} ms */
const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 *   minIntervalMs?: number,
 *   maxRetries?: number,
 *   retryDelayMs?: number,
 *   sleep?: (ms: number) => Promise<void>,
 *   clock?: () => number,
 * }} options
 * @returns {import('./dataset.js').SemanticCheck}
 */
export function createModelSemantic({
  apiKey,
  model,
  timeoutMs = 20_000,
  callLog = null,
  now,
  callModel = callGemini,
  minIntervalMs = 0,
  maxRetries = 0,
  retryDelayMs = 15_000,
  sleep = realSleep,
  clock = Date.now,
}) {
  let nextId = 0;
  let lastStart = Number.NEGATIVE_INFINITY;

  /**
   * The free tier of the model allows about ten requests a minute, so a burst
   * of calls turns into HTTP 429 and every later pair into `unsure`. Space the
   * calls by `minIntervalMs`, and retry a 429 after `retryDelayMs`, up to
   * `maxRetries` times. Any other error is left to the judge, which makes it
   * `unsure`. With the defaults nothing waits and nothing is retried.
   *
   * @type {import('../model/judge.js').CallModel}
   */
  const pacedCall = async (input) => {
    for (let attempt = 0; ; attempt += 1) {
      const wait = lastStart + minIntervalMs - clock();
      if (wait > 0) await sleep(wait);
      lastStart = clock();
      try {
        return await callModel(input);
      } catch (error) {
        const limited = /** @type {any} */ (error)?.status === 429;
        if (!limited || attempt >= maxRetries) throw error;
        await sleep(retryDelayMs);
      }
    }
  };

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
      callModel: pacedCall,
    });

    return { verdict: result.verdict, evidence: result.evidence };
  };
}
