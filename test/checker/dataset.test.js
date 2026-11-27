import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkDataset } from '../../src/checker/dataset.js';

test('the checker sends only semantic pairs to the model and passes the dataset keys', async () => {
  const root = mkdtempSync(join(tmpdir(), 'leetkob-dataset-'));
  const problem = join(root, 'problems', 'p1');
  const solution = join(root, 'solutions', 'p1');
  mkdirSync(problem, { recursive: true });
  mkdirSync(solution, { recursive: true });
  writeFileSync(join(problem, 'statement.md'), 'Sort the array.\n');
  writeFileSync(
    join(problem, 'constraints.json'),
    JSON.stringify([
      { id: 'C1', text: 'Do not call `std::sort`.' },
      { id: 'C2', text: 'Keep the invariant.' },
    ]),
  );
  writeFileSync(join(solution, 's01.cpp'), 'int main() { return 0; }\n');

  /** @type {{
   *   solution: string,
   *   constraint: { id: string, text: string },
   *   source: string,
   *   statement: string,
   * }[]} */
  const seen = [];
  const { predictions, decisions } = await checkDataset({
    dataset: root,
    semantic: async (input) => {
      seen.push(input);
      return { verdict: 'pass', evidence: [] };
    },
  });

  assert.deepEqual(
    predictions.map((p) => [p.solution, p.constraint, p.verdict]),
    [
      ['p1/s01', 'C1', 'pass'],
      ['p1/s01', 'C2', 'pass'],
    ],
  );
  assert.deepEqual(
    decisions.map((d) => d.decided_by),
    ['hard_rule', 'model'],
  );
  assert.equal(seen.length, 1);
  assert.equal(seen[0]?.solution, 'p1/s01');
  assert.equal(seen[0]?.constraint.id, 'C2');
  assert.equal(seen[0]?.statement, 'Sort the array.\n');
  assert.equal(seen[0]?.source, 'int main() { return 0; }\n');

  rmSync(root, { recursive: true, force: true });
});
