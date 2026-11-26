import test from 'node:test';
import assert from 'node:assert/strict';

import { createJudge } from '../../src/judge/pipeline.js';
import { createCallRecorder } from '../../src/judge/recorder.js';
import { enqueueJob } from '../../src/queue/claim.js';
import { processNextJob } from '../../src/queue/worker.js';
import { createTestDb, seedLab } from '../queue/helpers.js';

const SOURCE = [
  '#include <algorithm>',
  'int main() { int a[3] = {3, 1, 2}; std::sort(a, a + 3); }',
].join('\n');

const TESTS = [{ name: '01', input: '3\n3 1 2\n', output: '1 2 3\n' }];

/**
 * @param {import('../../src/repo/db.js').Db} db
 * @param {number} labId
 * @param {string} text
 * @param {number} position
 */
async function addConstraint(db, labId, text, position) {
  const { rows } = await db.query(
    `INSERT INTO constraints (lab_id, text, deduction, kind, position)
     VALUES ($1, $2, 5, $3, $4) RETURNING id`,
    [labId, text, text.startsWith('Do not') ? 'ban_list' : 'semantic', position],
  );
  return Number(rows[0].id);
}

/**
 * @param {import('../../src/repo/db.js').Db} db
 * @param {number} labId
 * @param {number} studentId
 */
async function addSubmission(db, labId, studentId) {
  const { rows } = await db.query(
    `INSERT INTO submissions (lab_id, student_id, source_code)
     VALUES ($1, $2, $3) RETURNING id`,
    [labId, studentId, SOURCE],
  );
  return Number(rows[0].id);
}

/**
 * Build the payload the queue hands to the judge, the way `loadSubmission()`
 * does it.
 *
 * @param {import('../../src/repo/db.js').Db} db
 * @param {number} submissionId
 * @param {number} labId
 */
async function submissionPayload(db, submissionId, labId) {
  const { rows } = await db.query(
    'SELECT id, text, kind, deduction FROM constraints WHERE lab_id = $1 ORDER BY position',
    [labId],
  );
  return {
    id: submissionId,
    labId,
    sourceCode: SOURCE,
    constraints: rows.map((row) => ({
      id: Number(row.id),
      text: String(row.text),
      kind: String(row.kind),
      deduction: Number(row.deduction),
    })),
  };
}

/**
 * The two constraints `seedLab()` inserts, typed as present.
 *
 * @param {{ constraints: number[] }} ids
 * @returns {{ ban: number, semantic: number }}
 */
function constraintsOf(ids) {
  const [ban, semantic] = ids.constraints;
  if (ban === undefined || semantic === undefined) {
    throw new Error('seedLab() is expected to insert two constraints');
  }
  return { ban, semantic };
}

/**
 * A complete `model_calls` row, as `makeCallLogEntry()` would build it.
 *
 * @param {number} submissionId
 * @param {number} constraintId
 * @param {number} costUsd
 * @returns {import('../../src/model/calllog.js').CallLogEntry}
 */
function callEntry(submissionId, constraintId, costUsd) {
  return {
    at: '2026-11-24T00:00:00.000Z',
    submissionId,
    constraintId,
    model: 'gemini-2.5-flash',
    requestId: 'req-1',
    tokensIn: 10,
    tokensOut: 2,
    latencyMs: 5,
    costUsd,
    prompt: 'prompt',
  };
}

/**
 * Point the seeded lab at real tests and a ban list with backticked names.
 *
 * @param {import('../../src/repo/db.js').Db} db
 * @param {{ lab: number, constraints: number[] }} ids
 */
async function prepareLab(db, ids) {
  await db.query('UPDATE labs SET tests_json = $2 WHERE id = $1', [ids.lab, JSON.stringify(TESTS)]);
  await db.query('UPDATE constraints SET text = $2 WHERE id = $1', [
    ids.constraints[0],
    'Do not call `std::sort`.',
  ]);
}

test('the judge runs the sandbox, then the hard rule, then the model', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  await prepareLab(db, ids);
  const submissionId = await addSubmission(db, ids.lab, ids.student);

  /** @type {string[]} */
  const order = [];
  /** @type {any[]} */
  const modelInputs = [];

  const judge = createJudge({
    db,
    rules: {
      check(source, banList) {
        order.push('rules');
        assert.match(source, /std::sort/);
        assert.deepEqual(banList.names, ['std::sort']);
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
    sandbox: async (input) => {
      order.push('sandbox');
      assert.equal(input.sourceCode, SOURCE);
      assert.deepEqual(input.tests, TESTS);
      return {
        verdict: 'WA',
        compile: 'ok',
        tests: [{ name: '01', verdict: 'WA', timeMs: 3 }],
        killedByHost: false,
        containerName: 'sbx-test',
      };
    },
    modelJudge: async (input) => {
      order.push('model');
      modelInputs.push(input);
      return { verdict: 'pass', evidence: [], decidedBy: 'model', unsureReason: null, call: null };
    },
  });

  const submission = await submissionPayload(db, submissionId, ids.lab);
  const result = await judge(submission);

  assert.deepEqual(order, ['sandbox', 'rules', 'model']);
  assert.equal(result.judgeVerdict, 'WA');
  assert.deepEqual(result.testResults, [{ name: '01', verdict: 'WA', timeMs: 3 }]);
  assert.deepEqual(result.verdicts, [
    {
      constraintId: ids.constraints[0],
      verdict: 'violation',
      evidence: [{ line: 2, text: 'int main() { int a[3] = {3, 1, 2}; std::sort(a, a + 3); }' }],
      decidedBy: 'hard_rule',
      unsureReason: null,
    },
    {
      constraintId: ids.constraints[1],
      verdict: 'pass',
      evidence: [],
      decidedBy: 'model',
      unsureReason: null,
    },
  ]);

  // One call per pair, with the lab's statement and cost cap, never the tests.
  assert.equal(modelInputs.length, 1);
  assert.equal(modelInputs[0].statement, 'Sort n integers.');
  assert.equal(modelInputs[0].sourceCode, SOURCE);
  assert.equal(modelInputs[0].costCapUsd, 1);
  assert.equal(modelInputs[0].spentUsd, 0);
  assert.equal(modelInputs[0].timeoutMs, 20_000);

  await db.close();
});

test('a ban-list constraint never reaches the model', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  await prepareLab(db, ids);
  await db.query('UPDATE constraints SET text = $2 WHERE id = $1', [
    ids.constraints[1],
    'Do not use `std::stable_sort` or `qsort`.',
  ]);
  const submissionId = await addSubmission(db, ids.lab, ids.student);

  let modelCalls = 0;
  const judge = createJudge({
    db,
    rules: {
      check() {
        return {
          verdict: 'pass',
          evidence: [],
          unsureReason: null,
          decidedBy: 'hard_rule',
        };
      },
    },
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sandbox: async () => ({
      verdict: 'AC',
      compile: 'ok',
      tests: [],
      killedByHost: false,
      containerName: 'sbx-test',
    }),
    modelJudge: async () => {
      modelCalls += 1;
      throw new Error('the model must not be called for a ban list');
    },
  });

  const result = await judge(await submissionPayload(db, submissionId, ids.lab));

  assert.equal(modelCalls, 0);
  assert.deepEqual(
    result.verdicts.map((verdict) => verdict.decidedBy),
    ['hard_rule', 'hard_rule'],
  );

  await db.close();
});

test('the cost cap counts what the lab already spent and what this run spends', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { ban, semantic } = constraintsOf(ids);
  await prepareLab(db, ids);
  const third = await addConstraint(db, ids.lab, 'Use only constant extra memory.', 3);
  const earlier = await addSubmission(db, ids.lab, ids.student);
  await db.query(
    `INSERT INTO model_calls (submission_id, constraint_id, provider, model, cost_usd)
     VALUES ($1, $2, 'google', 'gemini-2.5-flash', 0.25)`,
    [earlier, semantic],
  );
  const submissionId = await addSubmission(db, ids.lab, ids.student);

  /** @type {number[]} */
  const spent = [];
  const judge = createJudge({
    db,
    rules: {
      check() {
        return { verdict: 'pass', evidence: [], unsureReason: null, decidedBy: 'hard_rule' };
      },
    },
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sandbox: async () => ({
      verdict: 'AC',
      compile: 'ok',
      tests: [],
      killedByHost: false,
      containerName: 'sbx-test',
    }),
    modelJudge: async (input) => {
      spent.push(input.spentUsd ?? -1);
      return {
        verdict: 'pass',
        evidence: [],
        decidedBy: 'model',
        unsureReason: null,
        call: callEntry(input.submissionId, input.constraint.id, 0.5),
      };
    },
  });

  const result = await judge(await submissionPayload(db, submissionId, ids.lab));

  assert.deepEqual(spent, [0.25, 0.75]);
  assert.deepEqual(
    result.verdicts.map((verdict) => verdict.constraintId),
    [ban, semantic, third],
  );

  await db.close();
});

test('a reason the table does not accept is stored as model_unsure', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  await prepareLab(db, ids);
  const submissionId = await addSubmission(db, ids.lab, ids.student);

  const judge = createJudge({
    db,
    rules: {
      check() {
        return { verdict: 'pass', evidence: [], unsureReason: null, decidedBy: 'hard_rule' };
      },
    },
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sandbox: async () => ({
      verdict: 'AC',
      compile: 'ok',
      tests: [],
      killedByHost: false,
      containerName: 'sbx-test',
    }),
    modelJudge: async () => ({
      verdict: 'unsure',
      evidence: [],
      decidedBy: 'fallback',
      unsureReason: 'model_error',
      call: null,
    }),
  });

  const result = await judge(await submissionPayload(db, submissionId, ids.lab));

  assert.equal(result.verdicts[1]?.verdict, 'unsure');
  assert.equal(result.verdicts[1]?.unsureReason, 'model_unsure');

  await db.close();
});

test('with no model key the hard rules still run and semantics are unsure', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  await prepareLab(db, ids);
  const submissionId = await addSubmission(db, ids.lab, ids.student);

  let modelCalls = 0;
  const judge = createJudge({
    db,
    rules: {
      check() {
        return { verdict: 'pass', evidence: [], unsureReason: null, decidedBy: 'hard_rule' };
      },
    },
    model: 'gemini-2.5-flash',
    sandbox: async () => ({
      verdict: 'AC',
      compile: 'ok',
      tests: [],
      killedByHost: false,
      containerName: 'sbx-test',
    }),
    modelJudge: async () => {
      modelCalls += 1;
      throw new Error('no key, no call');
    },
  });

  const result = await judge(await submissionPayload(db, submissionId, ids.lab));

  assert.equal(modelCalls, 0);
  assert.deepEqual(
    result.verdicts.map((verdict) => [verdict.decidedBy, verdict.unsureReason]),
    [
      ['hard_rule', null],
      ['fallback', 'model_unsure'],
    ],
  );

  await db.close();
});

test('processNextJob stores the judge result exactly once', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  await prepareLab(db, ids);
  const submissionId = await addSubmission(db, ids.lab, ids.student);
  await enqueueJob(db, submissionId);

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
      verdict: 'AC',
      compile: 'ok',
      tests: [{ name: '01', verdict: 'AC', timeMs: 2 }],
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

  const submission = await db.query(
    'SELECT status, judge_verdict, test_results_json FROM submissions WHERE id = $1',
    [submissionId],
  );
  assert.equal(submission.rows[0].status, 'judged');
  assert.equal(submission.rows[0].judge_verdict, 'AC');
  assert.deepEqual(submission.rows[0].test_results_json, [
    { name: '01', verdict: 'AC', timeMs: 2 },
  ]);

  const verdicts = await db.query(
    'SELECT constraint_id, verdict, evidence_json, decided_by, unsure_reason FROM verdicts WHERE submission_id = $1 ORDER BY constraint_id',
    [submissionId],
  );
  assert.equal(verdicts.rows.length, 2);
  assert.equal(verdicts.rows[0].verdict, 'violation');
  assert.deepEqual(verdicts.rows[0].evidence_json, [
    { line: 2, text: 'int main() { int a[3] = {3, 1, 2}; std::sort(a, a + 3); }' },
  ]);
  assert.equal(verdicts.rows[1].verdict, 'unsure');
  assert.equal(verdicts.rows[1].unsure_reason, 'model_unsure');

  await db.close();
});

test('the recorder writes the call to model_calls with the anonymised prompt', async () => {
  const db = await createTestDb();
  const ids = await seedLab(db);
  const { semantic } = constraintsOf(ids);
  const submissionId = await addSubmission(db, ids.lab, ids.student);
  const recorder = createCallRecorder({ db });

  await recorder.record({
    at: '2026-11-24T00:00:00.000Z',
    submissionId,
    constraintId: semantic,
    model: 'gemini-2.5-flash',
    requestId: 'req-1',
    tokensIn: 100,
    tokensOut: 20,
    latencyMs: 800,
    costUsd: 0.000123,
    prompt: 'int main() { /* comments removed */ }',
  });

  const { rows } = await db.query(
    `SELECT submission_id, constraint_id, provider, model, provider_request_id,
            tokens_in, tokens_out, latency_ms, cost_usd, prompt
       FROM model_calls`,
  );
  assert.equal(rows.length, 1);
  assert.equal(Number(rows[0].submission_id), submissionId);
  assert.equal(Number(rows[0].constraint_id), ids.constraints[1]);
  assert.equal(rows[0].provider, 'google');
  assert.equal(rows[0].provider_request_id, 'req-1');
  assert.equal(Number(rows[0].tokens_in), 100);
  assert.equal(Number(rows[0].tokens_out), 20);
  assert.equal(Number(rows[0].latency_ms), 800);
  assert.equal(Number(rows[0].cost_usd), 0.000123);
  assert.doesNotMatch(String(rows[0].prompt), /std::sort/);

  await db.close();
});
