/**
 * Lab and constraint helpers for LeeTKOB (PA#3, criterion 1).
 *
 * A lab belongs to a class, has a statement, a set of tests and a list of
 * constraints. Constraints whose text starts with "Do not use" / "Do not call"
 * are ban lists; the rest are semantic.
 *
 * The HTTP routes in `src/web/` use these helpers; the worker uses `isBanList`
 * to choose between a hard rule and the model.
 */

/** @typedef {'ban_list' | 'semantic'} ConstraintKind */

/**
 * @typedef {{
 *   id: number,
 *   text: string,
 *   deduction: number,
 *   kind: ConstraintKind,
 * }} Constraint
 */

/** @typedef {{ name: string, input: string, output: string }} LabTest */

/**
 * @typedef {{
 *   id: number,
 *   classId: number,
 *   title: string,
 *   statement: string,
 *   tests: LabTest[],
 *   constraints: Constraint[],
 *   createdBy: number,
 *   createdAt: string,
 *   publishedAt: string | null,
 * }} Lab
 */

/** @typedef {{ text: string, deduction: number }} ConstraintInput */

/**
 * Decide whether a constraint text is a ban list (FAQ: starts with "Do not use"
 * or "Do not call", with every banned name in backticks).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isBanList(text) {
  return /^Do not (use|call)\b/.test(text.trim());
}

/**
 * Parse the textarea of the lab form: one constraint per line, `text | deduction`.
 * A line without `|` has a deduction of 0.
 *
 * @param {string} text
 * @returns {ConstraintInput[]}
 */
export function parseConstraintLines(text) {
  /** @type {ConstraintInput[]} */
  const constraints = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.length === 0) continue;

    const separator = line.lastIndexOf('|');
    const body = separator === -1 ? line : line.slice(0, separator).trim();
    const deductionRaw = separator === -1 ? '0' : line.slice(separator + 1).trim();
    const deduction = Number(deductionRaw);

    if (body.length === 0) continue;
    constraints.push({
      text: body,
      deduction: Number.isFinite(deduction) && deduction >= 0 ? deduction : 0,
    });
  }

  return constraints;
}

/** @typedef {{ name: string, content: string }} UploadedTestFile */
/** @typedef {{ name: string, input: string, output: string }} TestPair */

/**
 * Pair uploaded `NN.in` / `NN.out` files by base name. A pair missing one side
 * is dropped: the worker cannot judge it.
 *
 * @param {UploadedTestFile[]} files
 * @returns {TestPair[]}
 */
export function pairTestFiles(files) {
  /** @type {Map<string, { name: string, input: string | null, output: string | null }>} */
  const pairs = new Map();

  for (const file of files) {
    const match = /^(.*)\.(in|out)$/i.exec(file.name);
    if (match === null) continue;

    const name = match[1] ?? '';
    const side = (match[2] ?? '').toLowerCase();
    if (name.length === 0) continue;

    const pair = pairs.get(name) ?? { name, input: null, output: null };
    if (side === 'in') pair.input = file.content;
    else pair.output = file.content;
    pairs.set(name, pair);
  }

  return [...pairs.values()]
    .filter(
      (pair) =>
        pair.input !== null &&
        pair.output !== null &&
        pair.input.length > 0 &&
        pair.output.length > 0,
    )
    .map((pair) => ({ name: pair.name, input: pair.input ?? '', output: pair.output ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
}
