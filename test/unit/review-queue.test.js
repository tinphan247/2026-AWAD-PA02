import test from 'node:test';
import assert from 'node:assert/strict';

import { isBanList, pairTestFiles, parseConstraintLines } from '../../src/domain/labs.js';
import {
  parseEvidenceLines,
  selectReviewQueue,
  validateDecision,
} from '../../src/domain/review.js';

/** @param {number} id @param {'pass' | 'violation' | 'unsure'} verdict */
function verdict(id, verdict) {
  return {
    id,
    submissionId: 1,
    constraintId: id,
    verdict,
    evidence: [],
    decidedBy: /** @type {'model'} */ ('model'),
    unsureReason: null,
    taDecision: null,
  };
}

test('parseConstraintLines reads text and deduction, defaulting to 0', () => {
  const constraints = parseConstraintLines(
    'Do not call `std::sort`. | 5\nUse a stable algorithm.\n\n | 9\n',
  );

  assert.deepEqual(constraints, [
    { text: 'Do not call `std::sort`.', deduction: 5 },
    { text: 'Use a stable algorithm.', deduction: 0 },
  ]);
});

test('isBanList only matches the two documented prefixes', () => {
  assert.equal(isBanList('Do not use `std::vector`.'), true);
  assert.equal(isBanList('Do not call `std::sort`.'), true);
  assert.equal(isBanList('Do not call your mother.'), true);
  assert.equal(isBanList('Avoid `std::sort`.'), false);
  assert.equal(isBanList('Use a stable algorithm.'), false);
});

test('pairTestFiles keeps only complete NN.in / NN.out pairs, sorted', () => {
  const pairs = pairTestFiles([
    { name: '02.in', content: 'b' },
    { name: '01.in', content: 'a' },
    { name: '02.out', content: 'B' },
    { name: '01.out', content: 'A' },
    { name: '03.in', content: 'orphan' },
    { name: 'notes.txt', content: 'ignored' },
  ]);

  assert.deepEqual(pairs, [
    { name: '01', input: 'a', output: 'A' },
    { name: '02', input: 'b', output: 'B' },
  ]);
});

test('selectReviewQueue keeps every non-pass and ceil(10%) of passes', () => {
  const verdicts = [
    verdict(1, 'violation'),
    verdict(2, 'unsure'),
    ...Array.from({ length: 20 }, (_, index) => verdict(100 + index, 'pass')),
  ];

  const queue = selectReviewQueue(verdicts);
  assert.equal(queue.length, 2 + 2, 'two must-review plus ceil(10% of 20) = 2');
  assert.equal(queue.filter((entry) => entry.verdict === 'pass').length, 2);
});

test('selectReviewQueue is stable across calls', () => {
  const verdicts = Array.from({ length: 30 }, (_, index) => verdict(index + 1, 'pass'));

  assert.deepEqual(
    selectReviewQueue(verdicts).map((entry) => entry.id),
    selectReviewQueue([...verdicts].reverse()).map((entry) => entry.id),
  );
});

test('parseEvidenceLines accepts `line|text` and ignores malformed lines', () => {
  assert.deepEqual(parseEvidenceLines('12|sort(a);\nnot a line\n0|x\n3|  \n4|ok'), [
    { line: 12, text: 'sort(a);' },
    { line: 4, text: 'ok' },
  ]);
});

test('validateDecision requires evidence for a violation only', () => {
  assert.equal(validateDecision('pass', []), null);
  assert.equal(validateDecision('violation', [{ line: 1, text: 'x' }]), null);
  assert.match(validateDecision('violation', []) ?? '', /evidence/);
});
