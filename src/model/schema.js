/**
 * Schema for the model's verdict output (PA#3, criterion 4 and 5).
 *
 * The model returns, for one (submission, constraint):
 *   { verdict, evidence: [{ line, text }], reason }
 * Anything that fails this schema becomes `unsure` (FAQ-09).
 */

export const VERDICT_VALUES = Object.freeze(['pass', 'violation', 'unsure']);

export const UNSURE_REASONS = Object.freeze([
  'model_unsure',
  'schema_invalid',
  'evidence_mismatch',
  'timeout',
  'cost_cap',
  'hard_rule_unsure',
]);

/**
 * Validate an untrusted model output. Returns a typed result so callers never
 * have to trust the shape.
 *
 * @param {unknown} value
 * @returns {{ ok: true, verdict: 'pass' | 'violation' | 'unsure', evidence: { line: number, text: string }[], reason: string } | { ok: false, reason: 'schema_invalid' }}
 */
export function validateVerdictOutput(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, reason: 'schema_invalid' };
  }

  const record = /** @type {Record<string, unknown>} */ (value);
  const verdict = record.verdict;
  if (typeof verdict !== 'string' || !VERDICT_VALUES.includes(verdict)) {
    return { ok: false, reason: 'schema_invalid' };
  }

  const evidenceRaw = record.evidence;
  if (!Array.isArray(evidenceRaw)) {
    return { ok: false, reason: 'schema_invalid' };
  }
  const evidence = [];
  for (const entry of evidenceRaw) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return { ok: false, reason: 'schema_invalid' };
    }
    const e = /** @type {Record<string, unknown>} */ (entry);
    if (typeof e.line !== 'number' || !Number.isInteger(e.line) || e.line < 1) {
      return { ok: false, reason: 'schema_invalid' };
    }
    if (typeof e.text !== 'string') {
      return { ok: false, reason: 'schema_invalid' };
    }
    evidence.push({ line: e.line, text: e.text });
  }

  const reason = typeof record.reason === 'string' ? record.reason : '';

  return {
    ok: true,
    verdict: /** @type {'pass' | 'violation' | 'unsure'} */ (verdict),
    evidence,
    reason,
  };
}
