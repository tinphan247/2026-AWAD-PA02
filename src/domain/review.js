/**
 * TA review queue for LeeTKOB (PA#3, criterion 1 and 5).
 *
 * A review queue holds, for one lab: every `violation`, every `unsure`, and a
 * random 10% of the `pass` verdicts (rounded up). Verdicts never reach the
 * student without the TA (FAQ-08, FAQ-09, FAQ-10).
 *
 * The sample is pseudo-random but stable: it is derived from the verdict id,
 * so the same queue is shown on every request and a test can assert it.
 */

/** @typedef {'pass' | 'violation' | 'unsure'} VerdictValue */
/** @typedef {{ line: number, text: string }} EvidenceLine */

/**
 * @typedef {{
 *   id: number,
 *   submissionId: number,
 *   constraintId: number,
 *   verdict: VerdictValue,
 *   evidence: EvidenceLine[],
 *   decidedBy: 'hard_rule' | 'model' | 'fallback' | 'pending',
 *   unsureReason: string | null,
 *   taDecision: 'pass' | 'violation' | null,
 * }} Verdict
 */

/** @param {number} id @returns {number} */
function sampleRank(id) {
  return (id * 2654435761) % 4294967296;
}

/**
 * The FAQ-10 queue: every non-pass verdict plus ceil(10%) of the passes.
 *
 * @param {Verdict[]} verdicts
 * @returns {Verdict[]}
 */
export function selectReviewQueue(verdicts) {
  const must = verdicts.filter((verdict) => verdict.verdict !== 'pass');
  const passes = verdicts.filter((verdict) => verdict.verdict === 'pass');
  const sampleSize = Math.ceil(passes.length * 0.1);

  const sampled = [...passes]
    .sort((a, b) => sampleRank(a.id) - sampleRank(b.id) || a.id - b.id)
    .slice(0, sampleSize);

  return [...must, ...sampled];
}

/**
 * Parse the TA's evidence textarea: one `line|text` per line.
 *
 * @param {string} text
 * @returns {EvidenceLine[]}
 */
export function parseEvidenceLines(text) {
  /** @type {EvidenceLine[]} */
  const evidence = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.length === 0) continue;

    const separator = line.indexOf('|');
    if (separator === -1) continue;

    const number = Number(line.slice(0, separator).trim());
    const body = line.slice(separator + 1).trim();
    if (!Number.isInteger(number) || number < 1 || body.length === 0) continue;

    evidence.push({ line: number, text: body });
  }

  return evidence;
}

/**
 * A TA may only mark `pass` or `violation`; `unsure` stays until they decide.
 * A `violation` needs at least one evidence line (FAQ-09).
 *
 * @param {'pass' | 'violation'} decision
 * @param {EvidenceLine[]} evidence
 * @returns {string | null} an error message, or null when the decision is valid
 */
export function validateDecision(decision, evidence) {
  if (decision === 'violation' && evidence.length === 0) {
    return 'Một quyết định violation phải kèm ít nhất một dòng evidence (line|text).';
  }
  return null;
}
