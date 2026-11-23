// Syntax-aware ban-list rules on small C++ fixtures: what is caught, what is a
// trap that must not fire, and what is left to the TA as `unsure`.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createHardRules, parseBanList } from '../../src/checker/hard-rules/index.js';

const rules = await createHardRules();

/** One backslash, so a fixture shows a line splice without escape arithmetic. */
const BS = '\\';

const SORT =
  'Do not call a library sort function: `std::sort`, `std::stable_sort`, `std::ranges::sort`, `qsort`.';
const LOOPS =
  'Do not use loop statements: `for`, `while`, `do`-`while`, range-based `for`, or `goto`.';
const CONTAINERS = 'Do not use any of these standard containers: `std::vector`, `std::string`.';
const REVERSE =
  'Do not use `std::reverse`, or reverse iterators (`rbegin`, `rend`, `std::reverse_iterator`).';
const GCD = 'Do not use a library gcd/lcm function: `std::gcd`, `__gcd`, `boost::integer::gcd`.';

/**
 * @param {string} constraint
 * @param {string} source
 */
function check(constraint, source) {
  const banList = parseBanList(constraint);
  assert.ok(banList, 'fixture constraint must be a ban list');
  return rules.check(source, banList);
}

/** @param {ReturnType<typeof check>} result */
const lines = (result) => result.evidence.map((e) => e.line);

test('hard rule: a qualified std::sort call is a violation with the original line as evidence', () => {
  const result = check(
    SORT,
    '#include <algorithm>\nint main() {\n    std::sort(a, a + n); // done\n}\n',
  );
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(result.evidence, [{ line: 3, text: '    std::sort(a, a + n); // done' }]);
  assert.equal(result.decidedBy, 'hard_rule');
});

test('hard rule: an unqualified sort call after using namespace std is a violation', () => {
  const result = check(
    SORT,
    'using namespace std;\nint main() {\n  sort(v.begin(), v.end());\n}\n',
  );
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [3]);
});

test('hard rule: template arguments do not hide the banned name', () => {
  assert.deepEqual(lines(check(SORT, 'int main() {\n  std::sort<int*>(a, b);\n}\n')), [2]);
});

test('hard rule: a global function such as qsort is caught, also written ::qsort', () => {
  const result = check(SORT, 'int main() {\n  qsort(a, n, 4, cmp);\n  ::qsort(a, n, 4, cmp);\n}\n');
  assert.deepEqual(lines(result), [2, 3]);
});

test('hard rule (trap): std::sort in a comment, a string or a raw string is not a violation', () => {
  const source = [
    '#include <algorithm> // for std::sort? no',
    '/* std::sort(a, a + n); */',
    'int main() {',
    '  const char* s = "std::sort(a, a + n)";',
    '  auto r = R"(sort(v.begin(), v.end()))";',
    '}',
  ].join('\n');
  assert.equal(check(SORT, source).verdict, 'pass');
});

test('hard rule (trap): the student own sort in a namespace, called as my::sort and recursively', () => {
  const source = [
    'using namespace std;',
    'namespace my {',
    '  void sort(int* a, int lo, int hi) {',
    '    if (hi - lo < 2) return;',
    '    sort(a, lo, (lo + hi) / 2);',
    '  }',
    '}',
    'int main() { my::sort(a, 0, n); }',
  ].join('\n');
  assert.equal(check(SORT, source).verdict, 'pass');
});

test('hard rule (trap): a file-level function, a lambda, a parameter and a variable named sort', () => {
  for (const source of [
    'void sort(int* a, int n) {}\nint main() { sort(a, n); }\n',
    'int main() {\n  auto sort = [](int* a, int n) {};\n  sort(a, n);\n}\n',
    'void go(void (*sort)(int*, int)) { sort(a, n); }\n',
    'struct S { void sort(); void f() { sort(); } };\n',
    'int main() { int sort = 3; return sort; }\n',
  ]) {
    assert.equal(check(SORT, source).verdict, 'pass', source);
  }
});

test('hard rule (trap): a name that only contains the banned one, such as resort, is not banned', () => {
  assert.equal(check(SORT, 'void resort(int* a) {}\nint main() { resort(a); }\n').verdict, 'pass');
});

test('hard rule: an unqualified sort outside the namespace that declares the student sort is unsure', () => {
  const source = [
    'using namespace std;',
    'namespace my { void sort(int* a, int n) {} }',
    'int main() { sort(v.begin(), v.end()); }',
  ].join('\n');
  const result = check(SORT, source);
  assert.equal(result.verdict, 'unsure');
  assert.equal(result.unsureReason, 'hard_rule_unsure');
  assert.deepEqual(lines(result), [3]);
});

test('hard rule: std::ranges::sort bans ranges::sort but not a plain sort the student wrote', () => {
  const ranges = 'Do not call `std::ranges::sort`.';
  assert.equal(check(ranges, 'void sort(int*);\nint main() { sort(a); }\n').verdict, 'pass');
  assert.deepEqual(
    lines(check(ranges, 'using namespace std;\nint main() {\n  ranges::sort(v);\n}\n')),
    [3],
  );
});

test('hard rule: a namespace alias of std does not hide the banned call', () => {
  const result = check(SORT, 'namespace S = std;\nint main() {\n  S::sort(a, a + n);\n}\n');
  assert.deepEqual(lines(result), [3]);
});

test('hard rule: a boost name is caught in full, or short after using namespace boost::integer', () => {
  assert.deepEqual(lines(check(GCD, 'int g = boost::integer::gcd(a, b);\n')), [1]);
  assert.deepEqual(lines(check(GCD, 'using namespace boost::integer;\nint g = gcd(a, b);\n')), [2]);
});

test('hard rule: __gcd is a global function', () => {
  assert.deepEqual(lines(check(GCD, 'int main() {\n  long long g = __gcd(a, b);\n}\n')), [2]);
});

test('hard rule: loop statements are caught as statements, every kind', () => {
  const source = [
    'int main() {',
    '  for (int i = 0; i < n; i++) {}',
    '  for (auto& x : v) {}',
    '  while (n--) {}',
    '  do { n++; } while (n < 3);',
    'again:',
    '  goto again;',
    '}',
  ].join('\n');
  const result = check(LOOPS, source);
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [2, 3, 4, 5, 7]);
});

test('hard rule (trap): loop words in comments and identifiers are not loops', () => {
  const source = '// no for or while here\nint forward(int whilst) { return whilst; }\n';
  assert.equal(check(LOOPS, source).verdict, 'pass');
});

test('hard rule: a loop hidden in a macro that is used is caught on the #define line', () => {
  const source = [
    '#define FOR(i, a, b) for (int i = (a); i < (b); ++i)',
    'int main() {',
    '  FOR(i, 0, n) { s += a[i]; }',
    '}',
  ].join('\n');
  const result = check(LOOPS, source);
  assert.equal(result.verdict, 'violation');
  assert.ok(lines(result).includes(1));
});

test('hard rule: a macro whose body calls std::sort is caught when the macro is used', () => {
  const source = [
    '#define all(v) (v).begin(), (v).end()',
    '#define SORT(v) std::sort(all(v))',
    'int main() {',
    '  SORT(v);',
    '}',
  ].join('\n');
  const result = check(SORT, source);
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [2, 4]);
});

test('hard rule: a template macro with a banned name that is never used is unsure, not a violation', () => {
  const source = '#define SORT(v) std::sort((v).begin(), (v).end())\nint main() { return 0; }\n';
  const result = check(SORT, source);
  assert.equal(result.verdict, 'unsure');
  assert.deepEqual(lines(result), [1]);
});

test('hard rule: a macro standing for std does not hide the banned call', () => {
  const result = check(SORT, '#define NS std\nint main() {\n  NS::sort(a, a + n);\n}\n');
  assert.equal(result.verdict, 'violation');
  assert.ok(lines(result).includes(3));
});

test('hard rule: a banned container is caught as a type, qualified or after using namespace std', () => {
  assert.deepEqual(lines(check(CONTAINERS, 'int main() {\n  std::vector<int> a;\n}\n')), [2]);
  assert.deepEqual(
    lines(
      check(CONTAINERS, 'using namespace std;\nint main() {\n  vector<int> a;\n  string s;\n}\n'),
    ),
    [3, 4],
  );
});

test('hard rule: a member of a banned type, such as std::string::npos, uses the type', () => {
  assert.deepEqual(
    lines(check(CONTAINERS, 'bool f(long e) {\n  return e == std::string::npos;\n}\n')),
    [2],
  );
});

test('hard rule: a typedef of a banned type is a violation when the alias is used', () => {
  const source = [
    'typedef std::vector<int> Buffer;',
    'int main() {',
    '  Buffer b;',
    '  b.push_back(1);',
    '}',
  ].join('\n');
  const result = check(CONTAINERS, source);
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [1, 3]);
});

test('hard rule: a typedef of a banned type that is never used is unsure', () => {
  const result = check(CONTAINERS, 'typedef std::vector<int> vi;\nint main() { return 0; }\n');
  assert.equal(result.verdict, 'unsure');
});

test('hard rule (trap): the student own vector class in a namespace is not std::vector', () => {
  const source = [
    'namespace ds {',
    '  class vector {',
    '  public:',
    '    ~vector() {}',
    '    void push_back(int x) {}',
    '  };',
    '}',
    'int main() { ds::vector v; v.push_back(1); }',
  ].join('\n');
  assert.equal(check(CONTAINERS, source).verdict, 'pass');
});

test('hard rule: reverse iterators are caught as member calls', () => {
  const result = check(
    REVERSE,
    'std::string lat(const std::string& w) {\n  return std::string(w.rbegin(), w.rend());\n}\n',
  );
  assert.deepEqual(lines(result), [2]);
});

test('hard rule (trap): a member call that shares a name with a banned qualified function is not it', () => {
  const FIND = 'Do not use a library search function: `std::find`.';
  assert.equal(check(FIND, 'int main() {\n  size_t e = s.find(1);\n}\n').verdict, 'pass');
});

test('hard rule: a nested type that only ends like the banned one is unsure', () => {
  const result = check(REVERSE, 'int main() {\n  std::vector<int>::reverse_iterator it;\n}\n');
  assert.equal(result.verdict, 'unsure');
});

test('hard rule: new and delete are caught as expressions', () => {
  const NEW = 'Do not use `new[]` or `delete`.';
  const result = check(NEW, 'int main() {\n  int* a = new int[3];\n  delete[] a;\n}\n');
  assert.deepEqual(lines(result), [2, 3]);
});

test('hard rule: a constraint with an item the rule cannot read is unsure when nothing else matches', () => {
  const result = check('Do not use `<algorithm>` or `std::sort`.', 'int main() { return 0; }\n');
  assert.equal(result.verdict, 'unsure');
  assert.equal(result.unsureReason, 'hard_rule_unsure');
});

test('hard rule: a banned name inside code the parser could not read is unsure, not a violation', () => {
  const result = check(SORT, 'int main() {\n  std::sort(a, a + n\n  int x = ;\n');
  assert.notEqual(result.verdict, 'violation');
});

test('hard rule: Windows line endings do not change the evidence text', () => {
  const result = check(SORT, 'int main() {\r\n  std::sort(a, a + n);\r\n}\r\n');
  assert.deepEqual(result.evidence, [{ line: 2, text: '  std::sort(a, a + n);' }]);
});

test('hard rule: a banned name split by a backslash-newline splice is still a violation', () => {
  const result = check(SORT, `int main() {\n  std::so${BS}\nrt(a, a + 3);\n}\n`);
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [2]);
  assert.equal(result.evidence[0]?.text, `  std::so${BS}`);
});

test('hard rule: a splice written with CRLF line endings joins the name too', () => {
  const result = check(SORT, `int main() {\r\n  std::so${BS}\r\nrt(a, a + 3);\r\n}\r\n`);
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [2]);
});

test('hard rule: evidence keeps the original line number after an earlier splice', () => {
  const result = check(
    SORT,
    `#define TWO 1 + ${BS}\n  1\nint main() {\n  std::sort(a, a + n);\n}\n`,
  );
  assert.equal(result.verdict, 'violation');
  assert.deepEqual(lines(result), [4]);
  assert.equal(result.evidence[0]?.text, '  std::sort(a, a + n);');
});

test('hard rule: a banned name inside a string is not matched, even when a splice joins it', () => {
  const result = check(SORT, `int main() {\n  const char* s = "std::so${BS}\nrt";\n}\n`);
  assert.equal(result.verdict, 'pass');
});

test('hard rule: a line comment ended by a splice swallows the next line, as the compiler reads it', () => {
  const result = check(SORT, `int main() {\n  // note ${BS}\n  std::sort(a, a + n);\n}\n`);
  assert.equal(result.verdict, 'pass');
});

test('hard rule: a backslash that does not end a line changes nothing', () => {
  const result = check(SORT, `int main() {\n  char c = '${BS}${BS}';\n  std::sort(a, a + n);\n}\n`);
  assert.deepEqual(lines(result), [3]);
});
