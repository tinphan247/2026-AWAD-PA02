/**
 * Cookies, HTML forms and `multipart/form-data` for the PA#3 web flow.
 *
 * The session is a bearer token in an `HttpOnly` cookie. That is enough for a
 * same-site server-rendered UI and keeps the PA#2 token model unchanged.
 */

import { readBody } from '../http/body.js';

export const SESSION_COOKIE = 'leetkob_session';
const DEFAULT_FORM_LIMIT = 8 * 1024 * 1024;

/**
 * @param {string | undefined} header
 * @returns {Record<string, string>}
 */
export function parseCookies(header) {
  /** @type {Record<string, string>} */
  const cookies = {};
  if (typeof header !== 'string') return cookies;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name.length > 0) cookies[name] = decodeURIComponent(value);
  }

  return cookies;
}

/**
 * @param {string} name
 * @param {string} value
 * @param {{ maxAgeSeconds?: number }} [options]
 * @returns {string}
 */
export function serializeCookie(name, value, { maxAgeSeconds = 60 * 60 * 12 } = {}) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

/** @param {string} name @returns {string} */
export function clearCookie(name) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/**
 * @typedef {{ name: string, filename: string, content: Buffer }} UploadedFile
 * @typedef {{ fields: Record<string, string>, files: UploadedFile[], tooLarge: boolean }} FormData
 */

/**
 * @param {string} header
 * @returns {string | null}
 */
function boundaryOf(header) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(header);
  if (match === null) return null;
  return (match[1] ?? match[2] ?? '').trim();
}

/**
 * @param {string} headerText
 * @returns {Record<string, string>}
 */
function parsePartHeaders(headerText) {
  /** @type {Record<string, string>} */
  const headers = {};
  for (const line of headerText.split('\r\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }
  return headers;
}

/**
 * @param {Buffer} bytes
 * @param {string} boundary
 * @returns {FormData}
 */
export function parseMultipart(bytes, boundary) {
  /** @type {Record<string, string>} */
  const fields = {};
  /** @type {UploadedFile[]} */
  const files = [];

  const delimiter = Buffer.from(`\r\n--${boundary}`);
  const data = Buffer.concat([Buffer.from('\r\n'), bytes]);

  let cursor = data.indexOf(delimiter);
  while (cursor !== -1) {
    const afterDelimiter = cursor + delimiter.length;
    if (data.slice(afterDelimiter, afterDelimiter + 2).toString('latin1') === '--') break;

    const headerStart = afterDelimiter + 2;
    const headerEnd = data.indexOf('\r\n\r\n', headerStart);
    if (headerEnd === -1) break;

    const headers = parsePartHeaders(data.slice(headerStart, headerEnd).toString('utf8'));
    const bodyStart = headerEnd + 4;
    const next = data.indexOf(delimiter, bodyStart);
    const bodyEnd = next === -1 ? data.length : next;
    const body = data.slice(bodyStart, bodyEnd);

    const disposition = headers['content-disposition'] ?? '';
    const nameMatch = /name="([^"]*)"/.exec(disposition);
    const filenameMatch = /filename="([^"]*)"/.exec(disposition);
    const name = nameMatch?.[1] ?? '';

    if (name.length > 0) {
      if (filenameMatch !== null && (filenameMatch[1] ?? '').length > 0) {
        files.push({ name, filename: filenameMatch[1] ?? '', content: body });
      } else {
        fields[name] = body.toString('utf8');
      }
    }

    cursor = next;
  }

  return { fields, files, tooLarge: false };
}

/**
 * Read an HTML form. JSON is not accepted here: the UI posts forms, the API
 * keeps its JSON contract.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {number} [limitBytes]
 * @returns {Promise<FormData>}
 */
export async function readForm(req, limitBytes = DEFAULT_FORM_LIMIT) {
  const { bytes, tooLarge } = await readBody(req, limitBytes);
  if (tooLarge || bytes === null) return { fields: {}, files: [], tooLarge: true };

  const contentType = String(req.headers['content-type'] ?? '');

  if (/^multipart\/form-data/i.test(contentType)) {
    const boundary = boundaryOf(contentType);
    if (boundary === null) return { fields: {}, files: [], tooLarge: false };
    return parseMultipart(bytes, boundary);
  }

  if (/^application\/x-www-form-urlencoded/i.test(contentType)) {
    /** @type {Record<string, string>} */
    const fields = {};
    for (const [name, value] of new URLSearchParams(bytes.toString('utf8'))) {
      fields[name] = value;
    }
    return { fields, files: [], tooLarge: false };
  }

  return { fields: {}, files: [], tooLarge: false };
}
