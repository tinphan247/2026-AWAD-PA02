/**
 * POST /v1/labs/{labId}/submissions — the twelve checks of contract §5.4.
 *
 * The order of the checks matters and is the order in this file. A request
 * that fails a step gets that step's error even if a later step would also
 * fail.
 */

import { hasJsonContentType, isExpired, parseBearerToken, parseLabId } from '../auth.js';
import { readBody } from '../http/body.js';
import { sendProblem } from '../http/problem.js';

const KiB = 1024;
/** Contract §5.4 step 6. */
export const MAX_BODY_BYTES = 128 * KiB;
/** Contract §5.3. */
export const MAX_SOURCE_BYTES = 64 * KiB;
/** Contract §5.2. */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

/** @typedef {ReturnType<typeof import('../repo/memory.js').createMemoryRepo>} Repo */

/**
 * @typedef {{ studentId: number, labId: number, key: string }} CreateContext
 * @typedef {{ beforeCreate?: (ctx: CreateContext) => Promise<void> | void }} Hooks
 * @typedef {{ now: () => Date }} Clock
 */

/**
 * Send a JSON response.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @param {Record<string, string>} [extraHeaders]
 * @returns {void}
 */
function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

/**
 * Canonical JSON: object keys sorted recursively, so key order and whitespace
 * in the original request do not change the fingerprint (contract §6).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;

  const record = /** @type {Record<string, unknown>} */ (value);
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

/**
 * The identity of a request for idempotency: the whole body plus `labId`.
 *
 * Unknown fields stay in the fingerprint on purpose (contract §6).
 *
 * @param {number} labId
 * @param {unknown} body
 * @returns {string}
 */
export function fingerprintRequest(labId, body) {
  return `${labId}\n${canonicalJson(body)}`;
}

/**
 * Validate a parsed JSON body (contract §5.3). Returns every problem found.
 *
 * @param {unknown} body
 * @returns {import('../http/problem.js').FieldError[]}
 */
export function validateBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return [{ pointer: '', detail: 'must be a JSON object' }];
  }

  const record = /** @type {Record<string, unknown>} */ (body);
  const sourceCode = record.sourceCode;

  if (typeof sourceCode !== 'string') {
    return [{ pointer: '/sourceCode', detail: 'is required and must be a string' }];
  }
  if (sourceCode.trim().length === 0) {
    return [{ pointer: '/sourceCode', detail: 'must not be empty or only whitespace' }];
  }
  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_BYTES) {
    return [{ pointer: '/sourceCode', detail: 'must be at most 65,536 bytes of UTF-8' }];
  }

  return [];
}

/**
 * Handle a request whose path matched `POST /v1/labs/{labId}/submissions`.
 *
 * The caller has already checked the route and the method (step 1).
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {{ repo: Repo, hooks: Hooks, clock: Clock, labIdRaw: string }} deps
 * @returns {Promise<void>}
 */
export async function handleSubmission(req, res, { repo, hooks, clock, labIdRaw }) {
  // Step 2 — authentication.
  const token = parseBearerToken(req.headers.authorization);
  const tokenRecord = token === null ? null : repo.findToken(token);
  if (tokenRecord === null || isExpired(tokenRecord, clock.now().getTime())) {
    sendProblem(res, 'unauthorized', 'A valid bearer token is required.');
    return;
  }

  const user = repo.findUser(tokenRecord.userId);
  if (user === null) {
    sendProblem(res, 'unauthorized', 'A valid bearer token is required.');
    return;
  }

  // Step 3 — role.
  if (user.role !== 'student') {
    sendProblem(res, 'forbidden', 'Only a student may create a submission.');
    return;
  }

  // Step 4 — content type.
  if (!hasJsonContentType(req.headers['content-type'])) {
    sendProblem(res, 'unsupported-media-type', 'Content-Type must be application/json.');
    return;
  }

  // Step 5 — idempotency key.
  const idempotencyKey = req.headers['idempotency-key'];
  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.trim().length === 0 ||
    idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    sendProblem(
      res,
      'idempotency-key-missing',
      'An Idempotency-Key header of 1 to 255 characters is required.',
    );
    return;
  }

  // Step 6 — size.
  const { bytes, tooLarge } = await readBody(req, MAX_BODY_BYTES);
  if (tooLarge || bytes === null) {
    sendProblem(res, 'payload-too-large', 'The request body is larger than 128 KiB.');
    return;
  }

  // Step 7 — JSON.
  let body;
  try {
    body = JSON.parse(bytes.toString('utf8'));
  } catch {
    sendProblem(res, 'invalid-json', 'The request body is not valid JSON.');
    return;
  }

  // Step 8 — lab.
  const labId = parseLabId(labIdRaw);
  const lab = labId === null ? null : repo.findLab(labId);
  if (labId === null || lab === null) {
    sendProblem(res, 'not-found', 'No lab with this id exists.');
    return;
  }

  // Step 9 — ownership. DELIBERATE CONTRACT BREAK (PA2 evidence): the
  // enrollment check is removed so CI goes red. Do not merge.

  // Step 10 — idempotency. The key is reserved before validation, so a
  // concurrent retry sees it in flight.
  const fingerprint = fingerprintRequest(labId, body);
  const beginning = repo.beginIdempotent(user.id, idempotencyKey, fingerprint, clock.now());
  if (beginning.kind === 'in-flight') {
    sendProblem(
      res,
      'idempotency-key-in-flight',
      'A request with this Idempotency-Key is still being processed. Retry later.',
    );
    return;
  }
  if (beginning.kind === 'reused') {
    sendProblem(
      res,
      'idempotency-key-reused',
      'This Idempotency-Key was already used with a different request.',
    );
    return;
  }
  if (beginning.kind === 'replay') {
    sendJson(res, 201, beginning.submission, { 'idempotent-replayed': 'true' });
    return;
  }

  // Step 11 — validation. A failed request stores nothing, so free the key.
  const errors = validateBody(body);
  if (errors.length > 0) {
    repo.releaseIdempotent(user.id, idempotencyKey);
    sendProblem(res, 'validation', '1 field is invalid', { errors });
    return;
  }

  // The seam's hook runs after the key is reserved and before the store; it
  // never runs for a replay, a 409 or a 422.
  try {
    await hooks.beforeCreate?.({ studentId: user.id, labId, key: idempotencyKey });
  } catch (error) {
    repo.releaseIdempotent(user.id, idempotencyKey);
    throw error;
  }

  // Step 12 — create.
  try {
    const submission = repo.createSubmission({
      labId,
      studentId: user.id,
      submittedAt: clock.now().toISOString(),
    });
    repo.completeIdempotent(user.id, idempotencyKey, submission);
    sendJson(res, 201, submission);
  } catch (error) {
    repo.releaseIdempotent(user.id, idempotencyKey);
    throw error;
  }
}
