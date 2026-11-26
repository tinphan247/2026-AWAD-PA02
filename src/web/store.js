/**
 * In-memory state for the PA#3 web flow.
 *
 * PA#2's `src/repo/memory.js` stays untouched: the contract tests pin its
 * shape. This store is the seam the UI uses today and the Postgres repo
 * replaces later, method for method (Tùng owns the schema).
 */

import { isBanList } from '../domain/labs.js';

/** @typedef {import('../domain/labs.js').Lab} Lab */
/** @typedef {import('../domain/labs.js').Constraint} Constraint */
/** @typedef {import('../domain/labs.js').LabTest} LabTest */
/** @typedef {import('../domain/labs.js').ConstraintInput} ConstraintInput */
/** @typedef {import('../domain/review.js').Verdict} Verdict */
/** @typedef {import('../domain/review.js').VerdictValue} VerdictValue */
/** @typedef {import('../domain/review.js').EvidenceLine} EvidenceLine */

/** @typedef {'admin' | 'ta' | 'student'} Role */
/** @typedef {{ id: number, name: string, role: Role, classId: number | null, token: string }} User */
/** @typedef {{ id: number, name: string }} ClassRoom */
/** @typedef {{ name: string, verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' }} TestResult */
/**
 * @typedef {{
 *   id: number,
 *   labId: number,
 *   studentId: number,
 *   sourceCode: string,
 *   status: 'queued' | 'judging' | 'judged' | 'error',
 *   counted: boolean,
 *   submittedAt: string,
 *   tests: TestResult[],
 * }} Submission
 */

/**
 * @typedef {{
 *   id: number,
 *   submissionId: number,
 *   constraintId: number,
 *   model: string,
 *   requestId: string,
 *   tokensIn: number,
 *   tokensOut: number,
 *   latencyMs: number,
 *   costUsd: number,
 *   at: string,
 * }} ModelCall
 */

/** @typedef {{ users: User[], classes: ClassRoom[] }} WebSeed */

/**
 * The demo accounts required by `PA3.md`: one admin, two TAs in different
 * classes, and three students in the first TA's class.
 *
 * @returns {WebSeed}
 */
export function defaultSeed() {
  return {
    users: [
      { id: 1, name: 'Quản trị viên', role: 'admin', classId: null, token: 'admin-token' },
      { id: 2, name: 'Trợ giảng lớp 1', role: 'ta', classId: 1, token: 'ta1-token' },
      { id: 3, name: 'Trợ giảng lớp 2', role: 'ta', classId: 2, token: 'ta2-token' },
      { id: 4, name: 'Phan Trung Tín', role: 'student', classId: 1, token: 'sv1-token' },
      { id: 5, name: 'Sinh viên 2', role: 'student', classId: 1, token: 'sv2-token' },
      { id: 6, name: 'Sinh viên 3', role: 'student', classId: 1, token: 'sv3-token' },
      { id: 7, name: 'Sinh viên lớp 2', role: 'student', classId: 2, token: 'sv4-token' },
    ],
    classes: [
      { id: 1, name: 'Lớp 1' },
      { id: 2, name: 'Lớp 2' },
    ],
  };
}

/**
 * @param {{ seed?: WebSeed }} [options]
 */
export function createWebStore({ seed = defaultSeed() } = {}) {
  /** @type {Map<number, User>} */
  const users = new Map(seed.users.map((user) => [user.id, { ...user }]));
  /** @type {Map<string, number>} */
  const tokens = new Map(seed.users.map((user) => [user.token, user.id]));
  /** @type {Map<number, ClassRoom>} */
  const classes = new Map(seed.classes.map((room) => [room.id, { ...room }]));
  /** @type {Map<number, Lab>} */
  const labs = new Map();
  /** @type {Submission[]} */
  const submissions = [];
  /** @type {Verdict[]} */
  const verdicts = [];
  /** @type {ModelCall[]} */
  const modelCalls = [];

  let nextLabId = 1;
  let nextConstraintId = 1;
  let nextSubmissionId = 1;
  let nextVerdictId = 1;

  return {
    /**
     * @param {string} token
     * @returns {User | null}
     */
    findUserByToken(token) {
      const id = tokens.get(token);
      return id === undefined ? null : (users.get(id) ?? null);
    },

    /**
     * @param {number} id
     * @returns {User | null}
     */
    findUser(id) {
      return users.get(id) ?? null;
    },

    /**
     * @param {number} id
     * @returns {ClassRoom | null}
     */
    findClass(id) {
      return classes.get(id) ?? null;
    },

    /**
     * @param {number | null} classId `null` lists every class (admin view).
     * @returns {Lab[]}
     */
    listLabs(classId) {
      return [...labs.values()]
        .filter((lab) => classId === null || lab.classId === classId)
        .sort((a, b) => b.id - a.id);
    },

    /**
     * @param {number} id
     * @returns {Lab | null}
     */
    findLab(id) {
      return labs.get(id) ?? null;
    },

    /**
     * @param {{
     *   classId: number,
     *   title: string,
     *   statement: string,
     *   tests: LabTest[],
     *   constraints: ConstraintInput[],
     *   createdBy: number,
     *   now: Date,
     * }} input
     * @returns {Lab}
     */
    createLab({ classId, title, statement, tests, constraints, createdBy, now }) {
      /** @type {Constraint[]} */
      const storedConstraints = constraints.map((constraint) => {
        const id = nextConstraintId;
        nextConstraintId += 1;
        return {
          id,
          text: constraint.text,
          deduction: constraint.deduction,
          kind: isBanList(constraint.text) ? 'ban_list' : 'semantic',
        };
      });

      /** @type {Lab} */
      const lab = {
        id: nextLabId,
        classId,
        title,
        statement,
        tests,
        constraints: storedConstraints,
        createdBy,
        createdAt: now.toISOString(),
        publishedAt: null,
      };

      nextLabId += 1;
      labs.set(lab.id, lab);
      return lab;
    },

    /**
     * @param {{ labId?: number, studentId?: number }} [filter]
     * @returns {Submission[]}
     */
    listSubmissions(filter = {}) {
      return submissions.filter(
        (submission) =>
          (filter.labId === undefined || submission.labId === filter.labId) &&
          (filter.studentId === undefined || submission.studentId === filter.studentId),
      );
    },

    /**
     * @param {number} id
     * @returns {Submission | null}
     */
    findSubmission(id) {
      return submissions.find((submission) => submission.id === id) ?? null;
    },

    /**
     * Only the last submission of a student in a lab is counted (FAQ-02).
     *
     * @param {{ labId: number, studentId: number, sourceCode: string, submittedAt: string }} input
     * @returns {Submission}
     */
    createSubmission({ labId, studentId, sourceCode, submittedAt }) {
      for (const previous of submissions) {
        if (previous.labId === labId && previous.studentId === studentId) {
          previous.counted = false;
        }
      }

      /** @type {Submission} */
      const submission = {
        id: nextSubmissionId,
        labId,
        studentId,
        sourceCode,
        status: 'queued',
        counted: true,
        submittedAt,
        tests: [],
      };

      nextSubmissionId += 1;
      submissions.push(submission);
      return submission;
    },

    /**
     * Upsert one verdict. The Postgres table has a unique
     * `(submission_id, constraint_id)`, so a retried worker overwrites rather
     * than duplicates.
     *
     * @param {{
     *   submissionId: number,
     *   constraintId: number,
     *   verdict: VerdictValue,
     *   evidence?: EvidenceLine[],
     *   decidedBy?: Verdict['decidedBy'],
     *   unsureReason?: string | null,
     * }} input
     * @returns {Verdict}
     */
    addVerdict({
      submissionId,
      constraintId,
      verdict,
      evidence = [],
      decidedBy = 'pending',
      unsureReason = null,
    }) {
      const existing = verdicts.find(
        (entry) => entry.submissionId === submissionId && entry.constraintId === constraintId,
      );

      if (existing !== undefined) {
        existing.verdict = verdict;
        existing.evidence = evidence;
        existing.decidedBy = decidedBy;
        existing.unsureReason = unsureReason;
        return existing;
      }

      /** @type {Verdict} */
      const stored = {
        id: nextVerdictId,
        submissionId,
        constraintId,
        verdict,
        evidence,
        decidedBy,
        unsureReason,
        taDecision: null,
      };

      nextVerdictId += 1;
      verdicts.push(stored);
      return stored;
    },

    /**
     * @param {number} submissionId
     * @returns {Verdict[]}
     */
    listVerdictsForSubmission(submissionId) {
      return verdicts.filter((verdict) => verdict.submissionId === submissionId);
    },

    /**
     * @param {number} labId
     * @returns {Verdict[]}
     */
    listVerdictsForLab(labId) {
      const ids = new Set(
        submissions
          .filter((submission) => submission.labId === labId)
          .map((submission) => submission.id),
      );
      return verdicts.filter((verdict) => ids.has(verdict.submissionId));
    },

    /**
     * @param {number} id
     * @returns {Verdict | null}
     */
    findVerdict(id) {
      return verdicts.find((verdict) => verdict.id === id) ?? null;
    },

    /**
     * @param {number} id
     * @param {'pass' | 'violation'} decision
     * @param {EvidenceLine[]} evidence
     * @returns {Verdict | null}
     */
    decideVerdict(id, decision, evidence) {
      const verdict = verdicts.find((entry) => entry.id === id);
      if (verdict === undefined) return null;

      verdict.taDecision = decision;
      if (decision === 'violation') verdict.evidence = evidence;
      return verdict;
    },

    /**
     * @param {ModelCall} call
     * @returns {void}
     */
    addModelCall(call) {
      modelCalls.push(call);
    },

    /**
     * @param {number} labId
     * @returns {ModelCall[]}
     */
    listModelCalls(labId) {
      const ids = new Set(
        submissions
          .filter((submission) => submission.labId === labId)
          .map((submission) => submission.id),
      );
      return modelCalls.filter((call) => ids.has(call.submissionId));
    },
  };
}
