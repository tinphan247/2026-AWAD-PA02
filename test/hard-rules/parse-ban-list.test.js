// Which constraints are ban lists, and which names they ban.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { parseBanList } from '../../src/checker/hard-rules/index.js';

const DEV = join(import.meta.dirname, '..', '..', 'leetkob-eval', 'problems');

/** @returns {{ problem: string, id: string, text: string }[]} */
function devConstraints() {
  return readdirSync(DEV).flatMap((problem) =>
    JSON.parse(readFileSync(join(DEV, problem, 'constraints.json'), 'utf8')).map(
      (/** @type {{ id: string, text: string }} */ c) => ({ problem, id: c.id, text: c.text }),
    ),
  );
}

test('ban list: the seven dev-set ban lists are recognised and the semantic ones are not', () => {
  const banLists = devConstraints()
    .filter((c) => parseBanList(c.text) !== null)
    .map((c) => `${c.problem}/${c.id}`)
    .sort();
  assert.deepEqual(banLists, [
    'binary-search/C1',
    'dynamic-array/C1',
    'gcd-euclid/C1',
    'reverse-recursive/C1',
    'reverse-recursive/C2',
    'reverse-words/C1',
    'sort-merge/C1',
  ]);
});

test('ban list: every backticked name of the sort constraint is banned, in order', () => {
  const text =
    'Do not call a library sort function: `std::sort`, `std::stable_sort`, `std::partial_sort`, `std::ranges::sort`, `std::ranges::stable_sort`, `qsort`.';
  assert.deepEqual(parseBanList(text), {
    names: [
      'std::sort',
      'std::stable_sort',
      'std::partial_sort',
      'std::ranges::sort',
      'std::ranges::stable_sort',
      'qsort',
    ],
    unknown: [],
  });
});

test('ban list: do-while and range-based for become the do, while and for keywords', () => {
  const text =
    'Do not use loop statements: `for`, `while`, `do`-`while`, range-based `for`, or `goto`. All repetition must come from recursion.';
  assert.deepEqual(parseBanList(text), { names: ['for', 'while', 'do', 'goto'], unknown: [] });
});

test('ban list: new[] is the new keyword, and an item that is not a name is reported as unknown', () => {
  assert.deepEqual(parseBanList('Do not use `new[]`, `delete`, `<algorithm>` or `operator[]`.'), {
    names: ['new', 'delete'],
    unknown: ['<algorithm>', 'operator[]'],
  });
});

test('ban list: a constraint that does not start with "Do not use" or "Do not call" is semantic', () => {
  assert.equal(
    parseBanList('Store the numbers in memory you allocate yourself (`new[]`, or `malloc`).'),
    null,
  );
});
