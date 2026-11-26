import test from 'node:test';
import assert from 'node:assert/strict';

import { createServer } from 'node:http';

import { createApp } from '../../src/app.js';
import { createPostgresWebStore } from '../../src/web/postgres-store.js';
import { createJudge } from '../../src/judge/pipeline.js';
import { processNextJob } from '../../src/queue/worker.js';
import { createTestDb } from '../queue/helpers.js';

const SOURCE = [
  '#include <algorithm>',
  'int main() { int a[3] = {3, 1, 2}; std::sort(a, a + 3); }',
].join('\n');

/**
 * @param {ReturnType<typeof createApp>} app
 */
async function start(app) {
  const server = createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no address');
  return {
    base: `http://127.0.0.1:${address.port}`,
    app,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve(undefined));
      }),
  };
}

/**
 * @param {string} base
 * @param {string} token
 * @returns {Promise<string>}
 */
async function login(base, token) {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
    redirect: 'manual',
  });
  assert.equal(res.status, 303);
  const cookie = res.headers.get('set-cookie') ?? '';
  assert.match(cookie, /leetkob_session=/);
  return cookie.split(';')[0] ?? '';
}

test('the postgres store maps every demo token to a user', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  for (const token of [
    'admin-token',
    'ta1-token',
    'ta2-token',
    'sv1-token',
    'sv2-token',
    'sv3-token',
    'sv4-token',
  ]) {
    const user = store.findUserByToken(token);
    assert.notEqual(user, null, token);
    assert.equal(user.token, token);
  }
  assert.equal(store.findUserByToken('nope'), null);
  await db.close();
});

test('a lab round-trips through the postgres store', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  assert.ok(ta);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [{ name: '01', input: '3\n3 1 2\n', output: '1 2 3\n' }],
    constraints: [
      { text: 'Do not call `std::sort`.', deduction: 5 },
      { text: 'Sort with a merge sort you wrote yourself.', deduction: 3 },
    ],
    createdBy: ta.id,
    now: new Date(),
  });

  assert.equal(lab.title, 'sort-merge');
  assert.equal(lab.constraints.length, 2);
  assert.equal(lab.constraints[0].kind, 'ban_list');

  const found = await store.findLab(lab.id);
  assert.ok(found);
  assert.equal(found.constraints.length, 2);

  const listed = await store.listLabs(ta.classId);
  assert.equal(listed.length, 1);

  await db.close();
});

test('createSubmission flips is_counted and enqueues a job', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  const student = store.findUserByToken('sv1-token');
  assert.ok(ta && student);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [],
    constraints: [{ text: 'Sort with a merge sort you wrote yourself.', deduction: 3 }],
    createdBy: ta.id,
    now: new Date(),
  });

  const first = await store.createSubmission({
    labId: lab.id,
    studentId: student.id,
    sourceCode: SOURCE,
  });
  assert.equal(first.counted, true);

  const second = await store.createSubmission({
    labId: lab.id,
    studentId: student.id,
    sourceCode: SOURCE,
  });
  assert.equal(second.counted, true);

  const all = await store.listSubmissions({ labId: lab.id, studentId: student.id });
  assert.equal(all.length, 2);
  assert.equal(
    all.find((/** @type {any} */ submission) => submission.id === first.id)?.counted,
    false,
  );
  assert.equal(
    all.find((/** @type {any} */ submission) => submission.id === second.id)?.counted,
    true,
  );

  const { rows } = await db.query('SELECT count(*)::int AS n FROM jobs');
  assert.equal(rows[0].n, 2);

  await db.close();
});

test('addVerdict upserts rather than duplicating', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  const student = store.findUserByToken('sv1-token');
  assert.ok(ta && student);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [],
    constraints: [{ text: 'Sort with a merge sort you wrote yourself.', deduction: 3 }],
    createdBy: ta.id,
    now: new Date(),
  });
  const submission = await store.createSubmission({
    labId: lab.id,
    studentId: student.id,
    sourceCode: SOURCE,
  });

  await store.addVerdict({
    submissionId: submission.id,
    constraintId: lab.constraints[0].id,
    verdict: 'unsure',
    evidence: [],
    decidedBy: 'model',
    unsureReason: 'model_unsure',
  });
  await store.addVerdict({
    submissionId: submission.id,
    constraintId: lab.constraints[0].id,
    verdict: 'pass',
    evidence: [],
    decidedBy: 'model',
    unsureReason: null,
  });

  const verdicts = await store.listVerdictsForSubmission(submission.id);
  assert.equal(verdicts.length, 1);
  assert.equal(verdicts[0].verdict, 'pass');

  await db.close();
});

test('decideVerdict stores the TA decision and replaces the evidence on violation', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  const student = store.findUserByToken('sv1-token');
  assert.ok(ta && student);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [],
    constraints: [{ text: 'Sort with a merge sort you wrote yourself.', deduction: 3 }],
    createdBy: ta.id,
    now: new Date(),
  });
  const submission = await store.createSubmission({
    labId: lab.id,
    studentId: student.id,
    sourceCode: SOURCE,
  });
  const verdict = await store.addVerdict({
    submissionId: submission.id,
    constraintId: lab.constraints[0].id,
    verdict: 'unsure',
    evidence: [{ line: 2, text: 'old' }],
    decidedBy: 'model',
    unsureReason: 'model_unsure',
  });

  const decided = await store.decideVerdict(verdict.id, 'violation', [
    { line: 2, text: 'std::sort(a);' },
  ]);
  assert.ok(decided);
  assert.equal(decided.taDecision, 'violation');
  assert.deepEqual(decided.evidence, [{ line: 2, text: 'std::sort(a);' }]);

  const passVerdict = await store.addVerdict({
    submissionId: submission.id,
    constraintId: lab.constraints[0].id,
    verdict: 'pass',
    evidence: [{ line: 2, text: 'kept' }],
    decidedBy: 'model',
    unsureReason: null,
  });
  const decidedPass = await store.decideVerdict(passVerdict.id, 'pass', []);
  assert.ok(decidedPass);
  assert.deepEqual(decidedPass.evidence, [{ line: 2, text: 'kept' }]);

  await db.close();
});

test('model calls round-trip through the postgres store', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  const student = store.findUserByToken('sv1-token');
  assert.ok(ta && student);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [],
    constraints: [{ text: 'Do not call `std::sort`.', deduction: 5 }],
    createdBy: ta.id,
    now: new Date(),
  });
  const submission = await store.createSubmission({
    labId: lab.id,
    studentId: student.id,
    sourceCode: SOURCE,
  });

  await store.addModelCall({
    id: 0,
    submissionId: submission.id,
    constraintId: lab.constraints[0].id,
    model: 'gemini-2.5-flash',
    requestId: 'req-1',
    tokensIn: 10,
    tokensOut: 2,
    latencyMs: 5,
    costUsd: 0.0001,
    at: new Date().toISOString(),
  });

  const calls = await store.listModelCalls(lab.id);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestId, 'req-1');

  await db.close();
});

test('a submitted lab is judged by the worker through the postgres store', async () => {
  const db = await createTestDb();
  const store = await createPostgresWebStore({ db });
  const ta = store.findUserByToken('ta1-token');
  const student = store.findUserByToken('sv1-token');
  assert.ok(ta && student);

  const lab = await store.createLab({
    classId: ta.classId,
    title: 'sort-merge',
    statement: 'Sort n integers.',
    tests: [{ name: '01', input: '3\n3 1 2\n', output: '1 2 3\n' }],
    constraints: [
      { text: 'Do not call `std::sort`.', deduction: 5 },
      { text: 'Sort with a merge sort you wrote yourself.', deduction: 3 },
    ],
    createdBy: ta.id,
    now: new Date(),
  });

  const { base, close } = await start(createApp({ webStore: store }));
  const cookie = await login(base, 'sv1-token');

  const submit = await fetch(`${base}/student/labs/${lab.id}/submit`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ sourceCode: SOURCE }).toString(),
    redirect: 'manual',
  });
  assert.equal(submit.status, 303);
  const submissionUrl = submit.headers.get('location') ?? '';
  const submissionId = Number(submissionUrl.split('/').pop());

  const judge = createJudge({
    db,
    rules: {
      check() {
        return {
          verdict: 'violation',
          evidence: [
            { line: 2, text: 'int main() { int a[3] = {3, 1, 2}; std::sort(a, a + 3); }' },
          ],
          unsureReason: null,
          decidedBy: 'hard_rule',
        };
      },
    },
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sandbox: async () => ({
      verdict: 'WA',
      compile: 'ok',
      tests: [{ name: '01', verdict: 'WA', timeMs: 3 }],
      killedByHost: false,
      containerName: 'sbx-test',
    }),
    modelJudge: async () => ({
      verdict: 'unsure',
      evidence: [],
      decidedBy: 'model',
      unsureReason: 'model_unsure',
      call: null,
    }),
  });

  assert.equal(await processNextJob({ db, workerId: 'w1', judge }), 'done');

  const page = await fetch(`${base}/student/submissions/${submissionId}`, { headers: { cookie } });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /judged/);
  assert.match(html, /WA/);

  await close();
  await db.close();
});
