// The hard rules on every ban-list pair of the published dev set (criterion 3
// evidence). The dev set and its labels are only read, never changed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { createHardRules, parseBanList } from '../../src/checker/hard-rules/index.js';

const DATA = join(import.meta.dirname, '..', '..', 'leetkob-eval');

/** @type {Map<string, { label: string, evidence: number[] }>} */
const labels = new Map(
  readFileSync(join(DATA, 'labels.jsonl'), 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .map((l) => [`${l.solution}#${l.constraint}`, l]),
);

const rules = await createHardRules();

/** Every ban-list pair with the hard-rule result next to its label. */
const results = readdirSync(join(DATA, 'problems')).flatMap((problem) => {
  /** @type {{ id: string, text: string }[]} */
  const constraints = JSON.parse(
    readFileSync(join(DATA, 'problems', problem, 'constraints.json'), 'utf8'),
  );
  const files = readdirSync(join(DATA, 'solutions', problem)).filter((f) => f.endsWith('.cpp'));
  return constraints.flatMap((constraint) => {
    const banList = parseBanList(constraint.text);
    if (!banList) return [];
    return files.map((file) => {
      const source = readFileSync(join(DATA, 'solutions', problem, file), 'utf8');
      const key = `${problem}/${file.replace(/\.cpp$/, '')}#${constraint.id}`;
      const label = labels.get(key);
      assert.ok(label, `no label for ${key}`);
      return { key, source, label, result: rules.check(source, banList) };
    });
  });
});

test('dev set: the hard rules cover all 55 ban-list pairs', () => {
  assert.equal(results.length, 55);
});

test('dev set: no compliant ban-list pair is predicted as a violation (no wrongful deduction)', () => {
  const wrongful = results
    .filter((r) => r.label.label === 'pass' && r.result.verdict === 'violation')
    .map((r) => r.key);
  assert.deepEqual(wrongful, []);
});

test('dev set: every ban-list violation is caught with a labelled line and its exact text', () => {
  const lines = (/** @type {string} */ s) => s.split('\n').map((l) => l.replace(/\r$/, ''));
  const missed = results
    .filter((r) => r.label.label === 'violation')
    .filter((r) => {
      if (r.result.verdict !== 'violation') return true;
      const original = lines(r.source);
      return !r.result.evidence.some(
        (e) => r.label.evidence.includes(e.line) && original[e.line - 1]?.trim() === e.text.trim(),
      );
    })
    .map((r) => `${r.key} -> ${r.result.verdict} ${JSON.stringify(r.result.evidence)}`);
  assert.deepEqual(missed, []);
});

test('dev set: at most two ban-list pairs are left unsure', () => {
  const unsure = results.filter((r) => r.result.verdict === 'unsure').map((r) => r.key);
  assert.ok(unsure.length <= 2, `unsure: ${unsure.join(', ')}`);
});
