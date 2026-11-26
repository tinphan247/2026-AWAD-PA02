/**
 * Call log for the semantic-constraint model (PA#3, criterion 4).
 *
 * One JSON line per model call. The log keeps the *anonymised* prompt because
 * criterion 4 asks the prompts to show that comments and identity were
 * removed; it must never contain the original source, a name, an MSSV or an
 * email. The worker writes the same entry to the `model_calls` table.
 */

import { appendFile, readFile } from 'node:fs/promises';

import { callCostUsd } from './cost.js';

/**
 * @typedef {{
 *   at: string,
 *   submissionId: number,
 *   constraintId: number,
 *   model: string,
 *   requestId: string,
 *   tokensIn: number,
 *   tokensOut: number,
 *   latencyMs: number,
 *   costUsd: number,
 *   prompt: string,
 * }} CallLogEntry
 */

/**
 * Turn one `callGemini()` result into a log entry. `prompt` must be the
 * anonymised user message, never the submitted source.
 *
 * @param {{
 *   submissionId: number,
 *   constraintId: number,
 *   model: string,
 *   result: { requestId: string, tokensIn: number, tokensOut: number, latencyMs: number },
 *   prompt: string,
 *   at: Date,
 * }} input
 * @returns {CallLogEntry}
 */
export function makeCallLogEntry({ submissionId, constraintId, model, result, prompt, at }) {
  return {
    at: at.toISOString(),
    submissionId,
    constraintId,
    model,
    requestId: result.requestId,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    latencyMs: result.latencyMs,
    costUsd: callCostUsd({
      model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    }),
    prompt,
  };
}

/**
 * A JSONL call log. Tests pass a temporary file; the worker passes
 * `MODEL_CALL_LOG` or a path under `data/`.
 *
 * @param {{ filePath: string }} options
 */
export function createCallLog({ filePath }) {
  return {
    /**
     * @param {CallLogEntry} entry
     * @returns {Promise<void>}
     */
    async record(entry) {
      await appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
    },

    /**
     * @returns {Promise<CallLogEntry[]>}
     */
    async read() {
      try {
        const text = await readFile(filePath, 'utf8');
        return text
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => /** @type {CallLogEntry} */ (JSON.parse(line)));
      } catch (error) {
        if (/** @type {any} */ (error).code === 'ENOENT') return [];
        throw error;
      }
    },
  };
}
