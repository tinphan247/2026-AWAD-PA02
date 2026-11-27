import test from 'node:test';
import assert from 'node:assert/strict';

import { createModelSemantic } from '../../src/checker/model-semantic.js';

const REPLY = {
  text: JSON.stringify({ verdict: 'pass', evidence: [], reason: 'fine' }),
  requestId: 'req',
  tokensIn: 10,
  tokensOut: 2,
  latencyMs: 1,
};

/** @param {number} status */
function httpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

const INPUT = {
  statement: 'Sort the array.',
  constraint: { id: 'C2', text: 'Sort it yourself.' },
  source: 'int main() {}\n',
  solution: 'sort-merge/s01',
};

test('the checker retries a rate-limited call (HTTP 429) after the retry delay', async () => {
  const waits = /** @type {number[]} */ ([]);
  let calls = 0;
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    maxRetries: 2,
    retryDelayMs: 5000,
    sleep: async (ms) => void waits.push(ms),
    callModel: async () => {
      calls += 1;
      if (calls === 1) throw httpError(429);
      return REPLY;
    },
  });

  const result = await semantic(INPUT);

  assert.equal(result.verdict, 'pass');
  assert.equal(calls, 2);
  assert.deepEqual(waits, [5000]);
});

test('the checker gives up after the retries and the pair stays unsure', async () => {
  let calls = 0;
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    maxRetries: 2,
    retryDelayMs: 1,
    sleep: async () => {},
    callModel: async () => {
      calls += 1;
      throw httpError(429);
    },
  });

  const result = await semantic(INPUT);

  assert.equal(result.verdict, 'unsure');
  assert.equal(calls, 3);
});

test('the checker does not retry an error that is not a rate limit', async () => {
  let calls = 0;
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelayMs: 1,
    sleep: async () => {},
    callModel: async () => {
      calls += 1;
      throw httpError(500);
    },
  });

  const result = await semantic(INPUT);

  assert.equal(result.verdict, 'unsure');
  assert.equal(calls, 1);
});

test('the checker spaces consecutive model calls by the minimum interval', async () => {
  let clock = 1_000;
  const waits = /** @type {number[]} */ ([]);
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    minIntervalMs: 7000,
    clock: () => clock,
    sleep: async (ms) => {
      waits.push(ms);
      clock += ms;
    },
    callModel: async () => {
      clock += 1000; // the call itself takes one second
      return REPLY;
    },
  });

  await semantic(INPUT);
  await semantic(INPUT);
  await semantic(INPUT);

  // The first call goes at once. Each later call starts 7000 ms after the
  // previous one started: 7000 - 1000 (the call) = 6000 ms of waiting.
  assert.deepEqual(waits, [6000, 6000]);
});

test('without pacing options the checker waits for nothing', async () => {
  const waits = /** @type {number[]} */ ([]);
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sleep: async (ms) => void waits.push(ms),
    callModel: async () => REPLY,
  });

  await semantic(INPUT);
  await semantic(INPUT);

  assert.deepEqual(waits, []);
});
