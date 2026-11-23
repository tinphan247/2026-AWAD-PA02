import { PGlite } from '@electric-sql/pglite';

import { migrate } from '../../src/repo/migrate.js';

/**
 * A fresh in-process Postgres with the LeeTKOB schema applied. No network, no
 * Docker: `npm test` must pass with the network cut (PA#3 marking, step 2).
 *
 * @returns {Promise<import('../../src/repo/db.js').Db & { close: () => Promise<void> }>}
 */
export async function createTestDb() {
  const pg = new PGlite();
  /** @type {import('../../src/repo/db.js').Db & { close: () => Promise<void> }} */
  const db = {
    query: async (text, params) => pg.query(text, params),
    exec: async (text) => pg.exec(text),
    transaction: async (fn) =>
      pg.transaction(async (tx) =>
        fn({
          query: async (text, params) => tx.query(text, params),
          exec: async (text) => tx.exec(text),
        }),
      ),
    close: async () => pg.close(),
  };
  await migrate(db);
  return db;
}

/**
 * Insert a TA, a student, a class, a lab with two constraints and one
 * Accepted-to-be submission. Returns the ids the tests need.
 *
 * @param {import('../../src/repo/db.js').Db} db
 */
export async function seedLab(db) {
  const ta = await one(
    db,
    `INSERT INTO users (email, password_hash, role) VALUES ('ta@test', 'x', 'ta') RETURNING id`,
  );
  const student = await one(
    db,
    `INSERT INTO users (email, password_hash, role) VALUES ('s1@test', 'x', 'student') RETURNING id`,
  );
  const klass = await one(
    db,
    `INSERT INTO classes (name, invite_code) VALUES ('AWAD', 'join-me') RETURNING id`,
  );
  const lab = await one(
    db,
    `INSERT INTO labs (class_id, title, statement, tests_json, deadline_at, created_by)
     VALUES ($1, 'sort-merge', 'Sort n integers.', '[]', now() + interval '1 day', $2)
     RETURNING id`,
    [klass, ta],
  );
  const c1 = await one(
    db,
    `INSERT INTO constraints (lab_id, text, deduction, kind, position)
     VALUES ($1, 'Do not call std::sort.', 5, 'ban_list', 1) RETURNING id`,
    [lab],
  );
  const c2 = await one(
    db,
    `INSERT INTO constraints (lab_id, text, deduction, kind, position)
     VALUES ($1, 'Sort with a merge sort you wrote yourself.', 5, 'semantic', 2) RETURNING id`,
    [lab],
  );
  return { ta, student, lab, constraints: [c1, c2] };
}

/**
 * @param {import('../../src/repo/db.js').Db} db
 * @param {{ lab: number, student: number }} ids
 * @returns {Promise<number>}
 */
export async function insertSubmission(db, ids) {
  return one(
    db,
    `INSERT INTO submissions (lab_id, student_id, source_code)
     VALUES ($1, $2, 'int main() { return 0; }') RETURNING id`,
    [ids.lab, ids.student],
  );
}

/**
 * A judge that records how often it ran and returns one verdict per
 * constraint, as the real pipeline (sandbox, hard rules, model) will.
 *
 * @param {number[]} constraintIds
 */
export function countingJudge(constraintIds) {
  const calls = /** @type {number[]} */ ([]);
  /** @type {import('../../src/queue/worker.js').Judge} */
  const judge = async (submission) => {
    calls.push(submission.id);
    return {
      judgeVerdict: 'AC',
      testResults: [{ test: '01', verdict: 'AC' }],
      verdicts: constraintIds.map((constraintId) => ({
        constraintId,
        verdict: 'pass',
        evidence: [],
        decidedBy: 'hard_rule',
        unsureReason: null,
      })),
    };
  };
  return { judge, calls };
}

/**
 * @param {import('../../src/repo/db.js').Db} db
 * @param {number} submissionId
 * @returns {Promise<number>}
 */
export async function verdictCount(db, submissionId) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM verdicts WHERE submission_id = $1`,
    [submissionId],
  );
  return rows[0].n;
}

/**
 * @param {import('../../src/repo/db.js').Db} db
 * @param {string} text
 * @param {unknown[]} [params]
 * @returns {Promise<number>}
 */
async function one(db, text, params) {
  const { rows } = await db.query(text, params);
  return rows[0].id;
}

/** @param {number} ms */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
