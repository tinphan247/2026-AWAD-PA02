// The checker command (criterion 6): one command line takes a dataset folder
// and writes predictions that eval.mjs accepts. With MODEL_OFF=1 it runs the
// hard rules only and opens no network connection.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..', '..');
const CHECK = join(ROOT, 'bin', 'check.mjs');
const EVAL = join(ROOT, 'leetkob-eval', 'eval.mjs');
// --import takes a URL; a bare Windows path (D:\...) is not one.
const NO_NETWORK = pathToFileURL(join(import.meta.dirname, 'no-network.mjs')).href;
const DEV = join(ROOT, 'leetkob-eval');

/**
 * Run the checker with the network blocked.
 * @param {string[]} args
 * @param {Record<string, string>} [env]
 */
function runChecker(args, env = { MODEL_OFF: '1' }) {
  const {
    MODEL_API_KEY: _key,
    GEMINI_API_KEY: _gemini,
    MODEL_OFF: _off,
    MODEL_NAME: _model,
    ...base
  } = process.env;
  void _key;
  void _gemini;
  void _off;
  void _model;
  return spawnSync(process.execPath, ['--import', NO_NETWORK, CHECK, ...args], {
    encoding: 'utf8',
    env: { ...base, ...env },
  });
}

/** @param {string} file */
function readJsonl(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

const out = mkdtempSync(join(tmpdir(), 'leetkob-check-'));
test.after(() => rmSync(out, { recursive: true, force: true }));

const predictions = join(out, 'predictions.jsonl');
const run = runChecker(['--dataset', DEV, '--out', predictions]);

test('checker: MODEL_OFF=1 on the dev set exits 0 with the network blocked', () => {
  assert.equal(run.status, 0, run.stderr);
});

test('checker: one prediction for each of the 102 (solution, constraint) pairs, none twice', () => {
  const rows = readJsonl(predictions);
  assert.equal(rows.length, 102);
  const keys = new Set(rows.map((r) => `${r.solution}#${r.constraint}`));
  assert.equal(keys.size, 102);
  const labelled = new Set(
    readJsonl(join(DEV, 'labels.jsonl')).map((l) => `${l.solution}#${l.constraint}`),
  );
  assert.deepEqual([...keys].sort(), [...labelled].sort());
});

test('checker: every prediction has the shape eval.mjs accepts, with original source lines', () => {
  for (const row of readJsonl(predictions)) {
    assert.deepEqual(Object.keys(row).sort(), ['constraint', 'evidence', 'solution', 'verdict']);
    assert.ok(['pass', 'violation', 'unsure'].includes(row.verdict));
    const source = readFileSync(join(DEV, 'solutions', `${row.solution}.cpp`), 'utf8').split('\n');
    for (const e of row.evidence) {
      assert.ok(Number.isInteger(e.line) && e.line >= 1);
      assert.equal(e.text.trim(), (source[e.line - 1] ?? '').trim());
    }
  }
});

test('checker: ban lists are decided by the hard rule and never reach the model', () => {
  const decisions = readJsonl(join(out, 'decisions.jsonl'));
  assert.equal(decisions.length, 102);
  const banList = decisions.filter((d) => d.decided_by === 'hard_rule');
  assert.equal(banList.length, 55);
  assert.ok(decisions.every((d) => d.model_called === false));
});

test('checker: with the model off, every semantic constraint is unsure', () => {
  const decisions = readJsonl(join(out, 'decisions.jsonl'));
  const semantic = new Set(
    decisions
      .filter((d) => d.decided_by === 'model_off')
      .map((d) => `${d.solution}#${d.constraint}`),
  );
  assert.equal(semantic.size, 47);
  for (const row of readJsonl(predictions)) {
    if (semantic.has(`${row.solution}#${row.constraint}`)) assert.equal(row.verdict, 'unsure');
  }
});

test('checker: eval.mjs accepts the predictions (exit 0 or 1, never 2)', () => {
  const result = spawnSync(process.execPath, [EVAL, '--data', DEV, '--predictions', predictions], {
    encoding: 'utf8',
  });
  assert.ok(result.status === 0 || result.status === 1, result.stdout + result.stderr);
  assert.match(result.stdout, /wrongful deductions\s*:?\s*0\b/i);
});

test('checker: without MODEL_OFF and without a model key it still makes no network call', () => {
  const file = join(out, 'no-key.jsonl');
  const result = runChecker(['--dataset', DEV, '--out', file], {});
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readJsonl(file).length, 102);
});

test('checker: a folder that is not a dataset fails with a message and writes nothing', () => {
  const file = join(out, 'bad.jsonl');
  const result = runChecker(['--dataset', join(out, 'missing'), '--out', file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /problems/);
  assert.equal(existsSync(file), false);
});

test('checker: --dataset and --out are required', () => {
  const result = runChecker([]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--dataset/);
});
