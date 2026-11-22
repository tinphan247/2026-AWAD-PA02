// Nine attack submissions, one per sandbox minimum in the class brief
// (PA3_PLAN.md §4.2). They need Docker and the sandbox image, so they run
// with `npm run test:sandbox` (CI job `sandbox`) and are skipped by
// `npm test`, which must pass with the network cut.
//
// Most attacks check themselves: they print a safe word ("blocked",
// "nonroot", ...) only when the sandbox held, so Accepted means defended.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { runInSandbox } from '../../src/sandbox/run.js';

const enabled =
  process.env.npm_lifecycle_event === 'test:sandbox' || process.env.SANDBOX_TESTS === '1';
const image = process.env.SANDBOX_IMAGE ?? 'leetkob-sandbox:test';
const skip = enabled ? false : 'needs Docker: run `npm run test:sandbox`';

/** @param {string} name */
function attack(name) {
  return readFileSync(new URL(`./attacks/${name}.cpp`, import.meta.url), 'utf8');
}

/**
 * @param {string} sourceCode
 * @param {string} expected
 * @param {Partial<Parameters<typeof runInSandbox>[0]>} [extra]
 */
function judge(sourceCode, expected = '', extra) {
  return runInSandbox({
    image,
    sourceCode,
    tests: [{ name: '01', input: '', output: expected }],
    ...extra,
  });
}

/** @param {string} containerName */
function containerExists(containerName) {
  const out = execFileSync('docker', ['ps', '-a', '-q', '--filter', `name=^${containerName}$`], {
    encoding: 'utf8',
  });
  return out.trim().length > 0;
}

test(
  'sandbox: an honest submission is Accepted, a wrong one gets WA, a broken one CE',
  { skip },
  async () => {
    const sum =
      '#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}';
    const tests = [
      { name: '01', input: '1 2\n', output: '3\n' },
      { name: '02', input: '40 2\n', output: '42\n' },
    ];
    assert.equal((await runInSandbox({ image, sourceCode: sum, tests })).verdict, 'AC');

    const wrong = sum.replace('a+b', 'a-b');
    const wa = await runInSandbox({ image, sourceCode: wrong, tests });
    assert.equal(wa.verdict, 'WA');

    const broken = await runInSandbox({ image, sourceCode: 'int main( {', tests });
    assert.equal(broken.verdict, 'CE');
    assert.equal(broken.compile, 'error');
  },
);

test('sandbox minimum 1: no network', { skip }, async () => {
  assert.equal((await judge(attack('01-network'), 'blocked\n')).verdict, 'AC');
});

test('sandbox minimum 2: CPU time limit ends a busy loop as TLE', { skip }, async () => {
  const started = Date.now();
  const result = await judge(attack('02-cpu'));
  assert.equal(result.verdict, 'TLE');
  assert.ok(Date.now() - started < 20_000, 'the run must not wait for a long timeout');
});

test(
  'sandbox minimum 3: wall-clock limit ends a sleeper and its escaped child',
  { skip },
  async () => {
    const started = Date.now();
    const result = await judge(attack('03-wall'));
    assert.equal(result.verdict, 'TLE');
    assert.ok(Date.now() - started < 20_000);
    assert.equal(containerExists(result.containerName), false);
  },
);

test(
  'sandbox minimum 3: the worker kills the whole container at its deadline',
  { skip },
  async () => {
    // CPU 5 s gives a 15 s per-test wall limit; the worker's deadline is 4 s,
    // so only the container kill can stop this run.
    const started = Date.now();
    const result = await judge(attack('03-wall'), '', {
      limits: { cpuSec: 5 },
      hostTimeoutMs: 4_000,
    });
    assert.equal(result.killedByHost, true);
    assert.equal(result.verdict, 'TLE');
    assert.ok(Date.now() - started < 20_000);
    assert.equal(containerExists(result.containerName), false);
  },
);

test('sandbox minimum 4: memory and swap limit stop a 1 GiB allocation', { skip }, async () => {
  const result = await judge(attack('04-memory'));
  assert.ok(['MLE', 'RE'].includes(result.verdict), `got ${result.verdict}`);
});

test('sandbox minimum 5: process limit caps a fork storm', { skip }, async () => {
  assert.equal((await judge(attack('05-processes'), 'capped\n')).verdict, 'AC');
});

test('sandbox minimum 6: output limit cuts a 256 MB flood', { skip }, async () => {
  const started = Date.now();
  const result = await judge(attack('06-output'));
  assert.equal(result.verdict, 'RE');
  assert.equal(result.tests[0]?.reason, 'output-limit');
  assert.ok(Date.now() - started < 20_000);
});

test('sandbox minimum 7: the submission does not run as root', { skip }, async () => {
  assert.equal((await judge(attack('07-root'), 'nonroot\n')).verdict, 'AC');
});

test('sandbox minimum 8: no host mount and no Docker socket', { skip }, async () => {
  assert.equal((await judge(attack('08-host'), 'isolated\n')).verdict, 'AC');
});

test('sandbox minimum 9: worker secrets never reach the submission', { skip }, async () => {
  const saved = { key: process.env.MODEL_API_KEY, db: process.env.DATABASE_URL };
  process.env.MODEL_API_KEY = 'leetkob-canary-model-key';
  process.env.DATABASE_URL = 'postgresql://leetkob-canary:pw@db.invalid/leetkob';
  try {
    assert.equal((await judge(attack('09-secrets'), 'clean\n')).verdict, 'AC');
  } finally {
    for (const [name, value] of [
      ['MODEL_API_KEY', saved.key],
      ['DATABASE_URL', saved.db],
    ]) {
      if (value === undefined) delete process.env[/** @type {string} */ (name)];
      else process.env[/** @type {string} */ (name)] = value;
    }
  }
});

test(
  'sandbox minimum 9: compiling happens in the sandbox, so #include cannot reach a secret',
  { skip },
  async () => {
    const result = await judge(attack('09-secrets-include'));
    assert.equal(result.verdict, 'CE');
  },
);
