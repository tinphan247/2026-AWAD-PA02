/**
 * Shared helpers for the contract tests of `POST /v1/labs/{labId}/submissions`.
 *
 * Contract: docs/contract/post-labs-labId-submissions.md (version 1, frozen).
 *
 * The contract does not say how tests start the app, seed data or simulate
 * failures. This file is the only place that knows. The test seam agreed with
 * Tín is:
 *
 *   createApp({ seed, repo?, hooks: { beforeCreate }, clock })
 *     → { handler, testing }
 *
 *   handler  a node:http request listener
 *   testing  {
 *              submissionCount(filter?: { studentId?, labId? }): number,
 *              failNextCreate(): void,              // next create throws → 500
 *              unenroll(studentId, classId): void,  // optional
 *              expireToken(token): void,            // optional
 *            }
 *   hooks.beforeCreate(ctx: { studentId, labId, key }): Promise<void> | void
 *            runs after the Idempotency-Key is reserved (in flight) and before
 *            the submission is stored; never for a replay, a 409 or a 422.
 *   clock.now(): Date
 *            the server's only source of time (submittedAt, token expiry,
 *            key lifetime).
 *
 * If the seam changes, change the typedefs and `startApp()` below. Tests use
 * only the exports of this file, so they should not need to change.
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

import * as appModule from '../../src/app.js';

// ---------------------------------------------------------------------------
// Seam types
// ---------------------------------------------------------------------------

/**
 * @typedef {'student' | 'ta' | 'admin'} Role
 * @typedef {{ id: number, role: Role }} SeedUser
 * @typedef {{ token: string, userId: number, expiresAt: string }} SeedToken
 * @typedef {{ id: number }} SeedClass
 * @typedef {{ id: number, classId: number }} SeedLab
 * @typedef {{ studentId: number, classId: number }} SeedEnrollment
 * @typedef {{
 *   users: SeedUser[],
 *   tokens: SeedToken[],
 *   classes: SeedClass[],
 *   labs: SeedLab[],
 *   enrollments: SeedEnrollment[],
 * }} Seed
 *
 * @typedef {{ studentId: number, labId: number, key: string }} CreateContext
 * @typedef {{ beforeCreate?: (ctx: CreateContext) => Promise<void> | void }} Hooks
 * @typedef {{ now: () => Date }} Clock
 *
 * @typedef {{
 *   submissionCount: (filter?: { studentId?: number, labId?: number }) => number,
 *   failNextCreate: () => void,
 *   unenroll?: (studentId: number, classId: number) => void,
 *   expireToken?: (token: string) => void,
 * }} Testing
 *
 * @typedef {{ seed: Seed, repo?: unknown, hooks?: Hooks, clock?: Clock }} CreateAppOptions
 * @typedef {(options: CreateAppOptions) => {
 *   handler: import('node:http').RequestListener,
 *   testing: Testing,
 * }} CreateApp
 */

// The skeleton's createApp() predates the seam, so it is cast to the agreed
// type here. Until Tín's endpoint lands, startApp() fails with a clear message.
const createApp = /** @type {CreateApp} */ (/** @type {unknown} */ (appModule.createApp));

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/** Start time of the fake clock. Every token except EXPIRED is valid then. */
export const CLOCK_START = new Date('2026-11-10T03:15:00.000Z');

export const CLASSES = Object.freeze({ A: 1, B: 2 });

/** Lab ids. A1 matches the contract examples (lab 7). */
export const LABS = Object.freeze({ A1: 7, A2: 8, B1: 9 });

/** A lab id that no lab has. */
export const MISSING_LAB = 999;

export const USERS = Object.freeze({
  S1: { id: 1001, role: /** @type {Role} */ ('student') }, // enrolled in A
  S2: { id: 1002, role: /** @type {Role} */ ('student') }, // enrolled in B
  S3: { id: 1003, role: /** @type {Role} */ ('student') }, // enrolled in nothing
  S4: { id: 1004, role: /** @type {Role} */ ('student') }, // enrolled in A
  TA: { id: 2001, role: /** @type {Role} */ ('ta') },
  ADMIN: { id: 3001, role: /** @type {Role} */ ('admin') },
});

export const TOKENS = Object.freeze({
  S1: 'test-token-s1',
  S2: 'test-token-s2',
  S3: 'test-token-s3',
  S4: 'test-token-s4',
  TA: 'test-token-ta',
  ADMIN: 'test-token-admin',
  /** Belongs to S1 and expired before CLOCK_START. */
  EXPIRED: 'test-token-s1-expired',
});

const FAR_FUTURE = '2099-01-01T00:00:00.000Z';

/** @returns {Seed} a fresh copy, so no test can change another test's seed */
export function makeSeed() {
  return {
    users: Object.values(USERS).map((u) => ({ ...u })),
    tokens: [
      { token: TOKENS.S1, userId: USERS.S1.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.S2, userId: USERS.S2.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.S3, userId: USERS.S3.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.S4, userId: USERS.S4.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.TA, userId: USERS.TA.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.ADMIN, userId: USERS.ADMIN.id, expiresAt: FAR_FUTURE },
      { token: TOKENS.EXPIRED, userId: USERS.S1.id, expiresAt: '2026-11-09T00:00:00.000Z' },
    ],
    classes: [{ id: CLASSES.A }, { id: CLASSES.B }],
    labs: [
      { id: LABS.A1, classId: CLASSES.A },
      { id: LABS.A2, classId: CLASSES.A },
      { id: LABS.B1, classId: CLASSES.B },
    ],
    enrollments: [
      { studentId: USERS.S1.id, classId: CLASSES.A },
      { studentId: USERS.S4.id, classId: CLASSES.A },
      { studentId: USERS.S2.id, classId: CLASSES.B },
    ],
  };
}

// ---------------------------------------------------------------------------
// Problem types (contract §2)
// ---------------------------------------------------------------------------

export const PROBLEM_BASE = 'https://leetkob.example/problems/';

/** @typedef {{ slug: string, status: number, title: string }} ProblemSpec */

export const PROBLEMS = Object.freeze({
  invalidJson: { slug: 'invalid-json', status: 400, title: 'Malformed JSON' },
  validation: { slug: 'validation', status: 400, title: 'Invalid request' },
  idempotencyKeyMissing: {
    slug: 'idempotency-key-missing',
    status: 400,
    title: 'Idempotency-Key required',
  },
  unauthorized: { slug: 'unauthorized', status: 401, title: 'Authentication required' },
  forbidden: { slug: 'forbidden', status: 403, title: 'Forbidden' },
  notFound: { slug: 'not-found', status: 404, title: 'Not found' },
  methodNotAllowed: { slug: 'method-not-allowed', status: 405, title: 'Method not allowed' },
  inFlight: { slug: 'idempotency-key-in-flight', status: 409, title: 'Request in progress' },
  payloadTooLarge: { slug: 'payload-too-large', status: 413, title: 'Payload too large' },
  unsupportedMediaType: {
    slug: 'unsupported-media-type',
    status: 415,
    title: 'Unsupported media type',
  },
  keyReused: { slug: 'idempotency-key-reused', status: 422, title: 'Idempotency-Key reused' },
  internal: { slug: 'internal', status: 500, title: 'Internal error' },
});

/** The fixed `detail` of a 500 (contract §2). */
export const INTERNAL_DETAIL = 'An unexpected error occurred.';

// ---------------------------------------------------------------------------
// startApp
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   reached: Promise<CreateContext>,
 *   release: () => void,
 * }} Hold
 *
 * @typedef {{
 *   baseUrl: string,
 *   close: () => Promise<void>,
 *   submissionCount: Testing['submissionCount'],
 *   failNextCreate: () => void,
 *   holdNextCreate: () => Hold,
 *   advanceClock: (ms: number) => void,
 *   now: () => Date,
 *   unenroll: (studentId: number, classId: number) => void,
 *   expireToken: (token: string) => void,
 * }} TestApp
 */

/**
 * Start a fresh app with a fresh seed on 127.0.0.1, port 0.
 *
 * @param {{ seed?: Seed, repo?: unknown }} [options]
 * @returns {Promise<TestApp>}
 */
export async function startApp({ seed = makeSeed(), repo } = {}) {
  let nowMs = CLOCK_START.getTime();
  /** @type {Clock} */
  const clock = { now: () => new Date(nowMs) };

  /** @type {Array<{ onReached: (ctx: CreateContext) => void, gate: Promise<void> }>} */
  const holds = [];
  /** @type {Array<() => void>} release functions of every hold, so close() can free them */
  const releases = [];

  /** @type {Hooks} */
  const hooks = {
    beforeCreate(ctx) {
      const hold = holds.shift();
      if (hold === undefined) return;
      hold.onReached(ctx);
      return hold.gate;
    },
  };

  /** @type {CreateAppOptions} */
  const options = { seed, hooks, clock };
  if (repo !== undefined) options.repo = repo;

  const app = createApp(options);
  if (
    app === null ||
    typeof app !== 'object' ||
    typeof app.handler !== 'function' ||
    typeof app.testing?.submissionCount !== 'function'
  ) {
    throw new Error(
      'src/app.js createApp() does not implement the agreed test seam yet ' +
        '(expected { handler, testing }); see the comment at the top of test/contract/helpers.js',
    );
  }
  const { handler, testing } = app;

  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(undefined));
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Unexpected server address');
  }

  /** @param {string} name */
  const optional = (name) => () => {
    throw new Error(`testing.${name}() is not implemented by createApp (optional seam)`);
  };

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close() {
      holds.length = 0;
      for (const release of releases) release();
      server.closeAllConnections();
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
    submissionCount: (filter) => testing.submissionCount(filter),
    failNextCreate: () => testing.failNextCreate(),
    holdNextCreate() {
      /** @type {(ctx: CreateContext) => void} */
      let markReached = () => {};
      /** @type {() => void} */
      let release = () => {};
      /** @type {Promise<CreateContext>} */
      const reached = new Promise((resolve) => {
        markReached = resolve;
      });
      /** @type {Promise<void>} */
      const gate = new Promise((resolve) => {
        release = () => resolve();
      });
      holds.push({ onReached: markReached, gate });
      releases.push(release);
      return { reached, release };
    },
    advanceClock(ms) {
      nowMs += ms;
    },
    now: () => clock.now(),
    unenroll: testing.unenroll ?? optional('unenroll'),
    expireToken: testing.expireToken ?? optional('expireToken'),
  };
}

// ---------------------------------------------------------------------------
// request
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   method?: string,
 *   labId?: number | string,
 *   path?: string,
 *   token?: string | null,
 *   authorization?: string,
 *   idempotencyKey?: string | null,
 *   contentType?: string | null,
 *   body?: unknown,
 *   rawBody?: string | Uint8Array,
 *   headers?: Record<string, string>,
 * }} RequestOptions
 */

/**
 * Send one request. Defaults: POST to lab A1 as S1 with a fresh UUID key,
 * `Content-Type: application/json` and `validBody()`.
 *
 * - `path` overrides `labId`.
 * - `token: null`, `idempotencyKey: null`, `contentType: null` omit that header.
 * - `authorization` sets the raw `Authorization` header (overrides `token`).
 * - `body` is JSON-encoded; `rawBody` is sent byte for byte.
 *
 * The body is always sent as bytes, so fetch never adds a Content-Type of its own.
 *
 * @param {string} baseUrl
 * @param {RequestOptions} [options]
 * @returns {Promise<Response>}
 */
export function request(baseUrl, options = {}) {
  const {
    method = 'POST',
    labId = LABS.A1,
    path = `/v1/labs/${labId}/submissions`,
    token = TOKENS.S1,
    authorization,
    idempotencyKey = randomUUID(),
    contentType = 'application/json',
    headers = {},
  } = options;

  /** @type {Record<string, string>} */
  const allHeaders = {};
  if (authorization !== undefined) allHeaders.authorization = authorization;
  else if (token !== null) allHeaders.authorization = `Bearer ${token}`;
  if (idempotencyKey !== null) allHeaders['idempotency-key'] = idempotencyKey;
  if (contentType !== null) allHeaders['content-type'] = contentType;
  Object.assign(allHeaders, headers);

  /** @type {Uint8Array | undefined} */
  let bytes;
  if (method !== 'GET' && method !== 'HEAD') {
    if (options.rawBody !== undefined) {
      bytes =
        typeof options.rawBody === 'string'
          ? new TextEncoder().encode(options.rawBody)
          : options.rawBody;
    } else {
      const body = 'body' in options ? options.body : validBody();
      bytes = new TextEncoder().encode(JSON.stringify(body));
    }
  }

  return fetch(`${baseUrl}${path}`, { method, headers: allHeaders, body: bytes });
}

/**
 * A valid request body (contract §5.3).
 *
 * @param {Record<string, unknown>} [overrides]
 * @returns {Record<string, unknown>}
 */
export function validBody(overrides = {}) {
  return { sourceCode: '#include <iostream>\nint main() { return 0; }\n', ...overrides };
}

/** @param {string} text @returns {number} UTF-8 byte length */
export function byteLength(text) {
  return Buffer.byteLength(text, 'utf8');
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

const STACK_TRACE = /\n\s*at\s|\bat\s+\S+\s+\(.*:\d+:\d+\)/;
const FILE_PATH =
  /[A-Za-z]:[\\/]|file:\/\/|node_modules|\/(?:src|home|Users|usr|var|tmp)\/|\.[cm]?[jt]s\b/;

/**
 * Check a problem details response (contract §2) and return its parsed body.
 *
 * Also checks the extra headers: `WWW-Authenticate: Bearer` on 401 and
 * `Allow: POST` on 405.
 *
 * @param {Response} res
 * @param {ProblemSpec & { mustNotContain?: string[] }} expected
 *   `mustNotContain`: strings (a token, submitted source code) that must not
 *   appear anywhere in the response body.
 * @returns {Promise<Record<string, any>>}
 */
export async function assertProblem(res, { slug, status, title, mustNotContain = [] }) {
  const text = await res.text();

  assert.equal(res.status, status, `HTTP status (body: ${text.slice(0, 300)})`);
  const contentType = res.headers.get('content-type') ?? '';
  assert.match(contentType, /^application\/problem\+json\b/i, 'Content-Type');

  /** @type {Record<string, any>} */
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    assert.fail(`problem body is not JSON: ${text.slice(0, 300)}`);
  }

  assert.equal(body.type, `${PROBLEM_BASE}${slug}`, 'type');
  assert.equal(body.title, title, 'title');
  assert.equal(body.status, status, 'status member');
  assert.equal(typeof body.detail, 'string', 'detail is a string');
  assert.ok(body.detail.trim().length > 0, 'detail is not empty');
  assert.doesNotMatch(body.detail, STACK_TRACE, 'detail must not contain a stack trace');
  assert.doesNotMatch(body.detail, FILE_PATH, 'detail must not contain a file path');
  assert.doesNotMatch(text, STACK_TRACE, 'body must not contain a stack trace');

  if (slug !== 'validation') {
    assert.equal(body.errors, undefined, '`errors` appears only on validation');
  }
  if (status === 401) {
    assert.match(res.headers.get('www-authenticate') ?? '', /^Bearer\b/i, 'WWW-Authenticate');
  }
  if (status === 405) {
    assert.equal(res.headers.get('allow'), 'POST', 'Allow');
  }
  for (const secret of mustNotContain) {
    assert.ok(!text.includes(secret), 'response must not echo a token or submitted source code');
  }

  return body;
}

/**
 * Check a `400 validation` problem and its `errors` pointers (contract §5.3).
 *
 * @param {Response} res
 * @param {string[]} pointers expected pointers, in any order
 * @param {{ mustNotContain?: string[] }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function assertValidation(res, pointers, { mustNotContain = [] } = {}) {
  const body = await assertProblem(res, { ...PROBLEMS.validation, mustNotContain });

  assert.ok(Array.isArray(body.errors), '`errors` is an array');
  for (const entry of body.errors) {
    assert.equal(typeof entry.pointer, 'string', 'errors[].pointer is a string');
    assert.equal(typeof entry.detail, 'string', 'errors[].detail is a string');
  }
  assert.deepEqual(
    body.errors.map((/** @type {{ pointer: string }} */ e) => e.pointer).sort(),
    [...pointers].sort(),
    'errors[].pointer',
  );

  return body;
}

const ISO_UTC_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Check a `201` Submission response (contract §4, §5.4 step 12) and return it.
 *
 * @param {Response} res
 * @param {{ labId: number, studentId: number, mustNotContain?: string[] }} expected
 * @returns {Promise<Record<string, any>>}
 */
export async function assertSubmission(res, { labId, studentId, mustNotContain = [] }) {
  const text = await res.text();

  assert.equal(res.status, 201, `HTTP status (body: ${text.slice(0, 300)})`);
  assert.match(res.headers.get('content-type') ?? '', /^application\/json\b/i, 'Content-Type');
  assert.equal(res.headers.get('location'), null, 'no Location header');

  /** @type {Record<string, any>} */
  const body = JSON.parse(text);

  assert.ok(Number.isSafeInteger(body.id) && body.id > 0, 'id is a positive integer');
  assert.equal(body.labId, labId, 'labId');
  assert.equal(body.studentId, studentId, 'studentId');
  assert.equal(body.status, 'queued', 'status');
  assert.equal(typeof body.submittedAt, 'string', 'submittedAt is a string');
  assert.match(body.submittedAt, ISO_UTC_MS, 'submittedAt is ISO 8601 UTC with milliseconds');
  assert.ok(!Number.isNaN(Date.parse(body.submittedAt)), 'submittedAt is a real date');
  assert.equal('sourceCode' in body, false, 'source code is never returned');
  for (const secret of mustNotContain) {
    assert.ok(!text.includes(secret), 'response must not echo a token or submitted source code');
  }

  return body;
}
