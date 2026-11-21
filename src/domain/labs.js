/**
 * Lab and constraint management for LeeTKOB (PA#3).
 *
 * A lab belongs to a class, has a statement, a set of tests and a list of
 * constraints. Constraints whose text starts with "Do not use" / "Do not call"
 * are ban lists; the rest are semantic.
 *
 * This module is a scaffold: the real implementation lands in the commit that
 * adds the TA flow (criterion 1). The types below are the contract the rest
 * of the code builds against.
 */

/**
 * @typedef {'ban_list' | 'semantic'} ConstraintKind
 *
 * @typedef {{
 *   id: number,
 *   labId: number,
 *   text: string,
 *   deduction: number,
 *   kind: ConstraintKind,
 *   position: number,
 * }} Constraint
 *
 * @typedef {{
 *   id: number,
 *   classId: number,
 *   title: string,
 *   statement: string,
 *   tests: unknown[],
 *   costCapUsd: number,
 *   opensAt: Date,
 *   deadlineAt: Date,
 *   publishedAt: Date | null,
 *   createdBy: number,
 * }} Lab
 */

/**
 * Create a lab. Not implemented yet.
 *
 * @param {unknown} _input
 * @returns {Lab}
 */
export function createLab(_input) {
  void _input;
  throw new Error('createLab: not implemented');
}

/**
 * Find a lab by id. Not implemented yet.
 *
 * @param {number} _labId
 * @returns {Lab | null}
 */
export function findLab(_labId) {
  void _labId;
  throw new Error('findLab: not implemented');
}

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
