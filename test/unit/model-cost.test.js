import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { callCostUsd, summarizeLabCost } from '../../src/model/cost.js';
import { createCallLog, makeCallLogEntry } from '../../src/model/calllog.js';

test('callCostUsd uses the per-million list price', () => {
  // 1,000,000 input + 1,000,000 output tokens at the 2.5-flash price.
  assert.equal(
    callCostUsd({ model: 'gemini-2.5-flash', tokensIn: 1_000_000, tokensOut: 1_000_000 }),
    2.8,
  );
  assert.equal(callCostUsd({ model: 'gemini-2.5-flash', tokensIn: 1000, tokensOut: 200 }), 0.0008);
});

test('callCostUsd falls back to the 2.5-flash price for an unknown model', () => {
  assert.equal(callCostUsd({ model: 'unknown', tokensIn: 1_000_000, tokensOut: 0 }), 0.3);
});

test('summarizeLabCost adds calls, tokens and cost', () => {
  const summary = summarizeLabCost([
    { tokensIn: 100, tokensOut: 10, costUsd: 0.001 },
    { tokensIn: 200, tokensOut: 20, costUsd: 0.002 },
  ]);

  assert.deepEqual(summary, { calls: 2, tokensIn: 300, tokensOut: 30, costUsd: 0.003 });
});

test('call log writes one JSON line per call and reads it back', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'leetkob-calllog-'));
  const filePath = join(dir, 'calls.jsonl');
  const log = createCallLog({ filePath });

  const entry = makeCallLogEntry({
    submissionId: 7,
    constraintId: 2,
    model: 'gemini-2.5-flash',
    result: { requestId: 'req-1', tokensIn: 1000, tokensOut: 200, latencyMs: 250 },
    prompt: 'Code (comments and identity removed):\nint main() {}\n',
    at: new Date('2026-11-22T03:00:00.000Z'),
  });

  await log.record(entry);
  const entries = await log.read();

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], entry);
  assert.equal(entry.costUsd, 0.0008);
  assert.equal(entry.at, '2026-11-22T03:00:00.000Z');
  assert.ok(!entry.prompt.includes('23120372'));

  await rm(dir, { recursive: true, force: true });
});

test('call log returns an empty list when the file does not exist', async () => {
  const log = createCallLog({ filePath: join(tmpdir(), 'leetkob-missing-calls.jsonl') });

  assert.deepEqual(await log.read(), []);
});
