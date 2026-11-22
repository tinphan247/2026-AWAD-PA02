// Runs in `npm test`: how the worker reads the runner's report.

import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRunnerOutput, sameOutput } from '../../src/sandbox/run.js';
import { createTar } from '../../src/sandbox/tar.js';

const b64 = (/** @type {string} */ text) => Buffer.from(text).toString('base64');
const tests = [
  { name: '01', output: '3\n' },
  { name: '02', output: '42\n' },
];

test('sandbox report: outputs are compared by the worker, not in the container', () => {
  const report = `COMPILE ok\nTEST 01 ok 5 ${b64('3\n')}\nTEST 02 ok 6 ${b64('41\n')}\nDONE\n`;
  const result = parseRunnerOutput(report, tests);
  assert.equal(result.verdict, 'WA');
  assert.deepEqual(
    result.tests.map((t) => t.verdict),
    ['AC', 'WA'],
  );
});

test('sandbox report: the first failing test decides the verdict', () => {
  const report = `COMPILE ok\nTEST 01 mle 80\nTEST 02 tle 3001\nDONE\n`;
  assert.equal(parseRunnerOutput(report, tests).verdict, 'MLE');
});

test('sandbox report: a test with no line was cut off by the deadline and is TLE', () => {
  const result = parseRunnerOutput(`COMPILE ok\nTEST 01 ok 5 ${b64('3')}\n`, tests);
  assert.equal(result.verdict, 'TLE');
  assert.equal(result.tests[1]?.reason, 'killed');
});

test('sandbox report: compile error and output limit', () => {
  assert.equal(parseRunnerOutput('COMPILE error\nDONE\n', tests).verdict, 'CE');
  const flood = parseRunnerOutput('COMPILE ok\nTEST 01 output-limit 40\nDONE\n', tests);
  assert.equal(flood.verdict, 'RE');
  assert.equal(flood.tests[0]?.reason, 'output-limit');
});

test('sandbox report: trailing spaces and blank lines do not matter, other spaces do', () => {
  assert.equal(sameOutput('1 2 3  \n\n\n', '1 2 3\n'), true);
  assert.equal(sameOutput('1 2 3\r\n', '1 2 3\n'), true);
  assert.equal(sameOutput('1  2 3\n', '1 2 3\n'), false);
});

test('sandbox input: the tar holds code and inputs in 512-byte blocks', () => {
  const tar = createTar([
    { name: 'submission.cpp', data: 'int main(){}' },
    { name: 'tests/01.in', data: '1 2\n' },
  ]);
  assert.equal(tar.length % 512, 0);
  assert.equal(tar.subarray(0, 14).toString(), 'submission.cpp');
  assert.equal(tar.subarray(257, 262).toString(), 'ustar');
});
