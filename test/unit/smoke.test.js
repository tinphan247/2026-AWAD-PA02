import assert from 'node:assert/strict';
import test from 'node:test';

import { startServer } from '../../src/server.js';

test('GET /health returns ok', async () => {
  const { server, url } = await startServer();

  try {
    const res = await fetch(`${url}/health`);

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(undefined);
      });
    });
  }
});
