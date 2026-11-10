/**
 * Contract tests: POST /v1/labs/{labId}/submissions — idempotency (§6).
 *
 * Written from docs/contract/post-labs-labId-submissions.md only. The
 * success/error file covers the original 201 and the other errors; this file
 * covers retries, replays, key reuse, in-flight requests and key lifetime.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

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

const KiB = 1024;
const MAX_BODY_BYTES = 128 * KiB; // §2, §5.4 step 6

/** @type {import('./helpers.js').TestApp} */
let app;

beforeEach(async () => {
  app = await startApp();
});

afterEach(async () => {
  const current = app;
  app = /** @type {any} */ (undefined);
  await current?.close();
});

// ---------------------------------------------------------------------------
// §6 — replay
// ---------------------------------------------------------------------------

describe('replay (§6)', () => {
  test('contract §6 — same key and same request → stored 201, Idempotent-Replayed: true, no new submission', async () => {
    const key = 'replay-same-request';
    const first = await request(app.baseUrl, { idempotencyKey: key });
    const firstSubmission = await assertSubmission(first, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    const replay = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    const replaySubmission = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.deepEqual(replaySubmission, firstSubmission);
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — the replay is the stored response, not a recomputation: submittedAt does not move', async () => {
    const key = 'replay-stored-time';
    const first = await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    app.advanceClock(60_000);
    const replay = await request(app.baseUrl, { idempotencyKey: key });

    const replayed = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.equal(replayed.submittedAt, first.submittedAt);
    assert.equal(replayed.id, first.id);
  });

  test('contract §6 — key order and whitespace do not matter: the same JSON value replays', async () => {
    const key = 'replay-canonical-json';
    const first = await request(app.baseUrl, {
      idempotencyKey: key,
      rawBody: '{"sourceCode":"int main() {}","extra":1}',
    });
    await assertSubmission(first, { labId: LABS.A1, studentId: USERS.S1.id });

    const replay = await request(app.baseUrl, {
      idempotencyKey: key,
      rawBody: ' { "extra" : 1 , "sourceCode" : "int main() {}" } ',
    });

    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    await assertSubmission(replay, { labId: LABS.A1, studentId: USERS.S1.id });
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — a replay is still checked against step 9: unenrolled after the 201 → 403, nothing new', async () => {
    const key = 'replay-after-unenroll';
    await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    app.unenroll(USERS.S1.id, 1);
    const retry = await request(app.baseUrl, { idempotencyKey: key });

    await assertProblem(retry, PROBLEMS.forbidden);
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — a replay needs a valid token: expired token → 401, nothing new', async () => {
    const key = 'replay-after-expiry';
    await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    app.expireToken(TOKENS.S1);
    const retry = await request(app.baseUrl, { idempotencyKey: key });

    await assertProblem(retry, PROBLEMS.unauthorized);
    assert.equal(app.submissionCount(), 1);
  });
});

// ---------------------------------------------------------------------------
// §6 — scope
// ---------------------------------------------------------------------------

describe('scope and keys (§6)', () => {
  test('contract §6 — different keys with identical bodies create different submissions', async () => {
    const first = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: 'different-key-1' }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );
    const second = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: 'different-key-2' }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );

    assert.notEqual(first.id, second.id);
    assert.equal(app.submissionCount(), 2);
  });

  test('contract §6 — keys are compared exactly: "exact key" and "exact-key" are different keys', async () => {
    const first = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: 'exact-key' }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );
    const second = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: 'exact key' }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );

    assert.notEqual(first.id, second.id);
    assert.equal(app.submissionCount(), 2);
  });

  test('contract §6 — a key belongs to one student: two students with the same key do not affect each other', async () => {
    const key = 'shared-between-students';

    const first = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: key, token: TOKENS.S1 }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );
    const second = await assertSubmission(
      await request(app.baseUrl, { idempotencyKey: key, token: TOKENS.S4 }),
      { labId: LABS.A1, studentId: USERS.S4.id },
    );

    assert.notEqual(first.id, second.id);
    assert.equal(app.submissionCount(), 2);

    const replay = await request(app.baseUrl, { idempotencyKey: key, token: TOKENS.S4 });
    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    const replayed = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S4.id,
    });
    assert.equal(replayed.id, second.id);
  });
});

// ---------------------------------------------------------------------------
// §6 — reused
// ---------------------------------------------------------------------------

describe('reused key (§6, 422)', () => {
  test('contract §6 — same key with different sourceCode → 422, nothing created', async () => {
    const key = 'reused-source';
    await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    const reused = await request(app.baseUrl, {
      idempotencyKey: key,
      body: validBody({ sourceCode: 'int main() { return 1; }' }),
    });

    await assertProblem(reused, PROBLEMS.keyReused);
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — same key with a different labId → 422, nothing created', async () => {
    const key = 'reused-lab';
    await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    const reused = await request(app.baseUrl, { idempotencyKey: key, labId: LABS.A2 });

    await assertProblem(reused, PROBLEMS.keyReused);
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — same key with a changed ignored field → 422, because the whole body is compared', async () => {
    const key = 'reused-ignored-field';
    await assertSubmission(
      await request(app.baseUrl, {
        idempotencyKey: key,
        body: validBody({ studentId: 1, note: 'first' }),
      }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );

    const reused = await request(app.baseUrl, {
      idempotencyKey: key,
      body: validBody({ studentId: 1, note: 'second' }),
    });

    await assertProblem(reused, PROBLEMS.keyReused);
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — a 422 keeps the original stored response: the original body still replays', async () => {
    const key = 'reused-then-original';
    const original = await assertSubmission(
      await request(app.baseUrl, {
        idempotencyKey: key,
        body: validBody({ note: 'original' }),
      }),
      { labId: LABS.A1, studentId: USERS.S1.id },
    );

    await assertProblem(
      await request(app.baseUrl, {
        idempotencyKey: key,
        body: validBody({ note: 'different' }),
      }),
      PROBLEMS.keyReused,
    );

    const replay = await request(app.baseUrl, {
      idempotencyKey: key,
      body: validBody({ note: 'original' }),
    });
    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    const replayed = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.equal(replayed.id, original.id);
  });
});

// ---------------------------------------------------------------------------
// §6 — in flight
// ---------------------------------------------------------------------------

describe('in flight (§6, 409)', () => {
  test('contract §6 — a retry while the first request is in flight → 409, nothing created; then the first 201 and the replay', async () => {
    const key = 'in-flight-key';
    const hold = app.holdNextCreate();

    const first = request(app.baseUrl, { idempotencyKey: key });
    const context = await hold.reached;
    assert.deepEqual(context, { studentId: USERS.S1.id, labId: LABS.A1, key });

    const concurrent = await request(app.baseUrl, { idempotencyKey: key });
    await assertProblem(concurrent, PROBLEMS.inFlight);
    assert.equal(app.submissionCount(), 0);

    hold.release();
    const created = await assertSubmission(await first, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.equal(app.submissionCount(), 1);

    const replay = await request(app.baseUrl, { idempotencyKey: key });
    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    const replayed = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.equal(replayed.id, created.id);
  });

  test('contract §6 — in flight wins over fingerprint: a different body with the same key while in flight → 409', async () => {
    const key = 'in-flight-different-body';
    const hold = app.holdNextCreate();
    const first = request(app.baseUrl, { idempotencyKey: key });

    await hold.reached;
    const concurrent = await request(app.baseUrl, {
      idempotencyKey: key,
      body: validBody({ sourceCode: 'int main() { return 2; }' }),
    });

    await assertProblem(concurrent, PROBLEMS.inFlight);
    assert.equal(app.submissionCount(), 0);

    hold.release();
    await assertSubmission(await first, { labId: LABS.A1, studentId: USERS.S1.id });
  });
});

// ---------------------------------------------------------------------------
// §6 — only a 201 is stored
// ---------------------------------------------------------------------------

describe('only a 201 is stored (§6)', () => {
  test('contract §6 — a failed create (500) stores nothing: the same key then creates', async () => {
    const key = 'after-500';
    app.failNextCreate();
    await assertProblem(await request(app.baseUrl, { idempotencyKey: key }), PROBLEMS.internal);
    assert.equal(app.submissionCount(), 0);

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
    assert.equal(app.submissionCount(), 1);
  });

  test('contract §6 — a validation 400 stores nothing: the same key accepts the fixed body', async () => {
    const key = 'after-validation';
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, body: { sourceCode: '   ' } }),
      PROBLEMS.validation,
    );
    assert.equal(app.submissionCount(), 0);

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §6 — an invalid-json 400 stores nothing: the same key accepts valid JSON', async () => {
    const key = 'after-invalid-json';
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, rawBody: '{oops' }),
      PROBLEMS.invalidJson,
    );

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §6 — a 413 stores nothing: the same key accepts a small body', async () => {
    const key = 'after-413';
    const rawBody = JSON.stringify({ sourceCode: 'a'.repeat(MAX_BODY_BYTES) });
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, rawBody }),
      PROBLEMS.payloadTooLarge,
    );

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §6 — a 415 stores nothing: the same key accepts application/json', async () => {
    const key = 'after-415';
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, contentType: 'text/plain' }),
      PROBLEMS.unsupportedMediaType,
    );

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §6 — a 404 (unknown lab) stores nothing: the same key accepts a real lab', async () => {
    const key = 'after-404';
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, labId: MISSING_LAB }),
      PROBLEMS.notFound,
    );

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });

  test('contract §6 — a 403 (not the owner) stores nothing: the same key accepts a lab of the caller', async () => {
    const key = 'after-403';
    await assertProblem(
      await request(app.baseUrl, {
        idempotencyKey: key,
        token: TOKENS.S2,
        labId: LABS.A1,
      }),
      PROBLEMS.forbidden,
    );

    const retry = await request(app.baseUrl, {
      idempotencyKey: key,
      token: TOKENS.S2,
      labId: LABS.B1,
    });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.B1, studentId: USERS.S2.id });
  });

  test('contract §6 — a 401 stores nothing: the same key works after a valid token', async () => {
    const key = 'after-401';
    await assertProblem(
      await request(app.baseUrl, { idempotencyKey: key, token: null }),
      PROBLEMS.unauthorized,
    );

    const retry = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(retry.headers.get('idempotent-replayed'), null);
    await assertSubmission(retry, { labId: LABS.A1, studentId: USERS.S1.id });
  });
});

// ---------------------------------------------------------------------------
// §6 — lifetime
// ---------------------------------------------------------------------------

describe('lifetime (§6)', () => {
  test('contract §6 — a stored key is kept for at least 24 hours', async () => {
    const key = 'lifetime-24h';
    const first = await assertSubmission(await request(app.baseUrl, { idempotencyKey: key }), {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });

    app.advanceClock(24 * 60 * 60 * 1000);
    const replay = await request(app.baseUrl, { idempotencyKey: key });

    assert.equal(replay.headers.get('idempotent-replayed'), 'true');
    const replayed = await assertSubmission(replay, {
      labId: LABS.A1,
      studentId: USERS.S1.id,
    });
    assert.equal(replayed.id, first.id);
    assert.equal(app.submissionCount(), 1);
  });
});
