/**
 * Read a ban-list constraint (PA#3, criterion 3).
 *
 * A constraint whose text starts with "Do not use" or "Do not call" is a ban
 * list, and every banned name is in backticks (leetkob-eval/README.md). The
 * backticks are read from the constraint text, never from the student's code.
 */

import { isBanList } from '../../domain/labs.js';

/**
 * Keywords the rules match as syntax nodes, keyed by how a TA may write them.
 * @type {ReadonlyMap<string, string>}
 */
const KEYWORDS = new Map([
  ['for', 'for'],
  ['while', 'while'],
  ['do', 'do'],
  ['goto', 'goto'],
  ['new', 'new'],
  ['new[]', 'new'],
  ['delete', 'delete'],
  ['delete[]', 'delete'],
  ['switch', 'switch'],
  ['throw', 'throw'],
  ['continue', 'continue'],
  ['break', 'break'],
]);

/** A C++ name, optionally qualified: `qsort`, `std::sort`, `::qsort`. */
const NAME = /^(?:::)?[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*$/;

/**
 * @typedef {{ names: string[], unknown: string[] }} BanList
 *   `names` the rules can match; `unknown` backticked items they cannot read
 *   (such a constraint is never `pass` on its own, see check()).
 */

/**
 * @param {string} text constraint text
 * @returns {BanList | null} null when the constraint is semantic
 */
export function parseBanList(text) {
  if (!isBanList(text)) return null;
  /** @type {string[]} */
  const names = [];
  /** @type {string[]} */
  const unknown = [];
  for (const match of text.matchAll(/`([^`]+)`/g)) {
    const item = (match[1] ?? '').trim();
    const keyword = KEYWORDS.get(item.replace(/\s+/g, ''));
    const name = keyword ?? (NAME.test(item) ? item.replace(/^::/, '') : null);
    if (name !== null) {
      if (!names.includes(name)) names.push(name);
    } else if (!unknown.includes(item)) {
      unknown.push(item);
    }
  }
  return { names, unknown };
}
