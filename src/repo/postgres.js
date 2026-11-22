/**
 * Postgres access for LeeTKOB (PA#3): a pg pool behind the small `Db`
 * interface in `./db.js`, so the queue code runs the same against Neon and
 * against the in-process pglite used by `npm test`.
 */

import pg from 'pg';

/**
 * @param {string} connectionString e.g. Neon's `postgresql://...?sslmode=require`
 * @param {{ max?: number }} [options]
 * @returns {import('./db.js').Db & { close: () => Promise<void> }}
 */
export function createPostgresDb(connectionString, { max = 5 } = {}) {
  if (!connectionString) throw new Error('createPostgresDb: DATABASE_URL is not set');
  const pool = new pg.Pool({ connectionString, max });

  return {
    query: async (text, params) => pool.query(text, params),
    exec: async (text) => pool.query(text),
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          query: async (text, params) => client.query(text, params),
          exec: async (text) => client.query(text),
        });
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: async () => pool.end(),
  };
}
