/**
 * Prompt construction for the semantic-constraint model (PA#3, criterion 4).
 *
 * Only the statement, the constraints, and the code with comments and the
 * student's identity removed are sent (FAQ-06). The model never receives the
 * deduction and never decides a deduction.
 */

/**
 * Remove comments and student identity from source code. Line numbers and the
 * remaining lines must stay byte-identical so evidence lines match (FAQ-06).
 *
 * @param {string} sourceCode
 * @returns {string}
 */
export function anonymizeCode(sourceCode) {
  // Scaffold: identity stripping lands with the model commit. Comments are
  // removed by the hard-rules/parser layer before this is called.
  return sourceCode;
}

/**
 * @param {{ statement: string, constraints: { id: string, text: string }[], code: string }} input
 * @returns {{ system: string, user: string }}
 */
export function buildPrompt({ statement, constraints, code }) {
  const system =
    'You are a code reviewer for a programming lab. ' +
    'For each constraint, reply with a JSON object: ' +
    '{ "verdict": "pass" | "violation" | "unsure", ' +
    '"evidence": [{ "line": <1-based line>, "text": "<that source line>" }], ' +
    '"reason": "<short>" }. ' +
    'The model never sets a deduction. Evidence lines must match the submitted ' +
    'code exactly.';

  const user =
    `Statement:\n${statement}\n\n` +
    `Constraints:\n${constraints.map((c) => `- ${c.id}: ${c.text}`).join('\n')}\n\n` +
    `Code:\n${code}`;

  return { system, user };
}
