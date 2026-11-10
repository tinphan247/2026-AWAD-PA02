/**
 * Header and path helpers for the submissions endpoint.
 *
 * Contract: docs/contract/post-labs-labId-submissions.md §3, §5.1, §5.2.
 */

/** @typedef {{ expiresAt: string, userId: number }} TokenRecord */

/**
 * Extract the token from an `Authorization: Bearer <token>` header.
 *
 * The scheme is case-insensitive. Anything other than exactly one non-empty
 * token after `Bearer` yields `null`, which the caller answers with 401.
 *
 * @param {string | string[] | undefined} header
 * @returns {string | null}
 */
export function parseBearerToken(header) {
  if (typeof header !== 'string') return null;

  const match = /^\s*Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

/**
 * Whether a token record is expired at `nowMs`.
 *
 * A token without a parseable expiry is treated as expired.
 *
 * @param {TokenRecord} record
 * @param {number} nowMs
 * @returns {boolean}
 */
export function isExpired(record, nowMs) {
  const expiresAt = Date.parse(record.expiresAt);
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt <= nowMs;
}

/**
 * Whether `Content-Type` has the media type `application/json`.
 *
 * Parameters such as `charset=utf-8` are allowed and the media type is
 * compared case-insensitively.
 *
 * @param {string | string[] | undefined} header
 * @returns {boolean}
 */
export function hasJsonContentType(header) {
  if (typeof header !== 'string') return false;

  const [mediaType = ''] = header.split(';');
  return mediaType.trim().toLowerCase() === 'application/json';
}

/**
 * Parse the `{labId}` path segment (contract §5.1).
 *
 * @param {string} raw
 * @returns {number | null} the id, or null when the segment is not a lab id
 */
export function parseLabId(raw) {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
