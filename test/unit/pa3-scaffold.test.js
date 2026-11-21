import test from 'node:test';
import assert from 'node:assert/strict';

import { isBanList } from '../../src/domain/labs.js';
import { validateVerdictOutput } from '../../src/model/schema.js';

test('pa3 scaffold: isBanList recognises ban-list constraints', () => {
  assert.equal(isBanList('Do not call `std::sort`.'), true);
  assert.equal(isBanList('Do not use `std::vector`.'), true);
  assert.equal(isBanList('Sort with a merge sort you wrote yourself.'), false);
});

test('pa3 scaffold: verdict schema rejects malformed output', () => {
  assert.equal(validateVerdictOutput({ verdict: 'pass', evidence: [], reason: '' }).ok, true);
  assert.equal(validateVerdictOutput({ verdict: 'nope' }).ok, false);
  assert.equal(validateVerdictOutput(null).ok, false);
});
