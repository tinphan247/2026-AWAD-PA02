/**
 * In-memory repository: the only stateful part of the PA#2 server.
 *
 * The seed and the shape of the test seam are fixed by
 * test/contract/helpers.js. Time is never read here; callers pass the clock's
 * current time in, so tests can move time forward.
 */

/** @typedef {'student' | 'ta' | 'admin'} Role */
/** @typedef {{ id: number, role: Role }} User */
/** @typedef {{ token: string, userId: number, expiresAt: string }} TokenRecord */
/** @typedef {{ id: number, classId: number }} Lab */
/** @typedef {{ studentId: number, classId: number }} Enrollment */

/**
 * @typedef {{
 *   id: number,
 *   labId: number,
 *   studentId: number,
 *   status: 'queued',
 *   submittedAt: string,
 * }} Submission
 */

/**
 * @typedef {{
 *   users?: User[],
 *   tokens?: TokenRecord[],
 *   classes?: { id: number }[],
 *   labs?: Lab[],
 *   enrollments?: Enrollment[],
 * }} Seed
 */

/**
 * @typedef {{
 *   state: 'in-flight' | 'done',
 *   fingerprint: string,
 *   createdAt: number,
 *   submission?: Submission,
 * }} IdempotencyRecord
 */

/** A stored key is kept for at least 24 hours (contract §6). */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const EXPIRED_AT = '1970-01-01T00:00:00.000Z';

/**
 * @param {string} studentId
 * @param {string} key
 * @returns {string}
 */
function idempotencyKey(studentId, key) {
  return `${studentId}\u0000${key}`;
}

/**
 * Create a fresh, isolated repository.
 *
 * @param {{ seed?: Seed }} [options]
 */
export function createMemoryRepo({ seed = {} } = {}) {
  /** @type {Map<number, User>} */
  const users = new Map((seed.users ?? []).map((user) => [user.id, user]));
  /** @type {Map<string, TokenRecord>} */
  const tokens = new Map((seed.tokens ?? []).map((record) => [record.token, record]));
  /** @type {Map<number, Lab>} */
  const labs = new Map((seed.labs ?? []).map((lab) => [lab.id, lab]));
  /** @type {Set<string>} */
  const enrollments = new Set(
    (seed.enrollments ?? []).map((enrollment) => `${enrollment.studentId}:${enrollment.classId}`),
  );

  /** @type {Submission[]} */
  const submissions = [];
  /** @type {Map<string, IdempotencyRecord>} */
  const idempotency = new Map();

  let nextId = 1;
  let failNextCreate = false;

  /**
   * Drop stored responses older than the 24 hour lifetime.
   *
   * @param {number} nowMs
   */
  function prune(nowMs) {
    for (const [key, record] of idempotency) {
      if (record.state === 'done' && nowMs - record.createdAt > IDEMPOTENCY_TTL_MS) {
        idempotency.delete(key);
      }
    }
  }

  return {
    /**
     * @param {string} token
     * @returns {TokenRecord | null}
     */
    findToken(token) {
      return tokens.get(token) ?? null;
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
     * @returns {Lab | null}
     */
    findLab(id) {
      return labs.get(id) ?? null;
    },

    /**
     * @param {number} studentId
     * @param {number} classId
     * @returns {boolean}
     */
    isEnrolled(studentId, classId) {
      return enrollments.has(`${studentId}:${classId}`);
    },

    /**
     * Step 10 of the check order: look the key up and, when it is new,
     * reserve it as in flight before the body is validated.
     *
     * @param {number} studentId
     * @param {string} key
     * @param {string} fingerprint
     * @param {Date} now
     * @returns {{ kind: 'reserved' }
     *   | { kind: 'in-flight' }
     *   | { kind: 'reused' }
     *   | { kind: 'replay', submission: Submission }}
     */
    beginIdempotent(studentId, key, fingerprint, now) {
      const nowMs = now.getTime();
      prune(nowMs);

      const mapKey = idempotencyKey(String(studentId), key);
      const existing = idempotency.get(mapKey);

      if (existing !== undefined) {
        if (existing.state === 'in-flight') return { kind: 'in-flight' };
        if (existing.fingerprint !== fingerprint) return { kind: 'reused' };
        if (existing.submission === undefined) return { kind: 'in-flight' };
        return { kind: 'replay', submission: existing.submission };
      }

      idempotency.set(mapKey, { state: 'in-flight', fingerprint, createdAt: nowMs });
      return { kind: 'reserved' };
    },

    /**
     * Free a reservation after the request failed to produce a 201.
     *
     * @param {number} studentId
     * @param {string} key
     */
    releaseIdempotent(studentId, key) {
      const mapKey = idempotencyKey(String(studentId), key);
      const existing = idempotency.get(mapKey);
      if (existing?.state === 'in-flight') idempotency.delete(mapKey);
    },

    /**
     * Store the response atomically with the submission that produced it.
     *
     * @param {number} studentId
     * @param {string} key
     * @param {Submission} submission
     */
    completeIdempotent(studentId, key, submission) {
      const mapKey = idempotencyKey(String(studentId), key);
      const existing = idempotency.get(mapKey);
      if (existing === undefined) return;
      existing.state = 'done';
      existing.submission = submission;
    },

    /**
     * Step 12: create a submission, or throw when a failure is injected.
     *
     * @param {{ labId: number, studentId: number, submittedAt: string }} input
     * @returns {Submission}
     */
    createSubmission({ labId, studentId, submittedAt }) {
      if (failNextCreate) {
        failNextCreate = false;
        throw new Error('Injected repository failure');
      }

      /** @type {Submission} */
      const submission = {
        id: nextId,
        labId,
        studentId,
        status: 'queued',
        submittedAt,
      };
      nextId += 1;
      submissions.push(submission);
      return submission;
    },

    /** Test seam: make the next create fail with a 500. */
    failNextCreate() {
      failNextCreate = true;
    },

    /**
     * @param {{ studentId?: number, labId?: number }} [filter]
     * @returns {number}
     */
    countSubmissions(filter = {}) {
      return submissions.filter(
        (submission) =>
          (filter.studentId === undefined || submission.studentId === filter.studentId) &&
          (filter.labId === undefined || submission.labId === filter.labId),
      ).length;
    },

    /**
     * Test seam: remove an enrollment.
     *
     * @param {number} studentId
     * @param {number} classId
     */
    unenroll(studentId, classId) {
      enrollments.delete(`${studentId}:${classId}`);
    },

    /**
     * Test seam: expire a seeded token now.
     *
     * @param {string} token
     */
    expireToken(token) {
      const record = tokens.get(token);
      if (record === undefined) return;
      tokens.set(token, { ...record, expiresAt: EXPIRED_AT });
    },
  };
}
