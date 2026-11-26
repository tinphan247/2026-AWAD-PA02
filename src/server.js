import { createServer } from 'node:http';

import { createApp } from './app.js';

/**
 * Start the HTTP server on an ephemeral port by default.
 *
 * @param {{ port?: number, host?: string, webStore?: any }} [options]
 * @returns {Promise<{ server: import('node:http').Server, url: string }>}
 */
export function startServer({ port = 0, host = '127.0.0.1', webStore } = {}) {
  const server = createServer(createApp({ webStore }).handler);

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();

      if (address === null || typeof address === 'string') {
        reject(new Error('Unexpected server address'));
        return;
      }

      resolve({ server, url: `http://${host}:${address.port}` });
    });
  });
}
