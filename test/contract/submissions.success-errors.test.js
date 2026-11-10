/**
 * Contract tests: POST /v1/labs/{labId}/submissions — success and error cases.
 *
 * Written from docs/contract/post-labs-labId-submissions.md only. Each test is
 * named after the contract section it checks. Idempotency (§6) and
 * authentication/ownership (§3) are covered by other test files.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import {
  INTERNAL_DETAIL,
  LABS,
  MISSING_LAB,
  PROBLEMS,
  TOKENS,
  USERS,
  assertProblem,
  assertSubmission,
  assertValidation,
  byteLength,
  request,
  startApp,
  validBody,
} from './helpers.js';

const KiB = 1024;
const MAX_SOURCE_BYTES = 64 * KiB; // §5.3
const MAX_BODY_BYTES = 128 * KiB; // §2, §5.4 step 6

/** `{"sourceCode":"<fill>"}` with `fill` chosen so the body is exactly `bytes` long. */
function bodyOfExactSize(/** @type {number} */ bytes) {
  const overhead = byteLength(JSON.stringify({ sourceCode: '' }));
  return JSON.stringify({ sourceCode: 'a'.repeat(bytes - overhead) });
}

/** @type {import('./helpers.js').TestApp} */
let app;

beforeEach(async () => {
  app = await startApp();
});

afterEach(async () => {
  const current = app;
  // Reset so a failed startApp() in the next test does not close this app twice.
  app = /** @type {any} */ (undefined);
  await current?.close();
});

// ---------------------------------------------------------------------------
// §4, §5.4 step 12 — 201 Created
// ---------------------------------------------------------------------------

describe('201 Created (§4, §5.4 step 12)', () => {
  test('contract §5.4 step 12 — valid request → 201 with the Submission, status "queued", no Location', async () => {
    const res = await request(app.baseUrl);

    const submission = await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
    assert.deepEqual(Object.keys(submission).sort(), [
      'id',
      'labId',
      'status',
      'studentId',
      'submittedAt',
    ]);
  });

  test('contract §6 — the first, original 201 does not carry Idempotent-Replayed', async () => {
    const res = await request(app.baseUrl);

    assert.equal(res.status, 201);
    assert.equal(res.headers.get('idempotent-replayed'), null);
  });

  test('contract §5.4 step 12 — exactly 1 submission is stored', async () => {
    await assertSubmission(await request(app.baseUrl), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    assert.equal(app.submissionCount(), 1);
    assert.equal(app.submissionCount({ studentId: USERS.S1.id, labId: LABS.A1 }), 1);
  });

  test('contract §3, §4 — studentId comes from the token, never from the body', async () => {
    const res = await request(app.baseUrl, {
      token: TOKENS.S4,
      body: validBody({ studentId: USERS.S1.id }),
    });

    await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S4.id });
    assert.equal(app.submissionCount({ studentId: USERS.S1.id }), 0);
  });

  test('contract §1, §5.3 — unknown body fields (studentId, labId, status, id) are ignored', async () => {
    const res = await request(app.baseUrl, {
      labId: LABS.A2,
      body: validBody({ studentId: 999999, labId: LABS.B1, status: 'graded', id: 1 }),
    });

    await assertSubmission(res, { labId: LABS.A2, studentId: USERS.S1.id });
  });

  test('contract §4, §10 — the submitted source code is not in the response', async () => {
    const sourceCode = 'int main() { /* marker-4f7c1e0b-not-echoed */ return 0; }';

    const res = await request(app.baseUrl, { body: { sourceCode } });

    await assertSubmission(res, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
      mustNotContain: ['marker-4f7c1e0b-not-echoed', TOKENS.S1],
    });
  });

  test('contract §4 — submittedAt is the server time of creation', async () => {
    const res = await request(app.baseUrl);

    const submission = await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
    assert.equal(submission.submittedAt, app.now().toISOString());
  });

  test('contract §5 — two requests with different keys create two submissions with different ids', async () => {
    const first = await assertSubmission(await request(app.baseUrl), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    const second = await assertSubmission(await request(app.baseUrl), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    assert.notEqual(first.id, second.id);
    assert.equal(app.submissionCount(), 2);
  });

  test('contract §1 — a query string is ignored', async () => {
    const res = await request(app.baseUrl, { path: `/v1/labs/${LABS.A1}/submissions?x=1` });

    await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §5.3 — sourceCode of exactly 64 KiB → 201', async () => {
    const res = await request(app.baseUrl, { body: { sourceCode: 'a'.repeat(MAX_SOURCE_BYTES) } });

    await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §1, §5.3 — 64 KiB is counted in UTF-8 bytes: 32,768 × "é" (65,536 bytes) → 201', async () => {
    const sourceCode = 'é'.repeat(MAX_SOURCE_BYTES / 2);
    assert.equal(byteLength(sourceCode), MAX_SOURCE_BYTES);

    const res = await request(app.baseUrl, { body: { sourceCode } });

    await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
  });
});

// ---------------------------------------------------------------------------
// §5.3, §5.4 step 11 — 400 validation
// ---------------------------------------------------------------------------

describe('400 validation (§5.3, §5.4 step 11)', () => {
  /** @type {Array<[string, unknown]>} */
  const badSourceCode = [
    ['missing sourceCode', {}],
    ['sourceCode is a number', { sourceCode: 42 }],
    ['sourceCode is null', { sourceCode: null }],
    ['sourceCode is an array', { sourceCode: ['int main() {}'] }],
    ['sourceCode is an object', { sourceCode: { text: 'int main() {}' } }],
    ['sourceCode is a boolean', { sourceCode: true }],
    ['sourceCode is empty', { sourceCode: '' }],
    ['sourceCode is only whitespace', { sourceCode: '  \n\t\r  ' }],
    ['sourceCode is over 64 KiB', { sourceCode: 'a'.repeat(MAX_SOURCE_BYTES + 1) }],
    [
      'sourceCode is over 64 KiB in UTF-8 bytes but not in characters (32,769 × "é")',
      { sourceCode: 'é'.repeat(MAX_SOURCE_BYTES / 2 + 1) },
    ],
  ];

  for (const [name, body] of badSourceCode) {
    test(`contract §5.3 — ${name} → 400 validation, pointer /sourceCode`, async () => {
      const res = await request(app.baseUrl, { body });

      await assertValidation(res, ['/sourceCode']);
      assert.equal(app.submissionCount(), 0);
    });
  }

  /** @type {Array<[string, unknown]>} */
  const notAnObject = [
    ['an array', [{ sourceCode: 'int main() {}' }]],
    ['null', null],
    ['a number', 42],
    ['a string', 'int main() {}'],
    ['true', true],
    ['false', false],
  ];

  for (const [name, body] of notAnObject) {
    test(`contract §5.3 — body is ${name} → 400 validation, pointer ""`, async () => {
      const res = await request(app.baseUrl, { body });

      await assertValidation(res, ['']);
      assert.equal(app.submissionCount(), 0);
    });
  }

  test('contract §5.3, §10 — a validation error does not echo the submitted source code', async () => {
    const sourceCode = `/* marker-9a2d55c1-not-echoed */${'a'.repeat(MAX_SOURCE_BYTES)}`;

    const res = await request(app.baseUrl, { body: { sourceCode } });

    await assertValidation(res, ['/sourceCode'], { mustNotContain: ['marker-9a2d55c1'] });
  });
});

// ---------------------------------------------------------------------------
// §2, §5.2, §5.4 steps 4, 6, 7 — 415, 413, invalid JSON
// ---------------------------------------------------------------------------

describe('415, 413 and malformed JSON (§2, §5.2, §5.4 steps 4, 6, 7)', () => {
  test('contract §5.4 step 7 — invalid JSON → 400 invalid-json', async () => {
    const res = await request(app.baseUrl, { rawBody: '{"sourceCode": "int main() {}"' });

    await assertProblem(res, PROBLEMS.invalidJson);
    assert.equal(app.submissionCount(), 0);
  });

  test('contract §2, §5.4 step 7 — empty body → 400 invalid-json', async () => {
    const res = await request(app.baseUrl, { rawBody: '' });

    await assertProblem(res, PROBLEMS.invalidJson);
  });

  test('contract §5.4 step 4 — missing Content-Type → 415', async () => {
    const res = await request(app.baseUrl, { contentType: null });

    await assertProblem(res, PROBLEMS.unsupportedMediaType);
    assert.equal(app.submissionCount(), 0);
  });

  for (const contentType of [
    'text/plain',
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=x',
    'application/jsonp',
  ]) {
    test(`contract §5.4 step 4 — Content-Type ${contentType} → 415`, async () => {
      const res = await request(app.baseUrl, { contentType });

      await assertProblem(res, PROBLEMS.unsupportedMediaType);
    });
  }

  for (const contentType of [
    'application/json; charset=utf-8',
    'Application/JSON',
    'APPLICATION/JSON; charset=utf-8',
  ]) {
    test(`contract §5.2 — Content-Type ${contentType} is accepted → 201`, async () => {
      const res = await request(app.baseUrl, { contentType });

      await assertSubmission(res, { labId: LABS.A1, studentId: USERS.S1.id });
    });
  }

  test('contract §5.4 step 6 — body over 128 KiB → 413', async () => {
    const rawBody = bodyOfExactSize(MAX_BODY_BYTES + 1);
    assert.equal(byteLength(rawBody), MAX_BODY_BYTES + 1);

    const res = await request(app.baseUrl, { rawBody });

    await assertProblem(res, PROBLEMS.payloadTooLarge);
    assert.equal(app.submissionCount(), 0);
  });

  test('contract §5.4 step 6 — body of exactly 128 KiB is not too large (sourceCode over 64 KiB → 400 validation)', async () => {
    const rawBody = bodyOfExactSize(MAX_BODY_BYTES);
    assert.equal(byteLength(rawBody), MAX_BODY_BYTES);

    const res = await request(app.baseUrl, { rawBody });

    await assertValidation(res, ['/sourceCode']);
  });

  test('contract §5.4 order — step 4 before step 7: wrong Content-Type and invalid JSON → 415', async () => {
    const res = await request(app.baseUrl, { contentType: 'text/plain', rawBody: '{oops' });

    await assertProblem(res, PROBLEMS.unsupportedMediaType);
  });

  test('contract §5.4 order — step 6 before step 7: invalid JSON over 128 KiB → 413', async () => {
    const res = await request(app.baseUrl, { rawBody: `{${'x'.repeat(MAX_BODY_BYTES)}` });

    await assertProblem(res, PROBLEMS.payloadTooLarge);
  });

  test('contract §5.4 order — step 7 before step 8: invalid JSON to an unknown lab → 400 invalid-json', async () => {
    const res = await request(app.baseUrl, { labId: MISSING_LAB, rawBody: '{oops' });

    await assertProblem(res, PROBLEMS.invalidJson);
  });
});

// ---------------------------------------------------------------------------
// §1, §5.1, §5.4 steps 1 and 8 — 404 and 405
// ---------------------------------------------------------------------------

describe('404 and 405 (§1, §5.1, §5.4 steps 1, 8)', () => {
  test('contract §5.4 step 8 — unknown lab → 404', async () => {
    const res = await request(app.baseUrl, { labId: MISSING_LAB });

    await assertProblem(res, PROBLEMS.notFound);
    assert.equal(app.submissionCount(), 0);
  });

  for (const labId of ['abc', '0', '007', '-7', '+7', '7.0', '1e3', '%207', '9007199254740992']) {
    test(`contract §5.1 — labId "${labId}" is not a lab → 404`, async () => {
      const res = await request(app.baseUrl, { labId });

      await assertProblem(res, PROBLEMS.notFound);
    });
  }

  test('contract §5.4 order — step 8 before step 11: unknown lab with an invalid body → 404', async () => {
    const res = await request(app.baseUrl, { labId: MISSING_LAB, body: { sourceCode: '' } });

    await assertProblem(res, PROBLEMS.notFound);
  });

  for (const path of [
    `/v1/labs/${LABS.A1}/submissions/`,
    `/v1/labs/${LABS.A1}/submission`,
    `/v1/labs/${LABS.A1}`,
    '/v1/labs',
    '/v1/does-not-exist',
  ]) {
    test(`contract §1, §2, §5.4 step 1 — unknown path ${path} → 404`, async () => {
      const res = await request(app.baseUrl, { path });

      await assertProblem(res, PROBLEMS.notFound);
    });
  }

  test('contract §1 — there is no unversioned path: POST /labs/{labId}/submissions → 404', async () => {
    // §2 requires problem details only for /v1 paths, so only the status is checked.
    const res = await request(app.baseUrl, { path: `/labs/${LABS.A1}/submissions` });
    await res.body?.cancel();

    assert.equal(res.status, 404);
    assert.equal(app.submissionCount(), 0);
  });

  test('contract §5.4 step 1 — unknown /v1 path without a token → 404 before authentication', async () => {
    const res = await request(app.baseUrl, { path: '/v1/does-not-exist', token: null });

    await assertProblem(res, PROBLEMS.notFound);
  });

  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    test(`contract §5.4 step 1 — ${method} → 405 with Allow: POST`, async () => {
      const res = await request(app.baseUrl, { method });

      await assertProblem(res, PROBLEMS.methodNotAllowed);
    });
  }

  test('contract §5.4 step 1 — GET without a token → 405 before authentication', async () => {
    const res = await request(app.baseUrl, { method: 'GET', token: null });

    await assertProblem(res, PROBLEMS.methodNotAllowed);
  });

  test('contract §5.4 step 1 — GET with labId "abc" → 405 (labId is not checked yet)', async () => {
    const res = await request(app.baseUrl, { method: 'GET', labId: 'abc' });

    await assertProblem(res, PROBLEMS.methodNotAllowed);
  });
});

// ---------------------------------------------------------------------------
// §2 — 500 internal
// ---------------------------------------------------------------------------

describe('500 internal (§2)', () => {
  test('contract §2 — injected repo failure → 500 internal with the fixed detail and no stack trace', async () => {
    app.failNextCreate();
    const sourceCode = 'int main() { /* marker-0c3e8b7a-not-echoed */ }';

    const res = await request(app.baseUrl, { body: { sourceCode } });

    const problem = await assertProblem(res, {
      ...PROBLEMS.internal,
      mustNotContain: ['marker-0c3e8b7a', TOKENS.S1],
    });
    assert.equal(problem.detail, INTERNAL_DETAIL);
  });

  test('contract §6 — a failed create stores nothing', async () => {
    app.failNextCreate();

    const res = await request(app.baseUrl);

    await assertProblem(res, PROBLEMS.internal);
    assert.equal(app.submissionCount(), 0);
  });
});
