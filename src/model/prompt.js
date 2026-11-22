/**
 * Prompt construction for the semantic-constraint model (PA#3, criterion 4).
 *
 * Only the statement, one constraint, and the code with comments and the
 * student's identity removed are sent (FAQ-06). The model never receives the
 * deduction and never decides a deduction.
 *
 * One call answers one (submission, constraint) pair, so the verdict schema
 * needs no `constraint` field and a bad answer cannot poison another pair.
 */

const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const REDACTED = '[REDACTED]';
const REDACTED_EMAIL = '[EMAIL]';

/**
 * Blank out `//` and block comments while keeping every line break and the
 * total string length. Keeping the length means a line number in the prompt
 * is still the same line number in the original submission.
 *
 * String and character literals are skipped, so `"http://x"` survives. Raw
 * string literals (`R"(...)"`) are not special-cased: the datasets in
 * `leetkob-eval/` do not use them, and a wrong cut there would only hide code
 * from the model, never add a comment.
 *
 * @param {string} source
 * @returns {string}
 */
function blankComments(source) {
  const out = source.split('');
  let state = 'code';
  let i = 0;

  /** @param {number} from @param {number} to */
  const blank = (from, to) => {
    for (let j = from; j < to; j += 1) {
      const ch = out[j];
      if (ch !== '\n' && ch !== '\r') out[j] = ' ';
    }
  };

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        let end = i;
        while (end < source.length && source[end] !== '\n') end += 1;
        blank(i, end);
        i = end;
        continue;
      }
      if (ch === '/' && next === '*') {
        let end = i + 2;
        while (end < source.length && !(source[end] === '*' && source[end + 1] === '/')) end += 1;
        end = Math.min(source.length, end + 2);
        blank(i, end);
        i = end;
        continue;
      }
      if (ch === '"' || ch === "'") {
        state = ch;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    // Inside a string or character literal.
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === state) state = 'code';
    i += 1;
  }

  return out.join('');
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove comments and student identity from source code. Line numbers and the
 * remaining lines stay byte-identical so evidence lines match (FAQ-06).
 *
 * `identities` are the exact strings the caller knows about (full name, MSSV,
 * student email). Comments are already blanked, so most identities disappear
 * with them; anything left in a string literal is replaced by `[REDACTED]`.
 * Email addresses are always redacted.
 *
 * @param {string} sourceCode
 * @param {{ identities?: string[] }} [options]
 * @returns {string}
 */
export function anonymizeCode(sourceCode, { identities = [] } = {}) {
  let code = blankComments(sourceCode);

  const tokens = identities
    .map((identity) => identity.trim())
    .filter((identity) => identity.length > 0)
    .sort((a, b) => b.length - a.length);

  for (const identity of tokens) {
    code = code.replace(new RegExp(escapeRegExp(identity), 'g'), REDACTED);
  }

  return code.replace(EMAIL_RE, REDACTED_EMAIL);
}

/**
 * Build the system and user messages for one (submission, constraint) pair.
 *
 * @param {{
 *   statement: string,
 *   constraint: { id: number | string, text: string },
 *   code: string,
 * }} input `code` must already be anonymised by {@link anonymizeCode}.
 * @returns {{ system: string, user: string }}
 */
export function buildPrompt({ statement, constraint, code }) {
  const system =
    'You are a code reviewer for one programming-lab constraint. ' +
    'Reply with one JSON object and nothing else: ' +
    '{ "verdict": "pass" | "violation" | "unsure", ' +
    '"evidence": [{ "line": <1-based line number>, "text": "<the source line, trimmed>" }], ' +
    '"reason": "<one short sentence>" }. ' +
    'Use "violation" only when the code clearly breaks the constraint; ' +
    'use "unsure" when the evidence is ambiguous. ' +
    'The model never sets a deduction and never decides a mark. ' +
    'Evidence line numbers refer to the code below, whose comments are blanked ' +
    'but whose line numbers match the original submission.';

  const user =
    `Statement:\n${statement}\n\n` +
    `Constraint ${constraint.id}:\n${constraint.text}\n\n` +
    `Code (comments and identity removed):\n${code}`;

  return { system, user };
}
