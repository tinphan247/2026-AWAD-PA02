/**
 * The PA#2 HTTP application.
 *
 * `createApp()` is the seam the contract tests use:
 *
 *   createApp({ seed, repo?, hooks: { beforeCreate }, clock })
 *     → { handler, testing }
 *
 * See the comment at the top of test/contract/helpers.js.
 */

import { handleSubmission } from './domain/submissions.js';
import { INTERNAL_DETAIL, sendProblem } from './http/problem.js';
import { createMemoryRepo } from './repo/memory.js';

const SUBMISSIONS_ROUTE = /^\/v1\/labs\/([^/]+)\/submissions$/;

/**
 * Send a plain JSON response (non-`/v1` paths only).
 *
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @returns {void}
 */
function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/**
 * Create the PA#2 HTTP application.
 *
 * @param {{
 *   seed?: import('./repo/memory.js').Seed,
 *   repo?: ReturnType<typeof createMemoryRepo>,
 *   hooks?: import('./domain/submissions.js').Hooks,
 *   clock?: import('./domain/submissions.js').Clock,
 * }} [options]
 * @returns {{
 *   handler: import('node:http').RequestListener,
 *   testing: {
 *     submissionCount: (filter?: { studentId?: number, labId?: number }) => number,
 *     failNextCreate: () => void,
 *     unenroll: (studentId: number, classId: number) => void,
 *     expireToken: (token: string) => void,
 *   },
 * }}
 */
export function createApp({ seed, repo, hooks = {}, clock } = {}) {
  const store = repo ?? createMemoryRepo({ seed });
  const serverClock = clock ?? { now: () => new Date() };

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @returns {Promise<void>}
   */
  async function route(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    // Step 1 — route and method, before authentication.
    const match = SUBMISSIONS_ROUTE.exec(pathname);
    if (match !== null) {
      if (req.method !== 'POST') {
        sendProblem(res, 'method-not-allowed', 'This path only supports POST.');
        return;
      }

      await handleSubmission(req, res, {
        repo: store,
        hooks,
        clock: serverClock,
        labIdRaw: match[1] ?? '',
      });
      return;
    }

    if (pathname === '/v1' || pathname.startsWith('/v1/')) {
      sendProblem(res, 'not-found', 'No such endpoint.');
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  }

  /** @type {import('node:http').RequestListener} */
  const handler = (req, res) => {
    route(req, res).catch(() => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      sendProblem(res, 'internal', INTERNAL_DETAIL);
    });
  };

  return {
    handler,
    testing: {
      submissionCount: (filter) => store.countSubmissions(filter),
      failNextCreate: () => store.failNextCreate(),
      unenroll: (studentId, classId) => store.unenroll(studentId, classId),
      expireToken: (token) => store.expireToken(token),
    },
  };
}
