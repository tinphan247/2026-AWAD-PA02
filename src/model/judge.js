/**
 * One semantic-constraint judgement (PA#3, criterion 4).
 *
 * The pipeline is: anonymise the source, build a one-constraint prompt, call
 * the model with structured output, validate the schema, verify every
 * evidence line, then map the evidence back to the *original* line so
 * `eval.mjs` (`evidenceHits`) and the TA see the text the student submitted.
 *
 * Every failure becomes `unsure` with a reason from `UNSURE_REASONS`; nothing
 * here decides a deduction or changes a mark (FAQ-08, FAQ-09).
 */

import { makeCallLogEntry } from './calllog.js';
import { callGemini } from './gemini.js';
import { anonymizeCode, buildPrompt } from './prompt.js';
import { VERDICT_RESPONSE_SCHEMA, validateVerdictOutput } from './schema.js';

/** @typedef {{ line: number, text: string }} EvidenceLine */
/** @typedef {'pass' | 'violation' | 'unsure'} VerdictValue */

/**
 * @typedef {{
 *   verdict: VerdictValue,
 *   evidence: EvidenceLine[],
 *   decidedBy: 'model' | 'fallback',
 *   unsureReason: string | null,
 *   call: import('./calllog.js').CallLogEntry | null,
 * }} JudgeResult
 */

/**
 * @typedef {{
 *   text: string,
 *   requestId: string,
 *   tokensIn: number,
 *   tokensOut: number,
 *   latencyMs: number,
 * }} ModelReply
 */

/**
 * @typedef {(input: {
 *   apiKey: string,
 *   model: string,
 *   system: string,
 *   user: string,
 *   responseSchema?: unknown,
 *   timeoutMs: number,
 * }) => Promise<ModelReply>} CallModel
 */

/**
 * Collapse whitespace for comparison only. The evidence text written to the
 * database and the predictions file is always the original line, trimmed.
 *
 * @param {string} line
 * @returns {string}
 */
export function normalizeLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

/**
 * Structured output should be bare JSON, but a model sometimes wraps it in a
 * markdown fence. Strip that before parsing; anything else stays invalid.
 *
 * @param {string} text
 * @returns {unknown}
 */
export function parseModelJson(text) {
  const trimmed = text.trim();
  const unfenced = trimmed.startsWith('```')
    ? trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/, '')
        .trim()
    : trimmed;
  return JSON.parse(unfenced);
}

/**
 * Check the model's evidence against the anonymised code it actually saw, then
 * return the original line text. Returns null when any line is out of range or
 * does not match, which the caller turns into `unsure`.
 *
 * @param {{
 *   evidence: EvidenceLine[],
 *   anonymizedLines: string[],
 *   originalLines: string[],
 * }} input
 * @returns {EvidenceLine[] | null}
 */
export function verifyEvidence({ evidence, anonymizedLines, originalLines }) {
  /** @type {EvidenceLine[]} */
  const mapped = [];

  for (const entry of evidence) {
    if (!Number.isInteger(entry.line) || entry.line < 1 || entry.line > originalLines.length) {
      return null;
    }

    const original = originalLines[entry.line - 1] ?? '';
    const anonymized = anonymizedLines[entry.line - 1] ?? '';
    const candidate = normalizeLine(entry.text);

    if (candidate.length === 0) return null;
    if (candidate !== normalizeLine(anonymized) && candidate !== normalizeLine(original)) {
      return null;
    }

    const text = original.trim();
    if (text.length === 0) return null;
    mapped.push({ line: entry.line, text });
  }

  return mapped;
}

/**
 * Judge one (submission, constraint) pair.
 *
 * `callModel` is injectable so tests never touch the network. `spentUsd` is
 * the lab's cost so far; when it has reached `costCapUsd` the call is skipped
 * and the pair becomes `unsure` with `cost_cap`.
 *
 * @param {{
 *   submissionId: number,
 *   statement: string,
 *   constraint: { id: number, text: string },
 *   sourceCode: string,
 *   identities?: string[],
 *   apiKey: string,
 *   model: string,
 *   timeoutMs?: number,
 *   callLog?: { record: (entry: import('./calllog.js').CallLogEntry) => Promise<void> } | null,
 *   costCapUsd?: number,
 *   spentUsd?: number,
 *   now?: () => Date,
 *   callModel?: CallModel,
 * }} input
 * @returns {Promise<JudgeResult>}
 */
export async function judgeConstraint({
  submissionId,
  statement,
  constraint,
  sourceCode,
  identities = [],
  apiKey,
  model,
  timeoutMs = 20_000,
  callLog = null,
  costCapUsd = Number.POSITIVE_INFINITY,
  spentUsd = 0,
  now = () => new Date(),
  callModel = callGemini,
}) {
  /** @param {string} reason @param {import('./calllog.js').CallLogEntry | null} [call] @returns {JudgeResult} */
  const unsure = (reason, call = null) => ({
    verdict: 'unsure',
    evidence: [],
    decidedBy: 'fallback',
    unsureReason: reason,
    call,
  });

  if (spentUsd >= costCapUsd) return unsure('cost_cap');

  const anonymized = anonymizeCode(sourceCode, { identities });
  const { system, user } = buildPrompt({ statement, constraint, code: anonymized });

  let reply;
  try {
    reply = await callModel({
      apiKey,
      model,
      system,
      user,
      responseSchema: VERDICT_RESPONSE_SCHEMA,
      timeoutMs,
    });
  } catch (error) {
    const code = /** @type {any} */ (error)?.code;
    return unsure(code === 'TIMEOUT' ? 'timeout' : 'model_error');
  }

  const call = makeCallLogEntry({
    submissionId,
    constraintId: constraint.id,
    model,
    result: reply,
    prompt: user,
    at: now(),
  });
  if (callLog !== null) await callLog.record(call);

  let parsed;
  try {
    parsed = parseModelJson(reply.text);
  } catch {
    return unsure('schema_invalid', call);
  }

  const validated = validateVerdictOutput(parsed);
  if (!validated.ok) return unsure('schema_invalid', call);

  if (validated.verdict === 'unsure') {
    return {
      verdict: 'unsure',
      evidence: [],
      decidedBy: 'model',
      unsureReason: 'model_unsure',
      call,
    };
  }

  if (validated.verdict === 'pass') {
    return { verdict: 'pass', evidence: [], decidedBy: 'model', unsureReason: null, call };
  }

  const mapped = verifyEvidence({
    evidence: validated.evidence,
    anonymizedLines: anonymized.split('\n'),
    originalLines: sourceCode.split('\n'),
  });

  if (mapped === null || mapped.length === 0) return unsure('evidence_mismatch', call);

  return { verdict: 'violation', evidence: mapped, decidedBy: 'model', unsureReason: null, call };
}
