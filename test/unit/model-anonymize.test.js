import test from 'node:test';
import assert from 'node:assert/strict';

import { anonymizeCode, buildPrompt } from '../../src/model/prompt.js';

const SOURCE = [
  '// Author: Phan Trung Tin - 23120372',
  '#include <algorithm>',
  'using namespace std;',
  'int main() {',
  '  int a[3] = {3, 1, 2};',
  '  sort(a, a + 3); // std::sort, forbidden',
  '  /* block',
  '     comment with 23120372 */',
  '  cout << "23120372" << endl;',
  '  return 0;',
  '}',
].join('\n');

test('anonymizeCode blanks comments but keeps the line count', () => {
  const out = anonymizeCode(SOURCE);

  assert.equal(out.split('\n').length, SOURCE.split('\n').length);
  assert.equal(out.length, SOURCE.length);
  assert.ok(!out.includes('Author:'));
  assert.ok(!out.includes('forbidden'));
  assert.ok(!out.includes('block'));
  assert.ok(out.includes('#include <algorithm>'));
  assert.ok(out.includes('sort(a, a + 3);'));
});

test('anonymizeCode redacts the name and MSSV that survive in a string literal', () => {
  const out = anonymizeCode(SOURCE, { identities: ['Phan Trung Tin', '23120372'] });

  assert.ok(!out.includes('23120372'));
  assert.ok(!out.includes('Phan Trung Tin'));
  assert.ok(out.includes('[REDACTED]'));
});

test('anonymizeCode does not treat // inside a string literal as a comment', () => {
  const source = 'cout << "https://example.com";\nint x = 1;\n';
  const out = anonymizeCode(source);

  assert.ok(out.includes('"https://example.com"'));
  assert.ok(out.includes('int x = 1;'));
});

test('anonymizeCode redacts an email address inside a string literal', () => {
  const out = anonymizeCode('const char* e = "a@student.hcmus.edu.vn";\nint x;\n');

  assert.ok(!out.includes('a@student.hcmus.edu.vn'));
  assert.ok(out.includes('[EMAIL]'));
});

test('buildPrompt sends exactly one constraint and no deduction', () => {
  const { system, user } = buildPrompt({
    statement: 'Sort an array.',
    constraint: { id: 2, text: 'Do not call `std::sort`.' },
    code: 'int main() {}\n',
  });

  assert.match(system, /one JSON object/);
  assert.match(system, /never sets a deduction/);
  assert.match(user, /Constraint 2/);
  assert.match(user, /Do not call `std::sort`\./);
  assert.ok(!user.includes('deduction'));
});
