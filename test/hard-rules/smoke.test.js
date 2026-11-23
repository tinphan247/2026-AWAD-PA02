import test from 'node:test';
import assert from 'node:assert/strict';

import { createHardRules } from '../../src/checker/hard-rules/index.js';

test('hard rules: the C++ grammar loads from the package, offline, and is reused', async () => {
  const first = await createHardRules();
  const second = await createHardRules();
  const banList = { names: ['goto'], unknown: [] };
  assert.equal(first.check('int main() { return 0; }\n', banList).verdict, 'pass');
  assert.equal(second.check('int main() { l: goto l; }\n', banList).verdict, 'violation');
});
