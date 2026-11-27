import test from 'node:test';
import assert from 'node:assert/strict';

import { UNSURE_REASONS } from '../../src/model/schema.js';
import { createTestDb, insertSubmission, seedLab } from '../queue/helpers.js';

/**
 * Insert one `unsure` verdict carrying the given reason.
 *
 * @param {import('../../src/repo/db.js').Db} db
 * @param {string} reason
 */
async function insertVerdictWithReason(db, reason) {
  const ids = await seedLab(db);
  const submissionId = await insertSubmission(db, ids);
  const constraintId = ids.constraints[0];
  return db.query(
    `INSERT INTO verdicts (submission_id, constraint_id, verdict, decided_by, unsure_reason)
     VALUES ($1, $2, 'unsure', 'fallback', $3)`,
    [submissionId, constraintId, reason],
  );
}

test('migration 002: the table accepts compile_error as an unsure reason', async () => {
  const db = await createTestDb();
  await insertVerdictWithReason(db, 'compile_error');
  const { rows } = await db.query('SELECT unsure_reason FROM verdicts');
  assert.deepEqual(
    rows.map((row) => row.unsure_reason),
    ['compile_error'],
  );
  await db.close();
});

test('migration 002: the reasons that were accepted before are still accepted', async () => {
  for (const reason of [
    'model_unsure',
    'schema_invalid',
    'evidence_mismatch',
    'timeout',
    'cost_cap',
    'hard_rule_unsure',
  ]) {
    const db = await createTestDb();
    await insertVerdictWithReason(db, reason);
    await db.close();
  }
});

test('migration 002: a reason outside the list is still rejected', async () => {
  const db = await createTestDb();
  await assert.rejects(insertVerdictWithReason(db, 'because_i_said_so'), /check/i);
  await db.close();
});

test('the model schema lists compile_error as an unsure reason', () => {
  assert.ok(UNSURE_REASONS.includes('compile_error'));
});
