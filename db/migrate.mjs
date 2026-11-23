// Apply pending migrations to the database in DATABASE_URL (e.g. Neon):
//   DATABASE_URL='postgresql://...?sslmode=require' node db/migrate.mjs
import { migrate } from '../src/repo/migrate.js';
import { createPostgresDb } from '../src/repo/postgres.js';

const db = createPostgresDb(process.env.DATABASE_URL ?? '');
try {
  const applied = await migrate(db);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
} finally {
  await db.close();
}
