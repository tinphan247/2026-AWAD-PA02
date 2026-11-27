import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createModelSemantic } from '../../src/checker/model-semantic.js';
import { createCallLog } from '../../src/model/calllog.js';
import { callCostUsd } from '../../src/model/cost.js';

test('the checker model path maps evidence and logs a costed call with the dataset keys', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'leetkob-semantic-'));
  const file = join(dir, 'calls.jsonl');
  const semantic = createModelSemantic({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    callLog: createCallLog({ filePath: file }),
    now: () => new Date('2026-11-27T00:00:00.000Z'),
    callModel: async ({ user }) => {
      assert.match(user, /Keep the invariant/);
      return {
        text: JSON.stringify({
          verdict: 'violation',
          evidence: [{ line: 2, text: 'sort(a);' }],
          reason: 'the call breaks the invariant',
        }),
        requestId: 'req-1',
        tokensIn: 1000,
        tokensOut: 100,
        latencyMs: 7,
      };
    },
  });

  const result = await semantic({
    statement: 'Sort the array.',
    constraint: { id: 'C2', text: 'Keep the invariant.' },
    source: 'int main() {\n  sort(a);\n}\n',
    solution: 'sort-merge/s01',
  });

  assert.equal(result.verdict, 'violation');
  assert.deepEqual(result.evidence, [{ line: 2, text: 'sort(a);' }]);

  const lines = readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0);
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0] ?? '{}');
  assert.equal(entry.solution, 'sort-merge/s01');
  assert.equal(entry.constraint, 'C2');
  assert.equal(entry.requestId, 'req-1');
  assert.equal(entry.tokensIn, 1000);
  assert.equal(entry.tokensOut, 100);
  assert.equal(
    entry.costUsd,
    callCostUsd({ model: 'gemini-2.5-flash', tokensIn: 1000, tokensOut: 100 }),
  );
  assert.equal(entry.at, '2026-11-27T00:00:00.000Z');
  assert.match(entry.prompt, /Keep the invariant/);

  rmSync(dir, { recursive: true, force: true });
});
