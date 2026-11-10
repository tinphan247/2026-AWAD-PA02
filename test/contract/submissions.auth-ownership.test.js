import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  LABS,
  MISSING_LAB,
  PROBLEMS,
  TOKENS,
  USERS,
  assertProblem,
  assertSubmission,
  request,
  startApp,
  validBody,
} from './helpers.js';

const sourceCode = 'int main() { return 17; }';

/** @type {Array<[string, NonNullable<Parameters<typeof request>[1]>, typeof PROBLEMS.unauthorized]>} */
const rejectedRequests = [
  ['§3 missing token', { token: null }, PROBLEMS.unauthorized],
  ['§3 unsupported scheme', { authorization: 'Basic synthetic' }, PROBLEMS.unauthorized],
  ['§3 unknown token', { token: 'unknown-test-token' }, PROBLEMS.unauthorized],
  ['§3 expired token', { token: TOKENS.EXPIRED }, PROBLEMS.unauthorized],
  ['§3 TA cannot submit', { token: TOKENS.TA }, PROBLEMS.forbidden],
  ['§3 admin cannot submit', { token: TOKENS.ADMIN }, PROBLEMS.forbidden],
  ['§3 student without enrollment', { token: TOKENS.S3 }, PROBLEMS.forbidden],
  ['§3 student enrolled in another class', { token: TOKENS.S2 }, PROBLEMS.forbidden],
  [
    '§3 body identity grants no enrollment',
    {
      token: TOKENS.S3,
      body: validBody({ sourceCode, studentId: USERS.S1.id }),
    },
    PROBLEMS.forbidden,
  ],
  ['§5.4 auth before lab lookup', { token: null, labId: MISSING_LAB }, PROBLEMS.unauthorized],
  ['§5.4 missing lab for authenticated student', { labId: MISSING_LAB }, PROBLEMS.notFound],
  ['§5.4 auth before content type', { token: null, contentType: null }, PROBLEMS.unauthorized],
  ['§5.4 role before content type', { token: TOKENS.TA, contentType: null }, PROBLEMS.forbidden],
  ['§5.4 JSON parsing before ownership', { token: TOKENS.S2, rawBody: '{' }, PROBLEMS.invalidJson],
  [
    '§5.4 ownership before field validation',
    {
      token: TOKENS.S2,
      body: validBody({ sourceCode: '   ' }),
    },
    PROBLEMS.forbidden,
  ],
  ['§5.2 absent idempotency key', { idempotencyKey: null }, PROBLEMS.idempotencyKeyMissing],
  ['§5.2 empty idempotency key', { idempotencyKey: '' }, PROBLEMS.idempotencyKeyMissing],
  [
    '§5.2 whitespace-only idempotency key',
    { idempotencyKey: '   ' },
    PROBLEMS.idempotencyKeyMissing,
  ],
  [
    '§5.2 idempotency key longer than 255 characters',
    {
      idempotencyKey: 'k'.repeat(256),
    },
    PROBLEMS.idempotencyKeyMissing,
  ],
];

for (const [scenario, options, expected] of rejectedRequests) {
  test('contract ' + scenario, async (t) => {
    const app = await startApp();
    t.after(app.close);
    const response = await request(app.baseUrl, { body: validBody({ sourceCode }), ...options });
    const token =
      options.authorization ?? options.token ?? (options.token === null ? '' : TOKENS.S1);
    await assertProblem(response, {
      ...expected,
      mustNotContain: token ? [sourceCode, token] : [sourceCode],
    });
    assert.equal(app.submissionCount(), 0);
  });
}

test('contract §3 uses the token identity rather than body, header or query claims', async (t) => {
  const app = await startApp();
  t.after(app.close);
  const claimedId = USERS.S4.id;
  const response = await request(app.baseUrl, {
    path: '/v1/labs/' + LABS.A1 + '/submissions?studentId=' + claimedId,
    headers: { 'x-student-id': String(claimedId) },
    body: validBody({ sourceCode, studentId: claimedId }),
  });
  await assertSubmission(response, {
    labId: LABS.A1,
    studentId: USERS.S1.id,
    mustNotContain: [sourceCode, TOKENS.S1],
  });
  assert.equal(app.submissionCount(), 1);
  assert.equal(app.submissionCount({ studentId: USERS.S1.id, labId: LABS.A1 }), 1);
});

test('contract §5.2 accepts an idempotency key of 255 characters', async (t) => {
  const app = await startApp();
  t.after(app.close);
  const response = await request(app.baseUrl, { idempotencyKey: 'k'.repeat(255) });
  await assertSubmission(response, { labId: LABS.A1, studentId: USERS.S1.id });
  assert.equal(app.submissionCount(), 1);
});
