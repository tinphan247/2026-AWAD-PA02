import { readdir, readFile } from 'node:fs/promises';

const MIGRATIONS_DIR = new URL('../../db/migrations/', import.meta.url);

/**
 * Apply every `db/migrations/NNN_*.sql` file not yet recorded in
 * `schema_migrations`, in name order, each inside its own transaction.
 *
 * @param {import('./db.js').Db} db
 * @param {{ dir?: URL }} [options]
 * @returns {Promise<string[]>} the names applied by this call
 */
export async function migrate(db, { dir = MIGRATIONS_DIR } = {}) {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  const { rows } = await db.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((row) => row.name));
  const files = (await readdir(dir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();

  /** @type {string[]} */
  const applied = [];
  for (const name of files) {
    if (done.has(name)) continue;
    const sql = await readFile(new URL(name, dir), 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    });
    applied.push(name);
  }
  return applied;
}
