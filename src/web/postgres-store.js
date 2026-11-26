/**
 * Postgres-backed web store (PA#3, criteria 1 and the web half of 4).
 *
 * The UI used to be in memory (`./store.js`); this module keeps the same method
 * surface but keeps labs, submissions, verdicts and model calls in Postgres, so a
 * restart no longer loses the class and the worker can claim the job the web app
 * creates.
 *
 * The demo accounts stay in `defaultSeed()`: the `users` table has no name or
 * token column, so the seed is the single place that maps a token to an account.
 * That keeps the token out of the database and keeps the routes unchanged.
 *
 * @typedef {import('./store.js').User} User
 * @typedef {import('./store.js').ClassRoom} ClassRoom
 * @typedef {import('./store.js').Lab} Lab
 * @typedef {import('./store.js').Constraint} Constraint
 * @typedef {import('./store.js').Submission} Submission
 * @typedef {import('./store.js').Verdict} Verdict
 * @typedef {import('./store.js').ModelCall} ModelCall
 */

import { defaultSeed } from './store.js';
import { isBanList } from '../domain/labs.js';
import { enqueueJob } from '../queue/claim.js';

/** @param {string} token @returns {string} */
function emailForToken(token) {
  return `${token.replace(/-token$/, '')}@demo.leetkob`;
}

/**
 * @param {any} row
 * @returns {Lab}
 */
function toLab(row) {
  return {
    id: Number(row.id),
    classId: Number(row.class_id),
    title: String(row.title),
    statement: String(row.statement),
    tests: /** @type {Array<{ name: string, input: string, output: string }>} */ (
      row.tests_json ?? []
    ),
    constraints: [],
    createdBy: Number(row.created_by),
    createdAt: new Date(row.created_at).toISOString(),
    publishedAt: row.published_at === null ? null : new Date(row.published_at).toISOString(),
  };
}

/**
 * @param {any} row
 * @returns {Verdict}
 */
function toVerdict(row) {
  return {
    id: Number(row.id),
    submissionId: Number(row.submission_id),
    constraintId: Number(row.constraint_id),
    verdict: row.verdict,
    evidence: /** @type {Array<{ line: number, text: string }>} */ (row.evidence_json ?? []),
    decidedBy: row.decided_by,
    unsureReason: row.unsure_reason,
    taDecision: row.ta_decision,
  };
}

/**
 * @param {any} row
 * @returns {Submission}
 */
function toSubmission(row) {
  return {
    id: Number(row.id),
    labId: Number(row.lab_id),
    studentId: Number(row.student_id),
    sourceCode: String(row.source_code),
    status: row.status,
    counted: Boolean(row.is_counted),
    submittedAt: new Date(row.created_at).toISOString(),
    tests:
      /** @type {Array<{ name: string, verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' }>} */ (
        row.test_results_json ?? []
      ),
  };
}

/**
 * @param {{
 *   db: import('../repo/db.js').Db,
 *   seed?: import('./store.js').WebSeed,
 * }} options
 * @returns {Promise<any>}
 */
export async function createPostgresWebStore({ db, seed = defaultSeed() }) {
  /** @type {Map<number, number>} */
  const classIdBySeedId = new Map();
  /** @type {Map<number, ClassRoom>} */
  const classesById = new Map();
  /** @type {Map<string, User>} */
  const usersByToken = new Map();

  // The demo accounts are configuration, not data: create them once, then read
  // their ids back. `invite_code` and `email` are the natural keys.
  await db.transaction(async (tx) => {
    for (const room of seed.classes) {
      const { rows } = await tx.query(
        `INSERT INTO classes (name, invite_code) VALUES ($1, $2)
         ON CONFLICT (invite_code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [room.name, `demo-class-${room.id}`],
      );
      classIdBySeedId.set(room.id, Number(rows[0].id));
      classesById.set(Number(rows[0].id), { id: Number(rows[0].id), name: room.name });
    }

    for (const user of seed.users) {
      const { rows } = await tx.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, 'demo', $2)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
         RETURNING id`,
        [emailForToken(user.token), user.role],
      );
      const id = Number(rows[0].id);
      const classId = user.classId === null ? null : (classIdBySeedId.get(user.classId) ?? null);
      if (classId !== null) {
        await tx.query(
          `INSERT INTO class_members (class_id, user_id, role_in_class)
           VALUES ($1, $2, $3) ON CONFLICT (class_id, user_id) DO NOTHING`,
          [classId, id, user.role],
        );
      }
      usersByToken.set(user.token, { ...user, id, classId });
    }
  });

  /** @param {number} labId */
  async function constraintsFor(labId) {
    const { rows } = await db.query(
      `SELECT id, text, deduction, kind, position FROM constraints
        WHERE lab_id = $1 ORDER BY position`,
      [labId],
    );
    return rows.map((row) => ({
      id: Number(row.id),
      text: String(row.text),
      deduction: Number(row.deduction),
      kind: row.kind,
      position: Number(row.position),
    }));
  }

  return {
    /**
     * @param {string} token
     * @returns {User | null}
     */
    findUserByToken(token) {
      return usersByToken.get(token) ?? null;
    },

    /**
     * @param {number} id
     * @returns {User | null}
     */
    findUser(id) {
      for (const user of usersByToken.values()) {
        if (user.id === id) return user;
      }
      return null;
    },

    /**
     * @param {number} id
     * @returns {ClassRoom | null}
     */
    findClass(id) {
      return classesById.get(id) ?? null;
    },

    /**
     * @param {number | null} classId `null` lists every class (admin view).
     * @returns {Promise<Lab[]>}
     */
    async listLabs(classId) {
      const { rows } = await db.query(
        'SELECT id, class_id, title, statement, tests_json, created_by, created_at, published_at FROM labs ORDER BY id DESC',
      );
      const labs = rows
        .filter((row) => classId === null || Number(row.class_id) === classId)
        .map(toLab);
      for (const lab of labs) {
        lab.constraints = await constraintsFor(lab.id);
      }
      return labs;
    },

    /**
     * @param {number} id
     * @returns {Promise<Lab | null>}
     */
    async findLab(id) {
      const { rows } = await db.query(
        'SELECT id, class_id, title, statement, tests_json, created_by, created_at, published_at FROM labs WHERE id = $1',
        [id],
      );
      const row = rows[0];
      if (!row) return null;
      const lab = toLab(row);
      lab.constraints = await constraintsFor(id);
      return lab;
    },

    /**
     * @param {{
     *   classId: number,
     *   title: string,
     *   statement: string,
     *   tests: Array<{ name: string, input: string, output: string }>,
     *   constraints: Array<{ text: string, deduction: number }>,
     *   createdBy: number,
     *   now: Date,
     * }} input
     * @returns {Promise<Lab>}
     */
    async createLab({ classId, title, statement, tests, constraints, createdBy, now }) {
      void now;
      return db.transaction(async (tx) => {
        const { rows } = await tx.query(
          `INSERT INTO labs (class_id, title, statement, tests_json, created_by, deadline_at)
           VALUES ($1, $2, $3, $4, $5, now() + interval '1 day')
            RETURNING id, class_id, title, statement, tests_json, created_by, created_at, published_at`,
          [classId, title, statement, JSON.stringify(tests), createdBy],
        );
        const lab = toLab(rows[0]);
        for (const [index, constraint] of constraints.entries()) {
          const { rows: created } = await tx.query(
            `INSERT INTO constraints (lab_id, text, deduction, kind, position)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, position`,
            [
              lab.id,
              constraint.text,
              constraint.deduction,
              isBanList(constraint.text) ? 'ban_list' : 'semantic',
              index + 1,
            ],
          );
          lab.constraints.push({
            id: Number(created[0].id),
            text: constraint.text,
            deduction: constraint.deduction,
            kind: isBanList(constraint.text) ? 'ban_list' : 'semantic',
          });
        }
        return lab;
      });
    },

    /**
     * @param {{ labId?: number, studentId?: number }} [filter]
     * @returns {Promise<Submission[]>}
     */
    async listSubmissions(filter = {}) {
      const conditions = [];
      /** @type {unknown[]} */
      const params = [];
      if (filter.labId !== undefined) {
        params.push(filter.labId);
        conditions.push(`lab_id = $${params.length}`);
      }
      if (filter.studentId !== undefined) {
        params.push(filter.studentId);
        conditions.push(`student_id = $${params.length}`);
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await db.query(
        `SELECT id, lab_id, student_id, source_code, status, is_counted, created_at, test_results_json
           FROM submissions ${where} ORDER BY id`,
        params,
      );
      return rows.map(toSubmission);
    },

    /**
     * @param {number} id
     * @returns {Promise<Submission | null>}
     */
    async findSubmission(id) {
      const { rows } = await db.query(
        'SELECT id, lab_id, student_id, source_code, status, is_counted, created_at, test_results_json FROM submissions WHERE id = $1',
        [id],
      );
      return rows[0] ? toSubmission(rows[0]) : null;
    },

    /**
     * Only the last submission of a student in a lab is counted (FAQ-02), and the
     * new one is queued for the worker in the same transaction.
     *
     * @param {{ labId: number, studentId: number, sourceCode: string, submittedAt: string }} input
     * @returns {Promise<Submission>}
     */
    async createSubmission({ labId, studentId, sourceCode }) {
      return db.transaction(async (tx) => {
        await tx.query(
          'UPDATE submissions SET is_counted = false WHERE lab_id = $1 AND student_id = $2',
          [labId, studentId],
        );
        const { rows } = await tx.query(
          `INSERT INTO submissions (lab_id, student_id, source_code, is_counted)
           VALUES ($1, $2, $3, true)
           RETURNING id, lab_id, student_id, source_code, status, is_counted, created_at, test_results_json`,
          [labId, studentId, sourceCode],
        );
        const submission = toSubmission(rows[0]);
        await enqueueJob(tx, submission.id);
        return submission;
      });
    },

    /**
     * @param {{
     *   submissionId: number,
     *   constraintId: number,
     *   verdict: Verdict['verdict'],
     *   evidence?: Array<{ line: number, text: string }>,
     *   decidedBy?: Verdict['decidedBy'],
     *   unsureReason?: string | null,
     * }} input
     * @returns {Promise<Verdict>}
     */
    async addVerdict({
      submissionId,
      constraintId,
      verdict,
      evidence = [],
      decidedBy = 'fallback',
      unsureReason = null,
    }) {
      const { rows } = await db.query(
        `INSERT INTO verdicts (submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (submission_id, constraint_id) DO UPDATE
           SET verdict = EXCLUDED.verdict,
               evidence_json = EXCLUDED.evidence_json,
               decided_by = EXCLUDED.decided_by,
               unsure_reason = EXCLUDED.unsure_reason
         RETURNING id, submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason, ta_decision`,
        [submissionId, constraintId, verdict, JSON.stringify(evidence), decidedBy, unsureReason],
      );
      return toVerdict(rows[0]);
    },

    /**
     * @param {number} submissionId
     * @returns {Promise<Verdict[]>}
     */
    async listVerdictsForSubmission(submissionId) {
      const { rows } = await db.query(
        `SELECT id, submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason, ta_decision
           FROM verdicts WHERE submission_id = $1 ORDER BY constraint_id`,
        [submissionId],
      );
      return rows.map(toVerdict);
    },

    /**
     * @param {number} labId
     * @returns {Promise<Verdict[]>}
     */
    async listVerdictsForLab(labId) {
      const { rows } = await db.query(
        `SELECT v.id, v.submission_id, v.constraint_id, v.verdict, v.evidence_json,
                v.decided_by, v.unsure_reason, v.ta_decision
           FROM verdicts v JOIN submissions s ON s.id = v.submission_id
          WHERE s.lab_id = $1 ORDER BY v.submission_id, v.constraint_id`,
        [labId],
      );
      return rows.map(toVerdict);
    },

    /**
     * @param {number} id
     * @returns {Promise<Verdict | null>}
     */
    async findVerdict(id) {
      const { rows } = await db.query(
        'SELECT id, submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason, ta_decision FROM verdicts WHERE id = $1',
        [id],
      );
      return rows[0] ? toVerdict(rows[0]) : null;
    },

    /**
     * The TA's decision replaces the model's evidence on a violation; a `pass` keeps
     * the evidence the TA saw while reviewing.
     *
     * @param {number} id
     * @param {'pass' | 'violation'} decision
     * @param {Array<{ line: number, text: string }>} evidence
     * @returns {Promise<Verdict | null>}
     */
    async decideVerdict(id, decision, evidence) {
      const { rows } = await db.query(
        `UPDATE verdicts
            SET ta_decision = $2,
                reviewed = true,
                evidence_json = CASE WHEN $2 = 'violation' THEN $3::jsonb ELSE evidence_json END
          WHERE id = $1
          RETURNING id, submission_id, constraint_id, verdict, evidence_json, decided_by, unsure_reason, ta_decision`,
        [id, decision, JSON.stringify(evidence)],
      );
      return rows[0] ? toVerdict(rows[0]) : null;
    },

    /**
     * @param {ModelCall} call
     * @returns {Promise<void>}
     */
    async addModelCall(call) {
      await db.query(
        `INSERT INTO model_calls
           (submission_id, constraint_id, provider, model, provider_request_id,
            tokens_in, tokens_out, latency_ms, cost_usd, outcome)
         VALUES ($1, $2, 'google', $3, $4, $5, $6, $7, $8, 'answered')`,
        [
          call.submissionId,
          call.constraintId,
          call.model,
          call.requestId,
          call.tokensIn,
          call.tokensOut,
          call.latencyMs,
          call.costUsd,
        ],
      );
    },

    /**
     * @param {number} labId
     * @returns {Promise<ModelCall[]>}
     */
    async listModelCalls(labId) {
      const { rows } = await db.query(
        `SELECT c.id, c.submission_id, c.constraint_id, c.model, c.provider_request_id,
                c.tokens_in, c.tokens_out, c.latency_ms, c.cost_usd, c.created_at
           FROM model_calls c JOIN submissions s ON s.id = c.submission_id
          WHERE s.lab_id = $1 ORDER BY c.id`,
        [labId],
      );
      return rows.map((row) => ({
        id: Number(row.id),
        submissionId: Number(row.submission_id),
        constraintId: Number(row.constraint_id),
        model: String(row.model),
        requestId: row.provider_request_id === null ? '' : String(row.provider_request_id),
        tokensIn: Number(row.tokens_in ?? 0),
        tokensOut: Number(row.tokens_out ?? 0),
        latencyMs: Number(row.latency_ms ?? 0),
        costUsd: Number(row.cost_usd ?? 0),
        at: new Date(row.created_at).toISOString(),
      }));
    },
  };
}
