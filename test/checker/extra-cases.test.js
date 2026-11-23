// Our own cases (criterion 6): leetkob-eval-extra/ has the dev-set layout, at
// least five labelled solutions, a trap and an injection, and the checker plus
// the published eval.mjs run on it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const EXTRA = join(ROOT, 'leetkob-eval-extra');

/** @param {string} file */
function readJsonl(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

const labels = readJsonl(join(EXTRA, 'labels.jsonl'));
const out = mkdtempSync(join(tmpdir(), 'leetkob-extra-'));
test.after(() => rmSync(out, { recursive: true, force: true }));

test('extra cases: at least five solutions, every (solution, constraint) pair labelled once', () => {
  /** @type {string[]} */
  const pairs = [];
  for (const problem of readdirSync(join(EXTRA, 'problems'))) {
    /** @type {{ id: string }[]} */
    const constraints = JSON.parse(
      readFileSync(join(EXTRA, 'problems', problem, 'constraints.json'), 'utf8'),
    );
    for (const file of readdirSync(join(EXTRA, 'solutions', problem))) {
      for (const c of constraints) pairs.push(`${problem}/${file.replace(/\.cpp$/, '')}#${c.id}`);
    }
  }
  const solutions = new Set(pairs.map((p) => p.split('#')[0]));
  assert.ok(solutions.size >= 5, `only ${solutions.size} solutions`);
  assert.deepEqual(labels.map((l) => `${l.solution}#${l.constraint}`).sort(), pairs.sort());
});

test('extra cases: at least one trap and one injection', () => {
  const tags = new Set(labels.flatMap((l) => l.tags));
  assert.ok(tags.has('trap'));
  assert.ok(tags.has('injection'));
});

test('extra cases: the checker and eval.mjs run on the folder (eval exit 0 or 1, never 2)', () => {
  const predictions = join(out, 'predictions.jsonl');
  const check = spawnSync(
    process.execPath,
    [join(ROOT, 'bin', 'check.mjs'), '--dataset', EXTRA, '--out', predictions],
    { encoding: 'utf8', env: { ...process.env, MODEL_OFF: '1' } },
  );
  assert.equal(check.status, 0, check.stderr);
  const evalRun = spawnSync(
    process.execPath,
    [join(ROOT, 'leetkob-eval', 'eval.mjs'), '--data', EXTRA, '--predictions', predictions],
    { encoding: 'utf8' },
  );
  assert.ok(evalRun.status === 0 || evalRun.status === 1, evalRun.stdout + evalRun.stderr);

  // Ban-list pairs are decided by the hard rule alone: each must be right.
  const decisions = readJsonl(join(out, 'decisions.jsonl'));
  const hardRule = new Set(
    decisions
      .filter((d) => d.decided_by === 'hard_rule')
      .map((d) => `${d.solution}#${d.constraint}`),
  );
  const byKey = new Map(readJsonl(predictions).map((p) => [`${p.solution}#${p.constraint}`, p]));
  for (const label of labels) {
    const key = `${label.solution}#${label.constraint}`;
    if (!hardRule.has(key)) continue;
    const p = byKey.get(key);
    assert.equal(p?.verdict, label.label, key);
    if (label.label === 'violation') {
      assert.ok(
        p.evidence.some((/** @type {{ line: number }} */ e) => label.evidence.includes(e.line)),
        key,
      );
    }
  }
});
