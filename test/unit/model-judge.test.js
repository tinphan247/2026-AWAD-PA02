import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createCallLog } from '../../src/model/calllog.js';
import { judgeConstraint, parseModelJson, verifyEvidence } from '../../src/model/judge.js';

const SOURCE = [
  '#include <algorithm>',
  '// Author: 23120372',
  'using namespace std;',
  'int main() {',
  '  int a[2] = {2, 1};',
  '  sort(a, a + 2); // forbidden',
  '}',
].join('\n');

const CONSTRAINT = { id: 2, text: 'Do not call `std::sort`.' };

/** @param {unknown} payload @param {string} [text] */
function reply(payload, text = JSON.stringify(payload)) {
  return { text, requestId: 'req-1', tokensIn: 100, tokensOut: 20, latencyMs: 5 };
}

test('a violation maps the evidence back to the original line', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    identities: ['23120372'],
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () =>
      reply({
        verdict: 'violation',
        evidence: [{ line: 6, text: 'sort(a, a + 2);' }],
        reason: 'uses std::sort',
      }),
  });

  assert.equal(result.verdict, 'violation');
  assert.equal(result.decidedBy, 'model');
  assert.equal(result.unsureReason, null);
  assert.deepEqual(result.evidence, [{ line: 6, text: 'sort(a, a + 2); // forbidden' }]);
  assert.ok(result.call);
  assert.equal(result.call.requestId, 'req-1');
});

test('the prompt sent to the model never contains an identity that survives in a string literal', async () => {
  let capturedUser = '';
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: 'int main() { cout << "Alice 23120372"; }\\n',
    identities: ['Alice', '23120372'],
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async ({ user }) => {
      capturedUser = user;
      return reply({ verdict: 'pass', evidence: [], reason: 'ok' });
    },
  });

  assert.equal(result.verdict, 'pass');
  assert.ok(!capturedUser.includes('Alice'));
  assert.ok(!capturedUser.includes('23120372'));
  assert.ok(capturedUser.includes('[REDACTED]'));
});
test('a pass drops any evidence the model returned', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () =>
      reply({ verdict: 'pass', evidence: [{ line: 6, text: 'sort(a, a + 2);' }], reason: '' }),
  });

  assert.equal(result.verdict, 'pass');
  assert.deepEqual(result.evidence, []);
});

test('evidence that does not match the code becomes unsure', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () =>
      reply({
        verdict: 'violation',
        evidence: [{ line: 6, text: 'std::sort(a, a + 2);' }],
        reason: 'invented line',
      }),
  });

  assert.equal(result.verdict, 'unsure');
  assert.equal(result.decidedBy, 'fallback');
  assert.equal(result.unsureReason, 'evidence_mismatch');
  assert.deepEqual(result.evidence, []);
});

test('an out-of-range evidence line becomes unsure', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () =>
      reply({ verdict: 'violation', evidence: [{ line: 99, text: 'sort(a);' }], reason: '' }),
  });

  assert.equal(result.unsureReason, 'evidence_mismatch');
});

test('a malformed model reply becomes unsure with schema_invalid', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () => reply({}, 'not json'),
  });

  assert.equal(result.verdict, 'unsure');
  assert.equal(result.unsureReason, 'schema_invalid');
});

test('a timeout becomes unsure with timeout and no evidence', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () => {
      const error = /** @type {any} */ (new Error('timeout'));
      error.code = 'TIMEOUT';
      throw error;
    },
  });

  assert.equal(result.verdict, 'unsure');
  assert.equal(result.unsureReason, 'timeout');
  assert.equal(result.call, null);
});

test('the cost cap skips the call entirely', async () => {
  let called = false;
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    costCapUsd: 0.01,
    spentUsd: 0.01,
    callModel: async () => {
      called = true;
      return reply({ verdict: 'pass', evidence: [], reason: '' });
    },
  });

  assert.equal(called, false);
  assert.equal(result.verdict, 'unsure');
  assert.equal(result.unsureReason, 'cost_cap');
  assert.equal(result.call, null);
});

test('a model that answers unsure stays unsure and is attributed to the model', async () => {
  const result = await judgeConstraint({
    submissionId: 1,
    statement: 'Sort the array.',
    constraint: CONSTRAINT,
    sourceCode: SOURCE,
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callModel: async () => reply({ verdict: 'unsure', evidence: [], reason: 'ambiguous' }),
  });

  assert.equal(result.verdict, 'unsure');
  assert.equal(result.decidedBy, 'model');
  assert.equal(result.unsureReason, 'model_unsure');
});

test('the call log keeps the anonymised prompt and no identity', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'leetkob-judge-'));
  const callLog = createCallLog({ filePath: join(dir, 'calls.jsonl') });

  try {
    const result = await judgeConstraint({
      submissionId: 7,
      statement: 'Sort the array.',
      constraint: CONSTRAINT,
      sourceCode: SOURCE,
      identities: ['23120372'],
      apiKey: 'test-key',
      model: 'gemini-2.5-flash',
      callLog,
      callModel: async () =>
        reply(
          { verdict: 'pass', evidence: [], reason: '' },
          '```json\n{"verdict":"pass","evidence":[],"reason":""}\n```',
        ),
    });

    assert.equal(result.verdict, 'pass');

    const entries = await callLog.read();
    assert.equal(entries.length, 1);
    const entry = entries[0];
    assert.ok(entry);
    assert.equal(entry.submissionId, 7);
    assert.equal(entry.constraintId, 2);
    assert.equal(entry.requestId, 'req-1');
    assert.ok(!entry.prompt.includes('23120372'));
    assert.ok(!entry.prompt.includes('forbidden'));
    assert.ok(entry.prompt.includes('sort(a, a + 2);'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('parseModelJson accepts a markdown fence and verifyEvidence maps the original text', () => {
  const parsed = parseModelJson('```json\n{"verdict":"pass","evidence":[],"reason":""}\n```');
  assert.deepEqual(parsed, { verdict: 'pass', evidence: [], reason: '' });

  const mapped = verifyEvidence({
    evidence: [{ line: 2, text: 'int x = 1;' }],
    anonymizedLines: ['// c', 'int x = 1;'],
    originalLines: ['// c', 'int x = 1;'],
  });
  assert.deepEqual(mapped, [{ line: 2, text: 'int x = 1;' }]);
});
