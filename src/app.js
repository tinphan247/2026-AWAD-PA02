/**
 * Send a JSON response.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @returns {void}
 */
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(payload);
}

/**
 * Create the PA#2 HTTP application.
 *
 * This is a deliberately small walking skeleton: only the health route exists
 * until the contract for POST /v1/labs/{labId}/submissions is frozen.
 *
 * @returns {import('node:http').RequestListener}
 */
export function createApp() {
  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  };
}
