/**
 * RFC 9457 problem details for this API.
 *
 * Contract: docs/contract/post-labs-labId-submissions.md §2.
 */

export const PROBLEM_BASE = 'https://leetkob.example/problems/';

/**
 * @typedef {'invalid-json'
 *   | 'validation'
 *   | 'idempotency-key-missing'
 *   | 'unauthorized'
 *   | 'forbidden'
 *   | 'not-found'
 *   | 'method-not-allowed'
 *   | 'idempotency-key-in-flight'
 *   | 'payload-too-large'
 *   | 'unsupported-media-type'
 *   | 'idempotency-key-reused'
 *   | 'internal'} ProblemKind
 */

/**
 * @typedef {{
 *   slug: string,
 *   status: number,
 *   title: string,
 * }} ProblemSpec
 */

/** @type {Readonly<Record<ProblemKind, ProblemSpec>>} */
export const PROBLEMS = Object.freeze({
  'invalid-json': { slug: 'invalid-json', status: 400, title: 'Malformed JSON' },
  validation: { slug: 'validation', status: 400, title: 'Invalid request' },
  'idempotency-key-missing': {
    slug: 'idempotency-key-missing',
    status: 400,
    title: 'Idempotency-Key required',
  },
  unauthorized: { slug: 'unauthorized', status: 401, title: 'Authentication required' },
  forbidden: { slug: 'forbidden', status: 403, title: 'Forbidden' },
  'not-found': { slug: 'not-found', status: 404, title: 'Not found' },
  'method-not-allowed': {
    slug: 'method-not-allowed',
    status: 405,
    title: 'Method not allowed',
  },
  'idempotency-key-in-flight': {
    slug: 'idempotency-key-in-flight',
    status: 409,
    title: 'Request in progress',
  },
  'payload-too-large': { slug: 'payload-too-large', status: 413, title: 'Payload too large' },
  'unsupported-media-type': {
    slug: 'unsupported-media-type',
    status: 415,
    title: 'Unsupported media type',
  },
  'idempotency-key-reused': {
    slug: 'idempotency-key-reused',
    status: 422,
    title: 'Idempotency-Key reused',
  },
  internal: { slug: 'internal', status: 500, title: 'Internal error' },
});

/** The fixed `detail` of a 500 (contract §2). */
export const INTERNAL_DETAIL = 'An unexpected error occurred.';

/**
 * @typedef {{ pointer: string, detail: string }} FieldError
 */

/**
 * Build a problem details body.
 *
 * @param {ProblemKind} kind
 * @param {string} detail one sentence about this occurrence
 * @param {{ errors?: FieldError[] }} [options]
 * @returns {{ status: number, body: Record<string, unknown> }}
 */
export function problem(kind, detail, { errors } = {}) {
  const spec = PROBLEMS[kind];

  /** @type {Record<string, unknown>} */
  const body = {
    type: `${PROBLEM_BASE}${spec.slug}`,
    title: spec.title,
    status: spec.status,
    detail,
  };
  if (kind === 'validation' && errors !== undefined) {
    body.errors = errors;
  }

  return { status: spec.status, body };
}

/**
 * Send a problem details response.
 *
 * Adds the headers the contract requires on some errors: `WWW-Authenticate`
 * on 401 and `Allow` on 405.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {ProblemKind} kind
 * @param {string} detail
 * @param {{ errors?: FieldError[] }} [options]
 * @returns {void}
 */
export function sendProblem(res, kind, detail, options) {
  const { status, body } = problem(kind, detail, options);

  /** @type {Record<string, string>} */
  const headers = { 'content-type': 'application/problem+json; charset=utf-8' };
  if (status === 401) headers['www-authenticate'] = 'Bearer';
  if (status === 405) headers.allow = 'POST';

  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}
