/**
 * Where a worker puts the model call log (PA#3, criterion 4).
 *
 * `model_calls` is authoritative: `labSpentUsd()` in `./pipeline.js` sums it to
 * enforce the lab's cost cap, and `PA3.md` §8 reads the request id, token
 * counts, latency and cost from it. The JSONL file is optional and only ever
 * holds the same anonymised prompt — never the submitted source, a name, an
 * MSSV or an email.
 */

import { createCallLog } from '../model/calllog.js';

/**
 * @param {{
 *   db: import('../repo/db.js').Db,
 *   filePath?: string | null,
 * }} options
 * @returns {{ record: (entry: import('../model/calllog.js').CallLogEntry) => Promise<void> }}
 */
export function createCallRecorder({ db, filePath = null }) {
  const file = filePath === null ? null : createCallLog({ filePath });

  return {
    async record(entry) {
      // Best effort: a full disk must not throw away a call we already paid
      // for. The table is the copy the cost cap depends on.
      if (file !== null) {
        try {
          await file.record(entry);
        } catch {
          // Ignored on purpose; see above.
        }
      }

      await db.query(
        `INSERT INTO model_calls
           (submission_id, constraint_id, provider, model, provider_request_id,
            prompt, tokens_in, tokens_out, latency_ms, cost_usd, outcome)
         VALUES ($1, $2, 'google', $3, $4, $5, $6, $7, $8, $9, 'answered')`,
        [
          entry.submissionId,
          entry.constraintId,
          entry.model,
          entry.requestId,
          entry.prompt,
          entry.tokensIn,
          entry.tokensOut,
          entry.latencyMs,
          entry.costUsd,
        ],
      );
    },
  };
}
